/**
 * 장비 상태 스타일 중앙화 (SSOT)
 *
 * 이 파일은 프론트엔드 전용 스타일을 정의합니다.
 * - 라벨은 packages/schemas에서 import (EQUIPMENT_STATUS_LABELS)
 * - 스타일(색상, 클래스)은 여기서 정의
 *
 * 사용법:
 * ```typescript
 * import { getEquipmentStatusStyle, EQUIPMENT_STATUS_STYLES } from '@/lib/constants/equipment-status-styles';
 *
 * const style = getEquipmentStatusStyle(equipment.status);
 * <Badge className={style.className}>{style.label}</Badge>
 * ```
 */
import { EQUIPMENT_STATUS_LABELS, type EquipmentStatus } from '@equipment-management/schemas';

/**
 * 장비 상태별 스타일 정의
 *
 * calibration_scheduled, calibration_overdue는 기본 상태로는 "사용 가능"으로 표시
 * 교정 상태는 별도 배지로 D-day 형식으로 표시
 */
export interface EquipmentStatusStyle {
  className: string;
  label: string;
  borderColor: string;
}

export const EQUIPMENT_STATUS_STYLES: Record<EquipmentStatus, EquipmentStatusStyle> = {
  available: {
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    label: EQUIPMENT_STATUS_LABELS.available,
    borderColor: 'border-l-green-500',
  },
  in_use: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    label: EQUIPMENT_STATUS_LABELS.in_use,
    borderColor: 'border-l-blue-500',
  },
  checked_out: {
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    label: EQUIPMENT_STATUS_LABELS.checked_out,
    borderColor: 'border-l-orange-500',
  },
  // calibration_scheduled는 "사용 가능"으로 표시 (교정 상태는 별도 배지)
  calibration_scheduled: {
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    label: EQUIPMENT_STATUS_LABELS.available, // "사용 가능"으로 표시
    borderColor: 'border-l-green-500',
  },
  // calibration_overdue는 "부적합"으로 표시 (백엔드 스케줄러가 자동 전환하지만 즉시 반영 위해)
  calibration_overdue: {
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    label: EQUIPMENT_STATUS_LABELS.non_conforming, // "부적합"으로 표시
    borderColor: 'border-l-red-600',
  },
  non_conforming: {
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    label: EQUIPMENT_STATUS_LABELS.non_conforming,
    borderColor: 'border-l-red-600',
  },
  spare: {
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    label: EQUIPMENT_STATUS_LABELS.spare,
    borderColor: 'border-l-slate-500',
  },
  retired: {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    label: EQUIPMENT_STATUS_LABELS.retired,
    borderColor: 'border-l-gray-500',
  },
  // 새 상태들
  pending_disposal: {
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    label: EQUIPMENT_STATUS_LABELS.pending_disposal,
    borderColor: 'border-l-orange-500',
  },
  disposed: {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    label: EQUIPMENT_STATUS_LABELS.disposed,
    borderColor: 'border-l-gray-500',
  },
  temporary: {
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    label: EQUIPMENT_STATUS_LABELS.temporary,
    borderColor: 'border-l-cyan-500',
  },
  inactive: {
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    label: EQUIPMENT_STATUS_LABELS.inactive,
    borderColor: 'border-l-slate-400',
  },
};

/**
 * 기본 스타일 (알 수 없는 상태용)
 */
export const DEFAULT_STATUS_STYLE: EquipmentStatusStyle = {
  className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  label: '알 수 없음',
  borderColor: 'border-l-gray-500',
};

/**
 * 장비 상태 스타일 조회 헬퍼 함수
 *
 * @param status 장비 상태 (EquipmentStatus 또는 string)
 * @param nextCalibrationDate 차기 교정일 (옵션) - 실시간 교정기한 초과 체크용
 * @returns 스타일 객체 (className, label, borderColor)
 *
 * @example
 * // 기본 사용
 * const style = getEquipmentStatusStyle('available');
 * // { className: 'bg-green-100...', label: '사용 가능', borderColor: 'border-l-green-500' }
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

  return (
    EQUIPMENT_STATUS_STYLES[status as EquipmentStatus] || {
      ...DEFAULT_STATUS_STYLE,
      label: status, // 알 수 없는 상태는 원본 값 표시
    }
  );
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
