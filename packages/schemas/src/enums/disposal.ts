import { z } from 'zod';

// Disposal reason enum
export const DISPOSAL_REASON_VALUES = ['obsolete', 'broken', 'inaccurate', 'other'] as const;
export const DisposalReasonEnum = z.enum(DISPOSAL_REASON_VALUES);
export type DisposalReason = z.infer<typeof DisposalReasonEnum>;

// Disposal review status enum
export const DISPOSAL_REVIEW_STATUS_VALUES = [
  'pending',
  'reviewed',
  'approved',
  'rejected',
] as const;
export const DisposalReviewStatusEnum = z.enum(DISPOSAL_REVIEW_STATUS_VALUES);
export type DisposalReviewStatus = z.infer<typeof DisposalReviewStatusEnum>;
