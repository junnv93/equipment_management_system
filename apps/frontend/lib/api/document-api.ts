import { apiClient } from './api-client';
import { transformArrayResponse, transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { DocumentType, DocumentStatus } from '@equipment-management/schemas';

// ============================================================================
// Document 타입 (프론트엔드용)
// ============================================================================

export interface DocumentRecord {
  id: string;
  equipmentId?: string | null;
  calibrationId?: string | null;
  requestId?: string | null;
  documentType: DocumentType;
  status: DocumentStatus;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileHash?: string | null;
  revisionNumber: number;
  parentDocumentId?: string | null;
  isLatest: boolean;
  description?: string | null;
  uploadedBy?: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrityResult {
  valid: boolean;
  expectedHash: string | null;
  actualHash: string;
  /** 마이그레이션 레거시 문서 — 해시 미생성 상태 */
  hashMissing?: boolean;
}

// ============================================================================
// Document API
// ============================================================================

export const documentApi = {
  /**
   * 교정별 문서 업로드 (복수 파일)
   */
  uploadCalibrationDocuments: async (
    calibrationId: string,
    files: File[],
    documentTypes: DocumentType[],
    descriptions?: string[]
  ): Promise<{ documents: DocumentRecord[]; message: string }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('documentTypes', JSON.stringify(documentTypes));
    if (descriptions) {
      formData.append('descriptions', JSON.stringify(descriptions));
    }

    const response = await apiClient.post(
      API_ENDPOINTS.CALIBRATIONS.DOCUMENTS(calibrationId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return transformSingleResponse<{ documents: DocumentRecord[]; message: string }>(response);
  },

  /**
   * 교정별 문서 목록 조회
   */
  getCalibrationDocuments: async (
    calibrationId: string,
    type?: DocumentType
  ): Promise<DocumentRecord[]> => {
    const params = type ? { type } : {};
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.DOCUMENTS(calibrationId), {
      params,
    });
    return transformArrayResponse<DocumentRecord>(response);
  },

  /**
   * 장비별 문서 목록 조회
   */
  getEquipmentDocuments: async (
    equipmentId: string,
    options?: { type?: DocumentType; includeCalibrations?: boolean }
  ): Promise<DocumentRecord[]> => {
    const params: Record<string, string> = { equipmentId };
    if (options?.type) params.type = options.type;
    if (options?.includeCalibrations) params.includeCalibrations = 'true';
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.BASE, { params });
    return transformArrayResponse<DocumentRecord>(response);
  },

  /**
   * 문서 다운로드 (인증된 blob 다운로드)
   *
   * <a href> 패턴은 Authorization 헤더를 포함하지 않으므로,
   * apiClient로 blob을 받아 클라이언트에서 다운로드를 트리거합니다.
   */
  downloadDocument: async (documentId: string, fileName?: string): Promise<void> => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId), {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadName = fileName ?? `document-${documentId}`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * 문서 삭제
   */
  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.DOCUMENTS.DETAIL(documentId));
  },

  /**
   * 문서 무결성 검증
   */
  verifyIntegrity: async (documentId: string): Promise<IntegrityResult> => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.VERIFY(documentId));
    return transformSingleResponse<IntegrityResult>(response);
  },

  /**
   * 개정판 업로드
   */
  createRevision: async (
    documentId: string,
    file: File,
    description?: string
  ): Promise<DocumentRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post(API_ENDPOINTS.DOCUMENTS.REVISIONS(documentId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return transformSingleResponse<DocumentRecord>(response);
  },

  /**
   * 개정 이력 조회
   */
  getRevisionHistory: async (documentId: string): Promise<DocumentRecord[]> => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.REVISIONS(documentId));
    return transformArrayResponse<DocumentRecord>(response);
  },
};
