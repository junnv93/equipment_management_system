import { z } from 'zod';
import { UserRoleEnum } from './enums';

// 대여 상태 열거형
export const RentalStatusEnum = z.enum([
  'pending', // 대여 신청
  'approved', // 승인됨
  'rejected', // 거절됨
  'borrowed', // 대여 중
  'returned', // 반납 완료
  'overdue', // 연체
  'canceled', // 취소됨
  'return_requested' // 반납 요청됨
]);

export type RentalStatus = z.infer<typeof RentalStatusEnum>;

// 대여 유형 열거형
export const RentalTypeEnum = z.enum([
  'internal', // 내부 대여
  'external' // 외부 대여
]);

export type RentalType = z.infer<typeof RentalTypeEnum>;

// 대여 스키마
export const RentalSchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  userId: z.string().uuid(),
  approverId: z.string().uuid().optional(),
  startDate: z.string().or(z.date()),
  expectedEndDate: z.string().or(z.date()),
  actualEndDate: z.string().or(z.date()).optional(),
  purpose: z.string(),
  status: RentalStatusEnum,
  type: RentalTypeEnum,
  notes: z.string().optional(),
  location: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Rental = z.infer<typeof RentalSchema>;

// 대여 목록 응답 인터페이스
export interface RentalListResponse {
  items: Rental[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 