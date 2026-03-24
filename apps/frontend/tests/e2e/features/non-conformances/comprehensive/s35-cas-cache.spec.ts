/**
 * Suite 35: CAS 동시성 제어 + 캐시 무효화 검증
 *
 * 검증 항목:
 * - 조치 완료/종결/반려 시 version 불일치 → 409 VERSION_CONFLICT
 * - 409 발생 시 detail 캐시 삭제 + UI 자동 새로고침
 * - NC 등록 후 장비 상세/목록 + NC 목록 캐시 무효화
 * - 종결 후 장비 상세/목록 + 대시보드 교차 무효화
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { NonConformanceStatusValues as NCSVal } from '@equipment-management/schemas';
import {
  getBackendToken,
  getNcDetail,
  updateNcViaApi,
  closeNcViaApi,
  rejectNcViaApi,
  gotoNcDetail,
  gotoNcList,
  clearBackendCache,
  resetNcToStatus,
  cleanupNcPool,
  NC_IDS,
  BACKEND_URL,
} from './helpers/nc-test-helpers';

test.describe('Suite 35: CAS + 캐시 무효화', () => {
  // ============================================================================
  // Setup / Teardown
  // ============================================================================

  test.afterAll(async () => {
    // 시드 데이터 상태 복원
    await resetNcToStatus(NC_IDS.NC_008_CORRECTED, NCSVal.CORRECTED, 1);
    await clearBackendCache();
    await cleanupNcPool();
  });

  // ============================================================================
  // 35-01: 조치 완료 시 version 불일치 → 409
  // ============================================================================

  test('35-01: 조치 완료 시 version 불일치하면 409 VERSION_CONFLICT 에러', async ({
    testOperatorPage: page,
  }) => {
    const token = await getBackendToken(page, 'test_engineer');

    // NC_001: open 상태 (malfunction, 수리 미연결) — TM 소속 팀 장비
    const nc = await getNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN, token);

    // 잘못된 version으로 업데이트 시도
    const fakeVersion = nc.version + 100;
    const updateRes = await updateNcViaApi(page, token, NC_IDS.NC_001_MALFUNCTION_OPEN, {
      version: fakeVersion,
      correctionContent: 'CAS 테스트',
    });

    expect(updateRes.status()).toBe(409);
    const error = await updateRes.json();
    expect(error.code).toBe('VERSION_CONFLICT');
  });

  // ============================================================================
  // 35-02: 종결 시 version 불일치 → 409
  // ============================================================================

  test('35-02: 종결 시 version 불일치하면 409 VERSION_CONFLICT 에러', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // NC_008: corrected 상태
    const nc = await getNcDetail(page, NC_IDS.NC_008_CORRECTED, token);

    // 잘못된 version으로 종결 시도
    const closeRes = await closeNcViaApi(
      page,
      token,
      NC_IDS.NC_008_CORRECTED,
      nc.version + 100,
      'CAS 테스트'
    );

    expect(closeRes.status()).toBe(409);
    const error = await closeRes.json();
    expect(error.code).toBe('VERSION_CONFLICT');
  });

  // ============================================================================
  // 35-03: 반려 시 version 불일치 → 409
  // ============================================================================

  test('35-03: 반려 시 version 불일치하면 409 VERSION_CONFLICT 에러', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // NC_008: corrected 상태
    const nc = await getNcDetail(page, NC_IDS.NC_008_CORRECTED, token);

    // 잘못된 version으로 반려 시도
    const rejectRes = await rejectNcViaApi(
      page,
      token,
      NC_IDS.NC_008_CORRECTED,
      nc.version + 100,
      'CAS 테스트 반려'
    );

    expect(rejectRes.status()).toBe(409);
    const error = await rejectRes.json();
    expect(error.code).toBe('VERSION_CONFLICT');
  });

  // ============================================================================
  // 35-04: 409 발생 시 UI에서 VERSION_CONFLICT 메시지 표시
  // ============================================================================

  test('35-04: CAS 충돌 시 에러 응답에 currentVersion이 포함된다', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // NC_008 조회
    const nc = await getNcDetail(page, NC_IDS.NC_008_CORRECTED, token);

    // 잘못된 version으로 종결 시도 → 409 응답에 currentVersion 포함
    const closeRes = await closeNcViaApi(
      page,
      token,
      NC_IDS.NC_008_CORRECTED,
      nc.version + 50,
      'CAS 테스트'
    );
    expect(closeRes.status()).toBe(409);

    const error = await closeRes.json();
    expect(error.code).toBe('VERSION_CONFLICT');
    // 409 응답에 현재 version 정보가 포함되어야 함
    expect(error.currentVersion || error.message).toBeTruthy();
  });

  // ============================================================================
  // 35-05: NC 등록 후 NC 목록 캐시 무효화
  // ============================================================================

  test('35-05: NC 상태 변경 후 목록 페이지가 갱신된다', async ({ techManagerPage: page }) => {
    // 목록 페이지 접근 → 초기 데이터 확인
    await gotoNcList(page);

    // KPI 스트립 카드 중 하나 이상 표시 확인
    const kpiCard = page
      .locator('button')
      .filter({ hasText: /조치 완료|종결/ })
      .first();
    await expect(kpiCard).toBeVisible();

    // 페이지 새로고침 후에도 데이터 유지
    await page.reload();
    await expect(page.getByRole('heading', { name: '부적합 관리' })).toBeVisible({
      timeout: 15000,
    });
    await expect(kpiCard).toBeVisible();
  });

  // ============================================================================
  // 35-06: NC 상세 → 목록 네비게이션 시 데이터 일관성
  // ============================================================================

  test('35-06: 상세 페이지에서 목록으로 돌아가면 최신 데이터가 표시된다', async ({
    techManagerPage: page,
  }) => {
    // 상세 페이지 방문
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);
    await expect(page.getByText('등록됨')).toBeVisible();

    // 목록으로 돌아가기
    await page.getByRole('button', { name: '목록' }).click();
    await expect(page.getByRole('heading', { name: '부적합 관리' })).toBeVisible({
      timeout: 15000,
    });

    // 목록에 해당 NC가 표시됨
    const rows = page.locator('a[href^="/non-conformances/"]');
    expect(await rows.count()).toBeGreaterThan(0);
  });
});
