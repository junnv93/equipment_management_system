import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

// 환경 변수 로드
dotenv.config();

// 로거 생성
const dbLogger = new Logger('DatabaseConnection');

// 연결 설정
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'equipment_management',
};

// 풀 설정
const poolConfig = {
  ...connectionConfig,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 제한 시간
  connectionTimeoutMillis: 2000, // 연결 타임아웃
};

// PostgreSQL 풀 초기화
let pool: Pool | null = null;
let isInitialized = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 5000; // 5초

/**
 * 데이터베이스 초기화 함수
 */
export const initializeDatabase = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    // PostgreSQL 연결
    pool = new Pool(poolConfig);
    
    // 연결 테스트
    const client = await pool.connect();
    client.release();
    
    dbLogger.log('PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.');
    isInitialized = true;
    reconnectAttempts = 0; // 연결 성공 시 재연결 시도 횟수 초기화
    
    // 이벤트 핸들러 등록
    pool.on('error', (err) => {
      dbLogger.error('PostgreSQL 연결 오류:', err);
      
      // 연결 오류 발생 시 재연결 시도
      handleReconnection();
    });
    
    return;
  } catch (error) {
    dbLogger.error('PostgreSQL 데이터베이스 연결 실패:', error);
    
    // 연결 실패 시 재연결 시도
    handleReconnection();
  }
};

/**
 * 데이터베이스 재연결 처리 함수
 */
const handleReconnection = (): void => {
  reconnectAttempts++;
  
  if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
    dbLogger.log(`PostgreSQL 재연결 시도 중... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    // 기존 풀 정리
    if (pool) {
      pool.end().catch(err => {
        dbLogger.error('PostgreSQL 풀 종료 오류:', err);
      });
      pool = null;
    }
    
    isInitialized = false;
    
    // 일정 시간 후 재연결 시도
    setTimeout(() => {
      initializeDatabase().catch(err => {
        dbLogger.error('PostgreSQL 재연결 실패:', err);
      });
    }, RECONNECT_INTERVAL);
  } else {
    dbLogger.error(`최대 재연결 시도 횟수(${MAX_RECONNECT_ATTEMPTS})를 초과했습니다.`);
    
    // 애플리케이션 요구사항에 따라 다음 단계 결정
    // 예: 애플리케이션 종료 또는 제한된 기능으로 계속 실행
    if (process.env.NODE_ENV === 'production') {
      dbLogger.error('DB 연결 실패로 애플리케이션이 일부 기능만 제공할 수 있습니다.');
    } else {
      dbLogger.error('개발 환경에서 DB 연결 실패. 연결 설정을 확인하세요.');
    }
  }
};

// 주기적인 연결 상태 확인
setInterval(async () => {
  if (!isInitialized || !pool) return;
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch (error) {
    dbLogger.error('주기적 연결 확인 중 오류 발생:', error);
    handleReconnection();
  }
}, 60000); // 60초마다 확인

// 초기화 실행
initializeDatabase().catch(err => {
  dbLogger.error('데이터베이스 초기화 오류:', err);
  // 초기 연결 실패 시에도 재연결 메커니즘에 의해 처리되므로 여기서는 process.exit(1)를 하지 않음
});

/**
 * 데이터베이스 연결을 가져옵니다.
 * @returns 클라이언트 연결 객체
 */
export async function getConnection(): Promise<PoolClient> {
  if (!pool) {
    // 풀이 없는 경우 초기화 시도
    await initializeDatabase();
    
    // 초기화 후에도 풀이 없으면 오류
    if (!pool) {
      throw new Error('데이터베이스 풀이 초기화되지 않았습니다');
    }
  }
  
  try {
    return await pool.connect();
  } catch (error) {
    dbLogger.error('PostgreSQL 연결 가져오기 실패:', error);
    
    // 연결 가져오기 실패 시 재연결 시도
    handleReconnection();
    throw new Error('PostgreSQL 연결을 가져올 수 없습니다');
  }
}

/**
 * 쿼리를 실행합니다.
 * @param text SQL 쿼리 텍스트
 * @param params 쿼리 파라미터
 * @returns 쿼리 결과
 */
export async function query(text: string, params?: any[]) {
  if (!pool) {
    // 풀이 없는 경우 초기화 시도
    await initializeDatabase();
    
    // 초기화 후에도 풀이 없으면 오류
    if (!pool) {
      throw new Error('데이터베이스 풀이 초기화되지 않았습니다');
    }
  }

  const client = await getConnection();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    dbLogger.debug(`쿼리 실행 완료: ${text} (${duration}ms, ${result.rowCount}행)`);
    return result;
  } catch (error) {
    dbLogger.error('쿼리 실행 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 트랜잭션을 시작합니다.
 * @returns 트랜잭션 객체
 */
export async function beginTransaction(): Promise<PoolClient> {
  const client = await getConnection();
  try {
    await client.query('BEGIN');
    return client;
  } catch (error) {
    client.release();
    throw error;
  }
}

/**
 * 트랜잭션을 커밋합니다.
 * @param client 트랜잭션 클라이언트
 */
export async function commitTransaction(client: PoolClient): Promise<void> {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

/**
 * 트랜잭션을 롤백합니다.
 * @param client 트랜잭션 클라이언트
 */
export async function rollbackTransaction(client: PoolClient): Promise<void> {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

/**
 * 데이터베이스 연결 상태를 확인합니다.
 * @returns 연결 상태 (true: 연결됨, false: 연결 안됨)
 */
export async function checkConnection(): Promise<boolean> {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    return false;
  }
}

// 종료 시 연결 정리
process.on('exit', () => {
  if (pool) {
    pool.end();
  }
});

// SIGINT 및 SIGTERM 처리
process.on('SIGINT', () => {
  dbLogger.log('애플리케이션 종료 중 (SIGINT)...');
  if (pool) {
    pool.end().then(() => {
      process.exit(0);
    }).catch(err => {
      dbLogger.error('PostgreSQL 풀 종료 오류:', err);
      process.exit(1);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  dbLogger.log('애플리케이션 종료 중 (SIGTERM)...');
  if (pool) {
    pool.end().then(() => {
      process.exit(0);
    }).catch(err => {
      dbLogger.error('PostgreSQL 풀 종료 오류:', err);
      process.exit(1);
    });
  } else {
    process.exit(0);
  }
});

export default {
  query,
  getConnection,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  checkConnection
}; 