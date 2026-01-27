import { UserRole } from './roles.enum';
import { Permission } from './permissions.enum';

/**
 * 역할별 권한 매핑
 * Record 타입을 사용하여 모든 UserRole에 대한 권한을 명시적으로 정의
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // 시험실무자: 기본 조회 및 대여/장비 등록 요청 권한
  [UserRole.TEST_ENGINEER]: [
    Permission.VIEW_EQUIPMENT,
    Permission.CREATE_EQUIPMENT, // 장비 등록 요청 (승인 대기 상태로 등록)
    Permission.UPDATE_EQUIPMENT, // 장비 수정 요청 (승인 대기 상태로 등록)
    Permission.DELETE_EQUIPMENT, // 장비 삭제 요청 (승인 대기 상태로 등록)
    Permission.VIEW_RENTALS,
    Permission.REQUEST_RENTAL,
    Permission.VIEW_CHECKOUTS,
    Permission.VIEW_CALIBRATIONS,
    Permission.CREATE_CALIBRATION, // 교정 등록 (승인 대기 상태로 등록)
    Permission.VIEW_TEAMS, // 팀 목록 조회 (장비 필터에 필요)
  ],
  // 기술책임자: 장비 관리 및 승인 권한
  [UserRole.TECHNICAL_MANAGER]: [
    Permission.VIEW_EQUIPMENT,
    Permission.CREATE_EQUIPMENT,
    Permission.UPDATE_EQUIPMENT,
    Permission.DELETE_EQUIPMENT, // 장비 삭제 권한
    Permission.VIEW_EQUIPMENT_REQUESTS, // 장비 요청 조회
    Permission.APPROVE_EQUIPMENT, // 장비 요청 승인
    Permission.REJECT_EQUIPMENT, // 장비 요청 반려
    Permission.VIEW_RENTALS,
    Permission.REQUEST_RENTAL,
    Permission.APPROVE_RENTAL,
    Permission.REJECT_RENTAL,
    Permission.VIEW_CHECKOUTS,
    Permission.CREATE_CHECKOUT,
    Permission.APPROVE_CHECKOUT,
    Permission.VIEW_CALIBRATIONS,
    Permission.CREATE_CALIBRATION,
    Permission.UPDATE_CALIBRATION,
    Permission.APPROVE_CALIBRATION, // 교정 승인 권한
    Permission.VIEW_CALIBRATION_REQUESTS, // 교정 승인 대기 목록 조회
    Permission.VIEW_USERS,
    Permission.VIEW_TEAMS, // 팀 목록 조회
  ],
  // 시험소별 관리자: 모든 권한 (해당 시험소 내)
  [UserRole.LAB_MANAGER]: [
    // 모든 권한
    ...Object.values(Permission),
  ],
};
