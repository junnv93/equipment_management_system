'use client';

/**
 * MobileNav (Client Component)
 *
 * 모바일 환경에서 사용하는 네비게이션 드로어 컴포넌트
 * - 섹션 그룹핑: FilteredNavSection[] 기반 (Phase 1 - nav-config.ts SSOT)
 * - 디자인 토큰: getMobileNavItemClasses() (Phase 2 - mobile-nav.ts SSOT)
 *
 * 접근성 (WCAG 2.1 AA):
 * - Radix Dialog 기반 Sheet로 포커스 트랩/스크롤 잠금/Escape 닫기 네이티브 처리
 * - aria-modal, aria-label 속성 (Radix 자동 관리)
 * - 닫을 때 트리거 버튼으로 자동 포커스 반환
 * - prefers-reduced-motion 존중 (Sheet 애니메이션)
 *
 * 성능 최적화 (vercel-react-best-practices):
 * - useCallback으로 이벤트 핸들러 안정화
 * - memo로 NavLink 컴포넌트 최적화
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  FOCUS_TOKENS,
  MOBILE_NAV_TOKENS,
  MOBILE_NAV_DRAWER_TOKENS,
  MOBILE_NAV_SECTION_TOKENS,
  getMobileNavItemClasses,
} from '@/lib/design-tokens';
import type { FilteredNavItem, FilteredNavSection } from '@/lib/navigation/nav-config';
import { isNavItemActive } from '@/lib/navigation/nav-config';

// aria-live 영역에 스크린리더 알림 전송
function announceToScreenReader(message: string) {
  const liveRegion = document.getElementById('live-announcements');
  if (liveRegion) {
    liveRegion.textContent = message;
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

interface MobileNavProps {
  navSections: FilteredNavSection[];
  brandName?: string;
  brandIcon?: React.ReactNode;
}

// 네비게이션 링크를 memo로 래핑 (rerender-memo)
interface NavLinkProps {
  item: FilteredNavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavLink = memo(function NavLink({ item, isActive, onClick }: NavLinkProps) {
  const t = useTranslations('navigation');
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(getMobileNavItemClasses(isActive))}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
    >
      <span aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className={cn(
            'ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
            MOBILE_NAV_TOKENS.badge.background,
            MOBILE_NAV_TOKENS.badge.text
          )}
          aria-label={t('layout.notificationCount', { count: item.badge })}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
});

export function MobileNav({ navSections, brandName, brandIcon }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const displayBrandName = brandName ?? t('layout.systemName');
  const navRef = useRef<HTMLElement>(null);

  // 경로 변경 시 드로어 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 데스크톱 뷰포트 전환 시 드로어 닫기 (body scroll lock 방지)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => {
      if (mq.matches) setIsOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 스크린리더 알림
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      announceToScreenReader(open ? t('layout.menuOpened') : t('layout.menuClosed'));
    },
    [t]
  );

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    announceToScreenReader(t('layout.menuClosed'));
  }, [t]);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {/* 햄버거 메뉴 버튼 — SheetTrigger로 포커스 반환 자동 처리 */}
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('md:hidden', FOCUS_TOKENS.classes.default)}
          aria-label={isOpen ? t('layout.menuClose') : t('layout.menuOpen')}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </Button>
      </SheetTrigger>

      {/* 모바일 드로어 */}
      <SheetContent
        side="left"
        hideClose
        className={MOBILE_NAV_DRAWER_TOKENS.content}
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => {
          // 기본 포커스(컨테이너)를 막고 첫 번째 네비게이션 링크로 이동
          e.preventDefault();
          const firstLink = navRef.current?.querySelector('a');
          firstLink?.focus();
        }}
      >
        <SheetTitle className="sr-only">{t('layout.mainNav')}</SheetTitle>

        {/* 드로어 헤더 */}
        <div
          className={cn(
            'flex h-14 items-center justify-between px-4',
            MOBILE_NAV_DRAWER_TOKENS.headerBorder
          )}
        >
          <div
            className={cn('flex items-center gap-2 font-semibold', MOBILE_NAV_DRAWER_TOKENS.text)}
          >
            {brandIcon}
            <span>{displayBrandName}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMenu}
            aria-label={t('layout.menuClose')}
            className={FOCUS_TOKENS.classes.default}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* 네비게이션 섹션 */}
        <nav
          ref={navRef}
          aria-label={t('layout.mainNav')}
          className="flex flex-col overflow-y-auto max-h-[calc(100vh-3.5rem)] p-2"
        >
          {navSections.map((section, sectionIndex) => (
            <div key={section.sectionLabel}>
              {/* 섹션 구분선 (첫 섹션 제외) */}
              {sectionIndex > 0 && <div className={MOBILE_NAV_SECTION_TOKENS.divider} />}
              {/* 섹션 라벨 */}
              <div
                className={cn(
                  MOBILE_NAV_SECTION_TOKENS.label,
                  sectionIndex === 0
                    ? MOBILE_NAV_SECTION_TOKENS.firstSpacing
                    : MOBILE_NAV_SECTION_TOKENS.spacing
                )}
              >
                {section.sectionLabel}
              </div>
              {/* 아이템 목록 */}
              <div className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={isNavItemActive(item.href, pathname)}
                    onClick={closeMenu}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
