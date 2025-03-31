import { Test } from '@nestjs/testing';
import { DrizzleModule } from '../drizzle.module';
import { ConfigModule } from '@nestjs/config';
import * as pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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
      connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/equipment_management_test',
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('마이그레이션 파일이 존재해야 합니다', () => {
    const migrationPath = path.join(process.cwd(), 'drizzle');
    expect(fs.existsSync(migrationPath)).toBe(true);

    // 마이그레이션 파일 확인
    const migrationFiles = fs.readdirSync(migrationPath)
      .filter(file => file.endsWith('.sql'));

    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  it('마이그레이션 메타데이터가 올바른 형식이어야 합니다', () => {
    const metaPath = path.join(process.cwd(), 'drizzle', 'meta');
    expect(fs.existsSync(metaPath)).toBe(true);

    // 메타데이터 파일 확인
    const metaFiles = fs.readdirSync(metaPath)
      .filter(file => file.endsWith('.json'));

    expect(metaFiles.length).toBeGreaterThan(0);

    // 저널 파일 확인
    const journalPath = path.join(metaPath, '_journal.json');
    expect(fs.existsSync(journalPath)).toBe(true);

    // 저널 파일 내용 확인
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    expect(journal).toHaveProperty('entries');
    expect(Array.isArray(journal.entries)).toBe(true);
  });

  it('마이그레이션 테이블이 존재해야 합니다', async () => {
    const client = await pool.connect();
    try {
      // drizzle_migrations 테이블 존재 확인
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'drizzle_migrations'
        );
      `);
      
      expect(result.rows[0].exists).toBe(true);
    } finally {
      client.release();
    }
  });
}); 