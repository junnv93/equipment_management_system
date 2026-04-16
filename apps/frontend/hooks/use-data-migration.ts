'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { ApiError, EquipmentErrorCode } from '@/lib/errors/equipment-errors';
import {
  EquipmentCacheInvalidation,
  DashboardCacheInvalidation,
} from '@/lib/api/cache-invalidation';
import {
  dataMigrationApi,
  type PreviewOptions,
  type ExecuteOptions,
} from '@/lib/api/data-migration-api';
import type {
  MultiSheetPreviewResult,
  MultiSheetExecuteResult,
} from '@/lib/api/data-migration-api';
import { queryKeys } from '@/lib/api/query-config';

/**
 * ApiError의 백엔드 code가 session 만료를 의미하는지 판별.
 * 만료면 data-migration i18n의 sessionExpired 메시지를 사용.
 */
function resolveExecuteErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallback: string
): string {
  if (error instanceof ApiError && error.code === EquipmentErrorCode.NOT_FOUND) {
    return t('errors.sessionExpired');
  }
  return getErrorMessage(error, fallback);
}

/**
 * 멀티시트 Preview(Dry-run) mutation hook
 *
 * xlsx 파일을 업로드하여 시트별 행별 검증 결과를 반환.
 * onSuccess 콜백으로 결과를 수신하여 다음 스텝(PreviewStep)으로 전환.
 */
export function usePreviewMigration() {
  const { toast } = useToast();
  const t = useTranslations('data-migration');

  return useMutation<MultiSheetPreviewResult, Error, { file: File; options: PreviewOptions }>({
    mutationFn: ({ file, options }) => dataMigrationApi.previewEquipmentMigration(file, options),
    onError: (error) => {
      toast({
        title: t('toast.previewErrorTitle'),
        description: getErrorMessage(error, t('toast.previewErrorDescription')),
        variant: 'destructive',
      });
    },
  });
}

/**
 * 멀티시트 Execute(Commit) mutation hook
 *
 * sessionId로 캐시된 Preview 결과를 DB에 일괄 INSERT.
 * 성공 시 equipment·dashboard·이력 관련 캐시를 무효화하여 목록/통계를 갱신.
 */
export function useExecuteMigration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('data-migration');

  return useMutation<MultiSheetExecuteResult, Error, ExecuteOptions>({
    mutationFn: (options) => dataMigrationApi.executeEquipmentMigration(options),
    onSuccess: async (data) => {
      toast({
        title: t('toast.executeSuccessTitle'),
        description: t('toast.executeSuccessDescription', { count: data.totalCreated }),
      });

      // 장비·대시보드·이력 관련 캐시 전체 무효화
      await Promise.all([
        EquipmentCacheInvalidation.invalidateAll(queryClient),
        DashboardCacheInvalidation.invalidateAll(queryClient),
        queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.nonConformances.all }),
      ]);
    },
    onError: (error) => {
      toast({
        title: t('toast.executeErrorTitle'),
        description: resolveExecuteErrorMessage(error, t, t('toast.executeErrorDescription')),
        variant: 'destructive',
      });
    },
  });
}

/**
 * 에러 리포트 다운로드 mutation hook
 */
export function useDownloadErrorReport() {
  const { toast } = useToast();
  const t = useTranslations('data-migration');

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => dataMigrationApi.downloadErrorReport(sessionId),
    onError: (error) => {
      toast({
        title: t('toast.errorReportFailedTitle'),
        description: getErrorMessage(error, t('toast.errorReportFailedDescription')),
        variant: 'destructive',
      });
    },
  });
}

/**
 * 입력 템플릿 다운로드 mutation hook
 */
export function useDownloadMigrationTemplate() {
  const { toast } = useToast();
  const t = useTranslations('data-migration');

  return useMutation<void, Error, void>({
    mutationFn: () => dataMigrationApi.downloadTemplate(),
    onError: (error) => {
      toast({
        title: t('toast.templateFailedTitle'),
        description: getErrorMessage(error, t('toast.templateFailedDescription')),
        variant: 'destructive',
      });
    },
  });
}
