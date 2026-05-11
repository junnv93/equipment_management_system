'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Clock, CheckCircle2, XCircle, FileEdit } from 'lucide-react';
import { ErrorState } from '@/components/shared/ErrorState';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveListFallback } from '@/components/shared/ResponsiveListFallback';
import { ValidationListEmptyState } from '@/components/software/SoftwareEmptyState';
import { softwareValidationApi, type SoftwareValidation } from '@/lib/api/software-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import type { ValidationStatus } from '@equipment-management/schemas';
import {
  getPageContainerClasses,
  PAGE_HEADER_TOKENS,
  SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS,
  SOFTWARE_VALIDATION_STATUS_ICON_TOKENS,
} from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';

/**
 * STATUS_ICON — 시멘틱 아이콘 색상 SSOT 사용 (P2-1).
 * raw `text-yellow-600` / `text-blue-600` / `text-green-600` 제거 — 다크모드 자동 전환.
 */
const STATUS_ICON_COMPONENT: Record<ValidationStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileEdit,
  submitted: Clock,
  approved: CheckCircle2,
  quality_approved: CheckCircle2,
  rejected: XCircle,
};

function ValidationStatusCell({
  status,
  label,
}: {
  status: ValidationStatus;
  label: string;
}) {
  const Icon = STATUS_ICON_COMPONENT[status];
  return (
    <Badge
      className={`flex w-fit items-center gap-1 ${SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS[status]}`}
    >
      <Icon className={`h-3.5 w-3.5 ${SOFTWARE_VALIDATION_STATUS_ICON_TOKENS[status]}`} aria-hidden="true" />
      {label}
    </Badge>
  );
}

export default function SoftwareValidationsListContent() {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.softwareValidations.lists(),
    queryFn: () => softwareValidationApi.listAll(),
    ...QUERY_CONFIG.SOFTWARE_VALIDATION_LIST,
  });

  const validations = data?.data ?? [];

  return (
    <div className={getPageContainerClasses('list')}>
      <div>
        <h1 className={PAGE_HEADER_TOKENS.title}>{t('validation.globalTitle')}</h1>
        <p className={PAGE_HEADER_TOKENS.subtitle}>{t('validation.globalSubtitle')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-16 flex justify-center">
          <ErrorState title={t('validation.loadError')} onRetry={() => void refetch()} />
        </div>
      ) : validations.length === 0 ? (
        <ValidationListEmptyState />
      ) : (
        <ResponsiveListFallback
          desktop={
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('validation.columns.type')}</TableHead>
                    <TableHead>{t('validation.columns.status')}</TableHead>
                    <TableHead>{t('validation.columns.version')}</TableHead>
                    <TableHead>{t('validation.columns.testDate')}</TableHead>
                    <TableHead>{t('validation.columns.submittedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validations.map((v: SoftwareValidation) => (
                    <TableRow
                      key={v.id}
                      className="relative cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {/* P2-3: NavLink 오버레이 — 행 클릭 패턴 통일 (TestSoftwareListContent와 동일) */}
                        <Link
                          href={FRONTEND_ROUTES.SOFTWARE_VALIDATIONS.DETAIL(v.id)}
                          className="absolute inset-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                          aria-label={t(`validationType.${v.validationType}`)}
                        />
                        {t(`validationType.${v.validationType}`)}
                      </TableCell>
                      <TableCell>
                        <ValidationStatusCell
                          status={v.status}
                          label={t(`validationStatus.${v.status}`)}
                        />
                      </TableCell>
                      <TableCell>{v.softwareVersion ?? '—'}</TableCell>
                      <TableCell>{v.testDate ? fmtDate(v.testDate) : '—'}</TableCell>
                      <TableCell>{v.submittedAt ? fmtDate(v.submittedAt) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
          mobile={
            <ul className="space-y-2" role="list">
              {validations.map((v: SoftwareValidation) => (
                <li key={v.id}>
                  <Link
                    href={FRONTEND_ROUTES.SOFTWARE_VALIDATIONS.DETAIL(v.id)}
                    className="block rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground">
                          {t(`validationType.${v.validationType}`)}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {v.softwareVersion && (
                            <span className="font-mono tabular-nums">v{v.softwareVersion}</span>
                          )}
                          {v.testDate && (
                            <>
                              <span aria-hidden>·</span>
                              <span>{fmtDate(v.testDate)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ValidationStatusCell
                        status={v.status}
                        label={t(`validationStatus.${v.status}`)}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          }
        />
      )}
    </div>
  );
}
