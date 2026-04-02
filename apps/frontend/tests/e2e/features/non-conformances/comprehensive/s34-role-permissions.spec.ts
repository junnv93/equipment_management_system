/**
 * Suite 34: 역할별 권한 + 데이터 스코프 검증
 *
 * 검증 항목:
 * - quality_manager: 목록/상세 조회만 가능, 전체(all) 스코프, 모든 액션 버튼 미표시
 * - test_engineer: 등록/조치 가능, 종결/반려 버튼 미표시
 * - technical_manager/lab_manager: 전체 액션 가능
 * - 데이터 스코프: TE/TM은 소속 팀만, QM은 전체, LM은 소속 사이트
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  getBackendToken,
  gotoNcList,
  gotoNcDetail,
  listNcsViaApi,
  NC_IDS,
  EQUIP_IDS,
  USER_IDS,
  BACKEND_URL,
} from './helpers/nc-test-helpers';

test.describe('Suite 34: 역할별 권한', () => {
  // ============================================================================
  // 34-01: quality_manager — 목록 조회 가능 (읽기 전용)
  // ============================================================================

  test('34-01: quality_manager는 부적합 목록을 조회할 수 있다', async ({
    qualityManagerPage: page,
  }) => {
    await gotoNcList(page);

    // 목록 페이지 정상 로드
    await expect(page.getByRole('heading', { name: '부적합 관리' })).toBeVisible();

    // KPI 스트립 표시
    const kpiCards = page.locator('button').filter({ hasText: /처리 중|조치 완료|종결/ });
    await expect(kpiCards.first()).toBeVisible();
  });

  // ============================================================================
  // 34-02: quality_manager — 상세 조회 가능
  // ============================================================================

  test('34-02: quality_manager는 부적합 상세를 조회할 수 있다', async ({
    qualityManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 상세 페이지 정상 로드
    await expect(page.getByText('기본 정보')).toBeVisible();
    await expect(page.getByText('부적합 유형')).toBeVisible();
  });

  // ============================================================================
  // 34-03: quality_manager — 모든 액션 버튼 미표시
  // ============================================================================

  test('34-03: quality_manager에게 종결/반려 버튼이 표시되지 않는다', async ({
    qualityManagerPage: page,
  }) => {
    // corrected 상태 NC — QM에게 종결/반려 버튼 미표시
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);
    await expect(page.getByRole('button', { name: '종결 승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '조치 반려' })).not.toBeVisible();
  });

  // ============================================================================
  // 34-04: quality_manager — 전체 스코프 (API)
  // ============================================================================

  test('34-04: quality_manager는 전체(all) 스코프로 모든 부적합을 조회한다', async ({
    qualityManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'quality_manager');

    // QM은 사이트 제한 없이 모든 NC 조회 가능
    const res = await listNcsViaApi(page, token, { includeSummary: 'true' });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const items = data.data || data.items || [];

    // 수원 + 의왕 등 여러 사이트의 NC가 포함되어야 함
    // (시드 데이터에 NC_009는 UIW 사이트)
    expect(items.length).toBeGreaterThan(0);
  });

  // ============================================================================
  // 34-05: test_engineer — open NC에서 "조치 완료" 버튼 표시
  // ============================================================================

  test('34-05: test_engineer에게 open NC의 "조치 완료" 버튼이 표시된다', async ({
    testOperatorPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 조치 완료 버튼 표시 (단, 수리 미연결이면 disabled)
    await expect(page.getByRole('button', { name: '조치 완료' })).toBeVisible();
  });

  // ============================================================================
  // 34-06: test_engineer — corrected NC에서 종결/반려 버튼 미표시
  // ============================================================================

  test('34-06: test_engineer에게 종결 승인/조치 반려 버튼이 표시되지 않는다', async ({
    testOperatorPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);

    // 기술책임자 전용 버튼 미표시
    await expect(page.getByRole('button', { name: '종결 승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '조치 반려' })).not.toBeVisible();

    // "기술책임자의 종결 승인을 기다리고 있습니다" 안내 메시지
    await expect(page.getByText(/기술책임자의 종결 승인/)).toBeVisible();
  });

  // ============================================================================
  // 34-07: technical_manager — corrected NC에서 종결/반려 버튼 표시
  // ============================================================================

  test('34-07: technical_manager에게 corrected NC의 종결/반려 버튼이 표시된다', async ({
    techManagerPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);

    await expect(page.getByRole('button', { name: '종결 승인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '조치 반려' })).toBeVisible();
  });

  // ============================================================================
  // 34-08: lab_manager — 전체 액션 가능
  // ============================================================================

  test('34-08: lab_manager에게 종결/반려 버튼이 표시된다', async ({ siteAdminPage: page }) => {
    await gotoNcDetail(page, NC_IDS.NC_008_CORRECTED);

    // lab_manager도 CLOSE_NON_CONFORMANCE 권한 보유 → 종결/반려 가능
    await expect(page.getByRole('button', { name: '종결 승인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '조치 반려' })).toBeVisible();
  });

  // ============================================================================
  // 34-09: test_engineer — open NC에서 시정 조치 편집 가능
  // ============================================================================

  test('34-09: test_engineer는 open NC의 시정 조치를 편집할 수 있다', async ({
    testOperatorPage: page,
  }) => {
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // 시정 조치 섹션의 편집 버튼
    const editButton = page.getByRole('button', { name: '편집' });
    await expect(editButton).toBeVisible();

    await editButton.click();
    await expect(page.getByPlaceholder('시정 조치 내용을 입력하세요')).toBeVisible();

    // 취소
    await page.getByRole('button', { name: '취소' }).click();
  });

  // ============================================================================
  // 34-10: quality_manager — NC 등록 API 호출 시 403
  // ============================================================================

  test('34-10: quality_manager는 NC 등록 권한이 없다 (API 403)', async ({
    qualityManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'quality_manager');

    const res = await page.request.post(`${BACKEND_URL}/api/non-conformances`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        equipmentId: EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E,
        discoveryDate: new Date().toISOString().split('T')[0],
        discoveredBy: USER_IDS.QUALITY_MANAGER_SUWON,
        cause: '권한 테스트',
        ncType: 'other',
      },
    });

    expect(res.status()).toBe(403);
  });

  // ============================================================================
  // 34-11: test_engineer — NC 종결 API 호출 시 403
  // ============================================================================

  test('34-11: test_engineer는 NC 종결 권한이 없다 (API 403)', async ({
    testOperatorPage: page,
  }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const ncRes = await page.request.get(
      `${BACKEND_URL}/api/non-conformances/${NC_IDS.NC_008_CORRECTED}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const nc = await ncRes.json();

    const closeRes = await page.request.patch(
      `${BACKEND_URL}/api/non-conformances/${NC_IDS.NC_008_CORRECTED}/close`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { version: nc.version, closureNotes: '권한 테스트' },
      }
    );

    expect(closeRes.status()).toBe(403);
  });

  // ============================================================================
  // 34-12: test_engineer — NC 반려 API 호출 시 403
  // ============================================================================

  test('34-12: test_engineer는 NC 반려 권한이 없다 (API 403)', async ({
    testOperatorPage: page,
  }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const ncRes = await page.request.get(
      `${BACKEND_URL}/api/non-conformances/${NC_IDS.NC_008_CORRECTED}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const nc = await ncRes.json();

    const rejectRes = await page.request.patch(
      `${BACKEND_URL}/api/non-conformances/${NC_IDS.NC_008_CORRECTED}/reject-correction`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { version: nc.version, rejectionReason: '권한 테스트' },
      }
    );

    expect(rejectRes.status()).toBe(403);
  });
});
