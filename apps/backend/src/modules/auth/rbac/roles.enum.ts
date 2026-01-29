/**
 * 사용자 역할 enum
 *
 * ⚠️ SSOT: @equipment-management/schemas의 UserRoleEnum이 원본
 * 이 파일은 백엔드 호환성을 위한 TypeScript enum 형태 제공
 *
 * 향후 마이그레이션: 이 enum 대신 schemas의 UserRole 타입 직접 사용 권장
 */

// 백엔드 코드 호환성을 위해 TypeScript enum 유지
// 값은 schemas의 UserRoleEnum과 동일하게 유지
export enum UserRole {
  TEST_ENGINEER = 'test_engineer', // 시험실무자 (Test Engineer)
  TECHNICAL_MANAGER = 'technical_manager', // 기술책임자 (Technical Manager)
  LAB_MANAGER = 'lab_manager', // 시험소장 (Lab Manager)
}

// schemas 타입과 호환되도록 타입 re-export
export type { UserRole as UserRoleType } from '@equipment-management/schemas';
