'use client';

import React, { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CHECKOUT_STATS_VARIANTS,
  getSemanticContainerTextClasses,
  type SemanticColorKey,
} from '@/lib/design-tokens';

interface HeroKPIProps {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'flat';
  variant?: SemanticColorKey;
  /**
   * 우상단 배지 슬롯 (예: 우선/긴급 표시).
   * SR 중복 회피 위해 호스트가 `aria-hidden` 처리 권장 — hero label에 이미 의미가 전달됨.
   * Phase 4.5 (GAP-3): wireframe 우상단 우선 배지 매칭.
   */
  badge?: ReactNode;
  meta?: ReactNode;
}

export const HeroKPI = React.memo(function HeroKPI({
  label,
  value,
  trend,
  variant,
  badge,
  meta,
}: HeroKPIProps) {
  const t = useTranslations('checkouts.heroKpi');
  const tokens = CHECKOUT_STATS_VARIANTS.hero;
  const valueColorClass = variant ? getSemanticContainerTextClasses(variant) : '';
  const surfaceClass = (variant && tokens.surfaceVariant[variant]) || tokens.surface;
  const labelColorClass = (variant && tokens.labelVariant[variant]) || '';

  return (
    <div className={`${surfaceClass} ${tokens.elevation} rounded-lg p-4 flex flex-col gap-1`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`${tokens.label} ${labelColorClass}`.trim()}>{label}</span>
        {badge}
      </div>
      <span className={`${tokens.kpi} ${valueColorClass}`.trim()}>{value}</span>
      {meta && <div className="text-xs text-muted-foreground leading-tight">{meta}</div>}
      {trend && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {trend === 'up' && (
            <>
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{t('trendUp')}</span>
            </>
          )}
          {trend === 'down' && (
            <>
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{t('trendDown')}</span>
            </>
          )}
          {trend === 'flat' && (
            <>
              <Minus className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{t('trendFlat')}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
});
