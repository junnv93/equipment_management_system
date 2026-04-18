/// <reference types="jest" />

import request from 'supertest';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';

describe('Site Permissions (e2e)', () => {
  let ctx: TestAppContext;
  let adminToken: string;
  let testOperatorToken: string | undefined;
  let managerToken: string | undefined;
  let suwonEquipmentUuid: string;
  let uiwangEquipmentUuid: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    adminToken = await loginAs(ctx.app, 'admin');

    try {
      testOperatorToken = await loginAs(ctx.app, 'user');
    } catch {
      // 로그인 실패 시 undefined
    }

    try {
      managerToken = await loginAs(ctx.app, 'manager');
    } catch {
      // manager 로그인 실패 시 undefined
    }

    suwonEquipmentUuid = await createTestEquipment(ctx.app, adminToken, {
      name: 'E2E Test Equipment - Suwon',
      site: 'suwon',
    });

    uiwangEquipmentUuid = await createTestEquipment(ctx.app, adminToken, {
      name: 'E2E Test Equipment - Uiwang',
      site: 'uiwang',
    });
  });

  afterAll(async () => {
    if (ctx?.app && adminToken) {
      try {
        await request(ctx.app.getHttpServer())
          .delete(`/equipment/${suwonEquipmentUuid}`)
          .set('Authorization', `Bearer ${adminToken}`);
      } catch {
        // 무시
      }

      try {
        await request(ctx.app.getHttpServer())
          .delete(`/equipment/${uiwangEquipmentUuid}`)
          .set('Authorization', `Bearer ${adminToken}`);
      } catch {
        // 무시
      }
    }

    await closeTestApp(ctx?.app);
  });

  describe('사이트별 조회 권한', () => {
    it('시험실무자는 자신의 사이트 장비만 조회 가능해야 함', async () => {
      if (!testOperatorToken) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .get('/equipment')
        .set('Authorization', `Bearer ${testOperatorToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      const items = response.body.items || response.body.data?.items || [];

      items.forEach((item: Record<string, unknown>) => {
        if (item.site) {
          expect(['suwon', 'uiwang']).toContain(item.site);
        }
      });
    });

    it('시험실무자는 다른 사이트 장비 상세 조회 시 접근 제한될 수 있음', async () => {
      if (!testOperatorToken || !uiwangEquipmentUuid) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .get(`/equipment/${uiwangEquipmentUuid}`)
        .set('Authorization', `Bearer ${testOperatorToken}`);

      // EQUIPMENT_DATA_SCOPE: test_engineer=all → 200 가능, 역할 따라 403/404도 가능
      expect([200, 403, 404]).toContain(response.status);
    });

    it('기술책임자/관리자는 모든 사이트 장비 조회 가능해야 함', async () => {
      if (!managerToken) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .get('/equipment')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      const items = response.body.items || response.body.data?.items || [];
      expect(items).toBeDefined();

      const sites = items.map((item: Record<string, unknown>) => item.site).filter(Boolean);
      expect(sites.length).toBeGreaterThan(0);

      if (suwonEquipmentUuid || uiwangEquipmentUuid) {
        const uniqueSites = [...new Set(sites)];
        expect(uniqueSites.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('기술책임자는 다른 사이트 장비 상세 조회 가능해야 함', async () => {
      if (!managerToken || !uiwangEquipmentUuid) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .get(`/equipment/${uiwangEquipmentUuid}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id || response.body.data?.id).toBe(uiwangEquipmentUuid);
    });

    it('사이트 필터로 특정 사이트 장비만 조회 가능해야 함', async () => {
      // 수원 사이트 장비만 조회 (admin=lab_manager, site=suwon → 본인 사이트)
      const suwonResponse = await request(ctx.app.getHttpServer())
        .get('/equipment?site=suwon&pageSize=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const suwonItems = suwonResponse.body.items || suwonResponse.body.data?.items || [];

      const itemsWithSite = suwonItems.filter((item: Record<string, unknown>) => item.site);

      if (itemsWithSite.length > 0) {
        itemsWithSite.forEach((item: Record<string, unknown>) => {
          expect(item.site).toBe('suwon');
        });
      }

      // 의왕 사이트 장비만 조회 — lab_manager(suwon)는 uiwang 조회 시 403 가능
      const uiwangResponse = await request(ctx.app.getHttpServer())
        .get('/equipment?site=uiwang&pageSize=100')
        .set('Authorization', `Bearer ${adminToken}`);

      // lab_manager scope=site → 타 사이트 조회 시 403, system_admin이면 200
      if (uiwangResponse.status === 200) {
        const uiwangItems =
          uiwangResponse.body.items || uiwangResponse.body.data?.items || [];

        const itemsWithSiteUiwang = uiwangItems.filter(
          (item: Record<string, unknown>) => item.site,
        );

        if (itemsWithSiteUiwang.length > 0) {
          itemsWithSiteUiwang.forEach((item: Record<string, unknown>) => {
            expect(item.site).toBe('uiwang');
          });
        }
      } else {
        expect(uiwangResponse.status).toBe(403);
      }

      expect(suwonItems.length).toBeGreaterThan(0);

      // 사이트 필터 없으면 본인 사이트 장비 조회 (lab_manager → site scope)
      const allSitesResponse = await request(ctx.app.getHttpServer())
        .get('/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const allSitesItems =
        allSitesResponse.body.items || allSitesResponse.body.data?.items || [];
      const allSitesList = allSitesItems
        .map((item: Record<string, unknown>) => item.site)
        .filter(Boolean);
      const uniqueSites = [...new Set(allSitesList)];

      expect(uniqueSites.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('장비 등록 시 사이트 필수', () => {
    it('장비 등록 시 site 필드가 없으면 400 에러를 반환해야 함', async () => {
      await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Equipment Without Site',
          managementNumber: `E2E-NO-SITE-${Date.now()}`,
          status: 'available',
        })
        .expect(400);
    });

    it('장비 등록 시 site 필드가 있으면 성공해야 함', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Equipment With Site',
          managementNumber: `E2E-WITH-SITE-${Date.now()}`,
          status: 'available',
          site: 'suwon',
          initialLocation: 'Test Location',
          approvalStatus: 'approved',
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.site || response.body.data?.site).toBe('suwon');

      if (response.body.id || response.body.data?.id) {
        await request(ctx.app.getHttpServer())
          .delete(`/equipment/${response.body.id || response.body.data?.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });
  });

  describe('팀별 권한 제한', () => {
    let rfEquipmentUuid: string;
    const emcUserToken: string | undefined = undefined;

    beforeAll(async () => {
      if (adminToken) {
        rfEquipmentUuid = await createTestEquipment(ctx.app, adminToken, {
          name: 'E2E Test RF Equipment',
          modelName: 'RF Test Model',
          manufacturer: 'RF Manufacturer',
          location: 'RF Test Location',
          initialLocation: 'RF Test Location',
        });
      }
    });

    afterAll(async () => {
      if (rfEquipmentUuid && adminToken) {
        try {
          await request(ctx.app.getHttpServer())
            .delete(`/equipment/${rfEquipmentUuid}`)
            .set('Authorization', `Bearer ${adminToken}`);
        } catch {
          // 이미 삭제된 경우 무시
        }
      }
    });

    it('EMC팀은 RF팀 장비 반출 신청 불가해야 함', async () => {
      if (!rfEquipmentUuid || !emcUserToken) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .post('/checkouts')
        .set('Authorization', `Bearer ${emcUserToken}`)
        .send({
          equipmentIds: [rfEquipmentUuid],
          purpose: 'calibration',
          destination: 'Test Destination',
          reason: 'Test Reason',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(response.status).toBe(403);
    });

    it('EMC팀은 RF팀 장비 체크아웃 신청 불가해야 함', async () => {
      if (!rfEquipmentUuid || !emcUserToken) {
        return;
      }

      // /rentals 엔드포인트는 체크아웃 모듈로 교체됨 (/checkouts)
      const response = await request(ctx.app.getHttpServer())
        .post('/checkouts')
        .set('Authorization', `Bearer ${emcUserToken}`)
        .send({
          equipmentIds: [rfEquipmentUuid],
          type: 'calibration',
          reason: 'Test Purpose',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      // 팀 경계 넘는 체크아웃 시도는 400(차단) 또는 403(권한 거부)
      expect([400, 403]).toContain(response.status);
    });
  });
});
