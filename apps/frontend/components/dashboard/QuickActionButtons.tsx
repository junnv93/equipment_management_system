'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Plus,
  ClipboardList,
  ArrowRightLeft,
  CheckSquare,
  Settings,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { DASHBOARD_MOTION, DASHBOARD_FOCUS, getDashboardStaggerDelay } from '@/lib/design-tokens';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  variant?: 'default' | 'outline' | 'secondary';
}

interface QuickActionButtonsProps {
  className?: string;
}

// 역할별 빠른 액션 정의 (SSOT: FRONTEND_ROUTES 사용)
const actionsByRole: Record<string, QuickAction[]> = {
  test_engineer: [
    { label: '장비 등록', href: FRONTEND_ROUTES.EQUIPMENT.CREATE, icon: Plus, variant: 'default' },
    {
      label: '반출 신청',
      href: FRONTEND_ROUTES.CHECKOUTS.CREATE,
      icon: ArrowRightLeft,
      variant: 'outline',
    },
    {
      label: '대여/반출 현황',
      href: FRONTEND_ROUTES.CHECKOUTS.LIST,
      icon: ClipboardList,
      variant: 'outline',
    },
  ],
  technical_manager: [
    {
      label: '승인 관리',
      href: FRONTEND_ROUTES.ADMIN.EQUIPMENT_APPROVALS,
      icon: CheckSquare,
      variant: 'default',
    },
    { label: '장비 등록', href: FRONTEND_ROUTES.EQUIPMENT.CREATE, icon: Plus, variant: 'outline' },
  ],
  quality_manager: [
    {
      label: '승인 관리',
      href: FRONTEND_ROUTES.ADMIN.APPROVALS,
      icon: CheckSquare,
      variant: 'default',
    },
    {
      label: '교정계획서',
      href: FRONTEND_ROUTES.CALIBRATION_PLANS.LIST,
      icon: FileSpreadsheet,
      variant: 'outline',
    },
  ],
  lab_manager: [
    {
      label: '승인 관리',
      href: FRONTEND_ROUTES.ADMIN.EQUIPMENT_APPROVALS,
      icon: CheckSquare,
      variant: 'default',
    },
    { label: '사용자 관리', href: FRONTEND_ROUTES.ADMIN.USERS, icon: Users, variant: 'outline' },
    { label: '시스템 설정', href: '/settings', icon: Settings, variant: 'outline' },
  ],
  system_admin: [
    {
      label: '승인 관리',
      href: FRONTEND_ROUTES.ADMIN.EQUIPMENT_APPROVALS,
      icon: CheckSquare,
      variant: 'default',
    },
    { label: '사용자 관리', href: FRONTEND_ROUTES.ADMIN.USERS, icon: Users, variant: 'outline' },
    { label: '시스템 설정', href: '/settings', icon: Settings, variant: 'outline' },
  ],
  default: [
    {
      label: '장비 목록',
      href: FRONTEND_ROUTES.EQUIPMENT.LIST,
      icon: ClipboardList,
      variant: 'default',
    },
    {
      label: '대여/반출 현황',
      href: FRONTEND_ROUTES.CHECKOUTS.LIST,
      icon: ArrowRightLeft,
      variant: 'outline',
    },
  ],
};

export function QuickActionButtons({ className }: QuickActionButtonsProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={`flex flex-wrap gap-2 ${className || ''}`}>
        <Skeleton
          className="h-10 w-24"
          style={{ animationDelay: getDashboardStaggerDelay(0, 'list') }}
        />
        <Skeleton
          className="h-10 w-24"
          style={{ animationDelay: getDashboardStaggerDelay(1, 'list') }}
        />
        <Skeleton
          className="h-10 w-24"
          style={{ animationDelay: getDashboardStaggerDelay(2, 'list') }}
        />
      </div>
    );
  }

  const userRole = session?.user?.role?.toLowerCase() || 'default';
  const actions = actionsByRole[userRole] || actionsByRole['default'];

  return (
    <nav className={`flex flex-wrap gap-2 ${className || ''}`} aria-label="빠른 액션">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.href}
            variant={action.variant || 'default'}
            asChild
            className={`gap-2 ${DASHBOARD_FOCUS.default} hover:shadow-sm hover:scale-[1.02] ${DASHBOARD_MOTION.cardHover} motion-reduce:transition-none`}
          >
            <Link href={action.href} aria-label={action.label}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
