import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// 환경 변수에서 데이터베이스 연결 정보를 가져옵니다.
const dbConnection = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'equipment_management',
};

// PostgreSQL 연결 풀 생성
const pool = new Pool(dbConnection);

// Drizzle ORM 인스턴스 생성
export const db = drizzle(pool, { schema }); 