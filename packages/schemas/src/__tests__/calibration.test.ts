/// <reference types="jest" />

import { isCalibration, CalibrationStatusEnum } from '../calibration';
import { ManagementMethodEnum } from '../enums';

describe('Calibration Type Guards and Schemas', () => {
  describe('isCalibration', () => {
    it('should return true for valid calibration object', () => {
      const validCalibration = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        equipmentId: '123e4567-e89b-12d3-a456-426614174001',
        calibrationManagerId: '123e4567-e89b-12d3-a456-426614174002',
        calibrationDate: new Date(),
        nextCalibrationDate: new Date(),
        managementMethod: ManagementMethodEnum.enum.external_calibration,
        status: CalibrationStatusEnum.enum.completed,
        calibrationAgency: 'Test Agency',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(isCalibration(validCalibration)).toBe(true);
    });

    it('should return false for invalid calibration object', () => {
      const invalidCalibration = {
        id: 'invalid-uuid',
        equipmentId: 'invalid-uuid',
        calibrationManagerId: 'invalid-uuid',
        calibrationDate: 'invalid-date',
        status: 'invalid-status',
      };

      expect(isCalibration(invalidCalibration)).toBe(false);
    });

    it('should return false for calibration with missing required fields', () => {
      const missingFieldsCalibration = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        equipmentId: '123e4567-e89b-12d3-a456-426614174001',
        // calibrationManagerId is missing
        calibrationDate: new Date(),
        nextCalibrationDate: new Date(),
        status: CalibrationStatusEnum.enum.scheduled,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(isCalibration(missingFieldsCalibration)).toBe(false);
    });

    it('should return false for calibration with invalid enum values', () => {
      const invalidEnumCalibration = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        equipmentId: '123e4567-e89b-12d3-a456-426614174001',
        calibrationManagerId: '123e4567-e89b-12d3-a456-426614174002',
        calibrationDate: new Date(),
        nextCalibrationDate: new Date(),
        managementMethod: 'invalid-method',
        status: 'invalid-status',
        calibrationAgency: 'Test Agency',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(isCalibration(invalidEnumCalibration)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isCalibration(null)).toBe(false);
      expect(isCalibration(undefined)).toBe(false);
    });
  });
});
