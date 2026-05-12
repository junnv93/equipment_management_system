/**
 * SH-1: 반려 사유 프리셋 관리 (admin CRUD) e2e
 *
 * `/admin/rejection-presets` 화면을 통해 systemAdmin 역할이 4 endpoint
 * (POST / PATCH / DELETE / PATCH reorder) 를 작동시키는지 검증.
 *
 * - 권한 가드: MANAGE_SYSTEM_SETTINGS 미보유 testOperator → /dashboard redirect.
 * - isDefault=true preset 삭제 시도 → backend ErrorCode `REJECTION_PRESET_IS_DEFAULT` 반환.
 * - reorder: payload `[ { id, sortOrder } ]` 형식.
 *
 * 시나리오 모두 backend API direct call 위주 — UI 페이지 진입은 permission redirect 만 검증.
 * (CRUD 폼 동작은 jest unit test 23/23 + RTL spec 으로 커버됨; e2e는 endpoint wiring + 권한만)
 *
 * @see apps/backend/src/modules/checkouts/__tests__/rejection-presets.spec.ts
 * @see apps/frontend/app/(dashboard)/admin/rejection-presets/page.tsx
 * @see packages/shared-constants/src/api-endpoints.ts — REJECTION_PRESETS*
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  cleanupSharedPool,
} from '../workflows/helpers/workflow-helpers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

const PRESETS_LIST = API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS;
const PRESETS_CREATE = API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS_CREATE;
const presetUpdate = (id: string) => API_ENDPOINTS.CHECKOUTS.REJECTION_PRESET_UPDATE(id);
const presetDelete = (id: string) => API_ENDPOINTS.CHECKOUTS.REJECTION_PRESET_DELETE(id);
const PRESETS_REORDER = API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS_REORDER;

interface RejectionPresetRow {
  id: string;
  label: string;
  template?: string | null;
  sortOrder: number;
  isDefault: boolean;
}

test.describe('SH-1: 반려 사유 프리셋 관리 (admin CRUD)', () => {
  test.describe.configure({ mode: 'serial' });

  const createdIds: string[] = [];

  test.afterAll(async ({ browser }) => {
    // 잔여 생성분 정리 (systemAdmin 토큰)
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    for (const id of createdIds) {
      await apiDelete(page, presetDelete(id), 'system_admin');
    }
    await ctx.close();
    await cleanupSharedPool();
  });

  test('Step 1: 권한 거부 — testOperator → /admin/rejection-presets 진입 → /dashboard redirect', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/admin/rejection-presets');
    await page.waitForURL(/\/(dashboard|admin\/rejection-presets)/, { timeout: 10000 });
    // MANAGE_SYSTEM_SETTINGS 미보유 → /dashboard 로 redirect
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/admin/rejection-presets');
  });

  test('Step 2: 권한 보유 — systemAdmin 페이지 진입 가능 + 목록 렌더', async ({
    systemAdminPage: page,
  }) => {
    await page.goto('/admin/rejection-presets');
    await expect(page).toHaveURL(/\/admin\/rejection-presets/);
    // page heading (h1) 노출 — 텍스트는 i18n SSOT 이므로 role+level 만 검증
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
  });

  test('Step 3: POST create — 신규 preset 1건 추가', async ({ systemAdminPage: page }) => {
    const resp = await apiPost(
      page,
      PRESETS_CREATE,
      {
        label: `[E2E] SH-1 create test ${Date.now()}`,
        template: '검증용 템플릿 — e2e 생성',
        sortOrder: 9000,
      },
      'system_admin'
    );
    expect(resp.status()).toBe(201);
    const body = (await resp.json()) as { data?: RejectionPresetRow } & RejectionPresetRow;
    const row = body.data ?? body;
    expect(row.id).toBeTruthy();
    expect(row.isDefault).toBe(false);
    createdIds.push(row.id);
  });

  test('Step 4: PATCH update — label/template 수정', async ({ systemAdminPage: page }) => {
    const id = createdIds[createdIds.length - 1];
    expect(id).toBeTruthy();
    const resp = await apiPatch(
      page,
      presetUpdate(id),
      {
        label: `[E2E] SH-1 updated ${Date.now()}`,
        template: '수정된 템플릿',
        sortOrder: 9001,
      },
      'system_admin'
    );
    expect(resp.status()).toBe(200);
    const body = (await resp.json()) as { data?: RejectionPresetRow } & RejectionPresetRow;
    const row = body.data ?? body;
    expect(row.id).toBe(id);
    expect(row.sortOrder).toBe(9001);
  });

  test('Step 5: PATCH reorder — bulk sortOrder 갱신', async ({ systemAdminPage: page }) => {
    const id = createdIds[createdIds.length - 1];
    expect(id).toBeTruthy();
    const resp = await apiPatch(
      page,
      PRESETS_REORDER,
      {
        items: [{ id, sortOrder: 9002 }],
      },
      'system_admin'
    );
    // 200 또는 204 (구현에 따라) — 4xx/5xx 아닌 것만 검증
    expect(resp.status()).toBeGreaterThanOrEqual(200);
    expect(resp.status()).toBeLessThan(300);
  });

  test('Step 6: isDefault preset 삭제 보호 — DELETE on default row → 4xx + IS_DEFAULT errorCode', async ({
    systemAdminPage: page,
  }) => {
    // 목록에서 isDefault=true row 1건 탐색
    const listResp = await apiGet(page, PRESETS_LIST, 'system_admin');
    expect(listResp.ok()).toBeTruthy();
    const listBody = (await listResp.json()) as
      | { data?: RejectionPresetRow[] }
      | RejectionPresetRow[];
    const rows = Array.isArray(listBody)
      ? listBody
      : (listBody.data ?? ([] as RejectionPresetRow[]));
    const defaultRow = rows.find((r) => r.isDefault);
    test.skip(!defaultRow, 'isDefault=true seed preset 없음 — backend seed 의존');

    const resp = await apiDelete(page, presetDelete(defaultRow!.id), 'system_admin');
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    expect(resp.status()).toBeLessThan(500);
    const errBody = (await resp.json().catch(() => ({}))) as { code?: string; errorCode?: string };
    // backend ErrorCode → REJECTION_PRESET_IS_DEFAULT (errorCode 키 위치는 GlobalExceptionFilter SSOT)
    const code = errBody.code ?? errBody.errorCode;
    expect(code).toBe('REJECTION_PRESET_IS_DEFAULT');
  });

  test('Step 7: DELETE non-default — Step 3 생성 row 정리', async ({ systemAdminPage: page }) => {
    const id = createdIds.pop();
    expect(id).toBeTruthy();
    const resp = await apiDelete(page, presetDelete(id!), 'system_admin');
    expect(resp.status()).toBeGreaterThanOrEqual(200);
    expect(resp.status()).toBeLessThan(300);
  });
});
