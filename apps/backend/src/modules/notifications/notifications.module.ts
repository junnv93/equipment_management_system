import { Module, forwardRef } from '@nestjs/common';
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
import { DigestEmailScheduler } from './schedulers/digest-email-scheduler';
import { RetentionExpiryScheduler } from './schedulers/retention-expiry-scheduler';
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
    DigestEmailScheduler,
    RetentionExpiryScheduler,
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
export class NotificationsModule {
  // CalibrationOverdueScheduler, CheckoutOverdueScheduler는
  // 각자의 onModuleInit에서 초기 점검을 실행함 (중복 호출 방지)
}
