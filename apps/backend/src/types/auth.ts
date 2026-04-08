import { Request } from 'express';
import type { ResolvedDataScope } from '@equipment-management/shared-constants';
import type { EnforcedScope } from '../common/scope/scope-enforcer';

/**
 * JWT 토큰에서 추출되는 사용자 정보
 *
 * @property userId - 기본 사용자 ID (우선 사용)
 * @property sub - Azure AD 토큰의 sub 클레임 (레거시 호환)
 * @property id - 일부 JWT 구현의 id 필드 (레거시 호환)
 * @property uuid - 사용자 UUID (레거시 호환)
 */
export interface JwtUser {
  userId: string;
  email: string;
  name?: string;
  roles: string[];
  permissions?: string[]; // ✅ Phase 2: Server-Driven UI를 위한 권한 목록
  department?: string;
  site?: string;
  location?: string;
  position?: string;
  teamId?: string;
  // 레거시 호환성을 위한 optional 필드
  sub?: string;
  id?: string;
  uuid?: string;
}

/**
 * 인증된 Request 타입
 * JWT 가드를 통과한 후 req.user에 접근할 때 사용
 *
 * ## 스코프 필드 (SiteScopeInterceptor 가 주입)
 * `@SiteScoped({ policy })` 데코레이터가 붙은 라우트에서는 인터셉터가 다음을 attach:
 * - `dataScope`: `resolveDataScope(...)` 결과 (raw scope 객체, label/type 포함)
 * - `enforcedScope`: `enforceScope(query, dataScope)` 결과 (cross-border 검증 통과한 값)
 *
 * controller 는 `_resolveReportScope` 같은 helper 를 직접 호출할 필요 없이
 * `req.dataScope` / `req.enforcedScope` 를 읽거나 `@CurrentScope()` /
 * `@CurrentEnforcedScope()` parameter decorator 로 받을 수 있다.
 */
export interface AuthenticatedRequest extends Request {
  user: JwtUser;
  dataScope?: ResolvedDataScope;
  enforcedScope?: EnforcedScope;
}

/**
 * Azure AD 토큰에서 추출되는 프로필 정보
 */
export interface AzureADProfile {
  oid?: string;
  sub?: string;
  upn?: string;
  preferred_username?: string;
  name?: string;
  email?: string;
  roles?: string[];
  department?: string;
}

/**
 * Passport AuthGuard handleRequest 파라미터 타입
 */
export type AuthGuardError = Error | null;
export type AuthGuardUser = JwtUser | null | false;
export type AuthGuardInfo = { message?: string } | string | null;
