import { Module, Global, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { db, pgPool, testConnection, healthCheck, getConnectionMetrics } from './drizzle';
import * as schema from './drizzle/schema';

// Drizzle 서비스 클래스 정의
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  private healthCheckInterval: NodeJS.Timer;

  constructor() {}

  async onModuleInit() {
    this.logger.log('Initializing database connection...');
    
    // 애플리케이션 시작 시 데이터베이스 연결 테스트
    const isConnected = await testConnection();
    
    if (!isConnected) {
      this.logger.error('Failed to connect to database on startup');
      throw new Error('Database connection failed');
    }
    
    // 주기적인 헬스 체크 시작 (30초마다)
    this.healthCheckInterval = setInterval(async () => {
      const health = await healthCheck();
      
      if (health.status === 'unhealthy') {
        this.logger.warn(`Database health check failed: ${health.error}`);
      } else {
        this.logger.debug(`Database health check passed (latency: ${health.latency}ms)`);
      }
    }, 30000);
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection...');
    
    // 헬스 체크 중지
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // 애플리케이션 종료 시 풀 연결 종료
    await pgPool.end();
    this.logger.log('Database connection closed');
  }

  // DB 인스턴스 반환
  getDB() {
    return db;
  }

  // 스키마 반환
  getSchema() {
    return schema;
  }

  // 연결 메트릭 반환
  getMetrics() {
    return getConnectionMetrics();
  }

  // 헬스 체크 수행
  async performHealthCheck() {
    return await healthCheck();
  }
}

// 글로벌 Drizzle 모듈 정의
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DRIZZLE_INSTANCE',
      useFactory: () => db,
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
export { db, schema, testConnection, healthCheck, getConnectionMetrics }; 