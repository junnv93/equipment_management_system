import { z } from 'zod';
import { optionalCsvEnum, optionalCsvUuid } from '../utils/fields';

describe('optionalCsvEnum<T> — CSV 다중값 enum SSOT helper', () => {
  const STATUSES = ['pending', 'approved', 'rejected'] as const;
  const schema = z.object({
    statuses: optionalCsvEnum(STATUSES, 200, '상태 목록'),
  });

  it('valid CSV → enum[] transform (split + trim)', () => {
    const r = schema.safeParse({ statuses: 'pending,approved' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.statuses).toEqual(['pending', 'approved']);
  });

  it('단일 token → enum[] (length 1) transform', () => {
    const r = schema.safeParse({ statuses: 'rejected' });
    if (r.success) expect(r.data.statuses).toEqual(['rejected']);
  });

  it('surrounding whitespace 토큰 → trim 후 정상', () => {
    const r = schema.safeParse({ statuses: ' pending , approved ' });
    if (r.success) expect(r.data.statuses).toEqual(['pending', 'approved']);
  });

  it('연속 콤마 → empty token filter (undefined 아님)', () => {
    const r = schema.safeParse({ statuses: 'pending,,approved' });
    if (r.success) expect(r.data.statuses).toEqual(['pending', 'approved']);
  });

  it('invalid token → 422 reject + 메시지에 invalid token + fieldName 포함', () => {
    const r = schema.safeParse({ statuses: 'pending,unknown_status' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain('상태 목록');
      expect(r.error.issues[0].message).toContain('unknown_status');
    }
  });

  it('전체 invalid → reject + 모든 invalid 토큰 메시지에 포함', () => {
    const r = schema.safeParse({ statuses: 'foo,bar' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain('foo');
      expect(r.error.issues[0].message).toContain('bar');
    }
  });

  it('빈 문자열 → undefined', () => {
    const r = schema.safeParse({ statuses: '' });
    if (r.success) expect(r.data.statuses).toBeUndefined();
  });

  it('whitespace only → undefined', () => {
    const r = schema.safeParse({ statuses: '   ' });
    if (r.success) expect(r.data.statuses).toBeUndefined();
  });

  it('undefined → undefined', () => {
    const r = schema.safeParse({});
    if (r.success) expect(r.data.statuses).toBeUndefined();
  });

  it('maxLen + 1 → DoS 차단 (max length reject)', () => {
    const r = schema.safeParse({ statuses: 'a'.repeat(201) });
    expect(r.success).toBe(false);
  });
});

describe('optionalCsvUuid — CSV 다중값 UUID SSOT helper', () => {
  const schema = z.object({ ids: optionalCsvUuid(1000, '팀 ID 목록') });
  const VALID_UUID_1 = '11111111-1111-4111-8111-111111111111';
  const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';
  const SEED_UUID = '00000000-0000-0000-0000-000000000002'; // 시드 UUID — RFC 9562 거부지만 lenient 허용

  it('valid UUID CSV → string[] transform', () => {
    const r = schema.safeParse({ ids: `${VALID_UUID_1},${VALID_UUID_2}` });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.ids).toEqual([VALID_UUID_1, VALID_UUID_2]);
  });

  it('seed UUID (RFC 9562 비호환 nibble) → lenient 허용', () => {
    const r = schema.safeParse({ ids: SEED_UUID });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.ids).toEqual([SEED_UUID]);
  });

  it('단일 토큰 → length 1 array', () => {
    const r = schema.safeParse({ ids: VALID_UUID_1 });
    if (r.success) expect(r.data.ids).toEqual([VALID_UUID_1]);
  });

  it('invalid UUID token → 422 reject + invalid token + fieldName 포함', () => {
    const r = schema.safeParse({ ids: `${VALID_UUID_1},not-a-uuid` });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain('팀 ID 목록');
      expect(r.error.issues[0].message).toContain('not-a-uuid');
    }
  });

  it('UUID 형식이지만 길이 부족 → reject', () => {
    const r = schema.safeParse({ ids: '11111111-1111-4111-8111-1111' });
    expect(r.success).toBe(false);
  });

  it('maxLen + 1 → DoS 차단', () => {
    const r = schema.safeParse({ ids: 'a'.repeat(1001) });
    expect(r.success).toBe(false);
  });

  it('whitespace only → undefined', () => {
    const r = schema.safeParse({ ids: '   ' });
    if (r.success) expect(r.data.ids).toBeUndefined();
  });

  it('연속 콤마 → empty token filter', () => {
    const r = schema.safeParse({ ids: `${VALID_UUID_1},,${VALID_UUID_2}` });
    if (r.success) expect(r.data.ids).toEqual([VALID_UUID_1, VALID_UUID_2]);
  });
});
