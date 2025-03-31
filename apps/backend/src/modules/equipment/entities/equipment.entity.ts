/**
 * 장비 상태를 나타내는 열거형
 */
export enum EquipmentStatusEnum {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  CALIBRATION = 'CALIBRATION',
  RETIRED = 'RETIRED'
}

// 참고: entity 클래스는 제거되었으며, 대신 drizzle 스키마가 사용됩니다.
// 스키마 정의는 apps/backend/src/database/drizzle/schema/equipment.ts 파일을 참조하세요. 