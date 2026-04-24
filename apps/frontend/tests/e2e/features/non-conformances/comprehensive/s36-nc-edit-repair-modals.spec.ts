/**
 * Suite 36: NC 상세 — 편집 모달 + 수리이력 등록 모달
 *
 * 검증 항목:
 * - "수정" 버튼이 장비 페이지로 이동하지 않고 NC 편집 모달을 엶
 * - NC 편집 모달에서 원인(cause)과 조치계획(actionPlan) 수정 가능
 * - "수정" 버튼은 open 상태에서만 표시
 * - "수리이력등록" 링크가 장비 페이지로 이동하지 않고 수리 등록 모달을 엶
 * - 수리 등록 모달에 올바른 필드(수리일자, 내용, 결과, 비고) 존재
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  gotoNcDetail,
  NC_IDS,
  getBackendToken,
  getNcDetail,
  updateNcViaApi,
} from './helpers/nc-test-helpers';

test.describe('Suite 36: NC 편집 모달 + 수리이력 등록 모달', () => {
  // ============================================================================
  // 36-01: "수정" 버튼 → NC 편집 모달 (장비 페이지 이동 없음)
  // ============================================================================

  test('36-01: open 상태에서 수정 버튼 클릭 시 NC 편집 모달이 열린다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // "수정" 버튼 클릭
    const editButton = page.getByRole('button', { name: '수정', exact: true });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 모달이 열림 (장비 페이지로 이동하지 않음)
    const dialog = page.getByRole('dialog', { name: '부적합 정보 수정' });
    await expect(dialog).toBeVisible();

    // URL이 여전히 부적합 상세 페이지
    await expect(page).toHaveURL(/\/non-conformances\//);
    await expect(page).not.toHaveURL(/\/equipment\//);

    // 원인(cause) 필드 존재
    await expect(dialog.getByLabel('원인')).toBeVisible();

    // 조치 계획(actionPlan) 필드 존재
    await expect(dialog.getByLabel('조치 계획')).toBeVisible();

    // 저장/취소 버튼 존재
    await expect(dialog.getByRole('button', { name: '저장' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: '취소' })).toBeVisible();

    // 취소로 닫기
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).not.toBeVisible();
  });

  // ============================================================================
  // 36-02: corrected/closed 상태에서 "수정" 버튼 미표시
  // ============================================================================

  test('36-02: corrected 상태에서 수정 버튼이 표시되지 않는다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);

    // "수정" 버튼이 없어야 함 (정확히 "수정"인 버튼만 확인, "편집"과 구분)
    await expect(page.getByRole('button', { name: '수정', exact: true })).not.toBeVisible();
  });

  test('36-03: closed 상태에서 수정 버튼이 표시되지 않는다', async ({ techManagerPage: page }) => {
    await gotoNcDetail(page, NC_IDS.NC_005_CLOSED);

    await expect(page.getByRole('button', { name: '수정', exact: true })).not.toBeVisible();
  });

  // ============================================================================
  // 36-04: NC 편집 모달에서 원인 수정 후 저장
  // ============================================================================

  test.describe('36-04: NC 편집 저장 (상태 변경)', () => {
    test.describe.configure({ mode: 'serial' });

    const testNcId = NC_IDS.NC_001_MALFUNCTION_OPEN;
    let originalCause: string;

    test('36-04a: 편집 전 원본 데이터 확인', async ({ techManagerPage: page }) => {
      const token = await getBackendToken(page, 'technical_manager');
      const ncResponse = await getNcDetail(page, testNcId, token);
      // ResponseTransformInterceptor가 { success, data } 래핑 — data가 NC 객체
      const nc = ncResponse.data ?? ncResponse;
      originalCause = nc.cause;
    });

    test('36-04b: 모달에서 원인을 수정하고 저장한다', async ({ techManagerPage: page }) => {
      await gotoNcDetail(page, testNcId);

      // 수정 모달 열기
      await page.getByRole('button', { name: '수정', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: '부적합 정보 수정' });
      await expect(dialog).toBeVisible();

      // 원인 필드 수정
      const causeField = dialog.getByLabel('원인');
      await causeField.clear();
      await causeField.fill('E2E 테스트 — 수정된 원인');

      // 저장 (변경 건수 포함 텍스트 — "저장" 또는 "저장 (변경 N건)")
      await dialog.getByRole('button', { name: /저장/ }).click();

      // 모달 닫힘
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      // 수정 성공 토스트
      await expect(page.getByText('부적합 사항이 수정되었습니다')).toBeVisible({ timeout: 5000 });

      // 페이지에 수정된 원인 반영
      await expect(page.getByText('E2E 테스트 — 수정된 원인')).toBeVisible();
    });

    test('36-04c: 원본 데이터로 복원', async ({ techManagerPage: page }) => {
      if (!originalCause) return;
      const token = await getBackendToken(page, 'technical_manager');
      // 현재 version 조회 후 복원
      const ncResponse = await getNcDetail(page, testNcId, token);
      const nc = ncResponse.data ?? ncResponse;
      const currentVersion = nc.version;
      await updateNcViaApi(page, token, testNcId, {
        version: currentVersion,
        cause: originalCause,
      });
    });
  });

  // ============================================================================
  // 36-05: 가이던스 콜아웃 "수리이력등록" → 수리 등록 모달 (시험실무자)
  // ============================================================================

  test('36-05: malfunction NC에서 가이던스 콜아웃 수리이력등록 클릭 시 수리 모달이 열린다', async ({
    testOperatorPage: page,
  }) => {
    // NC_001: malfunction, open, 수리 미연결 → operator는 openBlockedRepair_operator 가이던스
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // GuidanceCallout 내 수리 이력 등록 링크 버튼 클릭
    const callout = page.getByTestId('nc-guidance-callout');
    await expect(callout).toBeVisible();
    const repairLink = callout.getByRole('button', { name: /수리 이력 등록/ });
    await expect(repairLink).toBeVisible();
    await repairLink.click();

    // 수리 등록 모달 열림 (장비 페이지로 이동하지 않음)
    const dialog = page.getByRole('dialog', { name: '수리 이력 등록' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/non-conformances\//);
    await expect(page).not.toHaveURL(/\/equipment\//);

    // 취소로 닫기
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).not.toBeVisible();
  });

  // ============================================================================
  // 36-06: 정보카드 "수리이력등록" → 수리 등록 모달
  // ============================================================================

  test('36-06: 정보카드의 수리이력등록 클릭 시 수리 모달이 열린다 (2-step)', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 정보카드 내 "수리 이력 등록" 링크 (전제조건 링크와 다른 위치)
    const repairCard = page.getByText(/수리 연결 필요/).first();
    await expect(repairCard).toBeVisible();

    const infoCardRepairLink = page.getByText('수리 이력 등록', { exact: true });
    await expect(infoCardRepairLink).toBeVisible();
    await infoCardRepairLink.click();

    // Step 1 (input): 수리 모달 열림 + 필드 확인
    const dialog = page.getByRole('dialog', { name: '수리 이력 등록' });
    await expect(dialog).toBeVisible();

    await expect(dialog.getByLabel('수리 일자')).toBeVisible();
    await expect(dialog.getByLabel('수리 내용')).toBeVisible();
    await expect(dialog.getByLabel('수리 결과')).toBeVisible();
    await expect(dialog.getByLabel('비고')).toBeVisible();

    // Step 1: "다음 →" 버튼 존재 (2-step 플로우), "등록"은 Step 2에서만
    await expect(dialog.getByRole('button', { name: /다음/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: '취소' })).toBeVisible();

    // Step 1 → Step 2: 필수 필드 입력 후 다음으로 진행
    await dialog.getByLabel('수리 내용').fill('E2E 테스트 — 수리 내용 (최소 10자 이상)');
    await dialog.getByRole('button', { name: /다음/ }).click();

    // Step 2 (confirm): 등록 + 수정 버튼 확인
    await expect(dialog.getByRole('button', { name: '등록' })).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('button', { name: /수정/ })).toBeVisible();

    // 취소
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
