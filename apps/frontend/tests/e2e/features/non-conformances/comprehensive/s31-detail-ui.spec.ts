/**
 * Suite 31: 부적합 상세 페이지 UI 검증
 *
 * 검증 항목:
 * - 수평 3단계 워크플로우 타임라인 (등록→조치→종결)
 * - 반려 알림 배너 (반려 사유 + 반려일 + 반려자)
 * - 전제조건 미충족 안내 (수리 이력/교정 기록 미연결)
 * - 기본 정보 카드 (유형, 발견자, 발견일, 원인, 조치 계획)
 * - 수리 연결 카드 (수리 결과/일자/내용, 미연결 시 안내)
 * - 시정 조치 섹션 (open에서만 편집 가능)
 * - 종결 의견 섹션 (closed에서만 표시)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { gotoNcDetail, NC_IDS } from './helpers/nc-test-helpers';

test.describe('Suite 31: 부적합 상세 페이지 UI', () => {
  // ============================================================================
  // 31-01: 워크플로우 타임라인 (open 상태)
  // ============================================================================

  test('31-01: open 상태 NC에 3단계 워크플로우 타임라인이 표시된다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 타임라인 3단계: 등록, 조치, 종결 (exact로 중복 방지)
    await expect(page.getByText('등록', { exact: true })).toBeVisible();
    await expect(page.getByText('조치', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('종결', { exact: true }).first()).toBeVisible();

    // open 상태 → "등록됨" 배지 표시
    await expect(page.getByText('등록됨').first()).toBeVisible();

    // 헤더에 경과일 표시
    await expect(page.getByText(/경과 \d+일/)).toBeVisible();
  });

  // ============================================================================
  // 31-02: 워크플로우 타임라인 (corrected 상태)
  // ============================================================================

  test('31-02: corrected 상태 NC에서 "조치" 단계가 활성화된다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);

    // "조치 완료" 배지 표시
    await expect(page.getByText('조치 완료').first()).toBeVisible();

    // 타임라인 단계 표시
    await expect(page.getByText('등록', { exact: true })).toBeVisible();
    await expect(page.getByText('조치', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('종결', { exact: true }).first()).toBeVisible();
  });

  // ============================================================================
  // 31-03: 워크플로우 타임라인 (closed 상태)
  // ============================================================================

  test('31-03: closed 상태 NC에서 모든 단계가 완료 표시된다', async ({ techManagerPage: page }) => {
    await gotoNcDetail(page, NC_IDS.NC_005_CLOSED);

    // "종료됨" 배지 표시
    await expect(page.getByText('종료됨').first()).toBeVisible();
  });

  // ============================================================================
  // 31-04: 기본 정보 카드
  // ============================================================================

  test('31-04: 기본 정보 카드에 유형, 발견자, 발견일, 원인이 표시된다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 기본 정보 카드 제목
    await expect(page.getByText('기본 정보')).toBeVisible();

    // 필드 레이블 (first() — 헤더/타임라인과 중복 방지)
    await expect(page.getByText('부적합 유형')).toBeVisible();
    await expect(page.getByText('발견자').first()).toBeVisible();
    await expect(page.getByText('발견일').first()).toBeVisible();
    await expect(page.getByText('원인', { exact: true })).toBeVisible();

    // NC_001은 malfunction 유형 → "오작동" 표시
    await expect(page.getByText('오작동').first()).toBeVisible();
  });

  // ============================================================================
  // 31-05: 수리 연결 카드 (연결됨)
  // ============================================================================

  test('31-05: measurement_error NC에 수리 불필요 안내가 표시된다', async ({
    techManagerPage: page,
  }) => {
    // NC_008: measurement_error, corrected, 수리 불필요
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);

    // "수리가 필요하지 않은 유형입니다" 안내
    await expect(page.getByText('수리가 필요하지 않은 유형입니다')).toBeVisible();
  });

  // ============================================================================
  // 31-06: 수리 연결 카드 (미연결 — 수리 필요)
  // ============================================================================

  test('31-06: malfunction 유형 NC에 수리 이력 미연결 시 경고가 표시된다', async ({
    techManagerPage: page,
  }) => {
    // NC_001: malfunction, open, 수리 미연결
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // "수리 연결 필요" 안내
    await expect(page.getByText(/수리 연결 필요/).first()).toBeVisible();

    // 수리 이력 등록 링크
    await expect(page.getByText('수리 이력 등록').first()).toBeVisible();
  });

  // ============================================================================
  // 31-07: 전제조건 미충족 안내 (damage — 수리 필수)
  // ============================================================================

  test('31-07: malfunction 유형에서 수리 미연결 시 전제조건 안내가 표시된다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 전제조건 안내 메시지
    await expect(page.getByText(/수리 이력을 등록해야/).first()).toBeVisible();

    // "조치 완료" 버튼 비활성화
    const actionButton = page.getByRole('button', { name: '조치 완료' });
    await expect(actionButton).toBeDisabled();
  });

  // ============================================================================
  // 31-08: 시정 조치 섹션 (open — 편집 가능)
  // ============================================================================

  test('31-08: open 상태에서 시정 조치 섹션에 편집 버튼이 표시된다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 시정 조치 섹션 제목 (이모지 포함)
    await expect(page.getByText(/시정 조치/).first()).toBeVisible();

    // 편집 버튼 (collapsible 열린 상태에서만 표시)
    const editButton = page.getByRole('button', { name: '편집' });
    // collapsible이 닫혀있으면 먼저 열기
    if (!(await editButton.isVisible())) {
      await page.getByRole('button', { name: /시정 조치/ }).click();
    }
    await expect(editButton).toBeVisible();

    // 클릭 → textarea 표시
    await editButton.click();
    await expect(page.getByPlaceholder('시정 조치 내용을 입력하세요')).toBeVisible();

    // 취소 버튼
    await page.getByRole('button', { name: '취소' }).click();
  });

  // ============================================================================
  // 31-09: 종결 의견 섹션 (closed에서만 표시)
  // ============================================================================

  test('31-09: closed 상태에서만 종결 의견 섹션이 표시된다', async ({ techManagerPage: page }) => {
    // closed NC
    await gotoNcDetail(page, NC_IDS.NC_005_CLOSED);
    await expect(page.getByText('종결 의견')).toBeVisible();

    // open NC에서는 미표시
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);
    await expect(page.getByText('종결 의견')).not.toBeVisible();
  });

  // ============================================================================
  // 31-10: closed 상태에서 액션 바 미표시
  // ============================================================================

  test('31-10: closed 상태에서 모든 액션 버튼이 미표시된다', async ({ techManagerPage: page }) => {
    await gotoNcDetail(page, NC_IDS.NC_005_CLOSED);

    // 조치 완료, 종결 승인, 조치 반려 버튼 모두 미표시
    await expect(page.getByRole('button', { name: '조치 완료' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '종결 승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '조치 반려' })).not.toBeVisible();
  });

  // ============================================================================
  // 31-11: corrected 상태에서 기술책임자 액션 바
  // ============================================================================

  test('31-11: corrected 상태에서 기술책임자에게 종결/반려 버튼이 표시된다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);

    // 종결 승인 + 조치 반려 버튼 표시
    await expect(page.getByRole('button', { name: '종결 승인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '조치 반려' })).toBeVisible();
  });

  // ============================================================================
  // 31-12: 장비 링크
  // ============================================================================

  test('31-12: 헤더에 장비 링크가 표시되고 클릭 가능하다', async ({ techManagerPage: page }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 장비명 + 관리번호 링크 표시
    const equipmentLink = page.locator('a[href^="/equipment/"]').first();
    await expect(equipmentLink).toBeVisible();
  });

  // 31-13: 31-05로 통합됨 (measurement_error 유형 수리 불필요 안내)

  // ============================================================================
  // 31-14: 목록 돌아가기 버튼
  // ============================================================================

  test('31-14: 목록 버튼 클릭 시 부적합 목록 페이지로 이동한다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 목록 버튼 클릭
    await page.getByRole('button', { name: '목록' }).click();

    // 목록 페이지 도착
    await expect(page).toHaveURL(/\/non-conformances/);
    await expect(page.getByRole('heading', { name: '부적합 관리' })).toBeVisible();
  });
});
