// 스키마 모듈 내보내기
export * from './equipment';
export * from './teams';
export * from './users';
export * from './checkouts';
export * from './condition-checks';
export * from './calibrations';
export * from './equipment-requests';
export * from './equipment-attachments';
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
