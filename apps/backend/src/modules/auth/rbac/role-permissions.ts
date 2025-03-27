import { UserRole } from './roles.enum';
import { Permission } from './permissions.enum';

export const ROLE_PERMISSIONS = {
  [UserRole.USER]: [
    Permission.VIEW_EQUIPMENT,
    Permission.VIEW_RENTALS,
    Permission.REQUEST_RENTAL,
    Permission.VIEW_CHECKOUTS,
    Permission.VIEW_CALIBRATIONS,
  ],
  [UserRole.MANAGER]: [
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
  [UserRole.ADMIN]: [
    // 모든 권한
    ...Object.values(Permission),
  ],
}; 