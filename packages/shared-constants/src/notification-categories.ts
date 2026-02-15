/**
 * 알림 카테고리 SSOT (Single Source of Truth)
 *
 * 이 파일은 알림 시스템의 카테고리를 중앙에서 정의합니다.
 * 백엔드(notification-registry.ts)와 프론트엔드(필터, 아이콘, 설정)가
 * 모두 이 파일을 참조합니다.
 *
 * SSOT 체인:
 *   이 파일 (카테고리 정의)
 *     → Backend: notification-registry.ts (카테고리별 이벤트 매핑)
 *     → Backend: notification-dispatcher.ts (DB 저장)
 *     → Frontend: notification-item.tsx (아이콘/색상)
 *     → Frontend: NotificationsListContent.tsx (필터)
 *     → Frontend: NotificationsContent.tsx (설정 토글)
 *
 * 새 카테고리 추가 시:
 * 1. 이 파일에 카테고리 추가
 * 2. notification-registry.ts에서 이벤트 매핑
 * 3. 프론트엔드는 자동 반영 (이 파일 import)
 */

/**
 * 알림 카테고리 값 (DB에 저장되는 실제 문자열)
 */
export const NOTIFICATION_CATEGORIES = [
  'checkout',
  'calibration',
  'calibration_plan',
  'non_conformance',
  'disposal',
  'equipment_import',
  'equipment',
  'system',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/**
 * 카테고리별 한글 라벨
 * - 프론트엔드 필터 드롭다운, 설정 토글에서 사용
 */
export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  checkout: '반출',
  calibration: '교정',
  calibration_plan: '교정계획',
  non_conformance: '부적합',
  disposal: '폐기',
  equipment_import: '장비 반입',
  equipment: '장비',
  system: '시스템',
};

/**
 * 카테고리별 설명 (설정 페이지 도움말)
 */
export const NOTIFICATION_CATEGORY_DESCRIPTIONS: Record<NotificationCategory, string> = {
  checkout: '반출 요청, 승인, 반려, 반입 관련 알림',
  calibration: '교정 기록 등록, 승인, 기한 임박/초과 알림',
  calibration_plan: '교정계획서 제출/검토/승인/반려 알림',
  non_conformance: '부적합 등록, 조치 완료, 종료 알림',
  disposal: '폐기 요청, 검토, 승인 알림',
  equipment_import: '장비 반입 요청, 승인 알림',
  equipment: '장비 등록, 수정, 상태 변경 알림',
  system: '시스템 점검 및 중요 공지 알림',
};

/**
 * 카테고리별 설정 폼 필드 이름 (프론트엔드 form schema와 매핑)
 */
export const NOTIFICATION_CATEGORY_FORM_FIELDS: Record<NotificationCategory, string> = {
  checkout: 'checkoutEnabled',
  calibration: 'calibrationEnabled',
  calibration_plan: 'calibrationPlanEnabled',
  non_conformance: 'nonConformanceEnabled',
  disposal: 'disposalEnabled',
  equipment_import: 'equipmentImportEnabled',
  equipment: 'equipmentEnabled',
  system: 'systemEnabled',
};
