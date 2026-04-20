'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileCheck, Clock, CheckCircle2, XCircle, FileEdit } from 'lucide-react';
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
import { softwareValidationApi, type SoftwareValidation } from '@/lib/api/software-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import type { ValidationStatus } from '@equipment-management/schemas';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';

const STATUS_ICON: Record<ValidationStatus, React.ReactNode> = {
  draft: <FileEdit className="h-4 w-4 text-muted-foreground" />,
  submitted: <Clock className="h-4 w-4 text-yellow-600" />,
  approved: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
  quality_approved: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  rejected: <XCircle className="h-4 w-4 text-red-600" />,
};

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

export default function SoftwareValidationsListContent() {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();

  const { data, isLoading } = useQuery({
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
      ) : validations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileCheck className="mb-3 h-10 w-10" />
          <p>{t('validation.empty')}</p>
        </div>
      ) : (
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    window.location.href = FRONTEND_ROUTES.SOFTWARE_VALIDATIONS.DETAIL(v.id);
                  }}
                >
                  <TableCell className="font-medium">
                    {t(`validation.type.${v.validationType}`)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[v.status]}
                      className="flex w-fit items-center gap-1"
                    >
                      {STATUS_ICON[v.status]}
                      {t(`validation.status.${v.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{v.softwareVersion ?? '—'}</TableCell>
                  <TableCell>{v.testDate ? fmtDate(v.testDate) : '—'}</TableCell>
                  <TableCell>{v.submittedAt ? fmtDate(v.submittedAt) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
