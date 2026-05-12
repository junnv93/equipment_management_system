'use client';

import * as React from 'react';
import { QrCode, Printer, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { EquipmentQRCode } from './EquipmentQRCode';
import { generateLabelPdf } from '@/lib/qr/generate-label-pdf';
import { getAppUrl } from '@/lib/qr/app-url';
import { toast } from '@/components/ui/use-toast';
import {
  resolveLayoutMode,
  LABEL_SIZE_PRESETS,
  getSamplerPresetOrder,
} from '@equipment-management/shared-constants';
import type { LabelLayoutMode, LabelSizePreset } from '@equipment-management/shared-constants';
import { cn } from '@/lib/utils';

type PrintMode = 'sampler' | 'custom';

interface EquipmentQRButtonProps {
  managementNumber: string;
  displayName?: string;
  serialNumber?: string;
  subLabel?: string;
  /** 버튼 크기 변형. 기본 `sm` — sticky 헤더/툴바에 적합. */
  size?: 'sm' | 'default';
  /** 버튼 라벨 숨김(아이콘만) — 모바일 툴바 절약 시. */
  iconOnly?: boolean;
}

/**
 * Mini QR 시각 패턴 — 7×7 module grid 의 deterministic pattern.
 *
 * - 좌상단 / 우상단 / 좌하단 3×3 finder pattern (실 QR 코드 모서리 인식자 흉내)
 * - 가운데 4×4 영역의 deterministic data module (사이즈 비교 시 visual hint)
 *
 * 1 = filled, 0 = empty. currentColor 로 채워 foreground 토큰 자동 적응.
 */
const PREVIEW_QR_PATTERN: readonly (readonly (0 | 1)[])[] = [
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [0, 0, 0, 1, 0, 1, 0],
  [1, 1, 1, 0, 1, 1, 0],
  [1, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 1],
] as const;

/**
 * Mini QR SVG — 7×7 deterministic module grid (qr-visual-redesign 라운드 #3 갭 5).
 * inline IIFE 대신 helper component 추출 (JSX 안티패턴 회피).
 */
function MiniQRPattern({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 7 7"
      width={size}
      height={size}
      className="shrink-0 text-foreground/85"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {PREVIEW_QR_PATTERN.flatMap((row, y) =>
        row.map((cell, x) =>
          cell === 1 ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
          ) : null
        )
      )}
    </svg>
  );
}

/** 시각 비교 미니 라벨 — 비례 사각형 + 좌측 mini QR + 권장 용도 라벨. */
function LabelPreviewRow({
  preset,
  selected,
  onClick,
  recommendedLabel,
  sizeText,
  fallbackInline,
}: {
  preset: LabelSizePreset;
  selected: boolean;
  onClick: () => void;
  recommendedLabel: string;
  sizeText: string;
  fallbackInline: string | null;
}) {
  const { widthMm, heightMm } = LABEL_SIZE_PRESETS[preset];
  // 최대 widthMm = 93.5 (xl) 기준으로 비례 — preview width 최대 96px (셀 라벨 비율 유지).
  const previewMaxPx = 96;
  const previewWidthPx = Math.round((widthMm / 93.5) * previewMaxPx);
  const previewHeightPx = Math.max(
    14,
    Math.round((heightMm / 93.5) * previewMaxPx * (heightMm / widthMm) * 1.6)
  );

  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors',
          selected
            ? 'border-brand-info bg-brand-info/10'
            : 'border-border bg-card hover:bg-muted/40'
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-sm border bg-background p-1',
            selected ? 'border-brand-info' : 'border-border'
          )}
          style={{ width: `${previewWidthPx}px`, height: `${previewHeightPx}px` }}
        >
          {/* mini QR pattern — 7×7 deterministic module grid (G-12, helper component G-5/round#3). */}
          <MiniQRPattern size={Math.min(previewHeightPx - 6, 18)} />
          {/* 라벨 텍스트 line hint — 1차/2차 텍스트가 QR 우측에 인쇄되는 것을 시각화. */}
          <div className="flex flex-1 flex-col gap-1 overflow-hidden">
            <div className="h-[3px] w-full rounded-sm bg-foreground/60" />
            <div className="h-[2px] w-3/4 rounded-sm bg-foreground/35" />
            <div className="h-[2px] w-1/2 rounded-sm bg-foreground/25" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{sizeText}</span>
          <span className="text-xs text-foreground/70 label-ko">{recommendedLabel}</span>
          {selected && fallbackInline && (
            <span className="text-xs text-brand-warning mt-1 label-ko">{fallbackInline}</span>
          )}
        </div>
      </button>
    </li>
  );
}

/**
 * "QR 보기/인쇄" 버튼 + 다이얼로그.
 *
 * 인쇄 방식 선택(sampler/custom)을 segmented tabs로, 크기는 시각 비례 행으로 표시한다.
 * (qr-visual-redesign TASK 7 / 2026-05-11)
 *
 *   - sampler: A4 1페이지에 모든 크기 변형을 실물 크기로 배치
 *   - custom:  특정 크기(xl..micro) + 양식(full/qrOnly) 선택, 비례 미리보기 + 권장 용도 라벨
 *
 * i18n 네임스페이스: `qr.qrDisplay.*`.
 */
