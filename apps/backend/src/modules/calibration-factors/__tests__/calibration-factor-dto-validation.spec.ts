import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { createCalibrationFactorSchema } from '../dto/create-calibration-factor.dto';

const base = {
  equipmentId: '550e8400-e29b-41d4-a716-446655440000',
  factorType: 'antenna_gain',
  factorValue: 1.23,
  effectiveDate: '2026-05-03',
};

describe('createCalibrationFactorSchema', () => {
  it('보정계수 이름은 trim 후 빈 문자열이면 실패한다', () => {
    const result = createCalibrationFactorSchema.safeParse({
      ...base,
      factorName: '   ',
      unit: 'dB',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.calibrationFactor.name.required);
    }
  });

  it('보정계수 이름과 단위는 trim 후 값이 있으면 trimmed value를 반환한다', () => {
    const result = createCalibrationFactorSchema.safeParse({
      ...base,
      factorName: '  3GHz 안테나 이득  ',
      unit: ' dB ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.factorName).toBe('3GHz 안테나 이득');
      expect(result.data.unit).toBe('dB');
    }
  });

  it('단위는 SHORT_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = createCalibrationFactorSchema.safeParse({
      ...base,
      factorName: '3GHz 안테나 이득',
      unit: 'd'.repeat(VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('단위', VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH)
      );
    }
  });

  it('보정계수 이름은 EXTENDED_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = createCalibrationFactorSchema.safeParse({
      ...base,
      factorName: '가'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      unit: 'dB',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('보정계수 이름', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
      );
    }
  });
});
