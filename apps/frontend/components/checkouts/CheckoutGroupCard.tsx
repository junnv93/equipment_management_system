'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import Link from 'next/link';
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
import {
  AlertTriangle,
  CalendarDays,
  Building,
  ChevronDown,
  ArrowRight,
  Check,
  X,
  CheckCheck,
} from 'lucide-react';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import { CheckoutMiniProgress } from '@/components/checkouts/CheckoutMiniProgress';
import { NextStepPanel } from '@/components/shared/NextStepPanel';
import { YourTurnBadge } from '@/components/checkouts/YourTurnBadge';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import checkoutApi from '@/lib/api/checkout-api';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import { isConflictError } from '@/lib/api/error';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
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

/** 오늘 기준 남은 일수 계산 (음수 = 초과) */
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
  /** 기한 초과 그룹 최상단 고정을 위한 id */
  isOverdueGroup?: boolean;
}

// ============================================================================
// CheckoutGroupCard
// ============================================================================

/**
 * 반출 그룹 카드 (v2 리디자인)
 *
 * - 목적 색상 바가 있는 개별 장비 행 (table → row 전환)
 * - 인라인 승인 버튼 (pending 상태)
 * - 반입 처리 링크 (checked_out / overdue 상태)
 * - 기한 초과 그룹 특별 스타일
 * - D-day 배지
 */
