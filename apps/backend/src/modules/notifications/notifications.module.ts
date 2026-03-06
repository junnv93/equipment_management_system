import { Module, forwardRef, OnModuleInit, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationRecipientResolver } from './services/notification-recipient-resolver';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationDispatcher } from './services/notification-dispatcher';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { NotificationEventListener } from './listeners/notification-event-listener';
import { IntermediateCheckScheduler } from './schedulers/intermediate-check-scheduler';
import { CalibrationOverdueScheduler } from './schedulers/calibration-overdue-scheduler';
import { CheckoutOverdueScheduler } from './schedulers/checkout-overdue-scheduler';
import { NotificationCleanupScheduler } from './schedulers/notification-cleanup-scheduler';
import { NotificationSseService } from './sse/notification-sse.service';
import { NotificationSseController } from './sse/notification-sse.controller';
import { SseJwtAuthGuard } from '../../common/guards/sse-jwt-auth.guard';
import { CalibrationModule } from '../calibration/calibration.module';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../../database/drizzle.module';
import { CacheModule } from '../../common/cache/cache.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    forwardRef(() => CalibrationModule),
    forwardRef(() => AuthModule),
    DrizzleModule,
    CacheModule,
    SettingsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  // SSE 컨트롤러를 먼저 등록 — /notifications/stream이 :id 파라미터보다 먼저 매칭되어야 함
  controllers: [NotificationSseController, NotificationsController],
  providers: [
    // 핵심 서비스
    NotificationsService,
    NotificationTemplateService,
    NotificationRecipientResolver,
    NotificationPreferencesService,
    NotificationDispatcher,
    EmailService,
    EmailTemplateService,

    // SSE 실시간 푸시
    NotificationSseService,
    SseJwtAuthGuard,

    // 이벤트 리스너 (범용 — 27개 이벤트 자동 처리)
    NotificationEventListener,

    // 스케줄러
    IntermediateCheckScheduler,
    CalibrationOverdueScheduler,
    CheckoutOverdueScheduler,
    NotificationCleanupScheduler,
  ],
  exports: [
    NotificationsService,
    NotificationDispatcher,
    NotificationSseService,
    EmailService,
    EmailTemplateService,
    IntermediateCheckScheduler,
    CalibrationOverdueScheduler,
    CheckoutOverdueScheduler,
  ],
})
export class NotificationsModule implements OnModuleInit {
  private readonly logger = new Logger(NotificationsModule.name);

  constructor(
    private readonly calibrationOverdueScheduler: CalibrationOverdueScheduler,
    private readonly checkoutOverdueScheduler: CheckoutOverdueScheduler
  ) {}

  /**
   * 애플리케이션 시작 시 교정/반출 기한 초과 점검 즉시 실행
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

    // CheckoutOverdueScheduler는 자체 onModuleInit에서 실행됨 (별도 호출 불필요)
  }
}
