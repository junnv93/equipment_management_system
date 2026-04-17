/**
 * ============================================================================
 * Equipment API - Server Component 버전
 * ============================================================================
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 이 파일은 Next.js Server Components에서만 사용됩니다.
 * - getServerSession()을 통한 인증
 * - async/await 직접 사용 가능
 * - React Query 불필요
 * - React.cache()로 동일 요청 내 중복 fetch 방지
 *
 * 사용 예시:
 *   // app/equipment/[id]/page.tsx
 *   import * as equipmentApi from '@/lib/api/equipment-api-server';
 *
 *   export default async function Page(props: PageProps) {
 *     const { id } = await props.params;
 *     const equipment = await equipmentApi.getEquipment(id);
 *     return <EquipmentDetailClient equipment={equipment} />;
 *   }
 *
 * Client Component에서는 기존 equipment-api.ts를 사용하세요.
 * ============================================================================
 */

import { cache } from 'react';
import { createServerApiClient } from './server-api-client';
import { createEquipmentApiMethods, type EquipmentApiMethods } from './shared/equipment-api.shared';

// Re-export types for convenience
export type {
  Equipment,
  EquipmentQuery,
  CreateEquipmentDto,
  UpdateEquipmentDto,
  EquipmentMutationResponse,
  LocationHistoryItem,
  MaintenanceHistoryItem,
  IncidentHistoryItem,
  CreateLocationHistoryInput,
  CreateMaintenanceHistoryInput,
  CreateIncidentHistoryInput,
} from './equipment-api';

/**
 * Server Component용 Equipment API 메서드들
 *
 * 각 함수 호출 시 새로운 apiClient를 생성하여 세션을 가져옵니다.
 * 이는 Server Component에서 매 요청마다 새로운 세션을 사용해야 하기 때문입니다.
 *
 * ✅ React.cache() 적용: 읽기 전용 함수들에 cache를 적용하여
 * generateMetadata와 Page에서 동일 데이터 중복 fetch 방지
 */

// Helper: API 메서드를 async wrapper로 감싸기
async function getApi(): Promise<EquipmentApiMethods> {
  const apiClient = await createServerApiClient();
  return createEquipmentApiMethods(apiClient);
}

// ========== Cached Internal Functions ==========
// 동일 요청 내에서 여러 번 호출되는 함수들에 cache 적용

const getEquipmentCached = cache(async (id: string | number) => {
  const api = await getApi();
  return api.getEquipment(id);
});

const getEquipmentByManagementNumberCached = cache(async (managementNumber: string) => {
  const api = await getApi();
  return api.getEquipmentByManagementNumber(managementNumber);
});

const getEquipmentListCached = cache(
  async (query: Parameters<EquipmentApiMethods['getEquipmentList']>[0]) => {
    const api = await getApi();
    return api.getEquipmentList(query);
  }
);

const getPendingRequestsCached = cache(async () => {
  const api = await getApi();
  return api.getPendingRequests();
});

// ========== 기본 CRUD ==========

/**
 * 장비 목록 조회 (React.cache 적용)
 * 동일 쿼리 파라미터로 요청 시 캐시된 결과 반환
 */
export async function getEquipmentList(
  ...args: Parameters<EquipmentApiMethods['getEquipmentList']>
) {
  return getEquipmentListCached(args[0]);
}

/**
 * 장비 상세 조회 (React.cache 적용)
 * generateMetadata와 Page에서 동일 ID로 호출 시 한 번만 fetch
 */
export async function getEquipment(...args: Parameters<EquipmentApiMethods['getEquipment']>) {
  return getEquipmentCached(args[0]);
}

/**
 * 관리번호 기반 장비 조회 (Server Component용, React.cache 적용).
 * QR 모바일 랜딩(`/e/:mgmt`)의 Page와 generateMetadata가 같은 요청에서
 * 호출될 때 한 번만 실제 fetch가 나간다.
 */
