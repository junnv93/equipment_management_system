'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import {
  ReportType,
  ReportFormat,
  ReportPeriod,
  UtilizationRatePeriod,
  getEquipmentUsage,
  getCalibrationStatus,
  getCheckoutStatistics,
  getUtilizationRate,
  getEquipmentDowntime,
  exportEquipmentUsage,
  generateReport,
} from '@/lib/api/reports-api';
import { getErrorMessage } from '@/lib/api/error';

// 보고서 생성 결과 타입 정의
export interface ReportGenerationResult {
  success: boolean;
  reportType?: ReportType;
  format: ReportFormat;
  fileName: string;
  downloadUrl: string;
  generatedAt: string;
  dateRange?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  additionalParams?: Record<string, string>;
}

// 장비 사용 보고서 조회 hook
export const useEquipmentUsage = (
  startDate?: string,
  endDate?: string,
  equipmentId?: string,
  departmentId?: string
) => {
  return useQuery({
    queryKey: ['reports', 'equipment-usage', startDate, endDate, equipmentId, departmentId],
    queryFn: () => getEquipmentUsage(startDate, endDate, equipmentId, departmentId),
    enabled: !!startDate && !!endDate,
  });
};

// 교정 상태 보고서 조회 hook
export const useCalibrationStatus = (status?: string, timeframe?: string) => {
  return useQuery({
    queryKey: ['reports', 'calibration-status', status, timeframe],
    queryFn: () => getCalibrationStatus(status, timeframe),
  });
};

/**
 * 반출 통계 보고서 조회 hook (대여/교정/수리 포함)
 */
export const useCheckoutStatistics = (
  startDate?: string,
  endDate?: string,
  departmentId?: string
) => {
  return useQuery({
    queryKey: ['reports', 'checkout-statistics', startDate, endDate, departmentId],
    queryFn: () => getCheckoutStatistics(startDate, endDate, departmentId),
    enabled: !!startDate && !!endDate,
  });
};

/**
 * @deprecated Use useCheckoutStatistics instead
 */
export const useRentalStatistics = useCheckoutStatistics;

// 장비 활용률 보고서 조회 hook
export const useUtilizationRate = (
  period: UtilizationRatePeriod = 'month',
  equipmentId?: string,
  categoryId?: string
) => {
  return useQuery({
    queryKey: ['reports', 'utilization-rate', period, equipmentId, categoryId],
    queryFn: () => getUtilizationRate(period, equipmentId, categoryId),
  });
};

// 장비 가동 중단 보고서 조회 hook
export const useEquipmentDowntime = (
  startDate?: string,
  endDate?: string,
  equipmentId?: string
) => {
  return useQuery({
    queryKey: ['reports', 'equipment-downtime', startDate, endDate, equipmentId],
    queryFn: () => getEquipmentDowntime(startDate, endDate, equipmentId),
    enabled: !!startDate && !!endDate,
  });
};

// 장비 사용 보고서 내보내기 hook
export const useExportEquipmentUsage = (options?: {
  onSuccess?: (data: ReportGenerationResult) => void;
  onError?: (error: Error) => void;
}) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      format,
      startDate,
      endDate,
    }: {
      format: ReportFormat;
      startDate?: string;
      endDate?: string;
    }) => {
      return exportEquipmentUsage(format, startDate, endDate);
    },
    onSuccess: (data) => {
      toast({
        title: '보고서 내보내기 성공',
        description: `${data.fileName} 파일이 다운로드되었습니다.`,
        variant: 'default',
      });

      options?.onSuccess?.(data);
    },
    onError: (error: unknown) => {
      toast({
        title: '보고서 내보내기 실패',
        description: getErrorMessage(error, '파일 생성 중 오류가 발생했습니다. 다시 시도해주세요.'),
        variant: 'destructive',
      });

      options?.onError?.(error instanceof Error ? error : new Error(getErrorMessage(error)));
    },
  });
};

// 보고서 생성 매개변수 타입 정의
export interface GenerateReportParams {
  reportType: ReportType;
  format: ReportFormat;
  dateRange: ReportPeriod;
  startDate?: string;
  endDate?: string;
  additionalParams?: Record<string, string>;
}

// 통합 보고서 생성 hook
export const useGenerateReport = (options?: {
  onSuccess?: (data: ReportGenerationResult) => void;
  onError?: (error: Error) => void;
}) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: GenerateReportParams) => {
      return generateReport(
        params.reportType,
        params.format,
        params.dateRange,
        params.startDate,
        params.endDate,
        params.additionalParams
      );
    },
    onSuccess: (data) => {
      toast({
        title: '보고서 생성 성공',
        description: `${data.fileName} 파일이 다운로드되었습니다.`,
        variant: 'default',
      });

      options?.onSuccess?.(data);
    },
    onError: (error: unknown) => {
      toast({
        title: '보고서 생성 실패',
        description: getErrorMessage(
          error,
          '보고서 생성 중 오류가 발생했습니다. 다시 시도해주세요.'
        ),
        variant: 'destructive',
      });

      options?.onError?.(error instanceof Error ? error : new Error(getErrorMessage(error)));
    },
  });
};
