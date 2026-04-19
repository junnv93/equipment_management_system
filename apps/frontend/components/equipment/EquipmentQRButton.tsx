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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
 * "QR 보기/인쇄" 버튼 + 다이얼로그.
 *
 * 인쇄 방식 선택(sampler/custom)과 크기 프리셋(standard/medium/small)을 조합하여
 * 라벨 PDF를 생성한다.
 *   - sampler: A4 1페이지에 모든 크기 변형을 실물 크기로 배치
 *   - custom:  특정 크기(standard/medium/small) + 양식(full/qrOnly) 선택
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
        // 헤더 문자열 빌드 — Worker는 i18n-free이므로 메인 스레드에서 주입
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
          {/* 인쇄 방식 선택 */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">{t('printModeLabel')}</legend>
            <RadioGroup
              value={printMode}
              onValueChange={(v) => setPrintMode(v as PrintMode)}
              className="space-y-2"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="sampler" id="mode-sampler" className="mt-0.5" />
                <div className="flex flex-col">
                  <Label
                    htmlFor="mode-sampler"
                    className="cursor-pointer text-sm font-normal leading-snug"
                  >
                    {t('printMode.sampler')}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {t('printMode.samplerDescription')}
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="custom" id="mode-custom" className="mt-0.5" />
                <div className="flex flex-col">
                  <Label
                    htmlFor="mode-custom"
                    className="cursor-pointer text-sm font-normal leading-snug"
                  >
                    {t('printMode.custom')}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {t('printMode.customDescription')}
                  </span>
                </div>
              </div>
            </RadioGroup>
          </fieldset>

          {/* custom 모드 전용: 양식 + 크기 선택 */}
          {printMode === 'custom' && (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  {t('layoutModeLabel')}
                </legend>
                <RadioGroup
                  value={layoutMode}
                  onValueChange={(v) => setLayoutMode(v as LabelLayoutMode)}
                  className="space-y-1.5"
                >
                  {(['full', 'qrOnly'] as const).map((mode) => (
                    <div key={mode} className="flex items-center space-x-2">
                      <RadioGroupItem value={mode} id={`layout-${mode}`} />
                      <Label
                        htmlFor={`layout-${mode}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {t(`layoutMode.${mode}`)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  {t('sizePresetLabel')}
                </legend>
                <RadioGroup
                  value={sizePreset}
                  onValueChange={(v) => setSizePreset(v as LabelSizePreset)}
                  className="space-y-1.5"
                >
                  {(['xl', 'large', 'medium', 'small', 'xs', 'xxs', 'micro'] as const).map(
                    (preset) => (
                      <div key={preset} className="flex items-center space-x-2">
                        <RadioGroupItem value={preset} id={`size-${preset}`} />
                        <Label
                          htmlFor={`size-${preset}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {t(`size.${preset}`)}
                        </Label>
                      </div>
                    )
                  )}
                </RadioGroup>
              </fieldset>

              {/* fallback 안내 */}
              {fallback && (
                <p
                  role="alert"
                  className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                >
                  {t('fallbackNotice', { mode: t(`fallbackMode.${resolvedMode}`) })}
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
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
