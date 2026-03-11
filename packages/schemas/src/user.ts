import { z } from 'zod';
import { UserRoleEnum, TeamIdSchema, SiteEnum } from './enums';
import { BaseEntity, SoftDeleteEntity, PaginatedResponse } from './common/base';

// 기본 사용자 스키마 (공통 필드)
export const baseUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: UserRoleEnum,
  teamId: TeamIdSchema, // UUID 형식의 팀 ID
  site: SiteEnum.optional(),
  location: z.string().max(50).optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
  employeeId: z.string().max(50).optional(),
  managerName: z.string().max(100).optional(),
});

// 사용자 생성 스키마
export const createUserSchema = baseUserSchema.extend({
  password: z.string().min(8).max(100),
  isActive: z.boolean().default(true),
});

// 사용자 업데이트 스키마
export const updateUserSchema = baseUserSchema.partial().extend({
  password: z.string().min(8).max(100).optional(),
  isActive: z.boolean().optional(),
});

// 사용자 조회용 스키마
export const userSchema = baseUserSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean(),
  lastLogin: z.date().nullable(),
  equipmentCount: z.number().nonnegative().optional(),
  rentalsCount: z.number().nonnegative().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// 사용자 스키마에서 추출된 타입
export type BaseUser = z.infer<typeof baseUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type User = z.infer<typeof userSchema> & SoftDeleteEntity;

// 사용자 목록 조회를 위한 응답 스키마
export const userListResponseSchema = PaginatedResponse(userSchema);
export type UserListResponse = z.infer<typeof userListResponseSchema>;

// API 응답 전용 UserProfile (GET /api/users/me)
// baseUserSchema에서 파생 — DB 전체 컬럼이 아닌 API 응답 형태
export const userProfileSchema = baseUserSchema.extend({
  id: z.string().uuid(),
  teamName: z.string().optional(),
  isActive: z.boolean(),
  lastLogin: z.coerce.date().nullable().optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// 타입 가드
export const isUser = (value: unknown): value is User => {
  try {
    return userSchema.parse(value) !== null;
  } catch {
    return false;
  }
};
