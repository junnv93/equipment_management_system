'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Download, Lock, FileX2, AlertCircle, Archive, RefreshCw } from 'lucide-react';
import { Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { listArchivedFormTemplates, downloadFormTemplateById } from '@/lib/api/form-templates-api';
import {
  FORM_TEMPLATES_TABLE_TOKENS,
  FORM_TEMPLATES_STATS_TOKENS,
  FORM_TEMPLATES_EMPTY_STATE_TOKENS,
  FORM_TEMPLATES_ERROR_STATE_TOKENS,
  FORM_TEMPLATES_MOTION,
} from '@/lib/design-tokens';

/**
 * 보존연한 만료 소프트 아카이브 양식 테이블 (UL-QP-03 §11).
 *
 * - read-only 뷰. 자동 cron(form-template-archival.service.ts)이 매일 자정 처리
 * - 다운로드는 DOWNLOAD_FORM_TEMPLATE_HISTORY 권한자만 (UL-QP-03 §7.7 비관련 인원 접근 제한)
 * - 일관된 시각 언어를 위해 활성 테이블과 동일한 디자인 토큰 사용
 */
export default function FormTemplatesArchivedTable() {
  const t = useTranslations('form-templates');
  const { can } = useAuth();
  const canDownloadHistory = can(Permission.DOWNLOAD_FORM_TEMPLATE_HISTORY);

  const {
    data: archived,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.formTemplates.archived(),
    queryFn: listArchivedFormTemplates,
    ...QUERY_CONFIG.FORM_TEMPLATES,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[68px] w-full rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
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
    );
  }

  const items = archived ?? [];

  if (items.length === 0) {
    return (
      <div className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.container}>
        <FileX2 className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.icon} />
        <p className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.title}>{t('archived.empty')}</p>
        <p className={FORM_TEMPLATES_EMPTY_STATE_TOKENS.description}>
          {t('archived.emptyDescription')}
        </p>
      </div>
    );
  }

  // 가장 최근 아카이브 일자 (백엔드는 archivedAt desc로 정렬됨)
  const latestArchivedAt = items[0]?.archivedAt
    ? new Date(items[0].archivedAt).toLocaleDateString()
    : '-';

  return (
    <div className={FORM_TEMPLATES_MOTION.contentEntrance}>
      {/* 요약 통계 */}
      <div className={FORM_TEMPLATES_STATS_TOKENS.grid}>
        <div className={FORM_TEMPLATES_STATS_TOKENS.card}>
          <div
            className={`${FORM_TEMPLATES_STATS_TOKENS.iconContainer} ${FORM_TEMPLATES_STATS_TOKENS.iconBg.unregistered}`}
          >
            <Archive className="h-4 w-4" />
          </div>
          <div>
            <p className={FORM_TEMPLATES_STATS_TOKENS.label}>{t('archived.stats.total')}</p>
            <p className={FORM_TEMPLATES_STATS_TOKENS.value}>{items.length}</p>
          </div>
        </div>

        <div className={FORM_TEMPLATES_STATS_TOKENS.card}>
          <div
            className={`${FORM_TEMPLATES_STATS_TOKENS.iconContainer} ${FORM_TEMPLATES_STATS_TOKENS.iconBg.total}`}
          >
            <Archive className="h-4 w-4" />
          </div>
          <div>
            <p className={FORM_TEMPLATES_STATS_TOKENS.label}>{t('archived.stats.latestArchive')}</p>
            <p className={FORM_TEMPLATES_STATS_TOKENS.value}>{latestArchivedAt}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{t('archived.description')}</p>

      <div className={`${FORM_TEMPLATES_TABLE_TOKENS.container} mt-4`}>
        <Table>
          <TableHeader>
            <TableRow className={FORM_TEMPLATES_TABLE_TOKENS.headerRow}>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('archived.table.formNumber')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('archived.table.filename')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('archived.table.uploadedAt')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('archived.table.archivedAt')}
              </TableHead>
              <TableHead className={`${FORM_TEMPLATES_TABLE_TOKENS.headerCell} text-right`}>
                {t('archived.table.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow
                key={row.id}
                className={`${FORM_TEMPLATES_TABLE_TOKENS.rowHover} ${FORM_TEMPLATES_TABLE_TOKENS.rowStripe}`}
              >
                <TableCell>
                  <span className={FORM_TEMPLATES_TABLE_TOKENS.formNumber}>{row.formNumber}</span>
                </TableCell>
                <TableCell className={FORM_TEMPLATES_TABLE_TOKENS.filename}>
                  {row.originalFilename}
                </TableCell>
                <TableCell className={FORM_TEMPLATES_TABLE_TOKENS.date}>
                  {new Date(row.uploadedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className={FORM_TEMPLATES_TABLE_TOKENS.date}>
                  {row.archivedAt ? new Date(row.archivedAt).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className={FORM_TEMPLATES_TABLE_TOKENS.actionGroup}>
                    {canDownloadHistory ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${FORM_TEMPLATES_TABLE_TOKENS.actionBtn} ${FORM_TEMPLATES_MOTION.buttonPress}`}
                        onClick={() => downloadFormTemplateById(row.id)}
                        aria-label={`${t('download')} ${row.formNumber}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t('download')}
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground"
                            aria-label={t('archived.downloadLocked')}
                          >
                            <Lock className="h-3 w-3" />
                            {t('archived.lockedBadge')}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{t('archived.downloadLocked')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
