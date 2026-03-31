/**
 * 데이터 마이그레이션 API 클라이언트
 *
 * Excel(.xlsx) 파일을 업로드하여 장비 데이터를 DB에 일괄 등록합니다.
 * Preview(dry-run) → Execute(commit) 2단계 워크플로우.
 *
 * API 계약 타입은 @equipment-management/schemas (SSOT) 에서 import.
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type {
  MigrationPreviewResult,
  MigrationExecuteResult,
  Site,
} from '@equipment-management/schemas';

// ── API 계약 타입 re-export (이 모듈 소비자들이 단일 진입점에서 import 가능) ─
export type {
  MigrationRowStatus,
  RowFieldError,
  MigrationRowPreview,
  MigrationPreviewResult,
  MigrationExecuteResult,
} from '@equipment-management/schemas';

// ── 프론트엔드 전용 옵션 타입 ─────────────────────────────────────────────

export interface PreviewOptions {
  autoGenerateManagementNumber?: boolean;
  defaultSite?: Site;
  skipDuplicates?: boolean;
}

export interface ExecuteOptions extends PreviewOptions {
  sessionId: string;
  selectedRows?: number[];
}

// ── API 함수 ──────────────────────────────────────────────────────────────────

export const dataMigrationApi = {
  /**
   * Preview (Dry-run)
   * xlsx 파일 업로드 → 행별 검증 결과 반환
   */
  previewEquipmentMigration: async (
    file: File,
    options: PreviewOptions = {}
  ): Promise<MigrationPreviewResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.autoGenerateManagementNumber !== undefined) {
      formData.append('autoGenerateManagementNumber', String(options.autoGenerateManagementNumber));
    }
    if (options.defaultSite) {
      formData.append('defaultSite', options.defaultSite);
    }
    if (options.skipDuplicates !== undefined) {
      formData.append('skipDuplicates', String(options.skipDuplicates));
    }

    const response = await apiClient.post<MigrationPreviewResult>(
      API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.PREVIEW,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  /**
   * Execute (Commit)
   * sessionId로 캐시된 Preview 결과를 DB에 INSERT
   */
  executeEquipmentMigration: async (options: ExecuteOptions): Promise<MigrationExecuteResult> => {
    const response = await apiClient.post<MigrationExecuteResult>(
      API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.EXECUTE,
      {
        sessionId: options.sessionId,
        autoGenerateManagementNumber: options.autoGenerateManagementNumber ?? false,
        defaultSite: options.defaultSite,
        skipDuplicates: options.skipDuplicates ?? true,
        selectedRows: options.selectedRows,
      }
    );
    return response.data;
  },

  /**
   * 에러 리포트 xlsx 다운로드
   */
  downloadErrorReport: async (sessionId: string): Promise<void> => {
    const response = await apiClient.get(
      API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.ERROR_REPORT(sessionId),
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `migration-errors-${dateStr}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * 입력 템플릿 xlsx 다운로드
   */
  downloadTemplate: async (): Promise<void> => {
    const response = await apiClient.get(API_ENDPOINTS.DATA_MIGRATION.EQUIPMENT.TEMPLATE, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'equipment-migration-template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
