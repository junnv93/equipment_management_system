'use client';

/**
 * Sidebar State Hook
 *
 * localStorage 기반 사이드바 접기/펼치기 상태 관리
 * - SSR 안전: 초기값 false, useEffect에서 localStorage 읽기
 * - 태블릿 기본값: 768–1024px에서 collapsed 기본 (이슈 #15)
 * - 키보드 단축키: Ctrl+B (VS Code 패턴)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { track } from '@/lib/analytics/track';

const STORAGE_KEY = 'sidebar-collapsed';
const ANALYTICS_DEBOUNCE_MS = 200;

/** 태블릿 환경 감지 (768–1024px) — SSR 안전 */
function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // 빠른 연타 시 analytics 이벤트 폭주 방지 (200ms debounce)
  const analyticsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackToggleDebounced = useCallback((nextCollapsed: boolean) => {
    if (analyticsTimerRef.current) clearTimeout(analyticsTimerRef.current);
    analyticsTimerRef.current = setTimeout(() => {
      track('sidebar.toggle', { state: nextCollapsed ? 'collapsed' : 'expanded' });
      analyticsTimerRef.current = null;
    }, ANALYTICS_DEBOUNCE_MS);
  }, []);

  // unmount 시 보류 중인 debounce 타이머 정리 (verify-frontend-state Step 13)
  useEffect(() => {
    return () => {
      if (analyticsTimerRef.current) clearTimeout(analyticsTimerRef.current);
    };
  }, []);

  // SSR 이후 localStorage에서 상태 복원
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    } else if (isTablet()) {
      // 태블릿: 초기값 collapsed
      setIsCollapsed(true);
    }
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      trackToggleDebounced(next);
      return next;
    });
  }, [trackToggleDebounced]);

  const expand = useCallback(() => {
    setIsCollapsed(false);
    localStorage.setItem(STORAGE_KEY, 'false');
    trackToggleDebounced(false);
  }, [trackToggleDebounced]);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    trackToggleDebounced(true);
  }, [trackToggleDebounced]);

  // Ctrl+B / ⌘+B 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isCollapsed, toggle, expand, collapse };
}
