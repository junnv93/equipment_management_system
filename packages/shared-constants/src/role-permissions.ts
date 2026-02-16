/**
 * 역할별 권한 매핑
 *
 * ⚠️ SSOT: 이 파일이 역할-권한 매핑의 단일 소스
 * 백엔드/프론트엔드 모두 이 파일에서 import
 *
 * UL-QP-18 기준 + 3단계 교정계획서 승인:
 * - 시험실무자: 장비 조회, 장비 등록/수정/삭제 요청, 반출 신청, 교정 등록 요청
 * - 기술책임자: 장비 승인, 반출 승인, 교정 승인, 팀 관리, 교정계획서 작성/검토요청
 * - 품질책임자: 교정계획서 검토 (신규)
 * - 시험소장: 모든 권한 (해당 시험소 내, 단 교정 등록 제외), 교정계획서 최종 승인
 *
 * ⚠️ 교정 등록 특수 정책: 시험실무자만 교정 기록 등록 가능 (등록/승인 완전 분리)
 *
 * 참고: 대여(Rentals)는 제거되었으며, 반출(Checkouts)이 교정/수리/시험소간 대여 모두 포함
 */

import type { UserRole } from '@equipment-management/schemas';
import { Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // 시험실무자: 기본 조회 및 장비/반출 요청 권한
  test_engineer: [
    // 장비 관리
    Permission.VIEW_EQUIPMENT,
    Permission.CREATE_EQUIPMENT, // 장비 등록 요청 (승인 대기 상태로 등록)
    Permission.UPDATE_EQUIPMENT, // 장비 수정 요청 (승인 대기 상태로 등록)
    Permission.DELETE_EQUIPMENT, // 장비 삭제 요청 (승인 대기 상태로 등록)
    // 반출 관리 (교정/수리/시험소간 대여 포함)
    Permission.VIEW_CHECKOUTS,
    Permission.CREATE_CHECKOUT, // 반출 신청
    // 교정 관리
    Permission.VIEW_CALIBRATIONS,
    Permission.CREATE_CALIBRATION, // 교정 등록 (승인 대기 상태로 등록)
    // 팀 조회
    Permission.VIEW_TEAMS, // 팀 목록 조회 (장비 필터에 필요)
    // 알림 기본 권한
    Permission.VIEW_NOTIFICATIONS,
    Permission.UPDATE_NOTIFICATION,
    // 부적합 관리
    Permission.VIEW_NON_CONFORMANCES,
    Permission.CREATE_NON_CONFORMANCE, // 부적합 등록
    Permission.UPDATE_NON_CONFORMANCE, // 부적합 수정 (원인 분석, 조치)
    // 보정계수
    Permission.VIEW_CALIBRATION_FACTORS,
    Permission.CREATE_CALIBRATION_FACTOR,
    // 소프트웨어
    Permission.VIEW_SOFTWARE,
    Permission.CREATE_SOFTWARE_CHANGE,
    // 폐기
    Permission.REQUEST_DISPOSAL,
    // 장비 반입 (렌탈 + 내부 공용)
    Permission.VIEW_EQUIPMENT_IMPORTS,
    Permission.CREATE_EQUIPMENT_IMPORT,
  ],

  // 기술책임자: 장비 관리 및 승인 권한, 교정계획서 작성/검토요청
  technical_manager: [
    // 장비 관리
    Permission.VIEW_EQUIPMENT,
    Permission.CREATE_EQUIPMENT,
    Permission.UPDATE_EQUIPMENT,
    Permission.DELETE_EQUIPMENT,
    Permission.VIEW_EQUIPMENT_REQUESTS, // 장비 요청 조회
    Permission.APPROVE_EQUIPMENT, // 장비 요청 승인
    Permission.REJECT_EQUIPMENT, // 장비 요청 반려
    // 반출 관리 (모든 목적 1단계 승인)
    Permission.VIEW_CHECKOUTS,
    Permission.CREATE_CHECKOUT,
    Permission.UPDATE_CHECKOUT, // 반출 수정
    Permission.DELETE_CHECKOUT, // 반출 삭제
    Permission.APPROVE_CHECKOUT, // 반출 승인
    Permission.REJECT_CHECKOUT, // 반출 반려
    Permission.START_CHECKOUT, // 반출 시작
    Permission.COMPLETE_CHECKOUT, // 반입 처리
    Permission.CANCEL_CHECKOUT, // 반출 취소
    // 교정 관리
    Permission.VIEW_CALIBRATIONS,
    // CREATE_CALIBRATION 제거: UL-QP-18에 따라 시험실무자만 교정 등록 가능
    Permission.UPDATE_CALIBRATION,
    Permission.APPROVE_CALIBRATION, // 교정 승인 권한
    Permission.VIEW_CALIBRATION_REQUESTS, // 교정 승인 대기 목록 조회
    // 사용자/팀 관리
    Permission.VIEW_USERS,
    Permission.MANAGE_ROLES, // 자기 팀 내 역할 변경 (범위 제한은 서비스 레이어에서 시행)
    Permission.VIEW_TEAMS, // 팀 목록 조회
    // 알림
    Permission.VIEW_NOTIFICATIONS,
    Permission.CREATE_NOTIFICATION,
    Permission.UPDATE_NOTIFICATION,
    Permission.DELETE_NOTIFICATION,
    // 부적합 관리
    Permission.VIEW_NON_CONFORMANCES,
    Permission.CREATE_NON_CONFORMANCE,
    Permission.UPDATE_NON_CONFORMANCE,
    Permission.CLOSE_NON_CONFORMANCE, // 부적합 종료
    // 보정계수
    Permission.VIEW_CALIBRATION_FACTORS,
    Permission.CREATE_CALIBRATION_FACTOR,
    Permission.APPROVE_CALIBRATION_FACTOR,
    Permission.VIEW_CALIBRATION_FACTOR_REQUESTS,
    // 소프트웨어
    Permission.VIEW_SOFTWARE,
    Permission.CREATE_SOFTWARE_CHANGE,
    Permission.APPROVE_SOFTWARE_CHANGE,
    Permission.VIEW_SOFTWARE_REQUESTS,
    // 교정계획서 (작성, 검토요청)
    Permission.VIEW_CALIBRATION_PLANS,
    Permission.CREATE_CALIBRATION_PLAN,
    Permission.UPDATE_CALIBRATION_PLAN,
    Permission.DELETE_CALIBRATION_PLAN,
    Permission.SUBMIT_CALIBRATION_PLAN, // 검토 요청
    Permission.CONFIRM_CALIBRATION_PLAN_ITEM,
    // 통계
    Permission.VIEW_STATISTICS,
    Permission.EXPORT_REPORTS,
    // 폐기
    Permission.REQUEST_DISPOSAL,
    Permission.REVIEW_DISPOSAL, // 검토 권한 (같은 팀)
    Permission.VIEW_DISPOSAL_REQUESTS,
    // 장비 반입 (렌탈 + 내부 공용)
    Permission.VIEW_EQUIPMENT_IMPORTS,
    Permission.CREATE_EQUIPMENT_IMPORT,
    Permission.APPROVE_EQUIPMENT_IMPORT,
    Permission.COMPLETE_EQUIPMENT_IMPORT,
    Permission.CANCEL_EQUIPMENT_IMPORT,
    // 감사 로그 (소속 팀 스코프)
    Permission.VIEW_AUDIT_LOGS,
  ],

  // 품질책임자: 교정계획서 검토 권한 (신규)
  quality_manager: [
    // 장비 조회 (읽기 전용)
    Permission.VIEW_EQUIPMENT,
    // 교정 조회
    Permission.VIEW_CALIBRATIONS,
    // 팀 조회
    Permission.VIEW_TEAMS,
    // 알림
    Permission.VIEW_NOTIFICATIONS,
    Permission.UPDATE_NOTIFICATION,
    // 부적합 조회
    Permission.VIEW_NON_CONFORMANCES,
    // 보정계수 조회
    Permission.VIEW_CALIBRATION_FACTORS,
    // 소프트웨어 조회
    Permission.VIEW_SOFTWARE,
    // 교정계획서 (검토 권한)
    Permission.VIEW_CALIBRATION_PLANS,
    Permission.REVIEW_CALIBRATION_PLAN, // 검토 완료
    Permission.REJECT_CALIBRATION_PLAN, // 반려
    // 통계
    Permission.VIEW_STATISTICS,
    Permission.EXPORT_REPORTS,
    // 감사 로그 (전체 스코프)
    Permission.VIEW_AUDIT_LOGS,
  ],

  // 시험소장: 모든 권한 (단, 교정 기록 등록, 시스템 설정 관리 제외)
  // 교정 기록은 시험실무자만 등록 가능 (UL-QP-18 등록/승인 완전 분리 정책)
  lab_manager: Object.values(Permission).filter(
    (p) => p !== Permission.CREATE_CALIBRATION && p !== Permission.MANAGE_SYSTEM_SETTINGS
  ),

  // 시스템 관리자: lab_manager의 모든 권한 + 시스템 설정 관리
  // UL-QP-18 직무분리: 교정 등록(CREATE_CALIBRATION) 제외
  system_admin: Object.values(Permission).filter((p) => p !== Permission.CREATE_CALIBRATION),
};

/**
 * 특정 역할이 특정 권한을 가지고 있는지 확인
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * 특정 역할의 모든 권한 목록 반환
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
