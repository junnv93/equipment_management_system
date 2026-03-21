import { z } from 'zod';
import { SiteEnum, ClassificationEnum, ClassificationCodeEnum } from './enums';
import { BaseEntity, SoftDeleteEntity, PaginatedResponse } from './common/base';
import { uuidString, optionalUuid } from './utils/fields';

/**
 * ⚠️ SSOT 준수: ClassificationEnum, ClassificationCodeEnum은 enums.ts에서 import
 * - TeamType 제거: Classification 사용 (팀 타입 = 장비 분류)
 * - 레거시 대문자 값 지원 제거: 소문자 통일 (fcc_emc_rf, general_emc, ...)
 * - ClassificationCode 타입은 enums.ts의 ClassificationCodeEnum에서 infer
 */

// 기본 팀 스키마 (공통 필드)
// ✅ SSOT: 팀의 classification = 장비의 classification (동일 enum)
// ✅ 사이트별 팀 구성:
//    - 수원: FCC EMC/RF, General EMC, SAR, Automotive EMC
//    - 의왕: General RF
//    - 평택: Automotive EMC
export const baseTeamSchema = z.object({
  name: z.string().min(1).max(100),
  classification: ClassificationEnum, // ✅ type → classification (장비 분류와 동일)
  site: SiteEnum, // ✅ 필수 필드: 팀 소속 사이트
  classificationCode: ClassificationCodeEnum.optional(), // ✅ SSOT: enums.ts에서 import
  description: z.string().max(500).optional(),
  leaderId: optionalUuid(),
});

// 팀 생성 스키마
export const createTeamSchema = baseTeamSchema;

// 팀 업데이트 스키마 (모든 필드 선택적)
export const updateTeamSchema = baseTeamSchema.partial();

// 팀 조회용 스키마
export const teamSchema = baseTeamSchema.extend({
  id: uuidString(), // ✅ DB와 동기화: uuid 타입
  equipmentCount: z.number().nonnegative().optional(),
  memberCount: z.number().nonnegative().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

// 팀 스키마에서 추출된 타입
export type BaseTeam = z.infer<typeof baseTeamSchema>;
// ✅ z.input: DTO implements 호환 (transform 전 입력 타입 — optional key 유지)
export type CreateTeamInput = z.input<typeof createTeamSchema>;
export type UpdateTeamInput = z.input<typeof updateTeamSchema>;
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
