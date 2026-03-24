/**
 * Checkout Test Helper Functions
 *
 * Reusable utilities for E2E checkout tests following SSOT principles
 */

import { Page, expect } from '@playwright/test';
import { Pool } from 'pg';
import {
  CHECKOUT_STATUS_VALUES,
  CHECKOUT_STATUS_LABELS,
  CHECKOUT_PURPOSE_VALUES,
  CHECKOUT_PURPOSE_LABELS,
  CheckoutPurposeValues as CPVal,
  CheckoutStatusValues as CSVal,
  EquipmentStatusValues as ESVal,
  type CheckoutPurpose,
} from '@equipment-management/schemas';

// ============================================================================
// Constants
// ============================================================================

import { BASE_URLS } from '../../../shared/constants/shared-test-data';
const BACKEND_URL = BASE_URLS.BACKEND;

// ============================================================================
// Test Data Constants (SSOT)
// ============================================================================

/** 시드 데이터 checkout ID 프리픽스. UUID LIKE 패턴 매칭에 사용. */
const SEED_CHECKOUT_ID_PREFIX = '10000000-';

/** 시드 데이터 장비 ID 프리픽스. */
const SEED_EQUIPMENT_ID_PREFIX = 'eeee';

/** CAS 초기 version — DB 스키마 DEFAULT 값과 동기화. @see packages/db/src/schema/checkouts.ts */
const INITIAL_VERSION = 1;

// ============================================================================
// Database Direct Reset (for test state management)
// ============================================================================

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management';

let checkoutPool: Pool | null = null;

export function getCheckoutPool(): Pool {
  if (!checkoutPool) {
    checkoutPool = new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return checkoutPool;
}

/**
 * Reset equipment status to 'available' via direct DB SQL.
 * Useful for tests where equipment may have been changed by schedulers or previous runs.
 */
export async function resetEquipmentToAvailable(equipmentId: string): Promise<void> {
  const pool = getCheckoutPool();
  await pool.query(`UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1`, [
    equipmentId,
    ESVal.AVAILABLE,
  ]);
}

/**
 * Cancel all active (non-terminal) checkouts for a given equipment ID.
 * Use in beforeAll when dynamically creating checkouts for equipment
 * that may have leftover active checkouts from previous test runs.
 */
export async function cancelActiveCheckoutsForEquipment(equipmentId: string): Promise<void> {
  const pool = getCheckoutPool();
  // 동적 생성된 checkout만 취소 (시드 데이터 보존)
  // 시드 데이터는 각 스위트의 beforeAll에서 개별적으로 상태 리셋
  await pool.query(
    `UPDATE checkouts SET status = 'canceled', version = $2, updated_at = NOW()
     WHERE status NOT IN ('canceled', 'return_approved', 'rejected')
       AND id::text NOT LIKE $3
       AND id IN (
         SELECT c.id FROM checkouts c
         JOIN checkout_items ci ON c.id = ci.checkout_id
         WHERE ci.equipment_id = $1
       )`,
    [equipmentId, INITIAL_VERSION, `${SEED_CHECKOUT_ID_PREFIX}%`]
  );
}

/**
 * Reset equipment to available state with active checkout cleanup.
 * Combines cancelActiveCheckoutsForEquipment + resetEquipmentToAvailable.
 * Use in beforeAll for suites that dynamically create checkouts.
 */
export async function resetEquipmentForNewCheckout(equipmentId: string): Promise<void> {
  await cancelActiveCheckoutsForEquipment(equipmentId);
  await resetEquipmentToAvailable(equipmentId);
}

/**
 * Cleanup the checkout pool (call in afterAll or global teardown)
 */
export async function cleanupCheckoutPool(): Promise<void> {
  if (checkoutPool) {
    try {
      await checkoutPool.end();
    } catch {
      // ignore
    } finally {
      checkoutPool = null;
    }
  }
}

/**
 * Clear the backend in-memory cache.
 *
 * Direct SQL resets bypass the ORM and don't trigger cache invalidation.
 * Call this after SQL resets to ensure the backend serves fresh data.
 *
 * Uses Node's fetch (not page.request) so it works in beforeAll hooks.
 */
export async function clearBackendCache(): Promise<void> {
  const url = `${BACKEND_URL}/api/auth/test-cache-clear`;
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to clear backend cache: ${response.status}`);
  }
}

/**
 * Reset a checkout to 'pending' status via direct DB SQL.
 *
 * The backend business logic prevents status rollback (e.g., approved→pending),
 * so we need direct SQL for test state reset.
 * Automatically clears backend cache after DB update.
 *
 * @example
 * await resetCheckoutToPending(CHECKOUT_001_ID);
 */
export async function resetCheckoutToPending(checkoutId: string): Promise<void> {
  const pool = getCheckoutPool();
  await pool.query(
    `UPDATE checkouts
     SET status = $2,
         version = ${INITIAL_VERSION},
         approver_id = NULL,
         approved_at = NULL,
         rejection_reason = NULL,
         checkout_date = NULL,
         actual_return_date = NULL,
         calibration_checked = false,
         repair_checked = false,
         working_status_checked = false,
         inspection_notes = NULL,
         returner_id = NULL,
         return_approved_by = NULL,
         return_approved_at = NULL,
         lender_confirmed_by = NULL,
         lender_confirmed_at = NULL,
         lender_confirm_notes = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [checkoutId, CSVal.PENDING]
  );
}

