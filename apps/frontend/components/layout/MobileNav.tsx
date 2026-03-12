'use client';

/**
 * MobileNav (Client Component)
 *
 * 모바일 환경에서 사용하는 네비게이션 드로어 컴포넌트
 * - 섹션 그룹핑: FilteredNavSection[] 기반 (Phase 1 - nav-config.ts SSOT)
 * - 디자인 토큰: getMobileNavItemClasses() (Phase 2 - mobile-nav.ts SSOT)
 *
 * 접근성 (WCAG 2.1 AA):
 * - ESC 키로 닫기
 * - 포커스 트랩 (드로어 내 포커스 유지)
 * - aria-modal, aria-label 속성
 * - prefers-reduced-motion 존중
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
import {
  FOCUS_TOKENS,
  MOBILE_NAV_TOKENS,
  MOBILE_NAV_DRAWER_TOKENS,
  MOBILE_NAV_SECTION_TOKENS,
  TRANSITION_PRESETS,
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // 경로 변경 시 드로어 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ESC 키로 닫기 + 포커스 트랩
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 드로어 열릴 때 첫 번째 요소에 포커스 + body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      announceToScreenReader(t('layout.menuOpened'));
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, t]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    menuButtonRef.current?.focus();
    announceToScreenReader(t('layout.menuClosed'));
  }, [t]);

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <Button
        ref={menuButtonRef}
        variant="ghost"
        size="icon"
        className={cn('md:hidden', FOCUS_TOKENS.classes.default)}
        onClick={toggleMenu}
        aria-label={isOpen ? t('layout.menuClose') : t('layout.menuOpen')}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 md:hidden',
            TRANSITION_PRESETS.moderateOpacity
          )}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* 모바일 드로어 */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('layout.mainNav')}
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 md:hidden',
          MOBILE_NAV_DRAWER_TOKENS.background,
          MOBILE_NAV_DRAWER_TOKENS.shadow,
          MOBILE_NAV_DRAWER_TOKENS.border,
          'transform',
          TRANSITION_PRESETS.moderateTransform,
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
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
            ref={closeButtonRef}
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
      </div>
    </>
  );
}
