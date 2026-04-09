/**
 * WF-Export-UI: 양식 export 사용자 클릭 동선 가드 (UL-QP-18-NN)
 *
 * 기존 wf-19b/20b 가 `page.request.get` API 직접 호출만 검증하는 것과 보완 관계.
 * 본 spec 은 `expectFileDownload` SSOT helper 위에 구축되어 사용자 시점의 회귀를 잡는다:
 *
 *   1. 권한 가드 (Permission.EXPORT_REPORTS) 가 실제로 버튼 노출을 게이팅하는가
 *   2. 클릭 → blob URL `<a download>` 트리거 → Playwright `download` 이벤트 발화
 *   3. 서버 Content-Disposition `filename*=UTF-8''...` 가 한국어/슬러그 파일명 보존
 *   4. .docx / .xlsx 확장자 유효성
 *
 * 새 양식 export 버튼이 추가될 때마다 본 describe 블록에 한 케이스만 추가하면
 * helper 가 동일 가드를 자동 적용한다 — 도메인별 spec 복제 필요 없음.
 *
 * 커버 양식 (현재):
 *   - UL-QP-18-01: 장비 관리대장 (`EquipmentPageHeader`)
 *   - UL-QP-18-03: 중간점검표 (`IntermediateInspectionList`, 승인 후 행별 버튼)
 *   - UL-QP-18-05: 자체점검표 (`SelfInspectionTab`, 탭 헤더 버튼)
 *   - UL-QP-18-06: 장비 반·출입 확인서 (`CheckoutDetailClient`, 상태 화이트리스트)
 *   - UL-QP-18-07: 시험용 SW 관리대장 (`TestSoftwareListContent`)
 *   - UL-QP-18-08: 케이블 관리대장 (`CableListContent` — 기존 wf-21-cable-ui 와 중복 허용,
 *     SSOT helper 회귀 가드)
 *   - UL-QP-18-09: 시험 소프트웨어 유효성확인 (`ValidationDetailContent` — validation 상세 진입 후 클릭)
 *   - UL-QP-18-10: 공용장비 사용/반납 확인서 (`EquipmentImportDetail`)
 *
 * 미커버 (UI 진입점 부재):
 *   - UL-QP-18-11 보정인자 및 파라미터 관리대장 — `implemented: false` (backend exporter 미구현).
 *
 * @see apps/frontend/tests/e2e/shared/helpers/download-helpers.ts (SSOT helper)
 * @see .claude/exec-plans/tech-debt-tracker.md L23
 */

import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { test, expect } from '../shared/fixtures/auth.fixture';
import { expectFileDownload } from '../shared/helpers/download-helpers';
import {
  createTestSoftware,
  createSoftwareValidation,
  createIntermediateInspection,
  submitIntermediateInspection,
  reviewIntermediateInspection,
  approveIntermediateInspection,
  createSelfInspection,
  createEquipmentImport,
  approveEquipmentImport,
  resetIntermediateInspections,
  resetSelfInspections,
  clearBackendCache,
  extractId,
} from './helpers/workflow-helpers';
import {
  TEST_CALIBRATION_IDS,
  TEST_EQUIPMENT_IDS,
  TEST_TEAM_IDS,
} from '../shared/constants/shared-test-data';
import { CHECKOUT_009_ID } from '../shared/constants/test-checkout-ids';

