'use client';

import { useTranslations } from 'next-intl';
import {
  AUDIT_SUMMARY_TOKENS,
  AUDIT_SUMMARY_COLOR_MAP,
  AUDIT_ACTION_BADGE_TOKENS,
  DEFAULT_AUDIT_ACTION_BADGE,
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
  /** 현재 활성 액션 필터 ('' = 전체) */
  activeAction: string;
  /** 액션 필터 변경 콜백 */
  onActionChange: (action: string) => void;
}

/**
 * 감사 로그 액션별 요약 바
 *
 * - 전체 건수를 한눈에 확인 (전체 카드)
 * - 카드 클릭 시 해당 액션으로 필터링
 * - 각 액션 카드에 배지 미리보기 표시 (AUDIT_ACTION_BADGE_TOKENS SSOT 재사용)
 *
 * 설계 결정:
 * per-action 건수는 별도 stats API 없이 제공 불가.
 * "전체" 카드만 총 건수 표시, 나머지 카드는 배지 시각으로 필터 의미 전달.
 * em-dash(—) 대신 실제 액션 배지를 보여줌으로써 의미 있는 시각적 단서 제공.
 */
export function AuditSummaryBar({ total, activeAction, onActionChange }: AuditSummaryBarProps) {
  const t = useTranslations('audit');

  return (
    <div className={AUDIT_SUMMARY_TOKENS.grid} role="group" aria-label={t('filter')}>
      {SUMMARY_TILES.map(({ action, colorKey }) => {
        const isActive = activeAction === action;
        const isAll = action === '';
        const label = isAll ? t('filters.all') : t(`actions.${action}`);

        return (
          <button
            key={action === '' ? 'all' : action}
            type="button"
            aria-pressed={isActive}
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
            ) : (
              /*
               * 액션 카드: em-dash(—) 대신 해당 액션의 실제 배지를 축소 렌더링.
               * AUDIT_ACTION_BADGE_TOKENS SSOT 재사용 → 배지/도트/카드 색상 3곳 일관성 보장.
               */
              <span
                className={cn(
                  AUDIT_ACTION_BADGE_TOKENS[action as AuditAction] ?? DEFAULT_AUDIT_ACTION_BADGE,
                  'text-[9px] px-1.5 py-0.5 self-start mt-0.5'
                )}
                aria-hidden="true"
              >
                {label}
              </span>
            )}

            <span className={AUDIT_SUMMARY_TOKENS.sublabel}>{t('summary.actionFilter')}</span>
          </button>
        );
      })}
    </div>
  );
}
