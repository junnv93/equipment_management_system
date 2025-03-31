import { Module, Global, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { db, pgPool, testConnection } from './drizzle';
import * as schema from './schema';

// Drizzle 서비스 클래스 정의
class DrizzleService implements OnModuleInit, OnModuleDestroy {
  constructor() {}

  async onModuleInit() {
    // 애플리케이션 시작 시 데이터베이스 연결 테스트
    await testConnection();
  }

  async onModuleDestroy() {
    // 애플리케이션 종료 시 풀 연결 종료
    await pgPool.end();
  }

  // DB 인스턴스 반환
  getDB() {
    return db;
  }

  // 스키마 반환
  getSchema() {
    return schema;
  }
}

// 글로벌 Drizzle 모듈 정의
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DRIZZLE_INSTANCE',
      useFactory: (configService: ConfigService) => {
        return db;
      },
      inject: [ConfigService],
    },
    {
      provide: 'DRIZZLE_SCHEMA',
      useValue: schema,
    },
    DrizzleService,
  ],
  exports: ['DRIZZLE_INSTANCE', 'DRIZZLE_SCHEMA', DrizzleService],
})
export class DrizzleModule {}

// Drizzle 인스턴스와 스키마 타입
export { db, schema, testConnection }; 