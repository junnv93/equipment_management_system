/**
 * 상태 배지 검증 헬퍼
 */

import { expect, type Page } from '@playwright/test';
import { EquipmentStatus, EQUIPMENT_STATUS_LABELS } from '@equipment-management/schemas';

/**
 * 상세 페이지 배지 검증
 */
export async function verifyDetailPageStatusBadge(
  page: Page,
  expectedStatus: EquipmentStatus
): Promise<void> {
  const expectedLabel = EQUIPMENT_STATUS_LABELS[expectedStatus];

  // 상태 배지는 헤더 영역에 있음
  const statusBadge = page.getByText(expectedLabel).first();

  await expect(statusBadge).toBeVisible({ timeout: 10000 });

  console.log(`✓ 상세 페이지 배지: "${expectedLabel}"`);
}

/**
 * 목록 페이지 배지 검증
 */
export async function verifyListPageStatusBadge(
  page: Page,
  managementNumber: string,
  expectedStatus: EquipmentStatus
): Promise<void> {
  const expectedLabel = EQUIPMENT_STATUS_LABELS[expectedStatus];

  console.log(`  검증 시작: 관리번호=${managementNumber}, 예상 상태=${expectedLabel}`);

  // ✅ IMPROVED: 테이블 로딩 확인
  // 1. 테이블이 로드될 때까지 대기
  const table = page.locator('table');
  await expect(table).toBeVisible({ timeout: 15000 });

  // 2. 최소 1개 이상의 행이 있는지 확인 (중요: 새 페이지는 초기에 0개일 수 있음)
  const firstRow = page.locator('[data-testid="equipment-row"]').first();

  // 3. 행이 로드될 때까지 대기 (최대 20초)
  // 새 페이지 컨텍스트는 SSR 데이터 없이 시작할 수 있음
  await firstRow.waitFor({ state: 'visible', timeout: 20000 });

  console.log(`  테이블 로드 완료`);

  // 4. 추가 대기 (React Query refetch 완료)
  await page.waitForTimeout(1000);

  // 3. 관리번호 셀 찾기
  const managementNumberCell = page.locator(`td:has-text("${managementNumber}")`).first();

  try {
    await expect(managementNumberCell).toBeVisible({ timeout: 10000 });
  } catch (error) {
    // 디버깅 정보 출력
    console.error(`❌ 관리번호 "${managementNumber}" 셀을 찾을 수 없습니다.`);
    const allRows = await page.locator('[data-testid="equipment-row"]').count();
    console.error(`현재 테이블 행 개수: ${allRows}`);

    // 첫 5개 행의 관리번호 출력
    const firstFiveRows = page.locator('[data-testid="equipment-row"]').locator('td').first();
    const count = Math.min(5, allRows);
    console.error(`첫 ${count}개 행의 관리번호:`);
    for (let i = 0; i < count; i++) {
      const cell = firstFiveRows.nth(i);
      const text = await cell.textContent().catch(() => '(읽기 실패)');
      console.error(`  ${i + 1}. ${text}`);
    }
    throw error;
  }

  // 4. 부모 row 찾기
  const equipmentRow = managementNumberCell.locator('..');
  await expect(equipmentRow).toHaveAttribute('data-testid', 'equipment-row');

  // 5. 행 내에서 상태 배지 찾기
  const statusBadge = equipmentRow.getByText(expectedLabel);

  try {
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
  } catch (error) {
    // 디버깅: 실제 표시된 배지 확인 (페이지가 살아있을 때만)
    try {
      const actualBadgeText = await equipmentRow
        .locator('[class*="badge"]')
        .first()
        .textContent({ timeout: 1000 });
      console.error(`❌ 예상 배지: "${expectedLabel}", 실제 배지: "${actualBadgeText}"`);
    } catch {
      console.error(`❌ 예상 배지: "${expectedLabel}", 페이지가 닫혔거나 배지를 찾을 수 없습니다.`);
    }
    throw error;
  }

  console.log(`✓ 목록 페이지 배지 (${managementNumber}): "${expectedLabel}"`);
}

/**
 * Hydration 에러 검증
 */
export async function verifyNoHydrationErrors(consoleErrors: string[]): Promise<void> {
  const hydrationErrors = consoleErrors.filter(
    (e) =>
      e.toLowerCase().includes('hydration') ||
      e.toLowerCase().includes('mismatch') ||
      e.toLowerCase().includes('text content does not match')
  );

  expect(hydrationErrors).toHaveLength(0);

  if (hydrationErrors.length > 0) {
    console.error('❌ Hydration 에러 발견:', hydrationErrors);
  } else {
    console.log('✓ Hydration 에러 없음');
  }
}

/**
 * 배지가 특정 시간 내에 변경되는지 확인
 */
export async function waitForBadgeChange(
  page: Page,
  fromStatus: EquipmentStatus,
  toStatus: EquipmentStatus,
  timeout = 10000
): Promise<void> {
  const oldLabel = EQUIPMENT_STATUS_LABELS[fromStatus];
  const newLabel = EQUIPMENT_STATUS_LABELS[toStatus];

  console.log(`⏳ 배지 변경 대기: "${oldLabel}" → "${newLabel}"`);

  // 새 배지가 나타날 때까지 대기
  const newBadge = page.getByText(newLabel).first();
  await expect(newBadge).toBeVisible({ timeout });

  console.log(`✓ 배지 변경 완료: "${newLabel}"`);
}

/**
 * 콘솔 에러 모니터링 시작
 */
export function startConsoleMonitoring(page: Page): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  return { errors, warnings };
}
