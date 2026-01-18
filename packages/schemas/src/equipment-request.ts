import { z } from 'zod';
import { SoftDeleteEntity } from './common/base';

// 승인 상태 enum
export const ApprovalStatusEnum = z.enum(['pending_approval', 'approved', 'rejected']);
export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;

// 요청 타입 enum
export const RequestTypeEnum = z.enum(['create', 'update', 'delete']);
export type RequestType = z.infer<typeof RequestTypeEnum>;

// 장비 요청 스키마
export const equipmentRequestSchema = z.object({
  id: z.number().int().positive(),
  uuid: z.string().uuid(),
  requestType: RequestTypeEnum,
  equipmentId: z.number().int().positive().nullable().optional(),
  requestedBy: z.string().uuid(),
  requestedAt: z.coerce.date(),
  approvalStatus: ApprovalStatusEnum,
  approvedBy: z.string().uuid().nullable().optional(),
  approvedAt: z.coerce.date().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  requestData: z.string().nullable().optional(), // JSON stringified equipment data
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// 장비 요청 생성 스키마
export const createEquipmentRequestSchema = z.object({
  requestType: RequestTypeEnum,
  equipmentId: z.number().int().positive().optional(), // 수정/삭제 시 필수
  requestData: z.string().optional(), // 장비 데이터 (JSON string)
  attachments: z.array(z.string().uuid()).optional(), // 첨부 파일 UUID 목록
});

// 장비 요청 승인/반려 스키마
export const approveEquipmentRequestSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(), // 반려 시 필수
});

// 타입 정의
export type EquipmentRequest = z.infer<typeof equipmentRequestSchema> & SoftDeleteEntity;
export type CreateEquipmentRequestInput = z.infer<typeof createEquipmentRequestSchema>;
export type ApproveEquipmentRequestInput = z.infer<typeof approveEquipmentRequestSchema>;

// 타입 가드
export const isEquipmentRequest = (value: unknown): value is EquipmentRequest => {
  try {
    return equipmentRequestSchema.parse(value) !== null;
  } catch {
    return false;
  }
};
