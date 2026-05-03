import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { createSelfInspectionSchema } from '../dto/create-self-inspection.dto';
import { updateSelfInspectionSchema } from '../dto/update-self-inspection.dto';

describe('self inspection DTO schemas', () => {
  const validItem = {
    itemNumber: 1,
    checkItem: '전원 상태',
    checkResult: 'pass',
  };

  it('점검 항목은 trim 후 빈 문자열이면 실패한다', () => {
    const result = createSelfInspectionSchema.safeParse({
      inspectionDate: '2026-05-03',
      overallResult: 'pass',
      items: [{ ...validItem, checkItem: '   ' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.required('점검 항목'));
    }
  });

  it('점검 항목은 trim 후 값이 있으면 trimmed value를 반환한다', () => {
    const result = createSelfInspectionSchema.safeParse({
      inspectionDate: '2026-05-03',
      overallResult: 'pass',
      items: [{ ...validItem, checkItem: '  전원 상태  ' }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0]?.checkItem).toBe('전원 상태');
    }
  });

  it('수정 DTO 비고는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = updateSelfInspectionSchema.safeParse({
      version: 1,
      remarks: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });

  it('수정 DTO는 양식 헤더 snapshot 필드를 SSOT enum과 길이 규칙으로 검증한다', () => {
    const result = updateSelfInspectionSchema.safeParse({
      version: 1,
      classification: 'non_calibrated',
      calibrationValidityPeriod: '  N/A  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.classification).toBe('non_calibrated');
      expect(result.data.calibrationValidityPeriod).toBe('N/A');
    }
  });

  it('수정 DTO 교정 유효기간은 MANAGEMENT_NUMBER_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = updateSelfInspectionSchema.safeParse({
      version: 1,
      calibrationValidityPeriod: '가'.repeat(VALIDATION_RULES.MANAGEMENT_NUMBER_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('교정 유효기간', VALIDATION_RULES.MANAGEMENT_NUMBER_MAX_LENGTH)
      );
    }
  });

  it('수정 DTO 분류는 EquipmentClassificationEnum 외 값을 거부한다', () => {
    const result = updateSelfInspectionSchema.safeParse({
      version: 1,
      classification: 'self_inspection',
    });

    expect(result.success).toBe(false);
  });

  it('상세 결과는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = createSelfInspectionSchema.safeParse({
      inspectionDate: '2026-05-03',
      overallResult: 'pass',
      items: [
        {
          ...validItem,
          detailedResult: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('상세 결과', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
