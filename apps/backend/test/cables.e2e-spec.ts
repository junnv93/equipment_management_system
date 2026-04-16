/// <reference types="jest" />

import request from 'supertest';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { ResourceTracker } from './helpers/test-cleanup';

describe('CablesController (e2e) — WF-21', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const tracker = new ResourceTracker();
  const createdCableIds: string[] = [];
  const uniqueSuffix = Date.now();

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
  }, 30000);

  afterAll(async () => {
    await tracker.cleanupAll(ctx.app, accessToken);
    await closeTestApp(ctx?.app);
  }, 15000);

  // ─── WF-21 #1: 케이블 등록 ───

  describe('POST /cables (Create)', () => {
    it('should create a cable with valid data', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/cables')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          managementNumber: `E020K-${uniqueSuffix}`,
          length: '0.2',
          connectorType: 'K',
          frequencyRangeMin: 30,
          frequencyRangeMax: 40000,
          serialNumber: `SN-E2E-${uniqueSuffix}`,
          location: 'RF Shield room',
          site: 'suwon',
        });

      expect(response.status).toBe(201);
      expect(response.body.managementNumber).toBe(`E020K-${uniqueSuffix}`);
      expect(response.body.status).toBe('active');
      expect(response.body.version).toBe(1);
      expect(response.body.id).toBeDefined();
      createdCableIds.push(response.body.id);
      tracker.track('cable', response.body.id);
    });

    it('should create a second cable for list/export tests', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/cables')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          managementNumber: `E050S-${uniqueSuffix}`,
          length: '0.5',
          connectorType: 'SMA',
          frequencyRangeMin: 30,
          frequencyRangeMax: 27000,
          location: 'Chamber 4',
          site: 'suwon',
        });

      expect(response.status).toBe(201);
      createdCableIds.push(response.body.id);
      tracker.track('cable', response.body.id);
    });

    it('should reject creation without managementNumber', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/cables')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ length: '1.0' });

      expect(response.status).toBe(400);
    });
  });

  // ─── WF-21 #5: 목록 조회 ───

  describe('GET /cables (List)', () => {
    it('should return paginated cable list', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/cables')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.totalItems).toBeGreaterThanOrEqual(2);
    });

    it('should filter by connectorType', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/cables')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ connectorType: 'K' });

      expect(response.status).toBe(200);
      for (const item of response.body.items) {
        expect(item.connectorType).toBe('K');
      }
    });

    it('should filter by status', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/cables')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      for (const item of response.body.items) {
        expect(item.status).toBe('active');
      }
    });

    it('should search by managementNumber', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/cables')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ search: `E020K-${uniqueSuffix}` });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.items[0].managementNumber).toContain('E020K');
    });
  });

  // ─── WF-21 #5: 상세 조회 ───

  describe('GET /cables/:id (Detail)', () => {
    it('should return cable detail with latestDataPoints', async () => {
      const id = createdCableIds[0];
      const response = await request(ctx.app.getHttpServer())
        .get(`/cables/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.managementNumber).toBe(`E020K-${uniqueSuffix}`);
      expect(response.body.latestDataPoints).toBeDefined();
      expect(Array.isArray(response.body.latestDataPoints)).toBe(true);
    });

    it('should return 404 for non-existent cable', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/cables/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ─── WF-21 #2: 케이블 수정 (CAS) ───

  describe('PATCH /cables/:id (Update with CAS)', () => {
    it('should update cable with correct version', async () => {
      const id = createdCableIds[0];
      const detail = await request(ctx.app.getHttpServer())
        .get(`/cables/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(ctx.app.getHttpServer())
        .patch(`/cables/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          version: detail.body.version,
          location: 'Updated Location',
        });

      expect(response.status).toBe(200);
      expect(response.body.location).toBe('Updated Location');
      expect(response.body.version).toBe(detail.body.version + 1);
    });

    it('should reject update with stale version (409 VERSION_CONFLICT)', async () => {
      const id = createdCableIds[0];

      const response = await request(ctx.app.getHttpServer())
        .patch(`/cables/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          version: 1, // stale version
          location: 'Should Fail',
        });

      expect(response.status).toBe(409);
    });
  });

  // ─── WF-21 #3: 측정 추가 (트랜잭션) ───

  describe('POST /cables/:id/measurements (Add Measurement)', () => {
    it('should add measurement with data points in a transaction', async () => {
      const id = createdCableIds[0];
      const response = await request(ctx.app.getHttpServer())
        .post(`/cables/${id}/measurements`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          measurementDate: '2026-04-01T00:00:00.000Z',
          notes: 'E2E test measurement',
          dataPoints: [
            { frequencyMhz: 30, lossDb: '-0.041' },
            { frequencyMhz: 100, lossDb: '-0.074' },
            { frequencyMhz: 500, lossDb: '-0.153' },
            { frequencyMhz: 1000, lossDb: '-0.198' },
            { frequencyMhz: 5000, lossDb: '-0.342' },
            { frequencyMhz: 10000, lossDb: '-0.537' },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.cableId).toBe(id);
    });

    it('should update cable.lastMeasurementDate after measurement', async () => {
      const id = createdCableIds[0];
      const detail = await request(ctx.app.getHttpServer())
        .get(`/cables/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(detail.status).toBe(200);
      expect(detail.body.lastMeasurementDate).toBeDefined();
      expect(detail.body.lastMeasurementDate).not.toBeNull();
    });

    it('should list measurements for a cable', async () => {
      const id = createdCableIds[0];
      const response = await request(ctx.app.getHttpServer())
        .get(`/cables/${id}/measurements`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return latestDataPoints in detail after measurement', async () => {
      const id = createdCableIds[0];
      const detail = await request(ctx.app.getHttpServer())
        .get(`/cables/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(detail.status).toBe(200);
      expect(detail.body.latestDataPoints.length).toBe(6);
      for (let i = 1; i < detail.body.latestDataPoints.length; i++) {
        expect(detail.body.latestDataPoints[i].frequencyMhz).toBeGreaterThan(
          detail.body.latestDataPoints[i - 1].frequencyMhz,
        );
      }
    });

    it('should also add measurement to second cable for export coverage', async () => {
      const id = createdCableIds[1];
      const response = await request(ctx.app.getHttpServer())
        .post(`/cables/${id}/measurements`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          measurementDate: '2026-04-02T00:00:00.000Z',
          dataPoints: [
            { frequencyMhz: 100, lossDb: '-0.12' },
            { frequencyMhz: 1000, lossDb: '-0.35' },
          ],
        });

      expect(response.status).toBe(201);
    });
  });

  // ─── WF-21 #6: QP-18-08 양식 내보내기 ───

  describe('GET /reports/export/form/UL-QP-18-08 (Excel Export)', () => {
    it('should export QP-18-08 as xlsx', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/reports/export/form/UL-QP-18-08')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ site: 'suwon' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(response.body).toBeDefined();
    });

    it('should export with connectorType filter', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/reports/export/form/UL-QP-18-08')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ connectorType: 'K', site: 'suwon' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheetml');
    });

    it('should export with status=retired (empty dataset edge case)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/reports/export/form/UL-QP-18-08')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ status: 'retired', site: 'suwon' });

      expect(response.status).toBe(200);
    });
  });

  // ─── WF-21 #7: 케이블 퇴역 ───

  describe('PATCH /cables/:id (Retire)', () => {
    it('should retire a cable', async () => {
      const id = createdCableIds[1];
      const detail = await request(ctx.app.getHttpServer())
        .get(`/cables/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(ctx.app.getHttpServer())
        .patch(`/cables/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          version: detail.body.version,
          status: 'retired',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('retired');
    });
  });
});
