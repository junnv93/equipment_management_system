import { toast } from 'sonner';
import { apiClient } from '../api-client';
import { getErrorMessage } from '../error';

interface DownloadFileOptions {
  /** API endpoint URL */
  url: string;
  /** Query parameters */
  params?: Record<string, string>;
  /** Downloaded filename */
  filename: string;
  /** Custom error message (falls back to API error message) */
  errorMessage?: string;
}

/**
 * Blob 기반 파일 다운로드 유틸리티
 *
 * apiClient를 통해 파일을 요청하고, 브라우저 다운로드를 트리거합니다.
 * 실패 시 sonner toast로 에러 메시지를 표시합니다.
 *
 * @example
 * await downloadFile({
 *   url: API_ENDPOINTS.EQUIPMENT.HISTORY_CARD(equipmentId),
 *   filename: `이력카드_${equipmentId.slice(0, 8)}.docx`,
 * });
 */
export async function downloadFile(options: DownloadFileOptions): Promise<void> {
  try {
    const response = await apiClient.get(options.url, {
      params: options.params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', options.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    toast.error(options.errorMessage ?? getErrorMessage(error));
  }
}
