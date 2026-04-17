'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileIcon, Paperclip, Trash2, Upload } from 'lucide-react';
import { DocumentTypeValues } from '@equipment-management/schemas';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
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

/**
 * NC 첨부(사진/문서) 섹션 — NCDetailClient 하단에 임베드.
 *
 * ## 설계 원칙
 * - **SSOT**: `documentApi.getNonConformanceDocuments` + `queryKeys.documents.byNonConformance`.
 * - **도메인 격리**: NC 전용 엔드포인트 사용(UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT permission).
 * - **접근성**: 파일 업로드 input은 aria-live 상태 공지, 삭제는 AlertDialog confirm.
 * - **성능**: 이미지 mime은 download API(presigned URL/proxy)로 프리뷰 생성 → 10MB 한도 내 직렬 fetch.
 *            ObjectURL은 unmount 시 revoke하여 메모리 누수 방지.
 */
export function NCDocumentsSection({ nonConformanceId }: NCDocumentsSectionProps) {
  const t = useTranslations('non-conformances.detail.attachments');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        documentApi.uploadNonConformanceAttachment(
          nonConformanceId,
          file,
          DocumentTypeValues.EQUIPMENT_PHOTO,
          t('defaultDescription')
        )
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
      toast({ title: t('uploadSuccess', { count: files.length }) });
    }

    queryClient.invalidateQueries({
      queryKey: queryKeys.documents.byNonConformance(nonConformanceId),
    });
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
            <li key={doc.id} className="group relative space-y-1">
              <AttachmentThumbnail
                doc={doc}
                downloadLabel={t('downloadLabel', { name: doc.originalFileName })}
              />
              <p className="text-xs text-muted-foreground truncate" title={doc.originalFileName}>
                {doc.originalFileName}
              </p>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                onClick={() => setPendingDelete(doc)}
                aria-label={t('deleteLabel', { name: doc.originalFileName })}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
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
}: {
  doc: DocumentRecord;
  downloadLabel: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = (doc.mimeType ?? '').startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    documentApi
      .fetchDocumentObjectUrl(doc.id)
      .then((url) => {
        if (cancelled) {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url.startsWith('blob:') ? url : null;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id, isImage]);

  return (
    <button
      type="button"
      onClick={() => documentApi.downloadDocument(doc.id, doc.originalFileName)}
      className="w-full aspect-square rounded-md border bg-muted overflow-hidden flex items-center justify-center hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={downloadLabel}
    >
      {isImage && previewUrl ? (
        <img
          src={previewUrl}
          alt={doc.originalFileName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <FileIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      )}
    </button>
  );
}
