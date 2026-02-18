'use client';

import { useState, useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarDays, Building, ChevronDown, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import { CHECKOUT_INTERACTION_TOKENS, CHECKOUT_MOTION } from '@/lib/design-tokens';

interface CheckoutGroupCardProps {
  group: CheckoutGroup;
  onCheckoutClick: (checkoutId: string) => void;
}

/** 반출 그룹 1개를 접기/펼치기 카드로 렌더링합니다. */
function CheckoutGroupCard({ group, onCheckoutClick }: CheckoutGroupCardProps) {
  const t = useTranslations('checkouts');
  const [isOpen, setIsOpen] = useState(false);

  // 장비 행 데이터: checkout > equipment[]를 평탄화 (memoized)
  const equipmentRows = useMemo(
    () =>
      group.checkouts.flatMap((checkout) =>
        (checkout.equipment || []).map((equip) => ({
          equipmentId: equip.id,
          equipmentName: equip.name,
          managementNumber: equip.managementNumber,
          purpose: checkout.purpose,
          status: checkout.status,
          userName: checkout.user?.name || t('groupCard.unknownUser'),
          checkoutId: checkout.id,
        }))
      ),
    [group.checkouts]
  );

  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left ${CHECKOUT_INTERACTION_TOKENS.groupCardTrigger}`}
            >
              {/* 왼쪽: 날짜 + 반출지 + 장비 수 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{group.date}</span>
                  <span className="text-muted-foreground text-xs">({group.dateLabel})</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm min-w-0">
                  <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate cursor-help">{group.destination}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{group.destination}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Package className="h-3.5 w-3.5 shrink-0" />
                  <span>{t('groupCard.equipmentCount', { count: group.totalEquipment })}</span>
                </div>
              </div>

              {/* 오른쪽: 배지들 + 화살표 */}
              <div className="flex items-center gap-2 shrink-0">
                {/* 상태 배지 */}
                <div className="hidden sm:flex items-center gap-1">
                  {group.statuses.map((status) => (
                    <CheckoutStatusBadge key={status} status={status} className="text-xs" />
                  ))}
                </div>
                {/* 목적 배지 */}
                <div className="hidden md:flex items-center gap-1">
                  {group.purposes.map((purpose) => (
                    <Badge key={purpose} variant="secondary" className="text-xs">
                      {t(`purpose.${purpose}`)}
                    </Badge>
                  ))}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground ${CHECKOUT_MOTION.chevronRotate} ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            {/* 모바일용 배지 (sm 미만에서만 표시) */}
            <div className="flex flex-wrap gap-1 px-4 pb-2 sm:hidden">
              {group.statuses.map((status) => (
                <CheckoutStatusBadge key={status} status={status} className="text-xs" />
              ))}
              {group.purposes.map((purpose) => (
                <Badge key={purpose} variant="secondary" className="text-xs">
                  {t(`purpose.${purpose}`)}
                </Badge>
              ))}
            </div>

            <div className="border-t">
              {equipmentRows.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {t('groupCard.noEquipment')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('groupCard.equipmentName')}</TableHead>
                      <TableHead>{t('groupCard.managementNumber')}</TableHead>
                      <TableHead>{t('groupCard.purpose')}</TableHead>
                      <TableHead>{t('groupCard.status')}</TableHead>
                      <TableHead>{t('groupCard.requester')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentRows.map((row) => (
                      <TableRow
                        key={`${row.checkoutId}-${row.equipmentId}`}
                        className={`${CHECKOUT_INTERACTION_TOKENS.clickableRow} ${CHECKOUT_INTERACTION_TOKENS.rowFocus}`}
                        onClick={() => onCheckoutClick(row.checkoutId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onCheckoutClick(row.checkoutId);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={t('groupCard.viewDetail', { name: row.equipmentName })}
                      >
                        <TableCell className="font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="line-clamp-1 cursor-help">{row.equipmentName}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{row.equipmentName}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.managementNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {t(`purpose.${row.purpose}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <CheckoutStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell>{row.userName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}

export default memo(CheckoutGroupCard);
