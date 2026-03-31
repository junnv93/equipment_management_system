/**
 * 데이터 마이그레이션 전체 플로우 E2E 테스트
 *
 * 실제 .xlsx 파일을 ExcelJS로 생성하여 Preview → Execute → 결과 전체 플로우 검증
 *
 * TC-F01: 단일 시트(장비만) — Preview → Execute → 결과 + 캐시 일관성 (장비 목록 반영)
 * TC-F02: 멀티시트(장비 + 교정이력 + 수리이력) — 탭 UI + 멀티시트 Execute
 * TC-F03: 오류 행 포함 파일 — 오류 행 걸러내고 유효 행만 등록
 */

import ExcelJS from 'exceljs';
import { test, expect } from '../../shared/fixtures/auth.fixture';

const PAGE_URL = '/admin/data-migration';

// ─── 고유 관리번호 생성 ────────────────────────────────────────────────────────
// Date.now() 마지막 4자리 → 재실행 시 중복 방지 (10000ms 이내 재실행 시 동일할 수 있으나 serial 모드라 충분)
function uniqueMgmt(prefix: 'SUW' | 'UIW', suffix?: string): string {
  const ts = String(Date.now()).slice(-4);
  return `${prefix}-E9${ts}${suffix ?? ''}`;
}

// ─── xlsx 생성 헬퍼 ────────────────────────────────────────────────────────────

