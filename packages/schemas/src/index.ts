// 모듈의 일부만 선택적으로 내보내기
import { z } from 'zod';
import {
  Equipment,
  CreateEquipmentInput,
  UpdateEquipmentInput,
  EquipmentFilter,
  isEquipment,
  equipmentSchema,
  equipmentFilterSchema,
  createEquipmentSchema,
  updateEquipmentSchema,
  baseEquipmentSchema,
} from './equipment';

import {
  User,
  CreateUserInput,
  UpdateUserInput,
  isUser,
  userSchema,
  userListResponseSchema,
} from './user';

// enums.ts에서 모든 enum 타입과 관련 타입 가져오기
import * as Enums from './enums';
// 직접 타입을 가져오기
import {
  EquipmentStatusEnum,
  EquipmentStatus,
  CalibrationMethodEnum,
  CalibrationMethod,
  UserRoleEnum,
  UserRole,
  TeamEnum,
  TeamId,
} from './enums';

import { Team, CreateTeamInput, UpdateTeamInput, isTeam, teamSchema } from './team';

import {
  Rental,
  RentalSchema,
  RentalStatusEnum,
  RentalTypeEnum,
  RentalStatus,
  RentalType,
  RentalListResponse,
} from './loan';

import * as Checkout from './checkout';

import {
  Calibration,
  CreateCalibrationInput,
  UpdateCalibrationInput,
  isCalibration,
  calibrationSchema,
  calibrationListResponseSchema,
  CalibrationStatusEnum,
  CalibrationStatus,
} from './calibration';

import {
  Reservation,
  ReservationSchema,
  CreateReservationDto,
  UpdateReservationDto,
  ReservationStatus,
  ReservationStatusEnum,
  ReservationListResponse,
  ExpandedReservation,
} from './reservation';

import { AppError, ErrorCode, ErrorResponse, ErrorResponseSchema, handleZodError } from './errors';

// 각 모듈에서 가져온 객체 및 타입 내보내기
export {
  // Equipment
  Equipment,
  CreateEquipmentInput,
  UpdateEquipmentInput,
  EquipmentFilter,
  isEquipment,
  equipmentSchema,
  equipmentFilterSchema,
  createEquipmentSchema,
  updateEquipmentSchema,
  baseEquipmentSchema,

  // User
  User,
  CreateUserInput,
  UpdateUserInput,
  isUser,
  userSchema,
  userListResponseSchema,

  // Enums - 네임스페이스로 내보내기
  Enums,
  // Enums - 직접 내보내기
  EquipmentStatusEnum,
  EquipmentStatus,
  CalibrationMethodEnum,
  CalibrationMethod,
  UserRoleEnum,
  UserRole,
  TeamEnum,
  TeamId,
  LoanStatusEnum,
  LoanStatus,
  LOAN_STATUS_VALUES,
  CheckoutStatusEnum,
  CheckoutStatus,
  CHECKOUT_STATUS_VALUES,
  CheckoutPurposeEnum,
  CheckoutPurpose,
  CHECKOUT_PURPOSE_VALUES,

  // Team
  Team,
  CreateTeamInput,
  UpdateTeamInput,
  isTeam,
  teamSchema,

  // Rental (Loan)
  Rental,
  RentalSchema,
  RentalStatusEnum,
  RentalTypeEnum,
  RentalStatus,
  RentalType,
  RentalListResponse,

  // Checkout - 전체 모듈 내보내기
  Checkout,

  // Calibration
  Calibration,
  CreateCalibrationInput,
  UpdateCalibrationInput,
  isCalibration,
  calibrationSchema,
  calibrationListResponseSchema,
  CalibrationStatusEnum,
  CalibrationStatus,

  // Reservation (DEPRECATED - Rentals 모듈로 통합됨)
  // @deprecated Reservations 모듈은 Rentals 모듈로 통합되었습니다. /rentals API를 사용하세요.
  Reservation,
  ReservationSchema,
  CreateReservationDto,
  UpdateReservationDto,
  ReservationStatus,
  ReservationStatusEnum,
  ReservationListResponse,
  ExpandedReservation,

  // Errors
  AppError,
  ErrorCode,
  ErrorResponse,
  ErrorResponseSchema,
  handleZodError,
};

// ListResponse 타입 임시 선언 - 백엔드와 일치시키기 위함
export type UserListResponse = {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TeamListResponse = {
  items: Team[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Reservation 쿼리 타입 임시 선언
export type ReservationQuery = {
  equipmentId?: string;
  userId?: string;
  status?: ReservationStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  pageSize?: number;
  sort?: string;
};

export const ReservationQuerySchema = ReservationSchema.partial().extend({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  sort: z.string().optional(),
});

export const CreateReservationDtoSchema = ReservationSchema.omit({ id: true });
export const UpdateReservationDtoSchema = ReservationSchema.partial();

// 필요한 엔티티 타입 정의도 필요시 주석 해제
// export * from './entities/equipment.entity';
// export * from './entities/calibration.entity';
// export * from './entities/rental.entity';
