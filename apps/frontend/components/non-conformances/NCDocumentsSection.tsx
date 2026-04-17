'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Paperclip, Upload } from 'lucide-react';
import { DocumentTypeValues } from '@equipment-management/schemas';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface NCDocumentsSectionProps {
  nonConformanceId: string;
}

/**
 * NC 첨부(사진/문서) 섹션 — NCDetailClient 하단에 임베드.
 *
 * ## 설계 원칙
 * - **SSOT**: `documentApi.getNonConformanceDocuments` + `queryKeys.documents.byNonConformance`.
 * - **다른 모듈과 일관성**: 교정/장비 Documents 탭과 동일한 useQuery + grid 패턴.
 * - **접근성**: 파일 업로드 input은 aria-live로 상태 공지. 썸네일은 role='img' + alt.
 * - **성능**: 썸네일은 Presigned URL 활용(다운로드 API 재사용) 대신 최소 구현 —
 *   향후 Phase에서 thumbnail endpoint 추가 시 이 컴포넌트만 교체.
 */
export function NCDocumentsSection({ nonConformanceId }: NCDocumentsSectionProps) {
  // 자체 완결: detail.attachments.* 네임스페이스 내에서만 키 참조. 상위 form/toasts 섹션과 독립.
  const t = useTranslations('non-conformances.detail.attachments');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const documentsQuery = useQuery<DocumentRecord[]>({
    queryKey: queryKeys.documents.byNonConformance(nonConformanceId),
    queryFn: () => documentApi.getNonConformanceDocuments(nonConformanceId),
    ...QUERY_CONFIG.EQUIPMENT_DOCUMENTS,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const results = await Promise.allSettled(
      Array.from(files).map((file) =>
        documentApi.uploadDocument(file, DocumentTypeValues.EQUIPMENT_PHOTO, {
          nonConformanceId,
          description: t('defaultDescription'),
        })
      )
    );
    setIsUploading(false);

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      toast({
        title: t('uploadPartialFailed', { failed }),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('uploadSuccess', { count: files.length }),
      });
    }

    queryClient.invalidateQueries({
      queryKey: queryKeys.documents.byNonConformance(nonConformanceId),
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const docs = documentsQuery.data ?? [];

  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          {t('title')}
          <span className="text-xs text-muted-foreground font-normal">({docs.length})</span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-describedby="nc-attach-hint"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          {isUploading ? t('uploading') : t('upload')}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleUpload}
          className="hidden"
          aria-label={t('upload')}
        />
      </div>
      <p id="nc-attach-hint" className="sr-only">
        {t('hint')}
      </p>

      {documentsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t('loading')}
        </p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {docs.map((doc) => (
            <li key={doc.id} className="space-y-1">
              <button
                type="button"
                onClick={() => documentApi.downloadDocument(doc.id, doc.originalFileName)}
                className="w-full aspect-square rounded-md border bg-muted flex items-center justify-center hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={t('downloadLabel', { name: doc.originalFileName })}
              >
                <Paperclip className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </button>
              <p className="text-xs text-muted-foreground truncate" title={doc.originalFileName}>
                {doc.originalFileName}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
