import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

export type ReportType =
  | 'equipment_inventory'
  | 'calibration_status'
  | 'utilization_report'
  | 'team_equipment'
  | 'maintenance_report';

export type ReportFormat = 'pdf' | 'excel' | 'csv';

export type ReportPeriod = 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'custom';

export type UtilizationRatePeriod = 'week' | 'month' | 'quarter' | 'year';

// 장비 사용 보고서 조회
export const getEquipmentUsage = async (
  startDate?: string,
  endDate?: string,
  equipmentId?: string,
  departmentId?: string
) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.EQUIPMENT_USAGE, {
      params: { startDate, endDate, equipmentId, departmentId },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch equipment usage report:', error);
    throw error;
  }
};

// 교정 상태 보고서 조회
export const getCalibrationStatus = async (status?: string, timeframe?: string) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.CALIBRATION_STATUS, {
      params: { status, timeframe },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch calibration status report:', error);
    throw error;
  }
};

/**
 * 반출 통계 보고서 조회 (대여/교정/수리 포함)
 */
export const getCheckoutStatistics = async (
  startDate?: string,
  endDate?: string,
  departmentId?: string
) => {
  try {
    // 백엔드 API 엔드포인트는 유지 (백엔드 호환성)
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.RENTAL_STATISTICS, {
      params: { startDate, endDate, departmentId },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch checkout statistics report:', error);
    throw error;
  }
};

/**
 * @deprecated Use getCheckoutStatistics instead
 */
export const getRentalStatistics = getCheckoutStatistics;

// 장비 활용률 보고서 조회
export const getUtilizationRate = async (
  period: UtilizationRatePeriod = 'month',
  equipmentId?: string,
  categoryId?: string
) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.UTILIZATION_RATE, {
      params: { period, equipmentId, categoryId },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch utilization rate report:', error);
    throw error;
  }
};

// 장비 가동 중단 보고서 조회
export const getEquipmentDowntime = async (
  startDate?: string,
  endDate?: string,
  equipmentId?: string
) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.EQUIPMENT_DOWNTIME, {
      params: { startDate, endDate, equipmentId },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch equipment downtime report:', error);
    throw error;
  }
};

// 장비 사용 보고서 내보내기
export const exportEquipmentUsage = async (
  format: 'excel' | 'csv' | 'pdf',
  startDate?: string,
  endDate?: string
) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.EXPORT.EQUIPMENT_USAGE, {
      params: { format, startDate, endDate },
      responseType: 'blob', // 파일 다운로드를 위한 설정
    });

    // 파일 다운로드 처리
    const filename = `equipment-usage-report-${new Date().toISOString().split('T')[0]}.${format}`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      format,
      fileName: filename,
      downloadUrl: url,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to export equipment usage report:', error);
    throw error;
  }
};

// 보고서 유형에 따른 파일명 생성
const getReportFileName = (reportType: ReportType, format: ReportFormat): string => {
  const dateStr = new Date().toISOString().split('T')[0];
  const reportNames: Record<ReportType, string> = {
    equipment_inventory: 'Equipment_Inventory',
    calibration_status: 'Calibration_Status',
    utilization_report: 'Utilization_Report',
    team_equipment: 'Team_Equipment',
    maintenance_report: 'Maintenance_Report',
  };

  return `${reportNames[reportType]}_${dateStr}.${format}`;
};

// 모든 유형의 보고서 내보내기를 위한 통합 함수
export const generateReport = async (
  reportType: ReportType,
  format: ReportFormat,
  dateRange: ReportPeriod,
  startDate?: string,
  endDate?: string,
  additionalParams?: Record<string, string>
) => {
  try {
    // dateRange가 custom이 아니면 시작일/종료일 계산
    if (dateRange !== 'custom') {
      const now = new Date();
      endDate = now.toISOString().split('T')[0];

      switch (dateRange) {
        case 'last_week':
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 7);
          startDate = lastWeek.toISOString().split('T')[0];
          break;
        case 'last_month':
          const lastMonth = new Date(now);
          lastMonth.setMonth(now.getMonth() - 1);
          startDate = lastMonth.toISOString().split('T')[0];
          break;
        case 'last_quarter':
          const lastQuarter = new Date(now);
          lastQuarter.setMonth(now.getMonth() - 3);
          startDate = lastQuarter.toISOString().split('T')[0];
          break;
        case 'last_year':
          const lastYear = new Date(now);
          lastYear.setFullYear(now.getFullYear() - 1);
          startDate = lastYear.toISOString().split('T')[0];
          break;
      }
    }

    // 보고서 유형에 따라 다른 API 호출
    let endpoint = '';
    switch (reportType) {
      case 'equipment_inventory':
        endpoint = API_ENDPOINTS.REPORTS.EXPORT.EQUIPMENT_INVENTORY;
        break;
      case 'calibration_status':
        endpoint = API_ENDPOINTS.REPORTS.EXPORT.CALIBRATION_STATUS;
        break;
      case 'utilization_report':
        endpoint = API_ENDPOINTS.REPORTS.EXPORT.UTILIZATION;
        break;
      case 'team_equipment':
        endpoint = API_ENDPOINTS.REPORTS.EXPORT.TEAM_EQUIPMENT;
        break;
      case 'maintenance_report':
        endpoint = API_ENDPOINTS.REPORTS.EXPORT.MAINTENANCE;
        break;
      default:
        throw new Error('Unsupported report type.');
    }

    // API 호출
    const response = await apiClient.get(endpoint, {
      params: { format, startDate, endDate, ...additionalParams },
      responseType: 'blob',
    });

    // 응답 MIME 타입 처리
    let mimeType: string;
    switch (format) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'excel':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        mimeType = 'text/csv';
        break;
      default:
        mimeType = 'application/octet-stream';
    }

    // 파일 다운로드 처리
    const filename = getReportFileName(reportType, format);
    const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // 브라우저 메모리 해제
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    return {
      success: true,
      reportType,
      format,
      fileName: filename,
      downloadUrl: url,
      generatedAt: new Date().toISOString(),
      dateRange,
      startDate,
      endDate,
      additionalParams,
    };
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw error;
  }
};
