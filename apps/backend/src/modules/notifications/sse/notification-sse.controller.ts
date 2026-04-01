import { Controller, Sse, Request, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLES } from '../../../common/config/throttle.constants';
import { Observable } from 'rxjs';
import { NotificationSseService, MessageEvent } from './notification-sse.service';
import { SseAuthenticated } from '../../../common/decorators/sse-authenticated.decorator';
import { SkipPermissions } from '../../auth/decorators/skip-permissions.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Permission } from '@equipment-management/shared-constants';
import { AuthenticatedRequest } from '../../../types/auth';

/**
 * SSE 알림 실시간 스트림 컨트롤러
 *
 * GET /api/notifications/stream (Authorization: Bearer <jwt>)
 *
 * EventSource API 호환:
 * - Content-Type: text/event-stream
 * - 자동 재연결 (EventSource 기본 동작)
 * - 30초 heartbeat로 프록시 타임아웃 방지
 *
 * 인증:
 * - SseJwtAuthGuard: Authorization: Bearer <jwt> 헤더로 토큰 검증
 * - 클라이언트는 fetch + ReadableStream 방식으로 Authorization 헤더 전달
 *
 * 권한:
 * - stream(): 인증된 모든 사용자 접근 가능 (@SkipPermissions)
 * - getStats(): VIEW_SYSTEM_SETTINGS 권한 필수 (글로벌 JwtAuthGuard 경로)
 */
@SkipThrottle(SKIP_ALL_THROTTLES)
@ApiTags('알림 실시간 스트림')
@Controller('notifications')
export class NotificationSseController {
  private readonly logger = new Logger(NotificationSseController.name);

  constructor(private readonly sseService: NotificationSseService) {}

  @Sse('stream')
  @SseAuthenticated()
  @SkipPermissions()
  @ApiOperation({
    summary: 'SSE 알림 실시간 스트림',
    description:
      '인증된 사용자에게 실시간 알림을 전달하는 SSE 엔드포인트입니다. ' +
      'EventSource API로 연결하세요.',
  })
  @ApiResponse({ status: 200, description: 'SSE 스트림 연결 성공' })
  @ApiResponse({ status: 401, description: '인증 실패 (Authorization: Bearer <jwt> 헤더 필수)' })
  stream(@Request() req: AuthenticatedRequest): Observable<MessageEvent> {
    const userId = req.user.userId;
    this.logger.log(`SSE 스트림 연결: userId=${userId}`);

    return this.sseService.createStream(userId);
  }

  /**
   * SSE 커넥션 통계 (모니터링용)
   * 일반 HTTP GET — 글로벌 JwtAuthGuard 경로 사용 (SSE 전용 인증 불필요)
   */
  @Get('stream/stats')
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  @ApiOperation({
    summary: 'SSE 커넥션 통계',
    description: '현재 활성 SSE 커넥션 수를 반환합니다.',
  })
  getStats(): { activeConnections: number } {
    return {
      activeConnections: this.sseService.getActiveConnectionCount(),
    };
  }
}
