/// <reference types="jest" />

import { isEquipment } from '../equipment';
import { ManagementMethodEnum, EquipmentStatusEnum } from '../enums';

describe('Equipment Type Guards and Schemas', () => {
  describe('isEquipment', () => {
    it('should return true for valid equipment object', () => {
      const validEquipment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Equipment',
        managementNumber: 'SUW-E0001',
        status: EquipmentStatusEnum.enum.available,
        managementMethod: ManagementMethodEnum.enum.external_calibration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      expect(isEquipment(validEquipment)).toBe(true);
    });

    it('should return false for invalid equipment object', () => {
      const invalidEquipment = {
        id: 'invalid-uuid',
        name: '',
        managementNumber: '',
        status: 'invalid-status',
      };

      expect(isEquipment(invalidEquipment)).toBe(false);
    });

    it('should return false for equipment with invalid dates', () => {
      const invalidDatesEquipment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Equipment',
        managementNumber: 'SUW-E0001',
        status: EquipmentStatusEnum.enum.available,
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date',
        deletedAt: 'invalid-date',
      };

      expect(isEquipment(invalidDatesEquipment)).toBe(false);
    });

    it('should return false for equipment with missing required fields', () => {
      const missingFieldsEquipment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Equipment',
        // managementNumber is missing
        status: EquipmentStatusEnum.enum.available,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isEquipment(missingFieldsEquipment)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isEquipment(null)).toBe(false);
      expect(isEquipment(undefined)).toBe(false);
    });
  });
});
