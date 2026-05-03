import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { createValidationSchema } from '../dto/create-validation.dto';
import { updateValidationSchema } from '../dto/update-validation.dto';

describe('software validation DTO schemas', () => {
  it('createValidationSchema 장문 self 필드는 trim하고 LONG_TEXT_MAX_LENGTH를 강제한다', () => {
    const trimmed = createValidationSchema.safeParse({
      validationType: 'self',
      referenceDocuments: '  UL-QP-18-09  ',
    });

    expect(trimmed.success).toBe(true);
    if (trimmed.success) {
      expect(trimmed.data.referenceDocuments).toBe('UL-QP-18-09');
    }
  });

  it.each([
    ['vendorSummary', '공급자 요약'],
    ['attachmentNote', '첨부 비고'],
    ['referenceDocuments', '참조 문서'],
    ['operatingUnitDescription', '운영 단위 설명'],
    ['softwareComponents', '소프트웨어 구성'],
    ['hardwareComponents', '하드웨어 구성'],
  ] as const)(
    'createValidationSchema.%s는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다',
    (field, label) => {
      const result = createValidationSchema.safeParse({
        validationType: field === 'vendorSummary' || field === 'attachmentNote' ? 'vendor' : 'self',
        [field]: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          VM.string.max(label, VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
        );
      }
    }
  );

  it.each([
    ['vendorSummary', '공급자 요약'],
    ['attachmentNote', '첨부 비고'],
    ['referenceDocuments', '참조 문서'],
    ['operatingUnitDescription', '운영 단위 설명'],
    ['softwareComponents', '소프트웨어 구성'],
    ['hardwareComponents', '하드웨어 구성'],
  ] as const)(
    'updateValidationSchema.%s는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다',
    (field, label) => {
      const result = updateValidationSchema.safeParse({
        version: 1,
        [field]: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          VM.string.max(label, VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
        );
      }
    }
  );

  it('updateValidationSchema 장문 필드는 trim한다', () => {
    const result = updateValidationSchema.safeParse({
      version: 1,
      hardwareComponents: '  테스트 PC  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hardwareComponents).toBe('테스트 PC');
    }
  });
});
