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
// Enum Imports (SSOT: enums.ts)
// ============================================================================

import type { AuditAction, AuditEntityType } from './enums';
export type { AuditAction, AuditEntityType };

// ============================================================================
// 감사 로그 액션
// ============================================================================

/**
 * 액션 한글 라벨 매핑
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
};

/**
 * 액션별 색상 클래스 (Tailwind CSS)
 * - UI 특화 상수이므로 여기 정의 (프론트엔드 전용)
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
};

// ============================================================================
// 감사 로그 엔티티 타입
// ============================================================================

/**
 * 엔티티 타입 한글 라벨 매핑
 */
export const AUDIT_ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  equipment: '장비',
  calibration: '교정',
  checkout: '반출',
  rental: '대여',
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
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  details: AuditLogDetails | null;
  ipAddress: string | null;
  createdAt: string | Date;
}

/**
 * 감사 로그 생성 DTO (Backend)
 */
export interface CreateAuditLogDto {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: AuditLogDetails;
  ipAddress?: string;
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
 * 엔티티별 감사 로그 응답
 */
export interface EntityAuditLogsResponse {
  items: AuditLog[];
  formattedLogs: string[];
}
