import { z } from 'zod';
import { uuidString } from '../utils/fields';

// 기본 엔티티 스키마
export const baseEntitySchema = z.object({
  id: uuidString(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 소프트 삭제 엔티티 스키마
export const softDeleteEntitySchema = baseEntitySchema.extend({
  deletedAt: z.date().nullable(),
});

// 페이지네이션 파라미터 스키마
export const paginationParamsSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
});

// 페이지네이션된 응답을 위한 제네릭 함수
export const PaginatedResponse = <T extends z.ZodType>(schema: T) =>
  z.object({
    items: z.array(schema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });

// 타입 정의
export type BaseEntity = z.infer<typeof baseEntitySchema>;
export type SoftDeleteEntity = z.infer<typeof softDeleteEntitySchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;

// 페이지네이션된 응답 타입
export type PaginatedResponseType<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
