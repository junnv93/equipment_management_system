'use client';

/**
 * Sidebar State Hook
 *
 * localStorage 기반 사이드바 접기/펼치기 상태 관리
 * - SSR 안전: 초기값 false, useEffect에서 localStorage 읽기
 * - 태블릿 기본값: 768–1024px에서 collapsed 기본 (이슈 #15)
 * - 키보드 단축키: Ctrl+B (VS Code 패턴)
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

/** 태블릿 환경 감지 (768–1024px) — SSR 안전 */
function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      return next;
    });
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
    localStorage.setItem(STORAGE_KEY, 'false');
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

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
