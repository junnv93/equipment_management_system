/**
 * 상태 감지 헬퍼
 */

import { type Page } from '@playwright/test';
import { type EquipmentStatus, EQUIPMENT_STATUS_LABELS } from '@equipment-management/schemas';

/**
 * 상세 페이지에서 현재 장비 상태 감지
 */
export async function detectEquipmentStatus(page: Page): Promise<EquipmentStatus> {
  // 상태 배지 찾기 (가능한 모든 상태)
  const possibleStatuses: EquipmentStatus[] = [
    'non_conforming',
    'available',
    'checked_out',
    'calibration_scheduled',
    'calibration_overdue',
    'spare',
    'retired',
  ];

  for (const status of possibleStatuses) {
    const label = EQUIPMENT_STATUS_LABELS[status];
    const badge = page.getByText(label).first();
    const isVisible = await badge.isVisible().catch(() => false);

    if (isVisible) {
      console.log(`  감지된 상태: ${label} (${status})`);
      return status;
    }
  }

  throw new Error('장비 상태 배지를 찾을 수 없습니다');
}
