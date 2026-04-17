'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FRONTEND_ROUTES, parseEquipmentQRUrl } from '@equipment-management/shared-constants';
import { parseManagementNumber } from '@equipment-management/schemas';
import { toast } from '@/components/ui/use-toast';
import { ManualEntryFallback } from './ManualEntryFallback';

type ScannerState =
  | { phase: 'initializing' }
  | { phase: 'scanning' }
  | { phase: 'denied' }
  | { phase: 'unavailable' }
  | { phase: 'error'; message: string };

/**
 * 인증 세션 내 QR 연속 스캔 뷰.
 *
 * 설계:
 * - `html5-qrcode`를 `useEffect` 내 **동적 import** (SSR window 참조 회피)
 * - 마운트 시 1회 카메라 권한 요청 → 거부 시 수동 입력 영구 전환 (재요청 금지)
 * - 스캔 결과 검증은 `parseEquipmentQRUrl` + `parseManagementNumber` SSOT
 * - Cleanup: unmount 시 `Html5Qrcode.stop() + clear()` 반드시 호출 (MediaStream 해제)
 * - 접근성: live region 진행 상태, ESC 키 지원 (브라우저 기본)
 */
export function QRScannerView() {
  const t = useTranslations('qr.scanner');
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scannerRef = React.useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const [state, setState] = React.useState<ScannerState>({ phase: 'initializing' });

  const handleResult = React.useCallback(
    (decoded: string) => {
      const parsedUrl = parseEquipmentQRUrl(decoded);
      if (parsedUrl) {
        router.push(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(parsedUrl.managementNumber));
        return;
      }
      if (parseManagementNumber(decoded)) {
        router.push(FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(decoded));
        return;
      }
      toast({
        variant: 'destructive',
        description: t('invalidFormat'),
      });
    },
    [router, t]
  );

  React.useEffect(() => {
    let mounted = true;

    async function start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        if (mounted) setState({ phase: 'unavailable' });
        return;
      }

      try {
        // 권한 확인 단계 — 거부 시 MediaStreamError throw
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
      } catch (error) {
        if (!mounted) return;
        const name = error instanceof Error ? error.name : '';
        setState({
          phase: name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable',
        });
        return;
      }

      try {
        const mod = await import('html5-qrcode');
        if (!mounted || !containerRef.current) return;

        const html5Qrcode = new mod.Html5Qrcode(containerRef.current.id);
        scannerRef.current = {
          stop: () => html5Qrcode.stop().catch(() => undefined),
          clear: () => html5Qrcode.clear(),
        };

        await html5Qrcode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            void html5Qrcode.pause(true);
            handleResult(decodedText);
          },
          () => {
            // 스캔 실패는 빈번(프레임 단위) — 무시
          }
        );

        if (mounted) setState({ phase: 'scanning' });
      } catch (error) {
        if (!mounted) return;
        setState({
          phase: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    void start();

    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        void scanner.stop().then(() => scanner.clear());
        scannerRef.current = null;
      }
    };
  }, [handleResult]);

  if (state.phase === 'denied' || state.phase === 'unavailable') {
    return <ManualEntryFallback reason={state.phase} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 safe-area-bottom">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">{t('title')}</h1>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {state.phase === 'initializing' && t('initializing')}
          {state.phase === 'scanning' && t('scanningHint')}
          {state.phase === 'error' && t('genericError')}
        </p>
      </div>

      <div
        id="qr-scanner-region"
        ref={containerRef}
        className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted"
        role="region"
        aria-label={t('cameraRegionAriaLabel')}
      />

      <details className="rounded-md border border-border bg-background/60 p-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground">{t('manualEntryTitle')}</summary>
        <div className="mt-3">
          <ManualEntryFallback reason="user_choice" />
        </div>
      </details>
    </div>
  );
}
