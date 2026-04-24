'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
}

export function HeroKPI({ label, value, trend, variant }: HeroKPIProps) {
  const valueColorClass = variant ? getSemanticContainerTextClasses(variant) : '';
  const tokens = CHECKOUT_STATS_VARIANTS.hero;

  return (
    <div className={`${tokens.surface} rounded-lg p-4 flex flex-col gap-1`}>
      <span className={tokens.label}>{label}</span>
      <span className={`${tokens.kpi} ${valueColorClass}`}>{value}</span>
      {trend && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {trend === 'up' && (
            <>
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">증가 추세</span>
            </>
          )}
          {trend === 'down' && (
            <>
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">감소 추세</span>
            </>
          )}
          {trend === 'flat' && (
            <>
              <Minus className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">변동 없음</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
