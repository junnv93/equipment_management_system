import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { revokeApprovalSchema } from '../dto/revoke-approval.dto';

const MIN = VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH;
const MAX = VALIDATION_RULES.LONG_TEXT_MAX_LENGTH;
const VALID_VERSION = 1;

describe('revokeApprovalSchema', () => {
  describe('reason trim/min/max symmetry', () => {
    it('MIN자 사유는 통과한다', () => {
      const result = revokeApprovalSchema.safeParse({
        version: VALID_VERSION,
        reason: 'x'.repeat(MIN),
      });

      expect(result.success).toBe(true);
    });

    it('앞뒤 공백 포함 MIN자 사유는 trim 후 통과하고 trimmed value를 반환한다', () => {
      const result = revokeApprovalSchema.safeParse({
        version: VALID_VERSION,
        reason: `  ${'x'.repeat(MIN)}  `,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe('x'.repeat(MIN));
      }
    });

    it('trim 후 MIN-1자 사유는 VM.string.min 메시지로 실패한다', () => {
      const result = revokeApprovalSchema.safeParse({
        version: VALID_VERSION,
        reason: `  ${'x'.repeat(MIN - 1)}  `,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.string.min('철회 사유', MIN));
      }
    });

    it('공백만 있는 사유는 trim 후 실패한다', () => {
      const result = revokeApprovalSchema.safeParse({
        version: VALID_VERSION,
        reason: '   ',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.string.min('철회 사유', MIN));
      }
    });

    it('MAX자 사유는 통과한다', () => {
      const result = revokeApprovalSchema.safeParse({
        version: VALID_VERSION,
        reason: 'x'.repeat(MAX),
      });

      expect(result.success).toBe(true);
    });

    it('MAX+1자 사유는 VM.string.max 메시지로 실패한다', () => {
      const result = revokeApprovalSchema.safeParse({
        version: VALID_VERSION,
        reason: 'x'.repeat(MAX + 1),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.string.max('철회 사유', MAX));
      }
    });
  });

  describe('versioned DTO boundary', () => {
    it('version 누락은 실패한다', () => {
      const result = revokeApprovalSchema.safeParse({
        reason: 'x'.repeat(MIN),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('version'))).toBe(true);
      }
    });

    it('version 0은 positive boundary 위반으로 실패한다', () => {
      const result = revokeApprovalSchema.safeParse({
        version: 0,
        reason: 'x'.repeat(MIN),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.version.positive);
      }
    });
  });

  describe('server-side approver identity', () => {
    it('approverId는 DTO 출력에 포함되지 않는다', () => {
      const result = revokeApprovalSchema.safeParse({
        version: VALID_VERSION,
        reason: 'x'.repeat(MIN),
        approverId: 'malicious-user-id',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).not.toContain('approverId');
      }
    });
  });
});
