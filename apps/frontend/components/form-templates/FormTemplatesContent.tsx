'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { queryKeys, REFETCH_STRATEGIES } from '@/lib/api/query-config';
import { listFormTemplates } from '@/lib/api/form-templates-api';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { Skeleton } from '@/components/ui/skeleton';
import FormTemplatesTable from './FormTemplatesTable';

export default function FormTemplatesContent() {
  const t = useTranslations('form-templates');

  const {
    data: templates,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.formTemplates.list(),
    queryFn: listFormTemplates,
    ...REFETCH_STRATEGIES.STATIC,
  });

  return (
    <div className={getPageContainerClasses()}>
      <div className={PAGE_HEADER_TOKENS.container}>
        <div className={PAGE_HEADER_TOKENS.titleGroup}>
          <h1 className={PAGE_HEADER_TOKENS.title}>{t('title')}</h1>
          <p className={PAGE_HEADER_TOKENS.subtitle}>{t('description')}</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="mb-2 h-10 w-10" />
          <p>{t('error')}</p>
        </div>
      )}

      {!isLoading && !isError && templates && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="mb-2 h-10 w-10" />
          <p>{t('empty')}</p>
        </div>
      )}

      {!isLoading && !isError && templates && templates.length > 0 && (
        <FormTemplatesTable templates={templates} />
      )}
    </div>
  );
}
