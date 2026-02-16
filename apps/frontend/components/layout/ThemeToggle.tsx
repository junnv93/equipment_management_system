'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
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

  // Hydration 이슈 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={getHeaderButtonClasses()}>
        <Sun className={getHeaderSizeClasses('icon')} />
        <span className="sr-only">테마 변경</span>
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
          aria-label="테마 변경"
        >
          {theme === 'dark' ? (
            <Moon className={getHeaderSizeClasses('icon')} />
          ) : theme === 'light' ? (
            <Sun className={getHeaderSizeClasses('icon')} />
          ) : (
            <Monitor className={getHeaderSizeClasses('icon')} />
          )}
          <span className="sr-only">테마 변경</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Sun className="h-4 w-4" aria-hidden="true" />
          <span>라이트 모드</span>
          {theme === 'light' && <span className="ml-auto text-ul-green">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4" aria-hidden="true" />
          <span>다크 모드</span>
          {theme === 'dark' && <span className="ml-auto text-ul-green">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Monitor className="h-4 w-4" aria-hidden="true" />
          <span>시스템 설정</span>
          {theme === 'system' && <span className="ml-auto text-ul-green">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
