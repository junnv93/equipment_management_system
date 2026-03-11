/**
 * 인증된 요청에서 사용자 ID/사이트를 추출하는 SSOT 유틸리티
 *
 * 모든 컨트롤러에서 동일한 추출 로직을 사용하기 위해 중앙화.
 * 필드 우선순위나 에러 코드가 변경되면 이 파일만 수정.
 *
 * @example
 * // Controller에서 사용
 * const userId = extractUserId(req);
 * const { userId, site, teamId } = extractUserContext(req);
 */

import { UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../types/auth';

/**
 * JWT 토큰에서 사용자 ID를 추출합니다.
 *
 * 필드 우선순위: userId → sub → id → uuid
 * - userId: 표준 JWT 클레임 (기본)
 * - sub: Azure AD 토큰의 subject 클레임 (레거시 호환)
 * - id/uuid: 일부 JWT 구현 호환
 *
 * @throws UnauthorizedException — 모든 필드가 비어있을 때
 *   (빈 문자열 '', 'unknown' 등 무효값도 거부)
 */
export function extractUserId(req: AuthenticatedRequest): string {
  const user = req.user;
  const userId = user?.userId || user?.sub || user?.id || user?.uuid;

  if (!userId) {
    throw new UnauthorizedException({
      code: 'AUTH_USER_ID_MISSING',
      message: 'User identity could not be extracted from the authentication token.',
    });
  }

  return userId;
}

/**
 * JWT 토큰에서 사용자 컨텍스트(ID + site + teamId)를 추출합니다.
 *
 * Write 엔드포인트에서 site 격리 검증이 필요할 때 사용.
 * site가 없는 경우에도 userId는 반드시 반환 (site는 optional).
 */
export function extractUserContext(req: AuthenticatedRequest): {
  userId: string;
  site: string | undefined;
  teamId: string | undefined;
} {
  const userId = extractUserId(req);
  return {
    userId,
    site: req.user?.site,
    teamId: req.user?.teamId,
  };
}
