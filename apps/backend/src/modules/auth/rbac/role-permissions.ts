import { UserRole } from './roles.enum';
import { Permission } from './permissions.enum';

export const ROLE_PERMISSIONS = {
  // 시험실무자: 기본 조회 및 대여 신청 권한
  [UserRole.TEST_OPERATOR]: [
    Permission.VIEW_EQUIPMENT,
    Permission.VIEW_RENTALS,
    Permission.REQUEST_RENTAL,
    Permission.VIEW_CHECKOUTS,
    Permission.VIEW_CALIBRATIONS,
  ],
  // 기술책임자: 장비 관리 및 승인 권한
  [UserRole.TECHNICAL_MANAGER]: [
    Permission.VIEW_EQUIPMENT,
    Permission.CREATE_EQUIPMENT,
    Permission.UPDATE_EQUIPMENT,
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
    Permission.VIEW_USERS,
  ],
  // 시험소별 관리자: 모든 권한 (해당 시험소 내)
  [UserRole.SITE_ADMIN]: [
    // 모든 권한
    ...Object.values(Permission),
  ],
};
