'use client';

import { useState } from 'react';
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
  MoreHorizontal,
} from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { DOCUMENT_TABLE, DOCUMENT_EMPTY_STATE } from '@/lib/design-tokens';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DocumentType } from '@equipment-management/schemas';
import { DOCUMENT_TYPE_LABELS } from '@equipment-management/schemas';
import { formatFileSize } from '@/lib/utils/format';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';
import { useToast } from '@/components/ui/use-toast';
import { DocumentRevisionDialog } from '@/components/shared/DocumentRevisionDialog';

interface AttachmentsTabProps {
  equipment: Equipment;
}

const MIME_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'image/jpeg': ImageIcon,
  'image/png': ImageIcon,
  'image/gif': ImageIcon,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
};

function getFileIcon(mimeType: string) {
  return MIME_ICONS[mimeType] ?? File;
}

export function AttachmentsTab({ equipment }: AttachmentsTabProps) {
  const t = useTranslations('equipment');
  const { toast } = useToast();
  const { fmtDate } = useDateFormatter();
  const { can } = useAuth();
  const queryClient = useQueryClient();

  const equipmentId = String(equipment.id);
  // SSOT: 첨부파일 삭제는 장비 삭제 권한과 동일 계층 — 기존 [TM, LM]에서 SA를 포함시키는
  // 확장(누락 복구)이며 백엔드 권한 계층과 정렬된다.
  const canDelete = can(Permission.DELETE_EQUIPMENT);
  const [revisionDocId, setRevisionDocId] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: queryKeys.documents.byEquipment(equipmentId),
    queryFn: () => documentApi.getEquipmentDocuments(equipmentId),
    enabled: !!equipmentId,
    ...QUERY_CONFIG.EQUIPMENT_DOCUMENTS,
  });

  const handleDownload = async (doc: DocumentRecord) => {
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm(t('attachmentsTab.deleteConfirm'))) return;
    try {
      await documentApi.deleteDocument(docId);
      toast({ description: t('attachmentsTab.deleteSuccess') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.byEquipment(equipmentId),
      });
    } catch {
      toast({ variant: 'destructive', description: t('attachmentsTab.deleteError') });
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
                  const typeLabel =
                    DOCUMENT_TYPE_LABELS[doc.documentType as DocumentType] ??
                    t(`attachmentsTab.type.${doc.documentType}`);

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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label={t('attachmentsTab.menuAriaLabel', {
                                fileName: doc.originalFileName,
                              })}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              {t('attachmentsTab.download')}
                            </DropdownMenuItem>
                            {doc.revisionNumber > 1 && (
                              <DropdownMenuItem onClick={() => setRevisionDocId(doc.id)}>
                                <History className="h-4 w-4 mr-2" />
                                {t('attachmentsTab.revisionHistory')}
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(doc.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('attachmentsTab.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
    </Card>
  );
}
