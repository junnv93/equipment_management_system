'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ArrowDown,
  CalendarCheck,
} from 'lucide-react';
import {
  NC_WORKFLOW_GUIDANCE_TOKENS,
  NC_GUIDANCE_STEP_BADGE_TOKENS,
  CALLOUT_TOKENS,
  getCalloutClasses,
  FOCUS_TOKENS,
  type NCGuidanceKey,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle2,
  Lock,
  ShieldCheck,
} as const;

interface GuidanceCalloutProps {
  guidanceKey: NCGuidanceKey;
  onScrollToAction?: () => void;
  onRepairRegister?: () => void;
  onCalibrationNav?: () => void;
}

export const GuidanceCallout = memo(function GuidanceCallout({
  guidanceKey,
  onScrollToAction,
  onRepairRegister,
  onCalibrationNav,
}: GuidanceCalloutProps) {
  const t = useTranslations('non-conformances');
  const entry = NC_WORKFLOW_GUIDANCE_TOKENS[guidanceKey];
  const Icon = ICON_MAP[entry.icon];

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-labelledby={`nc-guidance-title-${guidanceKey}`}
      data-testid="nc-guidance-callout"
      data-guidance-key={guidanceKey}
      className={getCalloutClasses(entry.variant, entry.emphasis, 'default')}
    >
      <Icon
        className={cn(
          CALLOUT_TOKENS.icon.wrap,
          CALLOUT_TOKENS.icon.size,
          CALLOUT_TOKENS.icon.color(entry.variant)
        )}
        aria-hidden="true"
      />
      <div className={CALLOUT_TOKENS.body}>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              NC_GUIDANCE_STEP_BADGE_TOKENS.base,
              NC_GUIDANCE_STEP_BADGE_TOKENS.variant[entry.variant]
            )}
          >
            {t(`detail.guidance.stepBadge.${entry.stepBadgeKey}` as Parameters<typeof t>[0])}
          </span>
          <h2
            id={`nc-guidance-title-${guidanceKey}`}
            // tabIndex={-1} — 상태 전환 후 포커스 복귀 대상 (NCDetailClient useEffect)
            tabIndex={-1}
            className={CALLOUT_TOKENS.title(entry.variant)}
          >
            {t(`detail.guidance.${guidanceKey}.title` as Parameters<typeof t>[0])}
          </h2>
        </div>
        <p className={CALLOUT_TOKENS.description}>
          {t(`detail.guidance.${guidanceKey}.body` as Parameters<typeof t>[0])}
        </p>
        {entry.ctaKind === 'primary' && entry.scrollTarget === 'actionBar' && onScrollToAction && (
          <div className={CALLOUT_TOKENS.action}>
            <button
              type="button"
              onClick={onScrollToAction}
              aria-label={t('detail.guidance.scrollToAction')}
              className={cn(
                'text-sm text-brand-info hover:underline inline-flex items-center gap-1',
                FOCUS_TOKENS.classes.default
              )}
            >
              {t(`detail.guidance.${guidanceKey}.ctaHint` as Parameters<typeof t>[0])}
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
        {entry.ctaKind === 'repairLink' && onRepairRegister && (
          <div className={CALLOUT_TOKENS.action}>
            <button
              type="button"
              onClick={onRepairRegister}
              className={cn(
                'text-sm text-brand-info hover:underline inline-flex items-center gap-1',
                FOCUS_TOKENS.classes.default
              )}
            >
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              {t('detail.prerequisite.repairLink')}
            </button>
          </div>
        )}
        {entry.ctaKind === 'calibrationLink' && onCalibrationNav && (
          <div className={CALLOUT_TOKENS.action}>
            <button
              type="button"
              onClick={onCalibrationNav}
              className={cn(
                'text-sm text-brand-info hover:underline inline-flex items-center gap-1',
                FOCUS_TOKENS.classes.default
              )}
            >
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t(`detail.guidance.${guidanceKey}.ctaHint` as Parameters<typeof t>[0])}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});
