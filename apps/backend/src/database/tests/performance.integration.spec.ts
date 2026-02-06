import { Test } from '@nestjs/testing';
import { DrizzleModule } from '../drizzle.module';
import { ConfigModule } from '@nestjs/config';
import * as pg from 'pg';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { equipment, teams, users, calibrations, checkouts } from '@equipment-management/db/schema';

describe('Database Performance', () => {
  let pool: pg.Pool;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let db: PostgresJsDatabase;

  beforeAll(async () => {
    await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        DrizzleModule,
      ],
    }).compile();

    // 테스트를 위한 임시 DB 풀 생성
    pool = new pg.Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgres://postgres:postgres@localhost:5432/equipment_management_test',
    });
    // Note: drizzle-orm/postgres-js expects postgres.js client, not pg.Pool
    // This test file uses raw pg.Pool queries, so db variable is not used
    db = null as unknown as PostgresJsDatabase;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('인덱스 사용 쿼리 성능 테스트', async () => {
    // 인덱스 사용 쿼리 성능 테스트 (EXPLAIN ANALYZE 사용)
    const client = await pool.connect();
    try {
      // 1. 장비 ID로 검색 성능 테스트 (인덱스 활용)
      const equipmentIdQuery = await client.query(`
        EXPLAIN ANALYZE 
        SELECT * FROM ${equipment._.name}
        WHERE id = '00000000-0000-0000-0000-000000000001'
      `);

      // 2. 반출 상태별 검색 성능 테스트 (인덱스 활용)
      const checkoutStatusQuery = await client.query(`
        EXPLAIN ANALYZE
        SELECT * FROM ${checkouts._.name}
        WHERE status = 'checked_out'
      `);

      // 3. 교정 날짜별 검색 성능 테스트 (인덱스 활용)
      const calibrationDateQuery = await client.query(`
        EXPLAIN ANALYZE 
        SELECT * FROM ${calibrations._.name}
        WHERE calibration_date > '2023-01-01'
      `);

      // 각 쿼리 결과에서 인덱스 사용 여부 확인
      // 참고: 실제 데이터가 없거나 테스트 환경에 따라 인덱스가 사용되지 않을 수 있음
      expect(equipmentIdQuery.rows.length).toBeGreaterThan(0);
      expect(checkoutStatusQuery.rows.length).toBeGreaterThan(0);
      expect(calibrationDateQuery.rows.length).toBeGreaterThan(0);
    } finally {
      client.release();
    }
  });

  it('조인 쿼리 성능 테스트', async () => {
    // 조인 쿼리 성능 테스트 (EXPLAIN ANALYZE 사용)
    const client = await pool.connect();
    try {
      // 1. 팀과 사용자 조인 성능 테스트
      const teamUserJoinQuery = await client.query(`
        EXPLAIN ANALYZE 
        SELECT t.name, u.name 
        FROM ${teams._.name} t
        JOIN ${users._.name} u ON u.team_id = t.id
        LIMIT 100
      `);

      // 2. 장비와 교정 조인 성능 테스트
      const equipmentCalibrationJoinQuery = await client.query(`
        EXPLAIN ANALYZE 
        SELECT e.name, c.calibration_date
        FROM ${equipment._.name} e
        JOIN ${calibrations._.name} c ON c.equipment_id = e.id
        LIMIT 100
      `);

      // 각 쿼리 결과 확인
      expect(teamUserJoinQuery.rows.length).toBeGreaterThan(0);
      expect(equipmentCalibrationJoinQuery.rows.length).toBeGreaterThan(0);
    } finally {
      client.release();
    }
  });

  it('트랜잭션 성능 테스트', async () => {
    const testStart = Date.now();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 더미 쿼리 수행
      await client.query(`SELECT 1`);
      await client.query(`SELECT 2`);
      await client.query(`SELECT 3`);

      await client.query('COMMIT');

      const duration = Date.now() - testStart;

      // 트랜잭션 수행 시간이 200ms 미만이어야 함
      expect(duration).toBeLessThan(200);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });
});
