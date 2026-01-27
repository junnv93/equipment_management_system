import { z } from 'zod';
import { SiteEnum } from './enums';
import { BaseEntity, SoftDeleteEntity, PaginatedResponse } from './common/base';

// 팀 타입 열거형
// ✅ 팀 이름 = 분류 이름 (통일)
export const TeamTypeEnum = z.enum([
  'FCC_EMC_RF',     // FCC EMC/RF → E
  'GENERAL_EMC',    // General EMC → R
  'GENERAL_RF',     // General RF → W (의왕)
  'SAR',            // SAR → S
  'AUTOMOTIVE_EMC', // Automotive EMC → A
  'SOFTWARE',       // Software Program → P
  // 레거시 호환성 (기존 데이터 지원)
  'RF',             // → FCC_EMC_RF
  'EMC',            // → GENERAL_EMC
  'AUTO',           // → AUTOMOTIVE_EMC
]);
export type TeamType = z.infer<typeof TeamTypeEnum>;

// 분류코드 열거형 (팀과 1:1 매핑)
export const ClassificationCodeEnum = z.enum(['E', 'R', 'W', 'S', 'A', 'P']);
export type ClassificationCode = z.infer<typeof ClassificationCodeEnum>;

// 기본 팀 스키마 (공통 필드)
// ✅ Best Practice: 팀 이름 = 분류 이름 (통일)
// ✅ 사이트별 팀 구성:
//    - 수원: FCC EMC/RF, General EMC, SAR, Automotive EMC
//    - 의왕: General RF
//    - 평택: Automotive EMC
export const baseTeamSchema = z.object({
  name: z.string().min(1).max(100),
  type: TeamTypeEnum, // ✅ 필수 필드: 팀 타입 (분류와 매핑)
  site: SiteEnum, // ✅ 필수 필드: 팀 소속 사이트
  classificationCode: ClassificationCodeEnum.optional(), // 분류코드 (E, R, W, S, A, P)
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid().optional(),
});

// 팀 생성 스키마
export const createTeamSchema = baseTeamSchema;

// 팀 업데이트 스키마 (모든 필드 선택적)
export const updateTeamSchema = baseTeamSchema.partial();

// 팀 조회용 스키마
export const teamSchema = baseTeamSchema.extend({
  id: z.string().uuid(), // ✅ DB와 동기화: uuid 타입
  equipmentCount: z.number().nonnegative().optional(),
  memberCount: z.number().nonnegative().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
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
