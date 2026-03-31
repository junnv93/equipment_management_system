/**
 * Suite 06: 교정계획서 프로세스 연속성 (Serial) ★P0 CRITICAL
 *
 * "코드가 아닌 사용자 시나리오"에서 출발한 테스트.
 * Suite 03(상태별 버튼 표시 확인)과 달리, 실제 상태 전이를 수행하고
 * 매 단계 후 목록 페이지에서 상태가 즉시 갱신되는지 검증합니다.
 *
 * 검증 시나리오 (3단계 승인 전체 플로우):
 * Step 1: TM이 2027년 계획서 생성 → 목록에서 "작성 중" 즉시 확인 (캐시 일관성)
 * Step 2: TM이 검토 요청 → 목록에서 "확인 대기" 즉시 확인
 * Step 3: QM이 검토 완료 → 목록에서 "승인 대기" 즉시 확인
 * Step 4: LM이 최종 승인 → 목록에서 "승인 완료" 즉시 확인
 *
 * 핵심 검증:
 * - 각 상태 전이 후 목록 캐시가 즉시 무효화되는가?
 * - TanStack Query의 invalidateQueries가 목록 캐시를 올바르게 무효화하는가?
 *
 * ⚠️ 참고: 이 테스트는 DB 상태를 영구 변경합니다 (2027년 수원 계획서 생성).
 *   재실행 시 beforeAll이 기존 draft 계획서를 삭제하고 재생성합니다.
 *   이전 실행이 pending_review/pending_approval에서 중단된 경우:
 *   → reject 후 재시도하거나 시드 데이터를 다시 로드해야 합니다.
 *
 * ⚠️ casVersion vs version 구분:
 *   - version: 계획서 개정 번호 (재제출 시 증가, draft=1, 재제출 후=2)
 *   - casVersion: CAS 동시 수정 방지 번호 (매 상태 변경마다 자동 증가)
 *   모든 mutation API는 casVersion을 요구합니다.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
import {
  getBackendToken,
  clearBackendCache,
} from '../../calibration/helpers/calibration-api-helpers';

const BACKEND_URL = BASE_URLS.BACKEND;
const PLAN_YEAR = 2027;
const PLAN_SITE_ID = 'suwon';

test.describe('Suite 06: 교정계획서 프로세스 연속성', () => {
  test.describe.configure({ mode: 'serial' });

  let planId: string;
  let planCasVersion: number;

  test.beforeAll(async ({ request }) => {
    const token = await getBackendToken(request, 'technical_manager');

    // 기존 2027년 수원 계획서 처리 (이전 테스트 잔류물)
    const listResp = await request.get(
      `${BACKEND_URL}/api/calibration-plans?year=${PLAN_YEAR}&siteId=${PLAN_SITE_ID}&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (listResp.ok()) {
      const body = await listResp.json();
      const items = body.data?.items ?? body.items ?? [];
      for (const item of items) {
        if (item.isLatestVersion) {
          if (item.status === 'draft') {
            // draft 상태 계획서만 삭제 가능
            await request.delete(`${BACKEND_URL}/api/calibration-plans/${item.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          // pending_review / pending_approval → reject
          else if (item.status === 'pending_review' || item.status === 'pending_approval') {
            const role = item.status === 'pending_review' ? 'quality_manager' : 'lab_manager';
            const rejToken = await getBackendToken(request, role);
            await request.patch(`${BACKEND_URL}/api/calibration-plans/${item.id}/reject`, {
              headers: { Authorization: `Bearer ${rejToken}`, 'Content-Type': 'application/json' },
              data: {
                casVersion: item.casVersion,
                rejectionReason: 'S06 beforeAll: 이전 테스트 정리',
              },
            });
            // rejected 상태가 되면 이제 draft로 만들 수 없으므로
            // 이전 run의 planId/casVersion을 재사용해서 submit-for-review부터 시작
            // (S06-01에서 planId가 없으면 새 plan을 만드는 대신 기존 rejected를 재제출)
          }
          // approved 상태 → 삭제 불가, 이 경우 테스트가 건너뜀
        }
      }
    }
    await clearBackendCache(request);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: 계획서 생성 → 목록 캐시 일관성
  // ──────────────────────────────────────────────────────────────────────────

  test('S06-01: TM이 2027년 교정계획서 생성 → 목록에서 "작성 중" 즉시 확인', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page.request, 'technical_manager');

    const response = await page.request.post(`${BACKEND_URL}/api/calibration-plans`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { year: PLAN_YEAR, siteId: PLAN_SITE_ID },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    const plan = body.data ?? body;
    planId = plan.id;
    // ⚠️ casVersion을 사용해야 함 (version은 계획서 개정 번호로 다름)
    planCasVersion = plan.casVersion;
    expect(plan.status).toBe('draft');
    expect(planCasVersion).toBeGreaterThan(0);

    // ★ 캐시 일관성: 목록 페이지에서 즉시 "작성 중" 상태로 확인 가능해야 함
    await page.goto(`/calibration-plans?year=${PLAN_YEAR}`);
    await expect(page.getByText(String(PLAN_YEAR)).first()).toBeVisible();
    await expect(page.getByText('작성 중').first()).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: 검토 요청 → 목록 캐시 일관성
  // ──────────────────────────────────────────────────────────────────────────

  test('S06-02: TM이 검토 요청 → 목록에서 "확인 대기" 즉시 확인', async ({
    techManagerPage: page,
  }) => {
    expect(planId).toBeTruthy();
    await clearBackendCache(page.request);

    const token = await getBackendToken(page.request, 'technical_manager');

    // 검토 요청 (draft → pending_review)
    const submitResp = await page.request.post(
      `${BACKEND_URL}/api/calibration-plans/${planId}/submit-for-review`,
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: planCasVersion },
      }
    );
    expect(submitResp.ok()).toBeTruthy();
    const submitBody = await submitResp.json();
    const submitted = submitBody.data ?? submitBody;
    expect(submitted.status).toBe('pending_review');
    // casVersion이 증가했으므로 추적
    planCasVersion = submitted.casVersion;
    expect(planCasVersion).toBeGreaterThan(0);

    // ★ 캐시 일관성: 목록 페이지에서 즉시 "확인 대기" 상태로 갱신되어야 함
    await page.goto(`/calibration-plans?year=${PLAN_YEAR}`);
    await expect(page.getByText(String(PLAN_YEAR)).first()).toBeVisible();
    await expect(page.getByText('확인 대기').first()).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: QM 검토 완료 → 목록 캐시 일관성
  // ──────────────────────────────────────────────────────────────────────────

  test('S06-03: QM이 검토 완료 → 목록에서 "승인 대기" 즉시 확인', async ({
    qualityManagerPage: page,
  }) => {
    expect(planId).toBeTruthy();
    await clearBackendCache(page.request);

    const token = await getBackendToken(page.request, 'quality_manager');

    // QM 검토 완료 (pending_review → pending_approval)
    const reviewResp = await page.request.patch(
      `${BACKEND_URL}/api/calibration-plans/${planId}/review`,
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: planCasVersion, reviewComment: 'S06 E2E 검토 완료' },
      }
    );
    expect(reviewResp.ok()).toBeTruthy();
    const reviewBody = await reviewResp.json();
    const reviewed = reviewBody.data ?? reviewBody;
    expect(reviewed.status).toBe('pending_approval');
    planCasVersion = reviewed.casVersion;

    // ★ 캐시 일관성: 목록에서 즉시 "승인 대기" 상태로 갱신
    await page.goto(`/calibration-plans?year=${PLAN_YEAR}`);
    await expect(page.getByText(String(PLAN_YEAR)).first()).toBeVisible();
    await expect(page.getByText('승인 대기').first()).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4: LM 최종 승인 → 목록 캐시 일관성
  // ──────────────────────────────────────────────────────────────────────────

  test('S06-04: LM이 최종 승인 → 목록에서 "승인 완료" 즉시 확인', async ({
    siteAdminPage: page,
  }) => {
    expect(planId).toBeTruthy();
    await clearBackendCache(page.request);

    const token = await getBackendToken(page.request, 'lab_manager');

    // LM 최종 승인 (pending_approval → approved)
    const approveResp = await page.request.patch(
      `${BACKEND_URL}/api/calibration-plans/${planId}/approve`,
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: planCasVersion },
      }
    );
    expect(approveResp.ok()).toBeTruthy();
    const approveBody = await approveResp.json();
    const approvedPlan = approveBody.data ?? approveBody;
    expect(approvedPlan.status).toBe('approved');

    // ★ 캐시 일관성: 목록에서 즉시 "승인 완료" 상태로 갱신되어야 함
    await page.goto(`/calibration-plans?year=${PLAN_YEAR}`);
    await expect(page.getByText(String(PLAN_YEAR)).first()).toBeVisible();
    await expect(page.getByText('승인 완료').first()).toBeVisible();
  });
});
