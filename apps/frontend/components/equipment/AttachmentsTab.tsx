'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Paperclip,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  History,
  ShieldCheck,
  Eye,
  Upload,
} from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { getMimeCategory } from '@equipment-management/shared-constants';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { DOCUMENT_TABLE, DOCUMENT_EMPTY_STATE } from '@/lib/design-tokens';
import { formatFileSize } from '@/lib/utils/format';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { UserRoleValues as URVal } from '@equipment-management/schemas';
import { toast } from 'sonner';
import { DocumentRevisionDialog } from '@/components/shared/DocumentRevisionDialog';
import { DocumentPreviewDialog } from '@/components/shared/DocumentPreviewDialog';

interface AttachmentsTabProps {
  equipment: Equipment;
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  spreadsheet: FileSpreadsheet,
  document: FileText,
  other: File,
};

function getFileIcon(mimeType: string) {
  return CATEGORY_ICONS[getMimeCategory(mimeType)] ?? File;
}

export function AttachmentsTab({ equipment }: AttachmentsTabProps) {
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const equipmentId = String(equipment.id);
  const canDelete = hasRole([URVal.TECHNICAL_MANAGER, URVal.LAB_MANAGER]);
  const [revisionDocId, setRevisionDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);
  const revisionInputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: queryKeys.documents.byEquipment(equipmentId),
    queryFn: () => documentApi.getEquipmentDocuments(equipmentId),
    enabled: !!equipmentId,
    staleTime: CACHE_TIMES.LONG,
  });

  const handleDownload = async (doc: DocumentRecord) => {
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  const handleRevisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !revisionTargetId) return;
    try {
      await documentApi.createRevision(revisionTargetId, file);
      toast.success(t('attachmentsTab.revisionSuccess'));
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.byEquipment(equipmentId),
      });
    } catch {
      toast.error(t('attachmentsTab.revisionError'));
    } finally {
      setRevisionTargetId(null);
      if (revisionInputRef.current) revisionInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm(t('attachmentsTab.deleteConfirm'))) return;
    try {
      await documentApi.deleteDocument(docId);
      toast.success(t('attachmentsTab.deleteSuccess'));
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.byEquipment(equipmentId),
      });
    } catch {
      toast.error(t('attachmentsTab.deleteError'));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-brand-info" />
          {t('attachmentsTab.title')}
          {docs.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {docs.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className={DOCUMENT_EMPTY_STATE.container}>
            <Paperclip className={DOCUMENT_EMPTY_STATE.icon} />
            <p className={DOCUMENT_EMPTY_STATE.text}>{t('attachmentsTab.empty')}</p>
          </div>
        ) : (
          <div className={DOCUMENT_TABLE.wrapper}>
            <Table>
              <TableHeader>
                <TableRow className={DOCUMENT_TABLE.stickyHeader}>
                  <TableHead>{t('attachmentsTab.tableHeaders.fileName')}</TableHead>
                  <TableHead>{t('attachmentsTab.tableHeaders.type')}</TableHead>
                  <TableHead>{t('attachmentsTab.tableHeaders.size')}</TableHead>
                  <TableHead>{t('attachmentsTab.tableHeaders.revision')}</TableHead>
                  <TableHead>{t('attachmentsTab.tableHeaders.hash')}</TableHead>
                  <TableHead>{t('attachmentsTab.tableHeaders.uploadedAt')}</TableHead>
                  <TableHead>{t('attachmentsTab.tableHeaders.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => {
                  const Icon = getFileIcon(doc.mimeType);
                  const typeLabel = t(
                    `documentType.${doc.documentType}` as Parameters<typeof t>[0]
                  );

                  return (
                    <TableRow
                      key={doc.id}
                      className={[DOCUMENT_TABLE.rowHover, DOCUMENT_TABLE.stripe].join(' ')}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span
                            className={`truncate max-w-[200px] ${DOCUMENT_TABLE.fileNameCell}`}
                            title={doc.originalFileName}
                          >
                            {doc.originalFileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {typeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className={DOCUMENT_TABLE.numericCell}>
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell>
                        {doc.revisionNumber > 1 ? (
                          <Badge variant="secondary" className="text-xs">
                            {t('attachmentsTab.revisionCount', { count: doc.revisionNumber })}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">v1</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.fileHash ? (
                          <ShieldCheck className="h-4 w-4 text-brand-ok" />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className={DOCUMENT_TABLE.numericCell}>
                        {fmtDate(doc.uploadedAt)}
                      </TableCell>
                      <TableCell>
                        <div className={DOCUMENT_TABLE.actionsCell}>
                          {(getMimeCategory(doc.mimeType) === 'image' ||
                            getMimeCategory(doc.mimeType) === 'pdf') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPreviewDoc(doc)}
                              aria-label={`${t('attachmentsTab.preview')} ${doc.originalFileName}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(doc)}
                            aria-label={`${t('attachmentsTab.download')} ${doc.originalFileName}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setRevisionTargetId(doc.id);
                                revisionInputRef.current?.click();
                              }}
                              aria-label={`${t('attachmentsTab.uploadRevision')} ${doc.originalFileName}`}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                          {doc.revisionNumber > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`${t('attachmentsTab.revisionHistory')} ${doc.originalFileName}`}
                              onClick={() => setRevisionDocId(doc.id)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(doc.id)}
                              aria-label={`${t('attachmentsTab.delete')} ${doc.originalFileName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {revisionDocId && (
        <DocumentRevisionDialog
          documentId={revisionDocId}
          open={!!revisionDocId}
          onOpenChange={(open) => !open && setRevisionDocId(null)}
        />
      )}

      <DocumentPreviewDialog
        document={previewDoc}
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      />

      {/* 새 버전 업로드용 숨겨진 input */}
      <input
        ref={revisionInputRef}
        type="file"
        className="hidden"
        onChange={handleRevisionUpload}
      />
    </Card>
  );
}
