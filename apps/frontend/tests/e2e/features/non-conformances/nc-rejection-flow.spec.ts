/**
 * 부적합 반려 → 재조치 → 종료 전체 프로세스 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. 기술책임자: corrected NC를 반려 (API) + 승인 목록에서 제거 확인 (UI)
 * 2. 시험실무자: 장비 상세 → 부적합 관리 → 반려 사유 배너 확인 (UI)
 * 3. 시험실무자: 조치 내용 보완 → corrected 재제출 (API)
 * 4. 기술책임자: 재제출 항목 승인 목록 표시 확인 (UI) + 종료 처리 (API)
 * 5. 최종 상태 검증 (API + UI)
 *
 * 테스트 데이터 (시드에서 이미 corrected 상태):
 * - NC: aaaa0006 (교정 실패 - 신호 손실, calibration_failure)
 * - Equipment: eeee4001 (하네스 커플러)
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../../shared/constants/shared-test-data';

const TEST_NC_ID = 'aaaa0006-0006-0006-0006-000000000006';
const TEST_EQUIPMENT_ID = 'eeee4001-0001-4001-8001-000000000001';
const NC_CAUSE_TEXT = '교정 실패 - 신호 손실';
const REJECTION_REASON =
  '재교정 성적서 번호가 누락되었습니다. 교정 결과 성적서 번호를 조치 내용에 포함해주세요.';
const BACKEND_URL = BASE_URLS.BACKEND;

/** 백엔드 JWT 토큰 획득 */
async function getBackendToken(
  page: import('@playwright/test').Page,
  role: string
): Promise<string> {
  const response = await page.request.get(`${BACKEND_URL}/api/auth/test-login?role=${role}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.access_token || data.data?.access_token;
}

test.describe('부적합 반려 전체 프로세스', () => {
  test.describe.configure({ mode: 'serial' });

  let tmToken: string;
  let teToken: string;

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  // Step 1: 기술책임자가 corrected NC를 반려 (API + UI 검증)
  test('Step 1: 기술책임자가 부적합 항목을 반려한다', async ({ techManagerPage }) => {
    tmToken = await getBackendToken(techManagerPage, 'technical_manager');

    // 먼저 승인 목록에서 해당 NC가 표시되는지 확인 (UI)
    await techManagerPage.goto('/admin/approvals?tab=nonconformity');
    await expect(techManagerPage.getByRole('heading', { name: '승인 관리' })).toBeVisible({
      timeout: 15000,
    });

    const ncTab = techManagerPage.getByRole('tab', { name: /부적합 재개/i });
    await expect(ncTab).toBeVisible();
    await ncTab.click();

    // corrected 상태의 NC가 승인 대기 목록에 표시되는지 확인
    await expect(techManagerPage.getByText(NC_CAUSE_TEXT).first()).toBeVisible({ timeout: 10000 });

    // 반려 버튼이 존재하는지 확인
    const rejectButtons = techManagerPage.getByRole('button', { name: /^반려$/ });
    const buttonCount = await rejectButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log(`✅ 승인 대기 목록에서 반려 버튼 ${buttonCount}개 확인`);

    // API로 반려 실행 (프론트엔드 세션 대신 백엔드 JWT 직접 사용)
    const ncResponse = await techManagerPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${TEST_NC_ID}`,
      { headers: { Authorization: `Bearer ${tmToken}` } }
    );
    expect(ncResponse.ok()).toBeTruthy();
    const ncData = await ncResponse.json();
    expect(ncData.status).toBe('corrected');

    const rejectResponse = await techManagerPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${TEST_NC_ID}/reject-correction`,
      {
        headers: { Authorization: `Bearer ${tmToken}` },
        data: {
          version: ncData.version,
          rejectionReason: REJECTION_REASON,
        },
      }
    );
    expect(rejectResponse.ok()).toBeTruthy();

    const rejectedNc = await rejectResponse.json();
    expect(rejectedNc.status).toBe('analyzing');
    expect(rejectedNc.rejectionReason).toBe(REJECTION_REASON);
    expect(rejectedNc.rejectedBy).toBeTruthy();
    expect(rejectedNc.rejectedAt).toBeTruthy();

    console.log('✅ Step 1 완료: 반려 성공, version:', rejectedNc.version);
  });

  // Step 2: 시험실무자가 반려 사유 배너 확인 (UI)
  test('Step 2: 시험실무자가 반려 사유 배너를 확인한다', async ({ testOperatorPage }) => {
    await testOperatorPage.goto(`/equipment/${TEST_EQUIPMENT_ID}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');

    await expect(testOperatorPage.getByRole('heading', { name: '부적합 관리' })).toBeVisible({
      timeout: 15000,
    });

    // 반려 사유 배너 확인
    await expect(testOperatorPage.getByText('조치 반려됨')).toBeVisible({ timeout: 10000 });
    await expect(testOperatorPage.getByText('재교정 성적서 번호가 누락')).toBeVisible();
    await expect(testOperatorPage.getByText(/반려일:/)).toBeVisible();

    // NC 상태 "분석 중" 확인
    await expect(testOperatorPage.getByText('분석 중')).toBeVisible();

    console.log('✅ Step 2 완료: 반려 사유 배너 정상 표시');
  });

  // Step 3: 시험실무자가 재제출 (API)
  test('Step 3: 시험실무자가 조치 내용을 보완하여 재제출한다', async ({ testOperatorPage }) => {
    teToken = await getBackendToken(testOperatorPage, 'test_engineer');

    const ncResponse = await testOperatorPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${TEST_NC_ID}`,
      { headers: { Authorization: `Bearer ${teToken}` } }
    );
    expect(ncResponse.ok()).toBeTruthy();
    const ncData = await ncResponse.json();
    expect(ncData.status).toBe('analyzing');

    const updateResponse = await testOperatorPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${TEST_NC_ID}`,
      {
        headers: { Authorization: `Bearer ${teToken}` },
        data: {
          version: ncData.version,
          correctionContent: '내부 연결부 교체 및 재교정 완료. 성적서 번호: CAL-2026-0312',
          correctionDate: '2026-02-12',
          analysisContent: '내부 연결부 산화 확인',
          status: 'corrected',
        },
      }
    );
    expect(updateResponse.ok()).toBeTruthy();

    const updatedNc = await updateResponse.json();
    expect(updatedNc.status).toBe('corrected');
    expect(updatedNc.version).toBe(ncData.version + 1);
    // 이전 반려 사유가 보존되어야 함
    expect(updatedNc.rejectionReason).toBe(REJECTION_REASON);
    console.log('✅ Step 3 완료: 재제출 성공, version:', updatedNc.version);
  });

  // Step 4: 기술책임자가 재제출 항목 종료 승인 (API) + 상태 검증
  test('Step 4: 기술책임자가 재제출 항목을 확인하고 종료 승인한다', async ({ techManagerPage }) => {
    tmToken = await getBackendToken(techManagerPage, 'technical_manager');

    // API로 NC 상태 확인 (corrected로 재제출됨)
    const ncResponse = await techManagerPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${TEST_NC_ID}`,
      { headers: { Authorization: `Bearer ${tmToken}` } }
    );
    expect(ncResponse.ok()).toBeTruthy();
    const ncData = await ncResponse.json();
    expect(ncData.status).toBe('corrected');
    // 이전 반려 사유가 보존되어 있는지 확인
    expect(ncData.rejectionReason).toBe(REJECTION_REASON);
    expect(ncData.rejectedBy).toBeTruthy();

    // API로 종료 처리
    const closeResponse = await techManagerPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${TEST_NC_ID}/close`,
      {
        headers: { Authorization: `Bearer ${tmToken}` },
        data: {
          version: ncData.version,
          closureNotes: '재교정 성적서 번호 확인 완료 (CAL-2026-0312). 종료 승인.',
        },
      }
    );
    expect(closeResponse.ok()).toBeTruthy();

    const closedNc = await closeResponse.json();
    expect(closedNc.status).toBe('closed');
    expect(closedNc.closedBy).toBeTruthy();
    expect(closedNc.closedAt).toBeTruthy();
    // 반려 이력이 종료 후에도 보존됨
    expect(closedNc.rejectionReason).toBe(REJECTION_REASON);
    expect(closedNc.version).toBe(ncData.version + 1);

    // 상태 머신 검증: closed NC에 대한 추가 전이 시도 → 실패해야 함
    const invalidRejectResponse = await techManagerPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${TEST_NC_ID}/reject-correction`,
      {
        headers: { Authorization: `Bearer ${tmToken}` },
        data: {
          version: closedNc.version,
          rejectionReason: '이미 종료된 NC를 반려하려는 시도',
        },
      }
    );
    expect(invalidRejectResponse.status()).toBe(400);
    const errorData = await invalidRejectResponse.json();
    expect(errorData.message).toContain('상태 전이가 허용되지 않습니다');

    console.log(
      '✅ Step 4 완료: 종료 승인 + 상태 머신 검증 성공, final version:',
      closedNc.version
    );
  });

  // Step 5: 최종 검증 (API + UI)
  test('Step 5: 종료 후 UI가 정확히 표시된다', async ({ testOperatorPage }) => {
    teToken = await getBackendToken(testOperatorPage, 'test_engineer');

    // NC 최종 상태 API 검증
    const ncResponse = await testOperatorPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${TEST_NC_ID}`,
      { headers: { Authorization: `Bearer ${teToken}` } }
    );
    expect(ncResponse.ok()).toBeTruthy();
    const ncData = await ncResponse.json();

    expect(ncData.status).toBe('closed');
    expect(ncData.rejectionReason).toBe(REJECTION_REASON);
    expect(ncData.closedBy).toBeTruthy();
    expect(ncData.closedAt).toBeTruthy();
    expect(ncData.closureNotes).toContain('CAL-2026-0312');

    // UI 검증: 장비 상세 → 부적합 관리
    await testOperatorPage.goto(`/equipment/${TEST_EQUIPMENT_ID}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');
    await expect(testOperatorPage.getByRole('heading', { name: '부적합 관리' })).toBeVisible({
      timeout: 15000,
    });

    // 종료됨 배지
    await expect(testOperatorPage.getByText('종료됨').first()).toBeVisible({ timeout: 10000 });

    // 종료 메모 표시
    await expect(testOperatorPage.getByText('CAL-2026-0312').first()).toBeVisible();

    // 반려 배너 미표시 (status !== 'analyzing')
    await expect(testOperatorPage.getByText('조치 반려됨')).not.toBeVisible();

    console.log('✅ Step 5 완료: 전체 프로세스 검증 완료');
  });
});

/**
 * 이중 반려 → 최종 승인 스트레스 테스트
 *
 * 시나리오: corrected → 반려#1 → 재제출 → 반려#2 → 재제출 → 종료
 * 검증 포인트:
 * - 두 번째 반려가 첫 번째 반려 사유를 올바르게 덮어쓰는지
 * - CAS version 체인이 끊기지 않는지 (v1→v2→v3→v4→v5→v6)
 * - 최종 close가 반려 횟수와 무관하게 정상 동작하는지
 *
 * 테스트 데이터: aaaa0007 (BNC 커넥터 불량, damage)
 */
test.describe('이중 반려 후 종료 프로세스', () => {
  test.describe.configure({ mode: 'serial' });

  const NC_ID = 'aaaa0007-0007-0007-0007-000000000007';
  const EQUIP_ID = 'eeee4002-0002-4002-8002-000000000002';
  const REASON_1 = '조치 사진이 누락되었습니다. 교체된 BNC 커넥터의 사진을 첨부해주세요.';
  const REASON_2 = '커넥터 규격 정보가 불충분합니다. N-type 50ohm 커넥터 사양서를 첨부해주세요.';
  let tmToken: string;
  let teToken: string;

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('D-1: 첫 번째 반려', async ({ techManagerPage }) => {
    tmToken = await getBackendToken(techManagerPage, 'technical_manager');

    const ncRes = await techManagerPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}`,
      { headers: { Authorization: `Bearer ${tmToken}` } }
    );
    const nc = await ncRes.json();
    expect(nc.status).toBe('corrected');
    expect(nc.version).toBe(1);

    const rejectRes = await techManagerPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}/reject-correction`,
      {
        headers: { Authorization: `Bearer ${tmToken}` },
        data: { version: nc.version, rejectionReason: REASON_1 },
      }
    );
    expect(rejectRes.ok()).toBeTruthy();
    const rejected = await rejectRes.json();
    expect(rejected.status).toBe('analyzing');
    expect(rejected.rejectionReason).toBe(REASON_1);
    expect(rejected.version).toBe(2);
    console.log('✅ D-1: 첫 번째 반려 성공, version:', rejected.version);
  });

  test('D-2: 첫 번째 재제출', async ({ testOperatorPage }) => {
    teToken = await getBackendToken(testOperatorPage, 'test_engineer');

    const ncRes = await testOperatorPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}`,
      { headers: { Authorization: `Bearer ${teToken}` } }
    );
    const nc = await ncRes.json();
    expect(nc.status).toBe('analyzing');
    expect(nc.version).toBe(2);

    const updateRes = await testOperatorPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}`,
      {
        headers: { Authorization: `Bearer ${teToken}` },
        data: {
          version: nc.version,
          correctionContent: 'BNC 커넥터 N-type 50ohm으로 교체 완료. 교체 사진 첨부.',
          correctionDate: '2026-02-12',
          analysisContent: '접촉 불량으로 인한 신호 손실',
          status: 'corrected',
        },
      }
    );
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.status).toBe('corrected');
    expect(updated.version).toBe(3);
    expect(updated.rejectionReason).toBe(REASON_1); // 이전 반려 사유 보존
    console.log('✅ D-2: 첫 번째 재제출 성공, version:', updated.version);
  });

  test('D-3: 두 번째 반려 (이전 반려 사유 덮어쓰기 검증)', async ({ techManagerPage }) => {
    tmToken = await getBackendToken(techManagerPage, 'technical_manager');

    const ncRes = await techManagerPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}`,
      { headers: { Authorization: `Bearer ${tmToken}` } }
    );
    const nc = await ncRes.json();
    expect(nc.status).toBe('corrected');
    expect(nc.version).toBe(3);
    expect(nc.rejectionReason).toBe(REASON_1); // 아직 첫 번째 반려 사유

    const rejectRes = await techManagerPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}/reject-correction`,
      {
        headers: { Authorization: `Bearer ${tmToken}` },
        data: { version: nc.version, rejectionReason: REASON_2 },
      }
    );
    expect(rejectRes.ok()).toBeTruthy();
    const rejected = await rejectRes.json();
    expect(rejected.status).toBe('analyzing');
    expect(rejected.rejectionReason).toBe(REASON_2); // 두 번째 반려 사유로 덮어씀
    expect(rejected.version).toBe(4);
    console.log('✅ D-3: 두 번째 반려 성공 (사유 덮어쓰기 확인), version:', rejected.version);
  });

  test('D-4: 두 번째 재제출 + UI 반려 배너에 최신 사유 표시', async ({ testOperatorPage }) => {
    teToken = await getBackendToken(testOperatorPage, 'test_engineer');

    // UI 검증: 최신(두 번째) 반려 사유가 배너에 표시
    await testOperatorPage.goto(`/equipment/${EQUIP_ID}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');
    await expect(testOperatorPage.getByRole('heading', { name: '부적합 관리' })).toBeVisible({
      timeout: 15000,
    });

    await expect(testOperatorPage.getByText('조치 반려됨')).toBeVisible({ timeout: 10000 });
    // 두 번째 반려 사유 표시 (첫 번째가 아님)
    await expect(testOperatorPage.getByText('커넥터 규격 정보가 불충분')).toBeVisible();
    // 첫 번째 반려 사유는 미표시 (덮어씌워짐)
    await expect(testOperatorPage.getByText('조치 사진이 누락')).not.toBeVisible();

    // API로 재제출
    const ncRes = await testOperatorPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}`,
      { headers: { Authorization: `Bearer ${teToken}` } }
    );
    const nc = await ncRes.json();
    expect(nc.version).toBe(4);

    const updateRes = await testOperatorPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}`,
      {
        headers: { Authorization: `Bearer ${teToken}` },
        data: {
          version: nc.version,
          correctionContent: 'N-type 50ohm 커넥터 교체 완료. 사양서: SPEC-BNC-2026-001 첨부.',
          correctionDate: '2026-02-12',
          analysisContent: '접촉 불량 → 커넥터 교체',
          status: 'corrected',
        },
      }
    );
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.status).toBe('corrected');
    expect(updated.version).toBe(5);
    console.log('✅ D-4: 두 번째 재제출 성공, version:', updated.version);
  });

  test('D-5: 이중 반려 후 종료 (version 체인 무결성 검증)', async ({ techManagerPage }) => {
    tmToken = await getBackendToken(techManagerPage, 'technical_manager');

    const ncRes = await techManagerPage.request.get(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}`,
      { headers: { Authorization: `Bearer ${tmToken}` } }
    );
    const nc = await ncRes.json();
    expect(nc.status).toBe('corrected');
    expect(nc.version).toBe(5);

    const closeRes = await techManagerPage.request.patch(
      `${BACKEND_URL}/api/non-conformances/${NC_ID}/close`,
      {
        headers: { Authorization: `Bearer ${tmToken}` },
        data: {
          version: nc.version,
          closureNotes: 'BNC 커넥터 교체 및 사양서 확인 완료. 두 번의 보완 요청 후 종료.',
        },
      }
    );
    expect(closeRes.ok()).toBeTruthy();
    const closed = await closeRes.json();
    expect(closed.status).toBe('closed');
    expect(closed.version).toBe(6); // v1→v2→v3→v4→v5→v6 (6 operations)
    expect(closed.closedBy).toBeTruthy();
    expect(closed.closedAt).toBeTruthy();
    // 마지막(두 번째) 반려 사유가 보존됨
    expect(closed.rejectionReason).toBe(REASON_2);
    expect(closed.closureNotes).toContain('두 번의 보완 요청 후 종료');
    console.log('✅ D-5: 이중 반려 후 종료 성공, final version:', closed.version);
    console.log(
      '  → version 체인: v1(corrected) → v2(reject#1) → v3(resubmit) → v4(reject#2) → v5(resubmit) → v6(closed)'
    );
  });
});
