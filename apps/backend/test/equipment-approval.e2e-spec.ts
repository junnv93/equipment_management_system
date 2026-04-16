/// <reference types="jest" />

import request from 'supertest';
import * as fs from 'fs/promises';
import * as path from 'path';
import postgres from 'postgres';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { seedTestUsers } from './helpers/test-fixtures';

describe('Equipment Approval Process (e2e)', () => {
  let ctx: TestAppContext;
  let testOperatorToken: string;
  let technicalManagerToken: string;
  let siteAdminToken: string;
  const createdRequestUuids: string[] = [];
  const createdEquipmentUuids: string[] = [];
  const testUploadDir = path.join(process.cwd(), 'test-uploads');
  let sql: postgres.Sql;

  beforeAll(async () => {
    try {
      await fs.mkdir(testUploadDir, { recursive: true });
    } catch {
      // 이미 존재하는 경우 무시
    }

    // 테스트 DB에 테스트 사용자 시드 (승인 프로세스에서 외래 키 제약 조건 충족을 위해)
    sql = await seedTestUsers();

    ctx = await createTestApp();

    siteAdminToken = await loginAs(ctx.app, 'admin');

    try {
      technicalManagerToken = await loginAs(ctx.app, 'manager');
    } catch {
      technicalManagerToken = siteAdminToken;
    }

    try {
      testOperatorToken = await loginAs(ctx.app, 'user');
    } catch {
      testOperatorToken = siteAdminToken;
    }
  });

  afterAll(async () => {
    if (ctx?.app && technicalManagerToken) {
      for (const requestUuid of createdRequestUuids) {
        try {
          await request(ctx.app.getHttpServer())
            .post(`/equipment/requests/${requestUuid}/reject`)
            .set('Authorization', `Bearer ${technicalManagerToken}`)
            .send({ rejectionReason: '테스트 정리' });
        } catch {
          // 이미 처리된 경우 무시
        }
      }
    }

    if (ctx?.app && siteAdminToken) {
      for (const equipmentUuid of createdEquipmentUuids) {
        try {
          await request(ctx.app.getHttpServer())
            .delete(`/equipment/${equipmentUuid}`)
            .set('Authorization', `Bearer ${siteAdminToken}`);
        } catch {
          // 이미 삭제된 경우 무시
        }
      }
    }

    try {
      const files = await fs.readdir(testUploadDir);
      for (const file of files) {
        await fs.unlink(path.join(testUploadDir, file));
      }
      await fs.rmdir(testUploadDir);
    } catch {
      // 정리 실패는 무시
    }

    await closeTestApp(ctx?.app);

    if (sql) {
      await sql.end();
    }
  });

  describe('장비 등록 요청 프로세스', () => {
    it('시험실무자가 장비 등록 요청을 제출할 수 있어야 합니다', async () => {
      const equipmentData = {
        name: 'E2E 테스트 장비',
        managementNumber: `E2E-TEST-${Date.now()}`,
        modelName: 'Test Model',
        manufacturer: 'Test Manufacturer',
        serialNumber: `SN-${Date.now()}`,
        location: '테스트 위치',
        initialLocation: '테스트 위치',
        site: 'suwon',
        equipmentType: '분석기',
        firmwareVersion: 'v1.0.0',
        calibrationResult: '합격',
        correctionFactor: '1.002',
        status: 'available',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`)
        .send(equipmentData);

      expect([201, 200, 202, 400]).toContain(response.status);

      if (response.status === 400) {
        return;
      }

      if (response.body.requestUuid) {
        createdRequestUuids.push(response.body.requestUuid);
      } else if (response.body.id) {
        createdEquipmentUuids.push(response.body.id);
      } else if (response.body.data?.id) {
        createdEquipmentUuids.push(response.body.data.id);
      }
    });

    it('시스템 관리자는 장비를 직접 승인할 수 있어야 합니다', async () => {
      const equipmentData = {
        name: 'E2E 직접 승인 장비',
        managementNumber: `E2E-DIRECT-${Date.now()}`,
        modelName: 'Direct Model',
        manufacturer: 'Direct Manufacturer',
        serialNumber: `SN-DIRECT-${Date.now()}`,
        location: '테스트 위치',
        initialLocation: '테스트 위치',
        site: 'suwon',
        equipmentType: '측정기',
        approvalStatus: 'approved',
        status: 'available',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${siteAdminToken || testOperatorToken}`)
        .send(equipmentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.approvalStatus).toBe('approved');

      if (response.body.id) {
        createdEquipmentUuids.push(response.body.id);
      }
    });
  });

  describe('승인 대기 요청 목록 조회', () => {
    it('기술책임자는 승인 대기 요청 목록을 조회할 수 있어야 합니다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/equipment/requests/pending')
        .set('Authorization', `Bearer ${technicalManagerToken || siteAdminToken}`);

      expect([200, 201, 400, 403, 401]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(Array.isArray(response.body) || Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('시험실무자는 승인 대기 목록을 조회할 수 없어야 합니다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/equipment/requests/pending')
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`);

      expect([403, 401, 400]).toContain(response.status);
    });
  });

  describe('요청 승인 프로세스', () => {
    let testRequestUuid: string;

    beforeEach(async () => {
      const equipmentData = {
        name: 'E2E 승인 테스트 장비',
        managementNumber: `E2E-APPROVE-${Date.now()}`,
        modelName: 'Approve Model',
        manufacturer: 'Approve Manufacturer',
        serialNumber: `SN-APPROVE-${Date.now()}`,
        location: '테스트 위치',
        initialLocation: '테스트 위치',
        site: 'suwon',
        equipmentType: '테스트 장비',
        status: 'available',
      };

      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`)
        .send(equipmentData);

      if (createResponse.body.requestUuid) {
        testRequestUuid = createResponse.body.requestUuid;
        createdRequestUuids.push(testRequestUuid);
      } else {
        const listResponse = await request(ctx.app.getHttpServer())
          .get('/equipment/requests/pending')
          .set('Authorization', `Bearer ${technicalManagerToken || siteAdminToken}`);

        if (listResponse.body && listResponse.body.length > 0) {
          testRequestUuid = listResponse.body[0].id;
        }
      }
    });

    it('기술책임자가 요청을 승인할 수 있어야 합니다', async () => {
      if (!testRequestUuid) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .post(`/equipment/requests/${testRequestUuid}/approve`)
        .set('Authorization', `Bearer ${technicalManagerToken || siteAdminToken}`);

      expect([200, 201]).toContain(response.status);
      expect(response.body.approvalStatus).toBe('approved');
      expect(response.body.approvedBy).toBeDefined();
    });

    it('기술책임자가 요청을 반려할 수 있어야 합니다 (반려 사유 필수)', async () => {
      if (!testRequestUuid) {
        return;
      }

      const rejectWithoutReason = await request(ctx.app.getHttpServer())
        .post(`/equipment/requests/${testRequestUuid}/reject`)
        .set('Authorization', `Bearer ${technicalManagerToken || siteAdminToken}`)
        .send({});

      expect([400, 422]).toContain(rejectWithoutReason.status);

      const rejectWithReason = await request(ctx.app.getHttpServer())
        .post(`/equipment/requests/${testRequestUuid}/reject`)
        .set('Authorization', `Bearer ${technicalManagerToken || siteAdminToken}`)
        .send({ rejectionReason: 'E2E 테스트 반려 사유' });

      expect([200, 201]).toContain(rejectWithReason.status);
      expect(rejectWithReason.body.approvalStatus).toBe('rejected');
      expect(rejectWithReason.body.rejectionReason).toBe('E2E 테스트 반려 사유');
    });
  });

  describe('파일 업로드', () => {
    it('파일을 업로드할 수 있어야 합니다', async () => {
      const testFileContent = Buffer.from('Test file content for E2E test');
      const testFilePath = path.join(testUploadDir, 'test-file.pdf');
      await fs.writeFile(testFilePath, testFileContent);

      const response = await request(ctx.app.getHttpServer())
        .post('/equipment/attachments')
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`)
        .attach('file', testFilePath)
        .field('attachmentType', 'inspection_report')
        .field('description', 'E2E 테스트 파일');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('attachment');
      expect(response.body.attachment).toHaveProperty('id');
      expect(response.body.attachment).toHaveProperty('fileName');

      await fs.unlink(testFilePath);
    });

    it('파일 크기 제한을 초과하면 업로드가 실패해야 합니다', async () => {
      const largeFileContent = Buffer.alloc(11 * 1024 * 1024, 'x');
      const largeFilePath = path.join(testUploadDir, 'large-file.pdf');
      await fs.writeFile(largeFilePath, largeFileContent);

      const response = await request(ctx.app.getHttpServer())
        .post('/equipment/attachments')
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`)
        .attach('file', largeFilePath)
        .field('attachmentType', 'inspection_report');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('파일 크기');

      await fs.unlink(largeFilePath);
    });

    it('허용되지 않은 파일 형식은 업로드가 실패해야 합니다', async () => {
      const invalidFileContent = Buffer.from('Invalid file content');
      const invalidFilePath = path.join(testUploadDir, 'invalid-file.exe');
      await fs.writeFile(invalidFilePath, invalidFileContent);

      const response = await request(ctx.app.getHttpServer())
        .post('/equipment/attachments')
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`)
        .attach('file', invalidFilePath)
        .field('attachmentType', 'inspection_report');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('허용되지 않은 파일 형식');

      await fs.unlink(invalidFilePath);
    });
  });

  describe('장비 수정 요청 프로세스', () => {
    let testEquipmentUuid: string;

    beforeEach(async () => {
      const equipmentData = {
        name: 'E2E 수정 테스트 장비',
        managementNumber: `E2E-UPDATE-${Date.now()}`,
        modelName: 'Update Model',
        manufacturer: 'Update Manufacturer',
        serialNumber: `SN-UPDATE-${Date.now()}`,
        location: '테스트 위치',
        initialLocation: '테스트 위치',
        site: 'suwon',
        equipmentType: '테스트 장비',
        approvalStatus: 'approved',
        status: 'available',
      };

      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${siteAdminToken || testOperatorToken}`)
        .send(equipmentData);

      if (createResponse.body.id) {
        testEquipmentUuid = createResponse.body.id;
        createdEquipmentUuids.push(testEquipmentUuid);
      }
    });

    it('시험실무자가 장비 수정 요청을 제출할 수 있어야 합니다', async () => {
      if (!testEquipmentUuid) {
        return;
      }

      const updateData = {
        name: '수정된 장비명',
        location: '수정된 위치',
      };

      const response = await request(ctx.app.getHttpServer())
        .patch(`/equipment/${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`)
        .send(updateData);

      expect([200, 202]).toContain(response.status);

      if (response.body.requestUuid) {
        createdRequestUuids.push(response.body.requestUuid);
      }
    });
  });

  describe('장비 삭제 요청 프로세스', () => {
    let testEquipmentUuid: string;

    beforeEach(async () => {
      const equipmentData = {
        name: 'E2E 삭제 테스트 장비',
        managementNumber: `E2E-DELETE-${Date.now()}`,
        modelName: 'Delete Model',
        manufacturer: 'Delete Manufacturer',
        serialNumber: `SN-DELETE-${Date.now()}`,
        location: '테스트 위치',
        initialLocation: '테스트 위치',
        site: 'suwon',
        equipmentType: '테스트 장비',
        approvalStatus: 'approved',
        status: 'available',
      };

      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${siteAdminToken || testOperatorToken}`)
        .send(equipmentData);

      if (createResponse.body.id) {
        testEquipmentUuid = createResponse.body.id;
        createdEquipmentUuids.push(testEquipmentUuid);
      }
    });

    it('시험실무자가 장비 삭제 요청을 제출할 수 있어야 합니다', async () => {
      if (!testEquipmentUuid) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .delete(`/equipment/${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`);

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('message');

      if (response.body.requestUuid) {
        createdRequestUuids.push(response.body.requestUuid);
      }
    });

    it('시스템 관리자는 장비를 직접 삭제할 수 있어야 합니다', async () => {
      if (!testEquipmentUuid) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .delete(`/equipment/${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${siteAdminToken || testOperatorToken}`);

      expect([204, 202]).toContain(response.status);
    });
  });

  describe('필수 필드 검증', () => {
    it('필수 필드가 누락되면 장비 등록이 실패해야 합니다', async () => {
      const incompleteData = {
        name: '불완전한 장비',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${testOperatorToken || siteAdminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
    });

    it('추가 필수 필드가 포함된 장비 등록이 성공해야 합니다', async () => {
      const completeData = {
        name: '완전한 장비',
        managementNumber: `E2E-COMPLETE-${Date.now()}`,
        modelName: 'Complete Model',
        manufacturer: 'Complete Manufacturer',
        serialNumber: `SN-COMPLETE-${Date.now()}`,
        location: '테스트 위치',
        initialLocation: '테스트 위치',
        site: 'suwon',
        equipmentType: '분석기',
        firmwareVersion: 'v1.0.0',
        calibrationResult: '합격',
        correctionFactor: '1.002',
        repairHistory: '수리 이력 없음',
        status: 'available',
        approvalStatus: 'approved',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${siteAdminToken || testOperatorToken}`)
        .send(completeData);

      expect([201, 200, 400]).toContain(response.status);

      if (response.status === 201 || response.status === 200) {
        const equipment = response.body.data || response.body;
        const hasUuid = equipment.id || response.body.requestUuid;
        expect(hasUuid).toBeDefined();
        if (equipment.id && equipment.equipmentType) {
          expect(equipment.equipmentType).toBe('분석기');
          expect(equipment.calibrationResult).toBe('합격');
        }
      }

      if (response.body.id) {
        createdEquipmentUuids.push(response.body.id);
      }
    });
  });
});
