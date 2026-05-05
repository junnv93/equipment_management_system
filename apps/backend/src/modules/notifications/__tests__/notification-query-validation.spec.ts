import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { notificationQuerySchema } from '../dto/notification-query.dto';

describe('notificationQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('search', () => {
    it('max + 1 → reject + VM', () => {
      const r = notificationQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('whitespace → undefined', () => {
      const r = notificationQuerySchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
    it('surrounding whitespace → trimmed', () => {
      const r = notificationQuerySchema.safeParse({ search: '  알림  ' });
      if (r.success) expect(r.data.search).toBe('알림');
    });
  });

  describe('recipientSite — SHORT_TEXT', () => {
    it('SHORT_TEXT_MAX_LENGTH + 1 → reject', () => {
      const r = notificationQuerySchema.safeParse({
        recipientSite: 'a'.repeat(VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
    });
  });

  describe('sort — NotificationSortEnum', () => {
    it.each(['createdAt.asc', 'createdAt.desc', 'priority.asc', 'priority.desc'])(
      'accepts: %s',
      (sort) => {
        expect(notificationQuerySchema.safeParse({ sort }).success).toBe(true);
      }
    );
    it.each(['unknown.asc', 'createdAt.INVALID', 'sql; DROP'])('rejects: %s', (sort) => {
      expect(notificationQuerySchema.safeParse({ sort }).success).toBe(false);
    });
    it('default applied', () => {
      const r = notificationQuerySchema.safeParse({});
      if (r.success) expect(r.data.sort).toBe('createdAt.desc');
    });
  });
});
