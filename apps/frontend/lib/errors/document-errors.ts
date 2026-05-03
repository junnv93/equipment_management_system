/**
 * Document/file download 에러 매핑 SSOT.
 *
 * Backend ErrorCode를 다운로드 토스트용 구체 메시지로 라우팅한다.
 */
import { ErrorCode } from '@equipment-management/schemas';
import { ApiError, EquipmentErrorCode, ERROR_MESSAGES } from './equipment-errors';
import type { DownloadErrorToast } from './download-error-utils';

export function mapDocumentFileBackendCode(code: string | undefined): EquipmentErrorCode | null {
  if (!code) return null;

  switch (code.toUpperCase()) {
    case ErrorCode.DocumentNotFound:
    case EquipmentErrorCode.DOCUMENT_NOT_FOUND:
      return EquipmentErrorCode.DOCUMENT_NOT_FOUND;
    case ErrorCode.FileNotFound:
    case EquipmentErrorCode.FILE_NOT_FOUND:
      return EquipmentErrorCode.FILE_NOT_FOUND;
    default:
      return null;
  }
}

export function mapDocumentFileErrorToToast(
  error: unknown,
  fallbackDescription: string
): DownloadErrorToast {
  const code = error instanceof ApiError ? error.code : extractBackendCode(error);
  const mappedCode = mapDocumentFileBackendCode(code);
  if (!mappedCode) return { description: fallbackDescription };

  const info = ERROR_MESSAGES[mappedCode];
  const serverMessage = error instanceof Error ? error.message?.trim() : '';

  return {
    title: info.title,
    description: serverMessage && serverMessage.length > 0 ? serverMessage : info.message,
  };
}

function extractBackendCode(error: unknown): string | undefined {
  if (error === null || typeof error !== 'object') return undefined;

  const obj = error as Record<string, unknown>;
  if (typeof obj.code === 'string') return obj.code;

  const response = obj.response as Record<string, unknown> | undefined;
  const data = response?.data as Record<string, unknown> | undefined;
  return typeof data?.code === 'string' ? data.code : undefined;
}