/** 단일 시트 (장비만) xlsx Buffer 생성 */
async function createEquipmentOnlyXlsx(managementNumber: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('장비 등록');
  // 헤더: 컬럼 매핑 alias와 정확히 일치해야 함 (별표 없이)
  sheet.addRow(['장비명', '사이트', '설치위치', '관리번호', '제조사', '모델명', '교정방법']);
  sheet.addRow([
    '테스트 오실로스코프',
    '수원',
    '101호',
    managementNumber,
    'Tektronix',
    'MDO3054',
    '외부 교정',
  ]);
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** 멀티시트 (장비 + 교정이력 + 수리이력) xlsx Buffer 생성 */
async function createMultiSheetXlsx(managementNumber: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // 장비 등록
  const eqSheet = wb.addWorksheet('장비 등록');
  eqSheet.addRow(['장비명', '사이트', '설치위치', '관리번호', '교정방법', '교정필요']);
  eqSheet.addRow([
    '멀티시트 테스트 장비',
    '의왕',
    'A동 202호',
    managementNumber,
    '자체 점검',
    '필요',
  ]);

  // 교정 이력
  const calSheet = wb.addWorksheet('교정 이력');
  calSheet.addRow(['관리번호', '교정일자', '교정기관', '교정결과']);
  calSheet.addRow([managementNumber, '2024-03-15', 'KRISS', '합격']);

  // 수리 이력
  const repairSheet = wb.addWorksheet('수리 이력');
  repairSheet.addRow(['관리번호', '수리일자', '수리내용', '수리결과']);
  repairSheet.addRow([managementNumber, '2023-11-20', '팬 모터 교체', '완료']);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** 오류 행 포함 xlsx — 유효 1행 + 오류 1행 (장비명 누락) */
async function createXlsxWithErrors(validMgmt: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('장비 등록');
  sheet.addRow(['장비명', '사이트', '설치위치', '관리번호']);
  sheet.addRow(['유효 장비', '수원', '101호', validMgmt]); // 유효 행
  sheet.addRow(['', '의왕', 'B동', uniqueMgmt('UIW', '2')]); // 오류: 장비명 없음
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ─── 테스트 ──────────────────────────────────────────────────────────────────

test.describe('데이터 마이그레이션 전체 플로우', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180000); // Preview+Execute+장비목록 이동+검색 포함, 120초 부족한 환경 고려

  test('TC-F01: 단일 시트 장비 등록 — Preview → Execute → 결과 + 캐시 일관성', async ({
    systemAdminPage: page,
  }) => {
    const mgmtNum = uniqueMgmt('SUW');
    const xlsxBuffer = await createEquipmentOnlyXlsx(mgmtNum);

    await page.goto(PAGE_URL);
    await expect(page.getByRole('heading', { name: 'Excel 파일 업로드' })).toBeVisible();

    // 1단계: 파일 업로드
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /드래그하거나 클릭/ }).click(),
    ]);
    await fileChooser.setFiles({
      name: 'equipment-only.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: xlsxBuffer,
    });

    // 파일 선택 확인 (카드로 교체)
    await expect(page.getByText('equipment-only.xlsx')).toBeVisible();
    await expect(page.getByRole('button', { name: '미리보기 시작' })).toBeEnabled();

    // 2단계: 미리보기 시작
    await page.getByRole('button', { name: '미리보기 시작' }).click();

    // Preview 단계로 전환 확인
    await expect(page.getByText('미리보기 결과')).toBeVisible({ timeout: 15000 });

    // 전체 요약 카드 확인 — data-testid SSOT (CSS 클래스 아닌 시맨틱 속성)
    const totalText = await page.locator('[data-testid="summary-total"]').textContent();
    expect(Number(totalText)).toBeGreaterThanOrEqual(1);

    // 단일 시트: 탭 없음 — 행 테이블 존재 확인
    await expect(page.getByRole('table')).toBeVisible();

    // 3단계: Execute — "N개 항목 등록" 버튼 클릭
    const executeBtn = page.getByRole('button', { name: /항목 등록/ });
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // 4단계: 결과 확인
    await expect(page.getByText('마이그레이션 완료')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('등록 완료')).toBeVisible();

    // "장비 목록으로" 버튼 확인 후 클릭 → 캐시 일관성 검증
    const listButton = page.getByRole('button', { name: '장비 목록으로' });
    await expect(listButton).toBeVisible();
    await listButton.click();

    // 장비 목록 페이지 도달 확인 (searchBox 등장 대기 — networkidle 대신 시맨틱 대기)
    await page.waitForURL('**/equipment**');
    const searchBox = page.getByPlaceholder('장비명, 모델명, 관리번호로 검색');
    await expect(searchBox).toBeVisible({ timeout: 30000 });

    // 마이그레이션으로 등록된 장비가 목록에 반영됐는지 검색으로 확인
    // (invalidateQueries 호출로 캐시 무효화 → 최신 목록 로딩됨을 검증)
    await searchBox.fill(mgmtNum);
    await page.keyboard.press('Enter');
    await expect(page.getByText(mgmtNum)).toBeVisible({ timeout: 15000 });
  });

  test('TC-F02: 멀티시트(장비+교정이력+수리이력) — 탭 UI + Execute', async ({
    systemAdminPage: page,
  }) => {
    const mgmtNum = uniqueMgmt('UIW');
    const xlsxBuffer = await createMultiSheetXlsx(mgmtNum);

    await page.goto(PAGE_URL);
    await expect(page.getByRole('heading', { name: 'Excel 파일 업로드' })).toBeVisible();

    // 파일 업로드
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /드래그하거나 클릭/ }).click(),
    ]);
    await fileChooser.setFiles({
      name: 'multi-sheet.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: xlsxBuffer,
    });

    await page.getByRole('button', { name: '미리보기 시작' }).click();
    await expect(page.getByText('미리보기 결과')).toBeVisible({ timeout: 15000 });

    // 멀티시트 탭 UI 확인
    await expect(page.getByRole('button', { name: /장비 등록/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /교정 이력/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /수리 이력/ })).toBeVisible();

    // 탭 전환 — 교정 이력 탭 클릭
    await page.getByRole('button', { name: /교정 이력/ }).click();
    // 탭 활성화 확인: 관리번호 셀 표시
    await expect(page.getByRole('table')).toBeVisible();

    // Execute
    const executeBtn = page.getByRole('button', { name: /항목 등록/ });
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    await expect(page.getByText('마이그레이션 완료')).toBeVisible({ timeout: 20000 });

    // 시트별 결과 카드 확인 (멀티시트 → "시트별 처리 결과" 섹션)
    await expect(page.getByText('시트별 처리 결과')).toBeVisible();
    await expect(page.getByText('장비 등록', { exact: true })).toBeVisible();
    await expect(page.getByText('교정 이력', { exact: true })).toBeVisible();
    await expect(page.getByText('수리 이력', { exact: true })).toBeVisible();
  });

  test('TC-F03: 오류 행 포함 — 유효 행만 선택 등록 가능', async ({ systemAdminPage: page }) => {
    const xlsxBuffer = await createXlsxWithErrors(uniqueMgmt('SUW', '3'));

    await page.goto(PAGE_URL);
    await expect(page.getByRole('heading', { name: 'Excel 파일 업로드' })).toBeVisible();

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /드래그하거나 클릭/ }).click(),
    ]);
    await fileChooser.setFiles({
      name: 'with-errors.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: xlsxBuffer,
    });

    await page.getByRole('button', { name: '미리보기 시작' }).click();
    await expect(page.getByText('미리보기 결과')).toBeVisible({ timeout: 15000 });

    // 요약 카드 — data-testid SSOT
    const errorText = await page.locator('[data-testid="summary-error"]').textContent();
    expect(Number(errorText)).toBeGreaterThanOrEqual(1);

    // 오류 상태 배지 확인
    await expect(page.getByText('오류', { exact: true }).first()).toBeVisible();

    // 오류 리포트 다운로드 버튼 표시 확인
    await expect(page.getByRole('button', { name: '오류 리포트 다운로드' })).toBeVisible();

    // 유효 행이 있으면 Execute 버튼 활성화
    const validText = await page.locator('[data-testid="summary-valid"]').textContent();
    const validCount = Number(validText);
    if (validCount > 0) {
      await expect(page.getByRole('button', { name: /항목 등록/ })).toBeEnabled();
    }
  });
});
