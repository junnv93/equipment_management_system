import { 
  EquipmentStatusEnum, 
  CalibrationMethodEnum, 
  UserRoleEnum,
  TeamEnum,
  RentalStatusEnum,
  RentalTypeEnum,
  CalibrationStatusEnum,
  CheckoutStatusEnum
} from './enums';

// 장비 스키마
export const equipmentSchema = {
  id: { type: 'string' },
  name: { type: 'string' },
  managementNumber: { type: 'string' },
  assetNumber: { type: 'string' },
  modelName: { type: 'string' },
  manufacturer: { type: 'string' },
  serialNumber: { type: 'string' },
  description: { type: 'string' },
  location: { type: 'string' },
  calibrationCycle: { type: 'number' },
  lastCalibrationDate: { type: 'date' },
  nextCalibrationDate: { type: 'date' },
  calibrationAgency: { type: 'string' },
  calibrationMethod: { type: 'enum', values: Object.values(CalibrationMethodEnum) },
  status: { type: 'enum', values: Object.values(EquipmentStatusEnum) },
  teamId: { type: 'string' },
  managerId: { type: 'string' },
  purchaseDate: { type: 'date' },
  price: { type: 'number' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
};

// 장비 생성 DTO 스키마
export const createEquipmentSchema = {
  name: { type: 'string' },
  managementNumber: { type: 'string' },
  assetNumber: { type: 'string' },
  modelName: { type: 'string' },
  manufacturer: { type: 'string' },
  serialNumber: { type: 'string' },
  description: { type: 'string' },
  location: { type: 'string' },
  calibrationCycle: { type: 'number' },
  lastCalibrationDate: { type: 'date' },
  nextCalibrationDate: { type: 'date' },
  calibrationAgency: { type: 'string' },
  calibrationMethod: { type: 'enum', values: Object.values(CalibrationMethodEnum) },
  status: { type: 'enum', values: Object.values(EquipmentStatusEnum) },
  teamId: { type: 'string' },
  managerId: { type: 'string' },
  purchaseDate: { type: 'date' },
  price: { type: 'number' },
};

// 장비 업데이트 DTO 스키마
export const updateEquipmentSchema = {
  name: { type: 'string', optional: true },
  managementNumber: { type: 'string', optional: true },
  assetNumber: { type: 'string', optional: true },
  modelName: { type: 'string', optional: true },
  manufacturer: { type: 'string', optional: true },
  serialNumber: { type: 'string', optional: true },
  description: { type: 'string', optional: true },
  location: { type: 'string', optional: true },
  calibrationCycle: { type: 'number', optional: true },
  lastCalibrationDate: { type: 'date', optional: true },
  nextCalibrationDate: { type: 'date', optional: true },
  calibrationAgency: { type: 'string', optional: true },
  calibrationMethod: { type: 'enum', values: Object.values(CalibrationMethodEnum), optional: true },
  status: { type: 'enum', values: Object.values(EquipmentStatusEnum), optional: true },
  teamId: { type: 'string', optional: true },
  managerId: { type: 'string', optional: true },
  purchaseDate: { type: 'date', optional: true },
  price: { type: 'number', optional: true },
};

// 대여 스키마
export const rentalSchema = {
  id: { type: 'string' },
  equipmentId: { type: 'string' },
  userId: { type: 'string' },
  approverId: { type: 'string', optional: true },
  startDate: { type: 'date' },
  expectedEndDate: { type: 'date' },
  actualEndDate: { type: 'date', optional: true },
  purpose: { type: 'string' },
  status: { type: 'enum', values: Object.values(RentalStatusEnum) },
  type: { type: 'enum', values: Object.values(RentalTypeEnum) },
  notes: { type: 'string', optional: true },
  location: { type: 'string', optional: true },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
};

// 대여 생성 DTO 스키마
export const createRentalSchema = {
  equipmentId: { type: 'string' },
  userId: { type: 'string' },
  startDate: { type: 'date' },
  expectedEndDate: { type: 'date' },
  purpose: { type: 'string' },
  type: { type: 'enum', values: Object.values(RentalTypeEnum) },
  notes: { type: 'string', optional: true },
  location: { type: 'string', optional: true },
};

// 대여 업데이트 DTO 스키마
export const updateRentalSchema = {
  approverId: { type: 'string', optional: true },
  startDate: { type: 'date', optional: true },
  expectedEndDate: { type: 'date', optional: true },
  actualEndDate: { type: 'date', optional: true },
  purpose: { type: 'string', optional: true },
  status: { type: 'enum', values: Object.values(RentalStatusEnum), optional: true },
  type: { type: 'enum', values: Object.values(RentalTypeEnum), optional: true },
  notes: { type: 'string', optional: true },
  location: { type: 'string', optional: true },
};

// 교정 스키마
export const calibrationSchema = {
  id: { type: 'string' },
  equipmentId: { type: 'string' },
  calibrationManagerId: { type: 'string' },
  calibrationDate: { type: 'date' },
  nextCalibrationDate: { type: 'date' },
  calibrationMethod: { type: 'enum', values: Object.values(CalibrationMethodEnum) },
  status: { type: 'enum', values: Object.values(CalibrationStatusEnum) },
  calibrationAgency: { type: 'string' },
  certificateNumber: { type: 'string', optional: true },
  certificateFile: { type: 'string', optional: true },
  notes: { type: 'string', optional: true },
  results: { type: 'string', optional: true },
  cost: { type: 'number', optional: true },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
};

// 교정 생성 DTO 스키마
export const createCalibrationSchema = {
  equipmentId: { type: 'string' },
  calibrationManagerId: { type: 'string' },
  calibrationDate: { type: 'date' },
  nextCalibrationDate: { type: 'date' },
  calibrationMethod: { type: 'enum', values: Object.values(CalibrationMethodEnum) },
  status: { type: 'enum', values: Object.values(CalibrationStatusEnum) },
  calibrationAgency: { type: 'string' },
  certificateNumber: { type: 'string', optional: true },
  certificateFile: { type: 'string', optional: true },
  notes: { type: 'string', optional: true },
  results: { type: 'string', optional: true },
  cost: { type: 'number', optional: true },
};

// 교정 업데이트 DTO 스키마
export const updateCalibrationSchema = {
  calibrationManagerId: { type: 'string', optional: true },
  calibrationDate: { type: 'date', optional: true },
  nextCalibrationDate: { type: 'date', optional: true },
  calibrationMethod: { type: 'enum', values: Object.values(CalibrationMethodEnum), optional: true },
  status: { type: 'enum', values: Object.values(CalibrationStatusEnum), optional: true },
  calibrationAgency: { type: 'string', optional: true },
  certificateNumber: { type: 'string', optional: true },
  certificateFile: { type: 'string', optional: true },
  notes: { type: 'string', optional: true },
  results: { type: 'string', optional: true },
  cost: { type: 'number', optional: true },
};

// 사용자 스키마
export const userSchema = {
  id: { type: 'string' },
  email: { type: 'string' },
  name: { type: 'string' },
  role: { type: 'enum', values: Object.values(UserRoleEnum) },
  teamId: { type: 'string', optional: true },
  department: { type: 'string', optional: true },
  position: { type: 'string', optional: true },
  phoneNumber: { type: 'string', optional: true },
  isActive: { type: 'boolean' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
};

// 사용자 생성 DTO 스키마
export const createUserSchema = {
  email: { type: 'string' },
  name: { type: 'string' },
  password: { type: 'string' },
  role: { type: 'enum', values: Object.values(UserRoleEnum) },
  teamId: { type: 'string', optional: true },
  department: { type: 'string', optional: true },
  position: { type: 'string', optional: true },
  phoneNumber: { type: 'string', optional: true },
};

// 사용자 업데이트 DTO 스키마
export const updateUserSchema = {
  name: { type: 'string', optional: true },
  role: { type: 'enum', values: Object.values(UserRoleEnum), optional: true },
  teamId: { type: 'string', optional: true },
  department: { type: 'string', optional: true },
  position: { type: 'string', optional: true },
  phoneNumber: { type: 'string', optional: true },
  isActive: { type: 'boolean', optional: true },
};

// 팀 스키마
export const teamSchema = {
  id: { type: 'string' },
  name: { type: 'string' },
  code: { type: 'enum', values: Object.values(TeamEnum) },
  description: { type: 'string', optional: true },
  managerId: { type: 'string', optional: true },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
};

// 팀 생성 DTO 스키마
export const createTeamSchema = {
  name: { type: 'string' },
  code: { type: 'enum', values: Object.values(TeamEnum) },
  description: { type: 'string', optional: true },
  managerId: { type: 'string', optional: true },
};

// 팀 업데이트 DTO 스키마
export const updateTeamSchema = {
  name: { type: 'string', optional: true },
  code: { type: 'enum', values: Object.values(TeamEnum), optional: true },
  description: { type: 'string', optional: true },
  managerId: { type: 'string', optional: true },
};

// 반출 스키마
export const checkoutSchema = {
  id: { type: 'string' },
  userId: { type: 'string' },
  approverId: { type: 'string', optional: true },
  destinationName: { type: 'string' },
  destinationAddress: { type: 'string' },
  destinationContact: { type: 'string' },
  purpose: { type: 'string' },
  startDate: { type: 'date' },
  expectedEndDate: { type: 'date' },
  actualEndDate: { type: 'date', optional: true },
  notes: { type: 'string', optional: true },
  status: { type: 'enum', values: Object.values(CheckoutStatusEnum) },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
};

// 반출 장비 스키마
export const checkoutEquipmentSchema = {
  id: { type: 'string' },
  checkoutId: { type: 'string' },
  equipmentId: { type: 'string' },
  condition: { type: 'string', optional: true },
  notes: { type: 'string', optional: true },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
};

// 반출 생성 DTO 스키마
export const createCheckoutSchema = {
  userId: { type: 'string' },
  equipmentIds: { type: 'array', items: { type: 'string' } },
  destinationName: { type: 'string' },
  destinationAddress: { type: 'string' },
  destinationContact: { type: 'string' },
  purpose: { type: 'string' },
  startDate: { type: 'date' },
  expectedEndDate: { type: 'date' },
  notes: { type: 'string', optional: true },
};

// 반출 업데이트 DTO 스키마
export const updateCheckoutSchema = {
  approverId: { type: 'string', optional: true },
  destinationName: { type: 'string', optional: true },
  destinationAddress: { type: 'string', optional: true },
  destinationContact: { type: 'string', optional: true },
  purpose: { type: 'string', optional: true },
  startDate: { type: 'date', optional: true },
  expectedEndDate: { type: 'date', optional: true },
  actualEndDate: { type: 'date', optional: true },
  notes: { type: 'string', optional: true },
  status: { type: 'enum', values: Object.values(CheckoutStatusEnum), optional: true },
};

// 반출 장비 생성 DTO 스키마
export const createCheckoutEquipmentSchema = {
  checkoutId: { type: 'string' },
  equipmentId: { type: 'string' },
  condition: { type: 'string', optional: true },
  notes: { type: 'string', optional: true },
};

// 반출 장비 업데이트 DTO 스키마
export const updateCheckoutEquipmentSchema = {
  condition: { type: 'string', optional: true },
  notes: { type: 'string', optional: true },
}; 