function CheckoutGroupCard({
  group,
  onCheckoutClick,
  isOverdueGroup = false,
}: CheckoutGroupCardProps) {
  const t = useTranslations('checkouts');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(isOverdueGroup); // 기한 초과 그룹은 기본 펼침

  // FSM descriptor 계산용 role/permissions
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole | undefined) ?? 'test_engineer';

  const descriptorMap = useCheckoutGroupDescriptors(group.checkouts, role);

  // ──────────────────────────────────────────────
  // 장비 행 데이터 (checkout > equipment[] 평탄화)
  // ──────────────────────────────────────────────
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
          checkoutType: (checkout.purpose ?? 'calibration') as 'calibration' | 'repair' | 'rental',
          userName: checkout.user?.name || t('groupCard.unknownUser'),
          checkoutId: checkout.id,
          expectedReturnDate: checkout.expectedReturnDate,
          destination: checkout.destination,
          // 서버가 계산한 가능한 액션 사용. meta 누락 시 fail-closed (false)
          canApproveItem: checkout.meta?.availableActions?.canApprove ?? false,
          canReturnItem: checkout.meta?.availableActions?.canReturn ?? false,
          descriptor,
        }));
      }),
    [group.checkouts, t, descriptorMap]
  );

  // 그룹 내 pending 건수 + 일괄 승인 가능 여부
  const pendingCount = useMemo(
    () => group.checkouts.filter((co) => co.status === CSVal.PENDING).length,
    [group.checkouts]
  );

  // "내 차례" 카운트 — availableToCurrentUser인 checkout 수
  const yourTurnCount = useMemo(() => {
    let count = 0;
    for (const co of group.checkouts) {
      if (descriptorMap.get(co.id)?.availableToCurrentUser === true) count++;
    }
    return count;
  }, [group.checkouts, descriptorMap]);

  // 일괄 승인: pending 중 하나라도 canApprove가 true면 버튼 표시 (meta 누락 시 fail-closed)
  const canApproveBulk = useMemo(
    () =>
      group.checkouts
        .filter((co) => co.status === CSVal.PENDING)
        .some((co) => co.meta?.availableActions?.canApprove ?? false),
    [group.checkouts]
  );

  // 렌탈 그룹 감지 + 현재 렌탈 상태
  const isRentalGroup = group.purposes.includes(CPVal.RENTAL as never);
  const rentalStatus = isRentalGroup
    ? (group.checkouts.find((co) => co.purpose === CPVal.RENTAL)?.status ?? '')
    : '';

  const rentalDescriptor = useMemo(() => {
    const rentalCheckout = group.checkouts.find((co) => co.purpose === CPVal.RENTAL);
    if (!rentalCheckout) return undefined;
    return descriptorMap.get(rentalCheckout.id);
  }, [group.checkouts, descriptorMap]);

  // ──────────────────────────────────────────────
  // 인라인 승인 mutation (fresh CAS — 렌더 캡처 version 금지)
  // ──────────────────────────────────────────────
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

  const handleApprove = useCallback(
    (checkoutId: string, e: React.MouseEvent, equipmentName?: string) => {
      e.stopPropagation();
      approveMutation.mutate({ id: checkoutId, equipmentName });
    },
    [approveMutation]
  );

  // ──────────────────────────────────────────────
  // Group card 스타일 (기한 초과 여부)
  // ──────────────────────────────────────────────
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
          {/* ── 그룹 헤더 — div 컨테이너 (button > button 방지) ── */}
          <div className={headerContainerClass}>
            {/* 왼쪽: Collapsible 토글 트리거 (flex-1) */}
            <CollapsibleTrigger asChild>
              <button type="button" className={CHECKOUT_ITEM_ROW_TOKENS.groupHeaderInfoTrigger}>
                {/* 기한 초과 레이블 + 아이콘 */}
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

                {/* 날짜 */}
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

                {/* 반출지 */}
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

                {/* 목적 배지 */}
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

            {/* 오른쪽: 일괄 승인 + 장비 수 배지 + 화살표 (siblings — button 중첩 없음) */}
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
            <div className="border-t border-border/50">
              {equipmentRows.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {t('groupCard.noEquipment')}
                </div>
              ) : (
                equipmentRows.map((row, rowIndex) => {
                  const daysRemaining = row.expectedReturnDate
                    ? calculateDaysRemaining(row.expectedReturnDate)
                    : null;
                  const isRowOverdue = row.status === CSVal.OVERDUE;
                  const rowBaseClass = isRowOverdue
                    ? `${CHECKOUT_ITEM_ROW_TOKENS.container} ${CHECKOUT_ITEM_ROW_TOKENS.containerOverdue}`
                    : CHECKOUT_ITEM_ROW_TOKENS.container;

                  return (
                    // div[role=button]은 의도적 선택 — 내부에 <Button>/<Link> 중첩으로 <button> 사용 불가 (HTML5 spec)
                    // WCAG 2.1 AA: role + tabIndex + onKeyDown + aria-label 모두 충족
                    <div
                      key={`${row.checkoutId}-${row.equipmentId}`}
                      className={cn(rowBaseClass, ANIMATION_PRESETS.staggerFadeInItem)}
                      style={getStaggerFadeInStyle(rowIndex, 'grid')}
                      onClick={() => onCheckoutClick(row.checkoutId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onCheckoutClick(row.checkoutId);
                        }
                      }}
                      aria-label={t('groupCard.viewDetail', { name: row.equipmentName })}
                    >
                      {/* 목적 색상 바 */}
                      <div
                        className={`${CHECKOUT_ITEM_ROW_TOKENS.purposeBar.base} ${getPurposeBarClass(row.purpose)}`}
                        aria-hidden="true"
                      />

                      {/* 장비 정보 블록 */}
                      <div className={CHECKOUT_ITEM_ROW_TOKENS.infoBlock}>
                        <div className={CHECKOUT_ITEM_ROW_TOKENS.nameRow}>
                          <span className={CHECKOUT_ITEM_ROW_TOKENS.name}>{row.equipmentName}</span>
                          <code
                            className={`${CHECKOUT_ITEM_ROW_TOKENS.mgmt} ${getManagementNumberClasses()}`}
                          >
                            {row.managementNumber}
                          </code>
                          {daysRemaining !== null && (
                            <span
                              className={`${CHECKOUT_ITEM_ROW_TOKENS.dday} ${getDdayClasses(daysRemaining)}`}
                            >
                              {formatDday(daysRemaining)}
                            </span>
                          )}
                        </div>
                        <div className={CHECKOUT_ITEM_ROW_TOKENS.meta}>
                          {row.destination && (
                            <>
                              <span>{row.destination}</span>
                              <span className="mx-1 text-border">·</span>
                            </>
                          )}
                          {row.expectedReturnDate && (
                            <>
                              <span>
                                {t('groupCard.expectedReturn')}{' '}
                                {new Date(row.expectedReturnDate).toLocaleDateString(locale, {
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="mx-1 text-border">·</span>
                            </>
                          )}
                          <span>{row.userName}</span>
                        </div>
                      </div>

                      {/* 우측: 진행 상태 + 배지 + 액션 */}
                      <div className={CHECKOUT_ITEM_ROW_TOKENS.actionsArea}>
                        <CheckoutMiniProgress
                          currentStatus={row.status}
                          checkoutType={row.checkoutType}
                          descriptor={row.descriptor}
                        />
                        <CheckoutStatusBadge
                          status={row.status}
                          className={`${MICRO_TYPO.badge} py-0`}
                        />

                        {row.descriptor?.availableToCurrentUser === true && (
                          <YourTurnBadge urgency={row.descriptor.urgency} />
                        )}

                        {/* 인라인 액션 버튼 */}
                        {row.canApproveItem && row.status === CSVal.PENDING && (
                          <>
                            <Button
                              size="sm"
                              className={CHECKOUT_ITEM_ROW_TOKENS.actionButtons.compact}
                              onClick={(e) => handleApprove(row.checkoutId, e, row.equipmentName)}
                              disabled={approveMutation.isPending}
                            >
                              <Check className="h-3 w-3" />
                              {t('actions.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={CHECKOUT_ITEM_ROW_TOKENS.actionButtons.compact}
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckoutClick(row.checkoutId);
                              }}
                            >
                              <X className="h-3 w-3" />
                              {t('actions.reject')}
                            </Button>
                          </>
                        )}

                        {row.canReturnItem &&
                          (row.status === CSVal.CHECKED_OUT || row.status === CSVal.OVERDUE) && (
                            <Link
                              href={FRONTEND_ROUTES.CHECKOUTS.RETURN(row.checkoutId)}
                              onClick={(e) => e.stopPropagation()}
                              className={CHECKOUT_ITEM_ROW_TOKENS.actionButtons.returnLink}
                            >
                              {t('actions.processReturn')}
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}

export default memo(CheckoutGroupCard);
