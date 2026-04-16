'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { ApiError, EquipmentErrorCode } from '@/lib/errors/equipment-errors';
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

  return useMutation<MultiSheetPreviewResult, Error, { file: File; options: PreviewOptions }>({
    mutationFn: ({ file, options }) => dataMigrationApi.previewEquipmentMigration(file, options),
    onError: (error) => {
      toast({
        title: '파일 분석 실패',
        description: getErrorMessage(error, '파일 업로드 또는 파싱 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });
}

/**
 * 멀티시트 Execute(Commit) mutation hook
 *
 * sessionId로 캐시된 Preview 결과를 DB에 일괄 INSERT.
 * 성공 시 equipment·dashboard 캐시를 무효화하여 목록/통계를 갱신.
 */
export function useExecuteMigration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('data-migration');

  return useMutation<MultiSheetExecuteResult, Error, ExecuteOptions>({
    mutationFn: (options) => dataMigrationApi.executeEquipmentMigration(options),
    onSuccess: async (data) => {
      toast({
        title: '마이그레이션 완료',
        description: `장비 ${data.totalCreated}건이 등록되었습니다.`,
      });

      // equipment·dashboard 캐시 무효화 (등록 후 목록/통계 갱신)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
      ]);
    },
    onError: (error) => {
      toast({
        title: '마이그레이션 실패',
        description: resolveExecuteErrorMessage(error, t, '데이터 등록 중 오류가 발생했습니다.'),
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

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => dataMigrationApi.downloadErrorReport(sessionId),
    onError: (error) => {
      toast({
        title: '에러 리포트 다운로드 실패',
        description: getErrorMessage(error, '다운로드 중 오류가 발생했습니다.'),
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

  return useMutation<void, Error, void>({
    mutationFn: () => dataMigrationApi.downloadTemplate(),
    onError: (error) => {
      toast({
        title: '템플릿 다운로드 실패',
        description: getErrorMessage(error, '다운로드 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });
}
