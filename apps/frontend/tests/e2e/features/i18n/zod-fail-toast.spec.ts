/**
 * ADR-0008 — Backend Zod fail → Frontend toast i18n routing 런타임 검증
 *
 * 본 spec 의 책임:
 *   백엔드가 `{ code: 'VALIDATION_ERROR', issues: BackendValidationIssue[] }` 응답을 반환할 때,
 *   프론트엔드 hub (`extractValidationIssues` + `mapZodIssuesToToast`) 가 next-intl 의
 *   `errors.validation.<code>` + `errors.fields.<name>` namespace 를 정확히 적용하여
 *   *실제 브라우저 토스트* 에 ko 번역 텍스트가 노출되는지를 검증.
 *
 * ts-morph 정적 spec (`zod-fallback-coverage.test.ts`) 과 backend unit
 * (`error-filter-zod.spec.ts`) 가 각각 mapper 호출/issues array 응답을 결빙하지만,
 * **런타임 토스트 노출 경로** 는 본 spec 이 단독 책임. (zod-i18n-mapper-hub-closure
 * SHOULD S-4 후속, tech-debt `e2e-zod-fail-toast-verification`.)
 *
 * 호출지 선택 근거:
 *   - `NCDetailClient.rejectMutation.onError` 가 `mapNonConformanceErrorToToast(error, t, tErrors)`
 *     hub 호출지 — 17 도메인 mapper 중 단일 mutation 으로 검증 가능
 *   - `nc-rejection-flow.spec.ts` 시드 reset 헬퍼 (`UPDATE non_conformances SET status='corrected'`)
 *     를 본 spec 도 차용해 NC_006 의 reject 버튼 가시성 보장
 *   - PATCH 응답만 page.route() 로 인터셉트 — GET (NC 상세 조회) 는 실 시드 사용
 *
 * 실행:
 *   pnpm exec playwright test zod-fail-toast --project=chromium --workers=1
 */

import { test, expect, type Page } from '../../shared/fixtures/auth.fixture';
import { expectToastVisible } from '../../shared/helpers/toast-helpers';
import { BASE_URLS, TEST_NC_IDS, TEST_USER_IDS } from '../../shared/constants/shared-test-data';
import { Pool } from 'pg';

const TEST_NC_ID = TEST_NC_IDS.NC_006_WITH_REPAIR;
const REJECT_PATH = `**/api/non-conformances/${TEST_NC_ID}/reject-correction`;
const VALID_REJECT_REASON =
  '백엔드 Zod 검증 실패 응답 후 토스트 i18n 라우팅 검증을 위한 mock 사유 (≥10자)';

/**
 * 시드 NC_006 을 corrected 상태로 reset — `nc-rejection-flow.spec.ts` 패턴 차용.
 *
 * 멱등성 보장: 본 spec 의 PATCH 는 page.route() 인터셉트로 mock 응답이라 DB 미변경이지만,
 * 다른 spec 의 reject 결과(`status='open'`) 가 잔존하면 reject 버튼이 사라져 spec 실패.
 */
async function resetNcToCorrected(): Promise<void> {
  const pool = new Pool({ connectionString: BASE_URLS.DATABASE, max: 2 });
  try {
    await pool.query(
      `UPDATE non_conformances
       SET status = 'corrected', version = 1,
           rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL,
           closed_by = NULL, closed_at = NULL, closure_notes = NULL,
           corrected_by = $2, correction_date = NOW() - INTERVAL '3 days',
           correction_content = '내부 연결부 교체 완료',
           updated_at = NOW()
       WHERE id = $1`,
      [TEST_NC_ID, TEST_USER_IDS.TECHNICAL_MANAGER_SUWON]
    );
    await fetch(`${BASE_URLS.BACKEND}/api/auth/test-cache-clear`, { method: 'POST' });
  } finally {
    await pool.end();
  }
}

/**
 * 반려 다이얼로그 열기 → 사유 입력 → 제출 (page.route mock 가 응답을 가로챔).
 */
async function triggerRejectWithMockedFailure(
  page: Page,
  issues: ReadonlyArray<{ code: string; path: ReadonlyArray<string | number>; params?: object }>
): Promise<void> {
  // PATCH 만 mock — GET 등 다른 메서드는 실 backend 로 위임 (테스트 격리)
  await page.route(REJECT_PATH, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed (mocked for ADR-0008 e2e)',
        issues,
      }),
    });
  });

  await page.goto(`/non-conformances/${TEST_NC_ID}`);

  // 액션바의 반려 버튼 (RejectModal 내부 submit 버튼과 구분 — 다이얼로그 열리기 전 단계)
  const rejectBtn = page.getByRole('button', { name: /^반려$/ });
  await expect(rejectBtn).toBeVisible({ timeout: 15_000 });
  await rejectBtn.click();

  const dialog = page.getByRole('dialog', { name: /조치 반려/ });
  await expect(dialog).toBeVisible({ timeout: 10_000 });

  // RejectModal 내부 textarea — RejectReasonSchema (≥10자) 통과용 mock 사유
  await dialog.getByRole('textbox').fill(VALID_REJECT_REASON);

  // 다이얼로그 내부 제출 버튼 — submitLabel='반려', mode='domain' (액션바 버튼과 dialog scope 로 구분)
  await dialog.getByRole('button', { name: /^반려$/ }).click();
}

test.describe('ADR-0008 — Backend Zod fail → Frontend toast i18n routing (browser)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetNcToCorrected();
  });

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('too_small Zod issue → ko 토스트 ("반려 사유" + "너무 작습니다 (최소 ...)")', async ({
    techManagerPage,
  }) => {
    await triggerRejectWithMockedFailure(techManagerPage, [
      { code: 'too_small', path: ['rejectionReason'], params: { minimum: 5 } },
    ]);

    // 기대: errors.validation.too_small ("{field}이(가) 너무 작습니다 (최소 {minimum})")
    //      + errors.fields.rejectionReason ("반려 사유")
    await expectToastVisible(techManagerPage, /반려 사유.*너무 작습니다.*최소 5/);
  });

  test('invalid_format Zod issue → 다른 i18n 라우팅 (format param 보존)', async ({
    techManagerPage,
  }) => {
    await triggerRejectWithMockedFailure(techManagerPage, [
      { code: 'invalid_format', path: ['rejectionReason'], params: { format: 'uuid' } },
    ]);

    // 기대: errors.validation.invalid_format ("{field}이(가) {format} 형식을 만족하지 않습니다")
    await expectToastVisible(techManagerPage, /반려 사유.*uuid 형식을 만족하지 않습니다/);
  });

  test('다중 issue (2개) → ", " join + 모든 메시지 토스트 노출', async ({ techManagerPage }) => {
    await triggerRejectWithMockedFailure(techManagerPage, [
      { code: 'too_small', path: ['rejectionReason'], params: { minimum: 5 } },
      { code: 'invalid_type', path: ['version'], params: { expected: 'number' } },
    ]);

    // 다중 issue 는 mapZodIssuesToToast 가 ", " 로 join — 한 토스트에 두 메시지 모두 노출
    await expectToastVisible(techManagerPage, /반려 사유.*너무 작습니다/);
    await expectToastVisible(techManagerPage, /버전.*형식이 올바르지 않습니다.*필요 형식: number/);
  });
});
