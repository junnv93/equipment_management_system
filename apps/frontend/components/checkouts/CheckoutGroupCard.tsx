'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarDays, Building, ChevronDown, Package } from 'lucide-react';
import { CHECKOUT_PURPOSE_LABELS, type CheckoutPurpose } from '@equipment-management/schemas';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';

interface CheckoutGroupCardProps {
  group: CheckoutGroup;
  onCheckoutClick: (checkoutId: string) => void;
}

/** 반출 그룹 1개를 접기/펼치기 카드로 렌더링합니다. */
export default function CheckoutGroupCard({ group, onCheckoutClick }: CheckoutGroupCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 장비 행 데이터: checkout > equipment[]를 평탄화
  const equipmentRows = group.checkouts.flatMap((checkout) =>
    (checkout.equipment || []).map((equip) => ({
      equipmentId: equip.id,
      equipmentName: equip.name,
      managementNumber: equip.managementNumber,
      purpose: checkout.purpose,
      status: checkout.status,
      userName: checkout.user?.name || '알 수 없는 사용자',
      checkoutId: checkout.id,
    }))
  );

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          >
            {/* 왼쪽: 날짜 + 반출지 + 장비 수 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{group.date}</span>
                <span className="text-muted-foreground text-xs">({group.dateLabel})</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{group.destination}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Package className="h-3.5 w-3.5 shrink-0" />
                <span>장비 {group.totalEquipment}대</span>
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
                    {CHECKOUT_PURPOSE_LABELS[purpose]}
                  </Badge>
                ))}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
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
                {CHECKOUT_PURPOSE_LABELS[purpose]}
              </Badge>
            ))}
          </div>

          <div className="border-t">
            {equipmentRows.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                장비 정보가 없습니다
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>장비명</TableHead>
                    <TableHead>관리번호</TableHead>
                    <TableHead>목적</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>신청자</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipmentRows.map((row) => (
                    <TableRow
                      key={`${row.checkoutId}-${row.equipmentId}`}
                      className="cursor-pointer hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                      onClick={() => onCheckoutClick(row.checkoutId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onCheckoutClick(row.checkoutId);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${row.equipmentName} 반출 상세 보기`}
                    >
                      <TableCell className="font-medium">{row.equipmentName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.managementNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {CHECKOUT_PURPOSE_LABELS[row.purpose as CheckoutPurpose] || row.purpose}
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
  );
}
