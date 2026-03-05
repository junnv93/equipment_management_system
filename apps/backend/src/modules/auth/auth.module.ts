import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ACCESS_TOKEN_EXPIRES_IN } from '@equipment-management/shared-constants';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TestAuthController } from './test-auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AzureADStrategy } from './strategies/azure-ad.strategy';
import { UsersModule } from '../users/users.module';
import { TOKEN_BLACKLIST } from './blacklist/token-blacklist.interface';
import { InMemoryBlacklistProvider } from './blacklist/in-memory-blacklist.provider';
import { RedisBlacklistProvider } from './blacklist/redis-blacklist.provider';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: ACCESS_TOKEN_EXPIRES_IN }, // shared-constants
      }),
    }),
  ],
  controllers: [
    AuthController,
    // 테스트 전용 라우트 — 프로덕션에서는 라우트 자체가 등록되지 않음
    ...(process.env.NODE_ENV !== 'production' ? [TestAuthController] : []),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    // Azure AD 설정이 있을 때만 AzureADStrategy 등록
    // 테스트 환경에서는 환경 변수가 없어도 더미 값으로 초기화되도록 AzureADStrategy 내부에서 처리
    AzureADStrategy,
    // 토큰 블랙리스트 Provider: REDIS_URL 환경변수 존재 시 Redis, 없으면 In-Memory
    {
      provide: TOKEN_BLACKLIST,
      inject: [ConfigService, SimpleCacheService],
      useFactory: (configService: ConfigService, cacheService: SimpleCacheService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return new RedisBlacklistProvider(configService);
        }
        return new InMemoryBlacklistProvider(cacheService);
      },
    },
  ],
  exports: [AuthService, TOKEN_BLACKLIST],
})
export class AuthModule {}
