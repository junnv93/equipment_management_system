import { Controller, Sse, Request, UseGuards, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { NotificationSseService, MessageEvent } from './notification-sse.service';
import { SseJwtAuthGuard } from './sse-jwt-auth.guard';
import { AuthenticatedRequest } from '../../../types/auth';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * SSE 알림 실시간 스트림 컨트롤러
 *
 * GET /api/notifications/stream?token=<jwt>
 *
 * EventSource API 호환:
 * - Content-Type: text/event-stream
 * - 자동 재연결 (EventSource 기본 동작)
 * - 30초 heartbeat로 프록시 타임아웃 방지
 *
 * 인증:
 * - SseJwtAuthGuard: query param JWT 검증
 * - JwtAuthGuard 대신 별도 가드 사용 (EventSource는 custom header 미지원)
 */
@ApiTags('알림 실시간 스트림')
@Controller('notifications')
export class NotificationSseController {
  private readonly logger = new Logger(NotificationSseController.name);

  constructor(private readonly sseService: NotificationSseService) {}

  @Sse('stream')
  @Public() // 글로벌 JwtAuthGuard 바이패스 — SseJwtAuthGuard가 query param JWT 인증 담당
  @UseGuards(SseJwtAuthGuard)
  @ApiOperation({
    summary: 'SSE 알림 실시간 스트림',
    description:
      '인증된 사용자에게 실시간 알림을 전달하는 SSE 엔드포인트입니다. ' +
      'EventSource API로 연결하세요.',
  })
  @ApiQuery({
    name: 'token',
    description: 'JWT Access Token',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'SSE 스트림 연결 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  stream(@Request() req: AuthenticatedRequest): Observable<MessageEvent> {
    const userId = req.user.userId;
    this.logger.log(`SSE 스트림 연결: userId=${userId}`);

    return this.sseService.createStream(userId);
  }

  /**
   * SSE 커넥션 통계 (모니터링용)
   */
  @Get('stream/stats')
  @Public() // 글로벌 JwtAuthGuard 바이패스 — SseJwtAuthGuard가 query param JWT 인증 담당
  @UseGuards(SseJwtAuthGuard)
  @ApiOperation({
    summary: 'SSE 커넥션 통계',
    description: '현재 활성 SSE 커넥션 수를 반환합니다.',
  })
  getStats() {
    return {
      activeConnections: this.sseService.getActiveConnectionCount(),
    };
  }
}
