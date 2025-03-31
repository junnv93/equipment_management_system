import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

// 환경 변수 로드
dotenv.config();

// 로거 설정
const logger = new Logger('DrizzleORM');

// 데이터베이스 연결 설정
const dbConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 상태 타임아웃
  connectionTimeoutMillis: 2000, // 연결 타임아웃
};

// Postgres 연결 풀 생성
export const pgPool = new Pool(dbConfig);

// 연결 이벤트 리스너
pgPool.on('connect', (client) => {
  logger.log('New client connected to PostgreSQL');
});

// 오류 이벤트 리스너
pgPool.on('error', (err) => {
  logger.error(`PostgreSQL connection error: ${err.message}`);
  
  // 연결 재시도 로직
  setTimeout(() => {
    logger.log('Attempting to reconnect to PostgreSQL...');
    // 새 연결 시도
    pgPool.connect((connectErr, client, release) => {
      if (connectErr) {
        logger.error(`Failed to reconnect: ${connectErr.message}`);
      } else {
        logger.log('Successfully reconnected to PostgreSQL');
        // 사용이 끝났으면 클라이언트 반환
        if (client && release) {
          release();
        }
      }
    });
  }, 5000); // 5초 후 재시도
});

// 애플리케이션 종료 시 정리
process.on('SIGINT', () => {
  pgPool.end(() => {
    logger.log('PostgreSQL connection pool closed');
    process.exit(0);
  });
});

// Drizzle ORM 인스턴스 생성
export const db = drizzle(pgPool);

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
    logger.error(`PostgreSQL connection test failed: ${error.message}`);
    return false;
  }
} 