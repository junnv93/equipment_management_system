/**
 * 장비 상태에 대한 열거형 타입
 */
export enum EquipmentStatusEnum {
  AVAILABLE = 'available',       // 사용 가능
  LOANED = 'loaned',            // 대여 중
  CHECKED_OUT = 'checked_out',   // 반출 중
  CALIBRATION = 'calibration',   // 교정 중
  MAINTENANCE = 'maintenance',   // 유지보수 중
  RETIRED = 'retired',          // 폐기/사용 중지
}

/**
 * 장비 상태가 이용 가능한지 확인하는 유틸리티 함수
 */
export function isAvailable(status: EquipmentStatusEnum): boolean {
  return status === EquipmentStatusEnum.AVAILABLE;
}

/**
 * 장비 상태가 교정이 필요한지 확인하는 유틸리티 함수
 */
export function isNeedCalibration(status: string): boolean {
  return status === 'calibration_needed' || status === 'calibration_overdue';
} 