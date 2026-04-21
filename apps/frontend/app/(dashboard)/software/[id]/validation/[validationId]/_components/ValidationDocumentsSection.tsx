'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import type { ValidationStatus, ValidationType } from '@equipment-management/schemas';
import { DocumentTable } from './DocumentTable';

interface ValidationDocumentsSectionProps {
  validationId: string;
  validationType: ValidationType;
  validationStatus: ValidationStatus;
}

export function ValidationDocumentsSection({
  validationId,
  validationType,
  validationStatus,
}: ValidationDocumentsSectionProps) {
  const t = useTranslations('software');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: docs = [],
    isLoading: docsLoading,
    isError: docsError,
  } = useQuery({
    queryKey: queryKeys.documents.byValidation(validationId),
    queryFn: () => documentApi.getValidationDocuments(validationId),
    ...QUERY_CONFIG.EQUIPMENT_DOCUMENTS,
  });

  const invalidateDocs = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.documents.byValidation(validationId),
    });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => documentApi.deleteDocument(docId),
    onSuccess: () => {
      toast({ title: t('validation.documents.deleteSuccess') });
      invalidateDocs();
    },
    onError: () => {
      toast({ title: t('validation.documents.deleteError'), variant: 'destructive' });
    },
  });

  const handleDownload = async (doc: DocumentRecord) => {
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  const handleDeleteDoc = (docId: string) => {
    if (!confirm(t('validation.documents.deleteConfirm'))) return;
    deleteMutation.mutate(docId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="h-5 w-5 text-brand-info" aria-hidden="true" />
          {t('validation.documents.title')}
          {docs.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {docs.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentTable
          docs={docs}
          validationId={validationId}
          validationType={validationType}
          validationStatus={validationStatus}
          docsLoading={docsLoading}
          docsError={docsError}
          onDownload={handleDownload}
          onDelete={handleDeleteDoc}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
