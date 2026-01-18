import { apiClient } from './api-client';
import dashboardApi from './dashboard-api';
import equipmentApi from './equipment-api';
import rentalApi from './rental-api';
import calibrationApi from './calibration-api';
import reservationApi from './reservation-api';

// API 객체 통합 내보내기
export { apiClient, dashboardApi, equipmentApi, rentalApi, calibrationApi, reservationApi };

// 타입 내보내기
export type {
  EquipmentSummary,
  CalibrationSchedule,
  TeamEquipmentStat,
  RecentActivity,
  OverdueLoan,
} from './dashboard-api';

export type {
  Equipment,
  EquipmentQuery,
  CreateEquipmentDto,
  UpdateEquipmentDto,
} from './equipment-api';

// PaginatedResponse는 types.ts에서 export
export type { PaginatedResponse as EquipmentPaginatedResponse } from './types';

export type {
  Rental,
  PaginatedResponse as RentalPaginatedResponse,
  RentalQuery,
  CreateRentalDto,
  UpdateRentalDto,
} from './rental-api';

export type {
  CalibrationRecord,
  PaginatedResponse as CalibrationPaginatedResponse,
  CalibrationQuery,
  CreateCalibrationDto,
  UpdateCalibrationDto,
} from './calibration-api';

export type { PaginatedResponse as ReservationPaginatedResponse } from './reservation-api';
