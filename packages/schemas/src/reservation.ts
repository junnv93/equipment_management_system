import { z } from 'zod';

/**
 * @deprecated 이 모듈은 더 이상 사용되지 않습니다.
 *
 * ⚠️ 마이그레이션 안내:
 * - Reservations 모듈은 Rentals 모듈로 통합되었습니다.
 * - 모든 예약 기능은 /rentals API를 사용하세요.
 * - 프론트엔드 마이그레이션이 완료되면 이 파일을 제거할 예정입니다.
 *
 * @see packages/schemas/src/loan.ts - 대여(Rental) 스키마 사용
 * @see apps/backend/src/modules/rentals - Rentals 모듈
 */
// 예약 상태 열거형
export const ReservationStatusEnum = z.enum([
  'PENDING', // 승인 대기
  'APPROVED', // 승인됨
  'REJECTED', // 거절됨
  'CANCELED', // 취소됨
  'COMPLETED', // 완료됨
]);

export type ReservationStatus = z.infer<typeof ReservationStatusEnum>;

// 예약 스키마
export const ReservationSchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  userId: z.string().uuid(),
  approvedById: z.string().uuid().optional(),
  purpose: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  status: ReservationStatusEnum,
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Reservation = z.infer<typeof ReservationSchema>;

// 예약 생성 DTO 스키마
export const CreateReservationDtoSchema = z.object({
  equipmentId: z.string().uuid(),
  purpose: z.string(),
  startDate: z.string(), // ISO 형식 문자열
  endDate: z.string(), // ISO 형식 문자열
  notes: z.string().optional(),
});

export type CreateReservationDto = z.infer<typeof CreateReservationDtoSchema>;

// 예약 업데이트 DTO 스키마
export const UpdateReservationDtoSchema = z.object({
  purpose: z.string().optional(),
  startDate: z.string().optional(), // ISO 형식 문자열
  endDate: z.string().optional(), // ISO 형식 문자열
  status: ReservationStatusEnum.optional(),
  approvedById: z.string().uuid().optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateReservationDto = z.infer<typeof UpdateReservationDtoSchema>;

// 예약 쿼리 스키마
export const ReservationQuerySchema = z.object({
  status: ReservationStatusEnum.optional(),
  equipmentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().optional(), // ISO 형식 문자열
  endDate: z.string().optional(), // ISO 형식 문자열
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().max(100).optional().default(10),
});

export type ReservationQuery = z.infer<typeof ReservationQuerySchema>;

// 예약 목록 응답 인터페이스
export interface ReservationListResponse {
  items: Reservation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 예약과 함께 반환될 수 있는 확장된 타입
export const ExpandedReservationSchema = ReservationSchema.extend({
  equipment: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      managementNumber: z.string(),
      status: z.string(),
    })
    .optional(),
  user: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string(),
      department: z.string().optional(),
    })
    .optional(),
  approvedBy: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
});

export type ExpandedReservation = z.infer<typeof ExpandedReservationSchema>;
