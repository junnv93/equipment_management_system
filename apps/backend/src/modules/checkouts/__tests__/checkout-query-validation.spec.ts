import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { checkoutQuerySchema } from '../dto/checkout-query.dto';

describe('checkoutQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('search & destination — optionalTrimmedString(EXTENDED_TEXT)', () => {
    it.each(['search', 'destination'] as const)('%s: max → accept', (field) => {
      const r = checkoutQuerySchema.safeParse({
        [field]: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
      });
      expect(r.success).toBe(true);
    });
    it.each(['search', 'destination'] as const)('%s: max + 1 → reject', (field) => {
      const r = checkoutQuerySchema.safeParse({
        [field]: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
    });
    it('search: VM message check', () => {
      const r = checkoutQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      if (!r.success) {
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
      }
    });
    it('search: whitespace → undefined', () => {
      const r = checkoutQuerySchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
  });

  describe('checkoutFrom/checkoutTo/returnFrom/returnTo — SHORT_TEXT', () => {
    it.each(['checkoutFrom', 'checkoutTo', 'returnFrom', 'returnTo'] as const)(
      '%s: SHORT_TEXT_MAX_LENGTH + 1 → reject',
      (field) => {
        const r = checkoutQuerySchema.safeParse({
          [field]: 'a'.repeat(VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH + 1),
        });
        expect(r.success).toBe(false);
      }
    );
  });

  describe('statuses — optionalCsvEnum (CHECKOUT_STATUS_VALUES 토큰 단위 검증)', () => {
    it('valid CSV → array transform', () => {
      const r = checkoutQuerySchema.safeParse({ statuses: 'pending,approved,checked_out' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.statuses).toEqual(['pending', 'approved', 'checked_out']);
    });
    it('LONG_CSV_MAX_LENGTH + 1 → reject (DoS 차단)', () => {
      const statuses = 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH + 1);
      expect(checkoutQuerySchema.safeParse({ statuses }).success).toBe(false);
    });
    it('invalid token → reject (silent miss 차단)', () => {
      const r = checkoutQuerySchema.safeParse({ statuses: 'pending,unknown_status' });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0].message).toContain('unknown_status');
      }
    });
    it('whitespace tokens → trimmed', () => {
      const r = checkoutQuerySchema.safeParse({ statuses: ' pending , approved ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.statuses).toEqual(['pending', 'approved']);
    });
    it('empty string → undefined', () => {
      const r = checkoutQuerySchema.safeParse({ statuses: '' });
      if (r.success) expect(r.data.statuses).toBeUndefined();
    });
  });

  describe('sort — CheckoutSortEnum', () => {
    it.each([
      'createdAt.asc',
      'createdAt.desc',
      'checkoutDate.desc',
      'status.asc',
      'requesterId.asc',
      'approverId.desc',
      'expectedReturnDate.desc',
    ])('accepts: %s', (sort) => {
      expect(checkoutQuerySchema.safeParse({ sort }).success).toBe(true);
    });
    it.each(['unknown.asc', 'createdAt.INVALID', "createdAt'; DROP", 'createdAt.ASC'])(
      'rejects: %s',
      (sort) => {
        expect(checkoutQuerySchema.safeParse({ sort }).success).toBe(false);
      }
    );
  });
});
