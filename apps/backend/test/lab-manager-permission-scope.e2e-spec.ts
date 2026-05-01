/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS, Permission } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { getTokenForPermission } from './helpers/test-permission-token';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';
import { TEAM_FCC_EMC_RF_SUWON_ID } from '../src/database/utils/uuid-constants';

/**
 * UL-QP-18 §4.2 직무분리: lab_manager 권한 스코프 회귀 가드 (E2E)
 *
 * **목표:** UL-QP-18 §4.2 (직무분리)와 §4.3 (최종 승인 권한) 정책의
 * 명시 회귀 가드. lab_manager는 등록·승인 분리 원칙에 따라 다음을 가질 수 없다:
 *   - CREATE_EQUIPMENT (장비 등록 — 기술책임자 전담)
 *   - APPROVE_EQUIPMENT (장비 등록 승인 — 등록·승인 분리)
 *   - CREATE_CHECKOUT (반출 신청 — 시험실무자/기술책임자만)
 *
 * 그러나 §4.3에 따라 다음 최종 승인 권한은 보유한다 (positive boundary):
 *   - APPROVE_CALIBRATION_PLAN (교정계획서 최종 승인)
 *   - APPROVE_DISPOSAL (장비 폐기 최종 승인)
 *
 * **트리거:** stale-contract-cleanup 세션(2026-04-30)에서 8 spec이 일괄
 * `'admin' → 'systemAdmin'`로 변경되며 lab_manager scope 검증이 silent하게
 * 누락되었을 가능성. 본 spec은 lab_manager 권한 boundary를 명시 검증한다.
 *
 * **dogfood:** Phase 2 `getTokenForPermission(app, perm)` 헬퍼 사용 —
 * Permission.APPROVE_CALIBRATION_PLAN → narrowest=lab_manager 자동 매핑.
 *
 * Phase 4/5 of senior-permission-ssot-20260501 sprint.
 */
describe('UL-QP-18 §4.2/§4.3 직무분리: lab_manager 권한 스코프 (e2e)', () => {
  let ctx: TestAppContext;
  let labManagerToken: string;
  let suwonEquipmentUuid: string;
  const tracker = new ResourceTracker();

  beforeAll(async () => {
    ctx = await createTestApp();
    // dogfood: getTokenForPermission이 narrowest=lab_manager 자동 매핑
    // (Permission.APPROVE_CALIBRATION_PLAN의 보유 역할은 [lab_manager, system_admin] —
    //  Phase 1 matrix가 hierarchy ascending 정렬 보장 → 첫 매치 = lab_manager)
    labManagerToken = await getTokenForPermission(
      ctx.app,
      Permission.APPROVE_CALIBRATION_PLAN
    );

    // setup용 테스트 장비 — fixture가 자체 systemAdmin 토큰 발급 (Step 24 패턴)
    suwonEquipmentUuid = await createTestEquipment(ctx.app, {
      name: 'E2E lab_manager scope test',
      site: 'suwon',
    });
    tracker.track('equipment', suwonEquipmentUuid);
  }, 30000);

  afterAll(async () => {
    if (ctx?.app && labManagerToken) {
      await tracker.cleanupAll(ctx.app, labManagerToken);
    }
    await closeTestApp(ctx?.app);
  });

  describe('positive — lab_manager 보유 권한 (UL-QP-18 §4.3)', () => {
    it('TC-1: VIEW_EQUIPMENT 가능 (200)', async () => {
      const resp = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.LIST)
        .set('Authorization', `Bearer ${labManagerToken}`);
      expect(resp.status).toBe(200);
    });

    it('TC-5 (boundary): APPROVE_CALIBRATION_PLAN 권한 통과 — UL-QP-18 §4.3 최종 승인', async () => {
      // 존재하지 않는 plan ID → 권한 통과 시 비즈니스 에러 (404/400/409 등) 발생,
      // 권한 차단 시 403 + AUTH_INSUFFICIENT_PERMISSIONS. 본 검증은 권한 통과만 확인.
      const fakePlanId = '00000000-0000-0000-0000-000000000099';
      const resp = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_PLANS.APPROVE(fakePlanId))
        .set('Authorization', `Bearer ${labManagerToken}`)
        .send({ casVersion: 1 });

      expect(resp.status).not.toBe(403);
      expect(resp.body.code).not.toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });

    it('TC-6 (boundary): APPROVE_DISPOSAL 권한 통과 — UL-QP-18 §4.3 폐기 최종 승인', async () => {
      const resp = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.DISPOSAL.APPROVE(suwonEquipmentUuid))
        .set('Authorization', `Bearer ${labManagerToken}`)
        .send({ casVersion: 1, comment: '본 spec은 권한 boundary만 검증' });

      expect(resp.status).not.toBe(403);
      expect(resp.body.code).not.toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('negative — lab_manager 박탈 권한 (UL-QP-18 §4.2 직무분리)', () => {
    it('TC-2: CREATE_EQUIPMENT 불가 (403, AUTH_INSUFFICIENT_PERMISSIONS)', async () => {
      // multipart 요청 — endpoint가 ParseFilePipe 보유 가능, 권한 게이트는 그 전에 실행
      const resp = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.CREATE)
        .set('Authorization', `Bearer ${labManagerToken}`)
        .field('name', 'should be blocked at permission guard')
        .field('site', 'suwon')
        .field('teamId', TEAM_FCC_EMC_RF_SUWON_ID);

      expect(resp.status).toBe(403);
      expect(resp.body.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });

    it('TC-3: APPROVE_EQUIPMENT 불가 — 등록·승인 분리 (403)', async () => {
      const fakeRequestId = '00000000-0000-0000-0000-000000000099';
      const resp = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.REQUESTS.APPROVE(fakeRequestId))
        .set('Authorization', `Bearer ${labManagerToken}`)
        .send({});

      expect(resp.status).toBe(403);
      expect(resp.body.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });

    it('TC-4: CREATE_CHECKOUT 불가 — 반출 신청 박탈 (403)', async () => {
      const resp = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CHECKOUTS.CREATE)
        .set('Authorization', `Bearer ${labManagerToken}`)
        .send({
          purpose: 'calibration',
          destination: 'should be blocked at permission guard',
          items: [{ equipmentId: suwonEquipmentUuid }],
        });

      expect(resp.status).toBe(403);
      expect(resp.body.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });
  });
});
