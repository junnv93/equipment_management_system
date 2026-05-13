import {
  VM,
  CONDITION_STATUS_VALUES,
  ACCESSORIES_STATUS_VALUES,
} from '@equipment-management/schemas';
import { VALIDATION_RULES, Permission } from '@equipment-management/shared-constants';
import { bulkReceiveSchema } from '../dto/bulk-receive.dto';
import { CheckoutsController } from '../checkouts.controller';
import { PERMISSIONS_KEY } from '../../auth/decorators/permissions.decorator';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const BULK_MAX = VALIDATION_RULES.BULK_OPERATION_MAX_COUNT;

const VALID_BASE = {
  ids: [VALID_UUID],
  appearanceStatus: CONDITION_STATUS_VALUES[0], // 'normal'
  operationStatus: CONDITION_STATUS_VALUES[0],
};

describe('bulkReceiveSchema', () => {
  describe('ids 검증', () => {
    it('1건 → 통과', () => {
      const result = bulkReceiveSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });

    it('빈 배열 → 실패 (VM.array.minCases)', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, ids: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.array.minCases(1));
      }
    });

    it(`정확히 ${BULK_MAX}건 → 통과`, () => {
      const ids = Array.from({ length: BULK_MAX }, () => VALID_UUID);
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, ids });
      expect(result.success).toBe(true);
    });

    it(`${BULK_MAX + 1}건 → 실패 (VM.array.maxCases)`, () => {
      const ids = Array.from({ length: BULK_MAX + 1 }, () => VALID_UUID);
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, ids });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.array.maxCases(BULK_MAX));
      }
    });

    it('UUID 형식이 아닌 값 → 실패', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, ids: ['not-a-uuid'] });
      expect(result.success).toBe(false);
    });
  });

  describe('appearanceStatus / operationStatus 검증', () => {
    it('유효한 CONDITION_STATUS_VALUES → 통과', () => {
      for (const status of CONDITION_STATUS_VALUES) {
        const result = bulkReceiveSchema.safeParse({
          ...VALID_BASE,
          appearanceStatus: status,
          operationStatus: status,
        });
        expect(result.success).toBe(true);
      }
    });

    it('잘못된 appearanceStatus → 실패', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, appearanceStatus: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('잘못된 operationStatus → 실패', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, operationStatus: 'bad_val' });
      expect(result.success).toBe(false);
    });

    it('appearanceStatus 누락 → 실패', () => {
      const { appearanceStatus: _, ...withoutAppearance } = VALID_BASE;
      const result = bulkReceiveSchema.safeParse(withoutAppearance);
      expect(result.success).toBe(false);
    });

    it('operationStatus 누락 → 실패', () => {
      const { operationStatus: _, ...withoutOp } = VALID_BASE;
      const result = bulkReceiveSchema.safeParse(withoutOp);
      expect(result.success).toBe(false);
    });
  });

  describe('accessoriesStatus 검증 (optional)', () => {
    it('미전달 → 통과', () => {
      const result = bulkReceiveSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.accessoriesStatus).toBeUndefined();
    });

    it('유효한 ACCESSORIES_STATUS_VALUES → 통과', () => {
      for (const status of ACCESSORIES_STATUS_VALUES) {
        const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, accessoriesStatus: status });
        expect(result.success).toBe(true);
      }
    });

    it('잘못된 accessoriesStatus → 실패', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, accessoriesStatus: 'wrong' });
      expect(result.success).toBe(false);
    });
  });

  describe('version / userId 필드 부재 확인 (Rule 2 & Rule 11)', () => {
    it('schema에 version 필드 없음 — 전달해도 무시됨', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, version: 5 });
      expect(result.success).toBe(true);
      if (result.success) expect((result.data as Record<string, unknown>).version).toBeUndefined();
    });

    it('schema에 userId/checkerId 필드 없음 — 전달해도 무시됨', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, userId: 'some-user-id' });
      expect(result.success).toBe(true);
      if (result.success) expect((result.data as Record<string, unknown>).userId).toBeUndefined();
    });
  });

  describe('abnormalDetails / notes 검증 (optional)', () => {
    it('미전달 → 통과', () => {
      const result = bulkReceiveSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });

    it('abnormalDetails 최대 길이 초과 → 실패', () => {
      const result = bulkReceiveSchema.safeParse({
        ...VALID_BASE,
        abnormalDetails: 'a'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
      });
      expect(result.success).toBe(false);
    });

    it('notes 최대 길이 초과 → 실패', () => {
      const result = bulkReceiveSchema.safeParse({
        ...VALID_BASE,
        notes: 'n'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('bulkReceive — Permission gate (M-14)', () => {
  it('bulkReceive 컨트롤러 메서드에 Permission.COMPLETE_CHECKOUT 데코레이터 적용됨', () => {
    const permissions: Permission[] = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CheckoutsController.prototype.bulkReceive
    ) as Permission[];
    expect(permissions).toContain(Permission.COMPLETE_CHECKOUT);
  });
});
