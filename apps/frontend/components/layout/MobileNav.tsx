'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface NavItem {
  icon: React.ReactNode;
  href: string;
  label: string;
}

interface MobileNavProps {
  navItems: NavItem[];
  brandName?: string;
  brandIcon?: React.ReactNode;
}

export function MobileNav({ navItems, brandName = '장비 관리 시스템', brandIcon }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 경로 변경 시 드로어 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // 드로어 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMenu}
        aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* 모바일 드로어 */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="메인 네비게이션"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl md:hidden',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* 드로어 헤더 */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 font-semibold">
            {brandIcon}
            <span>{brandName}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMenu}
            aria-label="메뉴 닫기"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* 네비게이션 링크 */}
        <nav
          role="navigation"
          aria-label="메인 네비게이션"
          className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
                aria-current={isActive ? 'page' : undefined}
                onClick={closeMenu}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
