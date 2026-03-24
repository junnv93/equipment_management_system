/**
 * NC 종합 E2E 테스트 헬퍼
 *
 * 공용 헬퍼(shared/helpers)를 re-export하고, NC 도메인 전용 유틸리티를 제공한다.
 * Backend API 직접 호출, DB 직접 리셋 등 상태 변경 테스트의 데이터 격리를 보장.
 *
 * @see apps/frontend/tests/e2e/shared/helpers/api-helpers.ts - 공용 토큰/캐시
 * @see apps/frontend/tests/e2e/shared/constants/shared-test-data.ts - SSOT 상수
 */

import { Page, expect } from '@playwright/test';
import { Pool } from 'pg';
import {
  EquipmentStatusValues as ESVal,
  NonConformanceStatusValues as NCSVal,
} from '@equipment-management/schemas';
import {
  BASE_URLS,
  TEST_USER_IDS,
  TEST_EQUIPMENT_IDS,
  TEST_NC_IDS,
} from '../../../../shared/constants/shared-test-data';

// ============================================================================
// Re-export: 공용 헬퍼 (중복 구현 방지)
// ============================================================================

export {
  getBackendToken,
  clearBackendCache,
  clearTokenCache,
} from '../../../../shared/helpers/api-helpers';

// ============================================================================
// Re-export: SSOT 상수
// ============================================================================

export const BACKEND_URL = BASE_URLS.BACKEND;
export const EQUIP_IDS = TEST_EQUIPMENT_IDS;
export const USER_IDS = TEST_USER_IDS;

/** NC 시드 데이터 ID (SSOT: shared-test-data.ts) */
export const NC_IDS = {
  NC_001_MALFUNCTION_OPEN: TEST_NC_IDS.NC_001_MALFUNCTION_OPEN,
  NC_002_ANALYZING: TEST_NC_IDS.NC_002_ANALYZING_NO_REPAIR,
  NC_003_DAMAGE_OPEN: TEST_NC_IDS.NC_003_DAMAGE_ANALYZING,
  NC_004_CLOSED: TEST_NC_IDS.NC_004_CLOSED,
  NC_005_CLOSED: TEST_NC_IDS.NC_005_CLOSED,
  NC_006_CORRECTED: TEST_NC_IDS.NC_006_WITH_REPAIR,
  NC_007_CORRECTED: TEST_NC_IDS.NC_007_DAMAGE_CORRECTED,
  NC_008_CORRECTED: TEST_NC_IDS.NC_008_CORRECTED,
  NC_009_CORRECTED: TEST_NC_IDS.NC_009_CORRECTED_UIW,
  NC_010_CLOSED: TEST_NC_IDS.NC_010_CLOSED_UIW,
} as const;

// ============================================================================
// NC 도메인 API Helpers
// ============================================================================

/**
 * NC 상세 조회 (API)
 */
export async function getNcDetail(page: Page, ncId: string, token: string) {
  const response = await page.request.get(`${BACKEND_URL}/api/non-conformances/${ncId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * NC 생성 (API)
 */
export async function createNcViaApi(
  page: Page,
  token: string,
  data: {
    equipmentId: string;
    ncType: string;
    cause: string;
    discoveredBy: string;
    actionPlan?: string;
  }
) {
  const response = await page.request.post(`${BACKEND_URL}/api/non-conformances`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      equipmentId: data.equipmentId,
      discoveryDate: new Date().toISOString().split('T')[0],
      discoveredBy: data.discoveredBy,
      cause: data.cause,
      ncType: data.ncType,
      actionPlan: data.actionPlan,
    },
  });
  return response;
}

/**
 * NC 업데이트 (조치 완료 포함)
 */
export async function updateNcViaApi(
  page: Page,
  token: string,
  ncId: string,
  data: Record<string, unknown>
) {
  const response = await page.request.patch(`${BACKEND_URL}/api/non-conformances/${ncId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return response;
}

/**
 * NC 종결 (API)
 */
export async function closeNcViaApi(
  page: Page,
  token: string,
  ncId: string,
  version: number,
  closureNotes?: string
) {
  const response = await page.request.patch(`${BACKEND_URL}/api/non-conformances/${ncId}/close`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { version, closureNotes },
  });
  return response;
}

/**
 * NC 반려 (API)
 */
export async function rejectNcViaApi(
  page: Page,
  token: string,
  ncId: string,
  version: number,
  rejectionReason: string
) {
  const response = await page.request.patch(
    `${BACKEND_URL}/api/non-conformances/${ncId}/reject-correction`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { version, rejectionReason },
    }
  );
  return response;
}

/**
 * NC 목록 조회 (API)
 */
export async function listNcsViaApi(page: Page, token: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query);
  const response = await page.request.get(
    `${BACKEND_URL}/api/non-conformances?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response;
}

// ============================================================================
// DB Direct Reset (테스트 격리)
// ============================================================================

const DATABASE_URL = BASE_URLS.DATABASE;

let ncPool: Pool | null = null;

function getNcPool(): Pool {
  if (!ncPool) {
    ncPool = new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return ncPool;
}

/**
 * NC를 특정 상태로 리셋 (시드 데이터 초기 상태 복원)
 */
export async function resetNcToStatus(
  ncId: string,
  status: string,
  version: number = 1
): Promise<void> {
  const pool = getNcPool();
  await pool.query(
    `UPDATE non_conformances
     SET status = $2,
         version = $3,
         rejected_by = NULL,
         rejected_at = NULL,
         rejection_reason = NULL,
         closed_by = NULL,
         closed_at = NULL,
         closure_notes = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [ncId, status, version]
  );
}

/**
 * 장비 상태를 특정 값으로 리셋 (enum 상수 사용)
 */
export async function resetEquipmentStatus(
  equipmentId: string,
  status: (typeof ESVal)[keyof typeof ESVal]
): Promise<void> {
  const pool = getNcPool();
  await pool.query(`UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1`, [
    equipmentId,
    status,
  ]);
}

/**
 * 동적 생성된 NC 삭제 (시드 NC 'aaaa%' 패턴은 보존)
 */
export async function cleanupDynamicNcs(equipmentId: string): Promise<void> {
  const pool = getNcPool();
  await pool.query(
    `DELETE FROM non_conformances
     WHERE equipment_id = $1
       AND id::text NOT LIKE 'aaaa%'`,
    [equipmentId]
  );
}

/**
 * Pool 정리
 */
export async function cleanupNcPool(): Promise<void> {
  if (ncPool) {
    try {
      await ncPool.end();
    } catch {
      // ignore
    } finally {
      ncPool = null;
    }
  }
}

// ============================================================================
// UI Helpers
// ============================================================================

/**
 * NC 목록 페이지로 이동 + 로딩 대기
 */
export async function gotoNcList(page: Page, queryParams?: string): Promise<void> {
  const url = queryParams ? `/non-conformances?${queryParams}` : '/non-conformances';
  await page.goto(url);
  await expect(page.getByRole('heading', { name: '부적합 관리' })).toBeVisible({ timeout: 15000 });
}

/**
 * NC 상세 페이지로 이동 + 로딩 대기
 */
export async function gotoNcDetail(page: Page, ncId: string): Promise<void> {
  await page.goto(`/non-conformances/${ncId}`);
  await expect(page.getByRole('heading', { name: '부적합 상세' })).toBeVisible({ timeout: 15000 });
}
