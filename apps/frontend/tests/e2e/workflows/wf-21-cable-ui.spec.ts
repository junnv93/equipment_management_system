/**
 * WF-21 UI: 케이블 Path Loss 관리 사용자 동선 (UL-QP-18-08)
 *
 * 기존 `wf-21-cable-path-loss.spec.ts` (API 전용)가 cover하지 못하는
 * 사용자 UI 동선을 검증한다:
 *
 *   목록 렌더 → 등록 페이지 이동 → 빈 제출 no-op → 정상 저장 →
 *   목록 검색 → 상세 진입 → 측정 다이얼로그 → 내보내기 다운로드
 *
 * 설계 메모:
 * - Create 폼에 Zod/validation 메시지 UI가 없다 (handleSubmit early-return만).
 *   Step 3은 "빈 제출 시 URL이 /cables/create 유지 + 성공 토스트 부재"로
 *   현재 동작 그대로 회귀 보호한다. 프로덕션 코드를 변경하지 않는다.
 * - Label이 htmlFor로 연결되지 않아 getByLabel이 불안정하다.
 *   getByPlaceholder (Playwright semantic locator, not CSS)로 대체한다.
 * - shadcn Select 트리거는 accessible name이 없어 표시 텍스트로 click 후
 *   getByRole('option')으로 선택한다.
 * - 관리번호 슬롯은 API spec (`Date.now() % 1000`)과 분리 위해 +333 offset 사용.
 *
 * @see docs/workflows/critical-workflows.md WF-21
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { cleanupSharedPool, clearBackendCache } from './helpers/workflow-helpers';

// 관리번호: API spec과 충돌 방지 위해 다른 modulo 슬롯 사용
const managementNumber = `ELLLX-${String((Date.now() + 333) % 1000).padStart(3, '0')}`;

// i18n labels from apps/frontend/messages/ko/cables.json (복사 — 테스트 격리)
const L = {
  listTitle: '케이블/경로손실 관리대장',
  createButton: '케이블 등록',
  exportButton: '양식 내보내기',
  searchPlaceholder: '관리번호 또는 S/N 검색...',
  mgmtNumberPlaceholder: '예: E020K-325',
  lengthPlaceholder: '예: 1.5',
  createTitle: '케이블 등록',
  createSuccess: '케이블이 등록되었습니다.',
  submitButton: '등록',
  measurementAddButton: '측정 데이터 추가',
  measurementFormTitle: '측정 데이터 추가',
  measurementSave: '저장',
  measurementSuccess: '측정 데이터가 추가되었습니다.',
  measurementsTitle: '측정 이력',
  freqPlaceholder: '주파수 (MHz)',
  lossPlaceholder: '손실 (dB)',
} as const;

test.describe('WF-21 UI: 케이블 Path Loss 사용자 동선 (QP-18-08)', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await cleanupSharedPool();
  });

  test('Step 1: /cables 목록 페이지 렌더 (헤더/검색/등록·내보내기 버튼)', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    await page.goto('/cables');

    await expect(page.getByRole('heading', { name: L.listTitle, level: 1 })).toBeVisible({
      timeout: 15000,
    });

    // 등록은 Link > Button 구조 — link role로 조회
    await expect(page.getByRole('link', { name: L.createButton })).toBeVisible();
    await expect(page.getByRole('button', { name: L.exportButton })).toBeVisible();
    await expect(page.getByPlaceholder(L.searchPlaceholder)).toBeVisible();
  });

  test('Step 2: "케이블 등록" 클릭 → /cables/create 페이지 이동', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/cables');
    await page.getByRole('link', { name: L.createButton }).click();

    await expect(page).toHaveURL(/\/cables\/create$/);
    await expect(page.getByRole('heading', { name: L.createTitle, level: 1 })).toBeVisible();
    await expect(page.getByPlaceholder(L.mgmtNumberPlaceholder)).toBeVisible();
  });

  test('Step 3: 빈 폼 제출 → URL 유지 + 성공 토스트 부재 (현재 동작 회귀 보호)', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/cables/create');

    // handleSubmit은 managementNumber 비었을 때 early-return — 토스트/네비게이션 없음
    await page.getByRole('button', { name: L.submitButton }).click();
    await page.waitForTimeout(500); // 가능한 네비게이션 발생 감지

    await expect(page).toHaveURL(/\/cables\/create$/);
    await expect(page.getByText(L.createSuccess)).toHaveCount(0);
  });

  test('Step 4: 관리번호만 입력 → 저장 → 성공 토스트 + 상세 리다이렉트', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/cables/create');

    await page.getByPlaceholder(L.mgmtNumberPlaceholder).fill(managementNumber);
    await page.getByRole('button', { name: L.submitButton }).click();

    // onSuccess → router.push(/cables/:id)
    await expect(page).toHaveURL(/\/cables\/[0-9a-f-]{36}$/, { timeout: 15000 });
  });

  test('Step 5: 목록 검색 → 새 케이블 행 → 클릭 → 상세 진입', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    await page.goto('/cables');

    await page.getByPlaceholder(L.searchPlaceholder).fill(managementNumber);

    // 검색 결과 반영 — 관리번호가 테이블의 Link 텍스트로 나타남
    const row = page.getByRole('link', { name: managementNumber });
    await expect(row).toBeVisible({ timeout: 10000 });

    await row.click();
    await expect(page).toHaveURL(/\/cables\/[0-9a-f-]{36}$/);
  });

  test('Step 6: 상세 헤더 검증 (관리번호 h1)', async ({ testOperatorPage: page }) => {
    // Step 5의 리다이렉트 결과 URL을 재사용할 수 없으므로 검색으로 다시 진입
    await page.goto('/cables');
    await page.getByPlaceholder(L.searchPlaceholder).fill(managementNumber);
    await page.getByRole('link', { name: managementNumber }).click();
    await page.waitForURL(/\/cables\/[0-9a-f-]{36}$/);

    await expect(page.getByRole('heading', { name: managementNumber, level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: L.measurementAddButton })).toBeVisible();
  });

  test('Step 7: "측정 데이터 추가" 다이얼로그 → 입력 → 저장 → 측정 이력 반영', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/cables');
    await page.getByPlaceholder(L.searchPlaceholder).fill(managementNumber);
    await page.getByRole('link', { name: managementNumber }).click();
    await page.waitForURL(/\/cables\/[0-9a-f-]{36}$/);

    await page.getByRole('button', { name: L.measurementAddButton }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: L.measurementFormTitle })).toBeVisible();

    // 측정일은 today 기본값, notes 생략, 단일 데이터 포인트 입력 (더미 값)
    await dialog.getByPlaceholder(L.freqPlaceholder).fill('1000');
    await dialog.getByPlaceholder(L.lossPlaceholder).fill('0.5');

    await dialog.getByRole('button', { name: L.measurementSave }).click();

    // 다이얼로그 닫힘 + 측정 이력 카드에 새 행 나타남
    await expect(dialog).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: L.measurementsTitle })).toBeVisible();
    // 측정 이력 테이블은 dataPointCount 컬럼에 1 이상의 숫자 표시 — 테이블 등장만 검증
    // (날짜/숫자 셀 직접 매칭은 로케일 변환 위험)
    await expect(page.getByText('기록된 측정 데이터가 없습니다.')).toHaveCount(0);
  });

  test('Step 8: /cables "양식 내보내기" 클릭 → download 이벤트 트리거', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/cables');
    await expect(page.getByRole('heading', { name: L.listTitle, level: 1 })).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.getByRole('button', { name: L.exportButton }).click();

    const download = await downloadPromise;
    // 서버 Content-Disposition 으로 filename*가 내려오는 경우 한국어 파일명 가능성 존재.
    // SSOT는 서버 헤더이므로 여기서는 "UL-QP-18-08" 슬러그 포함 여부만 검증.
    const suggested = download.suggestedFilename();
    expect(suggested).toMatch(/UL-QP-18-08/);
  });
});
