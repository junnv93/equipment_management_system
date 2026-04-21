/**
 * WF-35: CAS 충돌 프론트엔드 UI 복구 E2E (다탭 시뮬레이션)
 *
 * 백엔드 CAS 검증은 features/non-conformances/comprehensive/s35-cas-cache.spec.ts 및
 * features/approvals/comprehensive/10-cas-version-conflict.spec.ts 가 cover하지만,
 * **프론트엔드 사용자 동선** — 다탭 동시 편집 → 한국어 토스트 → 자동 refetch → 재시도 성공
 * 은 verify된 spec 으로 cover되지 않는다. 이 spec 이 그 gap 을 메운다.
 *
 * 타겟: NC_001 (open, malfunction) 의 saveMutation(correctionContent 저장).
 *  - 상태 변경 없음 → 재실행 시 시드 복원 불필요
 *  - NCDetailClient.tsx:169 useOptimisticMutation VERSION_CONFLICT 공통 핸들러 검증
 *  - 409 발생 시 saveMutation.onSuccessCallback 은 실행되지 않으므로 editingCorrection=true 유지
 *    → textarea 가 열린 채로 refetch 완료 후 "저장" 재클릭으로 성공 복구
 *
 * @see docs/workflows/critical-workflows.md WF-35
 */

import { test, expect, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { TEST_NC_IDS, BASE_URLS } from '../shared/constants/shared-test-data';
import { expectToastVisible } from '../shared/helpers/toast-helpers';

const TM_STORAGE_STATE = path.join(__dirname, '../.auth/technical-manager.json');
const NC_ID = TEST_NC_IDS.NC_001_MALFUNCTION_OPEN;

/** 역할 TM 의 storageState 로 새 context+page 생성 */
async function openAuthenticatedPage(
  browser: import('@playwright/test').Browser
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    baseURL: BASE_URLS.FRONTEND,
    storageState: TM_STORAGE_STATE,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  return { context, page };
}

async function gotoNcDetail(page: Page, ncId: string) {
  await page.goto(`/non-conformances/${ncId}`);
  await expect(page.getByRole('heading', { name: '부적합 상세' })).toBeVisible({ timeout: 15000 });
}

/**
 * 시정 조치 섹션의 "편집" 버튼만 매칭 (header 의 "수정" 버튼과 구분).
 * CollapsibleSection 의 edit 버튼은 canEdit=true (open 상태) 일 때만 렌더됨.
 */
async function startCorrectionEdit(page: Page) {
  const editButton = page.getByRole('button', { name: '편집', exact: true });
  await editButton.click();
  const textarea = page.getByRole('textbox').first();
  await expect(textarea).toBeVisible({ timeout: 5000 });
  return textarea;
}

async function fillAndSave(page: Page, textarea: ReturnType<Page['getByRole']>, content: string) {
  await textarea.fill(content);
  await page.getByRole('button', { name: '저장', exact: true }).click();
}

// 다탭 CAS 는 엔진 무관 로직이므로 chromium 외 프로젝트에서는 스킵 (중복 비용 회피)
test.describe('WF-35: CAS 충돌 UI 복구 (다탭 시뮬레이션)', () => {
  test.describe.configure({ mode: 'serial' });

  test('다탭 동시 편집 → 페이지B 409 토스트 → refetch → 재시도 성공', async ({ browser }) => {
    const projectName = test.info().project.name.toLowerCase();
    test.skip(
      !projectName.includes('chromium'),
      'WF-35 다탭 CAS 는 chromium 에서만 실행 (엔진 무관 로직)'
    );
    test.setTimeout(120_000);

    const a = await openAuthenticatedPage(browser);
    const b = await openAuthenticatedPage(browser);
    const pageA = a.page;
    const pageB = b.page;

    try {
      // Step 1: 양쪽 페이지 모두 NC 상세 진입 (같은 version 스냅샷 로드)
      await gotoNcDetail(pageA, NC_ID);
      await gotoNcDetail(pageB, NC_ID);

      const stamp = Date.now();

      // Step 2: 페이지 A → 조치 편집 → 저장 (version +1)
      const textareaA = await startCorrectionEdit(pageA);
      await fillAndSave(pageA, textareaA, `WF-35 페이지A 저장 ${stamp}`);

      // 페이지 A: 저장된 내용이 paragraph 로 표시되면 성공 (editingCorrection→false)
      await expect(pageA.getByText(`WF-35 페이지A 저장 ${stamp}`)).toBeVisible({
        timeout: 10_000,
      });

      // Step 3: 페이지 B → 편집 + 저장 (stale version 사용 → 409 기대)
      const textareaB = await startCorrectionEdit(pageB);
      await fillAndSave(pageB, textareaB, `WF-35 페이지B 저장 ${stamp}`);

      // Step 4: 페이지 B 에서 VERSION_CONFLICT 한국어 토스트 검증
      // ko/errors.json VERSION_CONFLICT:
      //   title: "데이터 충돌"
      //   message: "다른 사용자가 이 데이터를 수정했습니다. 최신 데이터를 불러옵니다."
      await expectToastVisible(pageB, /데이터 충돌|다른 사용자가 이 데이터를 수정했습니다/, {
        timeout: 10_000,
      });

      // Step 5: onSettled 의 invalidateQueries 가 detail 재조회 → nc.version 최신화 대기
      //   waitForTimeout 대신 GET /non-conformances/:id 가 200 으로 완료되는 시점을 polling 하여
      //   결정성 확보 (HMR polling 영향 없음).
      const ncDetailUrl = API_ENDPOINTS.NON_CONFORMANCES.GET(NC_ID);
      await pageB.waitForResponse(
        (resp) =>
          resp.url().endsWith(ncDetailUrl) &&
          resp.request().method() === 'GET' &&
          resp.status() === 200,
        { timeout: 10_000 }
      );

      // Step 6: 페이지 B 재시도 — 409 에러 경로는 editingCorrection 을 리셋하지 않으므로
      //   textarea 가 여전히 열려 있음. "저장" 만 다시 클릭하면 최신 version 으로 PATCH.
      await page_B_retry(pageB);

      // 페이지 B: 최종 저장 내용이 paragraph 로 표시되면 성공 (editingCorrection→false 로 전환됨)
      await expect(pageB.getByText(`WF-35 페이지B 저장 ${stamp}`)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await a.context.close();
      await b.context.close();
    }
  });
});

async function page_B_retry(pageB: Page) {
  await pageB.getByRole('button', { name: '저장', exact: true }).click();
}