/**
 * Reset a checkout to 'approved' status via direct DB SQL.
 *
 * @example
 * await resetCheckoutToApproved(CHECKOUT_009_ID, TECH_MANAGER_ID);
 */
export async function resetCheckoutToApproved(
  checkoutId: string,
  approverId: string = '00000000-0000-0000-0000-000000000002'
): Promise<void> {
  const pool = getCheckoutPool();
  await pool.query(
    `UPDATE checkouts
     SET status = $3,
         version = ${INITIAL_VERSION},
         approver_id = $2,
         approved_at = NOW(),
         rejection_reason = NULL,
         checkout_date = NULL,
         actual_return_date = NULL,
         calibration_checked = false,
         repair_checked = false,
         working_status_checked = false,
         inspection_notes = NULL,
         returner_id = NULL,
         return_approved_by = NULL,
         return_approved_at = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [checkoutId, approverId, CSVal.APPROVED]
  );
}

/**
 * Reset a checkout to 'checked_out' status via direct DB SQL.
 *
 * @example
 * await resetCheckoutToCheckedOut(CHECKOUT_019_ID);
 */
export async function resetCheckoutToCheckedOut(
  checkoutId: string,
  approverId: string = '00000000-0000-0000-0000-000000000002'
): Promise<void> {
  const pool = getCheckoutPool();
  await pool.query(
    `UPDATE checkouts
     SET status = $3,
         version = ${INITIAL_VERSION},
         approver_id = $2,
         approved_at = NOW() - INTERVAL '1 day',
         checkout_date = NOW(),
         rejection_reason = NULL,
         actual_return_date = NULL,
         calibration_checked = false,
         repair_checked = false,
         working_status_checked = false,
         inspection_notes = NULL,
         returner_id = NULL,
         return_approved_by = NULL,
         return_approved_at = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [checkoutId, approverId, CSVal.CHECKED_OUT]
  );
}

/**
 * Reset a checkout to 'returned' status via direct DB SQL.
 *
 * @example
 * await resetCheckoutToReturned(CHECKOUT_042_ID);
 */
