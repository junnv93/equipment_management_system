import { Module, Global, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  db,
  pgPool,
  testConnection,
  healthCheck,
  getConnectionMetrics,
} from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';

// Drizzle 서비스 클래스 정의
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  private healthCheckInterval: NodeJS.Timer;

  constructor() {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing database connection...');

    // 애플리케이션 시작 시 데이터베이스 연결 테스트
    const isConnected = await testConnection();

    if (!isConnected) {
      const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

      if (isTestEnv) {
        // 테스트 환경에서는 연결 실패 시 경고만 하고 계속 진행
        // (E2E 테스트는 실제 데이터베이스가 필요하지만, 연결 실패 시 더 명확한 메시지 제공)
        this.logger.warn(
          '⚠️  Database connection failed in test environment. ' +
            'Please ensure PostgreSQL is running and DATABASE_URL is correctly configured. ' +
            'E2E tests require a running database instance.'
        );
        // 테스트 환경에서는 예외를 던지지 않고 계속 진행
        // 실제 테스트 실행 시 데이터베이스 연결이 필요하면 테스트 자체가 실패할 것
      } else {
        // 프로덕션/개발 환경에서는 연결 실패 시 예외 발생
        this.logger.error('Failed to connect to database on startup');
        throw new Error('Database connection failed');
      }
    } else {
      this.logger.log('✅ Database connection established successfully');

      // 주기적인 헬스 체크 시작 (30초마다) - 연결 성공 시에만
      this.healthCheckInterval = setInterval(async () => {
        const health = await healthCheck();

        if (health.status === 'unhealthy') {
          this.logger.warn(`Database health check failed: ${health.error}`);
        } else {
          this.logger.debug(`Database health check passed (latency: ${health.latency}ms)`);
        }
      }, 30000);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing database connection...');

    // 헬스 체크 중지
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval as NodeJS.Timeout);
    }

    // 애플리케이션 종료 시 풀 연결 종료
    await pgPool.end();
    this.logger.log('Database connection closed');
  }

  // DB 인스턴스 반환
  getDB(): unknown {
    return db;
  }

  // 스키마 반환
  getSchema(): typeof import('/home/kmjkds/equipment_management_system/packages/db/src/schema/index') {
    return schema;
  }

  // 연결 메트릭 반환
  getMetrics(): unknown {
    return getConnectionMetrics();
  }

  // 헬스 체크 수행
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string | undefined;
  }> {
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
