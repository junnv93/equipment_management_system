'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import checkoutApi, { type CheckoutQuery } from '@/lib/api/checkout-api';
import equipmentImportApi from '@/lib/api/equipment-import-api';
import {
  EQUIPMENT_IMPORT_STATUS_LABELS,
  CLASSIFICATION_LABELS,
  type Classification,
  type EquipmentImportStatus,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { EquipmentImportStatusBadge } from '@/components/equipment-imports';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';

interface InboundCheckoutsTabProps {
  teamId?: string;
  statusFilter: string;
  searchTerm: string;
  onResetFilters: () => void;
}

/**
 * 반입 탭 컴포넌트
 * ✅ 코드 분할: 반입 관련 로직만 포함 (타팀 장비 대여 + 외부 업체 렌탈)
 */
export default function InboundCheckoutsTab({
  teamId,
  statusFilter,
  searchTerm,
  onResetFilters,
}: InboundCheckoutsTabProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, teamId]);

  // ──────────────────────────────────────────────
  // 반입: 타팀 장비 대여 건 (페이지네이션)
  // ──────────────────────────────────────────────
  const { data: inboundCheckoutsData, isLoading: inboundCheckoutsLoading } = useQuery({
    queryKey: queryKeys.checkouts.inbound({ statusFilter, searchTerm, teamId, page: currentPage }),
    queryFn: async () => {
      const query: CheckoutQuery = {
        page: currentPage,
        pageSize: 20,
        search: searchTerm || undefined,
        teamId,
        direction: 'inbound',
      };

      if (statusFilter !== 'all') {
        query.statuses = statusFilter;
      }

      return checkoutApi.getCheckouts(query);
    },
    staleTime: CACHE_TIMES.SHORT,
  });

  // ──────────────────────────────────────────────
  // 반입: 외부 업체 렌탈
  // ──────────────────────────────────────────────
  const { data: rentalImportsData, isLoading: rentalImportsLoading } = useQuery({
    queryKey: queryKeys.equipmentImports.bySourceType('rental', { statusFilter, searchTerm }),
    queryFn: () =>
      equipmentImportApi.getList({
        sourceType: 'rental', // ✅ Filter for rental imports only
        limit: 100,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      }),
    staleTime: CACHE_TIMES.SHORT,
  });

  // ──────────────────────────────────────────────
  // 반입: 내부 공용장비
  // ──────────────────────────────────────────────
  const { data: internalSharedImportsData, isLoading: internalSharedImportsLoading } = useQuery({
    queryKey: queryKeys.equipmentImports.bySourceType('internal_shared', {
      statusFilter,
      searchTerm,
    }),
    queryFn: () =>
      equipmentImportApi.getList({
        limit: 100,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? (statusFilter as EquipmentImportStatus) : undefined,
        sourceType: 'internal_shared',
      }),
    staleTime: CACHE_TIMES.SHORT,
  });

  // ──────────────────────────────────────────────
  // 그룹화
  // ──────────────────────────────────────────────
  const inboundGroups = useMemo(() => {
    if (!inboundCheckoutsData?.data) return [];
    return groupCheckoutsByDateAndDestination(inboundCheckoutsData.data);
  }, [inboundCheckoutsData?.data]);

  // ──────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────
  const renderLoadingState = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-5 w-[60px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-[60px]" />
              <Skeleton className="h-5 w-[50px]" />
            </div>
          </div>
        </Card>
      ))}
    </>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ClipboardList className="h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-gray-900">반입 정보가 없습니다</h3>
      <p className="text-sm text-gray-500 mt-2 mb-4">검색 조건에 맞는 정보가 없습니다.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onResetFilters}>
          필터 초기화
        </Button>
      </div>
    </div>
  );

  const renderRentalImportsList = () => {
    if (rentalImportsLoading) return renderLoadingState();
    if (!rentalImportsData?.items?.length) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">외부 업체 렌탈</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>장비명</TableHead>
                <TableHead>분류</TableHead>
                <TableHead>렌탈 업체</TableHead>
                <TableHead>사용 기간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>신청일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentalImportsData.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(item.id))}
                >
                  <TableCell className="font-medium line-clamp-1">{item.equipmentName}</TableCell>
                  <TableCell>
                    {CLASSIFICATION_LABELS[item.classification as Classification] ||
                      item.classification}
                  </TableCell>
                  <TableCell className="line-clamp-1">{item.vendorName}</TableCell>
                  <TableCell className="tabular-nums">
                    {format(new Date(item.usagePeriodStart), 'yy.MM.dd', { locale: ko })}
                    {' ~ '}
                    {format(new Date(item.usagePeriodEnd), 'yy.MM.dd', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <EquipmentImportStatusBadge status={item.status as EquipmentImportStatus} />
                      {item.status === 'approved' && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-amber-50 text-amber-700 border-amber-300"
                        >
                          수령확인 필요
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {format(new Date(item.createdAt), 'yy.MM.dd', { locale: ko })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────
  const hasInboundCheckouts = inboundGroups.length > 0;
  const hasRentalImports = rentalImportsData?.items && rentalImportsData.items.length > 0;
  const hasInternalSharedImports =
    internalSharedImportsData?.items && internalSharedImportsData.items.length > 0;
  const isLoading = inboundCheckoutsLoading || rentalImportsLoading || internalSharedImportsLoading;

  if (isLoading) return renderLoadingState();

  if (!hasInboundCheckouts && !hasRentalImports && !hasInternalSharedImports) {
    return renderEmptyState();
  }

  return (
    <div className="space-y-6">
      {/* 타팀 장비 대여 건 */}
      {hasInboundCheckouts && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">타팀 장비 대여</h3>
          {inboundGroups.map((group) => (
            <CheckoutGroupCard
              key={group.key}
              group={group}
              onCheckoutClick={(id) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id))}
            />
          ))}

          {/* 페이지네이션 */}
          {inboundCheckoutsData && inboundCheckoutsData.meta.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || inboundCheckoutsLoading}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {inboundCheckoutsData.meta.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(inboundCheckoutsData.meta.pagination.totalPages, p + 1)
                  )
                }
                disabled={
                  currentPage === inboundCheckoutsData.meta.pagination.totalPages ||
                  inboundCheckoutsLoading
                }
              >
                다음
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 외부 업체 렌탈 */}
      {renderRentalImportsList()}

      {/* 내부 공용장비 */}
      {!internalSharedImportsLoading &&
        internalSharedImportsData?.items &&
        internalSharedImportsData.items.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">내부 공용장비</h3>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>장비명</TableHead>
                    <TableHead>분류</TableHead>
                    <TableHead>소유 부서</TableHead>
                    <TableHead>사용 기간</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>신청일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internalSharedImportsData.items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(item.id))}
                    >
                      <TableCell className="font-medium line-clamp-1">
                        {item.equipmentName}
                      </TableCell>
                      <TableCell>
                        {CLASSIFICATION_LABELS[item.classification as Classification] ||
                          item.classification}
                      </TableCell>
                      <TableCell className="line-clamp-1">{item.ownerDepartment || '-'}</TableCell>
                      <TableCell className="tabular-nums">
                        {format(new Date(item.usagePeriodStart), 'yy.MM.dd', { locale: ko })}
                        {' ~ '}
                        {format(new Date(item.usagePeriodEnd), 'yy.MM.dd', { locale: ko })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EquipmentImportStatusBadge
                            status={item.status as EquipmentImportStatus}
                          />
                          {item.status === 'approved' && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-700 border-amber-300"
                            >
                              수령확인 필요
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {format(new Date(item.createdAt), 'yy.MM.dd', { locale: ko })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
    </div>
  );
}
