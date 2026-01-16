import { z } from 'zod';
import { LoanStatusEnum, LoanStatus } from './enums';

/**
 * ✅ Single Source of Truth 준수
 * LoanStatusEnum은 enums.ts에서 import하여 사용
 *
 * @deprecated RentalStatus는 LoanStatus의 별칭입니다. LoanStatus를 직접 사용하세요.
 */
export const RentalStatusEnum = LoanStatusEnum;
export type RentalStatus = LoanStatus;

// 대여 유형 열거형
export const RentalTypeEnum = z.enum([
  'internal', // 내부 대여
  'external', // 외부 대여
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
  updatedAt: z.date(),
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
