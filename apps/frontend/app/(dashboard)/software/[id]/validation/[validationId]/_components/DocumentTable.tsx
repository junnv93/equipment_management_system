'use client';

import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { DOCUMENT_TABLE, DOCUMENT_EMPTY_STATE } from '@/lib/design-tokens';
import { DocumentTypeValues, DOCUMENT_TYPE_LABELS } from '@equipment-management/schemas';
import type { DocumentType, ValidationStatus } from '@equipment-management/schemas';
import { ALLOWED_EXTENSIONS } from '@equipment-management/shared-constants';
import { formatFileSize } from '@/lib/utils/format';
import { useDateFormatter } from '@/hooks/use-date-formatter';

const MIME_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'image/jpeg': ImageIcon,
  'image/png': ImageIcon,
  'image/gif': ImageIcon,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
};

interface DocumentTableProps {
  docs: DocumentRecord[];
  validationId: string;
  validationType: string;
  validationStatus: ValidationStatus;
  docsLoading: boolean;
  docsError: boolean;
  invalidateDocs: () => void;
  onDownload: (doc: DocumentRecord) => Promise<void>;
  onDelete: (docId: string) => void;
  isDeleting: boolean;
}

export function DocumentTable({
  docs,
  validationId,
  validationType,
  validationStatus,
  docsLoading,
  docsError,
  invalidateDocs,
  onDownload,
  onDelete,
  isDeleting,
}: DocumentTableProps) {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const docType =
        validationType === 'vendor'
          ? DocumentTypeValues.VALIDATION_VENDOR_ATTACHMENT
          : DocumentTypeValues.VALIDATION_TEST_DATA;
      return documentApi.uploadDocument(file, docType, { softwareValidationId: validationId });
    },
    onSuccess: () => {
      toast({ title: t('validation.documents.uploadSuccess') });
      invalidateDocs();
    },
    onError: () => {
      toast({ title: t('validation.documents.uploadError'), variant: 'destructive' });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {validationStatus === 'draft' && (
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={ALLOWED_EXTENSIONS.join(',')}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="mr-1 h-3.5 w-3.5" />
            {uploadMutation.isPending
              ? t('validation.documents.uploading')
              : t('validation.documents.upload')}
          </Button>
        </div>
      )}

      {docsLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : docsError ? (
        <div className={DOCUMENT_EMPTY_STATE.container}>
          <Paperclip className={DOCUMENT_EMPTY_STATE.icon} />
          <p className={DOCUMENT_EMPTY_STATE.text}>{t('validation.documents.loadError')}</p>
        </div>
      ) : docs.length === 0 ? (
        <div className={DOCUMENT_EMPTY_STATE.container}>
          <Paperclip className={DOCUMENT_EMPTY_STATE.icon} />
          <p className={DOCUMENT_EMPTY_STATE.text}>{t('validation.documents.empty')}</p>
        </div>
      ) : (
        <div className={DOCUMENT_TABLE.wrapper}>
          <Table>
            <TableHeader>
              <TableRow className={DOCUMENT_TABLE.stickyHeader}>
                <TableHead>{t('validation.documents.tableHeaders.fileName')}</TableHead>
                <TableHead>{t('validation.documents.tableHeaders.type')}</TableHead>
                <TableHead>{t('validation.documents.tableHeaders.size')}</TableHead>
                <TableHead>{t('validation.documents.tableHeaders.uploadedAt')}</TableHead>
                <TableHead>{t('validation.documents.tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => {
                const Icon = MIME_ICONS[doc.mimeType] ?? File;
                const typeLabel =
                  DOCUMENT_TYPE_LABELS[doc.documentType as DocumentType] ?? doc.documentType;
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
                    <TableCell className={DOCUMENT_TABLE.numericCell}>
                      {fmtDate(doc.uploadedAt)}
                    </TableCell>
                    <TableCell>
                      <div className={DOCUMENT_TABLE.actionsCell}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`${t('validation.documents.download')} ${doc.originalFileName}`}
                          className="h-8 w-8"
                          onClick={() => onDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {validationStatus === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${t('validation.documents.delete')} ${doc.originalFileName}`}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDelete(doc.id)}
                            disabled={isDeleting}
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
    </>
  );
}