export async function resetCheckoutToReturned(
  checkoutId: string,
  approverId: string = '00000000-0000-0000-0000-000000000002'
): Promise<void> {
  const pool = getCheckoutPool();
  await pool.query(
    `UPDATE checkouts
     SET status = $3,
         version = ${INITIAL_VERSION},
         approver_id = $2,
         approved_at = NOW() - INTERVAL '2 days',
         checkout_date = NOW() - INTERVAL '1 day',
         actual_return_date = NOW(),
         calibration_checked = true,
         repair_checked = false,
         working_status_checked = true,
         returner_id = $2,
         return_approved_by = NULL,
         return_approved_at = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [checkoutId, approverId, CSVal.RETURNED]
  );
}

// ============================================================================
// Types
// ============================================================================

export interface CreateCheckoutOptions {
  equipmentIds: string[];
  purpose: CheckoutPurpose;
  destination: string;
  reason: string;
  expectedReturnDate: string;
  lenderTeamId?: string; // For rental only
  lenderSiteId?: string; // For rental only
}

export interface ReturnCheckoutInspections {
  calibrationChecked?: boolean;
  repairChecked?: boolean;
  workingStatusChecked: boolean;
}

// ============================================================================
// Checkout Request Helpers
// ============================================================================

/**
 * Create a checkout request via UI
 *
 * @example
 * await createCheckoutRequest(page, {
 *   equipmentIds: [EQUIP_SPECTRUM_ANALYZER_SUW_E_ID],
 *   purpose: 'calibration',
 *   destination: '한국교정시험연구원',
 *   reason: '정기 교정',
 *   expectedReturnDate: '2026-03-01'
 * });
 */
export async function createCheckoutRequest(
  page: Page,
  options: CreateCheckoutOptions
): Promise<void> {
  // Navigate to create page
  await page.goto('/checkouts/create');

  // Wait for form to load
  await page.waitForLoadState('domcontentloaded');

  // Select equipment
  for (const equipmentId of options.equipmentIds) {
    await page.getByTestId(`equipment-${equipmentId}`).click();
  }

  // Fill form using SSOT labels
  const purposeLabel = CHECKOUT_PURPOSE_LABELS[options.purpose];
  await page.getByLabel('반출 목적').selectOption(purposeLabel);
  await page.getByLabel('반출 장소').fill(options.destination);
  await page.getByLabel('반출 사유').fill(options.reason);
  await page.getByLabel('예상 반입 일시').fill(options.expectedReturnDate);

  if (options.purpose === CPVal.RENTAL) {
    // Rental-specific fields
    if (!options.lenderTeamId || !options.lenderSiteId) {
      throw new Error('lenderTeamId and lenderSiteId are required for rental checkouts');
    }
    await page.getByLabel('대여 제공 팀').selectOption(options.lenderTeamId);
    await page.getByLabel('대여 제공 사이트').selectOption(options.lenderSiteId);
  }

  // Submit
  await page.getByRole('button', { name: '신청하기' }).click();
  await page.waitForLoadState('domcontentloaded');
}

// ============================================================================
// Approval/Rejection Helpers
// ============================================================================

/**
 * Approve a checkout via UI
 *
 * @example
 * await approveCheckout(page, CHECKOUT_001_ID);
 */
export async function approveCheckout(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '승인' }).click();
  await page.getByRole('button', { name: '확인' }).click(); // Confirmation dialog

  await page.waitForLoadState('domcontentloaded');
}

/**
 * Reject a checkout via UI
 *
 * @example
 * await rejectCheckout(page, CHECKOUT_001_ID, '인증되지 않은 교정기관입니다.');
 */
export async function rejectCheckout(
  page: Page,
  checkoutId: string,
  reason?: string
): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '거절' }).click();

  if (reason) {
    await page.getByLabel('거절 사유').fill(reason);
  }

  await page.getByRole('button', { name: '확인' }).click();
  await page.waitForLoadState('domcontentloaded');
}

// ============================================================================
// Checkout/Return Processing Helpers
// ============================================================================

/**
 * Start checkout (change equipment status to checked_out)
 *
 * @example
 * await startCheckout(page, CHECKOUT_009_ID);
 */
export async function startCheckout(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '반출 시작' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('domcontentloaded');
}

/**
 * Return checkout with inspections
 *
 * @example
 * await returnCheckout(page, CHECKOUT_019_ID, {
 *   calibrationChecked: true,
 *   workingStatusChecked: true
 * }, '교정 완료, 정상 작동 확인');
 */
export async function returnCheckout(
  page: Page,
  checkoutId: string,
  inspections: ReturnCheckoutInspections,
  notes?: string
): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '반입 신청' }).click();

  // Check mandatory inspections
  if (inspections.calibrationChecked) {
    await page.getByLabel('교정 상태 확인').check();
  }
  if (inspections.repairChecked) {
    await page.getByLabel('수리 상태 확인').check();
  }
  if (inspections.workingStatusChecked) {
    await page.getByLabel('작동 상태 확인').check();
  }

  if (notes) {
    await page.getByLabel('반입 비고').fill(notes);
  }

  await page.getByRole('button', { name: '반입 신청' }).click();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Approve return (restore equipment to available)
 *
 * @example
 * await approveReturn(page, CHECKOUT_042_ID);
 */
export async function approveReturn(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '반입 승인' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('domcontentloaded');
}

// ============================================================================
// Rental 4-Step Verification Helpers
// ============================================================================

/**
 * Lender pre-checkout check (Step ①)
 *
 * @example
 * await lenderPreCheckout(page, CHECKOUT_027_ID);
 */
export async function lenderPreCheckout(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '반출 전 확인 (대여자)' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('domcontentloaded');
}

/**
 * Borrower receipt check (Step ②)
 *
 * @example
 * await borrowerReceiptCheck(page, CHECKOUT_027_ID);
 */
export async function borrowerReceiptCheck(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '수령 확인 (차용자)' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('domcontentloaded');
}

/**
 * Borrower pre-return check (Step ③)
 *
 * @example
 * await borrowerPreReturn(page, CHECKOUT_030_ID);
 */
export async function borrowerPreReturn(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '반입 전 확인 (차용자)' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('domcontentloaded');
}

/**
 * Lender final return check (Step ④)
 *
 * @example
 * await lenderFinalCheck(page, CHECKOUT_036_ID);
 */
export async function lenderFinalCheck(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: '반입 최종 확인 (대여자)' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('domcontentloaded');
}

// ============================================================================
// Authenticated API Helpers
// ============================================================================

/**
 * Get a JWT token from the backend's test-login endpoint.
 *
 * The backend provides `GET /api/auth/test-login?role=<role>` in dev mode,
 * which returns `{ access_token }`. This token is used for direct backend API calls
 * in E2E tests where page.request doesn't carry NextAuth session cookies.
 *
 * @example
 * const token = await getBackendToken(page, 'technical_manager');
 */
// Token cache: role → { token, expiresAt }
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getBackendToken(
  page: Page,
  role: string = 'technical_manager'
): Promise<string> {
  // Return cached token if still valid (with 30s buffer)
  const cached = tokenCache.get(role);
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await page.request.get(`${BACKEND_URL}/api/auth/test-login?role=${role}`);
    if (response.ok()) {
      const data = await response.json();
      const token = data.access_token || data.token || '';
      // Cache for 14 minutes (token lasts 15 min)
      tokenCache.set(role, { token, expiresAt: Date.now() + 14 * 60 * 1000 });
      return token;
    }
    if (response.status() === 429 && attempt < maxRetries - 1) {
      await page.waitForTimeout(2000 * (attempt + 1));
      continue;
    }
    throw new Error(`Failed to get backend token: ${response.status()}`);
  }
  throw new Error('Failed to get backend token after retries');
}

/**
 * Make an authenticated GET request to the backend API.
 *
 * @example
 * const data = await apiGet(page, `/api/checkouts/${id}`);
 * expect(data.status).toBe('approved');
 */
export async function apiGet(
  page: Page,
  path: string,
  role: string = 'technical_manager'
): Promise<Record<string, unknown>> {
  const token = await getBackendToken(page, role);
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const response = await page.request.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) {
    const body = await response.text().catch(() => '');
    throw new Error(`apiGet ${path} failed: ${response.status()} ${body.slice(0, 200)}`);
  }
  return response.json();
}

/**
 * Make an authenticated POST request to the backend API.
 *
 * @example
 * const result = await apiPost(page, `/api/checkouts/${id}/approve`);
 */
export async function apiPost(
  page: Page,
  path: string,
  data?: Record<string, unknown>,
  role: string = 'technical_manager'
): Promise<{ response: import('@playwright/test').APIResponse; data: Record<string, unknown> }> {
  const token = await getBackendToken(page, role);
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const response = await page.request.post(url, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  let responseData = {};
  try {
    responseData = await response.json();
  } catch {
    // Some endpoints don't return JSON
  }
  return { response, data: responseData };
}

/**
 * Make an authenticated PATCH request to the backend API.
 *
 * @example
 * await apiPatch(page, `/api/checkouts/${id}`, { status: 'pending' });
 */
export async function apiPatch(
  page: Page,
  path: string,
  data?: Record<string, unknown>,
  role: string = 'technical_manager'
): Promise<{ response: import('@playwright/test').APIResponse; data: Record<string, unknown> }> {
  const token = await getBackendToken(page, role);
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const response = await page.request.patch(url, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  let responseData = {};
  try {
    responseData = await response.json();
  } catch {
    // Some endpoints don't return JSON
  }
  return { response, data: responseData };
}

// ============================================================================
// CAS-Aware Mutation Helpers
// ============================================================================

/**
 * Approve a checkout via API with automatic CAS version resolution.
 * Fetches current version, then sends PATCH /approve with { version }.
 */
export async function apiApproveCheckout(
  page: Page,
  checkoutId: string,
  role: string = 'technical_manager'
): Promise<{ response: import('@playwright/test').APIResponse; data: Record<string, unknown> }> {
  const detail = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  return apiPatch(page, `/api/checkouts/${checkoutId}/approve`, { version: detail.version }, role);
}

/**
 * Start a checkout via API with automatic CAS version resolution.
 */
export async function apiStartCheckout(
  page: Page,
  checkoutId: string,
  role: string = 'technical_manager'
): Promise<{ response: import('@playwright/test').APIResponse; data: Record<string, unknown> }> {
  const detail = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  return apiPost(page, `/api/checkouts/${checkoutId}/start`, { version: detail.version }, role);
}

/**
 * Return a checkout via API with automatic CAS version resolution.
 */
export async function apiReturnCheckout(
  page: Page,
  checkoutId: string,
  inspections: {
    calibrationChecked?: boolean;
    repairChecked?: boolean;
    workingStatusChecked: boolean;
    inspectionNotes?: string;
  },
  role: string = 'technical_manager'
): Promise<{ response: import('@playwright/test').APIResponse; data: Record<string, unknown> }> {
  const detail = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  return apiPost(
    page,
    `/api/checkouts/${checkoutId}/return`,
    { version: detail.version, ...inspections },
    role
  );
}

/**
 * Approve return via API with automatic CAS version resolution.
 */
export async function apiApproveReturn(
  page: Page,
  checkoutId: string,
  role: string = 'technical_manager'
): Promise<{ response: import('@playwright/test').APIResponse; data: Record<string, unknown> }> {
  const detail = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  return apiPatch(
    page,
    `/api/checkouts/${checkoutId}/approve-return`,
    { version: detail.version },
    role
  );
}

/**
 * Cancel a checkout via API with automatic CAS version resolution.
 */
export async function apiCancelCheckout(
  page: Page,
  checkoutId: string,
  role: string = 'technical_manager'
): Promise<{ response: import('@playwright/test').APIResponse; data: Record<string, unknown> }> {
  const detail = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  return apiPatch(page, `/api/checkouts/${checkoutId}/cancel`, { version: detail.version }, role);
}

// ============================================================================
// Verification Helpers (API-based)
// ============================================================================

/**
 * Verify equipment status via API
 *
 * @example
 * await verifyEquipmentStatus(page, EQUIP_SPECTRUM_ANALYZER_SUW_E_ID, 'checked_out');
 */
export async function verifyEquipmentStatus(
  page: Page,
  equipmentId: string,
  expectedStatus: string
): Promise<void> {
  const data = await apiGet(page, `/api/equipment/${equipmentId}`);
  expect(data.status).toBe(expectedStatus);
}

/**
 * Verify checkout status via API
 *
 * @example
 * await verifyCheckoutStatus(page, CHECKOUT_001_ID, 'approved');
 */
export async function verifyCheckoutStatus(
  page: Page,
  checkoutId: string,
  expectedStatus: string
): Promise<void> {
  const data = await apiGet(page, `/api/checkouts/${checkoutId}`);
  expect(data.status).toBe(expectedStatus);
}

/**
 * Verify checkout exists in list via API
 *
 * @example
 * await verifyCheckoutInList(page, CHECKOUT_001_ID);
 */
export async function verifyCheckoutInList(page: Page, checkoutId: string): Promise<boolean> {
  const data = await apiGet(page, '/api/checkouts');
  const checkouts = (data.items as Array<{ id: string }>) || [];

  return checkouts.some((checkout: { id: string }) => checkout.id === checkoutId);
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Navigate to checkout list page
 *
 * @example
 * await navigateToCheckoutList(page);
 */
export async function navigateToCheckoutList(page: Page): Promise<void> {
  await page.goto('/checkouts');
  await expect(page.getByRole('heading', { name: /반출/i })).toBeVisible();
}

/**
 * Navigate to checkout detail page
 *
 * @example
 * await navigateToCheckoutDetail(page, CHECKOUT_001_ID);
 */
export async function navigateToCheckoutDetail(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible();
}

/**
 * Navigate to checkout create page
 *
 * @example
 * await navigateToCheckoutCreate(page);
 */
export async function navigateToCheckoutCreate(page: Page): Promise<void> {
  await page.goto('/checkouts/create');
  await expect(page.getByRole('heading', { name: '장비 반출 신청', level: 1 })).toBeVisible();
}

// ============================================================================
// Search and Filter Helpers
// ============================================================================

/**
 * Search checkouts by equipment name
 *
 * @example
 * await searchCheckoutsByEquipment(page, 'Spectrum Analyzer');
 */
export async function searchCheckoutsByEquipment(page: Page, equipmentName: string): Promise<void> {
  await page.getByPlaceholder('장비명으로 검색').fill(equipmentName);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Search checkouts by requester name
 *
 * @example
 * await searchCheckoutsByRequester(page, '김철수');
 */
export async function searchCheckoutsByRequester(page: Page, requesterName: string): Promise<void> {
  await page.getByPlaceholder('신청자명으로 검색').fill(requesterName);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Filter checkouts by purpose
 *
 * @example
 * await filterCheckoutsByPurpose(page, 'calibration');
 */
export async function filterCheckoutsByPurpose(
  page: Page,
  purpose: CheckoutPurpose
): Promise<void> {
  const label = CHECKOUT_PURPOSE_LABELS[purpose];
  await page.getByLabel('목적 필터').selectOption(label);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Filter checkouts by status
 *
 * @example
 * await filterCheckoutsByStatus(page, 'pending');
 */
export async function filterCheckoutsByStatus(
  page: Page,
  status: (typeof CHECKOUT_STATUS_VALUES)[number]
): Promise<void> {
  const label = CHECKOUT_STATUS_LABELS[status as keyof typeof CHECKOUT_STATUS_LABELS];
  await page.getByLabel('상태 필터').selectOption(label);
  await page.waitForLoadState('domcontentloaded');
}

// ============================================================================
// Pagination Helpers
// ============================================================================

/**
 * Navigate to next page of checkouts
 *
 * @example
 * await goToNextPage(page);
 */
export async function goToNextPage(page: Page): Promise<void> {
  await page.getByRole('button', { name: '다음' }).click();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Navigate to previous page of checkouts
 *
 * @example
 * await goToPreviousPage(page);
 */
export async function goToPreviousPage(page: Page): Promise<void> {
  await page.getByRole('button', { name: '이전' }).click();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Navigate to specific page of checkouts
 *
 * @example
 * await goToPage(page, 3);
 */
export async function goToPage(page: Page, pageNumber: number): Promise<void> {
  await page.getByRole('button', { name: pageNumber.toString() }).click();
  await page.waitForLoadState('domcontentloaded');
}

// ============================================================================
// Wait Helpers
// ============================================================================

/**
 * Wait for checkout status badge to appear
 *
 * @example
 * await waitForStatusBadge(page, 'approved');
 */
export async function waitForStatusBadge(
  page: Page,
  status: (typeof CHECKOUT_STATUS_VALUES)[number]
): Promise<void> {
  const label = CHECKOUT_STATUS_LABELS[status as keyof typeof CHECKOUT_STATUS_LABELS];
  await page.getByRole('status', { name: label }).waitFor({ state: 'visible' });
}

/**
 * Wait for success message
 *
 * @example
 * await waitForSuccessMessage(page, '반출 승인되었습니다');
 */
export async function waitForSuccessMessage(page: Page, message: string): Promise<void> {
  await page.getByRole('status').getByText(message).waitFor({ state: 'visible' });
}

/**
 * Wait for error message
 *
 * @example
 * await waitForErrorMessage(page, '권한이 없습니다');
 */
export async function waitForErrorMessage(page: Page, message: string): Promise<void> {
  await page.getByRole('alert').getByText(message).waitFor({ state: 'visible' });
}

// ============================================================================
// Rental 4-Step API Helpers
// ============================================================================

/**
 * Submit a condition check via API (rental 4-step)
 *
 * @example
 * await apiSubmitConditionCheck(page, CHECKOUT_011_ID, 'lender_checkout', { version: 1, appearanceStatus: 'normal', operationStatus: 'normal' });
 */
export async function apiSubmitConditionCheck(
  page: Page,
  checkoutId: string,
  step: string,
  conditions: {
    version: number;
    appearanceStatus: string;
    operationStatus: string;
    accessoriesStatus?: string;
    notes?: string;
  },
  role: string = 'technical_manager'
): Promise<{ response: import('@playwright/test').APIResponse; data: Record<string, unknown> }> {
  return apiPost(
    page,
    `/api/checkouts/${checkoutId}/condition-check`,
    { step, ...conditions },
    role
  );
}

/**
 * Get condition checks for a checkout via API
 */
export async function apiGetConditionChecks(
  page: Page,
  checkoutId: string,
  role: string = 'technical_manager'
): Promise<Record<string, unknown>[]> {
  const data = await apiGet(page, `/api/checkouts/${checkoutId}/condition-checks`, role);
  return data as unknown as Record<string, unknown>[];
}

/**
 * Verify equipment status via API (typed)
 *
 * @example
 * await verifyEquipmentStatusViaApi(page, EQUIP.SPECTRUM_ANALYZER_SUW_E, 'checked_out');
 */
export async function verifyEquipmentStatusViaApi(
  page: Page,
  equipmentId: string,
  expectedStatus: string
): Promise<void> {
  const data = await apiGet(page, `/api/equipment/${equipmentId}`);
  expect(data.status).toBe(expectedStatus);
}

/**
 * Reset a checkout to a specific rental status via direct DB SQL
 */
export async function resetRentalCheckoutToState(
  checkoutId: string,
  targetStatus: string,
  approverId: string = '00000000-0000-0000-0000-000000000002'
): Promise<void> {
  const pool = getCheckoutPool();

  const baseFields: Record<string, unknown> = {
    status: targetStatus,
    approver_id: approverId,
    approved_at: "NOW() - INTERVAL '3 days'",
  };

  // Add dates based on progression
  const RENTAL_STATUSES = [
    CSVal.LENDER_CHECKED,
    CSVal.BORROWER_RECEIVED,
    CSVal.BORROWER_RETURNED,
    CSVal.LENDER_RECEIVED,
  ];
  if (RENTAL_STATUSES.includes(targetStatus as (typeof RENTAL_STATUSES)[number])) {
    baseFields.checkout_date = "NOW() - INTERVAL '2 days'";
  }
  if (targetStatus === CSVal.LENDER_RECEIVED) {
    baseFields.actual_return_date = 'NOW()';
  }

  // Use separate parameters ($4, $5) for CASE expressions to avoid
  // PostgreSQL "inconsistent types deduced for parameter $2" error.
  // $2 is inferred from the column type (SET status = $2),
  // while $4/$5 are used as text in comparisons.
  await pool.query(
    `UPDATE checkouts
     SET status = $2,
         version = ${INITIAL_VERSION},
         approver_id = $3,
         approved_at = NOW() - INTERVAL '3 days',
         checkout_date = CASE
           WHEN $4 IN ('${CSVal.LENDER_CHECKED}','${CSVal.BORROWER_RECEIVED}','${CSVal.BORROWER_RETURNED}','${CSVal.LENDER_RECEIVED}')
           THEN NOW() - INTERVAL '2 days'
           ELSE NULL
         END,
         actual_return_date = CASE
           WHEN $5 = '${CSVal.LENDER_RECEIVED}' THEN NOW()
           ELSE NULL
         END,
         updated_at = NOW()
     WHERE id = $1`,
    [checkoutId, targetStatus, approverId, targetStatus, targetStatus]
  );
}

/**
 * Reset a rental checkout to 'approved' status (convenience wrapper)
 *
 * @example
 * await resetRentalCheckoutToApproved(SUITE_10.STEP1_LENDER);
 */
export async function resetRentalCheckoutToApproved(
  checkoutId: string,
  approverId: string = '00000000-0000-0000-0000-000000000002'
): Promise<void> {
  await resetRentalCheckoutToState(checkoutId, CSVal.APPROVED, approverId);
}

/**
 * Reset a checkout to 'checked_out' status via ORM-based API calls.
 *
 * Unlike direct SQL resets, this uses the backend's service layer (approve → start),
 * ensuring the ORM cache is properly invalidated. This prevents "invalid status" errors
 * when the service reads stale checkout entities from cache.
 *
 * @example
 * await resetCheckoutToCheckedOutViaAPI(page, SUITE_06.CALIBRATION);
 */
export async function resetCheckoutToCheckedOutViaAPI(
  page: Page,
  checkoutId: string,
  role: 'technical_manager' | 'lab_manager' = 'technical_manager'
): Promise<void> {
  const token = await getBackendToken(page, role);

  // Step 1: Reset to pending (direct SQL - necessary to rollback state)
  await resetCheckoutToPending(checkoutId);
  await clearBackendCache();

  // Step 2: Approve (CAS: fetch version first, then approve)
  const pendingData = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { version: pendingVersion } = await pendingData.json();
  await page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { version: pendingVersion },
  });
  await clearBackendCache();

  // Step 3: Start checkout (CAS: fetch version after approve, then start)
  const approvedData = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { version: approvedVersion } = await approvedData.json();
  await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/start`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { version: approvedVersion },
  });
  await clearBackendCache();
}

