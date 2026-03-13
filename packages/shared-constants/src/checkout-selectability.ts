/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 목적별 장비 선택 가능 상태
 *
 * 이 파일은 반출 신청 시 장비 선택 가능 여부를 판단하는 규칙의 단일 소스입니다.
 * - 프론트엔드: UI에서 선택 가능/불가 표시에 사용
 * - 백엔드: 반출 생성 API에서 장비 상태 검증에 사용
 *
 * 규칙:
 * - 교정/수리: 부적합, 교정기한초과 장비도 보낼 수 있어야 함
 * - 외부 대여: 정상 상태 장비만 대여 가능 (부적합/교정초과 불가)
 * - 공통 차단: 이미 반출 중이거나, 사용 중이거나, 폐기된 장비
 *
 * @see docs/development/API_STANDARDS.md
 */
import type { EquipmentStatus, CheckoutPurpose } from '@equipment-management/schemas';

/** 반출 신청 시 최대 선택 가능 장비 수 */
export const CHECKOUT_MAX_EQUIPMENT_COUNT = 20;

/**
 * 교정/수리 목적 반출 시 허용되는 장비 상태
 *
 * 교정기관에 보내거나 수리업체에 보내는 경우,
 * 부적합/교정초과 장비도 당연히 보낼 수 있어야 함
 */
export const CALIBRATION_REPAIR_ALLOWED_STATUSES: readonly EquipmentStatus[] = [
  'available',
  'calibration_scheduled',
  'calibration_overdue',
  'non_conforming',
  'spare',
] as const;

/**
 * 외부 대여 목적 반출 시 허용되는 장비 상태
 *
 * 다른 시험소에 빌려주는 경우, 정상 작동하는 장비만 가능
 * calibration_scheduled는 허용하되, 교정 만료일 경고 표시
 */
export const RENTAL_ALLOWED_STATUSES: readonly EquipmentStatus[] = [
  'available',
  'spare',
  'calibration_scheduled',
] as const;

/**
 * 목적별 허용 상태 매핑
 *
 * return_to_vendor는 렌탈 반납 전용이므로 별도 규칙 없음 (시스템이 자동 생성)
 */
export const PURPOSE_ALLOWED_STATUSES: Record<string, readonly EquipmentStatus[]> = {
  calibration: CALIBRATION_REPAIR_ALLOWED_STATUSES,
  repair: CALIBRATION_REPAIR_ALLOWED_STATUSES,
  rental: RENTAL_ALLOWED_STATUSES,
} as const;

/**
 * 목적에 따른 허용 상태 배열 반환
 *
 * @param purpose 반출 목적 (calibration | repair | rental)
 * @returns 허용되는 장비 상태 배열
 */
export function getAllowedStatusesForPurpose(purpose: string): readonly EquipmentStatus[] {
  return PURPOSE_ALLOWED_STATUSES[purpose] ?? CALIBRATION_REPAIR_ALLOWED_STATUSES;
}

/**
 * 장비 목록에서 아예 숨길 상태 (운영 종료된 장비)
 *
 * 이 상태의 장비는 반출 신청 장비 선택 목록에 표시하지 않음
 */
export const CHECKOUT_HIDDEN_STATUSES: readonly EquipmentStatus[] = [
  'retired',
  'disposed',
  'pending_disposal',
  'temporary',
  'inactive',
] as const;

/**
 * 목적별 선택 불가 사유 메시지
 *
 * 목록에는 보이지만 선택할 수 없는 장비에 대한 사유 메시지.
 * 키 = EquipmentStatus, 값 = { 기본 메시지, 목적별 오버라이드 }
 */
export const CHECKOUT_BLOCKED_REASONS: Record<
  string,
  { default: string; purposeOverrides?: Partial<Record<string, string>> }
> = {
  in_use: {
    default: '현재 다른 사용자가 사용 중인 장비입니다. 반납 후 선택 가능합니다.',
  },
  checked_out: {
    default: '이미 반출 중인 장비입니다. 반입 완료 후 선택 가능합니다.',
  },
  calibration_overdue: {
    default: '', // 교정/수리에서는 허용
    purposeOverrides: {
      rental: '교정 기한이 초과된 장비입니다. 외부 대여는 교정이 유효한 장비만 가능합니다.',
    },
  },
  non_conforming: {
    default: '', // 교정/수리에서는 허용
    purposeOverrides: {
      rental: '부적합 상태의 장비입니다. 외부 대여는 정상 상태의 장비만 가능합니다.',
    },
  },
} as const;

/**
 * 장비 선택 가능성 결과 인터페이스
 */
export interface EquipmentSelectability {
  /** 선택 가능 여부 */
  selectable: boolean;
  /** 선택 불가 시 사유 메시지 */
  reason?: string;
  /** 선택은 가능하지만 경고가 필요한 경우의 메시지 */
  warningMessage?: string;
}

/**
 * 장비의 선택 가능 사유 메시지 반환
 *
 * @param status 장비 상태
 * @param purpose 반출 목적
 * @returns 차단 사유 메시지 (없으면 undefined)
 */
export function getBlockedReason(status: string, purpose: string): string | undefined {
  const entry = CHECKOUT_BLOCKED_REASONS[status];
  if (!entry) return undefined;

  // 목적별 오버라이드가 있으면 우선
  const override = entry.purposeOverrides?.[purpose];
  if (override !== undefined) {
    return override || undefined; // 빈 문자열 = 차단 아님
  }

  return entry.default || undefined; // 빈 문자열 = 차단 아님
}
