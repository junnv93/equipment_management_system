'use client';

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { FileUp, Loader2, AlertTriangle } from 'lucide-react';
import type { ExtractedCalibrationCertificate } from '@equipment-management/schemas';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  useExtractCalibrationCertificate,
  getExtractCertificateErrorI18n,
} from '@/hooks/use-extract-calibration-certificate';
import { validateCertificateFile } from '@/lib/calibration/validate-certificate-file';

interface CalibrationCertificatePdfUploaderProps {
  /**
   * 추출 성공 시 호출. 호출자는 추출 결과 + 원본 File을 받아 폼 사전 채움 어댑터 적용.
   */
  onExtracted: (extracted: ExtractedCalibrationCertificate, file: File) => void;
  /** 외부에서 비활성화 (예: 장비 선택 후 폼 노출 단계) */
  disabled?: boolean;
  className?: string;
}

/**
 * 교정성적서 PDF 업로드 + 자동 추출 컴포넌트 (Phase A).
 *
 * 시니어급 보안 (defense in depth, client side):
 *   1. mime type whitelist (REPORT_EXPORT_MIME.pdf SSOT)
 *   2. file size limit (FILE_UPLOAD_LIMITS.MAX_FILE_SIZE SSOT)
 *   3. 단일 파일만 (multipart 규약 일관)
 *   4. 추출 진행 중 입력 잠금 (race condition 차단)
 *
 * UX:
 *   - 드래그-드롭 + 클릭 업로드 양방향 지원
 *   - 추출 중 spinner + ARIA aria-busy
 *   - 에러는 ErrorCode SSOT 5-layer i18n 키로 toast (`details.field` 변수 포함)
 */
export function CalibrationCertificatePdfUploader({
  onExtracted,
  disabled = false,
  className,
}: CalibrationCertificatePdfUploaderProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { mutate: extract, isPending } = useExtractCalibrationCertificate({
    onSuccess: (extracted, file) => {
      onExtracted(extracted, file);
      toast({
        title: t('calibration.certificateUpload.successTitle'),
        description: t('calibration.certificateUpload.successDesc', {
          certificateNumber: extracted.certificateNumber,
        }),
      });
    },
    onError: (error) => {
      const { key, vars } = getExtractCertificateErrorI18n(error);
      toast({
        variant: 'destructive',
        title: t('calibration.errors.title'),
        description: t(key, vars as Record<string, string>),
      });
    },
  });

  const validateAndExtract = useCallback(
    (file: File): void => {
      const validation = validateCertificateFile(file);
      if (!validation.ok) {
        toast({
          variant: 'destructive',
          title: t('calibration.errors.title'),
          description: t(validation.i18nKey),
        });
        return;
      }
      extract(file);
    },
    [extract, t, toast]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndExtract(file);
      // 동일 파일 재선택 가능하도록 input 초기화
      if (inputRef.current) inputRef.current.value = '';
    },
    [validateAndExtract]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled && !isPending) setIsDragOver(true);
    },
    [disabled, isPending]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || isPending) return;
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndExtract(file);
    },
    [disabled, isPending, validateAndExtract]
  );

  const isDisabled = disabled || isPending;

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
        isDragOver && !isDisabled
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/30 hover:border-muted-foreground/50',
        isDisabled && 'opacity-60 pointer-events-none',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-busy={isPending}
      aria-label={t('calibration.certificateUpload.regionLabel')}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        disabled={isDisabled}
        className="sr-only"
        data-testid="calibration-certificate-pdf-input"
      />

      <div className="flex flex-col items-center gap-3">
        {isPending ? (
          <Loader2 className="size-8 text-primary animate-spin" aria-hidden />
        ) : (
          <FileUp className="size-8 text-muted-foreground" aria-hidden />
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isPending
              ? t('calibration.certificateUpload.extracting')
              : t('calibration.certificateUpload.dropzoneTitle')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('calibration.certificateUpload.dropzoneHint')}
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isDisabled}
          onClick={() => inputRef.current?.click()}
          data-testid="calibration-certificate-pdf-button"
        >
          {t('calibration.certificateUpload.selectFile')}
        </Button>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertTriangle className="size-3" aria-hidden />
          <span>{t('calibration.certificateUpload.supportedFormat')}</span>
        </div>
      </div>
    </div>
  );
}
