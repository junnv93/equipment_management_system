'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';
import { getSelfInspections } from '@/lib/api/self-inspection-api';
import type { Equipment } from '@/lib/api/equipment-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AlertTriangle } from 'lucide-react';
import { useDateFormatter } from '@/hooks/use-date-formatter';

interface SelfInspectionTabProps {
  equipment: Equipment;
}

const JUDGMENT_COLORS: Record<string, string> = {
  pass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  fail: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  na: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function SelfInspectionTab({ equipment }: SelfInspectionTabProps) {
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();
  const equipmentId = String(equipment.id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.equipment.selfInspections(equipmentId),
    queryFn: () => getSelfInspections(equipmentId),
  });

  const inspections = data?.data ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('selfInspection.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-brand-warning" />
            <p className="text-muted-foreground mt-2 text-sm">{t('selfInspection.error')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('selfInspection.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {inspections.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            {t('selfInspection.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('selfInspection.date')}</TableHead>
                <TableHead>{t('selfInspection.appearance')}</TableHead>
                <TableHead>{t('selfInspection.functionality')}</TableHead>
                <TableHead>{t('selfInspection.safety')}</TableHead>
                <TableHead>{t('selfInspection.calibrationStatus')}</TableHead>
                <TableHead>{t('selfInspection.overallResult')}</TableHead>
                <TableHead>{t('selfInspection.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>{fmtDate(inspection.inspectionDate)}</TableCell>
                  <TableCell>
                    <Badge className={JUDGMENT_COLORS[inspection.appearance]}>
                      {t(`selfInspection.judgment.${inspection.appearance}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={JUDGMENT_COLORS[inspection.functionality]}>
                      {t(`selfInspection.judgment.${inspection.functionality}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={JUDGMENT_COLORS[inspection.safety]}>
                      {t(`selfInspection.judgment.${inspection.safety}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={JUDGMENT_COLORS[inspection.calibrationStatus]}>
                      {t(`selfInspection.judgment.${inspection.calibrationStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={JUDGMENT_COLORS[inspection.overallResult]}>
                      {t(`selfInspection.judgment.${inspection.overallResult}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[inspection.status]}>
                      {t(`selfInspection.statusLabel.${inspection.status}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
