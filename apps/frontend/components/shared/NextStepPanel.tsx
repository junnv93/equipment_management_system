'use client';

import { useCallback } from 'react';
import { Bell, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type {
  ActorVariant,
  CheckoutAction,
  NextStepDescriptor,
  NextActor,
  Urgency,
  UserRole,
} from '@equipment-management/schemas';
import { roleToActorVariant, UserRoleValues } from '@equipment-management/schemas';
import { resolveInlineActionVariant } from '@equipment-management/shared-constants';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InlineActionButton } from '@/components/ui/inline-action-button';
import {
  NEXT_STEP_PANEL_TOKENS,
  WORKFLOW_PANEL_TOKENS,
  ANIMATION_PRESETS,
  REDUCED_MOTION,
  MENU_ITEM_TOKENS,
  CHECKOUT_YOUR_TURN_BADGE_TOKENS,
} from '@/lib/design-tokens';
import { useOnboardingHint } from '@/hooks/use-onboarding-hint';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface OverflowAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface NextStepPanelProps {
  descriptor: NextStepDescriptor;
  variant?: 'floating' | 'inline' | 'compact' | 'hero';
  currentUserRole?: UserRole;
  onActionClick?: (action: CheckoutAction) => void | Promise<void>;
  isPending?: boolean;
  overflowActions?: OverflowAction[];
  className?: string;
  'data-testid'?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * FSM NextActor → 3-way UI ActorVariant 매핑.
 * approver/logistics: 결재 단계, lender: 반환 수령, 나머지: 요청자 계열
 */
function resolveActorVariant(nextActor: NextActor): ActorVariant {
  switch (nextActor) {
    case 'approver':
    case 'logistics':
      return 'approver';
    case 'lender':
      return 'receiver';
    default:
      return 'requester';
  }
}

/**
 * "내 차례" 뱃지 — 현재 사용자가 처리해야 하는 단계임을 시각적으로 표시.
 * urgency에 따라 색상 분기. terminal 분기에서는 렌더 안 됨.
 */
function YourTurnBadge({ urgency }: { urgency: Urgency }) {
  const t = useTranslations('checkouts.fsm');
  return (
    <span
      role="status"
      aria-label={t('yourTurn.ariaLabel')}
      className={cn(
        CHECKOUT_YOUR_TURN_BADGE_TOKENS.base,
        CHECKOUT_YOUR_TURN_BADGE_TOKENS.variant[urgency]
      )}
      data-testid="your-turn-badge"
      data-urgency={urgency}
    >
      <Bell className={CHECKOUT_YOUR_TURN_BADGE_TOKENS.icon} aria-hidden="true" />
      {t('yourTurn.label')}
    </span>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * 공용 NextStepPanel — FSM NextStepDescriptor를 렌더링.
 *
 * variant: floating(강조) / inline(그룹 카드 내) / compact(행 Zone 4) / hero(상세 헤더)
 * currentUserRole: actor variant 색 분기 (requester/approver/receiver)
 * overflowActions: compact variant 전용 DropdownMenu
 *
 * 접근성: role="region" aria-live hero/floating, "status" compact/inline, aria-atomic="true"
 * Sprint 4.1: variant + currentUserRole + data-variant + data-actor-variant 추가
 */
export function NextStepPanel({
  descriptor,
  variant = 'inline',
  currentUserRole,
  onActionClick,
  isPending = false,
  overflowActions,
  className,
  'data-testid': testId,
}: NextStepPanelProps) {
  const t = useTranslations('checkouts.fsm');
  const tCommon = useTranslations('common');
  const urgency = descriptor.urgency;
  const actorVariant = resolveActorVariant(descriptor.nextActor);
  const { isVisible: shouldPulse, dismiss: markDone } = useOnboardingHint('checkout-next-step');
  const pulseClass = shouldPulse ? REDUCED_MOTION.safe(ANIMATION_PRESETS.pulseHard) : '';

  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  const canAct = descriptor.availableToCurrentUser && !isPending;

  // 내 차례 판정 — system_admin은 availableToCurrentUser로 판단 (전체 역할 겸임)
  const userActorVariant = currentUserRole ? roleToActorVariant(currentUserRole) : null;
  const isMyTurn =
    currentUserRole === UserRoleValues.SYSTEM_ADMIN
      ? descriptor.availableToCurrentUser
      : userActorVariant !== null && userActorVariant === actorVariant;

  // ── Stable click handlers — InlineActionButton의 React.memo 효과 보존 ────────
  // 호출처가 inline arrow를 전달하면 매 렌더 새 함수 → memo 무력화. useCallback으로 stabilize.
  // panel:  hero / floating / inline 공용 (행 외부 컨텍스트 — stopPropagation 불필요)
  // compact: 행 Zone 4 (행 클릭과 충돌 회피 — stopPropagation 필수)
  const nextAction = descriptor.nextAction;
  const handlePanelClick = useCallback(() => {
    markDone();
    if (nextAction) onActionClick?.(nextAction);
  }, [markDone, nextAction, onActionClick]);
  const handleCompactClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      markDone();
      if (nextAction) onActionClick?.(nextAction);
    },
    [markDone, nextAction, onActionClick]
  );
  // sr-only loading 라벨 — atom의 도메인 중립성 보장 (atom은 i18n 모름)
  const loadingLabel = tCommon('loading');

  // ── Terminal state ─────────────────────────────────────────────────────────
  if (descriptor.nextAction === null) {
    const terminalContainerClass = isHero
      ? cn(
          NEXT_STEP_PANEL_TOKENS.container.hero,
          WORKFLOW_PANEL_TOKENS.actor[actorVariant].accent,
          className
        )
      : isCompact
        ? cn(NEXT_STEP_PANEL_TOKENS.container.compact, className)
        : cn(
            NEXT_STEP_PANEL_TOKENS.container[variant as 'floating' | 'inline'],
            NEXT_STEP_PANEL_TOKENS.urgency[urgency],
            ANIMATION_PRESETS.fadeIn,
            className
          );

    return (
      <div
        key={descriptor.currentStatus}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={terminalContainerClass}
        data-variant={variant}
        data-actor-variant={actorVariant}
        data-my-turn="false"
        data-testid={testId}
      >
        <span className={NEXT_STEP_PANEL_TOKENS.terminal.badge}>
          <CheckCircle2
            className={cn(NEXT_STEP_PANEL_TOKENS.terminal.icon, 'text-brand-ok')}
            aria-hidden="true"
          />
          {!isCompact && t('hint.terminal')}
        </span>
      </div>
    );
  }

  const stepLabel = `${t(`action.${descriptor.labelKey}`)} — ${descriptor.currentStepIndex}/${descriptor.totalSteps}`;

  // ── Hero variant ──────────────────────────────────────────────────────────
  if (isHero) {
    return (
      <section
        key={descriptor.currentStatus}
        role="region"
        aria-label={t('panelTitle')}
        aria-live={urgency === 'critical' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={cn(
          NEXT_STEP_PANEL_TOKENS.container.hero,
          NEXT_STEP_PANEL_TOKENS.urgency[urgency],
          WORKFLOW_PANEL_TOKENS.actor[actorVariant].border,
          WORKFLOW_PANEL_TOKENS.actor[actorVariant].accent,
          ANIMATION_PRESETS.fadeIn,
          className
        )}
        data-variant="hero"
        data-actor-variant={actorVariant}
        data-my-turn={isMyTurn ? 'true' : 'false'}
        data-testid={testId}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                WORKFLOW_PANEL_TOKENS.actor[actorVariant].icon
              )}
              aria-hidden="true"
            />
            <h2 className={WORKFLOW_PANEL_TOKENS.variant.hero.heading}>{t('panelTitle')}</h2>
            {isMyTurn && <YourTurnBadge urgency={urgency} />}
          </div>
          <span className={NEXT_STEP_PANEL_TOKENS.labels.actor}>
            {t(`actor.${descriptor.nextActor}`)}
          </span>
        </div>

        <p className={NEXT_STEP_PANEL_TOKENS.labels.current}>{stepLabel}</p>
        <p className={cn(NEXT_STEP_PANEL_TOKENS.labels.hint, 'mt-1')}>
          {t(`hint.${descriptor.hintKey}`)}
        </p>

        {canAct ? (
          <InlineActionButton
            variant={resolveInlineActionVariant({
              urgency,
              nextAction: descriptor.nextAction,
              isMyTurn,
            })}
            loading={isPending}
            loadingLabel={loadingLabel}
            aria-label={stepLabel}
            className={cn('mt-4', pulseClass)}
            onClick={handlePanelClick}
            data-testid={testId ? `${testId}-action` : undefined}
          >
            {t(`action.${descriptor.labelKey}`)}
          </InlineActionButton>
        ) : (
          <div className="mt-4">
            <InlineActionButton
              variant={resolveInlineActionVariant({
                urgency,
                nextAction: descriptor.nextAction,
                isMyTurn,
              })}
              disabled
              aria-label={stepLabel}
            >
              {t(`action.${descriptor.labelKey}`)}
            </InlineActionButton>
            {descriptor.blockingReason && (
              <p className={cn(NEXT_STEP_PANEL_TOKENS.labels.hint, 'mt-1.5 italic')}>
                {t(`blocked.${descriptor.blockingReason}`)}
              </p>
            )}
          </div>
        )}
      </section>
    );
  }

  // ── Compact variant (행 Zone 4) ───────────────────────────────────────────
  if (isCompact) {
    return (
      <div
        key={descriptor.currentStatus}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          NEXT_STEP_PANEL_TOKENS.container.compact,
          WORKFLOW_PANEL_TOKENS.actor[actorVariant].border,
          className
        )}
        data-variant="compact"
        data-actor-variant={actorVariant}
        data-my-turn={isMyTurn ? 'true' : 'false'}
        data-testid={testId}
      >
        <div className="flex items-center gap-1">
          <h3 className={WORKFLOW_PANEL_TOKENS.variant.compact.heading}>{t('panelTitle')}</h3>
          {isMyTurn && (
            <span
              role="status"
              aria-label={t('yourTurn.ariaLabel')}
              className={CHECKOUT_YOUR_TURN_BADGE_TOKENS.summary.container}
              data-testid="your-turn-badge"
              data-urgency={urgency}
            >
              ●
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              WORKFLOW_PANEL_TOKENS.actor[actorVariant].icon
            )}
            aria-hidden="true"
          />
          {!canAct && (
            <span className="text-xs text-muted-foreground truncate max-w-[72px]">
              {t(`action.${descriptor.labelKey}`)}
            </span>
          )}

          {canAct && (
            <InlineActionButton
              variant={resolveInlineActionVariant({
                urgency,
                nextAction: descriptor.nextAction,
                isMyTurn,
              })}
              loading={isPending}
              loadingLabel={loadingLabel}
              aria-label={stepLabel}
              onClick={handleCompactClick}
              data-testid={testId ? `${testId}-action` : undefined}
            >
              {t(`action.${descriptor.labelKey}`)}
            </InlineActionButton>
          )}

          {overflowActions && overflowActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={WORKFLOW_PANEL_TOKENS.overflow.trigger}
                  aria-label={t('panelTitle')}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={WORKFLOW_PANEL_TOKENS.overflow.menu} align="end">
                {overflowActions.map((action, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={action.variant === 'destructive' ? MENU_ITEM_TOKENS.destructive : ''}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  // ── floating / inline variants ────────────────────────────────────────────
  const containerClasses = cn(
    NEXT_STEP_PANEL_TOKENS.container[variant as 'floating' | 'inline'],
    NEXT_STEP_PANEL_TOKENS.urgency[urgency],
    ANIMATION_PRESETS.fadeIn,
    className
  );

  return (
    <div
      key={descriptor.currentStatus}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={containerClasses}
      data-variant={variant}
      data-actor-variant={actorVariant}
      data-my-turn={isMyTurn ? 'true' : 'false'}
      data-testid={testId}
    >
      {isMyTurn && <YourTurnBadge urgency={urgency} />}
      <p className={NEXT_STEP_PANEL_TOKENS.labels.current}>{stepLabel}</p>
      <p className={cn(NEXT_STEP_PANEL_TOKENS.labels.hint, 'mt-0.5')}>
        {t(`hint.${descriptor.hintKey}`)}
      </p>
      <p className={cn(NEXT_STEP_PANEL_TOKENS.labels.actor, 'mt-0.5')}>
        {t(`actor.${descriptor.nextActor}`)}
      </p>

      {canAct ? (
        <InlineActionButton
          variant={resolveInlineActionVariant({
            urgency,
            nextAction: descriptor.nextAction,
            isMyTurn,
          })}
          loading={isPending}
          loadingLabel={loadingLabel}
          aria-label={stepLabel}
          className={cn('mt-2', pulseClass)}
          onClick={handlePanelClick}
          data-testid={testId ? `${testId}-action` : undefined}
        >
          {t(`action.${descriptor.labelKey}`)}
        </InlineActionButton>
      ) : (
        <p className={cn(NEXT_STEP_PANEL_TOKENS.labels.actor, 'mt-2 not-italic')}>
          {descriptor.nextActor !== 'none' && t(`actor.${descriptor.nextActor}`)}
        </p>
      )}
    </div>
  );
}
