import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

/**
 * 승인 관리 모듈
 *
 * 통합 승인 카운트 API를 제공
 *
 * Note: 다른 서비스들(CheckoutsService, CalibrationService 등)을
 * import하지 않고 직접 DB 쿼리를 사용하여 의존성을 최소화
 */
@Module({
  imports: [],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
