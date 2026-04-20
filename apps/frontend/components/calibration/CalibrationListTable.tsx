'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock } from 'lucide-react';
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
import { useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { differenceInDays } from 'date-fns';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import {
  CALIBRATION_TABLE,
  CALIBRATION_EMPTY_STATE,
  getCalibrationDdayClasses,
  getCalibrationDdayLabel,
  getCalibrationRowClasses,
  getManagementNumberClasses,
} from '@/lib/design-tokens';
import type { CalibrationHistory } from '@/lib/api/calibration-api';

interface Props {
  data: CalibrationHistory[];
  isLoading: boolean;
  canRegister?: boolean;
  highlightId?: string;
}

export default function CalibrationListTable({
  data,
  isLoading,
  canRegister = true,
  highlightId,
}: Props) {
  const t = useTranslations('calibration');
  const router = useRouter();
  const { fmtDate } = useDateFormatter();
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, data]);

  // map 밖에서 한 번만 계산 (row마다 반복 방지)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  if (isLoading) {
    return (
      <div className={CALIBRATION_TABLE.wrapper}>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={CALIBRATION_EMPTY_STATE.container}>
        <CalendarDays className={CALIBRATION_EMPTY_STATE.icon} />
        <h3 className={CALIBRATION_EMPTY_STATE.title}>{t('content.empty.title')}</h3>
        <p className={CALIBRATION_EMPTY_STATE.description}>{t('content.empty.all')}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/calibration/register')}
        >
          {t('content.empty.registerButton')}
        </Button>
      </div>
    );
  }

  return (
    <div className={CALIBRATION_TABLE.wrapper}>
      <Table>
        <TableHeader className={CALIBRATION_TABLE.stickyHeader}>
          <TableRow>
            <TableHead>{t('content.table.equipmentName')}</TableHead>
            <TableHead>{t('content.table.managementNumber')}</TableHead>
            <TableHead>{t('content.table.team')}</TableHead>
            <TableHead>{t('content.table.calibrationDate')}</TableHead>
            <TableHead>{t('content.table.nextCalibrationDate')}</TableHead>
            <TableHead>{t('content.table.calibrationAgency')}</TableHead>
            <TableHead>{t('content.table.status')}</TableHead>
            {canRegister && (
              <TableHead className="text-right">{t('content.table.action')}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const days = item.nextCalibrationDate
              ? differenceInDays(new Date(item.nextCalibrationDate), today)
              : null;
            const ddayClasses = getCalibrationDdayClasses(days);
            const ddayLabel = getCalibrationDdayLabel(days);
            const rowClasses = getCalibrationRowClasses(item.approvalStatus);

            const isHighlighted = highlightId === item.id;

            return (
              <TableRow
                key={item.id}
                ref={isHighlighted ? highlightRef : undefined}
                className={`${CALIBRATION_TABLE.stripe} ${CALIBRATION_TABLE.rowHover} ${rowClasses} ${
                  isHighlighted
                    ? 'ring-2 ring-blue-400 ring-inset bg-blue-50 dark:bg-blue-950/40'
                    : ''
                }`}
              >
                <TableCell className="font-medium">
                  <Link href={`/equipment/${item.equipmentId}`} className={CALIBRATION_TABLE.link}>
                    {item.equipmentName}
                  </Link>
                </TableCell>
                <TableCell className={getManagementNumberClasses()}>
                  {item.managementNumber}
                </TableCell>
                <TableCell>{item.teamName || item.team || '-'}</TableCell>
                <TableCell className={CALIBRATION_TABLE.numericColumn}>
                  {fmtDate(item.calibrationDate)}
                </TableCell>
                <TableCell className={CALIBRATION_TABLE.numericColumn}>
                  {fmtDate(item.nextCalibrationDate)}
                </TableCell>
                <TableCell>{item.calibrationAgency}</TableCell>
                <TableCell>
                  <span className={ddayClasses}>{ddayLabel}</span>
                </TableCell>
                {canRegister && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/calibration/register?equipmentId=${item.equipmentId}`)
                      }
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      {t('content.table.registerCalibration')}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
