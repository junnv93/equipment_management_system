/**
 * NonConformances 서비스 반환 타입
 *
 * Drizzle $inferSelect + relational query 결과 형상을 정의합니다.
 */
import type { NonConformance } from '@equipment-management/db/schema/non-conformances';
import type { Equipment } from '@equipment-management/db/schema/equipment';
import type { User } from '@equipment-management/db/schema/users';
import type { Team } from '@equipment-management/db/schema/teams';
import type { RepairHistory } from '@equipment-management/db/schema/repair-history';

/** 사용자 요약 (findOne 관계 조회용) */
type UserSummary = Pick<User, 'id' | 'name' | 'email'> & { team: Team | null };

/** findOne 반환 타입 — 부적합 + 관련 엔티티 관계 */
export type NonConformanceDetail = NonConformance & {
  equipment: Pick<Equipment, 'id' | 'name' | 'managementNumber' | 'teamId'> | null;
  repairHistory: Pick<
    RepairHistory,
    'id' | 'repairDate' | 'repairDescription' | 'repairResult'
  > | null;
  discoverer: UserSummary | null;
  corrector: UserSummary | null;
  closer: UserSummary | null;
  rejector: UserSummary | null;
};
