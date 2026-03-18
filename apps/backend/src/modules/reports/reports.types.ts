/**
 * Reports 서비스 반환 타입
 *
 * 통계 집계 API와 내보내기 데이터 조회 메서드의 반환 구조를 정의합니다.
 * 인라인 3필드 이하 객체는 직접 타입, 복잡한 구조는 이 파일에서 관리합니다.
 */

// ── 장비 사용(반출) 통계 ─────────────────────────────────────────────────────

export interface EquipmentUsageReport {
  timeframe: { startDate: string; endDate: string };
  totalUsageHours: number;
  totalEquipmentCount: number;
  departmentDistribution: {
    departmentId: string;
    departmentName: string;
    usageHours: number;
    equipmentCount: number;
  }[];
  topEquipment: {
    equipmentId: string;
    name: string;
    usageHours: number;
    usageCount: number;
  }[];
  monthlyTrend: { month: string; checkouts: number; returns: number }[];
}

// ── 교정 상태 통계 ──────────────────────────────────────────────────────────

export interface CalibrationStatusReport {
  summary: {
    totalEquipment: number;
    requireCalibration: number;
    dueThisMonth: number;
    overdue: number;
    completedThisMonth: number;
  };
  status: {
    status: string;
    count: number;
    percentage: number;
  }[];
  calibrationTrend: { month: string; completed: number; due: number; overdue: number }[];
}

// ── 반출 통계 ───────────────────────────────────────────────────────────────

export interface CheckoutStatisticsReport {
  timeframe: { startDate: string; endDate: string };
  summary: {
    totalCheckouts: number;
    activeCheckouts: number;
    avgCheckoutDuration: number;
    returnRate: number;
  };
  checkoutsByDepartment: {
    departmentId: string;
    departmentName: string;
    count: number;
    percentage: number;
  }[];
  checkoutStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  monthlyTrend: { month: string; checkouts: number; returns: number }[];
}

// ── 활용률 통계 ──────────────────────────────────────────────────────────────

export interface UtilizationRateReport {
  period: string;
  summary: {
    averageUtilization: number;
    highUtilizationCount: number;
    lowUtilizationCount: number;
    totalEquipmentCount: number;
  };
  utilizationByCategory: never[];
  topUtilized: {
    equipmentId: string;
    name: string;
    utilizationRate: number;
    department: string;
  }[];
  lowUtilized: {
    equipmentId: string;
    name: string;
    utilizationRate: number;
    department: string;
  }[];
}

// ── 장비 가동 중단(수리) 통계 ────────────────────────────────────────────────

export interface EquipmentDowntimeReport {
  timeframe: { startDate: string; endDate: string };
  summary: {
    totalDowntimeHours: number;
    totalIncidents: number;
    avgDowntimeDuration: number;
    affectedEquipmentCount: number;
  };
  downtimeReasons: {
    reason: string;
    hours: number;
    percentage: number;
  }[];
  topDowntimeEquipment: {
    equipmentId: string;
    name: string;
    downtimeHours: number;
    incidents: number;
  }[];
  monthlyTrend: never[];
}
