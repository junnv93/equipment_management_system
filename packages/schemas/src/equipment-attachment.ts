import { z } from 'zod';
import { SoftDeleteEntity } from './common/base';

// 첨부 파일 타입 enum
export const AttachmentTypeEnum = z.enum(['inspection_report', 'history_card', 'other']);
export type AttachmentType = z.infer<typeof AttachmentTypeEnum>;

// 장비 첨부 파일 스키마
export const equipmentAttachmentSchema = z.object({
  id: z.number().int().positive(),
  uuid: z.string().uuid(),
  equipmentId: z.number().int().positive().nullable().optional(),
  requestId: z.number().int().positive().nullable().optional(),
  attachmentType: AttachmentTypeEnum,
  fileName: z.string().max(255),
  originalFileName: z.string().max(255),
  filePath: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(100),
  description: z.string().nullable().optional(),
  uploadedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// 장비 첨부 파일 생성 스키마
export const createEquipmentAttachmentSchema = z.object({
  equipmentId: z.number().int().positive().optional(),
  requestId: z.number().int().positive().optional(),
  attachmentType: AttachmentTypeEnum,
  fileName: z.string().max(255),
  originalFileName: z.string().max(255),
  filePath: z.string(),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024), // 최대 10MB
  mimeType: z.string().max(100),
  description: z.string().optional(),
});

// 타입 정의
export type EquipmentAttachment = z.infer<typeof equipmentAttachmentSchema> & SoftDeleteEntity;
export type CreateEquipmentAttachmentInput = z.infer<typeof createEquipmentAttachmentSchema>;

// 타입 가드
export const isEquipmentAttachment = (value: unknown): value is EquipmentAttachment => {
  try {
    return equipmentAttachmentSchema.parse(value) !== null;
  } catch {
    return false;
  }
};
