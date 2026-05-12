import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { createRejectionPresetSchema } from '../dto/create-rejection-preset.dto';
import { updateRejectionPresetSchema } from '../dto/update-rejection-preset.dto';
import { reorderRejectionPresetsSchema } from '../dto/reorder-rejection-presets.dto';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('createRejectionPresetSchema', () => {
  it('정상 입력은 통과한다', () => {
    const result = createRejectionPresetSchema.safeParse({
      label: '교정 예정 중 반출 불가',
      template: '본 장비는 교정 예정 상태입니다.',
      sortOrder: 10,
    });
    expect(result.success).toBe(true);
  });

  it('label trim 후 빈 문자열은 실패한다', () => {
    const result = createRejectionPresetSchema.safeParse({ label: '   ' });
    expect(result.success).toBe(false);
  });

  it('template 미제공 시 통과하고 undefined 반환', () => {
    const result = createRejectionPresetSchema.safeParse({ label: '사유' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.template).toBeUndefined();
  });

  it('template 빈 문자열은 undefined 로 정규화', () => {
    const result = createRejectionPresetSchema.safeParse({ label: '사유', template: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.template).toBeUndefined();
  });

  it('label 길이 EXTENDED_TEXT_MAX_LENGTH+1 은 실패한다', () => {
    const result = createRejectionPresetSchema.safeParse({
      label: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it('template 길이 LONG_TEXT_MAX_LENGTH+1 은 실패한다', () => {
    const result = createRejectionPresetSchema.safeParse({
      label: '사유',
      template: 'a'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it('sortOrder SORT_ORDER_MAX+1 은 실패한다', () => {
    const result = createRejectionPresetSchema.safeParse({
      label: '사유',
      sortOrder: VALIDATION_RULES.SORT_ORDER_MAX + 1,
    });
    expect(result.success).toBe(false);
  });

  it('sortOrder 음수는 실패한다', () => {
    const result = createRejectionPresetSchema.safeParse({ label: '사유', sortOrder: -1 });
    expect(result.success).toBe(false);
  });

  it('sortOrder 정수가 아니면 실패한다', () => {
    const result = createRejectionPresetSchema.safeParse({ label: '사유', sortOrder: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('updateRejectionPresetSchema', () => {
  it('label 만 수정 시 통과한다', () => {
    const result = updateRejectionPresetSchema.safeParse({ label: '수정된 사유' });
    expect(result.success).toBe(true);
  });

  it('template 만 수정 시 통과한다 (sortOrder 미제공 가능)', () => {
    const result = updateRejectionPresetSchema.safeParse({ template: '본문 수정' });
    expect(result.success).toBe(true);
  });

  it('sortOrder 만 수정 시 통과한다', () => {
    const result = updateRejectionPresetSchema.safeParse({ sortOrder: 5 });
    expect(result.success).toBe(true);
  });

  it('빈 객체는 refine 실패 (최소 한 필드 필수)', () => {
    const result = updateRejectionPresetSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('template null 은 통과 — 본문 제거 의도', () => {
    const result = updateRejectionPresetSchema.safeParse({ template: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.template).toBeNull();
  });

  it('template 빈 문자열은 null 로 정규화', () => {
    const result = updateRejectionPresetSchema.safeParse({ template: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.template).toBeNull();
  });

  it('label 길이 초과 실패', () => {
    const result = updateRejectionPresetSchema.safeParse({
      label: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it('label trim 후 빈 문자열 실패', () => {
    const result = updateRejectionPresetSchema.safeParse({ label: '   ' });
    expect(result.success).toBe(false);
  });
});

describe('reorderRejectionPresetsSchema', () => {
  it('정상 정렬 목록은 통과한다', () => {
    const result = reorderRejectionPresetsSchema.safeParse({
      orders: [
        { id: VALID_UUID, sortOrder: 0 },
        { id: '22222222-1111-4111-8111-111111111111', sortOrder: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('orders 빈 배열은 실패한다', () => {
    const result = reorderRejectionPresetsSchema.safeParse({ orders: [] });
    expect(result.success).toBe(false);
  });

  it('orders BULK_OPERATION_MAX_COUNT+1 은 실패한다', () => {
    const orders = Array.from(
      { length: VALIDATION_RULES.BULK_OPERATION_MAX_COUNT + 1 },
      (_, i) => ({
        id: VALID_UUID,
        sortOrder: i,
      })
    );
    const result = reorderRejectionPresetsSchema.safeParse({ orders });
    expect(result.success).toBe(false);
  });

  it('UUID 형식 위반 시 실패한다', () => {
    const result = reorderRejectionPresetsSchema.safeParse({
      orders: [{ id: 'not-a-uuid', sortOrder: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('sortOrder SORT_ORDER_MAX+1 은 실패한다', () => {
    const result = reorderRejectionPresetsSchema.safeParse({
      orders: [{ id: VALID_UUID, sortOrder: VALIDATION_RULES.SORT_ORDER_MAX + 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('sortOrder 음수는 실패한다', () => {
    const result = reorderRejectionPresetsSchema.safeParse({
      orders: [{ id: VALID_UUID, sortOrder: -1 }],
    });
    expect(result.success).toBe(false);
  });
});
