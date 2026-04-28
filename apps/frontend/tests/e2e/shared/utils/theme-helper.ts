/**
 * 테마 헬퍼 — Playwright에서 next-themes 다크/라이트 모드 토글.
 *
 * 메커니즘:
 *  - next-themes는 localStorage 'theme' 키 + `<html class="light|dark">`로 동작.
 *  - `addInitScript`로 페이지 스크립트 실행 전 localStorage + className 미리 설정 → FOUC 방지.
 *
 * 사용 시점:
 *  - `page.goto()` 전에 호출.
 *  - 라이트로 복귀 시에도 동일 함수 호출 (overwrite).
 */
import type { Page } from '@playwright/test';

export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((t: 'light' | 'dark') => {
    try {
      window.localStorage.setItem('theme', t);
    } catch {
      /* file:// or SSR — ignore */
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(t);
    }
  }, theme);
}
