'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Clock, AlertTriangle, PackageCheck, PackageOpen } from 'lucide-react';
import { HeroKPI } from '@/components/checkouts/HeroKPI';
import { SparklineMini } from '@/components/checkouts/SparklineMini';
import {
  getCheckoutStatsClasses,
  CHECKOUT_MOTION,
  CHECKOUT_STATS_VARIANTS,
  CHECKOUT_STATS_ALERT_THRESHOLD,
  getStatsGridClass,
  MICRO_TYPO,
  TYPOGRAPHY_TOKENS,
  type CheckoutStatsVariant,
} from '@/lib/design-tokens';
import { selectHeroVariant } from '@/lib/utils/checkout-hero-selector';
import {
  getCheckoutStatusGroupFilterValue,
  CheckoutStatusValues as CSVal,
} from '@equipment-management/schemas';
import type { CheckoutSummary } from '@equipment-management/schemas';
import type { UICheckoutFilters } from '@/lib/utils/checkout-filter-utils';

export interface OutboundStatsGridProps {
  summary: CheckoutSummary;
  filters: UICheckoutFilters;
  /** filterStatus 'all' = 전체 리셋, 그 외 = 상태 칩 활성화 */
  onStatActivate: (filterStatus: string) => void;
}

/** Sparkline 트렌드 — 전반부 vs 후반부 합산 비교. */
function deriveSparklineTrend(values: readonly number[]): 'up' | 'down' | 'flat' {
  if (values.length <= 1) return 'flat';
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const sum = (items: readonly number[]) => items.reduce((total, item) => total + item, 0);
  const delta = sum(secondHalf) - sum(firstHalf);
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

/** 5개 통계 카드 데이터 정의 — referential stability (Phase 4 P1-1). */
function useStatCards(summary: CheckoutSummary) {
  return useMemo(
    () => [
      {
        variantKey: 'total' as CheckoutStatsVariant,
        labelKey: 'outbound.totalCheckouts',
        subKey: 'outbound.totalSub',
        value: summary.total,
        trendKey: 'total' as const,
        icon: ClipboardList,
        filterStatus: 'all',
        dotColor: 'bg-brand-info',
      },
      {
        variantKey: 'pending' as CheckoutStatsVariant,
        labelKey: 'outbound.pendingApproval',
        subKey: 'outbound.pendingSub',
        value: summary.pending,
        trendKey: 'pending' as const,
        icon: Clock,
        filterStatus: 'pending',
        dotColor: 'bg-brand-warning',
      },
      {
        variantKey: 'checkedOut' as CheckoutStatsVariant,
        labelKey: 'outbound.inProgress',
        subKey: 'outbound.inProgressSub',
        value: summary.inProgress,
        trendKey: 'inProgress' as const,
        icon: PackageOpen,
        filterStatus: getCheckoutStatusGroupFilterValue('in_progress'),
        dotColor: 'bg-brand-purple',
      },
      {
        variantKey: 'overdue' as CheckoutStatsVariant,
        labelKey: 'outbound.overdue',
        subKey: 'outbound.overdueSub',
        value: summary.overdue,
        trendKey: 'overdue' as const,
        icon: AlertTriangle,
        filterStatus: CSVal.OVERDUE,
        dotColor: 'bg-brand-critical',
      },
      {
        variantKey: 'returned' as CheckoutStatsVariant,
        labelKey: 'outbound.returnToday',
        subKey: 'outbound.returnedSub',
        value: summary.returnedToday,
        trendKey: 'returnedToday' as const,
        icon: PackageCheck,
        filterStatus: getCheckoutStatusGroupFilterValue('completed'),
        dotColor: 'bg-brand-ok',
      },
    ],
    [summary.total, summary.pending, summary.inProgress, summary.overdue, summary.returnedToday]
  );
}

/**
 * 반출 탭 5개 통계 카드 그리드 (presentation + 파생 hook).
 *
 * 책임:
 * - useStatCards (5개 카드 정의)
 * - selectHeroVariant (hero 카드 결정 — overdue priority)
 * - deriveSparklineTrend (sparkline 트렌드 분석)
 * - 카드 활성화 → onStatActivate('all' | filterStatus)
 *
 * SSOT:
 * - `CHECKOUT_STATS_VARIANTS` / `CHECKOUT_STATS_ALERT_THRESHOLD` / `CHECKOUT_MOTION` (design-tokens)
 * - `getCheckoutStatsClasses` / `getStatsGridClass` (token helpers)
 * - `selectHeroVariant` (hero 우선순위 SSOT)
 *
 * a11y:
 * - 일반 카드: `role="button"` + `aria-pressed` + Enter/Space 처리
 * - Hero 카드: 우선 배지(`aria-hidden`) + composite aria-label
 */
export function OutboundStatsGrid({ summary, filters, onStatActivate }: OutboundStatsGridProps) {
  const t = useTranslations('checkouts');
  const statCards = useStatCards(summary);

  // Hero 선택 — Phase 4 P1-1 (overdue>0 priority, 향후 priority 확장은 selectHeroVariant)
  const { heroVariantKey } = useMemo(
    () => selectHeroVariant({ overdue: summary.overdue, pending: summary.pending }),
    [summary.overdue, summary.pending]
  );

  const filterActive =
    filters.status !== 'all' ||
    Boolean(filters.search) ||
    Boolean(filters.destination) ||
    Boolean(filters.purpose);
  const isAllActive = !filterActive;

  return (
    <div className={getStatsGridClass(!!heroVariantKey)}>
      {statCards.map((card) => {
        const isActive =
          card.filterStatus === 'all' ? isAllActive : filters.status === card.filterStatus;

        const isAlert =
          (card.variantKey === 'overdue' && summary.overdue > 0) ||
          (card.variantKey === 'pending' &&
            summary.pending > CHECKOUT_STATS_ALERT_THRESHOLD.pending);
        const isHero = card.variantKey === heroVariantKey;

        const variantTokens = CHECKOUT_STATS_VARIANTS[card.variantKey];
        const onActivate = () => onStatActivate(card.filterStatus);

        // Hero 카드: HeroKPI atom + alertRing wrapper + a11y 강조 시맨틱
        if (isHero) {
          const heroTokens = CHECKOUT_STATS_VARIANTS.hero;
          const heroWrapperClass = [
            heroTokens.containerInGrid,
            'rounded-lg',
            isAlert ? heroTokens.alertRing : '',
          ]
            .filter(Boolean)
            .join(' ');
          const priorityBadgeNode = isAlert ? (
            <span className={heroTokens.priorityBadge} aria-hidden="true">
              {t('outbound.priorityBadge')}
            </span>
          ) : null;
          const metaNode =
            card.variantKey === 'overdue' && summary.overdue > 0 ? (
              <span>
                {t('outbound.overdueMeta', {
                  average: summary.avgDelayDays,
                  max: summary.maxOverdueDays,
                })}
              </span>
            ) : undefined;
          const heroAriaLabel = isAlert
            ? t('outbound.priorityHeroAriaLabel', { label: t(card.labelKey) })
            : t(card.labelKey);
          return (
            <div
              key={card.variantKey}
              className={heroWrapperClass}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={heroAriaLabel}
              onClick={onActivate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onActivate();
                }
              }}
            >
              <HeroKPI
                label={t(card.labelKey)}
                value={card.value}
                variant="critical"
                badge={priorityBadgeNode}
                meta={metaNode}
              />
            </div>
          );
        }

        const finalCardClasses = [
          getCheckoutStatsClasses(card.variantKey, isActive, isAlert),
          CHECKOUT_MOTION.statsCard,
          'elevation' in variantTokens ? variantTokens.elevation : '',
        ]
          .filter(Boolean)
          .join(' ');

        const IconComponent = card.icon;
        const iconColorClass = isActive
          ? CHECKOUT_STATS_VARIANTS[card.variantKey].iconColor
          : 'text-muted-foreground';
        const sparklineValues = summary.trends?.[card.trendKey] ?? [];
        const sparklineTrend = deriveSparklineTrend(sparklineValues);

        return (
          <Card
            key={card.variantKey}
            className={finalCardClasses}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            aria-label={t(card.labelKey)}
            onClick={onActivate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate();
              }
            }}
          >
            <CardHeader
              className={
                'headerPadding' in variantTokens
                  ? variantTokens.headerPadding
                  : 'flex flex-row items-center justify-between p-3'
              }
            >
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${card.dotColor}`}
                  aria-hidden="true"
                />
                {t(card.labelKey)}
              </CardTitle>
              <IconComponent
                className={`h-3.5 w-3.5 shrink-0 ${iconColorClass}`}
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent
              className={'contentPadding' in variantTokens ? variantTokens.contentPadding : 'p-3'}
            >
              <div
                aria-label={`${t(card.labelKey)} ${t('list.count.unit', { value: card.value })}`}
                className={[
                  'valueTypography' in variantTokens
                    ? variantTokens.valueTypography
                    : `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums`,
                  card.variantKey === 'pending' && card.value > 0 ? 'text-brand-warning' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {card.value}
              </div>
              <p className={`${MICRO_TYPO.label} text-muted-foreground mt-0.5`}>{t(card.subKey)}</p>
              {isActive && (
                <p className={`${MICRO_TYPO.badge} text-primary font-semibold mt-1`}>
                  {t('outbound.activeFilter')}
                </p>
              )}
              {sparklineValues.length > 1 && (
                <SparklineMini values={sparklineValues} trend={sparklineTrend} variant="info" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
