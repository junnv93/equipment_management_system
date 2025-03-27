import { z } from 'zod';

// 장비 카테고리 열거형
export enum EquipmentCategory {
  COMPUTER = 'COMPUTER',
  NETWORK = 'NETWORK',
  PERIPHERAL = 'PERIPHERAL',
  TOOL = 'TOOL',
  OFFICE = 'OFFICE',
  OTHER = 'OTHER',
}

// 장비 상태 열거형
export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  BROKEN = 'BROKEN',
  RETIRED = 'RETIRED',
}

// 장비 생성 스키마
export const CreateEquipmentSchema = z.object({
  name: z.string().min(1, '장비 이름은 필수입니다.'),
  managementNumber: z.string().min(1, '관리번호는 필수입니다.'),
  category: z.nativeEnum(EquipmentCategory),
  location: z.string().optional(),
  description: z.string().optional(),
  purchaseDate: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

// 장비 수정 스키마
export const UpdateEquipmentSchema = CreateEquipmentSchema.partial().extend({
  status: z.nativeEnum(EquipmentStatus).optional(),
});

// 장비 전체 스키마
export const EquipmentSchema = CreateEquipmentSchema.extend({
  id: z.string(),
  status: z.nativeEnum(EquipmentStatus),
  assigneeId: z.string().nullable().optional(),
  assignee: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 타입 유틸리티
export type CreateEquipment = z.infer<typeof CreateEquipmentSchema>;
export type UpdateEquipment = z.infer<typeof UpdateEquipmentSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>; 