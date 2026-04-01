import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
import { loadMonorepoEnv } from './load-env';

/**
 * SSOT: 전체 프로젝트에서 사용하는 DB 인스턴스 타입
 * 개별 서비스에서 NodePgDatabase<typeof schema>를 직접 import하지 않고 이 타입을 사용합니다.
 */
export type AppDatabase = NodePgDatabase<typeof schema>;

// 모노레포 .env cascade 로딩 (CWD/.env.local → CWD/.env → 루트/.env)
loadMonorepoEnv();

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

// 오류 이벤트 리스너 — 지수 백오프 재연결
// 재연결 타임아웃 ID 추적: DrizzleService.onModuleDestroy()에서 취소하여 shutdown 시 누수 방지
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectInterval = 5000;
const pendingReconnectTimers = new Set<ReturnType<typeof setTimeout>>();

pgPool.on('error', (err) => {
  metrics.connectionErrors++;
  metrics.lastErrorTime = new Date();
  console.error(`PostgreSQL connection error: ${err.message}`);

  if (reconnectAttempts < maxReconnectAttempts) {
    const backoffTime = reconnectInterval * Math.pow(2, reconnectAttempts);
    const timer = setTimeout(async () => {
      pendingReconnectTimers.delete(timer);
      reconnectAttempts++;
      console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);

      try {
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release();
        reconnectAttempts = 0;
        metrics.lastReconnectTime = new Date();
        console.log('Successfully reconnected to PostgreSQL');
      } catch (error) {
        console.error(
          `Reconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }, backoffTime);

    // .unref(): Node.js 이벤트 루프가 이 타이머 때문에 종료를 막지 않도록 설정
    // graceful shutdown 시 clearInterval/clearTimeout 없이도 프로세스가 종료될 수 있음
    timer.unref();
    pendingReconnectTimers.add(timer);
  } else {
    console.error('Max reconnection attempts reached. Please check database connection.');
  }
});

/**
 * 대기 중인 재연결 타이머 전체 취소
 * DrizzleService.onModuleDestroy()에서 pgPool.end() 전에 호출
 */
export function cancelPendingReconnects(): void {
  for (const timer of pendingReconnectTimers) {
    clearTimeout(timer);
  }
  pendingReconnectTimers.clear();
  reconnectAttempts = 0;
}

// ⚠️ process.on('SIGINT'/'SIGTERM') 핸들러 제거
// NestJS app.enableShutdownHooks()가 SIGINT/SIGTERM을 처리하여
// DrizzleService.onModuleDestroy() → pgPool.end()를 올바른 순서로 실행
// 여기에 별도 핸들러를 두면 process.exit(0) 경쟁 조건이 발생해 graceful shutdown 우회됨

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
    poolMaxCount: pgPool.options.max ?? 50,
  };
}

/**
 * 시스템 카탈로그 등 Drizzle ORM으로 표현 불가한 raw SQL 실행
 * pgPool.connect/query/release 패턴을 캡슐화하여 커넥션 누수 방지
 */
export async function executeDiagnosticQuery<T extends Record<string, unknown>>(
  query: string
): Promise<T[]> {
  const client = await pgPool.connect();
  try {
    const result = await client.query(query);
    return result.rows as T[];
  } finally {
    client.release();
  }
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
