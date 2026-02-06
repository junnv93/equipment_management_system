/**
 * NC 생성/종료 워크플로우 헬퍼
 */

import { expect, type Page } from '@playwright/test';
import { TIMEOUTS, INCIDENT_TYPES } from '../constants/test-data';

/**
 * 사고 이력 → NC 생성 (부적합으로 등록 체크박스)
 */
export async function createIncidentWithNC(
  page: Page,
  equipmentId: string,
  incidentContent: string
): Promise<void> {
  console.log(`📝 사고 이력 → NC 생성 시작 (장비: ${equipmentId})`);

  await page.goto(`/equipment/${equipmentId}`);
  await page.waitForLoadState('networkidle');

  // 사고 이력 탭 클릭
  await page.getByRole('tab', { name: /사고 이력/i }).click();
  await page.waitForTimeout(1000);

  // 사고 등록 다이얼로그 열기
  await page.getByRole('button', { name: /사고 등록/i }).click();
  await page.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

  // 폼 작성
  const today = new Date().toISOString().split('T')[0];
  await page.locator('input[type="date"]').fill(today);

  // 유형 선택 (손상)
  const typeSelect = page.locator('button[role="combobox"]').first();
  await typeSelect.click();
  await page.waitForTimeout(200);
  await page.getByRole('option', { name: new RegExp(INCIDENT_TYPES.DAMAGE, 'i') }).click();
  await page.waitForTimeout(300);

  // 내용 입력
  await page.locator('textarea').first().fill(incidentContent);

  // "부적합으로 등록" 체크박스 선택
  const checkbox = page.locator('input[type="checkbox"]').first();
  await checkbox.check();
  await page.waitForTimeout(200);

  // 저장
  await page.getByRole('button', { name: /저장/i }).click();

  // ✅ IMPROVED: UI 상태 검증 (waitForResponse 제거)
  // 성공 토스트 메시지 또는 dialog 닫힘 확인
  try {
    await expect(page.getByText(/등록되었습니다|저장되었습니다|생성되었습니다/i)).toBeVisible({
      timeout: 5000,
    });
  } catch {
    // 토스트가 빠르게 사라질 수 있으므로 dialog 닫힘으로 대체 확인
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  }

  // 캐시 무효화 대기 (invalidateQueries + refetchQueries)
  await page.waitForTimeout(TIMEOUTS.CACHE_INVALIDATION);

  console.log('✓ 사고 이력 → NC 생성 완료');
}

/**
 * 직접 NC 등록
 */
export async function createDirectNC(
  page: Page,
  equipmentId: string,
  cause: string
): Promise<void> {
  console.log(`📝 직접 NC 등록 시작 (장비: ${equipmentId})`);

  // ✅ IMPROVED: Navigation 검증
  const response = await page.goto(`/equipment/${equipmentId}/non-conformance`);
  if (!response?.ok()) {
    throw new Error(`NC 페이지 navigation 실패: ${response?.status()}`);
  }

  await page.waitForLoadState('networkidle');

  // ✅ IMPROVED: 페이지 로드 확인
  await expect(page.getByRole('heading', { name: /부적합 관리/i })).toBeVisible({ timeout: 5000 });

  // ✅ IMPROVED: 버튼 존재 확인
  const registerButton = page.getByRole('button', { name: /부적합 등록/i });
  await expect(registerButton).toBeVisible({ timeout: 5000 });
  await registerButton.click();

  await page.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

  // ✅ IMPROVED: Dialog 표시 확인
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

  await page.locator('textarea[name="cause"]').fill(cause);
  await page.getByRole('button', { name: /등록/i }).click();

  // ✅ IMPROVED: UI 상태 검증 (waitForResponse 제거)
  try {
    await expect(page.getByText(/등록되었습니다|생성되었습니다/i)).toBeVisible({ timeout: 5000 });
  } catch {
    // 토스트가 빠르게 사라질 수 있으므로 dialog 닫힘으로 대체 확인
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  }

  await page.waitForTimeout(TIMEOUTS.CACHE_INVALIDATION);

  console.log('✓ 직접 NC 등록 완료');
}

/**
 * NC 종료
 */
export async function closeNC(page: Page, equipmentId: string): Promise<void> {
  console.log(`📝 NC 종료 시작 (장비: ${equipmentId})`);

  await page.goto(`/equipment/${equipmentId}/non-conformance`);
  await page.waitForLoadState('networkidle');

  // 첫 번째 NC 기록 수정 버튼 클릭
  const editButton = page.getByRole('button', { name: /기록 수정/i }).first();
  await editButton.click();
  await page.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

  // 상태를 "종료"로 변경
  await page.locator('select[name="status"]').selectOption('closed');
  await page.getByRole('button', { name: /저장/i }).click();

  // ✅ IMPROVED: UI 상태 검증 (waitForResponse 제거)
  try {
    await expect(page.getByText(/저장되었습니다|수정되었습니다/i)).toBeVisible({ timeout: 5000 });
  } catch {
    // 토스트가 빠르게 사라질 수 있으므로 dialog 닫힘으로 대체 확인
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  }

  await page.waitForTimeout(TIMEOUTS.CACHE_INVALIDATION);

  console.log('✓ NC 종료 완료');
}

/**
 * NC가 생성되었는지 확인
 */
export async function verifyNCCreated(page: Page): Promise<void> {
  // NC 탭으로 이동
  await page.getByRole('tab', { name: /부적합 관리/i }).click();
  await page.waitForTimeout(500);

  // "부적합 상태" 텍스트 확인
  const ncStatus = page.getByText(/부적합 상태/i);
  await ncStatus.waitFor({ state: 'visible', timeout: 5000 });

  console.log('✓ NC 생성 확인');
}
