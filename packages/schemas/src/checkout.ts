import { z } from 'zod';

// 반출 상태 열거형
export const CheckoutStatusEnum = z.enum([
  'pending', // 반출 신청
  'approved', // 승인됨
  'rejected', // 거절됨
  'checked_out', // 반출 중
  'returned', // 반납 완료
  'overdue', // 연체
  'canceled' // 취소됨
]);

export type CheckoutStatus = z.infer<typeof CheckoutStatusEnum>;

// 반출 스키마
export const CheckoutSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  approverId: z.string().uuid().optional(),
  destinationName: z.string(),
  destinationAddress: z.string(),
  destinationContact: z.string(),
  purpose: z.string(),
  startDate: z.string().or(z.date()),
  expectedEndDate: z.string().or(z.date()),
  actualEndDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
  status: CheckoutStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Checkout = z.infer<typeof CheckoutSchema>;

// 반출 장비 스키마
export const CheckoutEquipmentSchema = z.object({
  id: z.string().uuid(),
  checkoutId: z.string().uuid(),
  equipmentId: z.string().uuid(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type CheckoutEquipment = z.infer<typeof CheckoutEquipmentSchema>;

// 반출 목록 응답 인터페이스
export interface CheckoutListResponse {
  items: Checkout[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 