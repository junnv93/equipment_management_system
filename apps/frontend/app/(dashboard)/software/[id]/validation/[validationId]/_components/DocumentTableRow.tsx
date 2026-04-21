'use client';

import { useTranslations } from 'next-intl';
import {
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { DOCUMENT_TABLE } from '@/lib/design-tokens';
import { DOCUMENT_TYPE_LABELS, ValidationStatusValues } from '@equipment-management/schemas';
import type { DocumentType, ValidationStatus } from '@equipment-management/schemas';
import type { DocumentRecord } from '@/lib/api/document-api';
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

interface DocumentTableRowProps {
  doc: DocumentRecord;
  validationStatus: ValidationStatus;
  onDownload: (doc: DocumentRecord) => Promise<void>;
  onDelete: (docId: string) => void;
  isDeleting: boolean;
}

export function DocumentTableRow({
  doc,
  validationStatus,
  onDownload,
  onDelete,
  isDeleting,
}: DocumentTableRowProps) {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();

  const Icon = MIME_ICONS[doc.mimeType] ?? File;
  const typeLabel = DOCUMENT_TYPE_LABELS[doc.documentType as DocumentType] ?? doc.documentType;

  return (
    <TableRow className={[DOCUMENT_TABLE.rowHover, DOCUMENT_TABLE.stripe].join(' ')}>
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
      <TableCell className={DOCUMENT_TABLE.numericCell}>{formatFileSize(doc.fileSize)}</TableCell>
      <TableCell className={DOCUMENT_TABLE.numericCell}>{fmtDate(doc.uploadedAt)}</TableCell>
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
          {validationStatus === ValidationStatusValues.DRAFT && (
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
}
