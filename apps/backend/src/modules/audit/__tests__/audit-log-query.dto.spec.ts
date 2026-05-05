import { MAX_PAGE_SIZE, VALIDATION_RULES } from '@equipment-management/shared-constants';
import { auditLogQuerySchema } from '../dto/audit-log-query.dto';

describe('auditLogQuerySchema', () => {
  it('limit 최대값은 MAX_PAGE_SIZE를 사용한다', () => {
    const boundary = auditLogQuerySchema.safeParse({ limit: String(MAX_PAGE_SIZE) });
    expect(boundary.success).toBe(true);

    const overflow = auditLogQuerySchema.safeParse({ limit: String(MAX_PAGE_SIZE + 1) });
    expect(overflow.success).toBe(false);
  });

  describe('startDate / endDate — optionalIsoDateString SSOT (verify-zod Step 20)', () => {
    it.each(['2026-05-05', '2026-05-05T10:30:00Z', '2026-05-05T10:30:00.000Z'])(
      'accepts ISO format: %s',
      (val) => {
        expect(auditLogQuerySchema.safeParse({ startDate: val }).success).toBe(true);
      }
    );
    it.each(['2026/05/05', 'not-a-date', '20260505', '2026-13-01'])(
      'rejects invalid format: %s',
      (val) => {
        expect(auditLogQuerySchema.safeParse({ startDate: val }).success).toBe(false);
      }
    );
    it('whitespace only → undefined', () => {
      const r = auditLogQuerySchema.safeParse({ startDate: '   ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.startDate).toBeUndefined();
    });
    it('max + 1 → reject (DoS 차단)', () => {
      const r = auditLogQuerySchema.safeParse({ startDate: 'a'.repeat(31) });
      expect(r.success).toBe(false);
    });
  });

  describe('cursor — optionalCursor SSOT', () => {
    it('max 정확히 → accept', () => {
      const cursor = 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH);
      expect(auditLogQuerySchema.safeParse({ cursor }).success).toBe(true);
    });
    it('max + 1 → reject', () => {
      const cursor = 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1);
      expect(auditLogQuerySchema.safeParse({ cursor }).success).toBe(false);
    });
    it('whitespace only → undefined', () => {
      const r = auditLogQuerySchema.safeParse({ cursor: '   ' });
      if (r.success) expect(r.data.cursor).toBeUndefined();
    });
  });
});
