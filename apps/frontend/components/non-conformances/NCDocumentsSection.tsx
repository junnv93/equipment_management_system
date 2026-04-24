'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileIcon, LayoutGrid, List, Paperclip, Trash2, Upload } from 'lucide-react';
import { DocumentTypeValues } from '@equipment-management/schemas';
import { TRANSITION_PRESETS, NC_DOCUMENTS_SECTION_TOKENS } from '@/lib/design-tokens';
import { Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NCDocumentsSectionProps {
  nonConformanceId: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/**
 * NC 첨부(사진/문서) 섹션 — NCDetailClient 하단에 임베드.
 *
 * ## 설계 원칙
 * - **SSOT**: `documentApi.getNonConformanceDocuments` + `queryKeys.documents.byNonConformance`.
 * - **도메인 격리**: NC 전용 엔드포인트 사용(UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT permission).
 * - **접근성**: 파일 업로드 input은 aria-live 상태 공지, 삭제는 AlertDialog confirm.
 * - **성능**: 이미지 mime은 download API(presigned URL/proxy)로 프리뷰 생성 → 10MB 한도 내 직렬 fetch.
 *            ObjectURL은 unmount 시 revoke하여 메모리 누수 방지.
 * - **view 선택**: lazy init(docs >= 5 → list), 이후 사용자 선택 유지 (useEffect 덮어쓰기 금지).
 */
export function NCDocumentsSection({ nonConformanceId }: NCDocumentsSectionProps) {
  const t = useTranslations('non-conformances.detail.attachments');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { can } = useAuth();
  const { fmtDateTime } = useDateFormatter();
  // SSOT: NC 전용 permission 경계 — backend REST (UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT)와 1:1 대응.
  // UI에서 사전 차단 → 403 응답 전 UX 명확화 (버튼 숨김/비활성화).
  const canUpload = can(Permission.UPLOAD_NON_CONFORMANCE_ATTACHMENT);
  const canDelete = can(Permission.DELETE_NON_CONFORMANCE_ATTACHMENT);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const documentsQuery = useQuery<DocumentRecord[]>({
    queryKey: queryKeys.documents.byNonConformance(nonConformanceId),
    queryFn: () => documentApi.getNonConformanceDocuments(nonConformanceId),
    ...QUERY_CONFIG.EQUIPMENT_DOCUMENTS,
  });
  const isDocumentsError = documentsQuery.isError;

  const docs = documentsQuery.data ?? [];

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const viewInitialized = useRef(false);
  useEffect(() => {
    if (!viewInitialized.current && docs.length > 0) {
      viewInitialized.current = true;
      if (docs.length >= 5) setView('list');
    }
  }, [docs.length]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const results = await Promise.allSettled(
      Array.from(files).map((file) =>
        documentApi.uploadNonConformanceAttachment(
          nonConformanceId,
          file,
          DocumentTypeValues.EQUIPMENT_PHOTO,
          t('defaultDescription')
        )
      )
    );
    setIsUploading(false);

    const failed = results.filter((r) => r.status === 'rejected').length; // eslint-disable-line no-restricted-syntax -- Promise.allSettled result status; self-audit-exception
    const succeeded = results.length - failed;
    if (failed > 0) {
      toast({
        title: t('uploadPartialFailed', { failed }),
        variant: 'destructive',
      });
    } else {
      toast({ title: t('uploadSuccess', { count: files.length }) });
    }

    // 하나라도 성공한 경우만 invalidate — 전체 실패 시 불필요 서버 재조회 방지
    if (succeeded > 0) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.byNonConformance(nonConformanceId),
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await documentApi.deleteNonConformanceAttachment(nonConformanceId, pendingDelete.id);
      toast({ title: t('deleteSuccess') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.byNonConformance(nonConformanceId),
      });
    } catch {
      toast({ title: t('deleteError'), variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <section className={NC_DOCUMENTS_SECTION_TOKENS.container}>
      <div className={NC_DOCUMENTS_SECTION_TOKENS.header}>
        <h3 className={NC_DOCUMENTS_SECTION_TOKENS.title}>
          <Paperclip className={NC_DOCUMENTS_SECTION_TOKENS.titleIcon} aria-hidden="true" />
          {t('title')}
          <span className={NC_DOCUMENTS_SECTION_TOKENS.countBadge}>({docs.length})</span>
        </h3>

        {/* 보기 방식 토글 */}
        {docs.length > 0 && (
          <div
            className="inline-flex border rounded-md overflow-hidden text-xs"
            role="group"
            aria-label={t('view.label')}
          >
            <button
              type="button"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              className={cn(
                'px-2 py-1 inline-flex items-center gap-1 transition-colors',
                view === 'grid' && 'bg-muted font-semibold'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              {t('view.grid')}
            </button>
            <button
              type="button"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              className={cn(
                'px-2 py-1 inline-flex items-center gap-1 border-l transition-colors',
                view === 'list' && 'bg-muted font-semibold'
              )}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              {t('view.list')}
            </button>
          </div>
        )}

        {canUpload && (
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
        )}
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

      {isDocumentsError ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {t('loadError')}
        </p>
      ) : documentsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t('loading')}
        </p>
      ) : docs.length === 0 ? (
        <p className={NC_DOCUMENTS_SECTION_TOKENS.emptyText}>{t('empty')}</p>
      ) : view === 'list' ? (
        <ul className="rounded-lg border divide-y divide-border/60 overflow-hidden">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="grid grid-cols-[40px_1fr_90px_110px_32px] gap-3 items-center px-3 py-2.5 hover:bg-muted/30"
            >
              <AttachmentThumbnail
                doc={doc}
                size="xs"
                downloadLabel={t('downloadLabel', { name: doc.originalFileName })}
              />
              <div className="min-w-0">
                <div className="text-sm truncate">{doc.originalFileName}</div>
                <div className="text-[11.5px] text-muted-foreground font-mono">{doc.mimeType}</div>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatSize(doc.fileSize)}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {fmtDateTime(doc.createdAt)}
              </span>
              {canDelete && (
                <button
                  type="button"
                  aria-label={t('deleteLabel', { name: doc.originalFileName })}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => setPendingDelete(doc)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className={NC_DOCUMENTS_SECTION_TOKENS.grid}>
          {docs.map((doc) => (
            <li key={doc.id} className="group relative space-y-1">
              <AttachmentThumbnail
                doc={doc}
                downloadLabel={t('downloadLabel', { name: doc.originalFileName })}
              />
              <p className="text-xs text-muted-foreground truncate" title={doc.originalFileName}>
                {doc.originalFileName}
              </p>
              {canDelete && (
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label={t('deleteLabel', { name: doc.originalFileName })}
                  className={`absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 ${TRANSITION_PRESETS.fastOpacity}`}
                  onClick={() => setPendingDelete(doc)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmBody', { name: pendingDelete?.originalFileName ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('deleteCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t('deleting') : t('deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/**
 * 개별 첨부 썸네일 — image/* mime이면 이미지 프리뷰, 아니면 파일 아이콘.
 *
 * 이미지 프리뷰는 `documentApi.downloadDocument`와 동일한 Presigned URL/proxy 경로를 사용해
 * 권한/presigned 정책을 재사용. ObjectURL은 unmount 시 revoke.
 */
function AttachmentThumbnail({
  doc,
  downloadLabel,
  size = 'default',
}: {
  doc: DocumentRecord;
  downloadLabel: string;
  size?: 'xs' | 'default';
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);
  const isImage = (doc.mimeType ?? '').startsWith('image/');
  const sizeClass = size === 'xs' ? 'w-10 h-10 rounded-md' : 'w-full aspect-square rounded-md';

  // IntersectionObserver — 뷰포트 진입 시에만 fetch 시작 (N+1 → lazy load)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isImage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // 뷰포트 200px 전에 미리 로드
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isImage]);

  // 뷰포트 진입 후에만 썸네일 fetch — 백엔드 sharp WebP 200px 리사이징 경유
  useEffect(() => {
    if (!isImage || !isVisible) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    documentApi
      .fetchDocumentThumbnailBlobUrl(doc.id, 'sm')
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id, isImage, isVisible]);

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={() => documentApi.downloadDocument(doc.id, doc.originalFileName)}
      className={cn(
        sizeClass,
        'border bg-muted overflow-hidden flex items-center justify-center',
        'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
      )}
      aria-label={downloadLabel}
    >
      {isImage && previewUrl ? (
        <div
          aria-hidden="true"
          style={{ backgroundImage: `url(${previewUrl})` }}
          className="h-full w-full bg-cover bg-center"
        />
      ) : (
        <FileIcon
          className={cn('text-muted-foreground', size === 'xs' ? 'h-5 w-5' : 'h-8 w-8')}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
