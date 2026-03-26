/**
 * 장비 상태 스타일 — EQUIPMENT_STATUS_TOKENS에서 파생
 *
 * SSOT 체인:
 *   BRAND_CLASS_MATRIX (brand.ts)
 *     → EQUIPMENT_STATUS_TOKENS (equipment.ts) — 원본
 *       → EQUIPMENT_STATUS_STYLES (이 파일) — 파생 (className + borderColor)
 *
 * 이 파일은 스타일을 독자적으로 정의하지 않습니다.
 * EQUIPMENT_STATUS_TOKENS.card.className / card.borderColor에서 파생합니다.
 * 라벨은 i18n으로 관리하며, 표시 상태 오버라이드(calibration_scheduled → available 등)는
 * getDisplayStatus()를 통해 i18n 키 조회 시 사용합니다.
 *
 * 사용법:
 * ```typescript
 * import { getEquipmentStatusStyle, getDisplayStatus } from '@/lib/constants/equipment-status-styles';
 *
 * const style = getEquipmentStatusStyle(equipment.status);
 * const displayStatus = getDisplayStatus(equipment.status);
 * const label = t(`status.${displayStatus}`);
 * <Badge className={style.className}>{label}</Badge>
 * ```
 */
import { EQUIPMENT_STATUS_VALUES, type EquipmentStatus } from '@equipment-management/schemas';
import { EQUIPMENT_STATUS_TOKENS, DEFAULT_STATUS_CONFIG } from '@/lib/design-tokens';

export interface EquipmentStatusStyle {
  className: string;
  borderColor: string;
}

/**
 * 표시 상태 오버라이드 — UI에서 다른 상태의 라벨로 표시되는 경우
 *
 * calibration_scheduled: 교정 상태는 별도 D-day 배지로 표시하므로 "사용 가능"
 * calibration_overdue: 백엔드 스케줄러 전환 전 즉시 "부적합" 표시
 */
export const DISPLAY_STATUS_OVERRIDES: Partial<Record<EquipmentStatus, EquipmentStatus>> = {
  calibration_scheduled: 'available',
  calibration_overdue: 'non_conforming',
};

/**
 * 표시용 상태 반환 — i18n 라벨 조회 시 사용
 *
 * @example
 * const displayStatus = getDisplayStatus(equipment.status);
 * const label = t(`status.${displayStatus}`);
 */
export function getDisplayStatus(status: EquipmentStatus): EquipmentStatus {
  return DISPLAY_STATUS_OVERRIDES[status] ?? status;
}

/**
 * EQUIPMENT_STATUS_TOKENS에서 파생된 스타일 레코드
 *
 * className, borderColor → EQUIPMENT_STATUS_TOKENS.card에서 추출
 */
export const EQUIPMENT_STATUS_STYLES: Record<EquipmentStatus, EquipmentStatusStyle> =
  Object.fromEntries(
    (EQUIPMENT_STATUS_VALUES as readonly EquipmentStatus[]).map((status) => {
      const tokens = EQUIPMENT_STATUS_TOKENS[status] ?? DEFAULT_STATUS_CONFIG;
      return [
        status,
        {
          className: tokens.card.className,
          borderColor: tokens.card.borderColor,
        },
      ];
    })
  ) as Record<EquipmentStatus, EquipmentStatusStyle>;

/**
 * 기본 스타일 (알 수 없는 상태용)
 */
export const DEFAULT_STATUS_STYLE: EquipmentStatusStyle = {
  className: DEFAULT_STATUS_CONFIG.card.className,
  borderColor: DEFAULT_STATUS_CONFIG.card.borderColor,
};

/**
 * 장비 상태 스타일 조회 헬퍼 함수
 *
 * @param status 장비 상태 (EquipmentStatus 또는 string)
 * @param nextCalibrationDate 차기 교정일 (옵션) - 실시간 교정기한 초과 체크용
 * @returns 스타일 객체 (className, borderColor)
 *
 * @example
 * // 기본 사용
 * const style = getEquipmentStatusStyle('available');
 *
 * // 교정기한 실시간 체크
 * const style = getEquipmentStatusStyle('available', equipment.nextCalibrationDate);
 * // 교정기한이 지났으면 "부적합"으로 자동 변경
 */
export function getEquipmentStatusStyle(
  status: string | undefined | null,
  nextCalibrationDate?: string | Date | null
): EquipmentStatusStyle {
  if (!status) {
    return EQUIPMENT_STATUS_STYLES.available;
  }

  // 실시간 교정기한 초과 체크 (백엔드 스케줄러가 아직 실행되지 않은 경우 대비)
  // available 상태이지만 교정기한이 지난 경우 → 부적합으로 표시
  if (status === 'available' && nextCalibrationDate && new Date(nextCalibrationDate) < new Date()) {
    return EQUIPMENT_STATUS_STYLES.non_conforming;
  }

  return EQUIPMENT_STATUS_STYLES[status as EquipmentStatus] || DEFAULT_STATUS_STYLE;
}

/**
 * 교정 상태 표시를 건너뛸 장비 상태 목록
 *
 * 이 상태들은 교정 D-day 배지를 표시하지 않음:
 * - retired: 더 이상 사용하지 않음
 * - non_conforming: 수리/보수 후 필수적으로 재교정 필요
 * - spare: 실제 사용 전에 교정 상태 재확인 필요
 * - pending_disposal: 폐기 대기 중
 * - disposed: 폐기 완료
 * - temporary: 임시 등록 장비
 * - inactive: 비활성 상태
 */
export const STATUS_SKIP_CALIBRATION_DISPLAY: EquipmentStatus[] = [
  'retired',
  'non_conforming',
  'spare',
  'pending_disposal',
  'disposed',
  'temporary',
  'inactive',
];

/**
 * 교정 상태 표시 여부 확인
 */
export function shouldDisplayCalibrationStatus(status: string | undefined | null): boolean {
  if (!status) return true;
  return !STATUS_SKIP_CALIBRATION_DISPLAY.includes(status as EquipmentStatus);
}

/**
 * 반출 불가 상태 목록 (SSOT)
 *
 * UL-QP-18 기준: 반출 중/폐기/사용 중 장비는 신규 반출 불가
 * 부적합/교정기한초과는 교정·수리 목적 반출은 가능 (별도 처리)
 *
 * CRITICAL: 이 상수를 직접 하드코딩하지 말 것 — 이 곳이 유일한 정의 위치
 */
export const STATUS_NOT_ALLOWED_FOR_CHECKOUT: EquipmentStatus[] = [
  'checked_out',
  'retired',
  'in_use',
];
