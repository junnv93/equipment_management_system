import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { createCalibrationSchema } from '../dto/create-calibration.dto';
import { completeIntermediateCheckSchema } from '../dto/complete-intermediate-check.dto';

const base = {
  equipmentId: '550e8400-e29b-41d4-a716-446655440000',
  calibrationDate: '2026-05-03',
};

describe('createCalibrationSchema', () => {
  it('교정 기관은 trim 후 빈 문자열이면 실패한다', () => {
    const result = createCalibrationSchema.safeParse({
      ...base,
      calibrationAgency: '   ',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.calibration.agency.required);
    }
  });

  it('교정 기관은 trim 후 값이 있으면 trimmed value를 반환한다', () => {
    const result = createCalibrationSchema.safeParse({
      ...base,
      calibrationAgency: '  한국계측기술원  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.calibrationAgency).toBe('한국계측기술원');
    }
  });

  it('등록자 코멘트는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = createCalibrationSchema.safeParse({
      ...base,
      calibrationAgency: '한국계측기술원',
      registrarComment: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('등록자 코멘트', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });

  it('교정 기관은 TEXT_FIELD_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = createCalibrationSchema.safeParse({
      ...base,
      calibrationAgency: '가'.repeat(VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('교정 기관', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
      );
    }
  });

  it('중간점검 완료 비고는 trim하고 LONG_TEXT_MAX_LENGTH를 강제한다', () => {
    const trimmed = completeIntermediateCheckSchema.safeParse({
      version: 1,
      notes: '  확인 완료  ',
    });
    expect(trimmed.success).toBe(true);
    if (trimmed.success) {
      expect(trimmed.data.notes).toBe('확인 완료');
    }

    const overflow = completeIntermediateCheckSchema.safeParse({
      version: 1,
      notes: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });
    expect(overflow.success).toBe(false);
    if (!overflow.success) {
      expect(overflow.error.issues[0].message).toBe(
        VM.string.max('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
