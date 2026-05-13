/**
 * 도메인 사이드 이펙트 이벤트 상수 (SSOT)
 *
 * 도메인 엔티티 생명주기에서 발생하는 데이터 무결성/정합성 이벤트.
 * - CACHE_EVENTS: 캐시 무효화 전용 (common/cache/cache-events.ts)
 * - NOTIFICATION_EVENTS: 사용자 알림/SSE 전용 (modules/notifications/)
 * - DOMAIN_EVENTS: 도메인 사이드 이펙트 (본 파일) — 캐시/알림 외 데이터 정합성 유지
 *
 * 명명 규약: `domain.<entityCamel>.<verbCamel>` (예: `domain.team.deleted`)
 * emit 위치: Service 계층 전용.
 */
export const DOMAIN_EVENTS = {
  // ─── 팀 (Team) ───
  /** 팀 삭제 시 emit. payload: { teamId: string } */
  TEAM_DELETED: 'domain.team.deleted',
} as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

export interface TeamDeletedPayload {
  teamId: string;
}
