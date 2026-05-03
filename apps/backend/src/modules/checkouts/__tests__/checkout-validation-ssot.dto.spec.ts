import { VM } from '@equipment-management/schemas';
import { MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import { createCheckoutSchema } from '../dto/create-checkout.dto';
import { checkoutQuerySchema } from '../dto/checkout-query.dto';
import { VerifyHandoverTokenSchema } from '../dto/handover-token.dto';

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

  it('checkout pageSize 최대값은 MAX_PAGE_SIZE를 사용한다', () => {
    const boundary = checkoutQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE) });
    expect(boundary.success).toBe(true);

    const overflow = checkoutQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE + 1) });
    expect(overflow.success).toBe(false);
  });
});
