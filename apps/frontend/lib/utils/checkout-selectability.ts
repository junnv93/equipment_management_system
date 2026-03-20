/**
 * 반출 신청 시 장비 선택 가능 여부 판단 유틸리티
 *
 * SSOT: 허용 상태 규칙은 @equipment-management/shared-constants에서 import
 * 이 파일은 프론트엔드 전용 UI 로직(Equipment 객체 처리, 날짜 포맷팅)만 담당
 */
import type { EquipmentStatus, CheckoutPurpose } from '@equipment-management/schemas';
import {
  EQUIPMENT_STATUS_LABELS,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import {
  getAllowedStatusesForPurpose,
  getBlockedReason,
  CHECKOUT_HIDDEN_STATUSES,
  type EquipmentSelectability,
} from '@equipment-management/shared-constants';
import type { Equipment } from '@/lib/api/equipment-api';
import { format } from 'date-fns';

/** 프론트엔드 전용 확장: i18n 키 포함 */
export interface EquipmentSelectabilityWithI18n extends EquipmentSelectability {
  /** i18n 키 for warningMessage — Phase 3에서 전환 */
  warningMessageKey?: string;
  /** i18n 보간 파라미터 for warningMessage */
  warningMessageParams?: Record<string, string | number>;
  /** i18n 키 for reason — Phase 3에서 전환 */
  reasonKey?: string;
  /** i18n 보간 파라미터 for reason */
  reasonParams?: Record<string, string | number>;
}

/**
 * 장비의 선택 가능 여부를 목적에 따라 판단
 *
 * @param equipment 장비 객체
 * @param purpose 반출 목적 (calibration | repair | rental)
 * @returns 선택 가능 여부, 사유, 경고 메시지
 *
 * @example
 * const result = getEquipmentSelectability(equipment, 'calibration');
 * if (!result.selectable) {
 *   // 선택 불가 — result.reason에 사유
 * }
 * if (result.warningMessage) {
 *   // 선택은 되지만 경고 표시
 * }
 */
export function getEquipmentSelectability(
  equipment: Equipment,
  purpose: CheckoutPurpose
): EquipmentSelectabilityWithI18n {
  const status = equipment.status as EquipmentStatus;
  const allowedStatuses = getAllowedStatusesForPurpose(purpose);

  // 허용 상태에 포함되면 선택 가능
  if (allowedStatuses.includes(status)) {
    // 대여 + calibration_scheduled: 선택 가능하지만 교정 만료일 경고
    if (purpose === CPVal.RENTAL && status === ESVal.CALIBRATION_SCHEDULED) {
      const nextCalDate = equipment.nextCalibrationDate;
      if (nextCalDate) {
        const formatted = format(new Date(nextCalDate), 'yyyy.MM.dd');
        return {
          selectable: true,
          warningMessage: `교정 만료일: ${formatted}`,
          warningMessageKey: 'checkouts.selectability.calibrationExpiryWarning',
          warningMessageParams: { date: formatted },
        };
      }
    }

    return { selectable: true };
  }

  // 허용 상태가 아닌 경우 — 차단 사유 확인
  const blockedReason = getBlockedReason(status, purpose);
  if (blockedReason) {
    return { selectable: false, reason: blockedReason };
  }

  // SSOT에 명시적 사유가 없는 경우 — 상태 라벨로 기본 메시지 생성
  const statusLabel = EQUIPMENT_STATUS_LABELS[status] ?? status;
  return {
    selectable: false,
    reason: `${statusLabel} 상태의 장비는 선택할 수 없습니다`,
    reasonKey: 'checkouts.selectability.statusNotSelectable',
    reasonParams: { statusLabel },
  };
}

/**
 * 반출 신청 목록에서 표시할 장비만 필터링
 *
 * 운영 종료된 장비(retired, disposed, pending_disposal, temporary, inactive)는
 * 목록에서 아예 제외합니다.
 *
 * @param equipments 전체 장비 목록
 * @returns 목록에 표시할 장비만 필터링된 배열
 */
export function filterVisibleEquipment(equipments: Equipment[]): Equipment[] {
  return equipments.filter(
    (eq) => !CHECKOUT_HIDDEN_STATUSES.includes(eq.status as EquipmentStatus)
  );
}
