/**
 * 예약 상태를 나타내는 열거형
 */
export enum ReservationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
}

// 참고: entity 클래스는 제거되었으며, 대신 drizzle 스키마가 사용됩니다.
// 스키마 정의는 apps/backend/src/database/drizzle/schema/loans.ts 파일을 참조하세요. 