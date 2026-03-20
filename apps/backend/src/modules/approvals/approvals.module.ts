import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalSseListener } from './approval-sse.listener';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * 승인 관리 모듈
 *
 * 통합 승인 카운트 API를 제공
 *
 * Note: 다른 서비스들(CheckoutsService, CalibrationService 등)을
 * import하지 않고 직접 DB 쿼리를 사용하여 의존성을 최소화
 *
 * SSE: ApprovalSseListener가 승인 관련 도메인 이벤트를 감지하여
 * 연결된 프론트엔드 클라이언트에 실시간 브로드캐스트
 */
@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalSseListener],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
