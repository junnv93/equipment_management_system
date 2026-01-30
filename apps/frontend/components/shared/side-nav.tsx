'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Clipboard,
  Package,
  Users,
  FileText,
  BarChart,
  Bell,
  HelpCircle,
} from 'lucide-react';

interface SideNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: {
    title: string;
    href: string;
  }[];
}

export function SideNav() {
  const pathname = usePathname();

  const navItems: SideNavItem[] = [
    {
      title: '대시보드',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: '장비 관리',
      href: '/dashboard/equipment',
      icon: <Package className="h-5 w-5" />,
      submenu: [
        {
          title: '장비 목록',
          href: '/dashboard/equipment',
        },
        {
          title: '장비 추가',
          href: '/dashboard/equipment/new',
        },
        {
          title: '장비 분류 관리',
          href: '/dashboard/equipment/categories',
        },
      ],
    },
    {
      title: '대여/반출 관리',
      href: FRONTEND_ROUTES.CHECKOUTS.LIST,
      icon: <Clipboard className="h-5 w-5" />,
      submenu: [
        {
          title: '대여/반출 목록',
          href: FRONTEND_ROUTES.CHECKOUTS.LIST,
        },
        {
          title: '반출 신청',
          href: FRONTEND_ROUTES.CHECKOUTS.CREATE,
        },
        {
          title: '승인 관리',
          href: FRONTEND_ROUTES.CHECKOUTS.MANAGE,
        },
        {
          title: '확인 대기 목록',
          href: FRONTEND_ROUTES.CHECKOUTS.PENDING_CHECKS,
        },
      ],
    },
    {
      title: '교정 관리',
      href: '/dashboard/calibrations',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: '사용자 관리',
      href: '/dashboard/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: '보고서',
      href: '/dashboard/reports',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: '통계',
      href: '/dashboard/statistics',
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: '알림 센터',
      href: '/dashboard/notifications',
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: '설정',
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: '도움말',
      href: '/dashboard/help',
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="flex flex-col space-y-1 px-2">
      {navItems.map((item) => (
        <div key={item.href} className="pb-1">
          <Link
            href={item.href}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              pathname === item.href || pathname.startsWith(`${item.href}/`)
                ? 'bg-accent text-accent-foreground'
                : 'transparent'
            )}
          >
            {item.icon}
            <span className="ml-3">{item.title}</span>
          </Link>
        </div>
      ))}
    </nav>
  );
}
