'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FileText, AlertCircle, FileX2, RefreshCw, Archive } from 'lucide-react';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { listFormTemplates } from '@/lib/api/form-templates-api';
import {
  getPageContainerClasses,
  FORM_TEMPLATES_HEADER_TOKENS,
  FORM_TEMPLATES_STATS_TOKENS,
  FORM_TEMPLATES_EMPTY_STATE_TOKENS,
  FORM_TEMPLATES_ERROR_STATE_TOKENS,
  FORM_TEMPLATES_MOTION,
} from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FormTemplatesTable from './FormTemplatesTable';
import FormTemplateSearchBar from './FormTemplateSearchBar';
import FormTemplatesArchivedTable from './FormTemplatesArchivedTable';

/**
 * URL ?view= 파라미터가 활성/아카이브 뷰의 SSOT.
 * 딥링크, 브라우저 back/forward, 외부 알림 링크와 상호운용 가능.
 */
const VIEW_PARAM = 'view' as const;
type FormTemplatesView = 'active' | 'archived';

function parseView(value: string | null): FormTemplatesView {
  return value === 'archived' ? 'archived' : 'active';
}

export default function FormTemplatesContent() {
  const t = useTranslations('form-templates');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseView(searchParams.get(VIEW_PARAM));

  const handleViewChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'archived') {
        params.set(VIEW_PARAM, 'archived');
      } else {
        params.delete(VIEW_PARAM);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const {
    data: templates,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.formTemplates.list(),
    queryFn: listFormTemplates,
    enabled: view === 'active',
    ...QUERY_CONFIG.FORM_TEMPLATES,
  });

  const totalCount = templates?.length ?? 0;
  const registeredCount = templates?.filter((tpl) => tpl.current !== null).length ?? 0;
  const unregisteredCount = totalCount - registeredCount;

  const activeView = (
    <>
      {isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className={FORM_TEMPLATES_ERROR_STATE_TOKENS.container}>
          <AlertCircle className={FORM_TEMPLATES_ERROR_STATE_TOKENS.icon} />
          <p className={FORM_TEMPLATES_ERROR_STATE_TOKENS.title}>{t('error')}</p>
          <p className={FORM_TEMPLATES_ERROR_STATE_TOKENS.description}>{t('errorDescription')}</p>
          <Button
            variant="outline"
            size="sm"
            className={FORM_TEMPLATES_ERROR_STATE_TOKENS.retryBtn}
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            {t('retry')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && templates && templates.length === 0 && (
        <div className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.container}>
          <FileX2 className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.icon} />
          <p className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.title}>{t('empty')}</p>
          <p className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.description}>{t('emptyDescription')}</p>
        </div>
      )}

      {!isLoading && !isError && templates && templates.length > 0 && (
        <div className={FORM_TEMPLATES_MOTION.contentEntrance}>
          <div className={FORM_TEMPLATES_STATS_TOKENS.grid}>
            <div className={FORM_TEMPLATES_STATS_TOKENS.card}>
              <div
                className={`${FORM_TEMPLATES_STATS_TOKENS.iconContainer} ${FORM_TEMPLATES_STATS_TOKENS.iconBg.total}`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className={FORM_TEMPLATES_STATS_TOKENS.label}>{t('stats.total')}</p>
                <p className={FORM_TEMPLATES_STATS_TOKENS.value}>{totalCount}</p>
              </div>
            </div>

            <div className={FORM_TEMPLATES_STATS_TOKENS.card}>
              <div
                className={`${FORM_TEMPLATES_STATS_TOKENS.iconContainer} ${FORM_TEMPLATES_STATS_TOKENS.iconBg.registered}`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className={FORM_TEMPLATES_STATS_TOKENS.label}>{t('stats.registered')}</p>
                <p className={FORM_TEMPLATES_STATS_TOKENS.value}>{registeredCount}</p>
              </div>
            </div>

            <div className={FORM_TEMPLATES_STATS_TOKENS.card}>
              <div
                className={`${FORM_TEMPLATES_STATS_TOKENS.iconContainer} ${FORM_TEMPLATES_STATS_TOKENS.iconBg.unregistered}`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className={FORM_TEMPLATES_STATS_TOKENS.label}>{t('stats.unregistered')}</p>
                <p className={FORM_TEMPLATES_STATS_TOKENS.value}>{unregisteredCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <FormTemplateSearchBar />
          </div>

          <div className="mt-4">
            <FormTemplatesTable templates={templates} />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={getPageContainerClasses()}>
      {/* 페이지 헤더 */}
      <div className={FORM_TEMPLATES_HEADER_TOKENS.container}>
        <div className={FORM_TEMPLATES_HEADER_TOKENS.titleGroup}>
          <h1 className={FORM_TEMPLATES_HEADER_TOKENS.title}>{t('title')}</h1>
          <p className={FORM_TEMPLATES_HEADER_TOKENS.subtitle}>{t('description')}</p>
        </div>
      </div>

      {/* 활성 / 아카이브 뷰 토글 — URL ?view= 가 SSOT */}
      <Tabs value={view} onValueChange={handleViewChange} className="mt-2">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="active" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('tabs.active')}
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            <Archive className="h-4 w-4" />
            {t('tabs.archived')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeView}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <FormTemplatesArchivedTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
