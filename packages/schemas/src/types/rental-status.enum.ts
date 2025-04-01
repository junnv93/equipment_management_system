/**
 * 대여/반출 상태에 대한 열거형 타입
 */
export enum RentalStatusEnum {
  PENDING = 'pending',        // 승인 대기 중
  APPROVED = 'approved',      // 승인됨
  REJECTED = 'rejected',      // 거부됨
  RETURNED = 'returned',      // 반납됨
  OVERDUE = 'overdue',        // 반납 기한 초과
  RETURN_REQUESTED = 'return_requested', // 반납 요청됨
} 