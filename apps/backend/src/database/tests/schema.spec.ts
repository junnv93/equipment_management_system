import { equipment, equipmentStatusEnum } from '@equipment-management/db/schema/equipment';
import { teams, teamTypes } from '@equipment-management/db/schema/teams';
import { users, userRoles } from '@equipment-management/db/schema/users';
import { checkouts, checkoutStatus } from '@equipment-management/db/schema/checkouts';
import { calibrations, calibrationStatus } from '@equipment-management/db/schema/calibrations';
import { equipmentRelations } from '@equipment-management/db/schema/equipment';
import { teamsRelations } from '@equipment-management/db/schema/teams';
import { usersRelations } from '@equipment-management/db/schema/users';
// Note: checkouts, calibrations relations may not be exported yet
// These will be added as needed

describe('Database Schema', () => {
  describe('Equipment Schema', () => {
    it('장비 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(equipment).toBeDefined();
      expect(equipment.name).toBeDefined();
      expect(equipmentStatusEnum).toBeDefined();
      expect(equipmentStatusEnum.enumValues.length).toBeGreaterThan(0);
    });

    it('장비 관계가 설정되어 있어야 합니다', () => {
      expect(equipmentRelations).toBeDefined();
    });
  });

  describe('Team Schema', () => {
    it('팀 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(teams).toBeDefined();
      expect(teams.name).toBeDefined();
      expect(teamTypes).toBeDefined();
      expect(teamTypes.length).toBeGreaterThan(0);
    });

    it('팀 관계가 설정되어 있어야 합니다', () => {
      expect(teamsRelations).toBeDefined();
    });
  });

  describe('User Schema', () => {
    it('사용자 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(users).toBeDefined();
      expect(users.name).toBeDefined();
      expect(users.email).toBeDefined();
      expect(userRoles).toBeDefined();
      expect(userRoles.length).toBeGreaterThan(0);
    });

    it('사용자 관계가 설정되어 있어야 합니다', () => {
      expect(usersRelations).toBeDefined();
    });
  });

  describe('Checkout Schema', () => {
    it('반출 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(checkouts).toBeDefined();
      expect(checkouts.requesterId).toBeDefined();
      expect(checkoutStatus).toBeDefined();
      expect(checkoutStatus.length).toBeGreaterThan(0);
    });

    // Note: checkoutsRelations will be added when relations are defined
    // it('반출 관계가 설정되어 있어야 합니다', () => {
    //   expect(checkoutsRelations).toBeDefined();
    // });
  });

  describe('Calibration Schema', () => {
    it('교정 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(calibrations).toBeDefined();
      expect(calibrations.equipmentId).toBeDefined();
      expect(calibrations.calibrationDate).toBeDefined();
      expect(calibrationStatus).toBeDefined();
      expect(calibrationStatus.length).toBeGreaterThan(0);
    });

    // Note: calibrationsRelations will be added when relations are defined
    // it('교정 관계가 설정되어 있어야 합니다', () => {
    //   expect(calibrationsRelations).toBeDefined();
    // });
  });

  // Note: History schema will be added when implemented
  // describe('History Schema', () => {
  //   it('이력 스키마가 올바르게 정의되어 있어야 합니다', () => {
  //     expect(history).toBeDefined();
  //     expect(history.equipmentId).toBeDefined();
  //     expect(history.eventType).toBeDefined();
  //     expect(HistoryEventType).toBeDefined();
  //     expect(Object.keys(HistoryEventType).length).toBeGreaterThan(0);
  //   });
  //
  //   it('이력 관계가 설정되어 있어야 합니다', () => {
  //     expect(historyRelations).toBeDefined();
  //   });
  // });
});
