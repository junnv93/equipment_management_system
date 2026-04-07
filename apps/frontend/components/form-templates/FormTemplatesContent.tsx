'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileText, AlertCircle, FileX2, RefreshCw } from 'lucide-react';
import { queryKeys, REFETCH_STRATEGIES } from '@/lib/api/query-config';
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
import FormTemplatesTable from './FormTemplatesTable';
import FormTemplateSearchBar from './FormTemplateSearchBar';

export default function FormTemplatesContent() {
  const t = useTranslations('form-templates');

  const {
    data: templates,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.formTemplates.list(),
    queryFn: listFormTemplates,
    ...REFETCH_STRATEGIES.STATIC,
  });

  const totalCount = templates?.length ?? 0;
  const registeredCount = templates?.filter((tpl) => tpl.current !== null).length ?? 0;
  const unregisteredCount = totalCount - registeredCount;

  return (
    <div className={getPageContainerClasses()}>
      {/* 페이지 헤더 */}
      <div className={FORM_TEMPLATES_HEADER_TOKENS.container}>
        <div className={FORM_TEMPLATES_HEADER_TOKENS.titleGroup}>
          <h1 className={FORM_TEMPLATES_HEADER_TOKENS.title}>{t('title')}</h1>
          <p className={FORM_TEMPLATES_HEADER_TOKENS.subtitle}>{t('description')}</p>
        </div>
      </div>

      {/* 로딩 */}
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

      {/* 에러 상태 */}
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

      {/* 빈 상태 */}
      {!isLoading && !isError && templates && templates.length === 0 && (
        <div className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.container}>
          <FileX2 className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.icon} />
          <p className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.title}>{t('empty')}</p>
          <p className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.description}>{t('emptyDescription')}</p>
        </div>
      )}

      {/* 데이터 존재 시 */}
      {!isLoading && !isError && templates && templates.length > 0 && (
        <div className={FORM_TEMPLATES_MOTION.contentEntrance}>
          {/* 요약 통계 strip */}
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

          {/* 과거 번호 검색 */}
          <div className="mt-6">
            <FormTemplateSearchBar />
          </div>

          {/* 테이블 */}
          <div className="mt-4">
            <FormTemplatesTable templates={templates} />
          </div>
        </div>
      )}
    </div>
  );
}
