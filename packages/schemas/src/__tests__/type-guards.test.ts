/// <reference types="jest" />

import { isUser } from '../user';
import { isTeam } from '../team';
import { UserRoleEnum } from '../enums';

describe('Type Guards', () => {
  describe('isUser', () => {
    it('should return true for valid user object', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'test_engineer' as const,
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(isUser(validUser)).toBe(true);
    });

    it('should return false for invalid user object', () => {
      const invalidUser = {
        id: 'invalid-uuid',
        email: 'invalid-email',
        name: '',
      };

      expect(isUser(invalidUser)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isUser(null)).toBe(false);
      expect(isUser(undefined)).toBe(false);
    });
  });

  describe('isTeam', () => {
    it('should return true for valid team object', () => {
      const validTeam = {
        id: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
        name: 'RF Team',
        classification: 'fcc_emc_rf' as const,
        site: 'suwon' as const,
        description: 'Radio Frequency Testing Team',
        equipmentCount: 10,
        memberCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(isTeam(validTeam)).toBe(true);
    });

    it('should return false for invalid team object', () => {
      const invalidTeam = {
        id: 'not-a-uuid', // 유효하지 않은 UUID
        name: '',
      };

      expect(isTeam(invalidTeam)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isTeam(null)).toBe(false);
      expect(isTeam(undefined)).toBe(false);
    });
  });
});
