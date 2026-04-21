'use client';

import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { documentApi } from '@/lib/api/document-api';
import { queryKeys } from '@/lib/api/query-config';
import { DocumentTypeValues, ValidationTypeValues } from '@equipment-management/schemas';
import type { ValidationType } from '@equipment-management/schemas';
import { ALLOWED_EXTENSIONS } from '@equipment-management/shared-constants';

interface DocumentUploadButtonProps {
  validationId: string;
  validationType: ValidationType;
}

export function DocumentUploadButton({ validationId, validationType }: DocumentUploadButtonProps) {
  const t = useTranslations('software');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const docType =
        validationType === ValidationTypeValues.VENDOR
          ? DocumentTypeValues.VALIDATION_VENDOR_ATTACHMENT
          : DocumentTypeValues.VALIDATION_TEST_DATA;
      return documentApi.uploadDocument(file, docType, { softwareValidationId: validationId });
    },
    onSuccess: () => {
      toast({ title: t('validation.documents.uploadSuccess') });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.byValidation(validationId) });
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
  );
}
