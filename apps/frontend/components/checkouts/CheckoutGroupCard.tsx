'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertTriangle, CalendarDays, Building, ChevronDown, CheckCheck } from 'lucide-react';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import { CheckoutMiniProgress } from '@/components/checkouts/CheckoutMiniProgress';
import { CheckoutPhaseIndicator } from '@/components/checkouts/CheckoutPhaseIndicator';
import { NextStepPanel } from '@/components/checkouts/NextStepPanel';
import type { OverflowAction } from '@/lib/types/checkout-ui';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import {
  getGroupRowIds,
  deriveGroupSelectionState,
  toCheckboxCheckedProp,
} from '@/lib/checkouts/group-selection';
import {
  useApproveCheckoutMutation,
  useBorrowerApproveCheckoutMutation,
} from '@/hooks/use-checkout-card-mutations';
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
  getCheckoutDday4TierClasses,
  formatDday,
  FONT,
  getManagementNumberClasses,
  MICRO_TYPO,
  ANIMATION_PRESETS,
  getStaggerFadeInStyle,
  STAGGER_ROW_LIMIT,
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
  /**
   * 외부 selection state. 미전달 시 헤더 체크박스 hidden (후방호환).
   * 부모가 `useRowSelection` 훅의 `selected` Set을 그대로 전달.
   */
  selectedRowIds?: ReadonlySet<string>;
  /**
   * 그룹 헤더 토글 콜백. 미전달 시 헤더 체크박스 hidden.
   * 부모가 그룹 row id 전체와 현재 상태를 받아 일괄 toggle/clear 결정.
   *
   * @param rowIds 그룹 내 모든 checkout id (Sprint 4.5 row 키 컨벤션 = checkout 단위)
   * @param allCurrentlySelected 토글 직전 그룹 전체 선택 상태 — true면 clear, false면 select-all 의도
   */
  onToggleGroup?: (rowIds: readonly string[], allCurrentlySelected: boolean) => void;
  /**
   * Row-level 토글 콜백 — **본 세션(sprint45-should-residual)에서는 prop API surface만 등록**.
   * 향후 부모 통합 sprint(`checkouts-tab-bulk-selection-integration`)에서 row 셀에
   * 체크박스가 추가될 때 emit. 본 컴포넌트가 직접 호출하는 시점은 후속 sprint.
   *
   * 사전 등록 이유: 부모 통합 시 prop API 재변경 없이 즉시 활용 가능 + 격리
   * fixture page가 row-level + group-level 두 토글 경로를 일관된 API로 노출.
   */
  onToggleRow?: (rowId: string) => void;
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
  canBorrowerApproveItem: boolean;
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
  selectedRowIds,
  onToggleGroup,
}: CheckoutGroupCardProps) {
  const t = useTranslations('checkouts');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(isOverdueGroup);

  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole | undefined) ?? 'test_engineer';
  const userTeamId = session?.user?.teamId ?? null;

  const descriptorMap = useCheckoutGroupDescriptors(group.checkouts, role, userTeamId);

  const unknownUserLabel = t('groupCard.unknownUser');

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
          userName: checkout.user?.name || unknownUserLabel,
          checkoutId: checkout.id,
          expectedReturnDate: checkout.expectedReturnDate,
          destination: checkout.destination,
          canApproveItem: checkout.meta?.availableActions?.canApprove ?? false,
          canBorrowerApproveItem: checkout.meta?.availableActions?.canBorrowerApprove ?? false,
          canReturnItem: checkout.meta?.availableActions?.canReturn ?? false,
          descriptor,
        }));
      }),
    [group.checkouts, unknownUserLabel, descriptorMap]
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

  // ── 승인 mutation (use-checkout-card-mutations SSOT) ─────────────────────
  const approveMutation = useApproveCheckoutMutation();
  const borrowerApproveMutation = useBorrowerApproveCheckoutMutation();

  // ── Row-level NextStepPanel action dispatcher ────────────────────────────
  const handleRowAction = useCallback(
    (checkoutId: string, equipmentName: string) => (action: CheckoutAction) => {
      switch (action) {
        case 'approve':
          approveMutation.mutate({ id: checkoutId, equipmentName });
          break;
        case 'borrower_approve':
          borrowerApproveMutation.mutate({ id: checkoutId, equipmentName });
          break;
        default:
          onCheckoutClick(checkoutId);
          break;
      }
    },
    [approveMutation, borrowerApproveMutation, onCheckoutClick]
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

  // ── 그룹 헤더 selection 3-state (S3, prop 옵셔널이라 외부 미전달 시 hidden) ──
  const showGroupCheckbox = selectedRowIds !== undefined && onToggleGroup !== undefined;
  const groupRowIds = useMemo(() => getGroupRowIds(group), [group]);
  const groupSelectionState = useMemo(
    () => (selectedRowIds ? deriveGroupSelectionState(groupRowIds, selectedRowIds) : 'none'),
    [groupRowIds, selectedRowIds]
  );
  const selectedInGroupCount = useMemo(() => {
    if (!selectedRowIds) return 0;
    let count = 0;
    for (const id of groupRowIds) if (selectedRowIds.has(id)) count++;
    return count;
  }, [groupRowIds, selectedRowIds]);
  const groupDestinationLabel = group.destinationKey ? t(group.destinationKey) : group.destination;
  const groupCheckboxAriaLabel =
    groupSelectionState === 'all'
      ? t('groupCard.deselectGroupAria', { destination: groupDestinationLabel })
      : groupSelectionState === 'indeterminate'
        ? t('groupCard.indeterminateAria', {
            selected: selectedInGroupCount,
            total: groupRowIds.length,
            destination: groupDestinationLabel,
          })
        : t('groupCard.selectGroupAria', {
            count: groupRowIds.length,
            destination: groupDestinationLabel,
          });
  const handleGroupToggle = useCallback(() => {
    if (!onToggleGroup) return;
    onToggleGroup(groupRowIds, groupSelectionState === 'all');
  }, [groupRowIds, groupSelectionState, onToggleGroup]);

  return (
    <TooltipProvider>
      <Card className={cardClass}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* ── 그룹 헤더 ── */}
          <div className={headerContainerClass}>
            {showGroupCheckbox && (
              <Checkbox
                data-testid="group-header-checkbox"
                checked={toCheckboxCheckedProp(groupSelectionState)}
                onCheckedChange={handleGroupToggle}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleGroupToggle();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label={groupCheckboxAriaLabel}
                disabled={groupRowIds.length === 0}
                className="shrink-0"
              />
            )}
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
                  <CheckoutPhaseIndicator descriptor={rentalDescriptor} variant="compact" />
                )}
              </button>
            </CollapsibleTrigger>

            {isRentalGroup && rentalStatus && rentalDescriptor && (
              <NextStepPanel
                variant="compact"
                descriptor={rentalDescriptor}
                currentUserRole={role}
                loadingLabel={tCommon('status.loading')}
              />
            )}

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
                loading={approveMutation.isPending}
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
                        rowIndex < STAGGER_ROW_LIMIT && ANIMATION_PRESETS.staggerFadeInItem
                      )}
                      style={
                        rowIndex < STAGGER_ROW_LIMIT
                          ? getStaggerFadeInStyle(rowIndex, 'grid')
                          : undefined
                      }
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
                            className={`${CHECKOUT_ITEM_ROW_TOKENS.dday} ${getCheckoutDday4TierClasses(daysRemaining)}`}
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
                            loadingLabel={tCommon('status.loading')}
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
