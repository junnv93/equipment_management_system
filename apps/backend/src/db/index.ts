import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Logger } from '@nestjs/common';
import * as schema from './schema';

// DB 로거 생성
const dbLogger = new Logger('Database');

// 환경 변수에서 데이터베이스 연결 정보 가져오기
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL 환경 변수가 정의되지 않았습니다.');
}

// PostgreSQL 클라이언트 작성
const queryClient = postgres(connectionString, {
  max: 10, // 커넥션 풀 최대 커넥션 수
  idle_timeout: 20, // 사용되지 않는 커넥션을 유지하는 시간 (초)
  connect_timeout: 10, // 커넥션 시간제한 (초)
});

// Drizzle ORM 인스턴스 생성
export const db = drizzle(queryClient, { schema });

let isInitialized = false;
let pool: any = null;

// DB 연결 초기화 함수
export const initializeDatabase = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    // PostgreSQL 연결
    pool = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    // 연결 테스트
    const client = await pool.connect();
    client.release();
    
    dbLogger.log('PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.');
    isInitialized = true;
    
    // 이벤트 핸들러 등록
    pool.on('error', (err) => {
      dbLogger.error('PostgreSQL 연결 오류:', err);
      
      // 일정 시간 후 재연결 시도
      setTimeout(() => {
        dbLogger.log('PostgreSQL 재연결 시도 중...');
        pool?.end();
        pool = null;
        isInitialized = false;
        initializeDatabase().catch(err => {
          dbLogger.error('PostgreSQL 재연결 실패:', err);
        });
      }, 5000);
    });
    
    return;
  } catch (error) {
    dbLogger.error('PostgreSQL 데이터베이스 연결 실패:', error);
    
    // 일정 시간 후 재연결 시도
    setTimeout(() => {
      dbLogger.log('PostgreSQL 재연결 시도 중...');
      initializeDatabase().catch(err => {
        dbLogger.error('PostgreSQL 재연결 실패:', err);
      });
    }, 5000);
  }
};

// DB 연결 해제 함수
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    dbLogger.log('PostgreSQL 데이터베이스 연결이 종료되었습니다.');
    isInitialized = false;
    pool = null;
  }
};
