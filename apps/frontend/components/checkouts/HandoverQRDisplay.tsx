'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { QR_CONFIG, buildHandoverQRUrl } from '@equipment-management/shared-constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import checkoutApi, { type HandoverTokenPurpose } from '@/lib/api/checkout-api';
import { getAppUrl } from '@/lib/qr/app-url';

interface HandoverQRDisplayProps {
  checkoutId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 선택 — 체크아웃 상태로부터 자동 도출되지만 UI 라벨 선택에 사용. */
  purpose?: HandoverTokenPurpose;
}

/**
 * 대여자 측 인수인계 QR 표시 다이얼로그.
 *
 * 플로우:
 * 1. 다이얼로그 오픈 시 `issueHandoverToken()` 호출
 * 2. 성공 시 `buildHandoverQRUrl()` → SVG QR 생성 (QR_CONFIG SSOT)
 * 3. 10분 만료 카운트다운 실시간 표시 (`aria-live`)
 * 4. 만료 후 "재발급" 버튼 활성화
 *
 * **condition-check 로직 렌더 0건** — QR은 경로만 전달.
 */
export function HandoverQRDisplay({
  checkoutId,
  open,
  onOpenChange,
  purpose,
}: HandoverQRDisplayProps) {
  const t = useTranslations('qr.handover');
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'expired' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const expiresAtRef = useRef<number | null>(null);

  const appUrl = useMemo(getAppUrl, []);

  // useCallback으로 useEffect deps 완전 선언 — eslint-disable 안티패턴 회피.
  const issueAndRender = useCallback(async () => {
    if (!appUrl) {
      setPhase('error');
      setErrorMessage(null);
      return;
    }
    setPhase('loading');
    setErrorMessage(null);
    try {
      const issued = await checkoutApi.issueHandoverToken(checkoutId, purpose);
      expiresAtRef.current = new Date(issued.expiresAt).getTime();

      const url = buildHandoverQRUrl(issued.token, appUrl);
      const svg = await QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: QR_CONFIG.errorCorrectionLevel,
        margin: QR_CONFIG.margin,
      });
      setSvgMarkup(svg);
      setPhase('ready');
    } catch (error) {
      setPhase('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }, [checkoutId, purpose, appUrl]);

  // 다이얼로그 오픈 시 토큰 발급, 닫기 시 상태 초기화.
  useEffect(() => {
    if (!open) {
      setPhase('idle');
      setSvgMarkup(null);
      expiresAtRef.current = null;
      return;
    }
    void issueAndRender();
  }, [open, issueAndRender]);

  // 카운트다운
  useEffect(() => {
    if (phase !== 'ready' || !expiresAtRef.current) return;
    const tick = () => {
      if (!expiresAtRef.current) return;
      const remaining = Math.max(0, Math.floor((expiresAtRef.current - Date.now()) / 1000));
      setRemainingSec(remaining);
      if (remaining === 0) setPhase('expired');
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>
            {purpose ? t(`purpose.${purpose}` as Parameters<typeof t>[0]) : t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-2 py-8" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{t('issuing')}</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center gap-2 py-8 text-center" role="alert">
              <AlertCircle className="h-8 w-8 text-brand-critical" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">{t('issueFailed')}</p>
              {errorMessage && <p className="text-xs text-muted-foreground">{errorMessage}</p>}
            </div>
          )}

          {phase === 'ready' && svgMarkup && (
            <>
              <div
                className="rounded-md border border-border bg-background p-3"
                style={{ width: 240 + 24, height: 240 + 24 }}
                role="img"
                aria-label={t('qrAltText')}
              >
                <div
                  className="[&_svg]:h-full [&_svg]:w-full"
                  style={{ width: 240, height: 240 }}
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              </div>
              <p className="text-sm font-medium text-foreground tabular-nums" aria-live="polite">
                {t('countdown', {
                  minutes: Math.floor(remainingSec / 60),
                  seconds: remainingSec % 60,
                })}
              </p>
              <p className="text-xs text-muted-foreground text-center">{t('instructions')}</p>
            </>
          )}

          {phase === 'expired' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <AlertCircle className="h-8 w-8 text-brand-warning" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">{t('expiredTitle')}</p>
            </div>
          )}
        </div>

        {(phase === 'expired' || phase === 'error') && (
          <div className="flex justify-center pb-2">
            <Button onClick={issueAndRender} className="min-h-[var(--touch-target-min)]">
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t('reissue')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
