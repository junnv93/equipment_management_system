'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { notifyCheckoutAction } from '@/lib/checkouts/toast-templates';
import { cn } from '@/lib/utils';
import { AlertTriangle, CalendarDays, Building, ChevronDown, CheckCheck } from 'lucide-react';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import { CheckoutMiniProgress } from '@/components/checkouts/CheckoutMiniProgress';
import { NextStepPanel, type OverflowAction } from '@/components/shared/NextStepPanel';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import checkoutApi from '@/lib/api/checkout-api';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import { isConflictError } from '@/lib/api/error';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  type CheckoutAction,
  type NextStepDescriptor,
  type UserSelectableCheckoutPurpose,
} from '@equipment-management/schemas';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@equipment-management/schemas';
import { useCheckoutGroupDescriptors } from '@/hooks/use-checkout-group-descriptors';
import {
  CHECKOUT_MOTION,
  CHECKOUT_PURPOSE_TOKENS,
  CHECKOUT_OVERDUE_GROUP_TOKENS,
  CHECKOUT_ITEM_ROW_TOKENS,
  CHECKOUT_INTERACTION_TOKENS,
  CHECKOUT_YOUR_TURN_BADGE_TOKENS,
  getPurposeBarClass,
  getDdayClasses,
  formatDday,
  FONT,
  getManagementNumberClasses,
  MICRO_TYPO,
  ANIMATION_PRESETS,
  getStaggerFadeInStyle,
} from '@/lib/design-tokens';

// ============================================================================
// Helpers
// ============================================================================

