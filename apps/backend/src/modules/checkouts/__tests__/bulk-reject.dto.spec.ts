/**
 * Sprint 4.5 U-01 — bulk-reject DTO Zod schema 단위 테스트.
 *
 * 검증:
 *   - ids 배열: min(1) / max(50) / uuid format
 *   - reason: min(1) required / max(500)
 *   - approverId 없음 (Rule 2 — 서버에서 추출)
 *   - bulk-approve와 의도적 비대칭 (reason required vs commonReason optional)
 */

import { bulkRejectSchema } from '../dto/bulk-reject.dto';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('bulkRejectSchema', () => {
  describe('ids 검증', () => {
    it('1건 + 유효 reason → 통과', () => {
      const result = bulkRejectSchema.safeParse({
        ids: [VALID_UUID],
        reason: '유효한 사유',
      });
      expect(result.success).toBe(true);
    });

    it('빈 배열 → 실패 (min 1)', () => {
      const result = bulkRejectSchema.safeParse({ ids: [], reason: '사유' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최소 1건');
      }
    });

    it('51건 → 실패 (max 50, DoS 방어)', () => {
      const ids = Array.from({ length: 51 }, () => VALID_UUID);
      const result = bulkRejectSchema.safeParse({ ids, reason: '사유' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최대 50건');
      }
    });

    it('정확히 50건 → 통과 (boundary)', () => {
      const ids = Array.from({ length: 50 }, () => VALID_UUID);
      const result = bulkRejectSchema.safeParse({ ids, reason: '사유' });
      expect(result.success).toBe(true);
    });

    it('uuid 형식 위반 → 실패', () => {
      const result = bulkRejectSchema.safeParse({
        ids: ['not-a-uuid'],
        reason: '사유',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('UUID');
      }
    });
  });

  describe('reason 검증', () => {
    it('빈 문자열 → 실패 (min 1, 단건 reject 동등)', () => {
      const result = bulkRejectSchema.safeParse({
        ids: [VALID_UUID],
        reason: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('필수');
      }
    });

    it('reason 누락 → 실패 (단건 reject와 다른 점: bulk는 required)', () => {
      const result = bulkRejectSchema.safeParse({ ids: [VALID_UUID] });
      expect(result.success).toBe(false);
    });

    it('500자 → 통과 (boundary)', () => {
      const reason = 'x'.repeat(500);
      const result = bulkRejectSchema.safeParse({ ids: [VALID_UUID], reason });
      expect(result.success).toBe(true);
    });

    it('501자 → 실패 (max 500)', () => {
      const reason = 'x'.repeat(501);
      const result = bulkRejectSchema.safeParse({ ids: [VALID_UUID], reason });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최대 500자');
      }
    });
  });

  describe('Rule 2 — approverId 서버사이드 추출', () => {
    it('DTO에 approverId 미포함 (서버에서 extractUserId(req)로 추출)', () => {
      const result = bulkRejectSchema.safeParse({
        ids: [VALID_UUID],
        reason: '사유',
        approverId: 'malicious-user-id',
      });
      // Zod default: passthrough fields는 무시되거나 strip됨 (strict 모드 아님)
      // 핵심: approverId가 type에 노출되지 않음
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).not.toContain('approverId');
      }
    });
  });

  describe('의도적 비대칭 — bulk-approve와 다른 점', () => {
    it('reason은 required (bulk-approve의 commonReason은 optional)', () => {
      const result = bulkRejectSchema.safeParse({ ids: [VALID_UUID] });
      expect(result.success).toBe(false);
      if (!result.success) {
        const reasonIssue = result.error.issues.find((i) => i.path.includes('reason'));
        expect(reasonIssue).toBeDefined();
      }
    });
  });
});
