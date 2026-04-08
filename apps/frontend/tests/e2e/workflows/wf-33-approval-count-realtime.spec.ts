/**
 * WF-33: SSE/실시간 갱신 (다탭) — docs/workflows/critical-workflows.md L821-833
 *
 * 문서 기반 시나리오:
 *   Step 1: TM 탭A /admin/approvals — 대기 카운트 N 캡처
 *   Step 2: TM 탭B /admin/approvals (같은 페이지, 다른 탭) — 같은 대기 카운트 N
 *   Step 3: 탭A 에서 1건 "승인" 클릭 → 토스트 + 카운트 N-1
 *   Step 4: 탭B 자동 갱신 (SSE approval-changed) → 카운트 N-1
 *   (Step 5 bell 카운트 +1 은 별도 notification 트리거가 필요해 본 spec 에서 제외)
 *
 * 실시간 파이프라인:
 *   탭A "승인" 클릭 → approvalsApi.approve() → backend
 *     → ApprovalSseListener.handleApprovalChanged()
 *     → NotificationSseService.broadcastApprovalChanged()
 *     → 연결된 모든 SSE 클라이언트(탭A + 탭B) 에 title: SSE_APPROVAL_CHANGED_SENTINEL 전송
 *     → useNotificationStream 이 countsAll prefix 무효화
 *     → REFETCH_STRATEGIES.SSE_BACKED(approval counts) refetch
 *     → 두 탭 KPI "전체 대기" 카드 자동 감소
 *
 * 설계 메모:
 * - 두 페이지는 **같은 BrowserContext** (storageState 공유, 동일 사용자) — 각 페이지가
 *   독립 SSE 연결을 수립한다.
 * - 승인은 **문서 지시대로 UI 클릭** ("상세 보기" → "승인"). 플레이키함 억제를 위해
 *   PATCH 응답을 `waitForResponse` 로 명시적으로 기다린다.
 * - Tab B 의 refetch 는 SSE 푸시에 의해서만 가능하도록 폴링 주기가 10분(SSE_BACKED)
 *   이므로, 15s window 내 감소 = SSE 증명.
 *
 * @see docs/workflows/critical-workflows.md WF-33
 * @see apps/frontend/hooks/use-notification-stream.ts
 * @see apps/backend/src/modules/approvals/approval-sse.listener.ts
 */

import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
import {
  waitForApprovalListOrEmpty,
  cleanupApprovalPool,
} from '../shared/helpers/approval-helpers';
import { clearBackendCache } from '../shared/helpers/api-helpers';

async function readPendingCount(page: Page): Promise<number> {
  const card = page.getByRole('group', { name: '전체 대기' });
  await expect(card).toBeVisible({ timeout: 10000 });
  const text = (await card.textContent()) ?? '';
  const match = text.match(/(\d+)/);
  if (!match) throw new Error(`전체 대기 카운트 파싱 실패: "${text}"`);
  return Number(match[1]);
}

async function gotoApprovalsOutgoingReady(page: Page) {
  await page.goto('/admin/approvals?tab=outgoing');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
    timeout: 15000,
  });
  // KPI 스켈레톤 소멸 대기
  await expect(page.getByRole('group', { name: '전체 대기' }).locator('.h-8.w-14')).not.toBeVisible(
    { timeout: 10000 }
  );
}

test.describe('WF-33: 다탭 승인 카운트 SSE 실시간 동기화', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await cleanupApprovalPool();
  });

  test('탭A 승인 클릭 → 토스트 + 탭A 카운트 감소 + 탭B SSE 자동 감소', async ({
    techManagerPage: pageA,
  }) => {
    await clearBackendCache();

    // Step 1-2: 탭A + 탭B 동시 열람 (같은 BrowserContext → 독립 SSE 연결)
    const pageB = await pageA.context().newPage();

    try {
      await gotoApprovalsOutgoingReady(pageA);
      await gotoApprovalsOutgoingReady(pageB);

      const initialA = await readPendingCount(pageA);
      const initialB = await readPendingCount(pageB);
      expect(initialA).toBe(initialB);
      expect(initialA).toBeGreaterThan(0);

      // 탭B SSE 연결 안정화 대기
      await pageA.waitForTimeout(1000);

      // 탭A 승인 대상 존재 확인 (seed 에 outgoing pending 이 있어야 함)
      const hasData = await waitForApprovalListOrEmpty(pageA);
      if (!hasData) {
        test.skip();
        return;
      }

      // Step 3: 탭A 에서 승인 가능한 첫 항목을 찾아 "상세 보기" → "승인" 클릭.
      // 목록에는 TM 의 site scope 를 벗어난 cross-site 항목이 혼합 노출될 수 있어
      // (SCOPE_ACCESS_DENIED 403), 승인 PATCH 가 2xx 로 돌아올 때까지 최대 N 건 순회.
      const items = pageA.locator('[data-testid="approval-item"]');
      const maxAttempts = Math.min(await items.count(), 8);
      expect(maxAttempts, '탭A 에 승인 시도할 pending 항목이 있어야 함').toBeGreaterThan(0);

      let approved = false;
      let lastError = '';
      for (let i = 0; i < maxAttempts; i++) {
        // i 번째 항목 시도 — 실패 시 DOM 은 그대로이므로 인덱스를 진행해야 다음 항목 도달
        const currentItem = pageA.locator('[data-testid="approval-item"]').nth(i);
        await currentItem.getByRole('button', { name: /상세 보기/ }).click();

        const dialog = pageA.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        const approveResponsePromise = pageA.waitForResponse(
          (res) =>
            /\/api\/(checkouts|approvals)\/.+\/approve/.test(res.url()) &&
            res.request().method() === 'PATCH',
          { timeout: 10000 }
        );
        await dialog.getByRole('button', { name: '승인' }).click();
        const approveResponse = await approveResponsePromise;

        if (approveResponse.ok()) {
          approved = true;
          break;
        }
        lastError = `${approveResponse.status()} ${approveResponse.url()}`;
        // 실패 시 다이얼로그 닫고 다음 항목으로 — 에러 토스트 닫힘 대기
        await pageA.keyboard.press('Escape');
        await pageA.waitForTimeout(500);
      }
      expect(approved, `${maxAttempts} 건 모두 승인 실패: ${lastError}`).toBeTruthy();

      // Step 3 검증: 탭A 카운트 N-1 (useOptimisticMutation.invalidateKeys)
      await expect
        .poll(() => readPendingCount(pageA), {
          timeout: 10000,
          intervals: [300, 500, 1000, 1000],
          message: '탭A 로컬 invalidate 후 KPI 가 감소해야 함',
        })
        .toBeLessThan(initialA);

      // Step 4 검증: 탭B SSE 푸시 기반 자동 감소 (15초 window = SSE 증명)
      await expect
        .poll(() => readPendingCount(pageB), {
          timeout: 15000,
          intervals: [500, 1000, 1000, 1000, 2000],
          message: '탭B 가 SSE approval-changed 이벤트로 자동 갱신되어야 함 (폴링 주기 10분)',
        })
        .toBeLessThan(initialB);
    } finally {
      await pageB.close();
    }
  });
});
