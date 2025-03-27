import { z } from 'zod';

// 예약 상태 타입
export enum ReservationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

// 예약 생성 요청 스키마
export const CreateReservationSchema = z.object({
  equipmentId: z.string(),
  startDate: z.string(), // ISO 형식 날짜 문자열
  endDate: z.string(),   // ISO 형식 날짜 문자열
  purpose: z.string().min(3).max(500),
  notes: z.string().optional(),
});

// 예약 수정 요청 스키마
export const UpdateReservationSchema = CreateReservationSchema.partial().extend({
  status: z.enum([
    ReservationStatus.PENDING,
    ReservationStatus.APPROVED,
    ReservationStatus.REJECTED,
    ReservationStatus.CANCELLED,
    ReservationStatus.COMPLETED
  ]).optional(),
  approverNotes: z.string().optional(),
});

// 예약 스키마
export const ReservationSchema = CreateReservationSchema.extend({
  id: z.string(),
  userId: z.string(),
  status: z.enum([
    ReservationStatus.PENDING,
    ReservationStatus.APPROVED,
    ReservationStatus.REJECTED,
    ReservationStatus.CANCELLED,
    ReservationStatus.COMPLETED
  ]),
  approverId: z.string().optional(),
  approverNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  equipment: z.object({
    id: z.string(),
    name: z.string(),
    managementNumber: z.string(),
    status: z.string(),
    category: z.string().optional()
  }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    department: z.string().optional()
  }),
  approver: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string()
  }).optional()
});

// 타입 변환 유틸리티
export type CreateReservationData = z.infer<typeof CreateReservationSchema>;
export type UpdateReservationData = z.infer<typeof UpdateReservationSchema>;
export type Reservation = z.infer<typeof ReservationSchema>; 