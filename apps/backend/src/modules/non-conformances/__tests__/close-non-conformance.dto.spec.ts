import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { closeNonConformanceSchema } from '../dto/close-non-conformance.dto';

describe('closeNonConformanceSchema', () => {
  it('종료 메모는 trim하고 LONG_TEXT_MAX_LENGTH를 강제한다', () => {
    const trimmed = closeNonConformanceSchema.safeParse({
      version: 1,
      closureNotes: '  종결 확인  ',
    });

    expect(trimmed.success).toBe(true);
    if (trimmed.success) {
      expect(trimmed.data.closureNotes).toBe('종결 확인');
    }

    const overflow = closeNonConformanceSchema.safeParse({
      version: 1,
      closureNotes: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(overflow.success).toBe(false);
    if (!overflow.success) {
      expect(overflow.error.issues[0].message).toBe(
        VM.string.max('종료 메모', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
