import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { InternalApiThrottlerGuard } from './common/guards/internal-api-throttler.guard';
import { THROTTLER_CONFIGS } from './common/config/throttle.constants';
import { validateEnv } from './config/env.validation';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './modules/auth/guards/permissions.guard';
import { SiteScopeInterceptor } from './common/interceptors/site-scope.interceptor';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeamsModule } from './modules/teams/teams.module';
import { CheckoutsModule } from './modules/checkouts/checkouts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CalibrationModule } from './modules/calibration/calibration.module';
import { CalibrationFactorsModule } from './modules/calibration-factors/calibration-factors.module';
import { NonConformancesModule } from './modules/non-conformances/non-conformances.module';
import { SoftwareModule } from './modules/software/software.module';
import { CalibrationPlansModule } from './modules/calibration-plans/calibration-plans.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DrizzleModule } from './database/drizzle.module';
import { CacheModule } from './common/cache/cache.module';
import { CacheEventModule } from './common/cache/cache-event.module';
import { StorageModule } from './common/storage/storage.module';
import { FileUploadModule } from './common/file-upload/file-upload.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { MetricsMiddleware } from './common/metrics/metrics.middleware';
import { LoggerModule } from './common/logger/logger.module';
import { MonitoringMiddleware } from './common/middleware/monitoring.middleware';
import { HelmetConfigService } from './common/middleware/helmet-config';
import { AuditModule } from './modules/audit/audit.module';
import { EquipmentImportsModule } from './modules/equipment-imports/equipment-imports.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DataMigrationModule } from './modules/data-migration/data-migration.module';
import { I18nModule } from './common/i18n/i18n.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(), // 스케줄러 모듈 등록 (교정 기한 초과 자동 점검)
    EventEmitterModule.forRoot({ wildcard: false, maxListeners: 100 }), // 도메인 이벤트 버스
    ThrottlerModule.forRoot([...THROTTLER_CONFIGS]),

    // 공통 모듈
    CacheModule,
    CacheEventModule, // EventEmitterModule 이후 — 이벤트 기반 캐시 무효화
    StorageModule,
    FileUploadModule,
    LoggerModule,
    MetricsModule,
    AuditModule,
    I18nModule, // 글로벌 i18n 서비스 (Accept-Language 기반 로케일)

    // 데이터베이스 모듈
    DrizzleModule,

    // 기능 모듈
    AuthModule,
    EquipmentModule,
    TeamsModule,
    UsersModule,
    CheckoutsModule,
    CalibrationModule,
    CalibrationFactorsModule,
    NonConformancesModule,
    SoftwareModule,
    CalibrationPlansModule,
    NotificationsModule,
    ReportsModule,
    MonitoringModule,
    DashboardModule,
    EquipmentImportsModule, // Unified rental + internal shared imports
    ApprovalsModule, // Unified approval counts API
    SettingsModule, // System + calibration settings
    DocumentsModule, // 통합 문서 관리 (다운로드, 무결성 검증, 버전 관리)
    DataMigrationModule, // Excel → DB 일괄 장비 마이그레이션
  ],
  controllers: [],
  providers: [
    HelmetConfigService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: InternalApiThrottlerGuard,
    },
    // 전역 사이트 스코프 인터셉터 — @SiteScoped() 데코레이터가 있는 엔드포인트에서만 활성화
    {
      provide: APP_INTERCEPTOR,
      useClass: SiteScopeInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(MetricsMiddleware)
      .exclude('metrics') // metrics 엔드포인트 자체는 제외
      .forRoutes('*'); // 모든 경로에 적용

    consumer
      .apply(MonitoringMiddleware)
      .exclude('monitoring') // 모니터링 엔드포인트 자체는 제외
      .forRoutes('*'); // 모든 경로에 적용
  }
}
