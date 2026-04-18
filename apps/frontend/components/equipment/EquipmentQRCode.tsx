'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QR_CONFIG, buildEquipmentQRUrl } from '@equipment-management/shared-constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/api/query-config';

interface EquipmentQRCodeProps {
  managementNumber: string;
  /** 화면/인쇄용 이름 (alt + 인쇄 레이아웃에 표시). 일반적으로 장비명 전달. */
  displayName?: string;
  /** 사이트·팀 메타(옵션) — 인쇄 레이아웃에 보조 라인으로 표시. */
  subLabel?: string;
  /** 렌더 크기(px). 기본 240 — 모바일 화면 밀도에 적합. 인쇄 시 SVG가 벡터라 크기 무관. */
  sizePx?: number;
  /** 인쇄 버튼 숨김 (다이얼로그 내부에서 외부 액션으로 이동 시). */
  hidePrintButton?: boolean;
  className?: string;
}

/**
 * 장비 QR 코드 렌더 + 인쇄.
 *
 * 원칙:
 * - `QR_CONFIG` SSOT 사용 — errorCorrectionLevel/margin 하드코딩 0건
 * - `buildEquipmentQRUrl` SSOT 사용 — URL 직접 조립 0건
 * - SVG 생성(`qrcode.toString({ type: 'svg' })`) → 인쇄 시 벡터 선명도 유지
 * - 인쇄는 `window.print()` + `@media print` 유틸(`.print:*`) 재사용
 * - alt 텍스트는 i18n (`qr.qrDisplay.altText`)
 *
 * `NEXT_PUBLIC_APP_URL`이 없으면 `window.location.origin`으로 fallback.
 * 서버 환경에서는 호출되지 않으므로 window 참조 안전.
 */
export function EquipmentQRCode({
  managementNumber,
  displayName,
  subLabel,
  sizePx = 240,
  hidePrintButton = false,
  className,
}: EquipmentQRCodeProps) {
  const t = useTranslations('qr.qrDisplay');

  const appUrl = React.useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (envUrl) return envUrl;
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  }, []);

  const { data: svgMarkup, isLoading } = useQuery({
    queryKey: queryKeys.qr.svg(managementNumber, appUrl),
    queryFn: async () => {
      const url = buildEquipmentQRUrl(managementNumber, appUrl);
      return QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: QR_CONFIG.errorCorrectionLevel,
        margin: QR_CONFIG.margin,
      });
    },
    enabled: !!managementNumber && !!appUrl,
    staleTime: Infinity, // 관리번호 동일 → QR 동일 (앱 URL 변경 시에만 재계산)
    gcTime: Infinity,
  });

  const handlePrint = React.useCallback(() => {
    window.print();
  }, []);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className="flex items-center justify-center rounded-md border border-border bg-background p-3"
        style={{ width: sizePx + 24, height: sizePx + 24 }}
        role="img"
        aria-label={t('altText', { managementNumber, name: displayName ?? '' })}
      >
        {isLoading || !svgMarkup ? (
          <div
            className="animate-pulse rounded bg-muted"
            style={{ width: sizePx, height: sizePx }}
          />
        ) : (
          <div
            className="[&_svg]:h-full [&_svg]:w-full"
            style={{ width: sizePx, height: sizePx }}
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        )}
      </div>

      <div className="text-center">
        {displayName && <p className="text-sm font-medium text-foreground">{displayName}</p>}
        <p className="font-mono text-base font-semibold tabular-nums text-foreground">
          {managementNumber}
        </p>
        {subLabel && <p className="text-xs text-muted-foreground">{subLabel}</p>}
      </div>

      {!hidePrintButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="print:hidden"
        >
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t('printButton')}
        </Button>
      )}
    </div>
  );
}
