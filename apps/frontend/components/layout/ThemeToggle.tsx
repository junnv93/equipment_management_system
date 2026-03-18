'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getHeaderButtonClasses, getHeaderSizeClasses } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * 테마 토글
 *
 * Design System:
 * - SSOT: lib/design-tokens/header.ts
 * - 반응형: 모바일 44px, 데스크톱 40px (WCAG AAA)
 * - 아이콘: 모바일 24px, 데스크톱 20px
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('navigation');

  // Hydration 이슈 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={getHeaderButtonClasses()}>
        <Sun className={getHeaderSizeClasses('icon')} />
        <span className="sr-only">{t('layout.themeToggle')}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('text-foreground', getHeaderButtonClasses())}
          aria-label={t('layout.themeToggle')}
        >
          {theme === 'dark' ? (
            <Moon className={getHeaderSizeClasses('icon')} />
          ) : theme === 'light' ? (
            <Sun className={getHeaderSizeClasses('icon')} />
          ) : (
            <Monitor className={getHeaderSizeClasses('icon')} />
          )}
          <span className="sr-only">{t('layout.themeToggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Sun className="h-4 w-4" aria-hidden="true" />
          <span>{t('layout.lightMode')}</span>
          {theme === 'light' && <span className="ml-auto text-brand-ok">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4" aria-hidden="true" />
          <span>{t('layout.darkMode')}</span>
          {theme === 'dark' && <span className="ml-auto text-brand-ok">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Monitor className="h-4 w-4" aria-hidden="true" />
          <span>{t('layout.systemMode')}</span>
          {theme === 'system' && <span className="ml-auto text-brand-ok">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
