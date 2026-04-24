import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  ELEVATION_TOKENS,
  TYPOGRAPHY_TOKENS,
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

  return (
    <div
      className={`${ELEVATION_TOKENS.surface.floating} rounded-lg p-4 flex flex-col gap-1 bg-card`}
    >
      <span className={TYPOGRAPHY_TOKENS.kpiLabel}>{label}</span>
      <span className={`${TYPOGRAPHY_TOKENS.kpi} text-5xl ${valueColorClass}`}>{value}</span>
      {trend && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {trend === 'up' && <TrendingUp className="h-3 w-3" aria-hidden="true" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
          {trend === 'flat' && <Minus className="h-3 w-3" aria-hidden="true" />}
        </div>
      )}
    </div>
  );
}
