import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { mapCalibrationPlanErrorToToast } from '../calibration-plan-errors';

describe('calibration plan error mapper', () => {
  it('maps plan not found ErrorCode to calibration plan i18n toast', () => {
    const t = jest.fn((key: string) => key);

    expect(
      mapCalibrationPlanErrorToToast(
        { response: { data: { code: ErrorCode.CalibrationPlanNotFound } } },
        t
      )
    ).toEqual({
      title: 'planErrors.title',
      description: 'planErrors.notFound',
    });
  });

  it('maps rejection reason ErrorCode with SSOT min parameter', () => {
    const t = jest.fn((key: string, values?: Record<string, string | number | Date>) =>
      values ? `${key}:${JSON.stringify(values)}` : key
    );

    const toast = mapCalibrationPlanErrorToToast(
      { response: { data: { code: ErrorCode.CalibrationPlanRejectionReasonRequired } } },
      t
    );

    expect(toast.description).toBe(
      `planErrors.rejectionReasonRequired:${JSON.stringify({
        min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
      })}`
    );
  });

  it('falls back to planErrors.genericError for unmapped errors', () => {
    const t = jest.fn((key: string) => key);

    expect(mapCalibrationPlanErrorToToast(new Error('backend message'), t)).toEqual({
      title: 'planErrors.title',
      description: 'planErrors.genericError',
    });
  });
});
