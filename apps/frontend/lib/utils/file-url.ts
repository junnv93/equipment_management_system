import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { apiClient } from '@/lib/api/api-client';

/**
 * 스토리지 키 → 파일 접근 URL 변환
 *
 * 왜 <img src="/api/files/..."> 직접 사용이 불가능한가:
 *   Next.js rewrite는 /api/:path → http://backend/:path 로 변환하여 /api 를 제거합니다.
 *   백엔드는 setGlobalPrefix('api') 로 /api/files/... 에 라우트를 등록하므로
 *   브라우저 요청이 /files/... 에 도달해 404가 발생합니다.
 *   (DocumentImage 컴포넌트가 blob URL 방식을 쓰는 이유와 동일)
 *
 * 대신 apiClient(baseURL=http://localhost:3001)로 /api/files/... 를 직접 호출하면
 * 백엔드에 정확히 도달합니다.
 *
 * @returns
 *   isBlob=true  → blobUrl (언마운트 시 window.URL.revokeObjectURL 필요)
 *   isBlob=false → presignedUrl (S3 직접 URL, revoke 불필요)
 */
export async function fetchStorageFileUrl(
  storageKey: string
): Promise<{ url: string; isBlob: boolean }> {
  const response = await apiClient.get(`${API_ENDPOINTS.FILES.SERVE}/${storageKey}`, {
    responseType: 'arraybuffer',
  });

  const contentType = (response.headers['content-type'] as string) ?? '';

  // S3: 백엔드가 JSON { presignedUrl } 반환 (documents 패턴과 동일)
  if (contentType.includes('application/json')) {
    const text = new TextDecoder().decode(response.data as ArrayBuffer);
    const { presignedUrl } = JSON.parse(text) as { presignedUrl: string };
    return { url: presignedUrl, isBlob: false };
  }

  // Local FS: 바이너리 스트리밍 → Blob URL
  const blob = new Blob([response.data as ArrayBuffer], { type: contentType });
  return { url: window.URL.createObjectURL(blob), isBlob: true };
}
