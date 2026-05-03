import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { createInspectionSchema } from '../dto/create-inspection.dto';
import { createResultSectionSchema } from '../dto/result-section.dto';
import { updateInspectionSchema } from '../dto/update-inspection.dto';

describe('intermediate inspection DTO schemas', () => {
  const item = {
    itemNumber: 1,
    checkCriteria: '기준',
  };

  it('점검 항목은 trim 후 빈 문자열이면 실패한다', () => {
    const result = createInspectionSchema.safeParse({
      inspectionDate: '2026-05-03',
      items: [{ ...item, checkItem: '   ' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.required('점검 항목'));
    }
  });

  it('점검 항목과 기준은 trim 후 값이 있으면 trimmed value를 반환한다', () => {
    const result = createInspectionSchema.safeParse({
      inspectionDate: '2026-05-03',
      items: [{ itemNumber: 1, checkItem: '  출력 확인  ', checkCriteria: '  기준  ' }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items?.[0]?.checkItem).toBe('출력 확인');
      expect(result.data.items?.[0]?.checkCriteria).toBe('기준');
    }
  });

  it('수정 DTO 비고는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = updateInspectionSchema.safeParse({
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

  it('상세 결과와 결과 섹션 본문은 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const detail = createInspectionSchema.safeParse({
      inspectionDate: '2026-05-03',
      items: [
        {
          itemNumber: 1,
          checkItem: '출력 확인',
          checkCriteria: '기준',
          detailedResult: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
        },
      ],
    });
    expect(detail.success).toBe(false);
    if (!detail.success) {
      expect(detail.error.issues[0].message).toBe(
        VM.string.max('상세 결과', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }

    const section = createResultSectionSchema.safeParse({
      sortOrder: 0,
      sectionType: 'text',
      content: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });
    expect(section.success).toBe(false);
    if (!section.success) {
      expect(section.error.issues[0].message).toBe(
        VM.string.max('본문', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
