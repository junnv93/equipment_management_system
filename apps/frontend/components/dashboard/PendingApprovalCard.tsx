'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Package,
  FileSpreadsheet,
  ClipboardList,
  ArrowRightLeft,
  Calculator,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { dashboardApi, type PendingApprovalCounts } from '@/lib/api/dashboard-api';

interface ApprovalCategory {
  key: keyof Omit<PendingApprovalCounts, 'total'>;
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  description: string;
}

const categories: ApprovalCategory[] = [
  {
    key: 'equipment',
    label: '장비',
    icon: Package,
    href: '/admin/equipment-approvals',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: '장비 등록/수정/삭제 승인',
  },
  {
    key: 'calibration',
    label: '교정',
    icon: FileSpreadsheet,
    href: '/admin/calibration-approvals',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: '교정 기록 승인',
  },
  {
    key: 'rental',
    label: '대여',
    icon: ClipboardList,
    href: '/rentals?status=pending',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: '시험소 내 대여 승인',
  },
  {
    key: 'checkout',
    label: '반출',
    icon: ArrowRightLeft,
    href: '/checkouts?status=pending',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: '반출/반입 승인',
  },
  {
    key: 'calibrationFactor',
    label: '보정계수',
    icon: Calculator,
    href: '/admin/calibration-factor-approvals',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    description: '보정계수 변경 승인',
  },
  {
    key: 'software',
    label: '소프트웨어',
    icon: Monitor,
    href: '/admin/software-approvals',
    color: 'text-pink-700 dark:text-pink-300',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: '소프트웨어 등록/변경 승인',
  },
];

interface PendingApprovalCardProps {
  className?: string;
}

/**
 * 역할별 표시 카테고리 필터링
 * - test_engineer: 자신의 요청만 표시 (장비, 교정, 대여, 반출)
 * - technical_manager: 팀 내 대기 항목 (장비, 교정, 대여, 보정계수)
 * - lab_manager: 시험소 전체 대기 항목
 * - system_admin: 전체 시스템 대기 항목
 */
function getVisibleCategories(role: string): Array<keyof Omit<PendingApprovalCounts, 'total'>> {
  switch (role.toLowerCase()) {
    case 'test_engineer':
      // 시험실무자: 본인이 신청한 항목의 상태 확인
      return ['equipment', 'calibration', 'rental', 'checkout'];
    case 'technical_manager':
      // 기술책임자: 팀 내 승인 대기 항목
      return ['equipment', 'calibration', 'rental', 'calibrationFactor'];
    case 'lab_manager':
      // 시험소 관리자: 해당 시험소 전체 승인 대기
      return ['equipment', 'calibration', 'rental', 'checkout', 'calibrationFactor', 'software'];
    case 'system_admin':
      // 시스템 관리자: 전체 시스템 승인 대기
      return ['equipment', 'calibration', 'rental', 'checkout', 'calibrationFactor', 'software'];
    default:
      return ['equipment', 'rental'];
  }
}

/**
 * 역할별 카드 제목
 */
function getCardTitle(role: string): string {
  switch (role.toLowerCase()) {
    case 'test_engineer':
      return '내 요청 현황';
    case 'technical_manager':
      return '팀 승인 대기';
    case 'lab_manager':
      return '시험소 승인 대기';
    case 'system_admin':
      return '전체 승인 대기';
    default:
      return '승인 대기';
  }
}

/**
 * 역할별 카드 설명
 */
function getCardDescription(role: string): string {
  switch (role.toLowerCase()) {
    case 'test_engineer':
      return '본인이 신청한 항목의 처리 현황';
    case 'technical_manager':
      return '팀 내 승인이 필요한 항목';
    case 'lab_manager':
      return '시험소 내 승인이 필요한 항목';
    case 'system_admin':
      return '전체 시스템 승인이 필요한 항목';
    default:
      return '승인 대기 중인 항목';
  }
}

export function PendingApprovalCard({ className }: PendingApprovalCardProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'user';

  // 승인 대기 카운트 조회 - 실제 API 호출
  const { data: counts, isLoading, error } = useQuery<PendingApprovalCounts>({
    queryKey: ['pending-approval-counts', userRole],
    queryFn: () => dashboardApi.getPendingApprovalCounts(userRole),
    staleTime: 30000, // 30초
    refetchInterval: 60000, // 1분마다 자동 새로고침
  });

  const visibleCategories = getVisibleCategories(userRole);
  const filteredCategories = categories.filter((cat) =>
    visibleCategories.includes(cat.key)
  );

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="p-4 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>승인 대기 정보를 불러오는데 실패했습니다.</span>
        </CardContent>
      </Card>
    );
  }

  const totalPending = filteredCategories.reduce(
    (sum, cat) => sum + (counts?.[cat.key] || 0),
    0
  );

  const cardTitle = getCardTitle(userRole);
  const cardDescription = getCardDescription(userRole);

  return (
    <div className={className} data-testid="pending-approval-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{cardTitle}</h2>
          <p className="text-sm text-muted-foreground">{cardDescription}</p>
        </div>
        {totalPending > 0 && (
          <Badge
            variant="secondary"
            className="bg-ul-red/10 text-ul-red dark:bg-ul-red/20 dark:text-red-300 animate-pulse"
          >
            총 {totalPending}건
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {filteredCategories.map((category) => {
          const Icon = category.icon;
          const count = counts?.[category.key] || 0;
          const hasItems = count > 0;

          return (
            <Link
              key={category.key}
              href={category.href}
              className="block group"
              aria-label={`${category.label} ${count}건 - ${category.description}`}
            >
              <Card
                className={cn(
                  'transition-all duration-200',
                  'hover:shadow-md hover:scale-[1.02]',
                  'cursor-pointer',
                  'focus-within:ring-2 focus-within:ring-ul-info focus-within:ring-offset-2',
                  hasItems && 'ring-2 ring-ul-red/30 dark:ring-ul-red/50'
                )}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                      'transition-colors duration-200',
                      category.bgColor,
                      'group-hover:scale-110 transition-transform'
                    )}
                  >
                    <Icon className={cn('h-6 w-6', category.color)} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {category.label}
                  </span>
                  <span
                    className={cn(
                      'text-2xl font-bold mt-1',
                      'transition-colors duration-200',
                      hasItems
                        ? 'text-ul-red dark:text-red-400'
                        : 'text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                  {hasItems && (
                    <span className="text-xs text-muted-foreground mt-1">
                      클릭하여 확인
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
