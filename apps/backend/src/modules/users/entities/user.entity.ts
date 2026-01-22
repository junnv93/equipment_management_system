/**
 * 사용자 역할을 나타내는 열거형
 * @deprecated 이 enum은 더 이상 사용되지 않습니다.
 * 대신 apps/backend/src/modules/auth/rbac/roles.enum.ts의 UserRole을 사용하세요.
 */
export enum UserRole {
  TEST_ENGINEER = 'test_engineer',
  TECHNICAL_MANAGER = 'technical_manager',
  LAB_MANAGER = 'lab_manager',
}

/**
 * 사용자 상태를 나타내는 열거형
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// 참고: entity 클래스는 제거되었으며, 대신 drizzle 스키마가 사용됩니다.
// 스키마 정의는 apps/backend/src/database/drizzle/schema/users.ts 파일을 참조하세요.
