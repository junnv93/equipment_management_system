import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { updateCalibrationPlanItemSchema } from '../dto/update-calibration-plan.dto';

describe('updateCalibrationPlanItemSchema', () => {
  it('계획된 교정기관과 추가 비고는 trim한다', () => {
    const result = updateCalibrationPlanItemSchema.safeParse({
      plannedCalibrationAgency: '  KATS  ',
      notes: '  일정 조정  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plannedCalibrationAgency).toBe('KATS');
      expect(result.data.notes).toBe('일정 조정');
    }
  });

  it('계획된 교정기관은 TEXT_FIELD_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = updateCalibrationPlanItemSchema.safeParse({
      plannedCalibrationAgency: '가'.repeat(VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('계획된 교정기관', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
      );
    }
  });

  it('추가 비고는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = updateCalibrationPlanItemSchema.safeParse({
      notes: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('추가 비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
