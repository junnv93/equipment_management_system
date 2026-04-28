'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';

export interface UseExportActionOptions {
  /**
   * 실제 내보내기 함수. Blob 다운로드를 수행하고 완료 시 resolve.
   * 실패 시 throw — 에러는 훅이 자동으로 토스트 처리.
   */
  exportFn: () => Promise<void>;
  /**
   * 내보내기 성공 시 토스트 키 (FEEDBACK_KEYS 상수 사용).
   * 기본값: FEEDBACK_KEYS.exported
   */
  successKey?: string;
  /**
   * 에러 시 토스트 제목 (i18n 값).
   * 제공하지 않으면 에러 메시지만 표시.
   */
  errorTitle?: string;
}

export interface UseExportActionReturn {
  /** 내보내기 진행 중 여부 */
  isExporting: boolean;
  /** 내보내기 실행 핸들러 */
  handleExport: () => Promise<void>;
}

/**
 * 내보내기(Export/Download) 액션 훅 (SSOT)
 *
 * 파일 다운로드 시 표준 i18n 토스트 피드백을 제공한다.
 * `ExportFormButton`, 감사로그 CSV, NC 리포트 등 모든 내보내기 UI에��� 공유.
 *
 * @example
 * ```tsx
 * const { isExporting, handleExport } = useExportAction({
 *   exportFn: () => downloadFile({ url: API_ENDPOINTS.EQUIPMENT.EXPORT }),
 *   successKey: FEEDBACK_KEYS.exported,
 *   errorTitle: t('exportFailed'),
 * });
 *
 * <Button onClick={handleExport} disabled={isExporting}>
 *   {isExporting ? (
 *     <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
 *   ) : (
 *     <Download className="h-4 w-4" />
 *   )}
 *   {t('export')}
 * </Button>
 * ```
 */
export function useExportAction({
  exportFn,
  successKey = FEEDBACK_KEYS.exported,
  errorTitle,
}: UseExportActionOptions): UseExportActionReturn {
  const { toast } = useToast();
  const t = useTranslations();
  const [isExporting, setIsExporting] = useState(false);

  // Stable ref to avoid stale closures
  const exportFnRef = useRef(exportFn);
  exportFnRef.current = exportFn;

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportFnRef.current();
      toast({ description: t(successKey) });
    } catch (error) {
      const description = getErrorMessage(error);
      toast({
        title: errorTitle,
        description,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, successKey, errorTitle, t, toast]);

  return { isExporting, handleExport };
}
