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
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import checkoutApi from '@/lib/api/checkout-api';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import { isConflictError } from '@/lib/api/error';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  type CheckoutStatus,
} from '@equipment-management/schemas';
import {
  CHECKOUT_MOTION,
  CHECKOUT_PURPOSE_TOKENS,
  CHECKOUT_OVERDUE_GROUP_TOKENS,
  CHECKOUT_ITEM_ROW_TOKENS,
  RENTAL_FLOW_INLINE_TOKENS,
  getDdayClasses,
  formatDday,
} from '@/lib/design-tokens';
import { FONT, getManagementNumberClasses, MICRO_TYPO } from '@/lib/design-tokens';

// ============================================================================
// Helpers
// ============================================================================

/** 렌탈 그룹 헤더 인라인 진행 표시 (5원) */
function RentalFlowInline({ status }: { status: CheckoutStatus }) {
  const t = useTranslations('checkouts');
  const isFullyDone = status === CSVal.LENDER_RECEIVED;
  const currentIdx = isFullyDone ? 5 : (RENTAL_FLOW_INLINE_TOKENS.statusToStep[status] ?? -1);

  return (
    <div className={RENTAL_FLOW_INLINE_TOKENS.container} title={t('rentalFlow.title')}>
      {Array.from({ length: 5 }, (_, i) => {
        const isDone = isFullyDone || i < currentIdx;
        const isCurrent = !isFullyDone && i === currentIdx;

        let circleClass = RENTAL_FLOW_INLINE_TOKENS.circle.base;
        if (isDone) circleClass += ` ${RENTAL_FLOW_INLINE_TOKENS.circle.done}`;
        else if (isCurrent) circleClass += ` ${RENTAL_FLOW_INLINE_TOKENS.circle.current}`;
        else circleClass += ` ${RENTAL_FLOW_INLINE_TOKENS.circle.future}`;

        const content = isDone ? '✓' : String(i + 1);

        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className={RENTAL_FLOW_INLINE_TOKENS.arrow} aria-hidden="true">
                →
              </span>
            )}
            <span className={RENTAL_FLOW_INLINE_TOKENS.stepWrapper}>
              <span className={circleClass} aria-hidden="true">
                {content}
              </span>
              {isCurrent && (
                <span className={RENTAL_FLOW_INLINE_TOKENS.stepLabel}>
                  {t(`rentalFlow.step_${i}`)}
                </span>
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}

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
  /** 인라인 승인 권한 여부 (technical_manager, lab_manager) */
  canApprove?: boolean;
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
  canApprove = false,
  isOverdueGroup = false,
}: CheckoutGroupCardProps) {
  const t = useTranslations('checkouts');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(isOverdueGroup); // 기한 초과 그룹은 기본 펼침

  // ──────────────────────────────────────────────
  // 장비 행 데이터 (checkout > equipment[] 평탄화)
  // ──────────────────────────────────────────────
  const equipmentRows = useMemo(
    () =>
      group.checkouts.flatMap((checkout) =>
        (checkout.equipment || []).map((equip) => ({
          equipmentId: equip.id,
          equipmentName: equip.name,
          managementNumber: equip.managementNumber,
          purpose: checkout.purpose as string,
          status: checkout.status,
          checkoutType: (checkout.purpose ?? 'calibration') as 'calibration' | 'repair' | 'rental',
          userName: checkout.user?.name || t('groupCard.unknownUser'),
          checkoutId: checkout.id,
          expectedReturnDate: checkout.expectedReturnDate,
          version: checkout.version,
          destination: checkout.destination || checkout.location,
          // 서버가 계산한 가능한 액션 우선, 없으면 역할 기반 폴백
          canApproveItem: checkout.meta?.availableActions?.canApprove ?? canApprove,
        }))
      ),
    [group.checkouts, t, canApprove]
  );

  // 그룹 내 pending 건수 + 일괄 승인 가능 여부
  const pendingCount = useMemo(
    () => group.checkouts.filter((co) => co.status === CSVal.PENDING).length,
    [group.checkouts]
  );

  // 일괄 승인: pending 중 하나라도 canApprove가 true면 버튼 표시
  const canApproveBulk = useMemo(
    () =>
      group.checkouts
        .filter((co) => co.status === CSVal.PENDING)
        .some((co) => co.meta?.availableActions?.canApprove ?? canApprove),
    [group.checkouts, canApprove]
  );

  // 렌탈 그룹 감지 + 현재 렌탈 상태
  const isRentalGroup = group.purposes.includes(CPVal.RENTAL as never);
  const rentalStatus = isRentalGroup
    ? (group.checkouts.find((co) => co.purpose === CPVal.RENTAL)?.status ?? '')
    : '';

  // ──────────────────────────────────────────────
  // 인라인 승인 mutation (CAS 포함)
  // ──────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      checkoutApi.approveCheckout(id, version),
    onSuccess: () => {
      toast({ title: t('toasts.approveSuccess') });
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
    (checkoutId: string, version: number, e: React.MouseEvent) => {
      e.stopPropagation();
      approveMutation.mutate({ id: checkoutId, version });
    },
    [approveMutation]
  );

  // ──────────────────────────────────────────────
  // 목적별 색상 바 클래스
  // ──────────────────────────────────────────────
  const getPurposeBarClass = (purpose: string): string => {
    const map: Record<string, string> = {
      calibration: CHECKOUT_ITEM_ROW_TOKENS.purposeBar.calibration,
      repair: CHECKOUT_ITEM_ROW_TOKENS.purposeBar.repair,
      rental: CHECKOUT_ITEM_ROW_TOKENS.purposeBar.rental,
    };
    return map[purpose] ?? CHECKOUT_ITEM_ROW_TOKENS.purposeBar.default;
  };

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
                        <span className="truncate max-w-[160px] cursor-help">
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

                {/* [개선 8] 렌탈 그룹 — 4단계 진행 현황 인라인 */}
                {isRentalGroup && rentalStatus && <RentalFlowInline status={rentalStatus} />}
              </button>
            </CollapsibleTrigger>

            {/* 오른쪽: 일괄 승인 + 장비 수 배지 + 화살표 (siblings — button 중첩 없음) */}
            {canApproveBulk && pendingCount > 0 && (
              <Button
                size="sm"
                className={CHECKOUT_ITEM_ROW_TOKENS.actionButtons.bulkApprove}
                onClick={() =>
                  group.checkouts
                    .filter((co) => co.status === CSVal.PENDING)
                    .forEach((co) => approveMutation.mutate({ id: co.id, version: co.version }))
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
                equipmentRows.map((row) => {
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
                      className={rowBaseClass}
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
                        />
                        <CheckoutStatusBadge
                          status={row.status}
                          className={`${MICRO_TYPO.badge} py-0`}
                        />

                        {/* 인라인 액션 버튼 */}
                        {row.canApproveItem && row.status === CSVal.PENDING && (
                          <>
                            <Button
                              size="sm"
                              className={CHECKOUT_ITEM_ROW_TOKENS.actionButtons.compact}
                              onClick={(e) => handleApprove(row.checkoutId, row.version, e)}
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

                        {(row.status === CSVal.CHECKED_OUT || row.status === CSVal.OVERDUE) && (
                          <>
                            <Link
                              href={FRONTEND_ROUTES.CHECKOUTS.RETURN(row.checkoutId)}
                              onClick={(e) => e.stopPropagation()}
                              className={CHECKOUT_ITEM_ROW_TOKENS.actionButtons.returnLink}
                            >
                              {t('actions.processReturn')}
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </>
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
