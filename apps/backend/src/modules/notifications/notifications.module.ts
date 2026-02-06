import { Module, forwardRef, OnModuleInit, Logger } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { IntermediateCheckScheduler } from './schedulers/intermediate-check-scheduler';
import { CalibrationOverdueScheduler } from './schedulers/calibration-overdue-scheduler';
import { CalibrationModule } from '../calibration/calibration.module';

@Module({
  imports: [forwardRef(() => CalibrationModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService, IntermediateCheckScheduler, CalibrationOverdueScheduler],
  exports: [NotificationsService, IntermediateCheckScheduler, CalibrationOverdueScheduler],
})
export class NotificationsModule implements OnModuleInit {
  private readonly logger = new Logger(NotificationsModule.name);

  constructor(private readonly calibrationOverdueScheduler: CalibrationOverdueScheduler) {}

  /**
   * 애플리케이션 시작 시 교정 기한 초과 점검 즉시 실행
   *
   * 근본적인 해결책:
   * - 앱 시작 시 기존 교정기한 초과 장비를 즉시 부적합으로 전환
   * - 스케줄러가 자정에만 실행되므로 시작 시점의 상태 동기화 필요
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('애플리케이션 시작 시 교정 기한 초과 점검 실행...');
    try {
      const result = await this.calibrationOverdueScheduler.handleCalibrationOverdueCheck();
      this.logger.log(
        `초기 교정 기한 초과 점검 완료: 처리 ${result.processed}건, 생성 ${result.created}건, 건너뜀 ${result.skipped}건`
      );
    } catch (error) {
      this.logger.error(
        '초기 교정 기한 초과 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
