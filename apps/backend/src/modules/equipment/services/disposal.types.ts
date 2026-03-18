/**
 * DisposalService 반환 타입
 *
 * Drizzle $inferSelect로부터 파생 — DB 스키마 변경 시 자동 반영.
 * 하드코딩 금지: primitive 타입을 직접 선언하지 않고 스키마에서 도출.
 */
import type { disposalRequests } from '@equipment-management/db/schema/disposal-requests';
import type { equipment } from '@equipment-management/db/schema/equipment';
import type { users } from '@equipment-management/db/schema/users';

type DisposalRequest = typeof disposalRequests.$inferSelect;
type Equipment = typeof equipment.$inferSelect;
type User = typeof users.$inferSelect;

/**
 * 폐기 요청 + Relations (getCurrentDisposalRequest 반환 타입)
 *
 * Drizzle `with: { equipment, requester, reviewer, approver, rejector }` 쿼리 결과와 1:1 매핑.
 * - equipment: 항상 존재 (equipmentId NOT NULL)
 * - requester: 항상 존재 (requestedBy NOT NULL)
 * - reviewer/approver/rejector: nullable FK → 미가입 시 null
 */
export type DisposalRequestWithRelations = DisposalRequest & {
  equipment: Equipment;
  requester: User;
  reviewer: User | null;
  approver: User | null;
  rejector: User | null;
};
