'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ImageIcon, AlertTriangle } from 'lucide-react';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { fetchStorageFileUrl } from '@/lib/utils/file-url';

interface StorageImageProps {
  /** DB에 저장된 스토리지 키 ({subdir}/{uuid}.{ext} 형식) */
  storageKey: string | null | undefined;
  alt?: string;
  className?: string;
  /** 로딩/에러 자리에 표시할 높이 클래스. 기본 'h-full' */
  fallbackClassName?: string;
}

/**
 * 스토리지 파일 → <img> 렌더링 컴포넌트
 *
 * DocumentImage(documents/:id/download) 와 동일한 패턴을 스토리지 직접 키에 적용.
 * FilesController(GET /api/files/:subdir/:filename)를 apiClient로 직접 호출하여
 * Next.js rewrite의 /api 제거 문제를 우회합니다.
 *
 * 캐싱: TanStack Query (staleTime=MEDIUM, gcTime=SHORT)
 *   - 동일 storageKey 반복 요청 시 캐시 히트 → 네트워크 요청 없음
 *   - gcTime=SHORT: GC 후 blob URL revoke 보장 (isBlobRef 추적)
 *
 * Blob URL 생명주기:
 *   - 마운트/storageKey 변경 시 fetchStorageFileUrl() 호출 (캐시 미스 시 네트워크)
 *   - 컴포넌트 언마운트 시 blob URL revoke (S3 presigned URL은 revoke 불필요)
 *   - query 데이터 변경 시 이전 blob URL 즉시 revoke 후 새 URL 설정
 *
 * 사용 예:
 *   <StorageImage storageKey={user.signatureImagePath} alt="전자 서명" className="max-h-12" />
 */
export default function StorageImage({
  storageKey,
  alt = '',
  className,
  fallbackClassName,
}: StorageImageProps) {
  const blobUrlRef = useRef<string | null>(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: queryKeys.storageFiles.url(storageKey ?? ''),
    queryFn: () => fetchStorageFileUrl(storageKey!),
    enabled: !!storageKey,
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.SHORT,
  });

  // Blob URL revoke — 이전 URL 교체 시 또는 언마운트 시 메모리 해제
  useEffect(() => {
    const previousBlobUrl = blobUrlRef.current;
    if (data?.isBlob) {
      blobUrlRef.current = data.url;
    } else {
      blobUrlRef.current = null;
    }

    return () => {
      if (previousBlobUrl) {
        window.URL.revokeObjectURL(previousBlobUrl);
      }
    };
  }, [data]);

  if (!storageKey) return null;

  if (isError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-destructive',
          fallbackClassName ?? 'h-full'
        )}
        aria-label="image load failed"
      >
        <AlertTriangle className="h-4 w-4" />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-muted-foreground animate-pulse',
          fallbackClassName ?? 'h-full'
        )}
        aria-label="loading image"
      >
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- blob/presigned URL은 next/image 미지원
  return <img src={data.url} alt={alt} className={className} loading="lazy" />;
}
