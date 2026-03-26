import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 감사 로그 액션 열거형
 *
 * 표준 액션값 (소문자 + 언더스코어):
 * - create: 생성
 * - update: 수정
 * - delete: 삭제
 * - approve: 승인
 * - reject: 반려
 * - checkout: 반출
 * - return: 반입/반납
 * - cancel: 취소
 * - login: 로그인
 * - logout: 로그아웃
 *
 * @see docs/development/API_STANDARDS.md
 */
export const AUDIT_ACTION_VALUES = [
  'create', // 생성
  'update', // 수정
  'delete', // 삭제
  'approve', // 승인
  'reject', // 반려
  'checkout', // 반출
  'return', // 반입/반납
  'cancel', // 취소
  'login', // 로그인
  'logout', // 로그아웃
  'close', // 종료 (부적합 종결)
  'reject_correction', // 조치 반려
  'export', // 내보내기 (보고서 파일 다운로드)
  'upload', // 파일 업로드
  'download', // 파일 다운로드
  'revision', // 문서 개정
] as const;

export const AuditActionEnum = z.enum(AUDIT_ACTION_VALUES);
export type AuditAction = z.infer<typeof AuditActionEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 감사 로그 엔티티 타입 열거형
 *
 * 표준 엔티티 타입값 (소문자 + 언더스코어):
 * - equipment: 장비
 * - calibration: 교정
 * - checkout: 반출
 * - rental: 대여
 * - user: 사용자
 * - team: 팀
 * - calibration_factor: 보정계수
 * - non_conformance: 부적합
 * - software: 소프트웨어
 * - calibration_plan: 교정계획서
 * - repair_history: 수리이력
 *
 * @see docs/development/API_STANDARDS.md
 */
export const AUDIT_ENTITY_TYPE_VALUES = [
  'equipment', // 장비
  'calibration', // 교정
  'checkout', // 반출
  'rental', // 대여
  'rental_import', // 대여 반입 (legacy — equipment_import로 대체됨)
  'user', // 사용자
  'team', // 팀
  'calibration_factor', // 보정계수
  'non_conformance', // 부적합
  'software', // 소프트웨어
  'calibration_plan', // 교정계획서
  'repair_history', // 수리이력
  'equipment_import', // 장비 반입
  'location_history', // 위치 이력
  'maintenance_history', // 유지보수 이력
  'incident_history', // 사고 이력
  'settings', // 설정
  'notification', // 알림
  'report', // 보고서
  'document', // 문서
] as const;

export const AuditEntityTypeEnum = z.enum(AUDIT_ENTITY_TYPE_VALUES);
export type AuditEntityType = z.infer<typeof AuditEntityTypeEnum>;
