/**
 * WF-19d: 중간점검 등록 폼 — 직전 승인된 중간점검 prefill UI 검증
 *
 * Batch D (2026-04-12) 에서 도입된 기능:
 * InspectionFormDialog 가 열릴 때 동일 장비의 가장 최근 **approved** 중간점검의
 * items / resultSections 구조를 자동 복사하여 신규 점검 생성 속도를 높인다.
 *
 * 핵심 요구사항 (사용자 명확화 2026-04-12):
 *   "승인된 중간점검중에 가장 직전 중간점검을 prefill해야되는거야"
 *   → draft/pending/rejected 는 건너뛰고 `approvalStatus === 'approved'` 인
 *     가장 최근 점검만 prefill 소스로 사용.
 *
 * 검증 시나리오:
 *   1. approved 존재 → 자동 prefill (items + 자동 배지)
 *   2. 토글 off → items/sections 초기화
 *   3. approved 없음 (draft 만) → 토글 UI 자체 숨김
 *   4. approved + 그보다 최신 draft 공존 → draft 무시, approved items 사용
 *
 * @see apps/frontend/components/inspections/InspectionFormDialog.tsx
 * @see docs/procedure/양식/QP-18-03_중간점검표.md
 */

import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
import {
  createIntermediateInspection,
  submitIntermediateInspection,
  reviewIntermediateInspection,
  approveIntermediateInspection,
  resetIntermediateInspections,
  clearBackendCache,
  extractId,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_CALIBRATION_IDS, TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// wf-19c 가 SPECTRUM_ANALYZER_SUW_E 를 사용하므로 격리 위해 NETWORK_ANALYZER 사용
const WF_CALIBRATION_ID = TEST_CALIBRATION_IDS.CALIB_003;
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E;

/**
 * 파일 전체를 serial 로 실행 — 세 describe 블록이 같은 calibration 에 대해
 * seed/teardown 을 공유하므로 병렬 실행 시 afterAll 이 다음 beforeAll 을 파괴한다.
 * playwright fullyParallel: true 기본 동작 우회.
 */
test.describe.configure({ mode: 'serial' });

const today = () => new Date().toISOString().split('T')[0];

// 테스트에서 반복 사용하는 items (approved 로 승인할 대상)
const APPROVED_ITEMS = [
  {
    itemNumber: 1,
    checkItem: 'WF-19d 외관 검사',
    checkCriteria: '손상/마모 없음',
    checkResult: '정상',
    judgment: 'pass' as const,
  },
  {
    itemNumber: 2,
    checkItem: 'WF-19d RF 출력 검사',
    checkCriteria: 'CW Level ±1 dB',
    checkResult: '편차 0.2 dB',
    judgment: 'pass' as const,
  },
];

// Draft 로만 존재하는 items (prefill 대상이 되어서는 안 됨)
// judgment / checkResult 는 Zod schema 가 empty string 을 거부하므로 아예 생략
const DRAFT_ITEMS = [
  {
    itemNumber: 1,
    checkItem: 'WF-19d DRAFT 잘못된 항목',
    checkCriteria: '이 checkItem 은 prefill 되면 안 됨',
  },
];

/** 장비 상세 → 중간점검 탭 → "점검 기록 작성" 버튼 클릭 → 다이얼로그 진입 */
async function openInspectionDialog(page: Page): Promise<void> {
  await page.goto(`${FRONTEND_ROUTES.EQUIPMENT.DETAIL(WF_EQUIPMENT_ID)}?tab=inspection`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // 중간점검 카드 섹션이 hydrate 되기를 기다림 (카드 제목 "중간점검 기록")
  await expect(page.getByRole('heading', { name: /중간점검 기록/ })).toBeVisible();

  await page.getByRole('button', { name: '점검 기록 작성' }).click();
  // 다이얼로그 제목 기준 대기 — i18n "중간점검 기록 작성"
  await expect(page.getByRole('dialog')).toBeVisible();
}

/** approvals 3단계: TE 제출 → TM 검토 → LM 승인 */
async function createApprovedInspection(page: Page): Promise<string> {
  const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
    inspectionDate: today(),
    classification: 'calibrated',
    inspectionCycle: '6개월',
    calibrationValidityPeriod: '1년',
    overallResult: 'pass',
    remarks: 'WF-19d approved base inspection',
    items: APPROVED_ITEMS,
  });
  const id = extractId(body);
  await submitIntermediateInspection(page, id, 'test_engineer');
  await reviewIntermediateInspection(page, id, 'technical_manager');
  await approveIntermediateInspection(page, id, 'lab_manager');
  await clearBackendCache();
  return id;
}

/** draft 만 생성 (승인 없음) */
async function createDraftInspection(page: Page, items = DRAFT_ITEMS): Promise<string> {
  const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
    inspectionDate: today(),
    classification: 'calibrated',
    overallResult: 'pass',
    items,
  });
  await clearBackendCache();
  return extractId(body);
}

// ============================================================================
// Scenario 1 + 2: approved 존재 → 자동 prefill + 토글 off 초기화
// ============================================================================

