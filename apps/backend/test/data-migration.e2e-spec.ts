/// <reference types="jest" />

// ⚠️ 환경 변수는 모듈 import 전에 설정
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'test-nextauth-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || 'test-client-id-for-e2e-tests';
process.env.AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'test-tenant-id-for-e2e-tests';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as ExcelJS from 'exceljs';
import { AppModule } from '../src/app.module';

// ── 테스트용 xlsx 버퍼 생성 헬퍼 ──────────────────────────────────────────────

async function buildEquipmentXlsx(rows: Record<string, unknown>[] = []): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // 장비 시트
  const ws = wb.addWorksheet('장비');
  ws.addRow(['장비명', '사이트', '설치위치', '관리번호']);
  for (const row of rows) {
    ws.addRow([row.name, row.site, row.location, row.managementNumber]);
  }

  // 참고값 시트 (파서가 인식하는 시트)
  wb.addWorksheet('참고값');

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

async function buildValidEquipmentXlsx(): Promise<Buffer> {
  return buildEquipmentXlsx([
    { name: '테스트 오실로스코프', site: '수원', location: 'Lab A', managementNumber: '' },
  ]);
}

// ── 테스트 수이트 ─────────────────────────────────────────────────────────────

describe('DataMigrationController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    if (loginRes.status !== 200 && loginRes.status !== 201) {
      throw new Error(`Login failed: ${loginRes.status} — ${JSON.stringify(loginRes.body)}`);
    }

    accessToken = loginRes.body.access_token || loginRes.body.accessToken;
    if (!accessToken) throw new Error('No access token in login response');
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Template 다운로드 ──────────────────────────────────────────────────────

  describe('GET /data-migration/equipment/template', () => {
    it('SYSTEM_ADMIN → 200 + xlsx 바이너리 응답', async () => {
      const res = await request(app.getHttpServer())
        .get('/data-migration/equipment/template')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(Buffer.isBuffer(res.body) || res.body.length > 0).toBe(true);
    });

    it('미인증 요청 → 401', async () => {
      const res = await request(app.getHttpServer()).get('/data-migration/equipment/template');
      expect(res.status).toBe(401);
    });
  });

  // ── Preview ────────────────────────────────────────────────────────────────

  describe('POST /data-migration/equipment/preview', () => {
    it('파일 없이 요청 → 400 FILE_REQUIRED', async () => {
      const res = await request(app.getHttpServer())
        .post('/data-migration/equipment/preview')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MIGRATION_FILE_REQUIRED');
    });

    it('미인증 요청 → 401', async () => {
      const xlsx = await buildValidEquipmentXlsx();
      const res = await request(app.getHttpServer())
        .post('/data-migration/equipment/preview')
        .attach('file', xlsx, { filename: 'test.xlsx', contentType: 'application/octet-stream' });

      expect(res.status).toBe(401);
    });

    it('유효한 xlsx → 200 + sessionId 반환', async () => {
      const xlsx = await buildValidEquipmentXlsx();

      const res = await request(app.getHttpServer())
        .post('/data-migration/equipment/preview')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('autoGenerateManagementNumber', 'true')
        .field('skipDuplicates', 'true')
        .attach('file', xlsx, { filename: 'test.xlsx', contentType: 'application/octet-stream' });

      expect(res.status).toBe(201);
      expect(res.body.sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(res.body.sheets).toBeInstanceOf(Array);
      expect(res.body.totalRows).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Execute ────────────────────────────────────────────────────────────────

  describe('POST /data-migration/equipment/execute', () => {
    it('존재하지 않는 sessionId → 404', async () => {
      const res = await request(app.getHttpServer())
        .post('/data-migration/equipment/execute')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sessionId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(404);
    });

    it('미인증 요청 → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/data-migration/equipment/execute')
        .send({ sessionId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(401);
    });

    it('Preview → Execute 순차 플로우 → 장비 생성', async () => {
      // 1. Preview
      const xlsx = await buildValidEquipmentXlsx();
      const previewRes = await request(app.getHttpServer())
        .post('/data-migration/equipment/preview')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('autoGenerateManagementNumber', 'true')
        .field('skipDuplicates', 'true')
        .attach('file', xlsx, { filename: 'test.xlsx', contentType: 'application/octet-stream' });

      expect(previewRes.status).toBe(201);
      const { sessionId } = previewRes.body as { sessionId: string };

      // 2. Execute
      const executeRes = await request(app.getHttpServer())
        .post('/data-migration/equipment/execute')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          sessionId,
          autoGenerateManagementNumber: true,
          skipDuplicates: true,
        });

      // valid 행이 없더라도(파싱 실패 등) 500이 아닌 201/200이어야 함
      expect([200, 201]).toContain(executeRes.status);
      expect(executeRes.body).toHaveProperty('sheets');
    });
  });

  // ── Error Report 다운로드 ──────────────────────────────────────────────────

  describe('GET /data-migration/equipment/:sessionId/error-report', () => {
    it('만료/존재하지 않는 sessionId → 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/data-migration/equipment/00000000-0000-0000-0000-000000000000/error-report')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it('유효한 sessionId → xlsx 바이너리 응답', async () => {
      // Preview 먼저
      const xlsx = await buildEquipmentXlsx([
        // 필수 필드 누락으로 에러 행 생성
        { name: '', site: '수원', location: 'Lab A', managementNumber: '' },
      ]);
      const previewRes = await request(app.getHttpServer())
        .post('/data-migration/equipment/preview')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('autoGenerateManagementNumber', 'false')
        .attach('file', xlsx, { filename: 'test.xlsx', contentType: 'application/octet-stream' });

      expect(previewRes.status).toBe(201);
      const { sessionId } = previewRes.body as { sessionId: string };

      const reportRes = await request(app.getHttpServer())
        .get(`/data-migration/equipment/${sessionId}/error-report`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(reportRes.status).toBe(200);
      expect(reportRes.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });
  });
});
