/**
 * ⚠️ DEPRECATED: Barrel import 패턴은 트리쉐이킹을 방해합니다.
 *
 * 직접 import를 사용하세요:
 * ```typescript
 * // ❌ AVOID: Barrel import
 * import { dashboardApi, equipmentApi } from '@/lib/api';
 *
 * // ✅ CORRECT: Direct import
 * import dashboardApi from '@/lib/api/dashboard-api';
 * import equipmentApi from '@/lib/api/equipment-api';
 * ```
 *
 * @see https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
 * @deprecated Use direct imports instead for better tree-shaking
 */
import { apiClient } from './api-client';
import dashboardApi from './dashboard-api';
import equipmentApi from './equipment-api';
import calibrationApi from './calibration-api';
import calibrationFactorsApi from './calibration-factors-api';
import calibrationPlansApi from './calibration-plans-api';
import nonConformancesApi from './non-conformances-api';
import softwareApi from './software-api';
import * as repairHistoryApi from './repair-history-api';

// API 객체 통합 내보내기 (호환성 유지, 새 코드에서는 직접 import 권장)
export {
  apiClient,
  dashboardApi,
  equipmentApi,
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
  OverdueCheckout,
  OverdueRental, // @deprecated Use OverdueCheckout instead
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
  PaginatedResponse as CalibrationPaginatedResponse,
} from './types';

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
} from './repair-history-api';
