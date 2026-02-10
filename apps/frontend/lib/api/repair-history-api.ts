import { apiClient } from './api-client';

// 수리 결과 타입
export type RepairResult = 'completed' | 'partial' | 'failed';

// 수리 이력 인터페이스
export interface RepairHistory {
  uuid: string;
  equipmentId: number;
  repairDate: string;
  repairDescription: string;
  repairResult?: RepairResult;
  notes?: string;
  attachmentPath?: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 수리 이력 생성 DTO
export interface CreateRepairHistoryDto {
  repairDate: string;
  repairDescription: string;
  repairResult?: RepairResult;
  notes?: string;
  attachmentPath?: string;
  nonConformanceId?: string;
}

// 수리 이력 수정 DTO
export interface UpdateRepairHistoryDto extends Partial<CreateRepairHistoryDto> {}

// 수리 이력 조회 쿼리
export interface RepairHistoryQuery {
  fromDate?: string;
  toDate?: string;
  repairResult?: RepairResult;
  repairCompany?: string;
  includeDeleted?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

// 페이지네이션 응답
export interface RepairHistoryListResponse {
  items: RepairHistory[];
  meta: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

/**
 * 장비별 수리 이력 목록 조회
 */
export async function getRepairHistoryByEquipment(
  equipmentUuid: string,
  query?: RepairHistoryQuery
): Promise<RepairHistoryListResponse> {
  const params = new URLSearchParams();
  if (query?.fromDate) params.append('fromDate', query.fromDate);
  if (query?.toDate) params.append('toDate', query.toDate);
  if (query?.repairResult) params.append('repairResult', query.repairResult);
  if (query?.repairCompany) params.append('repairCompany', query.repairCompany);
  if (query?.includeDeleted !== undefined)
    params.append('includeDeleted', String(query.includeDeleted));
  if (query?.sort) params.append('sort', query.sort);
  if (query?.page) params.append('page', String(query.page));
  if (query?.pageSize) params.append('pageSize', String(query.pageSize));

  const queryString = params.toString();
  const url = `/api/equipment/${equipmentUuid}/repair-history${queryString ? `?${queryString}` : ''}`;
  const response = await apiClient.get<RepairHistoryListResponse>(url);
  return response.data;
}

/**
 * 수리 이력 상세 조회
 */
export async function getRepairHistory(uuid: string): Promise<RepairHistory> {
  const response = await apiClient.get<RepairHistory>(`/api/repair-history/${uuid}`);
  return response.data;
}

/**
 * 수리 이력 생성
 */
export async function createRepairHistory(
  equipmentUuid: string,
  dto: CreateRepairHistoryDto
): Promise<RepairHistory> {
  const response = await apiClient.post<RepairHistory>(
    `/api/equipment/${equipmentUuid}/repair-history`,
    dto
  );
  return response.data;
}

/**
 * 수리 이력 수정
 */
export async function updateRepairHistory(
  uuid: string,
  dto: UpdateRepairHistoryDto
): Promise<RepairHistory> {
  const response = await apiClient.patch<RepairHistory>(`/api/repair-history/${uuid}`, dto);
  return response.data;
}

/**
 * 수리 이력 삭제
 */
export async function deleteRepairHistory(
  uuid: string
): Promise<{ deleted: boolean; uuid: string }> {
  const response = await apiClient.delete<{ deleted: boolean; uuid: string }>(
    `/api/repair-history/${uuid}`
  );
  return response.data;
}

/**
 * 최근 수리 이력 조회
 */
export async function getRecentRepairs(
  equipmentUuid: string,
  limit: number = 5
): Promise<RepairHistory[]> {
  const response = await apiClient.get<RepairHistory[]>(
    `/equipment/${equipmentUuid}/repair-history/recent?limit=${limit}`
  );
  return response.data;
}
