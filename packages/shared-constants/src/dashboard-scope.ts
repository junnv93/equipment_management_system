/**
 * Dashboard scope SSOT — `getCheckoutsByScope` API 파라미터 enum.
 *
 * 권한 가드(Backend):
 *  - `me`   : 모든 인증 사용자 (자신의 반출만 조회)
 *  - `team` : TECHNICAL_MANAGER / QUALITY_MANAGER / LAB_MANAGER / SYSTEM_ADMIN
 *  - `lab`  : LAB_MANAGER / SYSTEM_ADMIN
 *  - `all`  : SYSTEM_ADMIN
 *
 * BE+FE 모두 본 SSOT 경유 — 인라인 union(`'me' | 'team' | 'lab' | 'all'`) 작성 금지.
 *
 * 소비처:
 *  - `apps/backend/src/modules/dashboard/dto/dashboard-scope.dto.ts` — Zod ValidationPipe
 *  - `apps/backend/src/modules/dashboard/dashboard.service.ts` — service 메서드 시그니처
 *  - `apps/frontend/lib/api/dashboard-api.ts` (등) — 클라이언트 호출 시 타입 보장
 */
export const DASHBOARD_SCOPES = ['me', 'team', 'lab', 'all'] as const;
export type DashboardScope = (typeof DASHBOARD_SCOPES)[number];
