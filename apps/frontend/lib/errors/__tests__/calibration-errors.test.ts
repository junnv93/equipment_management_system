import { CALIBRATION_ERROR_CODES, ErrorCode } from '@equipment-management/schemas';
import {
  CALIBRATION_ERROR_I18N_KEY,
  getCalibrationErrorI18nKey,
  mapCalibrationErrorToToast,
} from '../calibration-errors';

describe('calibration error SSOT routing', () => {
  it('uses schemas CALIBRATION_ERROR_CODES as the i18n key map source', () => {
    expect(CALIBRATION_ERROR_I18N_KEY[CALIBRATION_ERROR_CODES.FILE_REQUIRED]).toBe(
      'calibration.errors.fileRequired'
    );
    expect(CALIBRATION_ERROR_I18N_KEY[CALIBRATION_ERROR_CODES.PLAN_ITEM_NOT_EXECUTED]).toBe(
      'calibration.errors.planItemNotExecuted'
    );
  });

  it('maps backend calibration error codes to i18n keys', () => {
    expect(getCalibrationErrorI18nKey(ErrorCode.CalibrationFileRequired)).toBe(
      'calibration.errors.fileRequired'
    );
    expect(getCalibrationErrorI18nKey(ErrorCode.EndpointDeprecated)).toBe(
      'calibration.errors.endpointDeprecated'
    );
    expect(getCalibrationErrorI18nKey('UNKNOWN_CUSTOM_CODE')).toBe('calibration.errors.unknown');
  });

  it('maps reject ErrorCode to toast copy through frontend i18n', () => {
    const t = jest.fn((key: string, values?: Record<string, string | number | Date>) =>
      values ? `${key}:${JSON.stringify(values)}` : key
    );

    const toast = mapCalibrationErrorToToast(
      { response: { data: { code: ErrorCode.CalibrationRejectionReasonRequired } } },
      t
    );

    expect(toast.title).toBe('errors.title');
    expect(toast.description).toContain('errors.rejectionReasonRequired');
  });
});
