/**
 * Cable Path Loss (UL-QP-18-08) 권한 가시성 spec
 *
 * 검증 매트릭스 (packages/shared-constants/src/role-permissions.ts 기준):
 *   TE / TM / LM: VIEW_CALIBRATIONS + UPDATE_CALIBRATION → 목록 진입 + 등록/측정 버튼 visible
 *   QM:           VIEW_CALIBRATIONS (read-only) → 목록 진입 OK, 등록/측정 버튼 숨김
 *
 * 백엔드 방어선 (cables.controller.ts):
 *   POST /api/cables, PATCH /api/cables/:id, POST measurements → @RequirePermissions(UPDATE_CALIBRATION)
 *   → QM이 직접 fetch/Postman 호출 시에도 403
 *
 * @see docs/workflows/critical-workflows.md WF-21
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { apiPost } from '../../../workflows/helpers/workflow-helpers';
import { cleanupSharedPool } from '../../../workflows/helpers/workflow-helpers';

// 관리번호: WF-21 API spec(+0) / UI spec(+333)과 격리 위해 +666 offset
const managementNumber = `ELLLX-${String((Date.now() + 666) % 1000).padStart(3, '0')}`;

// i18n 라벨 (messages/ko/cables.json 복사)
const L = {
  listTitle: '케이블/경로손실 관리대장',
  createButton: '케이블 등록',
  measurementAddButton: '측정 데이터 추가',
  editButton: '수정',
} as const;

let sharedCableId: string;

test.describe('WF-21 권한: 케이블 Path Loss UI 역할별 가시성', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await cleanupSharedPool();
  });

  test('seed: TE가 detail 페이지 검증용 케이블 1건 생성', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(page, '/api/cables', { managementNumber }, 'test_engineer');
    expect(resp.status(), `cable seed creation failed: ${await resp.text()}`).toBe(201);
    const body = (await resp.json()) as { id?: string; data?: { id: string } };
    sharedCableId = (body.data?.id ?? body.id) as string;
    expect(sharedCableId).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────
  // UPDATE_CALIBRATION 보유 역할 (TE/TM/LM): 버튼 visible
  // ─────────────────────────────────────────────────────────────

  test('TE(시험실무자): /cables 목록에 "케이블 등록" 버튼 visible', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/cables');
    await expect(page.getByRole('heading', { name: L.listTitle, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: L.createButton })).toBeVisible();
  });

  test('TE: 상세 페이지에 "측정 데이터 추가" 버튼 visible', async ({ testOperatorPage: page }) => {
    await page.goto(`/cables/${sharedCableId}`);
    await expect(page.getByRole('button', { name: L.measurementAddButton })).toBeVisible();
    await expect(page.getByRole('button', { name: L.editButton })).toBeVisible();
  });

  test('TM(기술책임자): /cables 목록에 "케이블 등록" 버튼 visible', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/cables');
    await expect(page.getByRole('link', { name: L.createButton })).toBeVisible();
  });

  test('TM: 상세 페이지에 "측정 데이터 추가" 버튼 visible', async ({ techManagerPage: page }) => {
    await page.goto(`/cables/${sharedCableId}`);
    await expect(page.getByRole('button', { name: L.measurementAddButton })).toBeVisible();
  });

  test('LM(시험소장): /cables 목록에 "케이블 등록" 버튼 visible', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/cables');
    await expect(page.getByRole('link', { name: L.createButton })).toBeVisible();
  });

  test('LM: 상세 페이지에 "측정 데이터 추가" 버튼 visible', async ({ siteAdminPage: page }) => {
    await page.goto(`/cables/${sharedCableId}`);
    await expect(page.getByRole('button', { name: L.measurementAddButton })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // QM: read-only (UPDATE_CALIBRATION 없음) → 버튼 hidden
  // ─────────────────────────────────────────────────────────────

  test('QM(품질책임자): 목록 진입 가능하지만 "케이블 등록" 버튼 hidden', async ({
    qualityManagerPage: page,
  }) => {
    await page.goto('/cables');
    // 목록 자체는 VIEW_CALIBRATIONS 보유이므로 진입 허용
    await expect(page.getByRole('heading', { name: L.listTitle, level: 1 })).toBeVisible();
    // 등록 버튼은 UPDATE_CALIBRATION 필요 → 숨김
    await expect(page.getByRole('link', { name: L.createButton })).toHaveCount(0);
  });

  test('QM: 상세 페이지 진입 가능하지만 "측정 데이터 추가" / "수정" hidden', async ({
    qualityManagerPage: page,
  }) => {
    await page.goto(`/cables/${sharedCableId}`);
    // 관리번호 h1은 보여야 함 (view 권한)
    await expect(page.getByRole('heading', { name: managementNumber, level: 1 })).toBeVisible();
    // mutate 버튼은 숨김
    await expect(page.getByRole('button', { name: L.measurementAddButton })).toHaveCount(0);
    await expect(page.getByRole('button', { name: L.editButton })).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────
  // Defense-in-depth: 백엔드 권한 가드 검증
  // QM이 UI를 우회해 직접 API 호출하면 403
  // ─────────────────────────────────────────────────────────────

  test('QM: POST /api/cables 직접 호출 → 403 (백엔드 @RequirePermissions 방어선)', async ({
    qualityManagerPage: page,
  }) => {
    const resp = await apiPost(
      page,
      '/api/cables',
      { managementNumber: `QMBAD-${Date.now() % 1000}` },
      'quality_manager'
    );
    expect(resp.status()).toBe(403);
  });
});