test.describe('WF-19d-1: approved 중간점검 존재 → 자동 prefill', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(WF_CALIBRATION_ID);
      await createApprovedInspection(page);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await cleanupSharedPool();
  });

  test('S1: 다이얼로그 오픈 시 토글 ON + items 자동 prefill + "자동" 배지 노출', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);

    const dialog = page.getByRole('dialog');

    // 토글 체크박스: 기본 check 상태
    const toggle = dialog.getByLabel('직전 승인된 중간점검에서 항목·결과 섹션 불러오기');
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeChecked();

    // "자동" 배지 — 여러 prefill 필드가 있을 수 있으므로 .first() 허용
    await expect(dialog.getByText('자동').first()).toBeVisible();

    // items 가 approved inspection 의 것과 일치해야 함
    // InspectionFormDialog 는 item 카드를 Input 으로 렌더 — value 로 검증
    await expect(dialog.locator('input[value="WF-19d 외관 검사"]')).toBeVisible();
    await expect(dialog.locator('input[value="WF-19d RF 출력 검사"]')).toBeVisible();
    await expect(dialog.locator('input[value="손상/마모 없음"]')).toBeVisible();

    // checkResult 와 judgment 는 비워져 있어야 함 (다음 측정 입력용)
    // "정상" value 를 가진 input 이 존재하면 안 됨
    await expect(dialog.locator('input[value="정상"]')).toHaveCount(0);
    await expect(dialog.locator('input[value="편차 0.2 dB"]')).toHaveCount(0);
  });

  test('S2: 토글 off → items 와 result sections 초기화', async ({ testOperatorPage: page }) => {
    await openInspectionDialog(page);

    const dialog = page.getByRole('dialog');

    // prefill 확인 후 off
    const toggle = dialog.getByLabel('직전 승인된 중간점검에서 항목·결과 섹션 불러오기');
    await expect(toggle).toBeChecked();
    // shadcn Checkbox 는 button[role="checkbox"] — label htmlFor 로 연결되어 있으므로 클릭 가능
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // 복사된 items 가 전부 사라졌는지: prefilled checkItem input 이 더 이상 없음
    await expect(dialog.locator('input[value="WF-19d 외관 검사"]')).toHaveCount(0);
    await expect(dialog.locator('input[value="WF-19d RF 출력 검사"]')).toHaveCount(0);
  });
});

// ============================================================================
// Scenario 3: approved 없음 → 토글 UI 숨김
// ============================================================================

test.describe('WF-19d-2: approved 없음 → 토글 UI 자체 숨김', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      // draft 만 1건 존재 (approved 없음)
      await resetIntermediateInspections(WF_CALIBRATION_ID);
      await createDraftInspection(page);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await cleanupSharedPool();
  });

  test('S3: approved 없음 → 토글 체크박스 노출되지 않음', async ({ testOperatorPage: page }) => {
    await openInspectionDialog(page);

    const dialog = page.getByRole('dialog');

    // 토글 UI 는 approved 가 존재할 때만 렌더 — count 0
    await expect(dialog.getByLabel('직전 승인된 중간점검에서 항목·결과 섹션 불러오기')).toHaveCount(
      0
    );

    // 신규 생성 폼은 빈 items 배열로 시작 — 기존 DRAFT_ITEMS checkItem 이 보이면 안 됨
    await expect(dialog.locator('input[value="WF-19d DRAFT 잘못된 항목"]')).toHaveCount(0);
  });
});

// ============================================================================
// Scenario 4: approved + newer draft 공존 → draft 스킵, approved items 사용 (핵심 회귀)
// ============================================================================

test.describe('WF-19d-3: approved + 더 최신 draft 공존 → approved 만 prefill 소스', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(WF_CALIBRATION_ID);
      // 1) approved 먼저 생성 (createdAt 이 앞서게 됨)
      await createApprovedInspection(page);
      // 2) 그 뒤에 draft 생성 — DESC createdAt 상 [0] 이 draft, [1] 이 approved.
      //    .find(approved) 가 draft 를 건너뛰고 approved 를 선택해야 한다.
      await createDraftInspection(page);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await cleanupSharedPool();
  });

  test('S4: draft 가 더 최신이어도 prefill 은 approved items 를 사용', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);

    const dialog = page.getByRole('dialog');

    // 토글 노출 (approved 가 있으므로)
    await expect(
      dialog.getByLabel('직전 승인된 중간점검에서 항목·결과 섹션 불러오기')
    ).toBeVisible();

    // 반드시 **approved 의** items 가 prefill 되어야 한다
    await expect(dialog.locator('input[value="WF-19d 외관 검사"]')).toBeVisible();
    await expect(dialog.locator('input[value="WF-19d RF 출력 검사"]')).toBeVisible();

    // 절대 draft 의 items 가 prefill 되어서는 안 된다 (핵심 회귀 가드)
    await expect(dialog.locator('input[value="WF-19d DRAFT 잘못된 항목"]')).toHaveCount(0);
    await expect(dialog.locator('input[value="이 checkItem 은 prefill 되면 안 됨"]')).toHaveCount(
      0
    );
  });
});
