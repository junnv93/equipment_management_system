'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, ShieldCheck } from 'lucide-react';
import { ErrorState } from '@/components/shared/ErrorState';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { DocumentStatusValues } from '@equipment-management/schemas';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { DOCUMENT_TABLE, getDocumentRowClasses } from '@/lib/design-tokens';
import { formatFileSize } from '@/lib/utils/format';
import { useDateFormatter } from '@/hooks/use-date-formatter';

interface DocumentRevisionDialogProps {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentRevisionDialog({
  documentId,
  open,
  onOpenChange,
}: DocumentRevisionDialogProps) {
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();

  const {
    data: revisions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.documents.revisions(documentId),
    queryFn: () => documentApi.getRevisionHistory(documentId),
    enabled: open && !!documentId,
    staleTime: CACHE_TIMES.MEDIUM,
  });

  const handleDownload = async (doc: DocumentRecord) => {
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('attachmentsTab.revisionHistory')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : isError ? (
          <div className="py-8">
            <ErrorState title={t('attachmentsTab.revision.error')} onRetry={() => void refetch()} />
          </div>
        ) : revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t('attachmentsTab.revision.empty')}</p>
        ) : (
          <div className={`${DOCUMENT_TABLE.wrapper} max-h-[400px] overflow-y-auto`}>
            <Table>
              <TableHeader>
                <TableRow className={DOCUMENT_TABLE.stickyHeader}>
                  <TableHead>{t('attachmentsTab.revision.version')}</TableHead>
                  <TableHead>{t('attachmentsTab.revision.fileName')}</TableHead>
                  <TableHead>{t('attachmentsTab.revision.size')}</TableHead>
                  <TableHead>{t('attachmentsTab.revision.integrity')}</TableHead>
                  <TableHead>{t('attachmentsTab.revision.uploadedAt')}</TableHead>
                  <TableHead>{t('attachmentsTab.revision.status')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {revisions.map((rev: DocumentRecord) => (
                  <TableRow
                    key={rev.id}
                    className={[DOCUMENT_TABLE.rowHover, getDocumentRowClasses(rev.status)]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <TableCell>
                      <Badge
                        variant={
                          rev.status === DocumentStatusValues.ACTIVE ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {t('attachmentsTab.revisionCount', { count: rev.revisionNumber })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`truncate max-w-[180px] block ${rev.status === DocumentStatusValues.ACTIVE ? DOCUMENT_TABLE.fileNameCell : ''}`}
                        title={rev.originalFileName}
                      >
                        {rev.originalFileName}
                      </span>
                    </TableCell>
                    <TableCell className={DOCUMENT_TABLE.numericCell}>
                      {formatFileSize(rev.fileSize)}
                    </TableCell>
                    <TableCell>
                      {rev.fileHash ? (
                        <ShieldCheck className="h-4 w-4 text-brand-ok" />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className={DOCUMENT_TABLE.numericCell}>
                      {fmtDate(rev.uploadedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rev.status === DocumentStatusValues.ACTIVE ? 'success' : 'outline'}
                        className="text-xs"
                      >
                        {rev.status === DocumentStatusValues.ACTIVE
                          ? t('attachmentsTab.revision.latest')
                          : t('attachmentsTab.revision.previous')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${t('attachmentsTab.download')} ${rev.originalFileName}`}
                        className="h-8 w-8"
                        onClick={() => handleDownload(rev)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
