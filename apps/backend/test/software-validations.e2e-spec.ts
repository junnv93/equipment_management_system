/// <reference types="jest" />

import request from 'supertest';
import { eq } from 'drizzle-orm';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { softwareValidations } from '@equipment-management/db/schema';
import type { AppDatabase } from '@equipment-management/db';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { TEST_SOFTWARE_DAK_ID } from '../src/database/seed-data/software/test-software.seed';

/**
 * Software Validations approve approvalComment persistence (e2e)
 *
 * 직전 세션 silent loss fix (`approvalComment` 컬럼 + service persist)의
 * runtime 검증. Unit spec은 mock UPDATE.set 호출만 검증하므로 Drizzle ORM의
 * snake_case 컬럼명 변환·실제 PostgreSQL UPDATE 발행 회귀 차단 불가.
 *
 * 본 spec은 실 PostgreSQL을 호출하여:
 *   1. CREATE → SUBMIT → APPROVE 워크플로우 (ISO/IEC 17025 §6.2.2 submitter !== approver)
 *   2. response.body.approvalComment 값 검증 (Drizzle select 결과)
 *   3. DB 직접 SELECT (response 우회 — column mapping 회귀 차단)
 *
 * Out of Scope: qualityApprove/reject (Phase B1에서 별도 추가).
 */
describe('SoftwareValidations approveComment persistence (e2e)', () => {
  let ctx: TestAppContext;
  let submitterToken: string; // test_engineer
  let approverToken: string; // technical_manager (different user — ISO/IEC 17025 §6.2.2)
  const createdValidationIds: string[] = [];
  let db: AppDatabase;

  beforeAll(async () => {
    ctx = await createTestApp();
    submitterToken = await loginAs(ctx.app, 'user'); // test_engineer
    approverToken = await loginAs(ctx.app, 'manager'); // technical_manager
    db = ctx.module.get<AppDatabase>('DRIZZLE_INSTANCE');
  });

  afterAll(async () => {
    // 생성된 모든 validation row 정리
    for (const id of createdValidationIds) {
      try {
        await db.delete(softwareValidations).where(eq(softwareValidations.id, id));
      } catch {
        // best-effort cleanup
      }
    }
    await closeTestApp(ctx?.app);
  });

  /**
   * Helper: CREATE → SUBMIT 흐름으로 submitted 상태의 validation row 생성.
   * 각 테스트가 독립된 row를 사용하도록 매 호출마다 새 row.
   */
  async function createSubmittedValidation(): Promise<{ id: string; version: number }> {
    const created = await request(ctx.app.getHttpServer())
      .post(API_ENDPOINTS.SOFTWARE_VALIDATIONS.CREATE(TEST_SOFTWARE_DAK_ID))
      .set('Authorization', `Bearer ${submitterToken}`)
      .send({
        validationType: 'self',
        softwareVersion: `e2e-${Date.now()}`,
      });
    expect(created.status).toBe(201);
    const validationId = created.body.id;
    createdValidationIds.push(validationId);

    const submitted = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.SUBMIT(validationId))
      .set('Authorization', `Bearer ${submitterToken}`)
      .send({ version: created.body.version });
    expect(submitted.status).toBe(200);
    expect(submitted.body.status).toBe('submitted');

    return { id: validationId, version: submitted.body.version };
  }

  it('approve(uuid, version, approvalComment) persists comment to response and DB column', async () => {
    const { id, version } = await createSubmittedValidation();
    const COMMENT = 'E2E 검토 완료 — 모든 항목 통과';

    const res = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.APPROVE(id))
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ version, approvalComment: COMMENT });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.approvalComment).toBe(COMMENT);

    // DB 직접 검증 — Drizzle select 우회. snake_case column mapping 회귀 차단.
    const rows = await db
      .select({ approval_comment: softwareValidations.approvalComment })
      .from(softwareValidations)
      .where(eq(softwareValidations.id, id))
      .limit(1);
    expect(rows[0]?.approval_comment).toBe(COMMENT);
  });

  it('approve(uuid, version) without approvalComment persists NULL', async () => {
    const { id, version } = await createSubmittedValidation();

    const res = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.APPROVE(id))
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ version });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.approvalComment).toBeNull();

    const rows = await db
      .select({ approval_comment: softwareValidations.approvalComment })
      .from(softwareValidations)
      .where(eq(softwareValidations.id, id))
      .limit(1);
    expect(rows[0]?.approval_comment).toBeNull();
  });

  it('approve with empty string approvalComment persists NULL (DTO trim policy)', async () => {
    const { id, version } = await createSubmittedValidation();

    const res = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.APPROVE(id))
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ version, approvalComment: '' });

    expect(res.status).toBe(200);
    expect(res.body.approvalComment).toBeNull();

    const rows = await db
      .select({ approval_comment: softwareValidations.approvalComment })
      .from(softwareValidations)
      .where(eq(softwareValidations.id, id))
      .limit(1);
    expect(rows[0]?.approval_comment).toBeNull();
  });

  // ============================================================================
  // Phase B1 — qualityApprove silent loss closure (e2e DB round-trip)
  // ============================================================================

  let qualityApproverToken: string;

  beforeAll(async () => {
    qualityApproverToken = await loginAs(ctx.app, 'admin'); // lab_manager (different from manager/technical)
  });

  /**
   * Helper: CREATE → SUBMIT → APPROVE 흐름으로 approved 상태 row 생성.
   * qualityApprove 테스트 전제: technicalApproverId !== qualityApproverId.
   */
  async function createApprovedValidation(): Promise<{ id: string; version: number }> {
    const submitted = await createSubmittedValidation();
    const approved = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.APPROVE(submitted.id))
      .set('Authorization', `Bearer ${approverToken}`) // technical_manager
      .send({ version: submitted.version });
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe('approved');
    return { id: submitted.id, version: approved.body.version };
  }

  it('qualityApprove(uuid, version, qualityApprovalComment) persists comment to DB', async () => {
    const { id, version } = await createApprovedValidation();
    const COMMENT = 'E2E 품질 검토 완료';

    const res = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.QUALITY_APPROVE(id))
      .set('Authorization', `Bearer ${qualityApproverToken}`)
      .send({ version, qualityApprovalComment: COMMENT });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('quality_approved');
    expect(res.body.qualityApprovalComment).toBe(COMMENT);

    const rows = await db
      .select({ quality_approval_comment: softwareValidations.qualityApprovalComment })
      .from(softwareValidations)
      .where(eq(softwareValidations.id, id))
      .limit(1);
    expect(rows[0]?.quality_approval_comment).toBe(COMMENT);
  });

  it('qualityApprove without qualityApprovalComment persists NULL', async () => {
    const { id, version } = await createApprovedValidation();

    const res = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.QUALITY_APPROVE(id))
      .set('Authorization', `Bearer ${qualityApproverToken}`)
      .send({ version });

    expect(res.status).toBe(200);
    expect(res.body.qualityApprovalComment).toBeNull();
  });
});
