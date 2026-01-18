import { z } from 'zod';
import { TeamEnum, SiteEnum } from './enums';
import { BaseEntity, SoftDeleteEntity, PaginatedResponse } from './common/base';

// 기본 팀 스키마 (공통 필드)
export const baseTeamSchema = z.object({
  id: TeamEnum,
  name: z.string().min(1).max(100),
  type: z.string().max(50).optional(), // ✅ 팀 타입 추가 (RF, SAR, EMC, AUTO 등)
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid().optional(),
  site: SiteEnum.optional(),
});

// 팀 생성 스키마
export const createTeamSchema = baseTeamSchema;

// 팀 업데이트 스키마
export const updateTeamSchema = baseTeamSchema.partial().omit({ id: true });

// 팀 조회용 스키마
export const teamSchema = baseTeamSchema.extend({
  equipmentCount: z.number().nonnegative().optional(),
  memberCount: z.number().nonnegative().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// 팀 스키마에서 추출된 타입
export type BaseTeam = z.infer<typeof baseTeamSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type Team = z.infer<typeof teamSchema> & SoftDeleteEntity;

// 팀 목록 조회를 위한 응답 스키마
export const teamListResponseSchema = PaginatedResponse(teamSchema);
export type TeamListResponse = z.infer<typeof teamListResponseSchema>;

// 타입 가드
export const isTeam = (value: unknown): value is Team => {
  try {
    return teamSchema.parse(value) !== null;
  } catch {
    return false;
  }
};
