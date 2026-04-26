import { z } from 'zod';
import { CheckoutStatusEnum, CheckoutStatus, CheckoutPurposeEnum, CheckoutPurpose } from './enums';
import { uuidString, optionalUuid } from './utils/fields';
import { NextStepDescriptorSchema } from './fsm/checkout-fsm';

/**
 * ✅ Single Source of Truth 준수
 * CheckoutStatusEnum과 CheckoutPurposeEnum은 enums.ts에서 import하여 사용
 */

// 반출 스키마 (DB: checkouts 테이블 필드명과 일치)
export const CheckoutSchema = z.object({
  id: uuidString(),
  requesterId: uuidString(),
  approverId: optionalUuid(),
  destination: z.string(),
  purpose: CheckoutPurposeEnum,
  reason: z.string(),
  checkoutDate: z.coerce.date().nullable().optional(),
  expectedReturnDate: z.coerce.date(),
  actualReturnDate: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
  status: CheckoutStatusEnum,
  version: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  nextStep: NextStepDescriptorSchema.nullable().optional(),
});

export type Checkout = z.infer<typeof CheckoutSchema>;

// 반출 장비 스키마
export const CheckoutEquipmentSchema = z.object({
  id: uuidString(),
  checkoutId: uuidString(),
  equipmentId: uuidString(),
  sequenceNumber: z.number().int().positive(),
  quantity: z.number().int().positive(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
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

// BFF: 반입 현황 집계 쿼리 스키마 (Sprint 3.1)
export const InboundOverviewQuerySchema = z.object({
  statusFilter: z.string().optional(),
  searchTerm: z.string().optional(),
  limitPerSection: z.coerce.number().int().positive().max(50).default(10),
});
export type InboundOverviewQueryInput = z.infer<typeof InboundOverviewQuerySchema>;

// BFF: 반입 현황 섹션 메타 스키마 (PaginationMeta와 동일 구조)
export const InboundSectionMetaSchema = z.object({
  totalItems: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  itemsPerPage: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
});
export type InboundSectionMeta = z.infer<typeof InboundSectionMetaSchema>;

// BFF: 반입 현황 집계 응답 스키마 (Sprint 3.1)
// items 배열 내부는 각 도메인의 타입 가드로 검증 — Zod passthrough 사용
export const InboundOverviewResponseSchema = z.object({
  standard: z.object({ items: z.array(z.unknown()), meta: InboundSectionMetaSchema }),
  rental: z.object({ items: z.array(z.unknown()), meta: InboundSectionMetaSchema }),
  internalShared: z.object({ items: z.array(z.unknown()), meta: InboundSectionMetaSchema }),
  sparkline: z.object({
    standard: z.array(z.number()).length(14),
    rental: z.array(z.number()).length(14),
    internalShared: z.array(z.number()).length(14),
  }),
  generatedAt: z.string().datetime(),
});
export type InboundOverviewResponseBase = z.infer<typeof InboundOverviewResponseSchema>;
