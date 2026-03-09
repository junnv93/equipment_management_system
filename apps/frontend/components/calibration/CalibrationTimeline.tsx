'use client';

import { useState, useMemo } from 'react';
import { differenceInDays, startOfMonth, addMonths, format, getYear, getMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  CALIBRATION_TIMELINE,
  CALIBRATION_THRESHOLDS,
  getCalibrationTimelineTooltipTextClasses,
  getCalibrationDdayLabel,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

export interface CalibrationTimelineItem {
  equipmentId: string;
  equipmentName: string;
  nextCalibrationDate: string;
}

interface Props {
  items: CalibrationTimelineItem[];
}

const RANGE_START_OFFSET = -2;
const RANGE_END_OFFSET = 10;
const MAX_TOOLTIP_ITEMS = 5;

type SegmentUrgency = 'overdue' | 'warning' | 'ok' | 'empty';

interface MonthSegment {
  monthKey: string;
  monthLabel: string;
  urgency: SegmentUrgency;
  count: number;
  worstDays: number;
  items: Array<{ equipmentId: string; equipmentName: string; days: number }>;
}

function resolveUrgency(items: MonthSegment['items']): SegmentUrgency {
  if (items.length === 0) return 'empty';
  if (items.some((i) => i.days < 0)) return 'overdue';
  if (items.some((i) => i.days <= CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS))
    return 'warning';
  return 'ok';
}

function segmentColorClass(urgency: SegmentUrgency): string {
  if (urgency === 'overdue') return CALIBRATION_TIMELINE.segment.overdue;
  if (urgency === 'warning') return CALIBRATION_TIMELINE.segment.warning;
  if (urgency === 'ok') return CALIBRATION_TIMELINE.segment.ok;
  return '';
}

export default function CalibrationTimeline({ items }: Props) {
  const t = useTranslations('calibration');
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  const { monthSegments, todayLeftPct, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 월별 버킷 초기화 (RANGE_START_OFFSET ~ RANGE_END_OFFSET)
    const segmentMap = new Map<string, MonthSegment>();
    const monthKeys: string[] = [];

    for (let i = RANGE_START_OFFSET; i <= RANGE_END_OFFSET; i++) {
      const m = addMonths(today, i);
      const key = `${getYear(m)}-${String(getMonth(m) + 1).padStart(2, '0')}`;
      segmentMap.set(key, {
        monthKey: key,
        monthLabel: format(m, 'M월', { locale: ko }),
        urgency: 'empty',
        count: 0,
        worstDays: Infinity,
        items: [],
      });
      monthKeys.push(key);
    }

    // 장비별 중복 제거 후 월 버킷에 배분
    const deduped = new Map<string, CalibrationTimelineItem>();
    items.forEach((item) => {
      if (!deduped.has(item.equipmentId) && item.nextCalibrationDate) {
        deduped.set(item.equipmentId, item);
      }
    });

    deduped.forEach((item) => {
      const date = new Date(item.nextCalibrationDate);
      if (isNaN(date.getTime())) return;
      const key = `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`;
      const segment = segmentMap.get(key);
      if (!segment) return; // 범위 밖
      const days = differenceInDays(date, today);
      segment.items.push({
        equipmentId: item.equipmentId,
        equipmentName: item.equipmentName,
        days,
      });
      segment.count++;
      if (days < segment.worstDays) segment.worstDays = days;
    });

    // 긴급도 결정
    segmentMap.forEach((seg) => {
      seg.urgency = resolveUrgency(seg.items);
    });

    // 오늘 마커 위치 (전체 범위 기준 %)
    const rangeStart = startOfMonth(addMonths(today, RANGE_START_OFFSET));
    const rangeEnd = startOfMonth(addMonths(today, RANGE_END_OFFSET + 1));
    const rangeLength = differenceInDays(rangeEnd, rangeStart);
    const todayLeftPct = (differenceInDays(today, rangeStart) / rangeLength) * 100;

    const monthSegments = monthKeys.map((k) => segmentMap.get(k)!);
    const maxCount = Math.max(...monthSegments.map((s) => s.count), 1);

    return { monthSegments, todayLeftPct, maxCount };
  }, [items]);

  return (
    <div className={CALIBRATION_TIMELINE.container}>
      {/* 타임라인 트랙 */}
      <div className={CALIBRATION_TIMELINE.track}>
        {/* 배경 */}
        <div className={CALIBRATION_TIMELINE.trackBg} />

        {/* 월별 세그먼트 (flex — 각 컬럼이 1/N 너비) */}
        <div className="absolute inset-0 flex items-end gap-px px-0.5">
          {monthSegments.map((seg) => {
            const isActive = activeMonth === seg.monthKey;
            // 최소 20% 높이 보장 (막대가 너무 납작해지지 않도록)
            const heightPct = seg.count === 0 ? 0 : Math.max(20, (seg.count / maxCount) * 100);
            const colorClass = segmentColorClass(seg.urgency);
            const textClass =
              seg.count > 0 ? getCalibrationTimelineTooltipTextClasses(seg.worstDays) : '';

            return (
              <div
                key={seg.monthKey}
                className="relative flex-1 h-full flex flex-col justify-end"
                onMouseEnter={() => seg.count > 0 && setActiveMonth(seg.monthKey)}
                onMouseLeave={() => setActiveMonth(null)}
                onFocus={() => seg.count > 0 && setActiveMonth(seg.monthKey)}
                onBlur={() => setActiveMonth(null)}
                tabIndex={seg.count > 0 ? 0 : undefined}
                aria-label={
                  seg.count > 0
                    ? t('content.timeline.segmentLabel', {
                        month: seg.monthLabel,
                        count: seg.count,
                      })
                    : undefined
                }
              >
                {/* 세그먼트 막대 or 빈 마커 */}
                {seg.count > 0 ? (
                  <div
                    className={[
                      CALIBRATION_TIMELINE.segment.base,
                      colorClass,
                      isActive
                        ? CALIBRATION_TIMELINE.segment.active
                        : CALIBRATION_TIMELINE.segment.idle,
                    ].join(' ')}
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <div className={CALIBRATION_TIMELINE.segment.emptyBar} />
                )}

                {/* 툴팁 */}
                {isActive && (
                  <div className={CALIBRATION_TIMELINE.tooltip}>
                    {/* 월 헤더 + 건수 */}
                    <div className={`${CALIBRATION_TIMELINE.tooltipDday} ${textClass}`}>
                      {seg.monthLabel}&nbsp;
                      <span className="font-normal text-muted-foreground">
                        ({t('content.timeline.countUnit', { count: seg.count })})
                      </span>
                    </div>

                    {/* 장비 목록 */}
                    <div className="mt-1.5 space-y-0.5">
                      {seg.items.slice(0, MAX_TOOLTIP_ITEMS).map((item) => (
                        <div key={item.equipmentId} className={CALIBRATION_TIMELINE.tooltipName}>
                          <span className="truncate">{item.equipmentName}</span>
                          <span
                            className={`shrink-0 font-mono tabular-nums ${getCalibrationTimelineTooltipTextClasses(item.days)}`}
                          >
                            {getCalibrationDdayLabel(item.days)}
                          </span>
                        </div>
                      ))}
                      {seg.count > MAX_TOOLTIP_ITEMS && (
                        <div className={CALIBRATION_TIMELINE.tooltipMore}>
                          {t('content.timeline.moreItems', {
                            count: seg.count - MAX_TOOLTIP_ITEMS,
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 오늘 마커 (세그먼트 위에 렌더) */}
        {todayLeftPct >= 0 && todayLeftPct <= 100 && (
          <div
            className={CALIBRATION_TIMELINE.todayMarker}
            style={{ left: `${todayLeftPct.toFixed(1)}%` }}
          />
        )}
      </div>

      {/* 월 레이블 (세그먼트 컬럼과 동일 flex 구조로 정렬) */}
      <div className={CALIBRATION_TIMELINE.monthLabels}>
        {monthSegments.map((seg) => (
          <span key={seg.monthKey} className="flex-1 text-center">
            {seg.monthLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
