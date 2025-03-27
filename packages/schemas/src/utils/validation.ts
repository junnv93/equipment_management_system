import { z } from 'zod';
import { PaginatedResponseType } from '../common/base';

/**
 * API 응답 데이터를 검증하는 제네릭 함수
 */
export function validateApiResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * 페이지네이션된 API 응답을 검증하는 제네릭 함수
 */
export function validatePaginatedResponse<T>(
  schema: z.ZodType<T>,
  data: unknown
): PaginatedResponseType<T> {
  const paginatedSchema = z.object({
    items: z.array(schema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });

  return paginatedSchema.parse(data);
}

/**
 * API 응답 데이터를 안전하게 변환하는 제네릭 함수
 * 검증에 실패하면 null을 반환
 */
export function safeParseApiResponse<T>(schema: z.ZodType<T>, data: unknown): T | null {
  try {
    return validateApiResponse(schema, data);
  } catch {
    return null;
  }
}

/**
 * 페이지네이션된 API 응답을 안전하게 변환하는 제네릭 함수
 * 검증에 실패하면 null을 반환
 */
export function safeParsePaginatedResponse<T>(
  schema: z.ZodType<T>,
  data: unknown
): PaginatedResponseType<T> | null {
  try {
    return validatePaginatedResponse(schema, data);
  } catch {
    return null;
  }
} 