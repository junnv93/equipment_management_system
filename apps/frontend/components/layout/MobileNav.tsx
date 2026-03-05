'use client';

/**
 * MobileNav (Client Component)
 *
 * 모바일 환경에서 사용하는 네비게이션 드로어 컴포넌트
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
import { FOCUS_TOKENS, getTransitionClasses } from '@/lib/design-tokens';

export interface NavItem {
  icon: React.ReactNode;
  href: string;
  label: string;
  badge?: number; // 선택적: 알림 배지 (승인 대기 건수 등)
}

// aria-live 영역에 스크린리더 알림 전송
function announceToScreenReader(message: string) {
  const liveRegion = document.getElementById('live-announcements');
  if (liveRegion) {
    liveRegion.textContent = message;
    // 다음 알림을 위해 텍스트 초기화 (약간의 딜레이 필요)
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

interface MobileNavProps {
  navItems: NavItem[];
  brandName?: string;
  brandIcon?: React.ReactNode;
}

// 네비게이션 링크를 memo로 래핑 (rerender-memo)
interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavLink = memo(function NavLink({ item, isActive, onClick }: NavLinkProps) {
  const t = useTranslations('navigation');
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-3 relative',
        // SSOT: design-tokens — motion + focus-visible
        getTransitionClasses('fast', ['background-color', 'color']),
        FOCUS_TOKENS.classes.default,
        isActive
          ? 'text-blue-600 bg-blue-50 font-medium dark:text-blue-400 dark:bg-blue-900/20'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800'
      )}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
    >
      <span aria-hidden="true">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          aria-label={t('layout.notificationCount', { count: item.badge })}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
});

export function MobileNav({ navItems, brandName, brandIcon }: MobileNavProps) {
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
        menuButtonRef.current?.focus(); // ESC 시 메뉴 버튼으로 포커스 복귀
        return;
      }

      // 포커스 트랩: Tab 키가 드로어 내에서만 동작하도록
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
      // 약간의 딜레이 후 닫기 버튼에 포커스
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      // aria-live 영역에 알림
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
    menuButtonRef.current?.focus(); // 포커스 복귀
    announceToScreenReader(t('layout.menuClosed'));
  }, [t]);

  // isActive 판별 함수를 useCallback으로 안정화
  const checkIsActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/';
      return pathname === href || pathname?.startsWith(`${href}/`);
    },
    [pathname]
  );

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

      {/* 오버레이 - prefers-reduced-motion 지원 */}
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 md:hidden',
            'motion-safe:transition-opacity motion-safe:duration-300',
            'motion-reduce:transition-none'
          )}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* 모바일 드로어 - prefers-reduced-motion 지원 */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('layout.mainNav')}
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-xl md:hidden',
          'transform',
          // prefers-reduced-motion 지원
          'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-in-out',
          'motion-reduce:transition-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* 드로어 헤더 */}
        <div className="flex h-14 items-center justify-between border-b dark:border-gray-700 px-4">
          <div className="flex items-center gap-2 font-semibold dark:text-white">
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

        {/* 네비게이션 링크 */}
        <nav
          role="navigation"
          aria-label={t('layout.mainNav')}
          className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={checkIsActive(item.href)}
              onClick={closeMenu}
            />
          ))}
        </nav>
      </div>
    </>
  );
}
