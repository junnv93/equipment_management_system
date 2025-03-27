import { z } from 'zod';
import { CalibrationMethodEnum, EquipmentStatusEnum } from './enums';
import {
  BaseEntity,
  SoftDeleteEntity,
  PaginatedResponse,
  PaginationParams,
  paginationParamsSchema,
} from './common/base';

// 기본 장비 스키마 (공통 필드)
export const baseEquipmentSchema = z.object({
  name: z.string().min(2).max(100),
  managementNumber: z.string().min(2).max(50),
  assetNumber: z.string().optional(),
  modelName: z.string().optional(),
  manufacturer: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  
  // 교정 정보
  calibrationCycle: z.number().optional(),
  lastCalibrationDate: z.string().datetime().optional(),
  calibrationAgency: z.string().optional(),
  needsIntermediateCheck: z.boolean().default(false),
  calibrationMethod: CalibrationMethodEnum.optional(),
  
  // 관리 정보
  purchaseYear: z.number().optional(),
  teamId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  
  // 추가 정보
  supplier: z.string().optional(),
  contactInfo: z.string().optional(),
  softwareVersion: z.string().optional(),
  firmwareVersion: z.string().optional(),
  manualLocation: z.string().optional(),
  accessories: z.string().optional(),
  mainFeatures: z.string().optional(),
  technicalManager: z.string().optional(),
  
  // 상태 정보
  status: EquipmentStatusEnum.default('available'),
});

// 장비 생성 스키마
export const createEquipmentSchema = baseEquipmentSchema;

// 장비 업데이트 스키마
export const updateEquipmentSchema = baseEquipmentSchema.partial();

// 장비 조회용 스키마
export const equipmentSchema = baseEquipmentSchema.extend({
  id: z.string().uuid(),
  nextCalibrationDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

// 장비 검색 필터 스키마
export const equipmentFilterSchema = z.object({
  search: z.string().optional(),
  status: EquipmentStatusEnum.optional(),
  teamId: z.string().optional(),
  location: z.string().optional(),
  manufacturer: z.string().optional(),
  calibrationDue: z.boolean().optional(),
}).merge(paginationParamsSchema);

// 타입 정의
export type BaseEquipment = z.infer<typeof baseEquipmentSchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type Equipment = z.infer<typeof equipmentSchema> & SoftDeleteEntity;
export type EquipmentFilter = z.infer<typeof equipmentFilterSchema>;

// 장비 목록 조회를 위한 응답 스키마
export const equipmentListResponseSchema = PaginatedResponse(equipmentSchema);
export type EquipmentListResponse = z.infer<typeof equipmentListResponseSchema>;

// 타입 가드
export const isEquipment = (value: unknown): value is Equipment => {
  try {
    return equipmentSchema.parse(value) !== null;
  } catch {
    return false;
  }
}; 