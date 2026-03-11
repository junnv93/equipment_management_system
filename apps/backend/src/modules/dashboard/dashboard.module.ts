import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DrizzleModule } from '../../database/drizzle.module';
import { ApprovalsModule } from '../approvals/approvals.module';

/**
 * 대시보드 모듈
 *
 * 역할별 맞춤형 대시보드 데이터를 제공합니다.
 * - 장비 현황 집계
 * - 교정 일정 및 지연 현황
 * - 대여/반출 현황
 * - 승인 대기 카운트 (ApprovalsService에 위임)
 * - 최근 활동 내역
 */
@Module({
  imports: [DrizzleModule, ApprovalsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
