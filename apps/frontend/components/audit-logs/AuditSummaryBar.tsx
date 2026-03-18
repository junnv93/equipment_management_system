'use client';

import { useTranslations } from 'next-intl';
import {
  AUDIT_SUMMARY_TOKENS,
  AUDIT_SUMMARY_COLOR_MAP,
  getAuditSummaryCardClasses,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { AuditAction } from '@equipment-management/schemas';

interface SummaryTile {
  action: '' | AuditAction;
  colorKey: keyof typeof AUDIT_SUMMARY_COLOR_MAP;
}

const SUMMARY_TILES: SummaryTile[] = [
  { action: '', colorKey: 'all' },
  { action: 'create', colorKey: 'create' },
  { action: 'update', colorKey: 'update' },
  { action: 'delete', colorKey: 'delete' },
  { action: 'approve', colorKey: 'approve' },
];

interface AuditSummaryBarProps {
  /** 현재 쿼리의 총 건수 (pagination.total) */
  total: number;
  /** 액션별 건수 맵 (백엔드 GROUP BY action 결과) */
  actionCounts?: Record<string, number>;
  /** 현재 활성 액션 필터 ('' = 전체) */
  activeAction: string;
  /** 액션 필터 변경 콜백 */
  onActionChange: (action: string) => void;
}

/**
 * 감사 로그 액션별 요약 바
 *
 * - 전체 건수 + 액션별 건수 한눈에 확인
 * - 카드 클릭 시 해당 액션으로 필터링
 * - 액션별 건수는 백엔드 GROUP BY action 결과로 제공 (summary 필드)
 */
export function AuditSummaryBar({
  total,
  actionCounts,
  activeAction,
  onActionChange,
}: AuditSummaryBarProps) {
  const t = useTranslations('audit');

  return (
    <div className={AUDIT_SUMMARY_TOKENS.grid} role="radiogroup" aria-label={t('filter')}>
      {SUMMARY_TILES.map(({ action, colorKey }) => {
        const isActive = activeAction === action;
        const isAll = action === '';
        const label = isAll ? t('filters.all') : t(`actions.${action}`);

        return (
          <button
            key={action === '' ? 'all' : action}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onActionChange(action)}
            className={getAuditSummaryCardClasses(isActive, colorKey)}
          >
            {/* 상단 색상 스트라이프 */}
            <span
              className={cn(AUDIT_SUMMARY_TOKENS.stripe, AUDIT_SUMMARY_COLOR_MAP[colorKey].stripe)}
              aria-hidden="true"
            />

            <span className={AUDIT_SUMMARY_TOKENS.label}>{label}</span>

            {isAll ? (
              /* 전체 카드: 실제 총 건수 표시 */
              <span
                className={cn(AUDIT_SUMMARY_TOKENS.count, AUDIT_SUMMARY_COLOR_MAP[colorKey].count)}
              >
                {total.toLocaleString()}
              </span>
            ) : actionCounts ? (
              /* 액션 카드: 백엔드 GROUP BY 결과로 실제 건수 표시 */
              <span
                className={cn(AUDIT_SUMMARY_TOKENS.count, AUDIT_SUMMARY_COLOR_MAP[colorKey].count)}
              >
                {(actionCounts[action] ?? 0).toLocaleString()}
              </span>
            ) : (
              /* 로딩 중 또는 summary 미제공 시 —로 대체 */
              <span
                className={cn(
                  AUDIT_SUMMARY_TOKENS.count,
                  AUDIT_SUMMARY_COLOR_MAP[colorKey].count,
                  AUDIT_SUMMARY_TOKENS.loadingPlaceholder
                )}
                aria-hidden="true"
              >
                —
              </span>
            )}

            <span className={AUDIT_SUMMARY_TOKENS.sublabel}>{t('summary.actionFilter')}</span>
          </button>
        );
      })}
    </div>
  );
}
