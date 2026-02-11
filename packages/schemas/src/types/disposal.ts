import { z } from 'zod';
import { DisposalReasonEnum, DisposalReviewStatusEnum } from '../enums';

export const DisposalAttachmentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  url: z.string(),
  uploadedAt: z.string().datetime(),
});

export const DisposalRequestSchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  reason: DisposalReasonEnum,
  reasonDetail: z.string().min(10, '10자 이상 입력해주세요'),
  attachments: z.array(DisposalAttachmentSchema).optional(),
  requestedBy: z.string().uuid(),
  requestedByName: z.string(),
  requestedAt: z.string().datetime(),
  reviewStatus: DisposalReviewStatusEnum,
  reviewedBy: z.string().uuid().optional(),
  reviewedByName: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
  reviewOpinion: z.string().optional(),
  approvedBy: z.string().uuid().optional(),
  approvedByName: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  approvalComment: z.string().optional(),
  rejectedBy: z.string().uuid().optional(),
  rejectedByName: z.string().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  rejectionStep: z.enum(['review', 'approval']).optional(),
  version: z.number().int().positive(),
});

export type DisposalAttachment = z.infer<typeof DisposalAttachmentSchema>;
export type DisposalRequest = z.infer<typeof DisposalRequestSchema>;
