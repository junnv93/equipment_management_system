/// <reference types="jest" />

export {};

// E2E 테스트 환경 변수 설정 (단일 DB 사용: 개발 DB = 테스트 DB)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-e2e-testing';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

// Jest 전역 타입들을 명시적으로 설정합니다
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(a: number, b: number): R;
    }
  }
}

// 사용자 정의 Matcher 예시 (필요 시 확장)
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
