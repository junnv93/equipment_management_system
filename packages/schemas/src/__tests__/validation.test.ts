/// <reference types="jest" />

import { z } from 'zod';
import {
  validateApiResponse,
  validatePaginatedResponse,
  safeParseApiResponse,
  safeParsePaginatedResponse,
} from '../utils/validation';

describe('Validation Utils', () => {
  // 테스트용 스키마 정의
  const testSchema = z.object({
    id: z.number(),
    name: z.string(),
  });

  type TestType = z.infer<typeof testSchema>;

  describe('validateApiResponse', () => {
    it('should validate correct data', () => {
      const validData = { id: 1, name: 'test' };
      const result = validateApiResponse(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid data', () => {
      const invalidData = { id: 'wrong', name: 123 };
      expect(() => validateApiResponse(testSchema, invalidData)).toThrow();
    });
  });

  describe('validatePaginatedResponse', () => {
    it('should validate correct paginated data', () => {
      const validData = {
        items: [
          { id: 1, name: 'test1' },
          { id: 2, name: 'test2' },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      const result = validatePaginatedResponse(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid paginated data', () => {
      const invalidData = {
        items: [{ id: 'wrong' }],
        total: -1,
        page: 0,
        pageSize: -10,
        totalPages: -1,
      };

      expect(() => validatePaginatedResponse(testSchema, invalidData)).toThrow();
    });
  });

  describe('safeParseApiResponse', () => {
    it('should return parsed data for valid input', () => {
      const validData = { id: 1, name: 'test' };
      const result = safeParseApiResponse(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should return null for invalid input', () => {
      const invalidData = { id: 'wrong', name: 123 };
      const result = safeParseApiResponse(testSchema, invalidData);
      expect(result).toBeNull();
    });
  });

  describe('safeParsePaginatedResponse', () => {
    it('should return parsed data for valid paginated input', () => {
      const validData = {
        items: [
          { id: 1, name: 'test1' },
          { id: 2, name: 'test2' },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      const result = safeParsePaginatedResponse(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should return null for invalid paginated input', () => {
      const invalidData = {
        items: [{ id: 'wrong' }],
        total: -1,
        page: 0,
        pageSize: -10,
        totalPages: -1,
      };

      const result = safeParsePaginatedResponse(testSchema, invalidData);
      expect(result).toBeNull();
    });
  });
}); 