test.describe('WF-Export-UI: 양식 export 사용자 클릭 동선', () => {
  test.describe.configure({ mode: 'parallel' });

  test('QP-18-01 장비 관리대장 — testEngineer 클릭 → docx 다운로드 + 파일명 가드', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/equipment');
    // 헤더 렌더 대기 — 권한 게이팅된 export 버튼이 hydrate 되어야 함
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '관리대장 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    // SSOT: 서버 Content-Disposition 헤더가 파일명 결정.
    // mojibake (e.g. "ìž¥ë¹„") 회귀를 잡기 위해 슬러그 + 확장자 동시 매칭.
    expect(download.suggestedFilename()).toMatch(/UL-QP-18-01.*\.(docx|xlsx)$/);
  });

  test('QP-18-07 시험용 SW 관리대장 — testEngineer 클릭 → 다운로드 + 파일명 가드', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/software');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '관리대장 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-07.*\.(docx|xlsx)$/);
  });

  test('QP-18-08 케이블 관리대장 — testEngineer 클릭 → 다운로드 + 파일명 가드', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/cables');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '양식 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-08.*\.(docx|xlsx)$/);
  });

  test('QP-18-09 시험 SW 유효성확인 — labManager 클릭 → 다운로드 + 파일명 가드', async ({
    siteAdminPage: page,
  }) => {
    // 사전 준비: validation 상세 페이지 진입점이 필요하므로 API 로 SW + validation 생성.
    // QP-18-09 export 는 site 단위 리소스 — team 스코프 사용자(test_engineer, technical_manager)는
    // form-template-export.service:1063 에서 SCOPE_RESOURCE_MISMATCH 로 차단된다.
    // site 스코프 role(lab_manager) 또는 all 스코프(quality_manager, system_admin) 필요.
    // 본 테스트는 lab_manager(siteAdminPage) 로 진입한다.
    // 병렬 브라우저 실행 시 name 충돌 방지 — UUID 접미사.
    const software = await createTestSoftware(
      page,
      {
        name: `WF Export UI QP-18-09 ${crypto.randomUUID()}`,
        requiresValidation: true,
        site: 'suwon', // lab_manager(suwon) 이 export 할 수 있도록 동일 site
      },
      'lab_manager'
    );
    const softwareId = extractId(software);
    const validation = await createSoftwareValidation(
      page,
      softwareId,
      'vendor',
      {},
      'lab_manager'
    );
    const validationId = extractId(validation);

    await page.goto(FRONTEND_ROUTES.SOFTWARE.VALIDATION_DETAIL(softwareId, validationId));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '양식 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-09.*\.(docx|xlsx)$/);
  });

  test('QP-18-03 중간점검표 — 승인 후 labManager 클릭 → 다운로드 + 파일명 가드', async ({
    siteAdminPage: page,
  }) => {
    // CALIB_001 은 SPECTRUM_ANALYZER_SUW_E 에 연결된 승인된 교정 기록.
    // 중간점검 3단계 승인 (draft → submitted → reviewed → approved) 후
    // `IntermediateInspectionList` 행에 `approvalStatus === 'approved'` 조건부 버튼이 노출.
    const calibrationId = TEST_CALIBRATION_IDS.CALIB_001;
    const equipmentId = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;
    await resetIntermediateInspections(calibrationId);

    const created = await createIntermediateInspection(page, calibrationId, {
      inspectionDate: new Date().toISOString().split('T')[0],
      classification: 'calibrated',
      inspectionCycle: '6 months',
      overallResult: 'pass',
      remarks: 'WF-Export-UI QP-18-03 승인 흐름 검증',
      items: [
        {
          itemNumber: 1,
          checkItem: '외관 검사',
          checkCriteria: '손상/마모 없음',
          checkResult: '정상',
          judgment: 'pass',
        },
      ],
    });
    const inspectionId = extractId(created);

    // 3단계 승인: TE 제출 → TM 검토 → LM 최종 승인
    await submitIntermediateInspection(page, inspectionId, 'test_engineer');
    await reviewIntermediateInspection(page, inspectionId, 'technical_manager');
    await approveIntermediateInspection(page, inspectionId, 'lab_manager');
    await clearBackendCache();

    await page.goto(`${FRONTEND_ROUTES.EQUIPMENT.DETAIL(equipmentId)}?tab=inspection`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '양식 내보내기' }).first();
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-03.*\.(docx|xlsx)$/);
  });

  test('QP-18-05 자체점검표 — testEngineer 클릭 → 다운로드 + 파일명 가드', async ({
    testOperatorPage: page,
  }) => {
    // FILTER_SUW_E 는 managementMethod='self_inspection' 장비.
    // 자체점검 1건 생성 후 탭 헤더 `양식 내보내기` 버튼이 노출 (inspections.length > 0 게이트).
    const equipmentId = TEST_EQUIPMENT_IDS.FILTER_SUW_E;
    await resetSelfInspections(equipmentId);

    await createSelfInspection(page, equipmentId, {
      inspectionDate: new Date().toISOString().split('T')[0],
      items: [{ itemNumber: 1, checkItem: '외관검사', checkResult: 'pass' }],
      overallResult: 'pass',
      specialNotes: [],
    });
    await clearBackendCache();

    await page.goto(`${FRONTEND_ROUTES.EQUIPMENT.DETAIL(equipmentId)}?tab=inspection`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '양식 내보내기' }).first();
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-05.*\.(docx|xlsx)$/);
  });

  test('QP-18-06 반·출입 확인서 — labManager 클릭 → 다운로드 + 파일명 가드', async ({
    siteAdminPage: page,
  }) => {
    // CHECKOUT_009 는 seed 의 approved calibration checkout (Suwon).
    // `CheckoutDetailClient.renderActions` 에서 pending/rejected 를 제외한 모든 상태에 export 버튼 노출.
    await page.goto(FRONTEND_ROUTES.CHECKOUTS.DETAIL(CHECKOUT_009_ID));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '양식 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-06.*\.(docx|xlsx)$/);
  });

  test('QP-18-10 공용장비 사용/반납 확인서 — testEngineer 클릭 → 다운로드 + 파일명 가드', async ({
    testOperatorPage: page,
  }) => {
    // 반입 신청 → TM 승인 상태로 전이하면 `EquipmentImportDetail` 의
    // pending/rejected/canceled 제외 게이트가 통과되어 버튼 노출.
    const now = Date.now();
    const startIso = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    const endIso = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    const created = await createEquipmentImport(
      page,
      {
        sourceType: 'rental',
        vendorName: `WF-Export-UI QP-18-10 벤더 ${now}`,
        vendorContact: '02-1234-5678',
        externalIdentifier: `EXT-${now}`,
        equipmentName: 'WF-Export-UI QP-18-10 테스트 장비',
        modelName: 'QP1810-UI',
        manufacturer: '테스트 제조사',
        serialNumber: `SN-${now}`,
        classification: 'fcc_emc_rf',
        teamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
        site: 'suwon',
        usagePeriodStart: startIso,
        usagePeriodEnd: endIso,
        usageLocation: '수원 EMC 챔버',
        reason: 'WF-Export-UI QP-18-10 UI 다운로드 검증',
      },
      'test_engineer'
    );
    const importId = extractId(created);
    await approveEquipmentImport(page, importId, 'technical_manager');
    await clearBackendCache();

    await page.goto(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(importId));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const exportButton = page.getByRole('button', { name: '양식 내보내기' });
    await expect(exportButton).toBeVisible();

    const download = await expectFileDownload(page, async () => {
      await exportButton.click();
    });

    expect(download.suggestedFilename()).toMatch(/UL-QP-18-10.*\.(docx|xlsx)$/);
  });
});
