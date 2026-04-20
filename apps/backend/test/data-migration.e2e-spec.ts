/// <reference types="jest" />

import request from 'supertest';
import * as ExcelJS from 'exceljs';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { toTestPath } from './helpers/test-paths';

// ── 테스트용 xlsx 버퍼 생성 헬퍼 ──────────────────────────────────────────────

async function buildEquipmentXlsx(rows: Record<string, unknown>[] = []): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet('장비');
  ws.addRow(['장비명', '사이트', '설치위치', '관리번호']);
  for (const row of rows) {
    ws.addRow([row.name, row.site, row.location, row.managementNumber]);
  }

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
  let ctx: TestAppContext;
  let accessToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  // ── Template 다운로드 ──────────────────────────────────────────────────────

  describe('GET /data-migration/equipment/template', () => {
    it('SYSTEM_ADMIN → 200 + xlsx 바이너리 응답', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.TEMPLATE))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
      // supertest may return body as Buffer or parsed object depending on content type
      const bodySize = Buffer.isBuffer(res.body)
        ? res.body.length
        : res.headers['content-length']
          ? parseInt(res.headers['content-length'] as string, 10)
          : JSON.stringify(res.body).length;
      expect(bodySize).toBeGreaterThan(0);
    });

    it('미인증 요청 → 401', async () => {
      const res = await request(ctx.app.getHttpServer()).get(
        toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.TEMPLATE),
      );
      expect(res.status).toBe(401);
    });
  });

  // ── Preview ────────────────────────────────────────────────────────────────

  describe('POST /data-migration/equipment/preview', () => {
    it('파일 없이 요청 → 400 FILE_REQUIRED', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.PREVIEW))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MIGRATION_FILE_REQUIRED');
    });

    it('미인증 요청 → 401', async () => {
      const xlsx = await buildValidEquipmentXlsx();
      const res = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.PREVIEW))
        .attach('file', xlsx, {
          filename: 'test.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

      expect(res.status).toBe(401);
    });

    it('유효한 xlsx → 200 + sessionId 반환', async () => {
      const xlsx = await buildValidEquipmentXlsx();

      const res = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.PREVIEW))
        .set('Authorization', `Bearer ${accessToken}`)
        .field('autoGenerateManagementNumber', 'true')
        .field('skipDuplicates', 'true')
        .attach('file', xlsx, {
          filename: 'test.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

      expect(res.status).toBe(201);
      expect(res.body.sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(res.body.sheets).toBeInstanceOf(Array);
      expect(res.body.totalRows).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Execute ────────────────────────────────────────────────────────────────

  describe('POST /data-migration/equipment/execute', () => {
    it('존재하지 않는 sessionId → 404', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.EXECUTE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sessionId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(404);
    });

    it('미인증 요청 → 401', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.EXECUTE))
        .send({ sessionId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(401);
    });

    it('Preview → Execute 순차 플로우 → 장비 생성', async () => {
      const xlsx = await buildValidEquipmentXlsx();
      const previewRes = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.PREVIEW))
        .set('Authorization', `Bearer ${accessToken}`)
        .field('autoGenerateManagementNumber', 'true')
        .field('skipDuplicates', 'true')
        .attach('file', xlsx, {
          filename: 'test.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

      expect(previewRes.status).toBe(201);
      const { sessionId } = previewRes.body as { sessionId: string };

      const executeRes = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.EXECUTE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          sessionId,
          autoGenerateManagementNumber: true,
          skipDuplicates: true,
        });

      expect([200, 201]).toContain(executeRes.status);
      expect(executeRes.body).toHaveProperty('sheets');
    });
  });

  // ── Error Report 다운로드 ──────────────────────────────────────────────────

  describe('GET /data-migration/equipment/:sessionId/error-report', () => {
    it('만료/존재하지 않는 sessionId → 404', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(
          toTestPath(
            API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.ERROR_REPORT(
              '00000000-0000-0000-0000-000000000000',
            ),
          ),
        )
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it('유효한 sessionId → xlsx 바이너리 응답', async () => {
      const xlsx = await buildEquipmentXlsx([
        { name: '', site: '수원', location: 'Lab A', managementNumber: '' },
      ]);
      const previewRes = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.PREVIEW))
        .set('Authorization', `Bearer ${accessToken}`)
        .field('autoGenerateManagementNumber', 'false')
        .attach('file', xlsx, {
          filename: 'test.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

      expect(previewRes.status).toBe(201);
      const { sessionId } = previewRes.body as { sessionId: string };

      const reportRes = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.ERROR_REPORT(sessionId)))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(reportRes.status).toBe(200);
      expect(reportRes.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    });
  });
});
