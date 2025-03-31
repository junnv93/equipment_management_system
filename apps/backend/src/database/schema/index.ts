// 타입 선언 내보내기
export type {
  Equipment,
  NewEquipment,
  EquipmentWithRelations,
} from './equipment';

export type {
  Team,
  NewTeam,
  TeamWithRelations,
} from './teams';

export type {
  User,
  NewUser,
  UserWithRelations,
} from './users';

export type {
  Loan,
  NewLoan,
  LoanWithRelations,
} from './loans';

export type {
  Checkout,
  NewCheckout,
  CheckoutWithRelations,
} from './checkouts';

export type {
  Calibration,
  NewCalibration,
  CalibrationWithRelations,
} from './calibrations';

export type {
  History,
  NewHistory,
  HistoryWithRelations,
} from './history';

// 모델 및 스키마 내보내기
export {
  equipment,
  EquipmentStatus,
  insertEquipmentSchema,
  selectEquipmentSchema,
} from './equipment';

export {
  teams,
  TeamType,
  insertTeamSchema,
  selectTeamSchema,
} from './teams';

export {
  users,
  UserRole,
  insertUserSchema,
  selectUserSchema,
} from './users';

export {
  loans,
  LoanStatus,
  insertLoanSchema,
  selectLoanSchema,
} from './loans';

export {
  checkouts,
  CheckoutStatus,
  insertCheckoutSchema,
  selectCheckoutSchema,
} from './checkouts';

export {
  calibrations,
  CalibrationMethod,
  CalibrationResult,
  insertCalibrationSchema,
  selectCalibrationSchema,
} from './calibrations';

export {
  history,
  HistoryEventType,
  insertHistorySchema,
  selectHistorySchema,
} from './history';

// 관계 정의 내보내기
export {
  equipmentRelations,
  teamsRelations,
  usersRelations,
  loansRelations,
  checkoutsRelations,
  calibrationsRelations,
  historyRelations,
} from './relations'; 