export async function getEquipmentByManagementNumber(
  ...args: Parameters<EquipmentApiMethods['getEquipmentByManagementNumber']>
) {
  return getEquipmentByManagementNumberCached(args[0]);
}

export async function createEquipment(...args: Parameters<EquipmentApiMethods['createEquipment']>) {
  const api = await getApi();
  return api.createEquipment(...args);
}

export async function updateEquipment(...args: Parameters<EquipmentApiMethods['updateEquipment']>) {
  const api = await getApi();
  return api.updateEquipment(...args);
}

export async function deleteEquipment(...args: Parameters<EquipmentApiMethods['deleteEquipment']>) {
  const api = await getApi();
  return api.deleteEquipment(...args);
}

export async function updateEquipmentStatus(
  ...args: Parameters<EquipmentApiMethods['updateEquipmentStatus']>
) {
  const api = await getApi();
  return api.updateEquipmentStatus(...args);
}

// ========== 특수 조회 ==========

export async function getCalibrationDueEquipment(
  ...args: Parameters<EquipmentApiMethods['getCalibrationDueEquipment']>
) {
  const api = await getApi();
  return api.getCalibrationDueEquipment(...args);
}

export async function getTeamEquipment(
  ...args: Parameters<EquipmentApiMethods['getTeamEquipment']>
) {
  const api = await getApi();
  return api.getTeamEquipment(...args);
}

// ========== 승인 프로세스 ==========

/**
 * 승인 대기 요청 목록 (React.cache 적용)
 */
export async function getPendingRequests() {
  return getPendingRequestsCached();
}

export async function getRequestByUuid(
  ...args: Parameters<EquipmentApiMethods['getRequestByUuid']>
) {
  const api = await getApi();
  return api.getRequestByUuid(...args);
}

export async function approveRequest(...args: Parameters<EquipmentApiMethods['approveRequest']>) {
  const api = await getApi();
  return api.approveRequest(...args);
}

export async function rejectRequest(...args: Parameters<EquipmentApiMethods['rejectRequest']>) {
  const api = await getApi();
  return api.rejectRequest(...args);
}

// ========== 이력 관리 ==========

export async function getLocationHistory(
  ...args: Parameters<EquipmentApiMethods['getLocationHistory']>
) {
  const api = await getApi();
  return api.getLocationHistory(...args);
}

export async function createLocationHistory(
  ...args: Parameters<EquipmentApiMethods['createLocationHistory']>
) {
  const api = await getApi();
  return api.createLocationHistory(...args);
}

export async function deleteLocationHistory(
  ...args: Parameters<EquipmentApiMethods['deleteLocationHistory']>
) {
  const api = await getApi();
  return api.deleteLocationHistory(...args);
}

export async function getMaintenanceHistory(
  ...args: Parameters<EquipmentApiMethods['getMaintenanceHistory']>
) {
  const api = await getApi();
  return api.getMaintenanceHistory(...args);
}

export async function createMaintenanceHistory(
  ...args: Parameters<EquipmentApiMethods['createMaintenanceHistory']>
) {
  const api = await getApi();
  return api.createMaintenanceHistory(...args);
}

export async function deleteMaintenanceHistory(
  ...args: Parameters<EquipmentApiMethods['deleteMaintenanceHistory']>
) {
  const api = await getApi();
  return api.deleteMaintenanceHistory(...args);
}

export async function getIncidentHistory(
  ...args: Parameters<EquipmentApiMethods['getIncidentHistory']>
) {
  const api = await getApi();
  return api.getIncidentHistory(...args);
}

export async function createIncidentHistory(
  ...args: Parameters<EquipmentApiMethods['createIncidentHistory']>
) {
  const api = await getApi();
  return api.createIncidentHistory(...args);
}

export async function deleteIncidentHistory(
  ...args: Parameters<EquipmentApiMethods['deleteIncidentHistory']>
) {
  const api = await getApi();
  return api.deleteIncidentHistory(...args);
}
