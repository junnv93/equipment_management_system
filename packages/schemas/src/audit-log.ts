import { z } from 'zod';

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 감사 로그 관련 타입 및 상수
 *
 * 이 파일이 감사 로그의 모든 타입과 라벨의 기준입니다.
 * - 백엔드/프론트엔드는 이 파일에서 import하여 사용
 * - 하드코딩 금지 (ACTION_LABELS, ENTITY_TYPE_LABELS 등)
 *
 * 아키텍처:
 * - Enum 정의: enums.ts에서 import (SSOT)
 * - 도메인 상수: 이 파일에서 정의 (라벨, 컬러 등)
 */

// ============================================================================
// System Constants
// ============================================================================

/**
 * nil UUID: 시스템 생성 감사 로그의 userId/entityId로 사용
 *
 * PostgreSQL uuid 컬럼 호환 (RFC 4122). 'system'/'anonymous' 문자열은 INSERT 실패.
 * 프론트엔드에서 시스템 actor 식별 시 이 상수와 비교합니다.
 */
export const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';

// ============================================================================
// Enum Imports (SSOT: enums.ts)
// ============================================================================

import type { AuditAction, AuditEntityType, UserRole } from './enums';
export type { AuditAction, AuditEntityType, UserRole };

/**
 * 감사 로그 행위자 역할 유니온 타입
 *
 * - UserRole: 정상 인증된 사용자의 역할
 * - 'system': 스케줄러·시스템 자동화 이벤트 (userId = SYSTEM_USER_UUID)
 * - 'unknown': 인증 미확정 이벤트 (로그인 실패, 접근 거부 등)
 */
export type AuditLogUserRole = UserRole | 'system' | 'unknown';

// ============================================================================
// 감사 로그 액션
// ============================================================================

/**
 * 액션 한글 라벨 매핑
 */
/**
 * 액션 한글 라벨 매핑
 *
 * @remarks **서버 사이드 전용** — 알림 문자, 보고서 컬럼 헤더 생성에 사용합니다.
 * 프론트엔드 UI 표시에는 `lib/utils/audit-label-utils.ts`의 i18n 기반 유틸리티를 사용하세요.
 */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  approve: '승인',
  reject: '반려',
  checkout: '반출',
  return: '반입',
  cancel: '취소',
  login: '로그인',
  logout: '로그아웃',
  close: '종료',
  reject_correction: '조치 반려',
  export: '내보내기',
  upload: '업로드',
  download: '다운로드',
  revision: '개정',
  link: '연결',
  unlink: '연결 해제',
  access_denied: '접근 거부',
  submit: '제출',
  withdraw: '제출 취소',
  resubmit: '재제출',
  review: '검토',
  read: '조회',
};

/**
 * 액션별 색상 클래스 (Tailwind CSS)
 * - UI 특화 상수이므로 여기 정의 (프론트엔드 전용)
 *
 * @deprecated Dark mode 미지원, border 미지원, Web Interface Guidelines 위반 (transition-all)
 *             → 대신 @/lib/design-tokens의 AUDIT_ACTION_BADGE_TOKENS 사용 (v3 Architecture)
 *             하위 호환성 유지를 위해 남겨둠 (삭제하지 말 것)
 */
export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-blue-100 text-blue-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  approve: 'bg-green-100 text-green-800',
  reject: 'bg-orange-100 text-orange-800',
  checkout: 'bg-purple-100 text-purple-800',
  return: 'bg-cyan-100 text-cyan-800',
  cancel: 'bg-gray-100 text-gray-800',
  login: 'bg-indigo-100 text-indigo-800',
  logout: 'bg-slate-100 text-slate-800',
  close: 'bg-teal-100 text-teal-800',
  reject_correction: 'bg-rose-100 text-rose-800',
  export: 'bg-emerald-100 text-emerald-800',
  upload: 'bg-sky-100 text-sky-800',
  download: 'bg-violet-100 text-violet-800',
  revision: 'bg-amber-100 text-amber-800',
  link: 'bg-lime-100 text-lime-800',
  unlink: 'bg-stone-100 text-stone-800',
  access_denied: 'bg-red-100 text-red-800',
  submit: 'bg-blue-100 text-blue-800',
  withdraw: 'bg-gray-100 text-gray-800',
  resubmit: 'bg-blue-100 text-blue-800',
  review: 'bg-green-100 text-green-800',
  read: 'bg-gray-100 text-gray-800',
};

// ============================================================================
// 감사 로그 엔티티 타입
// ============================================================================

/**
 * 엔티티 타입 한글 라벨 매핑
 *
 * @remarks **서버 사이드 전용** — 알림 문자, 보고서 컬럼 헤더 생성에 사용합니다.
 * 프론트엔드 UI 표시에는 `lib/utils/audit-label-utils.ts`의 i18n 기반 유틸리티를 사용하세요.
 */
export const AUDIT_ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  equipment: '장비',
  calibration: '교정',
  checkout: '반출',
  rental: '대여',
  rental_import: '대여 반입',
  user: '사용자',
  team: '팀',
  calibration_factor: '보정계수',
  non_conformance: '부적합',
  software: '소프트웨어',
  calibration_plan: '교정계획서',
  repair_history: '수리이력',
  equipment_import: '장비 반입',
  location_history: '위치 이력',
  maintenance_history: '유지보수 이력',
  incident_history: '사고 이력',
  settings: '설정',
  notification: '알림',
  report: '보고서',
  document: '문서',
  software_validation: '소프트웨어 유효성 확인',
  software_equipment_link: '장비-소프트웨어 연결',
  intermediate_inspection: '중간점검',
  cable: '케이블',
  cable_loss_measurement: '케이블 손실 측정',
  self_inspection: '자체점검',
  form_template: '양식 템플릿',
  inspection_result_section: '점검 결과 섹션',
  data_migration_session: '데이터 마이그레이션',
};

