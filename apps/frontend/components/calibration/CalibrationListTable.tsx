'use client';

import { NavLink } from '@/components/navigation/nav-link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock, Eye, Pencil } from 'lucide-react';
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
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import type { CalibrationHistory } from '@/lib/api/calibration-api';

function resolveRowAction(
  item: CalibrationHistory,
  days: number | null
): 'register' | 'edit' | 'detail' | null {
  if (item.approvalStatus === 'pending_approval') return 'detail';
  if (item.approvalStatus === 'rejected') return 'edit';
  if (item.approvalStatus === 'approved') return 'detail';
  if (days !== null && days <= 30) return 'register';
  return null;
}

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
                className={`group ${CALIBRATION_TABLE.stripe} ${CALIBRATION_TABLE.rowHover} ${rowClasses} ${
                  isHighlighted
                    ? 'ring-2 ring-blue-400 ring-inset bg-blue-50 dark:bg-blue-950/40'
                    : ''
                }`}
              >
                <TableCell className="font-medium">
                  <NavLink
                    href={FRONTEND_ROUTES.CALIBRATION.BY_EQUIPMENT(item.equipmentId)}
                    variant="card"
                    className={CALIBRATION_TABLE.link}
                  >
                    {item.equipmentName}
                  </NavLink>
                </TableCell>
                <TableCell className={getManagementNumberClasses()}>
                  <NavLink
                    href={FRONTEND_ROUTES.CALIBRATION.BY_EQUIPMENT(item.equipmentId)}
                    variant="card"
                    className={`${getManagementNumberClasses()} ${CALIBRATION_TABLE.link}`}
                  >
                    {item.managementNumber}
                  </NavLink>
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
                    {(() => {
                      const action = resolveRowAction(item, days);
                      if (!action) return <span className="text-xs text-muted-foreground">-</span>;

                      const isRegisterLike = action === 'register' || action === 'edit';
                      const href = isRegisterLike
                        ? `/calibration/register?equipmentId=${item.equipmentId}`
                        : FRONTEND_ROUTES.EQUIPMENT.DETAIL(item.equipmentId);
                      const Icon = action === 'edit' ? Pencil : action === 'detail' ? Eye : Clock;
                      const label =
                        action === 'edit'
                          ? t('content.table.editCalibration')
                          : action === 'detail'
                            ? t('content.table.viewDetail')
                            : t('content.table.registerCalibration');

                      return (
                        <Button
                          variant={isRegisterLike ? 'outline' : 'ghost'}
                          size="sm"
                          className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                          onClick={() => router.push(href)}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {label}
                        </Button>
                      );
                    })()}
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
