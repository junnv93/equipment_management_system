'use client';

import { memo, Fragment } from 'react';
import type { CSSProperties } from 'react';
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
  NC_WORKFLOW_TOKENS,
  NC_GUIDANCE_STEP_BADGE_TOKENS,
  NC_GUIDANCE_CTA_TOKENS,
  CALLOUT_TOKENS,
  getCalloutClasses,
  getNCWorkflowCompactDotClasses,
  FOCUS_TOKENS,
  getRoleChipClasses,
  type NCGuidanceKeyReachable,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { getNCMessageKey } from '@/lib/i18n/get-nc-message-key';

const ICON_MAP = {
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle2,
  Lock,
  ShieldCheck,
} as const;

export interface WorkflowStepInfo {
  label: string;
  isCurrent: boolean;
  date?: string;
}

interface GuidanceCalloutProps {
  guidanceKey: NCGuidanceKeyReachable;
  /** mini progress dot strip 통합 — 전달 시 callout header에 렌더 */
  workflowSteps?: WorkflowStepInfo[];
  isLongOverdue?: boolean;
  onScrollToAction?: () => void;
  onRepairRegister?: () => void;
  onCalibrationNav?: () => void;
}

export const GuidanceCallout = memo(function GuidanceCallout({
  guidanceKey,
  workflowSteps,
  isLongOverdue = false,
  onScrollToAction,
  onRepairRegister,
  onCalibrationNav,
}: GuidanceCalloutProps) {
  const t = useTranslations('non-conformances');
  const entry = NC_WORKFLOW_GUIDANCE_TOKENS[guidanceKey];
  const Icon = ICON_MAP[entry.icon];

  const isHero = entry.ctaKind !== 'none';
  const size = isHero ? ('hero' as const) : ('default' as const);
  const heroShadowStyle: CSSProperties | undefined = isHero
    ? ({
        ['--callout-hero-shadow' as string]: `color-mix(in oklch, var(--brand-${entry.variant}) 30%, transparent)`,
      } as CSSProperties)
    : undefined;

  const roleChipClasses = getRoleChipClasses(entry.roleChip);
  const currentStepIndex = workflowSteps ? workflowSteps.findIndex((s) => s.isCurrent) : -1;
  const currentStep = workflowSteps?.[currentStepIndex];

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-labelledby={`nc-guidance-title-${guidanceKey}`}
      data-testid="nc-guidance-callout"
      data-guidance-key={guidanceKey}
      className={getCalloutClasses(entry.variant, entry.emphasis, size)}
      style={heroShadowStyle}
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
        <div className={NC_GUIDANCE_STEP_BADGE_TOKENS.chipRow}>
          <span
            className={cn(
              NC_GUIDANCE_STEP_BADGE_TOKENS.base,
              NC_GUIDANCE_STEP_BADGE_TOKENS.variant[entry.variant]
            )}
          >
            {t(getNCMessageKey(`detail.guidance.stepBadge.${entry.stepBadgeKey}`))}
          </span>
          <span
            className={roleChipClasses.chip}
            aria-label={t(getNCMessageKey(`detail.guidance.roleChip.${entry.roleChip}`))}
          >
            <span aria-hidden="true" className={roleChipClasses.dot} />
            {t(getNCMessageKey(`detail.guidance.roleChip.${entry.roleChip}`))}
          </span>
        </div>

        {/* Mini progress dot strip (optional — compact Timeline 대체) */}
        {workflowSteps && workflowSteps.length > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            {/* sr-only: 스크린리더용 현재 단계 안내 */}
            <span className="sr-only">
              {t('detail.timeline.currentStep', { step: currentStep?.label ?? '' })}
            </span>
            {/* Visual dot strip */}
            <div className="flex items-center flex-1" aria-hidden="true">
              {workflowSteps.map((_, idx) => (
                <Fragment key={idx}>
                  {idx > 0 && (
                    <div
                      className={cn(
                        NC_WORKFLOW_TOKENS.compactConnector.base,
                        idx <= currentStepIndex
                          ? NC_WORKFLOW_TOKENS.compactConnector.done
                          : NC_WORKFLOW_TOKENS.compactConnector.pending
                      )}
                    />
                  )}
                  <div
                    className={getNCWorkflowCompactDotClasses(idx, currentStepIndex, isLongOverdue)}
                  />
                </Fragment>
              ))}
            </div>
            {/* 현재 단계 라벨 + 날짜 */}
            {currentStep && (
              <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                <span className={NC_WORKFLOW_TOKENS.compactCurrentLabel}>{currentStep.label}</span>
                {currentStep.date && (
                  <span className={NC_WORKFLOW_TOKENS.compactCurrentDate}>{currentStep.date}</span>
                )}
              </div>
            )}
          </div>
        )}

        <h2
          id={`nc-guidance-title-${guidanceKey}`}
          tabIndex={-1}
          className={CALLOUT_TOKENS.title(entry.variant)}
        >
          {t(getNCMessageKey(`detail.guidance.${guidanceKey}.title`))}
        </h2>
        <p className={CALLOUT_TOKENS.description}>
          {t(getNCMessageKey(`detail.guidance.${guidanceKey}.body`))}
        </p>
        {entry.ctaKind === 'primary' && entry.scrollTarget === 'actionBar' && onScrollToAction && (
          <div className={CALLOUT_TOKENS.action}>
            <button
              type="button"
              onClick={onScrollToAction}
              aria-label={t('detail.guidance.scrollToAction')}
              className={cn(
                NC_GUIDANCE_CTA_TOKENS.primarySolid(entry.variant),
                FOCUS_TOKENS.classes.default
              )}
            >
              {t(getNCMessageKey(`detail.guidance.${guidanceKey}.ctaHint`))}
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
        {entry.ctaKind === 'repairLink' && onRepairRegister && (
          <div className={CALLOUT_TOKENS.action}>
            <button
              type="button"
              onClick={onRepairRegister}
              className={cn(NC_GUIDANCE_CTA_TOKENS.secondaryOutlined, FOCUS_TOKENS.classes.default)}
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
              className={cn(NC_GUIDANCE_CTA_TOKENS.secondaryOutlined, FOCUS_TOKENS.classes.default)}
            >
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t(getNCMessageKey(`detail.guidance.${guidanceKey}.ctaHint`))}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});
