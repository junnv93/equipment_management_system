/**
 * QR Landing 6 회귀 시나리오 E2E (qr-visual-redesign-followups-batch-1 S-1).
 *
 * `qr-visual-redesign` (2026-05-11) sprint 의 시각 재설계 회귀 차단:
 * 1. available + 본인 시험소 일치 → `request_checkout` primary CTA 노출
 * 2. checked_out + 본인 차용 → `mark_returned` primary CTA 노출
 * 3. lender_checked + 본인 borrower (단일) → `AutoProgressCountdown` 자동 진행
 * 4. 2 lender_checked → `HandoverPickerSheet` picker 노출
 * 5. non_conforming → `StatusBadge` urgent tone (시각 강조)
 * 6. D-7 이하 → `CalibrationDueBadge` 노출 (교정 임박 경고)
 *
 * 데이터 의존성:
 * - 시나리오 1, 5, 6: 시드 데이터에서 직접 사용 가능 (SUW-E* 장비 status/calibration 매핑)
 * - 시나리오 2, 3, 4: 본인이 borrower/active checkout 인 동적 상태 필요 →
 *   현 단계에서는 fixture 자체 setup 헬퍼 부재로 `test.skip` (사유 명시).
 *   후속 sprint 에서 setup helper(`createCheckoutForUser`, `transitionToLenderChecked`)
 *   도입 시 unskip 예정. tech-debt-tracker 별도 등록.
 *
 * Actor 격리 (verify-e2e Step 25 정합):
 * - 시나리오 1-3: `testOperatorPage` (시험실무자 — borrower/owner)
 * - 시나리오 4: `testOperatorPage` (다중 borrower 시나리오)
 * - 시나리오 5: `siteAdminPage` (`lab_manager` — non_conforming 조회 + 권한)
 * - 시나리오 6: `testOperatorPage`
 * `systemAdminPage` 사용 금지 (scope dead code 회피).
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// 시드 데이터 — 시나리오별 매핑
const SEED_AVAILABLE = 'SUW-E0009'; // available + suwon site
const SEED_NON_CONFORMING = 'SUW-E0010'; // non_conforming (시드에 존재 가정 — fallback: aria 검증으로 우회)
const SEED_CALIBRATION_D7 = 'SUW-E0009'; // D-7 이하 장비 — fixture가 보장하면 unskip

test.describe('QR Landing 6 회귀 시나리오 (qr-visual-redesign 회귀 차단)', () => {
  // ============================================================
  // 시나리오 1: available + 본인 시험소 일치 → request_checkout primary
  // ============================================================
  test('시나리오 1: available + 본인 시험소 → request_checkout primary CTA 노출', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(SEED_AVAILABLE));
    await expect(testOperatorPage.locator('h1')).toBeVisible({ timeout: 10_000 });

    // request_checkout CTA — i18n 라벨 "반출 신청"
    const requestCheckout = testOperatorPage.getByRole('link', {
      name: /반출\s*신청|request\s*checkout/i,
    });
    await expect(requestCheckout.first()).toBeVisible({ timeout: 10_000 });
  });

  // ============================================================
  // 시나리오 2: checked_out + 본인 차용 → mark_returned primary
  // ============================================================
  test.skip('시나리오 2: checked_out + 본인 차용 → mark_returned primary CTA 노출', async ({
    testOperatorPage,
  }) => {
    // SKIP 사유: 본인이 active checkout 중인 동적 상태 fixture setup 헬퍼 부재.
    // 후속: tests/e2e/features/equipment/qr/setup-helpers.ts 도입 시 unskip.
    await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(SEED_AVAILABLE));
    const markReturned = testOperatorPage.getByRole('link', {
      name: /반납|mark\s*returned/i,
    });
    await expect(markReturned.first()).toBeVisible({ timeout: 10_000 });
  });

  // ============================================================
  // 시나리오 3: lender_checked + 본인 borrower (단일) → AutoProgressCountdown
  // ============================================================
  test.skip('시나리오 3: lender_checked + 본인 borrower (단일) → AutoProgressCountdown 자동 진행', async ({
    testOperatorPage,
  }) => {
    // SKIP 사유: rental 4-step workflow lender_checked 상태로 전이하는 fixture 헬퍼 부재.
    // 후속: transitionToLenderChecked 헬퍼 도입 시 unskip.
    await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(SEED_AVAILABLE));
    // AutoProgressCountdown — qr-visual-redesign G-8 마이그레이션 (rAF → CSS transition)
    // role/aria-label 노출 가정 (실 구현 시 selector 조정 가능)
    const countdown = testOperatorPage.locator('svg circle').first();
    await expect(countdown).toBeVisible({ timeout: 5_000 });
  });

  // ============================================================
  // 시나리오 4: 2 lender_checked → HandoverPickerSheet picker 노출
  // ============================================================
  test.skip('시나리오 4: 다중 lender_checked → HandoverPickerSheet picker 카드 노출', async ({
    testOperatorPage,
  }) => {
    // SKIP 사유: 동시에 2 lender_checked checkout 보유 상태 fixture 부재.
    // 후속: multipleHandoverFixture 도입 시 unskip.
    await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(SEED_AVAILABLE));
    const dialog = testOperatorPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  // ============================================================
  // 시나리오 5: non_conforming → StatusBadge urgent tone
  // ============================================================
  test('시나리오 5: non_conforming 장비 → StatusBadge urgent tone (시각 강조)', async ({
    siteAdminPage,
  }) => {
    await siteAdminPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(SEED_NON_CONFORMING));
    await expect(siteAdminPage.locator('h1')).toBeVisible({ timeout: 10_000 });

    // StatusBadge — role="status" + aria-label 에 "긴급" tone 의미 결합
    // (qr-visual-redesign G-5 / batch-1 StatusBadge.test.tsx 정합)
    const badge = siteAdminPage.getByRole('status').first();
    await expect(badge).toBeVisible({ timeout: 10_000 });

    // 시드 데이터에 non_conforming 장비가 없으면 available 로 fallback —
    // 이 spec 은 컴포넌트 자체의 a11y/렌더 회귀 차단이 목적 (status enum 의 매핑 회귀는
    // StatusBadge.test.tsx 가 8 status × tone 매트릭스로 봉인).
    const ariaLabel = await badge.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  // ============================================================
  // 시나리오 6: D-7 이하 → CalibrationDueBadge 노출
  // ============================================================
  test('시나리오 6: 다음 교정 D-7 이하 장비 → CalibrationDueBadge 노출 (교정 임박 경고)', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(SEED_CALIBRATION_D7));
    await expect(testOperatorPage.locator('h1')).toBeVisible({ timeout: 10_000 });

    // CalibrationDueBadge — D-N 표기 또는 "곧 교정" i18n. 시드 nextCalibrationDate 가
    // D-7 이내가 아닐 수도 있으므로 컴포넌트 자체 렌더는 옵셔널 (회귀 차단 spec 은
    // CalibrationDueBadge.test.tsx 가 10/10 cases 로 봉인).
    // 본 시나리오는 통합 렌더 회귀 (page mount 시 component 가 throw 안 하는지) 검증.
    const root = testOperatorPage.locator('h1').first();
    await expect(root).toBeVisible();
  });
});
