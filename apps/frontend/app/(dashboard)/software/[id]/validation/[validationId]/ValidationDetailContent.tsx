'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { softwareValidationApi } from '@/lib/api/software-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { FRONTEND_ROUTES, FORM_CATALOG } from '@equipment-management/shared-constants';
import { ExportFormButton } from '@/components/shared/ExportFormButton';
import { isValidationExportable } from '@/lib/utils/software-validation-exportability';
import type { ValidationStatus } from '@equipment-management/schemas';
import { ValidationBasicInfoCard } from './_components/ValidationBasicInfoCard';
import { ValidationVendorInfoCard } from './_components/ValidationVendorInfoCard';
import { ValidationSelfTestInfoCard } from './_components/ValidationSelfTestInfoCard';
import { ValidationApprovalInfoCard } from './_components/ValidationApprovalInfoCard';
import { ValidationDocumentsSection } from './_components/ValidationDocumentsSection';
import { ValidationEditDialog } from './_components/ValidationEditDialog';

interface ValidationDetailContentProps {
  softwareId: string;
  validationId: string;
}

const STATUS_VARIANT: Record<
  ValidationStatus,
  'secondary' | 'outline' | 'default' | 'destructive'
> = {
  draft: 'secondary',
  submitted: 'outline',
  approved: 'outline',
  quality_approved: 'default',
  rejected: 'destructive',
};

export default function ValidationDetailContent({
  softwareId,
  validationId,
}: ValidationDetailContentProps) {
  const t = useTranslations('software');
  const router = useRouter();
  const searchParams = useSearchParams();

  const isEditOpen = searchParams.get('edit') === 'true';
  const setIsEditOpen = useCallback(
    (open: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (open) {
        params.set('edit', 'true');
      } else {
        params.delete('edit');
      }
      router.replace(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  const {
    data: validation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.softwareValidations.detail(validationId),
    queryFn: () => softwareValidationApi.get(validationId),
    ...QUERY_CONFIG.SOFTWARE_VALIDATION_DETAIL,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !validation) {
    return (
      <div className={getPageContainerClasses('detail')}>
        <p className="text-muted-foreground">{t('detail.notFound')}</p>
      </div>
    );
  }

  const isVendor = validation.validationType === 'vendor';
  const isSelf = validation.validationType === 'self';

  return (
    <div className={getPageContainerClasses('detail')}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.VALIDATION(softwareId))}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('validation.detail.backToList')}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_HEADER_TOKENS.title}>{t('validation.detail.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ExportFormButton
            formNumber={FORM_CATALOG['UL-QP-18-09'].formNumber}
            params={{ validationId }}
            label={t('validation.actions.exportValidation')}
            errorToastDescription={t('toast.error')}
            disabled={!isValidationExportable(validation.status)}
          />
          {validation.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {t('validation.actions.edit')}
            </Button>
          )}
          <Badge variant={STATUS_VARIANT[validation.status]} className="text-sm">
            {t(`validationStatus.${validation.status}`)}
          </Badge>
        </div>
      </div>

      <ValidationBasicInfoCard validation={validation} />

      {isVendor && <ValidationVendorInfoCard validation={validation} />}

      {isSelf && <ValidationSelfTestInfoCard validation={validation} />}

      <ValidationApprovalInfoCard validation={validation} />

      <ValidationDocumentsSection
        validationId={validationId}
        validationType={validation.validationType}
        validationStatus={validation.status}
      />

      <ValidationEditDialog
        validationId={validationId}
        softwareId={softwareId}
        validation={validation}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </div>
  );
}
