import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './database/drizzle.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true, // 전역적으로 사용하기 위한 설정
      envFilePath: ['.env', '.env.local'], // 환경 변수 파일 경로
    }),
    // 데이터베이스 모듈
    DrizzleModule,
    // 인증 모듈
    AuthModule,
    // 사용자 모듈
    UsersModule,
    // 상태 확인 모듈
    HealthModule,
  ],
})
export class AppModule {}