function calculateDaysRemaining(expectedReturnDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const returnDate = new Date(expectedReturnDate);
  returnDate.setHours(0, 0, 0, 0);
  return Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// Types
// ============================================================================

interface CheckoutGroupCardProps {
  group: CheckoutGroup;
  onCheckoutClick: (checkoutId: string) => void;
  isOverdueGroup?: boolean;
}

interface EquipmentRow {
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  purpose: string;
  status: string;
  checkoutType: 'calibration' | 'repair' | 'rental';
  userName: string;
  checkoutId: string;
  expectedReturnDate: string | undefined;
  destination: string | undefined;
  canApproveItem: boolean;
  canReturnItem: boolean;
  descriptor: NextStepDescriptor | undefined;
}

// ============================================================================
// CheckoutGroupCard
// ============================================================================

function CheckoutGroupCard({
  group,
  onCheckoutClick,
  isOverdueGroup = false,
}: CheckoutGroupCardProps) {
  const t = useTranslations('checkouts');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(isOverdueGroup);

  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole | undefined) ?? 'test_engineer';

  const descriptorMap = useCheckoutGroupDescriptors(group.checkouts, role);

  const equipmentRows = useMemo(
    () =>
      group.checkouts.flatMap((checkout) => {
        const descriptor = descriptorMap.get(checkout.id);
        return (checkout.equipment || []).map((equip) => ({
          equipmentId: equip.id,
          equipmentName: equip.name,
          managementNumber: equip.managementNumber,
          purpose: checkout.purpose,
          status: checkout.status,
          checkoutType: (checkout.purpose ?? 'calibration') as UserSelectableCheckoutPurpose,
          userName: checkout.user?.name || t('groupCard.unknownUser'),
          checkoutId: checkout.id,
          expectedReturnDate: checkout.expectedReturnDate,
          destination: checkout.destination,
          canApproveItem: checkout.meta?.availableActions?.canApprove ?? false,
          canReturnItem: checkout.meta?.availableActions?.canReturn ?? false,
          descriptor,
        }));
      }),
    [group.checkouts, t, descriptorMap]
  );

  const pendingCount = useMemo(
    () => group.checkouts.filter((co) => co.status === CSVal.PENDING).length,
    [group.checkouts]
  );

  const yourTurnCount = useMemo(() => {
    let count = 0;
    for (const co of group.checkouts) {
      if (descriptorMap.get(co.id)?.availableToCurrentUser === true) count++;
    }
    return count;
  }, [group.checkouts, descriptorMap]);

  const canApproveBulk = useMemo(
    () =>
      group.checkouts
        .filter((co) => co.status === CSVal.PENDING)
        .some((co) => co.meta?.availableActions?.canApprove ?? false),
    [group.checkouts]
  );

  const isRentalGroup = group.purposes.includes(CPVal.RENTAL as never);
  const rentalStatus = isRentalGroup
    ? (group.checkouts.find((co) => co.purpose === CPVal.RENTAL)?.status ?? '')
    : '';

  const rentalDescriptor = useMemo(() => {
    const rentalCheckout = group.checkouts.find((co) => co.purpose === CPVal.RENTAL);
    if (!rentalCheckout) return undefined;
    return descriptorMap.get(rentalCheckout.id);
  }, [group.checkouts, descriptorMap]);

  // ── 인라인 승인 mutation (fresh CAS) ──────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: async ({ id }: { id: string; equipmentName?: string }) => {
      const { version } = await checkoutApi.getCheckout(id);
      return checkoutApi.approveCheckout(id, version);
    },
    onSuccess: (_data, variables) => {
      notifyCheckoutAction(toast, 'approve', { equipmentName: variables.equipmentName ?? '' }, t);
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        toast({
          title: t('toasts.versionConflict'),
          description: t('toasts.versionConflictDesc'),
          variant: 'destructive',
        });
      } else {
        toast({ title: t('toasts.approveError'), variant: 'destructive' });
      }
    },
    onSettled: () => {
      CheckoutCacheInvalidation.invalidateAfterApproval(queryClient);
    },
  });

  // ── Row-level NextStepPanel action dispatcher ────────────────────────────
  const handleRowAction = useCallback(
    (checkoutId: string, equipmentName: string) => (action: CheckoutAction) => {
      switch (action) {
        case 'approve':
        case 'borrower_approve':
          approveMutation.mutate({ id: checkoutId, equipmentName });
          break;
        default:
          onCheckoutClick(checkoutId);
          break;
      }
    },
    [approveMutation, onCheckoutClick]
  );

  // ── Row overflow actions (reject → 상세 이동, fail-closed) ────────────────
  const buildRowOverflowActions = useCallback(
    (row: EquipmentRow): OverflowAction[] => {
      const actions: OverflowAction[] = [];
      if (row.canApproveItem && row.status === CSVal.PENDING) {
        actions.push({
          label: t('actions.reject'),
          onClick: () => onCheckoutClick(row.checkoutId),
          variant: 'destructive',
        });
      }
      return actions;
    },
    [t, onCheckoutClick]
  );

  // ── Group card 스타일 ─────────────────────────────────────────────────────
  const cardClass = isOverdueGroup
    ? `overflow-hidden ${CHECKOUT_OVERDUE_GROUP_TOKENS.card}`
    : 'overflow-hidden';
  const headerContainerClass = isOverdueGroup
    ? `${CHECKOUT_ITEM_ROW_TOKENS.groupHeaderContainer} ${CHECKOUT_OVERDUE_GROUP_TOKENS.header}`
    : CHECKOUT_ITEM_ROW_TOKENS.groupHeaderContainer;

  return (
    <TooltipProvider>
      <Card className={cardClass}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* ── 그룹 헤더 ── */}
          <div className={headerContainerClass}>
            <CollapsibleTrigger asChild>
              <button type="button" className={CHECKOUT_ITEM_ROW_TOKENS.groupHeaderInfoTrigger}>
                {isOverdueGroup && (
                  <span
                    className={`flex items-center gap-1.5 ${CHECKOUT_OVERDUE_GROUP_TOKENS.headerText}`}
                  >
                    <AlertTriangle
                      className={CHECKOUT_OVERDUE_GROUP_TOKENS.alertIcon}
                      aria-hidden="true"
                    />
                    {t('groupCard.overdueGroupLabel')}
                  </span>
                )}

                {!isOverdueGroup && (
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${FONT.mono}`}>
                    <CalendarDays
                      className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                      aria-hidden="true"
                    />
                    <span>{group.date}</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      ({t(group.dateLabel)})
                    </span>
                  </div>
                )}

                {!isOverdueGroup && (
                  <div className="flex items-center gap-1.5 text-sm min-w-0">
                    <Building
                      className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                      aria-hidden="true"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={CHECKOUT_INTERACTION_TOKENS.destinationLabel}>
                          {group.destinationKey ? t(group.destinationKey) : group.destination}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{group.destinationKey ? t(group.destinationKey) : group.destination}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-1">
                  {group.purposes.map((purpose) => (
                    <Badge
                      key={purpose}
                      variant="outline"
                      className={`${MICRO_TYPO.badge} py-0 ${CHECKOUT_PURPOSE_TOKENS[purpose as keyof typeof CHECKOUT_PURPOSE_TOKENS]?.badge ?? ''}`}
                    >
                      {t(`purpose.${purpose}`)}
                    </Badge>
                  ))}
                </div>

                {isRentalGroup && rentalStatus && rentalDescriptor && (
                  <NextStepPanel variant="compact" descriptor={rentalDescriptor} />
                )}
              </button>
            </CollapsibleTrigger>

            {yourTurnCount > 0 && (
              <span
                data-testid="your-turn-summary"
                className={CHECKOUT_YOUR_TURN_BADGE_TOKENS.summary.container}
                aria-label={t('yourTurn.summaryAria', { count: yourTurnCount })}
              >
                {t('yourTurn.count', { count: yourTurnCount })}
              </span>
            )}

            {canApproveBulk && pendingCount > 0 && (
              <Button
                size="sm"
                className={CHECKOUT_ITEM_ROW_TOKENS.actionButtons.bulkApprove}
                onClick={() =>
                  group.checkouts
                    .filter((co) => co.status === CSVal.PENDING)
                    .forEach((co) => approveMutation.mutate({ id: co.id }))
                }
                disabled={approveMutation.isPending}
              >
                <CheckCheck className="h-3 w-3" />
                {t('actions.bulkApprove')} ({pendingCount})
              </Button>
            )}

            <span className={CHECKOUT_ITEM_ROW_TOKENS.countBadge}>
              {t('groupCard.equipmentCount', { count: group.totalEquipment })}
            </span>

            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={CHECKOUT_ITEM_ROW_TOKENS.groupHeaderChevronBtn}
                aria-label={isOpen ? t('groupCard.collapse') : t('groupCard.expand')}
              >
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground ${CHECKOUT_MOTION.chevronRotate} ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </CollapsibleTrigger>
          </div>

          {/* ── 장비 행 목록 ── */}
          <CollapsibleContent>
            {equipmentRows.length === 0 ? (
              <div className="border-t border-border/50 px-4 py-6 text-center text-sm text-muted-foreground">
                {t('groupCard.noEquipment')}
              </div>
            ) : (
              // role="grid" — WAI-ARIA grid pattern: role="row" + role="gridcell" 조합에 필요
              <div
                role="grid"
                aria-label={t('groupCard.equipmentCount', { count: group.totalEquipment })}
                className="border-t border-border/50"
              >
                {equipmentRows.map((row, rowIndex) => {
                  const daysRemaining = row.expectedReturnDate
                    ? calculateDaysRemaining(row.expectedReturnDate)
                    : null;
                  const isRowOverdue = row.status === CSVal.OVERDUE;
                  const rowBaseClass = isRowOverdue
                    ? `${CHECKOUT_ITEM_ROW_TOKENS.container} ${CHECKOUT_ITEM_ROW_TOKENS.containerOverdue}`
                    : CHECKOUT_ITEM_ROW_TOKENS.container;

                  return (
                    <div
                      key={`${row.checkoutId}-${row.equipmentId}`}
                      role="row"
                      tabIndex={0}
                      aria-label={t('groupCard.rowAria', {
                        equipment: row.equipmentName,
                        status: t(`status.${row.status}`),
                        dday: daysRemaining !== null ? formatDday(daysRemaining) : '',
                      })}
                      onClick={() => onCheckoutClick(row.checkoutId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onCheckoutClick(row.checkoutId);
                        }
                      }}
                      className={cn(
                        rowBaseClass,
                        CHECKOUT_ITEM_ROW_TOKENS.grid,
                        ANIMATION_PRESETS.staggerFadeInItem
                      )}
                      style={getStaggerFadeInStyle(rowIndex, 'grid')}
                    >
                      {/* Zone 1: purposeBar (3px) */}
                      <span
                        className={cn(
                          CHECKOUT_ITEM_ROW_TOKENS.purposeBar.base,
                          getPurposeBarClass(row.purpose)
                        )}
                        aria-hidden="true"
                      />

                      {/* Zone 2: status + D-day 세로 스택 (72px) */}
                      <div role="gridcell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneStatus}>
                        <CheckoutStatusBadge
                          status={row.status}
                          className={`${MICRO_TYPO.badge} py-0 max-w-[68px] truncate`}
                        />
                        {daysRemaining !== null && (
                          <span
                            className={`${CHECKOUT_ITEM_ROW_TOKENS.dday} ${getDdayClasses(daysRemaining)}`}
                          >
                            {formatDday(daysRemaining)}
                          </span>
                        )}
                      </div>

                      {/* Zone 3: identity — 장비명 + meta (1fr) */}
                      <div role="gridcell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneIdentity}>
                        <div className={CHECKOUT_ITEM_ROW_TOKENS.nameRow}>
                          <span className={CHECKOUT_ITEM_ROW_TOKENS.name}>{row.equipmentName}</span>
                          <code
                            className={`${CHECKOUT_ITEM_ROW_TOKENS.mgmt} ${getManagementNumberClasses()}`}
                          >
                            {row.managementNumber}
                          </code>
                        </div>
                        <p className={CHECKOUT_ITEM_ROW_TOKENS.meta}>
                          {row.destination && <>{row.destination} · </>}
                          {row.expectedReturnDate && (
                            <>
                              {t('groupCard.expectedReturn')}{' '}
                              {new Date(row.expectedReturnDate).toLocaleDateString(locale, {
                                month: 'long',
                                day: 'numeric',
                              })}{' '}
                              ·{' '}
                            </>
                          )}
                          {row.userName}
                        </p>
                      </div>

                      {/* Zone 4: NextStepPanel compact + MiniProgress tooltip (auto) */}
                      <div role="gridcell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneAction}>
                        {row.descriptor && (
                          <NextStepPanel
                            variant="compact"
                            descriptor={row.descriptor}
                            currentUserRole={role}
                            onActionClick={handleRowAction(row.checkoutId, row.equipmentName)}
                            isPending={approveMutation.isPending}
                            overflowActions={buildRowOverflowActions(row)}
                          />
                        )}
                        <CheckoutMiniProgress
                          variant="tooltipButton"
                          currentStatus={row.status}
                          checkoutType={row.checkoutType}
                          descriptor={row.descriptor}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}

export default memo(CheckoutGroupCard);
