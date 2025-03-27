import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 환경 변수 로드
dotenv.config();

// MySQL 연결 설정
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'equipment_management',
};

// PostgreSQL 연결 설정
const PG_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'equipment_management',
};

/**
 * MySQL에서 PostgreSQL로 데이터 마이그레이션
 */
async function migrateData() {
  console.log('마이그레이션 시작...');
  console.log('MySQL 연결 설정:', {
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    user: MYSQL_CONFIG.user,
    database: MYSQL_CONFIG.database
  });
  
  console.log('PostgreSQL 연결 설정:', {
    host: PG_CONFIG.host,
    port: PG_CONFIG.port,
    user: PG_CONFIG.user,
    database: PG_CONFIG.database
  });
  
  let mysqlConnection;
  let pgPool;
  
  try {
    // MySQL 연결
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    const mysqlDb = drizzleMysql(mysqlConnection);
    console.log('MySQL 연결 성공');
    
    // PostgreSQL 연결
    pgPool = new Pool(PG_CONFIG);
    const pgDb = drizzlePg(pgPool);
    console.log('PostgreSQL 연결 성공');
    
    // PostgreSQL 스키마 마이그레이션 파일 위치 확인
    const migrationsFolder = path.resolve('apps/backend/drizzle');
    if (!fs.existsSync(migrationsFolder)) {
      console.error(`마이그레이션 폴더가 존재하지 않음: ${migrationsFolder}`);
      throw new Error(`마이그레이션 폴더가 존재하지 않음: ${migrationsFolder}`);
    }
    
    const migrationFiles = fs.readdirSync(migrationsFolder)
      .filter(file => file.endsWith('.sql'));
    
    if (migrationFiles.length === 0) {
      console.error(`마이그레이션 SQL 파일이 없음: ${migrationsFolder}`);
      throw new Error(`마이그레이션 SQL 파일이 없음: ${migrationsFolder}`);
    }
    
    console.log('발견된 마이그레이션 파일:', migrationFiles);
    
    // PostgreSQL 스키마 마이그레이션 실행
    console.log('PostgreSQL 스키마 마이그레이션 실행...');
    
    // 마이그레이션 대신 SQL 파일 직접 실행
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsFolder, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`SQL 파일 실행 중: ${file}`);
      await pgPool.query(sql);
      console.log(`SQL 파일 실행 완료: ${file}`);
    }
    
    // 팀 데이터 마이그레이션
    console.log('팀 데이터 마이그레이션 중...');
    const [teams] = await mysqlConnection.query('SELECT * FROM teams');
    
    if (Array.isArray(teams) && teams.length > 0) {
      for (const team of teams as any[]) {
        await pgPool.query(
          `INSERT INTO teams (id, name, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [team.id, team.name, team.description, team.created_at || new Date(), team.updated_at || new Date()]
        );
      }
      console.log(`${teams.length}개의 팀 데이터 마이그레이션 완료`);
    } else {
      console.log('마이그레이션할 팀 데이터가 없습니다.');
    }
    
    // 사용자 데이터 마이그레이션
    console.log('사용자 데이터 마이그레이션 중...');
    const [users] = await mysqlConnection.query('SELECT * FROM users');
    
    if (Array.isArray(users) && users.length > 0) {
      for (const user of users as any[]) {
        await pgPool.query(
          `INSERT INTO users (id, email, name, role, team_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, user.email, user.name, user.role || 'user', user.team_id, 
           user.created_at || new Date(), user.updated_at || new Date()]
        );
      }
      console.log(`${users.length}명의 사용자 데이터 마이그레이션 완료`);
    } else {
      console.log('마이그레이션할 사용자 데이터가 없습니다.');
    }
    
    // 장비 데이터 마이그레이션
    console.log('장비 데이터 마이그레이션 중...');
    const [equipment] = await mysqlConnection.query('SELECT * FROM equipment');
    
    if (Array.isArray(equipment) && equipment.length > 0) {
      for (const item of equipment as any[]) {
        await pgPool.query(
          `INSERT INTO equipment (
             id, name, type, status, serial_number, purchase_date, 
             warranty_expiry_date, location, notes, calibration_required, 
             next_calibration_date, team_id, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING`,
          [
            item.id, item.name, item.type, item.status || 'available', 
            item.serial_number, item.purchase_date, item.warranty_expiry_date,
            item.location, item.notes, item.calibration_required || false,
            item.next_calibration_date, item.team_id,
            item.created_at || new Date(), item.updated_at || new Date()
          ]
        );
      }
      console.log(`${equipment.length}개의 장비 데이터 마이그레이션 완료`);
    } else {
      console.log('마이그레이션할 장비 데이터가 없습니다.');
    }
    
    // 대여 데이터 마이그레이션
    console.log('대여 데이터 마이그레이션 중...');
    const [loans] = await mysqlConnection.query('SELECT * FROM loans');
    
    if (Array.isArray(loans) && loans.length > 0) {
      for (const loan of loans as any[]) {
        await pgPool.query(
          `INSERT INTO loans (
             id, equipment_id, user_id, start_date, end_date, 
             status, notes, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            loan.id, loan.equipment_id, loan.user_id, 
            loan.start_date || new Date(), loan.end_date,
            loan.status || 'active', loan.notes,
            loan.created_at || new Date(), loan.updated_at || new Date()
          ]
        );
      }
      console.log(`${loans.length}개의 대여 데이터 마이그레이션 완료`);
    } else {
      console.log('마이그레이션할 대여 데이터가 없습니다.');
    }
    
    // 체크아웃 데이터 마이그레이션
    console.log('체크아웃 데이터 마이그레이션 중...');
    const [checkouts] = await mysqlConnection.query('SELECT * FROM checkouts');
    
    if (Array.isArray(checkouts) && checkouts.length > 0) {
      for (const checkout of checkouts as any[]) {
        await pgPool.query(
          `INSERT INTO checkouts (
             id, equipment_id, user_id, checked_out_at, 
             checked_in_at, status, notes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            checkout.id, checkout.equipment_id, checkout.user_id,
            checkout.checked_out_at || new Date(), checkout.checked_in_at,
            checkout.status || 'checked_out', checkout.notes
          ]
        );
      }
      console.log(`${checkouts.length}개의 체크아웃 데이터 마이그레이션 완료`);
    } else {
      console.log('마이그레이션할 체크아웃 데이터가 없습니다.');
    }
    
    // 교정(Calibration) 데이터 마이그레이션
    console.log('교정 데이터 마이그레이션 중...');
    const [calibrations] = await mysqlConnection.query('SELECT * FROM calibrations');
    
    if (Array.isArray(calibrations) && calibrations.length > 0) {
      for (const calibration of calibrations as any[]) {
        await pgPool.query(
          `INSERT INTO calibrations (
             id, equipment_id, calibrated_at, next_calibration_at,
             calibrated_by, notes, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            calibration.id, calibration.equipment_id,
            calibration.calibrated_at || new Date(), calibration.next_calibration_at,
            calibration.calibrated_by, calibration.notes,
            calibration.created_at || new Date(), calibration.updated_at || new Date()
          ]
        );
      }
      console.log(`${calibrations.length}개의 교정 데이터 마이그레이션 완료`);
    } else {
      console.log('마이그레이션할 교정 데이터가 없습니다.');
    }
    
    console.log('마이그레이션 성공적으로 완료되었습니다!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    // 연결 종료
    if (mysqlConnection) await mysqlConnection.end();
    if (pgPool) await pgPool.end();
    console.log('데이터베이스 연결 종료');
  }
}

// 마이그레이션 실행
migrateData()
  .then(() => {
    console.log('마이그레이션 프로세스 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  }); 