'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import {
  CalendarDays,
  Building,
  ChevronDown,
  ArrowRight,
  Check,
  X,
  Phone,
  CheckCheck,
} from 'lucide-react';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import { CheckoutMiniProgress } from '@/components/checkouts/CheckoutMiniProgress';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import checkoutApi from '@/lib/api/checkout-api';
import { queryKeys } from '@/lib/api/query-config';
import { CHECKOUT_APPROVAL_INVALIDATE_KEYS } from '@/lib/query-keys/checkout-keys';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  CHECKOUT_INTERACTION_TOKENS,
  CHECKOUT_MOTION,
  CHECKOUT_PURPOSE_TOKENS,
  CHECKOUT_OVERDUE_GROUP_TOKENS,
  CHECKOUT_ITEM_ROW_TOKENS,
  getDdayClasses,
  formatDday,
  getCheckoutRowClasses,
} from '@/lib/design-tokens';
import { FONT, getManagementNumberClasses } from '@/lib/design-tokens';

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
        }))
      ),
    [group.checkouts, t]
  );

  // 그룹 내 pending 건수 (일괄 승인 버튼 표시 여부)
  const pendingCount = useMemo(
    () => group.checkouts.filter((co) => co.status === 'pending').length,
    [group.checkouts]
  );

  // ──────────────────────────────────────────────
  // 인라인 승인 mutation (CAS 포함)
  // ──────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      checkoutApi.approveCheckout(id, version),
    onSuccess: () => {
      toast({ title: t('toasts.approveSuccess') });
      CHECKOUT_APPROVAL_INVALIDATE_KEYS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key as unknown[] });
      });
    },
    onError: () => {
      toast({ title: t('toasts.approveError'), variant: 'destructive' });
      CHECKOUT_APPROVAL_INVALIDATE_KEYS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key as unknown[] });
      });
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
  const headerClass = isOverdueGroup
    ? `${CHECKOUT_OVERDUE_GROUP_TOKENS.header} ${CHECKOUT_INTERACTION_TOKENS.groupCardTrigger}`
    : CHECKOUT_INTERACTION_TOKENS.groupCardTrigger;

  return (
    <TooltipProvider>
      <Card className={cardClass}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* ── 그룹 헤더 ── */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${headerClass}`}
            >
              {/* 왼쪽: 날짜 + 반출지 + 배지들 */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                {/* 기한 초과 아이콘 */}
                {isOverdueGroup && (
                  <span
                    className={`text-xs font-semibold ${CHECKOUT_OVERDUE_GROUP_TOKENS.headerText}`}
                  >
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
                      ({group.dateLabel})
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
                          {group.destination}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{group.destination}</p>
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
                      className={`text-[10px] py-0 ${CHECKOUT_PURPOSE_TOKENS[purpose as keyof typeof CHECKOUT_PURPOSE_TOKENS]?.badge ?? ''}`}
                    >
                      {t(`purpose.${purpose}`)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 오른쪽: 일괄 승인 + 장비 수 + 화살표 */}
              <div className="flex items-center gap-2 shrink-0">
                {/* 일괄 승인 버튼 (pending 그룹만, 권한 있을 때) */}
                {canApprove && pendingCount > 0 && (
                  <Button
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1 bg-primary hover:bg-primary/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 그룹 내 모든 pending checkout 순차 승인
                      group.checkouts
                        .filter((co) => co.status === 'pending')
                        .forEach((co) =>
                          approveMutation.mutate({ id: co.id, version: co.version })
                        );
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCheck className="h-3 w-3" />
                    {t('actions.bulkApprove')} ({pendingCount})
                  </Button>
                )}

                {/* 장비 수 배지 */}
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  {t('groupCard.equipmentCount', { count: group.totalEquipment })}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 ${CHECKOUT_MOTION.chevronRotate} ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </div>
            </button>
          </CollapsibleTrigger>

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
                  const isRowOverdue = row.status === 'overdue';
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
                                {new Date(row.expectedReturnDate).toLocaleDateString('ko-KR', {
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
                        <CheckoutStatusBadge status={row.status} className="text-[10px] py-0" />

                        {/* 인라인 액션 버튼 */}
                        {canApprove && row.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs gap-1"
                              onClick={(e) => handleApprove(row.checkoutId, row.version, e)}
                              disabled={approveMutation.isPending}
                            >
                              <Check className="h-3 w-3" />
                              {t('actions.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1"
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

                        {(row.status === 'checked_out' || row.status === 'overdue') && (
                          <>
                            {row.status === 'overdue' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2.5 text-xs text-brand-warning gap-1 hover:bg-brand-warning/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="h-3 w-3" />
                                {t('actions.urgentContact')}
                              </Button>
                            )}
                            <Link
                              href={FRONTEND_ROUTES.CHECKOUTS.RETURN(row.checkoutId)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 h-7 px-2.5 text-xs rounded-md border border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground shrink-0"
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
