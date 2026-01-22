import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import * as schema from './schema';
import { getErrorMessage } from '../../common/utils/error';

// 환경 변수 로드
dotenv.config();

// 로거 설정
const logger = new Logger('DrizzleORM');

// 통합된 데이터베이스 연결 설정
const dbConfig: PoolConfig = {
  // DATABASE_URL 우선 사용, 없으면 개별 환경 변수 사용
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'equipment_management',
  max: parseInt(process.env.DB_POOL_MAX || '50', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  application_name: 'equipment_management_system',
  statement_timeout: 30000, // 30초
  query_timeout: 30000, // 30초
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Postgres 연결 풀 생성
export const pgPool = new Pool(dbConfig);

// 메트릭 추적
const metrics = {
  connectionsCreated: 0,
  connectionsAcquired: 0,
  connectionErrors: 0,
  lastErrorTime: null as Date | null,
  lastReconnectTime: null as Date | null,
};

// 연결 이벤트 리스너
pgPool.on('connect', () => {
  metrics.connectionsCreated++;
  logger.debug('New client connected to PostgreSQL');
});

pgPool.on('acquire', () => {
  metrics.connectionsAcquired++;
  logger.debug('Client acquired from pool');
});

pgPool.on('remove', () => {
  logger.debug('Client removed from pool');
});

// 오류 이벤트 리스너 - 개선된 재연결 로직
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectInterval = 5000;

pgPool.on('error', (err) => {
  metrics.connectionErrors++;
  metrics.lastErrorTime = new Date();
  logger.error(`PostgreSQL connection error: ${err.message}`);

  // 백오프 알고리즘을 사용한 재연결
  if (reconnectAttempts < maxReconnectAttempts) {
    const backoffTime = reconnectInterval * Math.pow(2, reconnectAttempts);
    setTimeout(async () => {
      reconnectAttempts++;
      logger.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);

      try {
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release();

        reconnectAttempts = 0; // 성공 시 카운터 리셋
        metrics.lastReconnectTime = new Date();
        logger.log('Successfully reconnected to PostgreSQL');
      } catch (error) {
        logger.error(`Reconnection failed: ${getErrorMessage(error)}`);
      }
    }, backoffTime);
  } else {
    logger.error('Max reconnection attempts reached. Please check database connection.');
  }
});

// 애플리케이션 종료 시 정리
process.on('SIGINT', () => {
  pgPool.end(() => {
    logger.log('PostgreSQL connection pool closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  pgPool.end(() => {
    logger.log('PostgreSQL connection pool closed');
    process.exit(0);
  });
});

// Drizzle ORM 인스턴스 생성 (스키마 포함)
export const db = drizzle(pgPool, { schema });

// 데이터베이스 연결 테스트 함수
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    if (result.rows.length > 0) {
      logger.log(`PostgreSQL connection successful: ${result.rows[0].now}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`PostgreSQL connection test failed: ${getErrorMessage(error)}`);
    return false;
  }
}

// 메트릭 조회 함수
export function getConnectionMetrics() {
  return {
    ...metrics,
    poolTotalCount: pgPool.totalCount,
    poolIdleCount: pgPool.idleCount,
    poolWaitingCount: pgPool.waitingCount,
  };
}

// 헬스 체크 함수
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await testConnection();
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: getErrorMessage(error),
    };
  }
}
