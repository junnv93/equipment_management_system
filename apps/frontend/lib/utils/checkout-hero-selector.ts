/**
 * Hero KPI 선택 SSOT — overdue 우선 priority 모델
 *
 * P1-1 (REVIEW_RESULT.md line 107-109): KPI 5-card 평탄화 → 1 hero + 4 mini.
 * Phase 4 boundary: overdue > 0 만 hero. pending hero 승격은 Phase 5 (P1-2)에서 결정.
 *
 * 향후 priority 확장 시 HERO_PRIORITY 배열에 condition 추가만으로 회귀 0.
 */

import type { CheckoutStatsVariant } from '@/lib/design-tokens';

export type HeroSelectionReason = 'overdue' | null;

export interface HeroSelection {
  heroVariantKey: CheckoutStatsVariant | null;
  reason: HeroSelectionReason;
}

export interface HeroSummaryInput {
  overdue: number;
  pending: number;
}

interface HeroPriorityRule {
  variantKey: CheckoutStatsVariant;
  reason: NonNullable<HeroSelectionReason>;
  condition: (summary: HeroSummaryInput) => boolean;
}

const HERO_PRIORITY: readonly HeroPriorityRule[] = [
  {
    variantKey: 'overdue',
    reason: 'overdue',
    condition: (summary) => summary.overdue > 0,
  },
  // 향후 확장 후보 (Phase 5):
  // { variantKey: 'pending', reason: 'pending', condition: (s) => s.pending > THRESHOLD }
] as const;

const NULL_SELECTION: HeroSelection = { heroVariantKey: null, reason: null };

export function selectHeroVariant(summary: HeroSummaryInput): HeroSelection {
  for (const rule of HERO_PRIORITY) {
    if (rule.condition(summary)) {
      return { heroVariantKey: rule.variantKey, reason: rule.reason };
    }
  }
  return NULL_SELECTION;
}
