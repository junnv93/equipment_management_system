'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
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
  labelKey: string; // i18n key under 'dashboard.quickActions'
  href: string;
  icon: React.ElementType;
  variant?: 'default' | 'outline' | 'secondary';
}

interface QuickActionButtonsProps {
  className?: string;
}

// 역할별 빠른 액션 정의 (SSOT: FRONTEND_ROUTES 사용, label은 i18n key)
const actionsByRole: Record<string, QuickAction[]> = {
  test_engineer: [
    {
      labelKey: 'registerEquipment',
      href: FRONTEND_ROUTES.EQUIPMENT.CREATE,
      icon: Plus,
      variant: 'default',
    },
    {
      labelKey: 'createCheckout',
      href: FRONTEND_ROUTES.CHECKOUTS.CREATE,
      icon: ArrowRightLeft,
      variant: 'outline',
    },
    {
      labelKey: 'checkoutStatus',
      href: FRONTEND_ROUTES.CHECKOUTS.LIST,
      icon: ClipboardList,
      variant: 'outline',
    },
  ],
  technical_manager: [
    {
      labelKey: 'approvalManagement',
      href: FRONTEND_ROUTES.ADMIN.EQUIPMENT_APPROVALS,
      icon: CheckSquare,
      variant: 'default',
    },
    {
      labelKey: 'registerEquipment',
      href: FRONTEND_ROUTES.EQUIPMENT.CREATE,
      icon: Plus,
      variant: 'outline',
    },
  ],
  quality_manager: [
    {
      labelKey: 'approvalManagement',
      href: FRONTEND_ROUTES.ADMIN.APPROVALS,
      icon: CheckSquare,
      variant: 'default',
    },
    {
      labelKey: 'calibrationPlans',
      href: FRONTEND_ROUTES.CALIBRATION_PLANS.LIST,
      icon: FileSpreadsheet,
      variant: 'outline',
    },
  ],
  lab_manager: [
    {
      labelKey: 'approvalManagement',
      href: FRONTEND_ROUTES.ADMIN.EQUIPMENT_APPROVALS,
      icon: CheckSquare,
      variant: 'default',
    },
    {
      labelKey: 'userManagement',
      href: FRONTEND_ROUTES.ADMIN.USERS,
      icon: Users,
      variant: 'outline',
    },
    {
      labelKey: 'systemSettings',
      href: FRONTEND_ROUTES.SETTINGS.INDEX,
      icon: Settings,
      variant: 'outline',
    },
  ],
  system_admin: [
    {
      labelKey: 'approvalManagement',
      href: FRONTEND_ROUTES.ADMIN.EQUIPMENT_APPROVALS,
      icon: CheckSquare,
      variant: 'default',
    },
    {
      labelKey: 'userManagement',
      href: FRONTEND_ROUTES.ADMIN.USERS,
      icon: Users,
      variant: 'outline',
    },
    {
      labelKey: 'systemSettings',
      href: FRONTEND_ROUTES.SETTINGS.INDEX,
      icon: Settings,
      variant: 'outline',
    },
  ],
  default: [
    {
      labelKey: 'equipmentList',
      href: FRONTEND_ROUTES.EQUIPMENT.LIST,
      icon: ClipboardList,
      variant: 'default',
    },
    {
      labelKey: 'checkoutStatus',
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

  const t = useTranslations('dashboard.quickActions');
  const userRole = session?.user?.role?.toLowerCase() || 'default';
  const actions = actionsByRole[userRole] || actionsByRole['default'];

  return (
    <nav className={`flex flex-wrap gap-2 ${className || ''}`} aria-label={t('ariaLabel')}>
      {actions.map((action) => {
        const Icon = action.icon;
        const label = t(action.labelKey as Parameters<typeof t>[0]);
        return (
          <Button
            key={action.href}
            variant={action.variant || 'default'}
            asChild
            className={`gap-2 ${DASHBOARD_FOCUS.default} hover:shadow-sm hover:scale-[1.02] ${DASHBOARD_MOTION.cardHover} motion-reduce:transition-none`}
          >
            <Link href={action.href} aria-label={label}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
