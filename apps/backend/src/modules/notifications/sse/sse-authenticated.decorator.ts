import { applyDecorators, UseGuards } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { SseJwtAuthGuard } from './sse-jwt-auth.guard';

/**
 * @SseAuthenticated 데코레이터
 *
 * SSE 스트리밍 엔드포인트를 위한 JWT 인증 패턴입니다.
 *
 * 적용 효과:
 * - @Public(): 글로벌 JwtAuthGuard 우회
 * - @UseGuards(SseJwtAuthGuard): Authorization: Bearer 헤더 JWT 검증 + 블랙리스트 확인
 *
 * 별도 가드가 필요한 이유:
 * EventSource API 표준에서는 커스텀 HTTP 헤더를 지원하지 않으므로,
 * 클라이언트는 fetch + ReadableStream 방식으로 Authorization 헤더를 전달합니다.
 * 글로벌 JwtAuthGuard가 이를 처리하는 대신, SSE 전용 가드가 별도 검증합니다.
 *
 * @example
 * ```typescript
 * @SseAuthenticated()
 * @Sse('stream')
 * stream(@Request() req: AuthenticatedRequest): Observable<MessageEvent> { ... }
 * ```
 */
export const SseAuthenticated = (): MethodDecorator & ClassDecorator =>
  applyDecorators(Public(), UseGuards(SseJwtAuthGuard));
