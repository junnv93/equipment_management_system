// node:crypto를 jest.fn() 래퍼로 교체 — non-configurable 프로퍼티 우회.
// jest.mock은 자동 호이스트되어 import보다 먼저 실행된다.
jest.mock('node:crypto', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual<typeof import('node:crypto')>('node:crypto');
  return {
    ...actual,
    // jest.fn()으로 래핑 → mockImplementationOnce로 per-test 제어 가능
    randomUUID: jest.fn(() => actual.randomUUID()),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
// no-restricted-imports 예외: node:crypto SSOT 스펙 파일 — mock 접근 목적.
// eslint-disable-next-line no-restricted-imports
import * as nodeCrypto from 'node:crypto';
import {
  IdentifierService,
  generateAttachmentId,
  generateJti,
  generateMigrationBatchId,
  generateOpaqueId,
} from './identifier.service';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('IdentifierService', () => {
  let service: IdentifierService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [IdentifierService],
    }).compile();
    service = moduleRef.get<IdentifierService>(IdentifierService);
  });

  describe('generateAttachmentId', () => {
    it('returns a 36-character RFC 4122 v4 UUID', () => {
      const id = service.generateAttachmentId();
      expect(id).toHaveLength(36);
      expect(UUID_V4_REGEX.test(id)).toBe(true);
    });

    it('produces no duplicates over 1000 calls (CSPRNG sanity)', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(service.generateAttachmentId());
      }
      expect(ids.size).toBe(1000);
    });
  });

  describe('generateMigrationBatchId', () => {
    it('returns a v4 UUID with the same shape as attachment ids', () => {
      const id = service.generateMigrationBatchId();
      expect(UUID_V4_REGEX.test(id)).toBe(true);
    });
  });

  describe('generateJti', () => {
    it('returns a v4 UUID for JWT jti claim', () => {
      const jti = service.generateJti();
      expect(UUID_V4_REGEX.test(jti)).toBe(true);
    });
  });

  describe('generateOpaqueId', () => {
    it('returns a raw v4 UUID when no prefix is provided', () => {
      const id = service.generateOpaqueId();
      expect(UUID_V4_REGEX.test(id)).toBe(true);
    });

    it('returns prefix + dash + UUID when prefix is provided', () => {
      const id = service.generateOpaqueId('mig');
      expect(id.startsWith('mig-')).toBe(true);
      expect(UUID_V4_REGEX.test(id.slice('mig-'.length))).toBe(true);
    });

    it('treats empty string as no prefix (raw UUID)', () => {
      const id = service.generateOpaqueId('');
      expect(UUID_V4_REGEX.test(id)).toBe(true);
    });
  });
});

describe('Identifier module functions (plain class / util 진입점)', () => {
  it('generateAttachmentId returns v4 UUID', () => {
    expect(UUID_V4_REGEX.test(generateAttachmentId())).toBe(true);
  });

  it('generateMigrationBatchId returns v4 UUID', () => {
    expect(UUID_V4_REGEX.test(generateMigrationBatchId())).toBe(true);
  });

  it('generateJti returns v4 UUID', () => {
    expect(UUID_V4_REGEX.test(generateJti())).toBe(true);
  });

  it('generateOpaqueId honours prefix without DI', () => {
    const id = generateOpaqueId('jti');
    expect(id.startsWith('jti-')).toBe(true);
  });

  it('class methods and module functions return interchangeable IDs (SSOT 동등)', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [IdentifierService],
    }).compile();
    const svc = moduleRef.get(IdentifierService);
    // 동일 형식 보장 — 호출 경로 차이가 식별자 형식에 영향 주지 않음
    expect(UUID_V4_REGEX.test(svc.generateJti())).toBe(true);
    expect(UUID_V4_REGEX.test(generateJti())).toBe(true);
  });
});

describe('Identifier error propagation (negative test — CSPRNG 장애 시 서비스 중단)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('generateAttachmentId propagates crypto failure', () => {
    (nodeCrypto.randomUUID as jest.Mock).mockImplementationOnce(() => {
      throw new Error('crypto failure');
    });
    expect(() => generateAttachmentId()).toThrow('crypto failure');
  });
});
