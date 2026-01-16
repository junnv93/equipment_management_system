import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';

// 환경 변수 로드
dotenv.config();

/**
 * 데이터베이스 연결 설정 생성 함수
 *
 * DATABASE_URL이 있으면 우선 사용하고,
 * 없으면 개별 환경 변수를 조합하여 사용합니다.
 */
function createDbConfig(): PoolConfig {
  // DATABASE_URL이 있으면 우선 사용 (테스트 환경에서 중요)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || '50', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
      application_name: 'equipment_management_system',
      statement_timeout: 30000,
      query_timeout: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };
  }

  // DATABASE_URL이 없으면 개별 환경 변수 사용
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'equipment_management',
    max: parseInt(process.env.DB_POOL_MAX || '50', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
    application_name: 'equipment_management_system',
    statement_timeout: 30000,
    query_timeout: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };
}

// 통합된 데이터베이스 연결 설정
const dbConfig = createDbConfig();

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
});

pgPool.on('acquire', () => {
  metrics.connectionsAcquired++;
});

// 오류 이벤트 리스너 - 개선된 재연결 로직
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectInterval = 5000;

pgPool.on('error', (err) => {
  metrics.connectionErrors++;
  metrics.lastErrorTime = new Date();
  console.error(`PostgreSQL connection error: ${err.message}`);

  // 백오프 알고리즘을 사용한 재연결
  if (reconnectAttempts < maxReconnectAttempts) {
    const backoffTime = reconnectInterval * Math.pow(2, reconnectAttempts);
    setTimeout(async () => {
      reconnectAttempts++;
      console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);

      try {
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release();

        reconnectAttempts = 0; // 성공 시 카운터 리셋
        metrics.lastReconnectTime = new Date();
        console.log('Successfully reconnected to PostgreSQL');
      } catch (error) {
        console.error(
          `Reconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }, backoffTime);
  } else {
    console.error('Max reconnection attempts reached. Please check database connection.');
  }
});

// 애플리케이션 종료 시 정리
process.on('SIGINT', () => {
  pgPool.end(() => {
    console.log('PostgreSQL connection pool closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  pgPool.end(() => {
    console.log('PostgreSQL connection pool closed');
    process.exit(0);
  });
});

// Drizzle ORM 인스턴스 생성 (스키마 포함)
export const db = drizzle(pgPool, { schema });

// 스키마 export
export * as schema from './schema';

// 데이터베이스 연결 테스트 함수
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    if (result.rows.length > 0) {
      console.log(`PostgreSQL connection successful: ${result.rows[0].now}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(
      `PostgreSQL connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
