export enum EquipmentStatus {
  AVAILABLE = 'available',   // 사용 가능
  IN_USE = 'in_use',        // 사용 중
  MAINTENANCE = 'maintenance', // 유지보수 중
  CALIBRATION = 'calibration', // 교정 중
  REPAIR = 'repair',        // 수리 중
  DISPOSED = 'disposed',    // 폐기됨
  RESERVED = 'reserved',    // 예약됨
  LOST = 'lost',            // 분실
  ARCHIVED = 'archived',    // 보관됨
}
