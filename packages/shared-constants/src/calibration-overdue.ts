import { EquipmentStatusEnum } from '@equipment-management/schemas';

/**
 * SSOT: 교정기한 초과 대상 제외 장비 상태 목록
 *
 * 이 상태의 장비는 CalibrationOverdueScheduler NC 자동 생성 대상에서 제외되며,
 * getOverdueCalibrations API 결과에도 포함되지 않는다.
 *
 * - non_conforming: 이미 NC 처리 중인 장비 (중복 NC 방지)
 * - disposed: 폐기된 장비
 * - pending_disposal: 폐기 예정 장비
 * - inactive: 비활성 장비
 */
export const EXCLUDED_OVERDUE_EQUIPMENT_STATUSES = [
  EquipmentStatusEnum.enum.non_conforming,
  EquipmentStatusEnum.enum.disposed,
  EquipmentStatusEnum.enum.pending_disposal,
  EquipmentStatusEnum.enum.inactive,
] as const;
