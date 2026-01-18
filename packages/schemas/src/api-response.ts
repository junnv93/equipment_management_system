/**
 * API 응답 구조 표준 정의
 *
 * ✅ Single Source of Truth: 모든 API 응답 타입은 여기서 정의
 * ✅ 백엔드와 프론트엔드 간 일관성 보장
 */

import { z } from 'zod';

/**
 * 페이지네이션 메타데이터 스키마
 * 백엔드 서비스에서 반환하는 구조와 일치
 */
export const paginationMetaSchema = z.object({
  totalItems: z.number(),
  itemCount: z.number(),
  itemsPerPage: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/**
 * 페이지네이션된 목록 응답 스키마
 * 백엔드 서비스에서 반환하는 구조: { items: [], meta: {...} }
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    meta: paginationMetaSchema,
  });
}

/**
 * 페이지네이션된 목록 응답 타입
 * 백엔드 서비스에서 반환하는 구조
 */
export interface PaginatedListResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * 단일 리소스 응답 타입
 * 백엔드 컨트롤러에서 직접 반환하는 구조 (서비스에서 반환한 값을 그대로 반환)
 */
export type SingleResourceResponse<T> = T;

/**
 * 프론트엔드에서 사용하는 페이지네이션 응답 타입
 * 백엔드 응답을 프론트엔드에서 사용하기 편한 형태로 변환
 */
export interface FrontendPaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
    };
  };
}
