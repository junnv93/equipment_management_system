import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
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
import { MetricsModule } from './common/metrics/metrics.module';
import { MetricsMiddleware } from './common/metrics/metrics.middleware';
import { LoggerModule } from './common/logger/logger.module';
import { MonitoringMiddleware } from './common/middleware/monitoring.middleware';
import { HelmetConfigService } from './common/middleware/helmet-config';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(), // 스케줄러 모듈 등록 (교정 기한 초과 자동 점검)

    // 공통 모듈
    CacheModule,
    LoggerModule,
    MetricsModule,
    AuditModule,

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
  ],
  controllers: [],
  providers: [
    HelmetConfigService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
