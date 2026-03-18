'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Holidays from 'date-holidays';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type {
  OverdueCalibration,
  UpcomingCalibration,
  UpcomingCheckoutReturn,
} from '@/lib/api/dashboard-api';
import { DASHBOARD_CALENDAR_TOKENS as T } from '@/lib/design-tokens';
import { DISPLAY_LIMITS } from '@/lib/config/dashboard-config';

type EventType = 'overdue' | 'upcoming' | 'return';

interface CalendarEvent {
  id: string;
  label: string;
  type: EventType;
}

interface MiniCalendarProps {
  upcomingCalibrations: UpcomingCalibration[];
  upcomingCheckoutReturns: UpcomingCheckoutReturn[];
  overdueCalibrations?: OverdueCalibration[];
  className?: string;
}

function toDateKey(dateStr: string): string {
  return dateStr.slice(0, 10);
}

export function MiniCalendar({
  upcomingCalibrations,
  upcomingCheckoutReturns,
  overdueCalibrations = [],
  className,
}: MiniCalendarProps) {
  const t = useTranslations('dashboard.calendar');
  const locale = useLocale();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // 이벤트 맵 빌드
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    const push = (key: string, event: CalendarEvent) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    };

    overdueCalibrations.forEach((c) => {
      if (c.dueDate)
        push(toDateKey(c.dueDate), { id: c.id, label: c.equipmentName ?? c.name, type: 'overdue' });
    });

    upcomingCalibrations.forEach((c) => {
      if (c.dueDate)
        push(toDateKey(c.dueDate), { id: c.id, label: c.equipmentName, type: 'upcoming' });
    });

    upcomingCheckoutReturns.forEach((r) => {
      if (r.expectedReturnDate)
        push(toDateKey(r.expectedReturnDate), {
          id: r.checkoutItemId,
          label: r.equipmentName,
          type: 'return',
        });
    });

    return map;
  }, [overdueCalibrations, upcomingCalibrations, upcomingCheckoutReturns]);

  // 공휴일 맵 — 연도 단위로 memoize (date-holidays 'KR')
  const holidayYear = currentMonth.getFullYear();
  const holidayMap = useMemo(() => {
    const hd = new Holidays('KR');
    const map = new Map<string, string>();
    hd.getHolidays(holidayYear).forEach((h) => {
      if (h.type === 'public') {
        map.set(h.date.slice(0, 10), h.name);
      }
    });
    return map;
  }, [holidayYear]);

  // 달력 그리드 생성
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<null | { day: number; dateKey: string; events: CalendarEvent[] }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateKey, events: eventMap.get(dateKey) ?? [] });
    }

    return cells;
  }, [currentMonth, eventMap]);

  const handlePrev = useCallback(() => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }, []);

  // i18n dayLabels는 JSON 배열이므로 직접 처리
  const dayLabelsRaw = t.raw('dayLabels') as string[];

  const getDotClass = (type: EventType) => {
    if (type === 'overdue') return T.dotOverdue;
    if (type === 'upcoming') return T.dotUpcoming;
    return T.dotReturn;
  };

  const getPopupDotClass = (type: EventType) => {
    if (type === 'overdue') return cn(T.popupItemDot, 'bg-brand-critical');
    if (type === 'upcoming') return cn(T.popupItemDot, 'bg-brand-warning');
    return cn(T.popupItemDot, 'bg-brand-info');
  };

  const getEventTypeLabel = (type: EventType) => {
    if (type === 'overdue') return t('overdueCalib');
    if (type === 'upcoming') return t('upcomingCalib');
    return t('returnDue');
  };

  // 월 타이틀 포맷 — Intl.DateTimeFormat으로 로케일 자동 처리
  const monthTitle = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(currentMonth);

  return (
    <TooltipProvider>
      <div className={cn(T.container, className)} role="region" aria-label={t('ariaLabel')}>
        {/* 헤더: 월 이동 */}
        <div className={T.header}>
          <button
            type="button"
            onClick={handlePrev}
            className={T.navButton}
            aria-label={t('prevMonth')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className={T.title}>{monthTitle}</span>
          <button
            type="button"
            onClick={handleNext}
            className={T.navButton}
            aria-label={t('nextMonth')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className={T.grid}>
          {dayLabelsRaw.map((label, i) => (
            <div key={i} className={T.dayLabel}>
              {label}
            </div>
          ))}

          {/* 날짜 셀 */}
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} />;
            }

            const isToday = cell.dateKey === todayKey;
            const holidayName = holidayMap.get(cell.dateKey);
            const hasEvents = cell.events.length > 0 || !!holidayName;

            // 도트 타입 중복 제거 (같은 타입 도트는 1개만)
            const uniqueTypes = Array.from(new Set(cell.events.map((e) => e.type)));

            // 이벤트 있는 셀의 키보드 접근성 핸들러
            const handleCellKeyDown = hasEvents
              ? (e: React.KeyboardEvent<HTMLDivElement>) => {
                  // Enter/Space: 툴팁 트리거 (포커스 유지, Radix Tooltip이 처리)
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                  }
                }
              : undefined;

            const cellContent = (
              <div
                className={cn(T.cell, isToday && T.cellToday, hasEvents && 'cursor-pointer')}
                {...(hasEvents
                  ? {
                      tabIndex: 0,
                      role: 'button',
                      onKeyDown: handleCellKeyDown,
                      'aria-label': `${cell.dateKey}: ${cell.events.map((e) => e.label).join(', ')}${holidayName ? ` (${holidayName})` : ''}`,
                    }
                  : {})}
              >
                <span
                  className={cn(
                    T.cellNumber,
                    isToday ? T.cellNumberToday : holidayName ? T.cellNumberHoliday : undefined
                  )}
                >
                  {cell.day}
                </span>

                {/* 이벤트 도트 */}
                {uniqueTypes.length > 0 && (
                  <div className={T.dots}>
                    {uniqueTypes.map((type) => (
                      <span key={type} className={getDotClass(type)} aria-hidden="true" />
                    ))}
                  </div>
                )}
              </div>
            );

            if (!hasEvents) return <div key={cell.dateKey}>{cellContent}</div>;

            return (
              <Tooltip key={cell.dateKey}>
                <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[200px] p-2 bg-popover text-popover-foreground border border-border shadow-md"
                >
                  <div className="font-medium text-[11px] mb-1">
                    {cell.dateKey.slice(5).replace('-', '/')}
                  </div>
                  {holidayName && (
                    <div className="text-[10px] font-medium text-brand-critical mb-1">
                      {holidayName}
                    </div>
                  )}
                  {cell.events.slice(0, DISPLAY_LIMITS.calendarEvents).map((ev, i) => (
                    <div key={`${ev.id}-${i}`} className="flex items-center gap-1.5 py-0.5">
                      <span className={getPopupDotClass(ev.type)} aria-hidden="true" />
                      <span className="text-[10px] truncate max-w-[160px]" title={ev.label}>
                        {getEventTypeLabel(ev.type)}: {ev.label}
                      </span>
                    </div>
                  ))}
                  {cell.events.length > DISPLAY_LIMITS.calendarEvents && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      +{cell.events.length - DISPLAY_LIMITS.calendarEvents}건 더
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* 범례 */}
        <div className={T.legend}>
          <div className={T.legendItem}>
            <span className="text-[10px] font-medium text-brand-critical tabular-nums leading-none">
              1
            </span>
            <span className={T.legendText}>{t('legendHoliday')}</span>
          </div>
          <div className={T.legendItem}>
            <span className={cn(T.legendDot, 'bg-brand-critical')} />
            <span className={T.legendText}>{t('legendOverdue')}</span>
          </div>
          <div className={T.legendItem}>
            <span className={cn(T.legendDot, 'bg-brand-warning')} />
            <span className={T.legendText}>{t('legendUpcoming')}</span>
          </div>
          <div className={T.legendItem}>
            <span className={cn(T.legendDot, 'bg-brand-info')} />
            <span className={T.legendText}>{t('legendReturn')}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
