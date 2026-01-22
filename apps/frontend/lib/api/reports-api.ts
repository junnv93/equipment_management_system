import axios from 'axios';
import { apiClient } from './api-client';

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
    const response = await apiClient.get('/api/reports/equipment-usage', {
      params: { startDate, endDate, equipmentId, departmentId }
    });
    return response.data;
  } catch (error) {
    console.error('장비 사용 보고서 조회 실패:', error);
    throw error;
  }
};

// 교정 상태 보고서 조회
export const getCalibrationStatus = async (
  status?: string,
  timeframe?: string
) => {
  try {
    const response = await apiClient.get('/api/reports/calibration-status', {
      params: { status, timeframe }
    });
    return response.data;
  } catch (error) {
    console.error('교정 상태 보고서 조회 실패:', error);
    throw error;
  }
};

// 대여 통계 보고서 조회
export const getRentalStatistics = async (
  startDate?: string,
  endDate?: string,
  departmentId?: string
) => {
  try {
    const response = await apiClient.get('/api/reports/rental-statistics', {
      params: { startDate, endDate, departmentId }
    });
    return response.data;
  } catch (error) {
    console.error('대여 통계 보고서 조회 실패:', error);
    throw error;
  }
};

// 장비 활용률 보고서 조회
export const getUtilizationRate = async (
  period: UtilizationRatePeriod = 'month',
  equipmentId?: string,
  categoryId?: string
) => {
  try {
    const response = await apiClient.get('/api/reports/utilization-rate', {
      params: { period, equipmentId, categoryId }
    });
    return response.data;
  } catch (error) {
    console.error('장비 활용률 보고서 조회 실패:', error);
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
    const response = await apiClient.get('/api/reports/equipment-downtime', {
      params: { startDate, endDate, equipmentId }
    });
    return response.data;
  } catch (error) {
    console.error('장비 가동 중단 보고서 조회 실패:', error);
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
    const response = await apiClient.get('/api/reports/export/equipment-usage', {
      params: { format, startDate, endDate },
      responseType: 'blob' // 파일 다운로드를 위한 설정
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
    console.error('장비 사용 보고서 내보내기 실패:', error);
    throw error;
  }
};

// 보고서 유형에 따른 파일명 생성
const getReportFileName = (reportType: ReportType, format: ReportFormat): string => {
  const dateStr = new Date().toISOString().split('T')[0];
  const reportNames: Record<ReportType, string> = {
    equipment_inventory: '장비_인벤토리',
    calibration_status: '교정_상태',
    utilization_report: '활용률_보고서',
    team_equipment: '팀별_장비_현황',
    maintenance_report: '유지보수_보고서'
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
        endpoint = '/api/reports/export/equipment-inventory';
        break;
      case 'calibration_status':
        endpoint = '/api/reports/export/calibration-status';
        break;
      case 'utilization_report':
        endpoint = '/api/reports/export/utilization';
        break;
      case 'team_equipment':
        endpoint = '/api/reports/export/team-equipment';
        break;
      case 'maintenance_report':
        endpoint = '/api/reports/export/maintenance';
        break;
      default:
        throw new Error('지원하지 않는 보고서 유형입니다.');
    }
    
    // API 호출
    const response = await apiClient.get(endpoint, {
      params: { format, startDate, endDate, ...additionalParams },
      responseType: 'blob'
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
      additionalParams
    };
  } catch (error) {
    console.error('보고서 생성 실패:', error);
    throw error;
  }
}; 