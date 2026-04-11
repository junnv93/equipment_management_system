'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { documentApi } from '@/lib/api/document-api';
import { ImageIcon, AlertTriangle } from 'lucide-react';

interface DocumentImageProps {
  documentId: string;
  alt?: string;
  className?: string;
  /** 로딩/에러 자리에 표시할 높이 (px 또는 Tailwind). 기본 'h-full' */
  fallbackClassName?: string;
}

/**
 * documents/:id/download 엔드포인트의 응답(s3 presigned URL 또는 blob)을
 * `<img>` src 로 안전하게 변환해 표시한다. blob URL 은 언마운트 시 revoke.
 *
 * 재사용 위치: VisualTableEditor 의 이미지 셀 썸네일, ResultSectionPreview 의
 * rich_table / photo 섹션 실제 이미지 렌더링.
 */
export default function DocumentImage({
  documentId,
  alt = '',
  className,
  fallbackClassName,
}: DocumentImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revokeUrl: string | null = null;
    let cancelled = false;

    setError(false);
    setUrl(null);

    documentApi
      .getPreviewUrl(documentId)
      .then(({ url: resolvedUrl, isBlob }) => {
        if (cancelled) {
          if (isBlob) window.URL.revokeObjectURL(resolvedUrl);
          return;
        }
        setUrl(resolvedUrl);
        if (isBlob) revokeUrl = resolvedUrl;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (revokeUrl) window.URL.revokeObjectURL(revokeUrl);
    };
  }, [documentId]);

  if (error) {
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

  if (!url) {
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

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
