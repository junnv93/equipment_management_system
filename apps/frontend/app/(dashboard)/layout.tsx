'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  Wrench, 
  Users, 
  ClipboardList, 
  Calendar, 
  Settings, 
  BellRing, 
  LogOut,
  LayoutDashboard, 
  Package2,
  FileSpreadsheet,
  ClipboardCheck,
  Bell
} from 'lucide-react';
import { ReactNode } from "react";
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface SidebarItemProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  isActive?: boolean;
}

function SidebarItem({ icon, href, label, isActive }: SidebarItemProps) {
  const baseClasses = "flex items-center gap-3 rounded-lg px-3 py-2 transition-all";
  const activeClasses = "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50 font-medium";
  const inactiveClasses = "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800";
  
  return (
    <Link 
      href={href}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
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

  const navigation = [
    { name: '대시보드', href: '/dashboard', icon: LayoutGrid },
    { name: '장비 관리', href: '/equipment', icon: Wrench },
    { name: '사용자 관리', href: '/users', icon: Users },
    { name: '대여 현황', href: '/loans', icon: ClipboardList },
    { name: '교정 일정', href: '/calibration', icon: Calendar },
  ];

  const bottomNavigation = [
    { name: '설정', href: '/settings', icon: Settings },
    { name: '알림', href: '/notifications', icon: BellRing },
    { name: '로그아웃', href: '/auth/logout', icon: LogOut },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 사이드바 */}
      <div className="fixed inset-y-0 z-10 w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex h-14 items-center border-b px-4 border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span>장비 관리 시스템</span>
          </Link>
        </div>
        <div className="flex flex-col gap-1 p-4">
          <SidebarItem 
            icon={<LayoutDashboard className="h-5 w-5" />} 
            href="/" 
            label="대시보드" 
            isActive={pathname === "/"}
          />
          <SidebarItem 
            icon={<Package2 className="h-5 w-5" />} 
            href="/equipment" 
            label="장비 관리" 
            isActive={pathname?.startsWith("/equipment")}
          />
          <SidebarItem 
            icon={<ClipboardCheck className="h-5 w-5" />} 
            href="/rentals" 
            label="대여/반출 관리" 
            isActive={pathname?.startsWith("/rentals")}
          />
          <SidebarItem 
            icon={<ClipboardList className="h-5 w-5" />} 
            href="/loans" 
            label="내 대여 현황" 
            isActive={pathname?.startsWith("/loans")}
          />
          <SidebarItem 
            icon={<FileSpreadsheet className="h-5 w-5" />} 
            href="/calibration" 
            label="교정 관리" 
            isActive={pathname?.startsWith("/calibration")}
          />
          <SidebarItem 
            icon={<Users className="h-5 w-5" />} 
            href="/teams" 
            label="팀 관리" 
            isActive={pathname?.startsWith("/teams")}
          />
          <SidebarItem 
            icon={<Bell className="h-5 w-5" />} 
            href="/notifications" 
            label="알림" 
            isActive={pathname?.startsWith("/notifications")}
          />
          <SidebarItem 
            icon={<Settings className="h-5 w-5" />} 
            href="/settings" 
            label="설정" 
            isActive={pathname?.startsWith("/settings")}
          />
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="flex flex-col flex-1 ml-64">
        <header className="flex h-14 items-center gap-4 border-b bg-white dark:bg-gray-950 dark:border-gray-800 px-6">
          <h1 className="text-lg font-semibold">장비 관리 시스템</h1>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 