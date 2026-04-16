/// <reference types="jest" />

// ⚠️ 중요: 환경 변수는 모듈 import 전에 설정해야 합니다
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
import { AppModule } from '../src/app.module';
import { eq, and, isNull } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import { equipment } from '@equipment-management/db/schema/equipment';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';

describe('Incident History → Non-Conformance Integration (e2e)', () => {
  let app: INestApplication;
  let db: AppDatabase;
  let accessToken: string;
  let testEquipmentId: string;
  let createdIncidentIds: string[] = [];
  let createdNonConformanceIds: string[] = [];

  // 하드코딩된 사용자 사용
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  beforeAll(async () => {
    console.log('📊 Incident-NonConformance Integration Test Environment:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // DB 인스턴스 가져오기
    db = moduleFixture.get<AppDatabase>('DRIZZLE_INSTANCE');

    // 로그인
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: testUserEmail,
      password: testUserPassword,
    });

    accessToken = loginResponse.body.access_token || loginResponse.body.accessToken;

    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }

    // 기존 장비 사용 또는 새 장비 직접 생성 (승인 워크플로우 우회)
    // 먼저 기존 available 상태의 장비 찾기
    let [existingEquipment] = await db
      .select()
      .from(equipment)
      .where(eq(equipment.status, 'available'))
      .limit(1);

    if (existingEquipment) {
      testEquipmentId = existingEquipment.id;
      console.log('Using existing equipment:', testEquipmentId);
    } else {
      // 기존 장비가 없으면 DB에 직접 생성 (테스트용)
      const [newEquipment] = await db
        .insert(equipment)
        .values({
          name: 'Test Equipment for Incident-NC Integration',
          managementNumber: `TEST-NC-${Date.now()}`,
          site: 'suwon',
          status: 'available',
        } as any)
        .returning();

      testEquipmentId = newEquipment.id;
      console.log('Created test equipment directly:', testEquipmentId);
    }

    if (!testEquipmentId) {
      throw new Error('Failed to get or create test equipment');
    }
  });

  afterAll(async () => {
    // 테스트로 생성된 부적합 삭제
    if (db && createdNonConformanceIds.length > 0) {
      for (const id of createdNonConformanceIds) {
        try {
          await db.delete(nonConformances).where(eq(nonConformances.id, id));
        } catch (error) {
          console.error(`Failed to delete non-conformance ${id}:`, error);
        }
      }
    }

    // 테스트로 생성된 사고이력 삭제
    if (accessToken && createdIncidentIds.length > 0) {
      for (const id of createdIncidentIds) {
        try {
          await request(app.getHttpServer())
            .delete(`/equipment/incident-history/${id}`)
            .set('Authorization', `Bearer ${accessToken}`);
        } catch (error) {
          console.error(`Failed to delete incident ${id}:`, error);
        }
      }
    }

    // 테스트 장비 삭제
    if (accessToken && testEquipmentId) {
      try {
        await request(app.getHttpServer())
          .delete(`/equipment/${testEquipmentId}`)
          .set('Authorization', `Bearer ${accessToken}`);
      } catch (error) {
        console.error(`Failed to delete test equipment:`, error);
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe('POST /equipment/:uuid/incident-history (with non-conformance)', () => {
    it('should create incident only (createNonConformance=false)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentId}/incident-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: '2026-01-26',
          incidentType: 'change',
          content: '케이블 교체',
          createNonConformance: false,
        });

      console.log('Incident creation response (createNonConformance=false):', {
        status: response.status,
        body: response.body,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('incidentType', 'change');
      expect(response.body).toHaveProperty('content', '케이블 교체');
      expect(response.body.nonConformanceId).toBeUndefined();

      createdIncidentIds.push(response.body.id);

      // 장비 상태 변경 없음 확인
      const [equipmentRecord] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, testEquipmentId))
        .limit(1);

      expect(equipmentRecord).toBeDefined();
      expect(equipmentRecord.status).toBe('available');
    });

    it('should create incident + non-conformance (without status change)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentId}/incident-history`)
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

      // 부적합 생성 확인
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

      // 장비 상태는 available 유지
      const [equipmentRecord] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, testEquipmentId))
        .limit(1);

      expect(equipmentRecord.status).toBe('available');
    });

    it('should create incident + non-conformance + change status', async () => {
      const response = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentId}/incident-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: '2026-01-26',
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

      // 부적합 생성 확인
      const [nc] = await db
        .select()
        .from(nonConformances)
        .where(eq(nonConformances.id, nonConformanceId))
        .limit(1);

      expect(nc).toBeDefined();
      expect(nc.status).toBe('open');

      // 장비 상태 변경 확인
      const [equipmentRecord] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.id, testEquipmentId))
        .limit(1);

      expect(equipmentRecord.status).toBe('non_conforming');

      // 상태 복원 (다음 테스트를 위해)
      await db
        .update(equipment)
        .set({ status: 'available', updatedAt: new Date() } as any)
        .where(eq(equipment.id, testEquipmentId));
    });

    it('should reject non-conformance for non-damage/malfunction types', async () => {
      const response = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentId}/incident-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: '2026-01-26',
          incidentType: 'change',
          content: '케이블 교체',
          createNonConformance: true, // ❌ change 유형은 부적합 불가
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('부적합은 손상 또는 오작동 유형에서만 생성할 수 있습니다');
    });

    it('should handle undefined createNonConformance (default false)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentId}/incident-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          occurredAt: '2026-01-26',
          incidentType: 'damage',
          content: '경미한 손상',
          // createNonConformance 생략
        });

      expect(response.status).toBe(201);
      expect(response.body.nonConformanceId).toBeUndefined();

      createdIncidentIds.push(response.body.id);
    });
  });
});
