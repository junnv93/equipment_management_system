import { apiClient } from './api-client';
import dashboardApi from './dashboard-api';
import equipmentApi from './equipment-api';
import rentalApi from './rental-api';
import calibrationApi from './calibration-api';
import calibrationFactorsApi from './calibration-factors-api';
import calibrationPlansApi from './calibration-plans-api';
import nonConformancesApi from './non-conformances-api';
import softwareApi from './software-api';
import * as repairHistoryApi from './repair-history-api';

// API 객체 통합 내보내기
export {
  apiClient,
  dashboardApi,
  equipmentApi,
  rentalApi,
  calibrationApi,
  calibrationFactorsApi,
  calibrationPlansApi,
  nonConformancesApi,
  softwareApi,
  repairHistoryApi,
};

// 타입 내보내기
export type {
  DashboardSummary,
  UpcomingCalibration,
  OverdueCalibration,
  EquipmentByTeam,
  RecentActivity,
  OverdueRental,
} from './dashboard-api';

export type {
  Equipment,
  EquipmentQuery,
  CreateEquipmentDto,
  UpdateEquipmentDto,
} from './equipment-api';

// PaginatedResponse는 types.ts에서 export
export type {
  PaginatedResponse,
  PaginatedResponse as EquipmentPaginatedResponse,
  PaginatedResponse as RentalPaginatedResponse,
  PaginatedResponse as CalibrationPaginatedResponse,
} from './types';

export type { Rental, RentalQuery, CreateRentalDto, UpdateRentalDto } from './rental-api';

export type {
  Calibration as CalibrationRecord,
  CalibrationQuery,
  CreateCalibrationDto,
  UpdateCalibrationDto,
} from './calibration-api';

export type {
  CalibrationPlan,
  CalibrationPlanItem,
  CalibrationPlanStatus,
  CalibrationPlanQuery,
  CreateCalibrationPlanDto,
  UpdateCalibrationPlanDto,
  ExternalEquipment,
  ExternalEquipmentQuery,
  CALIBRATION_PLAN_STATUS_LABELS,
  CALIBRATION_PLAN_STATUS_COLORS,
  SITE_LABELS,
} from './calibration-plans-api';

export type {
  RepairHistory,
  RepairResult,
  CreateRepairHistoryDto,
  UpdateRepairHistoryDto,
  RepairHistoryQuery,
  RepairHistoryListResponse,
  RepairSummaryResponse,
} from './repair-history-api';
