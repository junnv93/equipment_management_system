'use client';

import {
  addMonths,
  differenceInDays,
  endOfMonth,
  format,
  getMonth,
  getYear,
  startOfMonth,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface MonthlyCalibrationCalendarItem {
  equipmentId: string;
  equipmentName: string;
  nextCalibrationDate: string;
}

interface Props {
  items: MonthlyCalibrationCalendarItem[];
  selectedStartDate?: string;
  selectedEndDate?: string;
  onSelectMonth: (range: { startDate: string; endDate: string }) => void;
}

interface MonthStats {
  key: string;
  label: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  total: number;
  overdue: number;
  warning: number;
  normal: number;
}

const MONTH_COUNT = 6;
const WARNING_DAYS = 30;

function toMonthKey(date: Date): string {
  return `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`;
}

function toDateParam(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function resolveSelected(
  startDate: string,
  endDate: string,
  selectedStart?: string,
  selectedEnd?: string
) {
  return selectedStart === startDate && selectedEnd === endDate;
}

function StackBar({ stats }: { stats: MonthStats }) {
  if (stats.total === 0) {
    return <div className="h-1.5 rounded-full bg-muted" aria-hidden="true" />;
  }

  const overduePct = (stats.overdue / stats.total) * 100;
  const warningPct = (stats.warning / stats.total) * 100;
  const normalPct = Math.max(0, 100 - overduePct - warningPct);

  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
      {stats.overdue > 0 && (
        <span className="bg-brand-critical" style={{ width: `${overduePct}%` }} />
      )}
      {stats.warning > 0 && (
        <span className="bg-brand-warning" style={{ width: `${warningPct}%` }} />
      )}
      {stats.normal > 0 && <span className="bg-brand-success" style={{ width: `${normalPct}%` }} />}
    </div>
  );
}

export default function MonthlyCalibrationCalendar({
  items,
  selectedStartDate,
  selectedEndDate,
  onSelectMonth,
}: Props) {
  const t = useTranslations('calibration');
  const months = useMemo<MonthStats[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonthKey = toMonthKey(today);

    const baseMonths = Array.from({ length: MONTH_COUNT }, (_, index) => {
      const monthStart = startOfMonth(addMonths(today, index));
      const monthEnd = endOfMonth(monthStart);
      return {
        key: toMonthKey(monthStart),
        label: format(monthStart, 'M월', { locale: ko }),
        year: format(monthStart, 'yyyy'),
        startDate: toDateParam(monthStart),
        endDate: toDateParam(monthEnd),
        isCurrent: toMonthKey(monthStart) === currentMonthKey,
        total: 0,
        overdue: 0,
        warning: 0,
        normal: 0,
      };
    });

    const monthMap = new Map(baseMonths.map((month) => [month.key, month]));
    const seen = new Set<string>();

    for (const item of items) {
      if (seen.has(item.equipmentId)) continue;
      seen.add(item.equipmentId);

      const date = new Date(item.nextCalibrationDate);
      if (Number.isNaN(date.getTime())) continue;

      const month = monthMap.get(toMonthKey(date));
      if (!month) continue;

      const days = differenceInDays(date, today);
      month.total += 1;
      if (days < 0) {
        month.overdue += 1;
      } else if (days <= WARNING_DAYS) {
        month.warning += 1;
      } else {
        month.normal += 1;
      }
    }

    return baseMonths;
  }, [items]);

  return (
    <section className="space-y-2" aria-labelledby="monthly-calibration-calendar-title">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 id="monthly-calibration-calendar-title" className="text-sm font-semibold">
            {t('content.monthlyCalendar.title')}
          </h2>
        </div>
        <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-critical" />
            {t('content.monthlyCalendar.overdueLegend')}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-warning" />
            {t('content.monthlyCalendar.warningLegend')}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-success" />
            {t('content.monthlyCalendar.normalLegend')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {months.map((month) => {
          const isSelected = resolveSelected(
            month.startDate,
            month.endDate,
            selectedStartDate,
            selectedEndDate
          );

          return (
            <button
              key={month.key}
              type="button"
              className={cn(
                'flex min-h-[116px] flex-col gap-2 rounded-lg border bg-card p-3 text-left transition hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                month.isCurrent && 'border-info/60 ring-1 ring-info/30',
                isSelected && 'border-info bg-info/5',
                month.overdue > 0 && 'border-l-[3px] border-l-brand-critical',
                month.overdue === 0 && month.warning > 0 && 'border-l-[3px] border-l-brand-warning'
              )}
              aria-pressed={isSelected}
              onClick={() => onSelectMonth({ startDate: month.startDate, endDate: month.endDate })}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {month.label}
                  {month.isCurrent && (
                    <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-[10px]">
                      {t('content.monthlyCalendar.currentMonth')}
                    </Badge>
                  )}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{month.year}</span>
              </div>
              <div className="font-mono text-3xl font-semibold leading-none tracking-normal">
                {month.total}
                <span className="ml-0.5 font-sans text-xs font-normal text-muted-foreground">
                  {t('content.stats.unitSuffix')}
                </span>
              </div>
              <StackBar stats={month} />
              <div className="mt-auto flex flex-wrap gap-1">
                {month.overdue > 0 && (
                  <Badge variant="outline" className="border-brand-critical/30 text-brand-critical">
                    {t('content.monthlyCalendar.overdueCount', { count: month.overdue })}
                  </Badge>
                )}
                {month.warning > 0 && (
                  <Badge variant="outline" className="border-brand-warning/30 text-brand-warning">
                    {t('content.monthlyCalendar.warningCount', { count: month.warning })}
                  </Badge>
                )}
                {month.total === 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t('content.monthlyCalendar.empty')}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
