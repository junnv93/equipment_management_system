import { apiClient } from './api-client';
import { API_ENDPOINTS, type FormCategory } from '@equipment-management/shared-constants';
import { transformSingleResponse } from './utils/response-transformers';

/**
 * 양식 템플릿 API 클라이언트.
 *
 * 식별자 모델: formName(안정) + formNumber(가변). 메타데이터는 formName 기준.
 * 엔드포인트 설계: 최초 등록과 개정 등록은 동일한 `POST /form-templates`를 사용합니다.
 * 백엔드 서비스가 기존 현행 row 존재 여부로 자동 분기합니다.
 */

export interface FormTemplateCurrentSummary {
  id: string;
  formNumber: string;
  originalFilename: string;
  uploadedAt: string;
  uploadedBy: string | null;
}

export interface FormTemplateListItem {
  formName: string;
  retentionLabel: string;
  implemented: boolean;
  category: FormCategory;
  initialFormNumber: string;
  current: FormTemplateCurrentSummary | null;
}

export interface FormTemplateRevisionItem {
  id: string;
  formTemplateId: string;
  previousFormNumber: string | null;
  newFormNumber: string;
  changeSummary: string;
  revisedBy: string | null;
  revisedAt: string;
  version: number;
}

export interface FormTemplateHistoryItem {
  id: string;
  formNumber: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  isCurrent: boolean;
  uploadedBy: string | null;
  uploadedAt: string;
  supersededAt: string | null;
  /** 보존연한 만료 아카이브 시점 (UL-QP-03 §11). null이면 활성. */
  archivedAt: string | null;
}

export interface FormTemplateSearchResult {
  match: FormTemplateHistoryItem | null;
  currentForSameForm: FormTemplateHistoryItem | null;
}

// ── 조회 ──────────────────────────────────────────────────────────────────

export async function listFormTemplates(): Promise<FormTemplateListItem[]> {
  const response = await apiClient.get<FormTemplateListItem[]>(API_ENDPOINTS.FORM_TEMPLATES.LIST);
  return response.data;
}

/**
 * 보존연한 만료로 소프트 아카이브된 양식 row 목록 (UL-QP-03 §11).
 * archivedAt 내림차순. 파일은 보존되지만 활성 목록에서 제외됨.
 */
export async function listArchivedFormTemplates(): Promise<FormTemplateHistoryItem[]> {
  const response = await apiClient.get<FormTemplateHistoryItem[]>(
    API_ENDPOINTS.FORM_TEMPLATES.ARCHIVED
  );
  return response.data;
}

export async function listFormTemplateHistoryByName(
  formName: string
): Promise<FormTemplateHistoryItem[]> {
  const response = await apiClient.get<FormTemplateHistoryItem[]>(
    API_ENDPOINTS.FORM_TEMPLATES.HISTORY_BY_NAME,
    { params: { formName } }
  );
  return response.data;
}

export async function listFormTemplateRevisionsByName(
  formName: string
): Promise<FormTemplateRevisionItem[]> {
  const response = await apiClient.get<FormTemplateRevisionItem[]>(
    API_ENDPOINTS.FORM_TEMPLATES.REVISIONS_BY_NAME,
    { params: { formName } }
  );
  return response.data;
}

export async function searchFormTemplateByNumber(
  formNumber: string
): Promise<FormTemplateSearchResult> {
  const response = await apiClient.get<FormTemplateSearchResult>(
    API_ENDPOINTS.FORM_TEMPLATES.SEARCH_BY_NUMBER,
    { params: { formNumber } }
  );
  return response.data;
}

// ── 다운로드 ──────────────────────────────────────────────────────────────

/** row ID 기반 다운로드. 파일명/MIME 타입은 서버 응답 헤더가 SSOT */
export async function downloadFormTemplateById(id: string): Promise<void> {
  const { downloadFile } = await import('./utils/download-file');
  await downloadFile({
    url: API_ENDPOINTS.FORM_TEMPLATES.DOWNLOAD_BY_ID(id),
    // filename은 생략 — 서버 Content-Disposition 헤더를 SSOT로 사용
  });
}

// ── 변경 ──────────────────────────────────────────────────────────────────

/**
 * 양식 템플릿 버전 생성.
 * - 현행 row 없음 → 최초 등록
 * - 현행 row 있음 → 개정 등록 (자동으로 이전 row supersede)
 *
 * 호출자는 "최초인지 개정인지"를 구분할 필요 없음. 계약 단순화.
 */
export async function createFormTemplateVersion(params: {
  formName: string;
  formNumber: string;
  changeSummary: string;
  file: File;
}): Promise<FormTemplateHistoryItem> {
  const formData = new FormData();
  formData.append('formName', params.formName);
  formData.append('formNumber', params.formNumber);
  formData.append('changeSummary', params.changeSummary);
  formData.append('file', params.file);
  const response = await apiClient.post(API_ENDPOINTS.FORM_TEMPLATES.CREATE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return transformSingleResponse(response);
}

/** 파일 교체: 동일 formNumber 내 파일만 교체. 이력 보존 없음 */
export async function replaceFormTemplateFile(params: {
  formName: string;
  file: File;
}): Promise<FormTemplateHistoryItem> {
  const formData = new FormData();
  formData.append('formName', params.formName);
  formData.append('file', params.file);
  const response = await apiClient.post(API_ENDPOINTS.FORM_TEMPLATES.REPLACE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return transformSingleResponse(response);
}
