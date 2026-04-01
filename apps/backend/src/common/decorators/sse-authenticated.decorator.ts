import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { SseJwtAuthGuard } from '../guards/sse-jwt-auth.guard';

/**
 * 글로벌 JwtAuthGuard만 우회하는 metadata key.
 *
 * @Public()은 JwtAuthGuard + PermissionsGuard 모두 우회하므로,
 * SSE처럼 "자체 인증 가드 사용 + 권한 검사는 유지"가 필요한 경우
 * 이 키로 JwtAuthGuard만 선택적으로 우회합니다.
 */
export const SKIP_GLOBAL_JWT_KEY = 'skipGlobalJwt';

/**
 * @SseAuthenticated 데코레이터
 *
 * SSE 스트리밍 엔드포인트를 위한 JWT 인증 패턴입니다.
 *
 * 적용 효과:
 * - SKIP_GLOBAL_JWT_KEY: 글로벌 JwtAuthGuard만 우회 (PermissionsGuard는 정상 동작)
 * - @UseGuards(SseJwtAuthGuard): Authorization: Bearer 헤더 JWT 검증 + 블랙리스트 확인
 *
 * 별도 가드가 필요한 이유:
 * EventSource API 표준에서는 커스텀 HTTP 헤더를 지원하지 않으므로,
 * 클라이언트는 fetch + ReadableStream 방식으로 Authorization 헤더를 전달합니다.
 * 글로벌 JwtAuthGuard가 이를 처리하는 대신, SSE 전용 가드가 별도 검증합니다.
 *
 * 권한 검사:
 * PermissionsGuard가 정상 동작하므로, SSE 엔드포인트에서도
 * @RequirePermissions() 또는 @SkipPermissions()를 명시해야 합니다.
 *
 * @example
 * ```typescript
 * @SseAuthenticated()
 * @SkipPermissions()  // 인증된 사용자 누구나 접근
 * @Sse('stream')
 * stream(@Request() req: AuthenticatedRequest): Observable<MessageEvent> { ... }
 * ```
 */
export const SseAuthenticated = (): MethodDecorator & ClassDecorator =>
  applyDecorators(SetMetadata(SKIP_GLOBAL_JWT_KEY, true), UseGuards(SseJwtAuthGuard));
