'use client';

import { useCallback, useMemo, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { List, type RowComponentProps } from 'react-window';
import { ChevronRight, User, MonitorDot, History, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AUDIT_ACTION_BADGE_TOKENS,
  DEFAULT_AUDIT_ACTION_BADGE,
  AUDIT_TIMELINE_TOKENS,
  AUDIT_TIMELINE_DOT_COLORS,
  AUDIT_EMPTY_STATE_TOKENS,
  REFETCH_OVERLAY_TOKENS,
  ANIMATION_PRESETS,
  getStaggerDelay,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { SYSTEM_USER_UUID } from '@equipment-management/schemas';
import type { AuditLog, AuditAction, UserRole } from '@equipment-management/schemas';

/**
 * 가상화 레이아웃 상수 (row 높이 리터럴 인라인 하드코딩 금지)
 *
 * ⚠️ 값 변경 시 entry 내부 padding/typography 와 함께 검증.
 * `entryRowHeight` = py-2.5 + content(~56px). `entryWithDiffExtraHeight` = diff preview 박스 + mt-1.5.
 */
const VIRTUALIZATION = {
  /** 날짜 그룹 헤더 행 고정 높이 (px) */
  headerRowHeight: 44,
  /** 일반 엔트리 행 기본 높이 (px) — padding 포함 */
  entryRowHeight: 76,
  /** 인라인 diff preview 포함 시 가산 높이 (px) */
  entryWithDiffExtraHeight: 36,
  /** overscan 행 수 — 가시 영역 위/아래 추가 렌더 */
  overscan: 6,
  /** List 컨테이너 기본 높이 — viewport 기반, 카드 패딩 + 상단 필터 영역 보정 */
  defaultListHeight: 'calc(100vh - 22rem)' as const,
  /** SSR / first paint 용 defaultHeight (px) */
  defaultHeightPx: 600,
  /** stagger 애니메이션 인덱스 cap — 이 값 초과 시 상수 delay 로 고정 */
  staggerCap: 9,
  /** 다음 페이지 prefetch 트리거 임계 — stopIndex >= rowCount - preloadAheadRows */
  preloadAheadRows: 3,
} as const;

// ── 날짜 그룹 타입 ────────────────────────────────────────────
interface DateGroup {
  key: string; // yyyy-MM-dd (정렬 키)
  label: string; // "오늘" | "어제" | "2026. 03. 08."
  logs: AuditLog[];
}

/** 로그 배열을 날짜별로 그룹화 */
function groupByDate(logs: AuditLog[], todayLabel: string, yesterdayLabel: string): DateGroup[] {
  const map = new Map<string, AuditLog[]>();

  for (const log of logs) {
    const key = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }

  return Array.from(map.entries()).map(([key, groupLogs]) => {
    const date = new Date(key);
    let label: string;
    if (isToday(date)) label = todayLabel;
    else if (isYesterday(date)) label = yesterdayLabel;
    else label = format(date, 'yyyy. MM. dd.');
    return { key, label, logs: groupLogs };
  });
}

/** 인라인 Diff 미리보기용 첫 변경 필드 추출 (최대 1개) */
function getFirstDiff(
  previousValue: Record<string, unknown> | undefined,
  newValue: Record<string, unknown> | undefined
): { field: string; from: string; to: string } | null {
  if (!previousValue || !newValue) return null;

  const allKeys = Array.from(new Set([...Object.keys(previousValue), ...Object.keys(newValue)]));
  for (const key of allKeys) {
    const from = previousValue[key];
    const to = newValue[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      const fmt = (v: unknown) =>
        v === null || v === undefined ? '-' : typeof v === 'object' ? '(object)' : String(v);
      return { field: key, from: fmt(from), to: fmt(to) };
    }
  }
  return null;
}

// ── Flat virtualization items ────────────────────────────────
type FlatHeaderItem = {
  kind: 'header';
  key: string;
  label: string;
  count: number;
};

type FlatEntryItem = {
  kind: 'entry';
  key: string;
  log: AuditLog;
  flatIdx: number;
  hasDiff: boolean;
  diff: { field: string; from: string; to: string } | null;
};

type FlatItem = FlatHeaderItem | FlatEntryItem;

// ── Row component — top-level (stable reference for react-window) ─
type AuditRowProps = {
  items: FlatItem[];
  onLogClick: (log: AuditLog) => void;
  getActionLabel: (action: string) => string;
  getEntityTypeLabel: (entityType: string) => string;
  systemActorLabel: string;
  dangerLabel: string;
  diffArrowLabel: string;
  groupCountLabel: (count: number) => string;
  diffSummaryLabel: (args: { field: string; from: string; to: string }) => string;
  roleLabel: (role: UserRole) => string;
};

function AuditTimelineRow({
  index,
  style,
  items,
  onLogClick,
  getActionLabel,
  getEntityTypeLabel,
  systemActorLabel,
  dangerLabel,
  diffArrowLabel,
  groupCountLabel,
  diffSummaryLabel,
  roleLabel,
}: RowComponentProps<AuditRowProps>) {
  const item = items[index];
  if (!item) return null;

  if (item.kind === 'header') {
    return (
      <div style={style}>
        <div className={AUDIT_TIMELINE_TOKENS.groupHeader}>
          <span className={AUDIT_TIMELINE_TOKENS.groupDate}>{item.label}</span>
          <span className={AUDIT_TIMELINE_TOKENS.groupLine} aria-hidden="true" />
          <span className={AUDIT_TIMELINE_TOKENS.groupCount}>{groupCountLabel(item.count)}</span>
        </div>
      </div>
    );
  }

  const log = item.log;
  const isDelete = log.action === 'delete';
  const isSystem = log.userId === SYSTEM_USER_UUID;
  const dotColor = AUDIT_TIMELINE_DOT_COLORS[log.action] ?? 'bg-brand-text-muted';
  const diff = item.diff;

  /**
   * 가상화 재마운트 jitter 방지:
   * 초기 `staggerCap` 개 row 에만 fadeIn 을 적용하고, 그 이후는 애니메이션 없이
   * 즉시 표시한다. 빠른 스크롤 시 row 가 언마운트/재마운트 되어도 동일 flatIdx 면
   * 일관되게 동작(처음 N개는 항상 fadeIn, N+1 부터는 항상 즉시 표시)하여
   * 느낌상의 jitter 가 사라진다.
   *
   * `ANIMATION_PRESETS.fadeIn` 은 이미 `motion-safe:` prefix 를 포함하므로
   * `prefers-reduced-motion` 환경에서는 이 레이어와 독립적으로 애니메이션이 꺼진다.
   */
  const shouldAnimate = item.flatIdx < VIRTUALIZATION.staggerCap;

  return (
    <div style={style}>
      <div
        role="listitem"
        className={cn(
          AUDIT_TIMELINE_TOKENS.entry,
          isDelete && AUDIT_TIMELINE_TOKENS.dangerEntry,
          shouldAnimate && ANIMATION_PRESETS.fadeIn,
          shouldAnimate && 'motion-safe:duration-200'
        )}
        style={{
          gridTemplateColumns: AUDIT_TIMELINE_TOKENS.entryGridCols,
          ...(shouldAnimate ? { animationDelay: getStaggerDelay(item.flatIdx, 'list') } : {}),
        }}
        onClick={() => onLogClick(log)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onLogClick(log);
          }
        }}
        aria-label={`${format(new Date(log.timestamp), 'HH:mm')} ${log.userName} ${getActionLabel(log.action)}`}
      >
        {/* 시간 */}
        <time
          className={AUDIT_TIMELINE_TOKENS.time}
          dateTime={typeof log.timestamp === 'string' ? log.timestamp : String(log.timestamp)}
        >
          {format(new Date(log.timestamp), 'HH:mm')}
        </time>

        {/* 스파인 (도트 + 연결선) */}
        <div className={AUDIT_TIMELINE_TOKENS.spineWrapper} aria-hidden="true">
          <span className={cn(AUDIT_TIMELINE_TOKENS.dot, dotColor)} />
          <span className={AUDIT_TIMELINE_TOKENS.line} />
        </div>

        {/* 본문 */}
        <div className={AUDIT_TIMELINE_TOKENS.contentWrapper}>
          {/* 메인 행 */}
          <div className={AUDIT_TIMELINE_TOKENS.mainRow}>
            <span className={AUDIT_TIMELINE_TOKENS.actor}>
              {isSystem ? systemActorLabel : log.userName}
            </span>

            <Badge
              className={
                AUDIT_ACTION_BADGE_TOKENS[log.action as AuditAction] ?? DEFAULT_AUDIT_ACTION_BADGE
              }
            >
              {getActionLabel(log.action)}
            </Badge>

            {log.entityName && (
              <span className={AUDIT_TIMELINE_TOKENS.targetText}>
                <span className={AUDIT_TIMELINE_TOKENS.targetId}>{log.entityName}</span>
              </span>
            )}

            <span className={AUDIT_TIMELINE_TOKENS.entityBadge}>
              {getEntityTypeLabel(log.entityType)}
            </span>

            {isDelete && <span className={AUDIT_TIMELINE_TOKENS.dangerLabel}>{dangerLabel}</span>}
          </div>

          {/* 서브 행 (역할, IP) */}
          <div className={AUDIT_TIMELINE_TOKENS.subRow}>
            {isSystem ? (
              <span className={AUDIT_TIMELINE_TOKENS.subItem}>
                <MonitorDot aria-hidden="true" className="h-3 w-3" />
                Scheduler
              </span>
            ) : (
              <span className={AUDIT_TIMELINE_TOKENS.subItem}>
                <User aria-hidden="true" className="h-3 w-3" />
                {roleLabel(log.userRole)}
              </span>
            )}
            {log.ipAddress && (
              <span className={AUDIT_TIMELINE_TOKENS.subMono}>{log.ipAddress}</span>
            )}
          </div>

          {/* 인라인 Diff 미리보기 (변경 사항 있을 때만) */}
          {diff && (
            <div
              className={AUDIT_TIMELINE_TOKENS.diffPreview}
              aria-label={diffSummaryLabel({
                field: diff.field,
                from: diff.from,
                to: diff.to,
              })}
            >
              <span className={AUDIT_TIMELINE_TOKENS.diffOld} aria-hidden="true">
                {diff.from}
              </span>
              <span className={AUDIT_TIMELINE_TOKENS.diffArrow} aria-hidden="true">
                {diffArrowLabel}
              </span>
              <span className={AUDIT_TIMELINE_TOKENS.diffNew} aria-hidden="true">
                {diff.to}
              </span>
            </div>
          )}
        </div>

        {/* 호버 화살표 */}
        <ChevronRight
          aria-hidden="true"
          className={cn(AUDIT_TIMELINE_TOKENS.hoverArrow, 'h-4 w-4')}
        />
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────
interface AuditTimelineFeedProps {
  logs: AuditLog[];
  onLogClick: (log: AuditLog) => void;
  getActionLabel: (action: string) => string;
  getEntityTypeLabel: (entityType: string) => string;
  /** 필터 전환 등으로 데이터 refetch 중일 때 로딩 오버레이 표시 */
  isRefetching?: boolean;
  /** 다음 페이지 존재 여부 (무한 스크롤) */
  hasNextPage?: boolean;
  /** 다음 페이지 로딩 중 */
  isFetchingNextPage?: boolean;
  /** 다음 페이지 로드 콜백 */
  onLoadMore?: () => void;
}

/**
 * 감사 로그 타임라인 피드 (react-window 가상화 + 무한 스크롤)
 *
 * 아키텍처:
 * - `react-window` `List` 로 flat row 가상화 — 헤더 행과 엔트리 행을 discriminated union `FlatItem` 으로 통합
 * - 행 높이는 `VIRTUALIZATION` 상수에서 파생 (헤더 / 엔트리 / diff 포함 엔트리)
 * - 무한 스크롤: `onRowsRendered` stopIndex 기반 prefetch — IntersectionObserver 센티널 불필요
 * - 기존 design tokens / a11y / 애니메이션 동작 보존
 */
export function AuditTimelineFeed({
  logs,
  onLogClick,
  getActionLabel,
  getEntityTypeLabel,
  isRefetching = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: AuditTimelineFeedProps) {
  const t = useTranslations('audit');
  const tCommon = useTranslations('common');

  const groups = useMemo(
    () => groupByDate(logs, t('timeline.today'), t('timeline.yesterday')),
    [logs, t]
  );

  // 그룹 → flat row 배열 (헤더 + 엔트리 인터리브). diff 계산도 여기서 1회 수행해 row 렌더 시 재계산 회피.
  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    let flatIdx = 0;
    for (const group of groups) {
      items.push({
        kind: 'header',
        key: `h:${group.key}`,
        label: group.label,
        count: group.logs.length,
      });
      for (const log of group.logs) {
        const diff = getFirstDiff(
          log.details?.previousValue as Record<string, unknown> | undefined,
          log.details?.newValue as Record<string, unknown> | undefined
        );
        items.push({
          kind: 'entry',
          key: log.id,
          log,
          flatIdx: flatIdx++,
          hasDiff: diff !== null,
          diff,
        });
      }
    }
    return items;
  }, [groups]);

  // row 높이: kind + hasDiff 로 파생. 리터럴 하드코딩 없음 — 전부 VIRTUALIZATION 상수.
  const getRowHeight = useCallback(
    (index: number) => {
      const item = flatItems[index];
      if (!item) return VIRTUALIZATION.entryRowHeight;
      if (item.kind === 'header') return VIRTUALIZATION.headerRowHeight;
      return item.hasDiff
        ? VIRTUALIZATION.entryRowHeight + VIRTUALIZATION.entryWithDiffExtraHeight
        : VIRTUALIZATION.entryRowHeight;
    },
    [flatItems]
  );

  // 무한 스크롤: 마지막 `preloadAheadRows` 행 근처 도달 시 onLoadMore 호출.
  // IntersectionObserver 센티널 제거 — react-window onRowsRendered 와 역할 중복 회피.
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;
  const handleRowsRendered = useCallback(
    (visibleRows: { startIndex: number; stopIndex: number }) => {
      if (
        hasNextPage &&
        !isFetchingNextPage &&
        visibleRows.stopIndex >= flatItems.length - VIRTUALIZATION.preloadAheadRows
      ) {
        onLoadMoreRef.current?.();
      }
    },
    [flatItems.length, hasNextPage, isFetchingNextPage]
  );

  const rowProps = useMemo<AuditRowProps>(
    () => ({
      items: flatItems,
      onLogClick,
      getActionLabel,
      getEntityTypeLabel,
      systemActorLabel: t('systemActor'),
      dangerLabel: t('timeline.dangerLabel'),
      diffArrowLabel: t('timeline.diffArrow'),
      groupCountLabel: (count: number) => t('timeline.groupCount', { count }),
      diffSummaryLabel: (args: { field: string; from: string; to: string }) =>
        t('timeline.diffSummary', args),
      roleLabel: (role: UserRole) => tCommon(`userRoles.${role}`),
    }),
    [flatItems, onLogClick, getActionLabel, getEntityTypeLabel, t, tCommon]
  );

  if (logs.length === 0) {
    return (
      <div className={AUDIT_TIMELINE_TOKENS.emptyState}>
        <History className={AUDIT_EMPTY_STATE_TOKENS.icon} />
        <p className={AUDIT_EMPTY_STATE_TOKENS.text}>{t('emptyLogs')}</p>
      </div>
    );
  }

  return (
    <div className={REFETCH_OVERLAY_TOKENS.wrapper}>
      {/* refetch 로딩 스피너 */}
      {isRefetching && (
        <div className={REFETCH_OVERLAY_TOKENS.spinnerOverlay} aria-live="polite">
          <Loader2 className={REFETCH_OVERLAY_TOKENS.spinner} aria-label={t('timeline.loading')} />
        </div>
      )}

      <div
        className={cn(
          AUDIT_TIMELINE_TOKENS.entries,
          isRefetching && REFETCH_OVERLAY_TOKENS.contentRefetching
        )}
        role="list"
        aria-label={t('logList')}
        aria-busy={isRefetching}
        style={{ height: VIRTUALIZATION.defaultListHeight }}
      >
        <List
          rowCount={flatItems.length}
          rowComponent={AuditTimelineRow}
          rowHeight={getRowHeight}
          rowProps={rowProps}
          overscanCount={VIRTUALIZATION.overscan}
          defaultHeight={VIRTUALIZATION.defaultHeightPx}
          onRowsRendered={handleRowsRendered}
          style={{ height: '100%' }}
        />

        {/* 다음 페이지 로딩 인디케이터 — List 외부, 하단 고정 */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4" aria-live="polite">
            <Loader2
              className="h-5 w-5 animate-spin text-muted-foreground"
              aria-label={t('timeline.loading')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