export function EquipmentQRButton({
  managementNumber,
  displayName,
  serialNumber,
  subLabel,
  size = 'sm',
  iconOnly = false,
}: EquipmentQRButtonProps) {
  const t = useTranslations('qr.qrDisplay');
  const [open, setOpen] = React.useState(false);
  const [printMode, setPrintMode] = React.useState<PrintMode>('sampler');
  const [layoutMode, setLayoutMode] = React.useState<LabelLayoutMode>('full');
  const [sizePreset, setSizePreset] = React.useState<LabelSizePreset>('medium');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const appUrl = React.useMemo(getAppUrl, []);

  const { mode: resolvedMode, fallback } = resolveLayoutMode(layoutMode, sizePreset);

  const handleDownload = React.useCallback(async () => {
    setIsGenerating(true);
    try {
      let blob: Blob;
      let filename: string;
      const dateStr = new Date().toISOString().slice(0, 10);

      if (printMode === 'sampler') {
        const presets = getSamplerPresetOrder();
        const samplerHeaders = Object.fromEntries(
          presets.map((preset) => {
            const { widthMm, heightMm } = LABEL_SIZE_PRESETS[preset];
            return [preset, t(`sampler.header.${preset}`, { widthMm, heightMm })];
          })
        ) as Record<LabelSizePreset, string>;

        blob = await generateLabelPdf({
          items: [
            {
              managementNumber,
              equipmentName: displayName ?? managementNumber,
              serialNumber,
            },
          ],
          appUrl,
          mode: 'sampler',
          samplerHeaders,
        });
        filename = `equipment-label-sampler-${managementNumber}-${dateStr}.pdf`;
      } else {
        blob = await generateLabelPdf({
          items: [
            {
              managementNumber,
              equipmentName: displayName ?? managementNumber,
              serialNumber,
            },
          ],
          appUrl,
          mode: 'single',
          sizePreset,
          layoutMode: resolvedMode,
        });
        filename = `equipment-label-${managementNumber}-${dateStr}.pdf`;
      }

      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
      toast({ description: t('downloadPdf') });
    } catch {
      toast({ variant: 'destructive', description: t('downloadFailed') });
    } finally {
      setIsGenerating(false);
    }
  }, [printMode, managementNumber, displayName, serialNumber, appUrl, sizePreset, resolvedMode, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={t('buttonAriaLabel')}
          className="print:hidden"
        >
          <QrCode className={iconOnly ? 'h-4 w-4' : 'mr-1.5 h-4 w-4'} aria-hidden="true" />
          {!iconOnly && t('buttonLabel')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <EquipmentQRCode
            managementNumber={managementNumber}
            displayName={displayName}
            serialNumber={serialNumber}
            subLabel={subLabel}
            sizePx={180}
            hidePrintButton
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          {/* 인쇄 방식 선택 — segmented tabs (TASK 7) */}
          <Tabs value={printMode} onValueChange={(v) => setPrintMode(v as PrintMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sampler">{t('modeTab.sampler')}</TabsTrigger>
              <TabsTrigger value="custom">{t('modeTab.custom')}</TabsTrigger>
            </TabsList>

            <TabsContent value="sampler" className="mt-4">
              <p className="text-sm text-foreground/70 label-ko">
                {t('printMode.samplerDescription')}
              </p>
            </TabsContent>

            <TabsContent value="custom" className="mt-4 space-y-4">
              {/* 양식 선택 (full / qrOnly) — segmented inline */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  {t('layoutModeLabel')}
                </legend>
                <div role="radiogroup" aria-label={t('layoutModeLabel')} className="flex gap-2">
                  {(['full', 'qrOnly'] as const).map((mode) => {
                    const selected = layoutMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setLayoutMode(mode)}
                        className={cn(
                          'flex-1 rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors',
                          selected
                            ? 'border-brand-info bg-brand-info/10 text-brand-info'
                            : 'border-border bg-card text-foreground/80 hover:bg-muted/40'
                        )}
                      >
                        <Label className="cursor-pointer label-ko">{t(`layoutMode.${mode}`)}</Label>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* 크기 선택 — 시각 비례 행 + 권장 용도 (TASK 7) */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  {t('sizePresetLabel')}
                </legend>
                <ul role="radiogroup" aria-label={t('sizePresetLabel')} className="space-y-1.5">
                  {getSamplerPresetOrder().map((preset) => {
                    const { widthMm, heightMm, recommendedForKey } = LABEL_SIZE_PRESETS[preset];
                    const selected = sizePreset === preset;
                    const showFallback = selected && fallback;
                    return (
                      <LabelPreviewRow
                        key={preset}
                        preset={preset}
                        selected={selected}
                        onClick={() => setSizePreset(preset)}
                        recommendedLabel={t(`recommendedFor.${recommendedForKey}`)}
                        sizeText={t(`size.${preset}`, { widthMm, heightMm })}
                        fallbackInline={
                          showFallback
                            ? t('fallbackInlineNotice', { mode: t(`fallbackMode.${resolvedMode}`) })
                            : null
                        }
                      />
                    );
                  })}
                </ul>
              </fieldset>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="mr-1.5 h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            )}
            {t('downloadPdf')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
