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

// 장비 인터페이스
export interface Equipment {
  id: string;
  name: string;
  managementNumber: string;
  assetNumber: string;
  modelName: string;
  manufacturer: string;
  serialNumber: string;
  description: string;
  location: string;
  calibrationCycle: number;
  lastCalibrationDate: Date;
  nextCalibrationDate: Date;
  calibrationAgency: string;
  calibrationMethod: CalibrationMethodEnum | string;
  status: EquipmentStatusEnum | string;
  teamId: string;
  managerId: string;
  purchaseDate: Date;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

// 장비 목록 응답 인터페이스
export interface EquipmentListResponse {
  items: Equipment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 대여 인터페이스
export interface Rental {
  id: string;
  equipmentId: string;
  userId: string;
  approverId?: string;
  startDate: Date | string;
  expectedEndDate: Date | string;
  actualEndDate?: Date | string;
  purpose: string;
  status: RentalStatusEnum | string;
  type: RentalTypeEnum | string;
  notes?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 대여 목록 응답 인터페이스
export interface RentalListResponse {
  items: Rental[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 교정 인터페이스
export interface Calibration {
  id: string;
  equipmentId: string;
  calibrationManagerId: string;
  calibrationDate: Date;
  nextCalibrationDate: Date;
  calibrationMethod: CalibrationMethodEnum | string;
  status: CalibrationStatusEnum | string;
  calibrationAgency: string;
  certificationNumber?: string;
  certificateFile?: string;
  notes?: string;
  results?: string;
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 교정 목록 응답 인터페이스
export interface CalibrationListResponse {
  items: Calibration[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 팀 인터페이스
export interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId?: string;
  equipmentCount?: number;
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// 팀 목록 응답 인터페이스
export interface TeamListResponse {
  items: Team[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 사용자 인터페이스
export interface User {
  id?: string;
  email?: string;
  name?: string;
  role?: UserRoleEnum | string;
  teamId?: 'rf' | 'sar' | 'emc' | 'auto' | string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  isActive?: boolean;
  equipmentCount?: number;
  rentalsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  lastLogin?: Date;
}

// 사용자 목록 응답 인터페이스
export interface UserListResponse {
  items?: User[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// 반출 인터페이스
export interface Checkout {
  id: string;
  userId: string;
  approverId?: string;
  destinationName: string;
  destinationAddress: string;
  destinationContact: string;
  purpose: string;
  startDate: string | Date;
  expectedEndDate: string | Date;
  actualEndDate?: string | Date;
  notes?: string;
  status: CheckoutStatusEnum | string;
  createdAt: Date;
  updatedAt: Date;
}

// 반출 장비 인터페이스
export interface CheckoutEquipment {
  id: string;
  checkoutId: string;
  equipmentId: string;
  condition?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 반출 목록 응답 인터페이스
export interface CheckoutListResponse {
  items: Checkout[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 