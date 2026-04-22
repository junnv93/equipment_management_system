/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';
import { TEAM_FCC_EMC_RF_SUWON_ID } from '../src/database/utils/uuid-constants';

/**
 * Checkout FSM Guard E2E — PR-2 검증
 *
 * CHECKOUT_TRANSITIONS 테이블이 유일한 SSOT임을 증명:
 * - invalid_transition: 잘못된 상태에서 액션 → CHECKOUT_INVALID_TRANSITION
 * - permission denied: 권한 없는 역할로 액션 → CHECKOUT_FORBIDDEN
 * - valid transition: 올바른 상태+권한 → 성공
 * - meta.nextStep: FSM 파생 메타데이터 응답에 포함
 *
 * 격리 전략: createPendingCheckout()가 매 호출마다 전용 장비를 생성.
 * 단일 장비 공유 시 CHECKOUT_EQUIPMENT_ALREADY_ACTIVE 충돌 발생.
 */

describe('CheckoutsController FSM Guards (e2e)', () => {
  let ctx: TestAppContext;
  let adminToken: string;
  let userToken: string;
  const tracker = new ResourceTracker();

  beforeAll(async () => {
    ctx = await createTestApp();
    adminToken = await loginAs(ctx.app, 'admin');
    userToken = await loginAs(ctx.app, 'user');
  });

  afterAll(async () => {
    await tracker.cleanupAll(ctx.app, adminToken);
    await closeTestApp(ctx?.app);
  });

  // ──────────────────────────────────────────────────────────
  // 헬퍼 — 매 호출마다 전용 장비 + 반출 생성
  // ──────────────────────────────────────────────────────────

  async function createPendingCheckout(purpose = 'calibration'): Promise<{ id: string; version: number }> {
    const eqId = await createTestEquipment(ctx.app, adminToken, {
      name: `FSM E2E Eq ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    });
    tracker.track('equipment', eqId);

    const res = await request(ctx.app.getHttpServer())
      .post(API_ENDPOINTS.CHECKOUTS.CREATE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        equipmentIds: [eqId],
        purpose,
        destination: 'FSM E2E Test Destination',
        reason: 'FSM guard E2E test',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    tracker.track('checkout', res.body.id);
    return { id: res.body.id, version: res.body.version };
  }

  async function approveCheckout(id: string, version: number): Promise<{ version: number }> {
    const res = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.CHECKOUTS.APPROVE(id))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ version })
      .expect(200);
    return { version: res.body.version };
  }

  async function startCheckout(id: string, version: number): Promise<{ version: number }> {
    const res = await request(ctx.app.getHttpServer())
      .post(API_ENDPOINTS.CHECKOUTS.START(id))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ version })
      .expect(201);
    return { version: res.body.version };
  }

  async function returnCheckout(id: string, version: number): Promise<{ version: number }> {
    const res = await request(ctx.app.getHttpServer())
      .post(API_ENDPOINTS.CHECKOUTS.RETURN(id))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        version,
        workingStatusChecked: true,
        calibrationChecked: true,
      })
      .expect(201);
    return { version: res.body.version };
  }

  // ──────────────────────────────────────────────────────────
  // A. Invalid Transition (잘못된 상태에서 액션)
  // ──────────────────────────────────────────────────────────

  describe('invalid_transition — CHECKOUT_INVALID_TRANSITION', () => {
    it('rejects start on pending checkout', async () => {
      const { id, version } = await createPendingCheckout();

      const res = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CHECKOUTS.START(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CHECKOUT_INVALID_TRANSITION');
    });

    it('rejects submit_return on pending checkout', async () => {
      const { id, version } = await createPendingCheckout();

      const res = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CHECKOUTS.RETURN(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version, workingStatusChecked: true, calibrationChecked: true });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CHECKOUT_INVALID_TRANSITION');
    });

    it('rejects approve_return on pending checkout', async () => {
      const { id, version } = await createPendingCheckout();

      const res = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.APPROVE_RETURN(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CHECKOUT_INVALID_TRANSITION');
    });

    it('rejects double-approve on approved checkout', async () => {
      const { id, version } = await createPendingCheckout();
      const approved = await approveCheckout(id, version);

      const res = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.APPROVE(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version: approved.version });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CHECKOUT_INVALID_TRANSITION');
    });

    it('rejects approve on returned checkout', async () => {
      const { id, version } = await createPendingCheckout();
      const approved = await approveCheckout(id, version);
      const started = await startCheckout(id, approved.version);
      const returned = await returnCheckout(id, started.version);

      const res = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.APPROVE(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version: returned.version });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CHECKOUT_INVALID_TRANSITION');
    });
  });

  // ──────────────────────────────────────────────────────────
  // B. Permission Denied (권한 없는 역할)
  // ──────────────────────────────────────────────────────────

  describe('permission denied — CHECKOUT_FORBIDDEN', () => {
    it('denies approve from test_engineer — controller guard blocks (AUTH_INSUFFICIENT_PERMISSIONS)', async () => {
      const { id, version } = await createPendingCheckout();

      const res = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.APPROVE(id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ version });

      // approve guard는 APPROVE_CHECKOUT 요구 — test_engineer가 갖지 않으므로
      // PermissionsGuard에서 먼저 차단(AUTH_INSUFFICIENT_PERMISSIONS). assertFsmAction 도달 불가.
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });

    it('denies approve_return from test_engineer — controller guard blocks (AUTH_INSUFFICIENT_PERMISSIONS)', async () => {
      const { id, version } = await createPendingCheckout();
      const approved = await approveCheckout(id, version);
      const started = await startCheckout(id, approved.version);
      const returned = await returnCheckout(id, started.version);

      const res = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.APPROVE_RETURN(id))
        .set('Authorization', `Bearer ${userToken}`)
        .send({ version: returned.version });

      // approve-return guard는 APPROVE_CHECKOUT 요구 — test_engineer가 갖지 않으므로
      // PermissionsGuard에서 먼저 차단(AUTH_INSUFFICIENT_PERMISSIONS). assertFsmAction 도달 불가.
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });
  });

  // ──────────────────────────────────────────────────────────
  // C. Valid Transition (calibration end-to-end)
  // ──────────────────────────────────────────────────────────

  describe('valid calibration flow (pending → approved → checked_out → returned → return_approved)', () => {
    let checkoutId: string;
    let currentVersion: number;

    beforeAll(async () => {
      const created = await createPendingCheckout('calibration');
      checkoutId = created.id;
      currentVersion = created.version;
    });

    it('step 1: approve pending checkout → approved', async () => {
      const res = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.APPROVE(checkoutId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version: currentVersion })
        .expect(200);

      expect(res.body.status).toBe('approved');
      currentVersion = res.body.version;
    });

    it('step 2: start approved checkout → checked_out', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CHECKOUTS.START(checkoutId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version: currentVersion })
        .expect(201);

      expect(res.body.status).toBe('checked_out');
      currentVersion = res.body.version;
    });

    it('step 3: submit return → returned', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CHECKOUTS.RETURN(checkoutId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: currentVersion,
          workingStatusChecked: true,
          calibrationChecked: true,
        })
        .expect(201);

      expect(res.body.status).toBe('returned');
      currentVersion = res.body.version;
    });

    it('step 4: approve return → return_approved', async () => {
      const res = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.APPROVE_RETURN(checkoutId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version: currentVersion })
        .expect(200);

      expect(res.body.status).toBe('return_approved');
    });
  });

  // ──────────────────────────────────────────────────────────
  // D. meta.nextStep 스냅샷
  // ──────────────────────────────────────────────────────────

  describe('meta.nextStep FSM descriptor', () => {
    it('pending checkout: nextAction=approve, nextActor=logistics, step 1/5', async () => {
      const { id } = await createPendingCheckout('calibration');

      const res = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CHECKOUTS.GET(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.nextStep).toBeDefined();
      expect(res.body.meta.nextStep.nextAction).toBe('approve');
      expect(res.body.meta.nextStep.nextActor).toBe('logistics');
      expect(res.body.meta.nextStep.currentStepIndex).toBe(1);
      expect(res.body.meta.nextStep.totalSteps).toBe(5);
      expect(res.body.meta.nextStep.availableToCurrentUser).toBe(true);
    });

    it('return_approved checkout: terminal state — nextAction=null, nextActor=none', async () => {
      const { id, version } = await createPendingCheckout('calibration');
      const approved = await approveCheckout(id, version);
      const started = await startCheckout(id, approved.version);
      const returned = await returnCheckout(id, started.version);

      await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.APPROVE_RETURN(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version: returned.version })
        .expect(200);

      const res = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CHECKOUTS.GET(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.meta.nextStep.nextAction).toBeNull();
      expect(res.body.meta.nextStep.nextActor).toBe('none');
      expect(res.body.meta.nextStep.availableToCurrentUser).toBe(false);
    });

    it('approved checkout (calibration): nextAction=start, nextActor=requester', async () => {
      const { id, version } = await createPendingCheckout('calibration');
      await approveCheckout(id, version);

      const res = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CHECKOUTS.GET(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.meta.nextStep.nextAction).toBe('start');
      expect(res.body.meta.nextStep.nextActor).toBe('requester');
    });

    it('test_engineer sees nextStep but availableToCurrentUser=false for approve action', async () => {
      const { id } = await createPendingCheckout('calibration');

      const res = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CHECKOUTS.GET(id))
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.meta.nextStep.nextAction).toBe('approve');
      expect(res.body.meta.nextStep.availableToCurrentUser).toBe(false);
      expect(res.body.meta.nextStep.blockingReason).toBe('permission');
    });
  });

  // ──────────────────────────────────────────────────────────
  // E. approved 상태 취소 — FSM 허용 (regression guard)
  // ──────────────────────────────────────────────────────────

  describe('approved → cancel allowed (FSM regression)', () => {
    it('cancel on approved checkout succeeds', async () => {
      const { id, version } = await createPendingCheckout('calibration');
      const approved = await approveCheckout(id, version);

      const res = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.CHECKOUTS.CANCEL(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ version: approved.version })
        .expect(200);

      expect(res.body.status).toBe('canceled');
    });
  });

  // ──────────────────────────────────────────────────────────
  // F. availableActions SSOT (FSM 위임 결과)
  // ──────────────────────────────────────────────────────────

  describe('availableActions reflects FSM state', () => {
    it('pending checkout: canApprove=true, canStart=false for admin', async () => {
      const { id } = await createPendingCheckout('calibration');

      const res = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CHECKOUTS.GET(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const actions = res.body.meta.availableActions;
      expect(actions.canApprove).toBe(true);
      expect(actions.canReject).toBe(true);
      expect(actions.canStart).toBe(false);
      expect(actions.canReturn).toBe(false);
      expect(actions.canApproveReturn).toBe(false);
      expect(actions.canCancel).toBe(true);
    });

    it('approved checkout (calibration): canStart=true, canApprove=false for admin', async () => {
      const { id, version } = await createPendingCheckout('calibration');
      await approveCheckout(id, version);

      const res = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CHECKOUTS.GET(id))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const actions = res.body.meta.availableActions;
      expect(actions.canApprove).toBe(false);
      expect(actions.canStart).toBe(true);
      expect(actions.canReturn).toBe(false);
    });
  });
});