/**
 * Reset a checkout to 'returned' status via ORM-based API calls.
 *
 * @example
 * await resetCheckoutToReturnedViaAPI(page, SUITE_07.CALIBRATION, 'calibration');
 */
export async function resetCheckoutToReturnedViaAPI(
  page: Page,
  checkoutId: string,
  purpose: 'calibration' | 'repair',
  role: 'technical_manager' | 'lab_manager' = 'technical_manager'
): Promise<void> {
  const token = await getBackendToken(page, role);

  // Step 1: Reset to checked_out (via ORM)
  await resetCheckoutToCheckedOutViaAPI(page, checkoutId, role);

  // Step 2: Return checkout (CAS: fetch version after checked_out reset, then return)
  const checkedOutData = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { version: checkedOutVersion } = await checkedOutData.json();

  const returnPayload =
    purpose === 'calibration'
      ? {
          version: checkedOutVersion,
          calibrationChecked: true,
          workingStatusChecked: true,
          inspectionNotes: 'E2E test reset',
        }
      : {
          version: checkedOutVersion,
          repairChecked: true,
          workingStatusChecked: true,
          inspectionNotes: 'E2E test reset',
        };

  await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/return`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: returnPayload,
  });
  await clearBackendCache();
}

/**
 * Full checkout cleanup - delete test-created checkouts and reset equipment
 *
 * Only affects checkouts with the test ID prefix '10000000-'
 * Deletes in order: condition_checks → checkout_items → checkouts
 * Then resets all test equipment to 'available' status
 */
export async function fullCheckoutCleanup(): Promise<void> {
  const pool = getCheckoutPool();

  // Step 1: Delete condition_checks (FK to checkouts)
  await pool.query(
    `DELETE FROM condition_checks WHERE checkout_id IN (SELECT id FROM checkouts WHERE id LIKE '10000000-%')`
  );

  // Step 2: Delete checkout_items (FK to checkouts)
  await pool.query(
    `DELETE FROM checkout_items WHERE checkout_id IN (SELECT id FROM checkouts WHERE id LIKE '10000000-%')`
  );

  // Step 3: Delete checkouts
  await pool.query(`DELETE FROM checkouts WHERE id LIKE '10000000-%'`);

  // Step 4: Reset all test equipment to available status
  await pool.query(`UPDATE equipment SET status = $1, updated_at = NOW() WHERE id LIKE 'eeee%'`, [
    ESVal.AVAILABLE,
  ]);
}

// ============================================================================
// Data Extraction Helpers
// ============================================================================

/**
 * Get checkout count from list
 *
 * @example
 * const count = await getCheckoutCount(page);
 */
export async function getCheckoutCount(page: Page): Promise<number> {
  const rows = await page.getByRole('row').count();
  return rows - 1; // Subtract header row
}

/**
 * Get equipment status from detail page
 *
 * @example
 * const status = await getEquipmentStatusFromDetailPage(page);
 */
export async function getEquipmentStatusFromDetailPage(page: Page): Promise<string> {
  const statusBadge = await page.getByTestId('equipment-status-badge').textContent();
  return statusBadge?.trim() || '';
}

/**
 * Get checkout status from detail page
 *
 * @example
 * const status = await getCheckoutStatusFromDetailPage(page);
 */
export async function getCheckoutStatusFromDetailPage(page: Page): Promise<string> {
  const statusBadge = await page.getByTestId('checkout-status-badge').textContent();
  return statusBadge?.trim() || '';
}
