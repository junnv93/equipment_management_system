import { z } from 'zod';

// 장비 상태 열거형
export const EquipmentStatusEnum = z.enum([
  'available', // 사용 가능
  'loaned', // 대여 중
  'checked_out', // 반출 중
  'calibration_scheduled', // 교정 예정
  'calibration_overdue', // 교정 기한 초과
  'maintenance', // 유지보수 중
  'retired' // 사용 중지
]);

export type EquipmentStatus = z.infer<typeof EquipmentStatusEnum>;

// 교정 방법 열거형
export const CalibrationMethodEnum = z.enum([
  'external_calibration', // 외부 교정
  'self_inspection', // 자체 점검
  'not_applicable' // 비대상
]);

export type CalibrationMethod = z.infer<typeof CalibrationMethodEnum>;

// 사용자 역할 열거형
export const UserRoleEnum = z.enum([
  'admin', // 관리자
  'manager', // 팀 관리자
  'user' // 일반 사용자
]);

export type UserRole = z.infer<typeof UserRoleEnum>;

// 팀 ID 열거형
export const TeamEnum = z.enum([
  'rf', // RF팀
  'sar', // SAR팀
  'emc', // EMC팀
  'auto' // Automotive팀
]);

export type TeamId = z.infer<typeof TeamEnum>; 