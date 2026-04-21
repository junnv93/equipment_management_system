/**
 * NC 다음 단계 가이던스 콜아웃 E2E 테스트
 *
 * GuidanceCallout이 상태×역할 조합에 따라 올바른 guidance-key를 렌더링하는지,
 * CTA 버튼이 정상 동작하는지 검증합니다.
 *
 * 시드 데이터 전제:
 * - NC_001: malfunction, open, 수리 미연결
 * - NC_003: damage, open, 수리 미연결 (damage 타입도 repair 전제조건)
 * - NC_005: closed
 * - NC_008: corrected (수리 미연결)
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { gotoNcDetail, NC_IDS } from './comprehensive/helpers/nc-test-helpers';

test.describe('NC 가이던스 콜아웃', () => {
  // ============================================================================
  // G-01: open + operator → openBlockedRepair_operator 또는 open_operator
  // ============================================================================

  test('G-01: open/blocked(repair) 상태에서 시험실무자는 critical 가이던스를 본다', async ({
    testOperatorPage: page,
  }) => {
    // NC_001: malfunction, open, needsRepair=true
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    const callout = page.getByTestId('nc-guidance-callout');
    await expect(callout).toBeVisible();

    // openBlockedRepair_operator 키 확인
    await expect(callout).toHaveAttribute('data-guidance-key', 'openBlockedRepair_operator');

    // GuidanceCallout CTA: 수리 이력 등록 링크 버튼 존재
    const repairBtn = callout.getByRole('button', { name: /수리 이력 등록/ });
    await expect(repairBtn).toBeVisible();
  });

  // ============================================================================
  // G-02: open + manager → openBlockedRepair_manager (CTA 없음)
  // ============================================================================

  test('G-02: open/blocked(repair) 상태에서 기술책임자는 정보성 가이던스를 보고 CTA가 없다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    const callout = page.getByTestId('nc-guidance-callout');
    await expect(callout).toBeVisible();
    await expect(callout).toHaveAttribute('data-guidance-key', 'openBlockedRepair_manager');

    // 관리자 역할에서는 수리 등록 CTA 버튼 없음
    await expect(callout.getByRole('button', { name: /수리 이력 등록/ })).not.toBeVisible();
  });

  // ============================================================================
  // G-03: corrected + manager → corrected_manager (종결 승인 CTA)
  // ============================================================================

  test('G-03: corrected 상태에서 기술책임자는 종결 승인 유도 가이던스를 본다', async ({
    techManagerPage: page,
  }) => {
    // NC_008: corrected 상태
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);

    const callout = page.getByTestId('nc-guidance-callout');
    await expect(callout).toBeVisible();
    await expect(callout).toHaveAttribute('data-guidance-key', 'corrected_manager');

    // callout 자체는 항상 노출
    await expect(callout).toBeVisible();
  });

  // ============================================================================
  // G-04: closed → closed_all (읽기 전용 가이던스, 역할 무관)
  // ============================================================================

  test('G-04: closed 상태에서는 종결 완료 가이던스가 표시된다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_005_CLOSED);

    const callout = page.getByTestId('nc-guidance-callout');
    await expect(callout).toBeVisible();
    await expect(callout).toHaveAttribute('data-guidance-key', 'closed_all');
  });

  // ============================================================================
  // G-05: GuidanceCallout CTA → 수리 모달 오픈 (end-to-end flow)
  // ============================================================================

  test('G-05: 가이던스 콜아웃 수리 링크 클릭 시 수리 등록 모달이 열린다', async ({
    testOperatorPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    const callout = page.getByTestId('nc-guidance-callout');
    await expect(callout).toHaveAttribute('data-guidance-key', 'openBlockedRepair_operator');

    // 수리 이력 등록 버튼 클릭
    await callout.getByRole('button', { name: /수리 이력 등록/ }).click();

    // 수리 등록 모달 열림 확인
    const dialog = page.getByRole('dialog', { name: '수리 이력 등록' });
    await expect(dialog).toBeVisible();

    // URL 유지 (장비 페이지로 이동 없음)
    await expect(page).toHaveURL(/\/non-conformances\//);

    // 취소
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
