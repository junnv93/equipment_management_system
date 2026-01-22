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

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  variant?: 'default' | 'outline' | 'secondary';
}

interface QuickActionButtonsProps {
  className?: string;
}

// 역할별 빠른 액션 정의
const actionsByRole: Record<string, QuickAction[]> = {
  test_engineer: [
    { label: '장비 등록', href: '/equipment/create', icon: Plus, variant: 'default' },
    { label: '대여 신청', href: '/rentals/create', icon: ClipboardList, variant: 'outline' },
    { label: '반출 신청', href: '/checkouts/create', icon: ArrowRightLeft, variant: 'outline' },
  ],
  technical_manager: [
    { label: '승인 관리', href: '/admin/equipment-approvals', icon: CheckSquare, variant: 'default' },
    { label: '교정 등록', href: '/calibration/register', icon: FileSpreadsheet, variant: 'outline' },
    { label: '장비 등록', href: '/equipment/create', icon: Plus, variant: 'outline' },
  ],
  lab_manager: [
    { label: '승인 관리', href: '/admin/equipment-approvals', icon: CheckSquare, variant: 'default' },
    { label: '사용자 관리', href: '/admin/users', icon: Users, variant: 'outline' },
    { label: '시스템 설정', href: '/settings', icon: Settings, variant: 'outline' },
  ],
  system_admin: [
    { label: '승인 관리', href: '/admin/equipment-approvals', icon: CheckSquare, variant: 'default' },
    { label: '사용자 관리', href: '/admin/users', icon: Users, variant: 'outline' },
    { label: '시스템 설정', href: '/settings', icon: Settings, variant: 'outline' },
  ],
  default: [
    { label: '장비 목록', href: '/equipment', icon: ClipboardList, variant: 'default' },
    { label: '대여 현황', href: '/loans', icon: ArrowRightLeft, variant: 'outline' },
  ],
};

export function QuickActionButtons({ className }: QuickActionButtonsProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={`flex flex-wrap gap-2 ${className || ''}`}>
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  const userRole = session?.user?.role?.toLowerCase() || 'default';
  const actions = actionsByRole[userRole] || actionsByRole['default'];

  return (
    <nav
      className={`flex flex-wrap gap-2 ${className || ''}`}
      aria-label="빠른 액션"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.href}
            variant={action.variant || 'default'}
            asChild
            className="gap-2"
          >
            <Link href={action.href}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
