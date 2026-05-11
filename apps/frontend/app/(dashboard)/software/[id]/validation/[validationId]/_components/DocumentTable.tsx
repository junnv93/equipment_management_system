'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ErrorState } from '@/components/shared/ErrorState';
import { ValidationDocumentsEmptyState } from '@/components/software/SoftwareEmptyState';
import { DOCUMENT_TABLE } from '@/lib/design-tokens';
import type { DocumentRecord } from '@/lib/api/document-api';
import { ValidationStatusValues } from '@equipment-management/schemas';
import type { ValidationStatus, ValidationType } from '@equipment-management/schemas';
import { DocumentUploadButton } from './DocumentUploadButton';
import { DocumentTableRow } from './DocumentTableRow';

interface DocumentTableProps {
  docs: DocumentRecord[];
  validationId: string;
  validationType: ValidationType;
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
      {validationStatus === ValidationStatusValues.DRAFT && (
        <DocumentUploadButton validationId={validationId} validationType={validationType} />
      )}

      {docsLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : docsError ? (
        <div className="py-8 flex justify-center">
          <ErrorState title={t('validation.documents.loadError')} />
        </div>
      ) : docs.length === 0 ? (
        // P1-4: 빈 상태 EmptyState SSOT 적용 — DRAFT 상태에서만 업로드 CTA 노출
        <ValidationDocumentsEmptyState
          canUpload={validationStatus === ValidationStatusValues.DRAFT}
        />
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
