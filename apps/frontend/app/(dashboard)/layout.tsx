'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package2,
  FileSpreadsheet,
  ClipboardCheck,
  ClipboardList,
  Users,
  Bell,
  Settings,
  Wrench,
} from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MobileNav, NavItem } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserProfileDropdown } from '@/components/layout/UserProfileDropdown';
import '@/styles/accessibility.css';

interface SidebarItemProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  isActive?: boolean;
}

function SidebarItem({ icon, href, label, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
        'focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2 focus:ring-offset-ul-midnight',
        isActive
          ? 'text-white bg-white/15 font-medium'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/',
      label: '대시보드'
    },
    {
      icon: <Package2 className="h-5 w-5" />,
      href: '/equipment',
      label: '장비 관리'
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" />,
      href: '/rentals',
      label: '대여/반출 관리'
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      href: '/loans',
      label: '내 대여 현황'
    },
    {
      icon: <FileSpreadsheet className="h-5 w-5" />,
      href: '/calibration',
      label: '교정 관리'
    },
    {
      icon: <Users className="h-5 w-5" />,
      href: '/teams',
      label: '팀 관리'
    },
    {
      icon: <Bell className="h-5 w-5" />,
      href: '/notifications',
      label: '알림'
    },
    {
      icon: <Settings className="h-5 w-5" />,
      href: '/settings',
      label: '설정'
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* 스킵 네비게이션 */}
      <SkipLink href="#main-content" />

      {/* 데스크톱 사이드바 - UL Midnight Blue */}
      <aside
        className="fixed inset-y-0 z-20 hidden w-64 bg-ul-midnight md:block"
        role="navigation"
        aria-label="메인 네비게이션"
      >
        {/* 사이드바 헤더 */}
        <div className="flex h-14 items-center border-b border-white/10 px-4">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 font-semibold text-white",
              "focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2 focus:ring-offset-ul-midnight rounded-md",
              "hover:bg-white/10 transition-all duration-200",  // 호버 배경
              "px-2 py-1.5 -mx-2",  // 클릭 영역 확대
              "group"  // 그룹 호버 효과
            )}
            aria-label="홈으로 이동"
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red",
              "group-hover:scale-110 transition-transform"  // 호버 시 확대
            )}>
              <Wrench className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="group-hover:text-ul-info transition-colors">
              장비 관리 시스템
            </span>
          </Link>
        </div>

        {/* 네비게이션 링크 */}
        <nav className="flex flex-col gap-1 p-4" role="menubar">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              href={item.href}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}
        </nav>

        {/* 사이드바 하단 - UL 브랜딩 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-ul-red font-bold text-xs">UL Solutions</span>
            <span className="text-white/30 text-xs">|</span>
            <span className="text-white/40 text-xs">Quality & Safety</span>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* 헤더 */}
        <Header
          title="장비 관리 시스템"
          leftContent={
            <MobileNav
              navItems={navItems}
              brandName="장비 관리 시스템"
              brandIcon={<Wrench className="h-6 w-6" aria-hidden="true" />}
            />
          }
          rightContent={
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserProfileDropdown />
            </div>
          }
        />

        {/* 메인 콘텐츠 */}
        <main
          id="main-content"
          className="flex-1 overflow-auto"
          role="main"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* 라이브 영역 (스크린리더 알림용) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-announcements"
      />
    </div>
  );
}
