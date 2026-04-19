'use client';

import { useEffect, useState } from 'react';

/**
 * Web 표준 `BeforeInstallPromptEvent` 타입 (TypeScript lib에 미포함).
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
  /** 설치 가능 여부 — `true`이면 Install 버튼 표시 */
  canInstall: boolean;
  /** 설치 프롬프트 표시 */
  promptInstall: () => Promise<void>;
  /** 이미 설치됐는지 (`display-mode: standalone`) */
  isInstalled: boolean;
}

/**
 * PWA 설치 프롬프트 훅.
 *
 * `beforeinstallprompt` 이벤트를 캡처해 적절한 타이밍에 표시.
 * Android Chrome, Edge(데스크톱), Samsung Internet 지원.
 * iOS Safari는 `beforeinstallprompt` 미지원 — 매뉴얼 안내 필요.
 *
 * @see https://web.dev/customize-install/
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // standalone 모드 = 이미 설치된 상태
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', handleChange);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mq.removeEventListener('change', handleChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<void> => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return {
    canInstall: deferredPrompt !== null && !isInstalled,
    promptInstall,
    isInstalled,
  };
}
