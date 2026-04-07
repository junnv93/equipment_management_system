'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { queryKeys } from '@/lib/api/query-config';
import { getSelfInspections } from '@/lib/api/self-inspection-api';
import type { Equipment } from '@/lib/api/equipment-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormNumberBadge } from '@/components/form-templates/FormNumberBadge';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, FileText } from 'lucide-react';
import { useDateFormatter } from '@/hooks/use-date-formatter';

const SelfInspectionFormDialog = dynamic(
  () => import('@/components/inspections/SelfInspectionFormDialog'),
  { ssr: false }
);

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

/** 기존 고정 컬럼 fallback 항목 — i18n 키 사용 */
const LEGACY_ITEM_KEYS = ['appearance', 'functionality', 'safety', 'calibrationStatus'] as const;

export function SelfInspectionTab({ equipment }: SelfInspectionTabProps) {
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();
  const equipmentId = String(equipment.id);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
          <CardTitle className="flex items-center gap-2">
            {t('selfInspection.title')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-05'].name} />
          </CardTitle>
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {t('selfInspection.title')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-05'].name} />
          </CardTitle>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <FileText className="h-4 w-4 mr-1" />
            {t('inspection.createButton')}
          </Button>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {t('selfInspection.empty')}
            </p>
          ) : (
            <div className="space-y-6">
              {inspections.map((inspection) => {
                const items =
                  inspection.items && inspection.items.length > 0
                    ? inspection.items
                    : LEGACY_ITEM_KEYS.map((key, idx) => ({
                        itemNumber: idx + 1,
                        checkItem: t(`selfInspection.${key}`),
                        checkResult: inspection[key],
                      }));

                return (
                  <div key={inspection.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{fmtDate(inspection.inspectionDate)}</span>
                        <Badge className={STATUS_COLORS[inspection.status]}>
                          {t(`selfInspection.statusLabel.${inspection.status}`)}
                        </Badge>
                        <Badge className={JUDGMENT_COLORS[inspection.overallResult]}>
                          {t(`selfInspection.judgment.${inspection.overallResult}`)}
                        </Badge>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">{t('selfInspection.itemNumber')}</TableHead>
                          <TableHead>{t('selfInspection.checkItem')}</TableHead>
                          <TableHead className="w-24">{t('selfInspection.checkResult')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={`${inspection.id}-${item.itemNumber}`}>
                            <TableCell>{item.itemNumber}</TableCell>
                            <TableCell>{item.checkItem}</TableCell>
                            <TableCell>
                              <Badge className={JUDGMENT_COLORS[item.checkResult]}>
                                {t(`selfInspection.judgment.${item.checkResult}`)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {inspection.remarks && (
                      <p className="text-muted-foreground text-sm">
                        <span className="font-medium">{t('selfInspection.remarks')}:</span>{' '}
                        {inspection.remarks}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <SelfInspectionFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          equipmentId={equipmentId}
        />
      )}
    </>
  );
}
