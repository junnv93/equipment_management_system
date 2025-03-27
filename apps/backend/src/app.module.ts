import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamsModule } from './modules/teams/teams.module';
import { UsersModule } from './modules/users/users.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { CalibrationModule } from './modules/calibration/calibration.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    EquipmentModule,
    TeamsModule,
    UsersModule,
    RentalsModule,
    CalibrationModule,
    NotificationsModule,
    ReportsModule
  ],
  controllers: [],
  providers: [
    // 전역적으로 JWT 인증 가드 적용
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {} 