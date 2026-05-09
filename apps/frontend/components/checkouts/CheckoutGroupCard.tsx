'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useEffectiveRole } from '@/hooks/use-effective-role';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CalendarDays, Building, ChevronDown, CheckCheck } from 'lucide-react';
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
  type CheckoutAction,
  type UserSelectableCheckoutPurpose,
} from '@equipment-management/schemas';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@equipment-management/schemas';
import { useCheckoutGroupDescriptors } from '@/hooks/use-checkout-group-descriptors';
import { useCheckoutGroupAggregates } from '@/hooks/use-checkout-group-aggregates';
import {
  CHECKOUT_MOTION,
  CHECKOUT_PURPOSE_TOKENS,
  CHECKOUT_OVERDUE_GROUP_TOKENS,
  CHECKOUT_ITEM_ROW_TOKENS,
  CHECKOUT_INTERACTION_TOKENS,
  CHECKOUT_YOUR_TURN_BADGE_TOKENS,
  FONT,
  MICRO_TYPO,
} from '@/lib/design-tokens';
import {
  CheckoutEquipmentRow,
  type EquipmentRowData,
} from '@/components/checkouts/CheckoutEquipmentRow';

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

// ============================================================================
// CheckoutGroupCard
// ============================================================================

function CheckoutGroupCard({
  group,
  onCheckoutClick,
  isOverdueGroup = false,
  selectedRowIds,
  onToggleGroup,
  onToggleRow,
}: CheckoutGroupCardProps) {
  const t = useTranslations('checkouts');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(isOverdueGroup);

  const { data: session } = useSession();
  // 시뮬레이션 모드 반영 — useEffectiveRole SSOT (verify-ssot Step 37)
  // raw NextAuth role 직접 참조 금지 — fallback도 useEffectiveRole 결과만 사용.
  const { effectiveRole } = useEffectiveRole();
  const role: UserRole = effectiveRole ?? 'test_engineer';
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

  // 6개 파생 aggregates SSOT (Phase C.2 — useCheckoutGroupAggregates hook)
  const {
    pendingCount,
    yourTurnCount,
    canApproveBulk,
    isRentalGroup,
    rentalStatus,
    rentalDescriptor,
  } = useCheckoutGroupAggregates({ group, descriptorMap });

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
  const rejectActionLabel = useMemo(() => t('actions.reject'), [t]);

  const buildRowOverflowActions = useCallback(
    (row: EquipmentRowData): OverflowAction[] => {
      const actions: OverflowAction[] = [];
      if (row.canApproveItem && row.status === CSVal.PENDING) {
        actions.push({
          label: rejectActionLabel,
          onClick: () => onCheckoutClick(row.checkoutId),
          variant: 'destructive',
        });
      }
      return actions;
    },
    [rejectActionLabel, onCheckoutClick]
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
  // ── Row-level checkbox 활성 조건 (bulk-selection-tabs-integration sprint) ──
  const showRowCheckbox = selectedRowIds !== undefined && onToggleRow !== undefined;
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
  const handleCheckoutRowClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const checkoutId = event.currentTarget.dataset.checkoutId;
      if (checkoutId) onCheckoutClick(checkoutId);
    },
    [onCheckoutClick]
  );
  const handleCheckoutRowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const checkoutId = event.currentTarget.dataset.checkoutId;
      if (checkoutId) onCheckoutClick(checkoutId);
    },
    [onCheckoutClick]
  );

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
                  const rowSelectable =
                    showRowCheckbox && row.status === CSVal.PENDING && row.canApproveItem;
                  const isRowSelected =
                    showRowCheckbox && (selectedRowIds?.has(row.checkoutId) ?? false);

                  return (
                    <CheckoutEquipmentRow
                      key={`${row.checkoutId}-${row.equipmentId}`}
                      row={row}
                      rowIndex={rowIndex}
                      showRowCheckbox={showRowCheckbox}
                      isRowSelected={isRowSelected}
                      rowSelectable={rowSelectable}
                      onToggleRow={onToggleRow}
                      onRowClick={handleCheckoutRowClick}
                      onRowKeyDown={handleCheckoutRowKeyDown}
                      onAction={handleRowAction(row.checkoutId, row.equipmentName)}
                      overflowActions={buildRowOverflowActions(row)}
                      userRole={role}
                      isApprovePending={approveMutation.isPending}
                    />
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
