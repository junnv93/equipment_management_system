import { toast } from 'sonner';
import { apiClient } from '../api-client';
import { getErrorMessage } from '../error';

interface DownloadFileOptions {
  /** API endpoint URL */
  url: string;
  /** Query parameters */
  params?: Record<string, string>;
  /**
   * Fallback 파일명. 서버가 `Content-Disposition` 헤더로 파일명을 내려주면
   * 그 값이 우선합니다. SSOT는 서버 — 클라이언트는 헤더가 없을 때만 이 값을 사용.
   */
  filename?: string;
  /** Custom error message (falls back to API error message) */
  errorMessage?: string;
}

/**
 * RFC 5987 / RFC 6266 호환 Content-Disposition 파서.
 * `filename*=UTF-8''...` (인코딩 파일명) 우선, 없으면 `filename="..."`.
 */
function parseFilenameFromContentDisposition(header: string | undefined): string | null {
  if (!header) return null;
  const encodedMatch = /filename\*\s*=\s*([^']*)''([^;]+)/i.exec(header);
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[2].trim().replace(/^"|"$/g, ''));
    } catch {
      // fall through
    }
  }
  const plainMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return plainMatch ? plainMatch[1].trim() : null;
}

/**
 * Blob 기반 파일 다운로드 유틸리티
 *
 * 서버가 내려주는 `Content-Type`/`Content-Disposition`을 SSOT로 사용합니다.
 * 호출자는 filename을 옵션으로만 제공하며, 헤더가 없을 때만 fallback으로 적용됩니다.
 */
export async function downloadFile(options: DownloadFileOptions): Promise<void> {
  try {
    const response = await apiClient.get(options.url, {
      params: options.params,
      responseType: 'blob',
    });

    const contentType =
      (response.headers?.['content-type'] as string | undefined) ?? 'application/octet-stream';
    const serverFilename = parseFilenameFromContentDisposition(
      response.headers?.['content-disposition'] as string | undefined
    );
    const filename = serverFilename ?? options.filename ?? 'download';

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    toast.error(options.errorMessage ?? getErrorMessage(error));
  }
}
