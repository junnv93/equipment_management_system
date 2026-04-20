/// <reference types="jest" />

import request from 'supertest';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { toTestPath } from './helpers/test-paths';

describe('Incident History → Non-Conformance Integration (e2e)', () => {
  let ctx: TestAppContext;
  let db: AppDatabase;
  let accessToken: string;
  let testEquipmentId: string;
  const createdIncidentIds: string[] = [];
  const createdNonConformanceIds: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');

    // DB 인스턴스 가져오기
    db = ctx.module.get<AppDatabase>('DRIZZLE_INSTANCE');

    // 기존 장비 사용 또는 새 장비 직접 생성
    const [existingEquipment] = await db
      .select()
      .from(equipment)
      .where(eq(equipment.status, 'available'))
      .limit(1);

    if (existingEquipment) {
      testEquipmentId = existingEquipment.id;
    } else {
      const [newEquipment] = await db
        .insert(equipment)
        .values({
          name: 'Test Equipment for Incident-NC Integration',
          managementNumber: `TEST-NC-${Date.now()}`,
          site: 'suwon',
          status: 'available',
        } as typeof equipment.$inferInsert)
        .returning();

      testEquipmentId = newEquipment.id;
    }

    if (!testEquipmentId) {
      throw new Error('Failed to get or create test equipment');
    }
  });

  afterAll(async () => {
    if (db && createdNonConformanceIds.length > 0) {
      for (const id of createdNonConformanceIds) {
        try {
          await db.delete(nonConformances).where(eq(nonConformances.id, id));
        } catch {
          // 삭제 실패 무시
        }
      }
    }

    if (ctx?.app && accessToken && createdIncidentIds.length > 0) {
      for (const id of createdIncidentIds) {
        try {
          await request(ctx.app.getHttpServer())
            .delete(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.DELETE(id)))
            .set('Authorization', `Bearer ${accessToken}`);
        } catch {
          // 삭제 실패 무시
        }
      }
    }

    if (ctx?.app && accessToken && testEquipmentId) {
      try {
        await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.EQUIPMENT.DELETE(testEquipmentId)))
          .set('Authorization', `Bearer ${accessToken}`);
      } catch {
        // 삭제 실패 무시
      }
    }

    await closeTestApp(ctx?.app);
  });

  describe('POST /equipment/:uuid/incident-history (with non-conformance)', () => {
    it('should create incident only (createNonConformance=false)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentId)))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: '2026-01-26',
          incidentType: 'change',
          content: '케이블 교체',
          createNonConformance: false,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('incidentType', 'change');
      expect(response.body).toHaveProperty('content', '케이블 교체');
      expect(response.body.nonConformanceId).toBeUndefined();

      createdIncidentIds.push(response.body.id);

      const [equipmentRecord] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, testEquipmentId))
        .limit(1);

      expect(equipmentRecord).toBeDefined();
      expect(equipmentRecord.status).toBe('available');
    });

    it('should create incident + non-conformance (without status change)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentId)))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: '2026-01-26',
          incidentType: 'damage',
          content: '디스플레이 크랙',
          createNonConformance: true,
          changeEquipmentStatus: false,
          actionPlan: '디스플레이 교체 예정',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('nonConformanceId');

      const nonConformanceId = response.body.nonConformanceId;
      createdIncidentIds.push(response.body.id);
      createdNonConformanceIds.push(nonConformanceId);

      const [nc] = await db
        .select()
        .from(nonConformances)
        .where(eq(nonConformances.id, nonConformanceId))
        .limit(1);

      expect(nc).toBeDefined();
      expect(nc.ncType).toBe('damage');
      expect(nc.cause).toBe('디스플레이 크랙');
      expect(nc.actionPlan).toBe('디스플레이 교체 예정');
      expect(nc.status).toBe('open');

      const [equipmentRecord] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, testEquipmentId))
        .limit(1);

      expect(equipmentRecord.status).toBe('available');
    });

    it('should create incident + non-conformance + change status', async () => {
      // 현재 날짜 사용 — 과거 이력은 장비 상태를 변경하지 않음
      const today = new Date().toISOString().split('T')[0];

      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentId)))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: today,
          incidentType: 'malfunction',
          content: '전원부 고장',
          createNonConformance: true,
          changeEquipmentStatus: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('nonConformanceId');

      const nonConformanceId = response.body.nonConformanceId;
      createdIncidentIds.push(response.body.id);
      createdNonConformanceIds.push(nonConformanceId);

      const [nc] = await db
        .select()
        .from(nonConformances)
        .where(eq(nonConformances.id, nonConformanceId))
        .limit(1);

      expect(nc).toBeDefined();
      expect(nc.status).toBe('open');

      const [equipmentRecord] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, testEquipmentId))
        .limit(1);

      expect(equipmentRecord.status).toBe('non_conforming');

      // 상태 복원 (다음 테스트를 위해)
      await db
        .update(equipment)
        .set({ status: 'available', updatedAt: new Date() } as Partial<typeof equipment.$inferInsert>)
        .where(eq(equipment.id, testEquipmentId));
    });

    it('should reject non-conformance for non-damage/malfunction types', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentId)))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: '2026-01-26',
          incidentType: 'change',
          content: '케이블 교체',
          createNonConformance: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Non-conformance can only be created for damage or malfunction incident types',
      );
    });

    it('should handle undefined createNonConformance (default false)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentId)))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: '2026-01-26',
          incidentType: 'damage',
          content: '경미한 손상',
        });

      expect(response.status).toBe(201);
      expect(response.body.nonConformanceId).toBeUndefined();

      createdIncidentIds.push(response.body.id);
    });
  });
});
