/**
 * DB Enum Column 정책
 *
 * 두 가지 패턴이 의도적으로 혼용됩니다:
 *
 * 1. pgEnum (PostgreSQL 타입 레벨 제약)
 *    - 대상: 값이 거의 변경되지 않는 핵심 enum (equipment_status, attachment_type, approval_status, request_type)
 *    - 장점: DB 레벨에서 유효하지 않은 값 삽입 차단
 *    - 단점: 값 추가/삭제 시 ALTER TYPE 마이그레이션 필요
 *
 * 2. varchar + $type<>() (애플리케이션 레벨 제약)
 *    - 대상: 값이 자주 변경되거나 확장 가능한 enum (checkout status, purpose, NC type 등)
 *    - 장점: 마이그레이션 없이 값 추가/삭제 가능
 *    - 단점: DB 레벨 검증 없음 — Zod 스키마에 의존
 *
 * SSOT: 두 패턴 모두 @equipment-management/schemas의 enum 값 배열을 참조합니다.
 * - pgEnum: `pgEnum('name', [...ENUM_VALUES] as [string, ...string[]])`
 * - varchar: `varchar('name', { length: N }).$type<EnumType>()`
 */

// 스키마 모듈 내보내기
export * from './equipment';
export * from './teams';
export * from './users';
export * from './checkouts';
export * from './condition-checks';
export * from './calibrations';
export * from './equipment-requests';
export * from './equipment-attachments';
export * from './documents';
export * from './calibration-factors';
export * from './non-conformances';
export * from './software-history';
export * from './calibration-plans';
export * from './repair-history';
export * from './audit-logs';
export * from './disposal-requests';
export * from './equipment-imports'; // Unified rental + internal shared imports (includes legacy rental-imports aliases)

// 알림 스키마
export * from './notifications';

// 사용자 환경 설정
export * from './user-preferences';

// 시스템 설정
export * from './system-settings';

// 장비 이력 스키마
export * from './equipment-location-history';
export * from './equipment-maintenance-history';
export * from './equipment-incident-history';
