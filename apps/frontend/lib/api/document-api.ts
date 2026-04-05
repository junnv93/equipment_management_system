import { apiClient } from './api-client';
import { transformArrayResponse, transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { DocumentType, DocumentJson } from '@equipment-management/schemas';

// ============================================================================
// Document 타입 — SSOT: @equipment-management/schemas
// ============================================================================

export type DocumentRecord = DocumentJson;

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
   * 범용 문서 업로드 (장비/교정/요청)
   */
  uploadDocument: async (
    file: File,
    documentType: DocumentType,
    options?: {
      equipmentId?: string;
      calibrationId?: string;
      requestId?: string;
      softwareValidationId?: string;
      description?: string;
    }
  ): Promise<DocumentRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (options?.equipmentId) formData.append('equipmentId', options.equipmentId);
    if (options?.calibrationId) formData.append('calibrationId', options.calibrationId);
    if (options?.requestId) formData.append('requestId', options.requestId);
    if (options?.softwareValidationId)
      formData.append('softwareValidationId', options.softwareValidationId);
    if (options?.description) formData.append('description', options.description);

    const response = await apiClient.post(API_ENDPOINTS.DOCUMENTS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return transformSingleResponse<{ document: DocumentRecord }>(response).document;
  },

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
   * 문서 다운로드 (S3 presigned URL / Local proxy 이중 경로)
   *
   * - S3: 백엔드가 JSON { presignedUrl, fileName }을 반환 → <a> 태그로 직접 다운로드 (Auth 헤더 없음)
   * - Local: 백엔드가 binary stream 반환 → Blob URL로 다운로드 트리거
   */
  downloadDocument: async (documentId: string, fileName?: string): Promise<void> => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId), {
      responseType: 'arraybuffer',
    });

    const contentType = (response.headers['content-type'] as string) ?? '';

    // S3: presigned URL JSON 응답
    if (contentType.includes('application/json')) {
      const text = new TextDecoder().decode(response.data as ArrayBuffer);
      const { presignedUrl, fileName: serverFileName } = JSON.parse(text);
      const link = document.createElement('a');
      link.href = presignedUrl;
      link.setAttribute('download', serverFileName ?? fileName ?? '');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    // Local: binary stream
    const blob = new Blob([response.data as ArrayBuffer], { type: contentType });
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
   * 문서 미리보기 URL 반환 (인라인 표시용)
   *
   * - S3: 백엔드가 JSON { presignedUrl } 반환 → presignedUrl을 직접 src로 사용
   * - Local: 백엔드가 binary stream 반환 → Blob URL 생성 (isBlob: true)
   *
   * 호출자는 isBlob === true 일 때 언마운트 시 window.URL.revokeObjectURL()로 해제해야 합니다.
   */
  getPreviewUrl: async (documentId: string): Promise<{ url: string; isBlob: boolean }> => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId), {
      responseType: 'arraybuffer',
    });

    const contentType = (response.headers['content-type'] as string) ?? '';

    if (contentType.includes('application/json')) {
      const text = new TextDecoder().decode(response.data as ArrayBuffer);
      const { presignedUrl } = JSON.parse(text);
      return { url: presignedUrl as string, isBlob: false };
    }

    const blob = new Blob([response.data as ArrayBuffer], { type: contentType });
    return { url: window.URL.createObjectURL(blob), isBlob: true };
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
   * 유효성확인별 문서 목록 조회
   */
  getValidationDocuments: async (
    softwareValidationId: string,
    type?: DocumentType
  ): Promise<DocumentRecord[]> => {
    const params: Record<string, string> = { softwareValidationId };
    if (type) params.type = type;
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.BASE, { params });
    return transformArrayResponse<DocumentRecord>(response);
  },

  /**
   * 개정 이력 조회
   */
  getRevisionHistory: async (documentId: string): Promise<DocumentRecord[]> => {
    const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.REVISIONS(documentId));
    return transformArrayResponse<DocumentRecord>(response);
  },
};
