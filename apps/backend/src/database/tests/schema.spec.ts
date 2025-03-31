import { Test } from '@nestjs/testing';
import { equipment, EquipmentStatus } from '../schema/equipment';
import { teams, TeamType } from '../schema/teams';
import { users, UserRole } from '../schema/users';
import { loans, LoanStatus } from '../schema/loans';
import { checkouts, CheckoutStatus } from '../schema/checkouts';
import { calibrations, CalibrationMethod, CalibrationResult } from '../schema/calibrations';
import { history, HistoryEventType } from '../schema/history';
import {
  equipmentRelations,
  teamsRelations,
  usersRelations,
  loansRelations,
  checkoutsRelations,
  calibrationsRelations,
  historyRelations
} from '../schema/relations';

describe('Database Schema', () => {
  describe('Equipment Schema', () => {
    it('장비 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(equipment).toBeDefined();
      expect(equipment.name).toBeDefined();
      expect(EquipmentStatus).toBeDefined();
      expect(Object.keys(EquipmentStatus).length).toBeGreaterThan(0);
    });

    it('장비 관계가 설정되어 있어야 합니다', () => {
      expect(equipmentRelations).toBeDefined();
    });
  });

  describe('Team Schema', () => {
    it('팀 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(teams).toBeDefined();
      expect(teams.name).toBeDefined();
      expect(TeamType).toBeDefined();
      expect(Object.keys(TeamType).length).toBeGreaterThan(0);
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
      expect(UserRole).toBeDefined();
      expect(Object.keys(UserRole).length).toBeGreaterThan(0);
    });

    it('사용자 관계가 설정되어 있어야 합니다', () => {
      expect(usersRelations).toBeDefined();
    });
  });

  describe('Loan Schema', () => {
    it('대여 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(loans).toBeDefined();
      expect(loans.borrowerId).toBeDefined();
      expect(loans.equipmentId).toBeDefined();
      expect(LoanStatus).toBeDefined();
      expect(Object.keys(LoanStatus).length).toBeGreaterThan(0);
    });

    it('대여 관계가 설정되어 있어야 합니다', () => {
      expect(loansRelations).toBeDefined();
    });
  });

  describe('Checkout Schema', () => {
    it('반출 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(checkouts).toBeDefined();
      expect(checkouts.userId).toBeDefined();
      expect(checkouts.equipmentId).toBeDefined();
      expect(CheckoutStatus).toBeDefined();
      expect(Object.keys(CheckoutStatus).length).toBeGreaterThan(0);
    });

    it('반출 관계가 설정되어 있어야 합니다', () => {
      expect(checkoutsRelations).toBeDefined();
    });
  });

  describe('Calibration Schema', () => {
    it('교정 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(calibrations).toBeDefined();
      expect(calibrations.equipmentId).toBeDefined();
      expect(calibrations.calibrationDate).toBeDefined();
      expect(CalibrationMethod).toBeDefined();
      expect(CalibrationResult).toBeDefined();
      expect(Object.keys(CalibrationMethod).length).toBeGreaterThan(0);
      expect(Object.keys(CalibrationResult).length).toBeGreaterThan(0);
    });

    it('교정 관계가 설정되어 있어야 합니다', () => {
      expect(calibrationsRelations).toBeDefined();
    });
  });

  describe('History Schema', () => {
    it('이력 스키마가 올바르게 정의되어 있어야 합니다', () => {
      expect(history).toBeDefined();
      expect(history.equipmentId).toBeDefined();
      expect(history.eventType).toBeDefined();
      expect(HistoryEventType).toBeDefined();
      expect(Object.keys(HistoryEventType).length).toBeGreaterThan(0);
    });

    it('이력 관계가 설정되어 있어야 합니다', () => {
      expect(historyRelations).toBeDefined();
    });
  });
}); 