// ============================================================================
// 감사 로그 상세 정보 타입
// ============================================================================

/**
 * 감사 로그 상세 정보
 * - previousValue: 변경 전 값
 * - newValue: 변경 후 값
 * - requestId: 요청 ID
 * - additionalInfo: 추가 정보 (requestBody 등)
 */
export interface AuditLogDetails {
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  requestId?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * 감사 로그 타입 (Backend ↔ Frontend 공유)
 */
export interface AuditLog {
  id: string;
  timestamp: string | Date;
  /** 행위자 ID. nullable: 사용자 삭제 시 SET NULL (감사 보존). userName 등 비정규화 컬럼으로 식별 */
  userId: string | null;
  userName: string;
  /** 행위자 역할. @see AuditLogUserRole */
  userRole: AuditLogUserRole;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  details: AuditLogDetails | null;
  ipAddress: string | null;
  /** 행위자의 사이트 (RBAC 스코프용, nullable — 기존 로그 호환) */
  userSite: string | null;
  /** 행위자의 팀 ID (RBAC 스코프용, nullable — 기존 로그 호환) */
  userTeamId: string | null;
  createdAt: string | Date;
}

/**
 * 감사 로그 생성 DTO (Backend)
 */
export interface CreateAuditLogDto {
  /** 행위자 ID. null = 시스템/익명 (FK SET NULL 정책). userName/userRole로 식별 */
  userId: string | null;
  userName: string;
  /** 행위자 역할. @see AuditLogUserRole */
  userRole: AuditLogUserRole;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: AuditLogDetails;
  ipAddress?: string;
  /** 행위자의 사이트 (RBAC 스코프 필터링용) */
  userSite?: string;
  /** 행위자의 팀 ID (RBAC 스코프 필터링용) */
  userTeamId?: string;
}

// ============================================================================
// 감사 로그 필터 및 응답 타입
// ============================================================================

/**
 * 감사 로그 필터
 */
export interface AuditLogFilter {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  page?: number;
  limit?: number;
  /** 커서 기반 페이지네이션 토큰 (opaque base64). page와 상호 배타 */
  cursor?: string;
  /** RBAC: 사이트 스코프 (lab_manager) — 서버 강제 */
  userSite?: string;
  /** RBAC: 팀 스코프 (technical_manager) — 서버 강제 */
  userTeamId?: string;
}

/**
 * 페이지네이션 메타데이터
 */
export interface AuditLogPaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

/**
 * 감사 로그 목록 응답
 */
export interface AuditLogsResponse {
  items: AuditLog[];
  meta: AuditLogPaginationMeta;
}

/**
 * 커서 기반 페이지네이션 응답
 *
 * summary는 첫 페이지(cursor=undefined)에서만 포함.
 * 후속 페이지는 items + nextCursor + hasMore만 반환.
 */
export interface CursorPaginatedAuditLogsResponse {
  items: AuditLog[];
  nextCursor: string | null;
  hasMore: boolean;
  summary?: Record<string, number>;
}

/**
 * 엔티티별 감사 로그 응답
 */
export interface EntityAuditLogsResponse {
  items: AuditLog[];
  formattedLogs: string[];
}

// ============================================================================
// Audit Log → Dashboard Activity 매핑
// ============================================================================

/**
 * 감사 로그 → 대시보드 활동 타입 매핑
 *
 * Key 형식: `{action}:{entityType}` (예: 'create:equipment', 'approve:calibration')
 * Value: 프론트엔드 RecentActivities.tsx의 활동 타입
 *
 * ⚠️ IMPORTANT: checkout purpose='rental'일 때는 RENTAL_ACTIVITY_TYPE_OVERRIDES로 오버라이드됨
 */
export const AUDIT_TO_ACTIVITY_TYPE: Record<string, string> = {
  // Equipment
  'create:equipment': 'equipment_added',
  'update:equipment': 'equipment_updated',
  'approve:equipment': 'equipment_approved',
  'reject:equipment': 'equipment_rejected',
  // Calibration
  'create:calibration': 'calibration_created',
  'update:calibration': 'calibration_updated',
  'approve:calibration': 'calibration_approved',
  // Checkout (purpose='calibration' or 'repair')
  'create:checkout': 'checkout_created',
  'approve:checkout': 'checkout_approved',
  'reject:checkout': 'checkout_rejected',
  // Non-conformance
  'create:non_conformance': 'non_conformance_created',
  'update:non_conformance': 'non_conformance_updated',
  'approve:non_conformance': 'non_conformance_resolved',
  // Calibration Plan
  'create:calibration_plan': 'calibration_plan_created',
  'approve:calibration_plan': 'calibration_plan_approved',
  'reject:calibration_plan': 'calibration_plan_rejected',
  // Rental (purpose='rental') — 런타임에 서비스에서 오버라이드
  // 'create:rental': 'rental_created',  // 참조용 주석
  // 'approve:rental': 'rental_approved',
};

/**
 * checkout purpose가 'rental'일 때 활동 타입 오버라이드 매핑
 *
 * checkout_created → rental_created 등으로 변환
 * 프론트엔드 RecentActivities의 탭 필터(대여/반출)가 정확히 동작하도록 보장
 */
export const RENTAL_ACTIVITY_TYPE_OVERRIDES: Record<string, string> = {
  checkout_created: 'rental_created',
  checkout_approved: 'rental_approved',
  checkout_rejected: 'rental_rejected', // 프론트엔드에 없지만 fallback 처리됨
};
