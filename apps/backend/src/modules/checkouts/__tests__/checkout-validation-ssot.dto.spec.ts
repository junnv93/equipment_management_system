import { VM } from '@equipment-management/schemas';
import { MAX_PAGE_SIZE, VALIDATION_RULES } from '@equipment-management/shared-constants';
import { approveCheckoutSchema } from '../dto/approve-checkout.dto';
import { borrowerApproveCheckoutSchema } from '../dto/borrower-approve-checkout.dto';
import { bulkApproveSchema } from '../dto/bulk-approve.dto';
import { createCheckoutSchema } from '../dto/create-checkout.dto';
import { checkoutQuerySchema } from '../dto/checkout-query.dto';
import { VerifyHandoverTokenSchema } from '../dto/handover-token.dto';
import { startCheckoutSchema } from '../dto/start-checkout.dto';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('checkout DTO validation SSOT', () => {
  it('중복 장비 refine 메시지는 VM.checkout.duplicateEquipment를 사용한다', () => {
    const result = createCheckoutSchema.safeParse({
      equipmentIds: [VALID_UUID, VALID_UUID],
      purpose: 'rental',
      destination: 'RF Lab',
      reason: '시험 장비 반출',
      expectedReturnDate: '2026-05-10T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.checkout.duplicateEquipment);
    }
  });

  it('handover token required 메시지는 VM.handover.token.required를 사용한다', () => {
    const result = VerifyHandoverTokenSchema.safeParse({ token: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.handover.token.required);
    }
  });

  it('handover token은 trim 후 빈 문자열이면 실패한다', () => {
    const result = VerifyHandoverTokenSchema.safeParse({ token: '   ' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.handover.token.required);
    }
  });

  it('handover token은 trim 후 값이 있으면 trimmed value를 반환한다', () => {
    const result = VerifyHandoverTokenSchema.safeParse({ token: '  signed-token  ' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toBe('signed-token');
    }
  });

  it('start checkout 상태 기록은 trim 후 빈 문자열이면 실패하고 정상 값은 trim한다', () => {
    const reject = startCheckoutSchema.safeParse({
      version: 1,
      itemConditions: [{ equipmentId: VALID_UUID, conditionBefore: '   ' }],
    });
    expect(reject.success).toBe(false);

    const accept = startCheckoutSchema.safeParse({
      version: 1,
      itemConditions: [{ equipmentId: VALID_UUID, conditionBefore: '  정상 작동  ' }],
    });
    expect(accept.success).toBe(true);
    if (accept.success) {
      expect(accept.data.itemConditions?.[0]?.conditionBefore).toBe('정상 작동');
    }
  });

  it('start checkout 상태 기록은 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = startCheckoutSchema.safeParse({
      version: 1,
      itemConditions: [
        {
          equipmentId: VALID_UUID,
          conditionBefore: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('반출 전 상태', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });

  it('approval notes/commonReason 자유텍스트는 trim한다', () => {
    const approve = approveCheckoutSchema.safeParse({ version: 1, notes: '  승인  ' });
    expect(approve.success).toBe(true);
    if (approve.success) {
      expect(approve.data.notes).toBe('승인');
    }
  });

  it.each([
    {
      name: 'approveCheckoutSchema.notes',
      parse: () =>
        approveCheckoutSchema.safeParse({
          version: 1,
          notes: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
        }),
      message: VM.string.max('승인 메모', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
    },
    {
      name: 'borrowerApproveCheckoutSchema.notes',
      parse: () =>
        borrowerApproveCheckoutSchema.safeParse({
          version: 1,
          notes: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
        }),
      message: VM.string.max('승인 메모', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
    },
    {
      name: 'bulkApproveSchema.commonReason',
      parse: () =>
        bulkApproveSchema.safeParse({
          ids: [VALID_UUID],
          commonReason: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
        }),
      message: VM.string.max('공통 승인 메모', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
    },
  ])('$name는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', ({ parse, message }) => {
    const result = parse();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(message);
    }
  });

  it('checkout pageSize 최대값은 MAX_PAGE_SIZE를 사용한다', () => {
    const boundary = checkoutQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE) });
    expect(boundary.success).toBe(true);

    const overflow = checkoutQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE + 1) });
    expect(overflow.success).toBe(false);
  });
});
