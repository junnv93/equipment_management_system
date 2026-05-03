import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { createCableSchema } from '../dto/create-cable.dto';
import { createMeasurementSchema } from '../dto/create-measurement.dto';

describe('cable DTO validation', () => {
  it('createCableSchema uses cable SSOT max lengths', () => {
    const result = createCableSchema.safeParse({
      managementNumber: 'x'.repeat(VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('관리번호', VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH)
      );
    }
  });

  it('createMeasurementSchema uses cable SSOT loss length and VM array message', () => {
    const emptyDataPoints = createMeasurementSchema.safeParse({
      measurementDate: '2026-05-03',
      dataPoints: [],
    });

    expect(emptyDataPoints.success).toBe(false);
    if (!emptyDataPoints.success) {
      expect(emptyDataPoints.error.issues[0].message).toBe(VM.array.min('데이터 포인트', 1));
    }

    const tooLongLoss = createMeasurementSchema.safeParse({
      measurementDate: '2026-05-03',
      dataPoints: [
        {
          frequencyMhz: 100,
          lossDb: 'x'.repeat(VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH + 1),
        },
      ],
    });

    expect(tooLongLoss.success).toBe(false);
    if (!tooLongLoss.success) {
      expect(tooLongLoss.error.issues[0].message).toBe(
        VM.string.max('손실값', VALIDATION_RULES.CABLE_SHORT_TEXT_MAX_LENGTH)
      );
    }
  });

  it('createMeasurementSchema trims notes and enforces LONG_TEXT_MAX_LENGTH', () => {
    const trimmed = createMeasurementSchema.safeParse({
      measurementDate: '2026-05-03',
      notes: '  측정 완료  ',
      dataPoints: [{ frequencyMhz: 100, lossDb: '0.1' }],
    });

    expect(trimmed.success).toBe(true);
    if (trimmed.success) {
      expect(trimmed.data.notes).toBe('측정 완료');
    }

    const overflow = createMeasurementSchema.safeParse({
      measurementDate: '2026-05-03',
      notes: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
      dataPoints: [{ frequencyMhz: 100, lossDb: '0.1' }],
    });

    expect(overflow.success).toBe(false);
    if (!overflow.success) {
      expect(overflow.error.issues[0].message).toBe(
        VM.string.max('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
