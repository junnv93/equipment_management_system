'use client';

import { useMemo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronRight, User, MonitorDot, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AUDIT_ACTION_BADGE_TOKENS,
  DEFAULT_AUDIT_ACTION_BADGE,
  AUDIT_TIMELINE_TOKENS,
  AUDIT_TIMELINE_DOT_COLORS,
  AUDIT_EMPTY_STATE_TOKENS,
  ANIMATION_PRESETS,
  getStaggerDelay,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { SYSTEM_USER_UUID } from '@equipment-management/schemas';
import { USER_ROLE_LABELS, type UserRole } from '@equipment-management/shared-constants';
import type { AuditLog, AuditAction } from '@equipment-management/schemas';

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

/**
 * 각 로그에 전역 flat index를 부여 (render 이전에 순수하게 계산)
 *
 * ✅ let counter++ 패턴을 피하는 이유:
 * React 18 Strict Mode / concurrent 렌더링에서 render 함수가 두 번 실행되면
 * mutable counter가 오염되어 stagger delay가 잘못 계산됩니다.
 */
function assignFlatIndex(
  groups: DateGroup[]
): Array<DateGroup['logs'][number] & { flatIdx: number }> {
  let idx = 0;
  const result: Array<DateGroup['logs'][number] & { flatIdx: number }> = [];
  for (const group of groups) {
    for (const log of group.logs) {
      result.push({ ...log, flatIdx: idx++ });
    }
  }
  return result;
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

// ── Props ────────────────────────────────────────────────────
interface AuditTimelineFeedProps {
  logs: AuditLog[];
  onLogClick: (log: AuditLog) => void;
  getActionLabel: (action: string) => string;
  getEntityTypeLabel: (entityType: string) => string;
}

/**
 * 감사 로그 타임라인 피드
 *
 * - 날짜별 그룹 헤더 (오늘/어제/날짜)
 * - 각 엔트리: 시간 | 도트+선 | 행위자 + 액션배지 + 대상 + (diff 미리보기)
 * - 삭제 액션: 경계 강조 (위험 시각화)
 * - 행 클릭: 우측 슬라이드 패널 열기
 */
export function AuditTimelineFeed({
  logs,
  onLogClick,
  getActionLabel,
  getEntityTypeLabel,
}: AuditTimelineFeedProps) {
  const t = useTranslations('audit');

  const groups = useMemo(
    () => groupByDate(logs, t('timeline.today'), t('timeline.yesterday')),
    [logs, t]
  );

  // render 전 flat index 계산 (concurrent-safe)
  const flatIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const group of groups) {
      for (const log of group.logs) {
        map.set(log.id, idx++);
      }
    }
    return map;
  }, [groups]);

  if (logs.length === 0) {
    return (
      <div
        className={cn(
          AUDIT_TIMELINE_TOKENS.emptyState,
          'border border-brand-border-subtle rounded-xl'
        )}
      >
        <History className={AUDIT_EMPTY_STATE_TOKENS.icon} />
        <p className={AUDIT_EMPTY_STATE_TOKENS.text}>{t('emptyLogs')}</p>
      </div>
    );
  }

  return (
    <div className={AUDIT_TIMELINE_TOKENS.entries} aria-label={t('logList')}>
      {groups.map((group) => (
        <div key={group.key}>
          {/* ── 날짜 그룹 헤더 ── */}
          <div className={AUDIT_TIMELINE_TOKENS.groupHeader}>
            <span className={AUDIT_TIMELINE_TOKENS.groupDate}>{group.label}</span>
            <span className={AUDIT_TIMELINE_TOKENS.groupLine} aria-hidden="true" />
            <span className={AUDIT_TIMELINE_TOKENS.groupCount}>
              {t('timeline.groupCount', { count: group.logs.length })}
            </span>
          </div>

          {/* ── 엔트리 목록 ── */}
          <div role="list">
            {group.logs.map((log, idxInGroup) => {
              const isLast = idxInGroup === group.logs.length - 1;
              const isDelete = log.action === 'delete';
              const isSystem = log.userId === SYSTEM_USER_UUID;
              const dotColor = AUDIT_TIMELINE_DOT_COLORS[log.action] ?? 'bg-brand-text-muted';
              const flatIdx = flatIndexMap.get(log.id) ?? 0;
              const diff = getFirstDiff(
                log.details?.previousValue as Record<string, unknown> | undefined,
                log.details?.newValue as Record<string, unknown> | undefined
              );

              return (
                <div
                  key={log.id}
                  role="listitem"
                  className={cn(
                    'grid gap-x-3',
                    AUDIT_TIMELINE_TOKENS.entry,
                    isDelete && AUDIT_TIMELINE_TOKENS.dangerEntry,
                    ANIMATION_PRESETS.fadeIn,
                    'motion-safe:duration-150'
                  )}
                  style={{
                    gridTemplateColumns: '56px 16px 1fr',
                    animationDelay: getStaggerDelay(Math.min(flatIdx, 9), 'list'),
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
                    dateTime={
                      typeof log.timestamp === 'string' ? log.timestamp : String(log.timestamp)
                    }
                  >
                    {format(new Date(log.timestamp), 'HH:mm')}
                  </time>

                  {/* 스파인 (도트 + 연결선) */}
                  <div className={AUDIT_TIMELINE_TOKENS.spineWrapper} aria-hidden="true">
                    <span className={cn(AUDIT_TIMELINE_TOKENS.dot, dotColor)} />
                    {!isLast && <span className={AUDIT_TIMELINE_TOKENS.line} />}
                  </div>

                  {/* 본문 */}
                  <div className={AUDIT_TIMELINE_TOKENS.contentWrapper}>
                    {/* 메인 행 */}
                    <div className={AUDIT_TIMELINE_TOKENS.mainRow}>
                      <span className={AUDIT_TIMELINE_TOKENS.actor}>
                        {isSystem ? t('systemActor') : log.userName}
                      </span>

                      <Badge
                        className={
                          AUDIT_ACTION_BADGE_TOKENS[log.action as AuditAction] ??
                          DEFAULT_AUDIT_ACTION_BADGE
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

                      {isDelete && (
                        <span className={AUDIT_TIMELINE_TOKENS.dangerLabel}>
                          {t('timeline.dangerLabel')}
                        </span>
                      )}
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
                          {USER_ROLE_LABELS[log.userRole as UserRole] ?? log.userRole}
                        </span>
                      )}
                      {log.ipAddress && (
                        <span className={AUDIT_TIMELINE_TOKENS.subMono}>{log.ipAddress}</span>
                      )}
                    </div>

                    {/* 인라인 Diff 미리보기 (변경 사항 있을 때만) */}
                    {diff && (
                      <div className={AUDIT_TIMELINE_TOKENS.diffPreview} aria-hidden="true">
                        <span className={AUDIT_TIMELINE_TOKENS.diffOld}>{diff.from}</span>
                        <span className={AUDIT_TIMELINE_TOKENS.diffArrow}>
                          {t('timeline.diffArrow')}
                        </span>
                        <span className={AUDIT_TIMELINE_TOKENS.diffNew}>{diff.to}</span>
                      </div>
                    )}
                  </div>

                  {/* 호버 화살표 */}
                  <ChevronRight
                    aria-hidden="true"
                    className={cn(AUDIT_TIMELINE_TOKENS.hoverArrow, 'h-4 w-4')}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
