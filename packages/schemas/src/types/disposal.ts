import { z } from 'zod';
import { DisposalReasonEnum, DisposalReviewStatusEnum } from '../enums';
import { uuidString, optionalUuid } from '../utils/fields';

export const DisposalAttachmentSchema = z.object({
  id: uuidString(),
  filename: z.string(),
  url: z.string(),
  uploadedAt: z.string().datetime(),
});

export const DisposalRequestSchema = z.object({
  id: uuidString(),
  equipmentId: uuidString(),
  reason: DisposalReasonEnum,
  reasonDetail: z.string().min(10, '10자 이상 입력해주세요'),
  attachments: z.array(DisposalAttachmentSchema).optional(),
  requestedBy: uuidString(),
  requestedByName: z.string(),
  requestedAt: z.string().datetime(),
  reviewStatus: DisposalReviewStatusEnum,
  reviewedBy: optionalUuid(),
  reviewedByName: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
  reviewOpinion: z.string().optional(),
  approvedBy: optionalUuid(),
  approvedByName: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  approvalComment: z.string().optional(),
  rejectedBy: optionalUuid(),
  rejectedByName: z.string().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  rejectionStep: z.enum(['review', 'approval']).optional(),
  version: z.number().int().positive(),
});

export type DisposalAttachment = z.infer<typeof DisposalAttachmentSchema>;
export type DisposalRequest = z.infer<typeof DisposalRequestSchema>;
