import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeamsModule } from './modules/teams/teams.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { CheckoutsModule } from './modules/checkouts/checkouts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CalibrationModule } from './modules/calibration/calibration.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { DrizzleModule } from './database/drizzle.module';
import { CacheModule } from './common/cache/cache.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { MetricsMiddleware } from './common/metrics/metrics.middleware';
import { LoggerModule } from './common/logger/logger.module';
import { MonitoringMiddleware } from './common/middleware/monitoring.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 공통 모듈
    CacheModule,
    LoggerModule,
    MetricsModule,

    // 데이터베이스 모듈
    DrizzleModule,

    // 기능 모듈
    AuthModule,
    EquipmentModule,
    TeamsModule,
    UsersModule,
    RentalsModule,
    CheckoutsModule,
    CalibrationModule,
    NotificationsModule,
    ReportsModule,
    MonitoringModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
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
