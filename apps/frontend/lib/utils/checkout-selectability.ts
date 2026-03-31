/**
 * 반출 신청 시 장비 선택 가능 여부 판단 유틸리티
 *
 * SSOT 체인:
 *   shared-constants/checkout-selectability.ts — 허용 상태 규칙 + 차단 사유 i18n 키
 *     → 이 파일 — Equipment 객체 처리, 날짜 포맷팅, i18n 키 조합
 *       → Consumer (CreateCheckoutContent) — t(reasonKey, reasonParams)로 resolve
 *
 * 모든 사용자 표시 문자열은 i18n 키로 관리 (하드코딩 금지)
 */
import type { EquipmentStatus, CheckoutPurpose } from '@equipment-management/schemas';
import {
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import {
  getAllowedStatusesForPurpose,
  getBlockedReasonKey,
  CHECKOUT_HIDDEN_STATUSES,
  type EquipmentSelectability,
} from '@equipment-management/shared-constants';
import type { Equipment } from '@/lib/api/equipment-api';
import { format } from 'date-fns';

/**
 * 장비의 선택 가능 여부를 목적에 따라 판단
 *
 * @param equipment 장비 객체
 * @param purpose 반출 목적 (calibration | repair | rental)
 * @returns i18n 키 기반 선택 가능 결과 — consumer에서 t(reasonKey, reasonParams)로 resolve
 *
 * @example
 * const result = getEquipmentSelectability(equipment, 'calibration');
 * if (!result.selectable) {
 *   const message = t(result.reasonKey as Parameters<typeof t>[0], result.reasonParams);
 * }
 */
export function getEquipmentSelectability(
  equipment: Equipment,
  purpose: CheckoutPurpose
): EquipmentSelectability {
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
          warningKey: 'selectability.calibrationExpiryWarning',
          warningParams: { date: formatted },
        };
      }
    }

    return { selectable: true };
  }

  // 허용 상태가 아닌 경우 — SSOT 차단 사유 키 확인
  const blockedReason = getBlockedReasonKey(status, purpose);
  if (blockedReason) {
    return {
      selectable: false,
      reasonKey: blockedReason.key,
      reasonParams: blockedReason.params,
    };
  }

  // SSOT에 명시적 사유가 없는 경우 — 상태 라벨 i18n 키로 기본 메시지 생성
  const statusLabelKey = `status.${status}`;
  return {
    selectable: false,
    reasonKey: 'selectability.statusNotSelectable',
    reasonParams: { statusLabel: statusLabelKey },
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
