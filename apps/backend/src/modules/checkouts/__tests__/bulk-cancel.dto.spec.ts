/**
 * checkout-bulk-extended-actions sprint (2026-05-06) — bulk-cancel DTO Zod schema 단위 테스트.
 *
 * 검증:
 *   - ids 배열: min(1) / max(50) / uuid format
 *   - reason: optional + max(LONG_TEXT_MAX_LENGTH) + trim
 *   - cancellerId 없음 (Rule 2 — 서버에서 추출)
 *   - bulk-reject와 의도적 비대칭 (cancel reason은 optional, reject reason은 required)
 */

import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { bulkCancelSchema } from '../dto/bulk-cancel.dto';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MAX = VALIDATION_RULES.LONG_TEXT_MAX_LENGTH;
const BULK_MAX = VALIDATION_RULES.BULK_OPERATION_MAX_COUNT;

describe('bulkCancelSchema', () => {
  describe('ids 검증', () => {
    it('1건 + reason 없음 → 통과 (reason optional)', () => {
      const result = bulkCancelSchema.safeParse({ ids: [VALID_UUID] });
      expect(result.success).toBe(true);
    });

    it('1건 + 유효 reason → 통과', () => {
      const result = bulkCancelSchema.safeParse({
        ids: [VALID_UUID],
        reason: '운영 정책 변경으로 취소',
      });
      expect(result.success).toBe(true);
    });

    it('빈 배열 → 실패 (min 1)', () => {
      const result = bulkCancelSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.array.minCases(1));
      }
    });

    it(`${BULK_MAX + 1}건 → 실패 (max ${BULK_MAX}, DoS 방어)`, () => {
      const ids = Array.from({ length: BULK_MAX + 1 }, () => VALID_UUID);
      const result = bulkCancelSchema.safeParse({ ids });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.array.maxCases(BULK_MAX));
      }
    });

    it(`정확히 ${BULK_MAX}건 → 통과 (boundary)`, () => {
      const ids = Array.from({ length: BULK_MAX }, () => VALID_UUID);
      const result = bulkCancelSchema.safeParse({ ids });
      expect(result.success).toBe(true);
    });

    it('uuid 형식 위반 → 실패', () => {
      const result = bulkCancelSchema.safeParse({ ids: ['not-a-uuid'] });
      expect(result.success).toBe(false);
    });
  });

  describe('reason 검증 (optional)', () => {
    it('undefined → 통과 (optional, 단건 cancel과 동일)', () => {
      const result = bulkCancelSchema.safeParse({ ids: [VALID_UUID] });
      expect(result.success).toBe(true);
    });

    it('빈 문자열 → 통과 (trim 후 length 0, optional이라 무시 안 됨 — DTO 호출자 처리)', () => {
      const result = bulkCancelSchema.safeParse({ ids: [VALID_UUID], reason: '' });
      expect(result.success).toBe(true);
    });

    it(`${MAX}자 → 통과 (boundary)`, () => {
      const reason = 'x'.repeat(MAX);
      const result = bulkCancelSchema.safeParse({ ids: [VALID_UUID], reason });
      expect(result.success).toBe(true);
    });

    it(`${MAX + 1}자 → 실패`, () => {
      const reason = 'x'.repeat(MAX + 1);
      const result = bulkCancelSchema.safeParse({ ids: [VALID_UUID], reason });
      expect(result.success).toBe(false);
    });

    it('whitespace trim — 양 끝 공백은 trim됨', () => {
      const result = bulkCancelSchema.safeParse({
        ids: [VALID_UUID],
        reason: '  운영 정책 변경  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe('운영 정책 변경');
      }
    });
  });

  describe('Rule 2 — cancellerId는 서버에서 추출', () => {
    it('cancellerId 필드 없음 (DTO에 미포함, body 위조 차단)', () => {
      const result = bulkCancelSchema.safeParse({
        ids: [VALID_UUID],
        cancellerId: 'malicious-attacker-id',
      });
      // cancellerId는 unknown key — Zod는 strict 모드 아니라 무시. 단 schema에는 필드 없음.
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { cancellerId?: string }).cancellerId).toBeUndefined();
      }
    });
  });

  describe('의도적 비대칭 — bulk-reject와 다른 점', () => {
    it('reason은 optional (bulk-reject의 reason은 required)', () => {
      const result = bulkCancelSchema.safeParse({ ids: [VALID_UUID] });
      expect(result.success).toBe(true);
    });
  });
});
