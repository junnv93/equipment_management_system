import { Test, TestingModule } from '@nestjs/testing';
import { IdentifierService } from './identifier.service';

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
