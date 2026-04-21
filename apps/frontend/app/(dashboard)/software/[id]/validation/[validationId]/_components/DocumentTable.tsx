'use client';

import { useTranslations } from 'next-intl';
import { Paperclip } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DOCUMENT_TABLE, DOCUMENT_EMPTY_STATE } from '@/lib/design-tokens';
import type { DocumentRecord } from '@/lib/api/document-api';
import type { ValidationStatus } from '@equipment-management/schemas';
import { DocumentUploadButton } from './DocumentUploadButton';
import { DocumentTableRow } from './DocumentTableRow';

interface DocumentTableProps {
  docs: DocumentRecord[];
  validationId: string;
  validationType: string;
  validationStatus: ValidationStatus;
  docsLoading: boolean;
  docsError: boolean;
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
  onDownload,
  onDelete,
  isDeleting,
}: DocumentTableProps) {
  const t = useTranslations('software');

  return (
    <>
      {validationStatus === 'draft' && (
        <DocumentUploadButton validationId={validationId} validationType={validationType} />
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
              {docs.map((doc) => (
                <DocumentTableRow
                  key={doc.id}
                  doc={doc}
                  validationStatus={validationStatus}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
