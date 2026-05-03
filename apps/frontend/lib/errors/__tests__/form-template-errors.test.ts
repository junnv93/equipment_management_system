import { ErrorCode } from '@equipment-management/schemas';
import { EquipmentErrorCode } from '../equipment-errors';
import { mapFormTemplateErrorCode, mapFormTemplateErrorToToast } from '../form-template-errors';

describe('form template error mapper', () => {
  it('routes inspection template not found to the form-template namespace', () => {
    expect(mapFormTemplateErrorCode(ErrorCode.InspectionTemplateNotFound)).toBe(
      'errors.inspectionTemplateNotFound'
    );
  });

  it('preserves existing upload dialog code routing', () => {
    expect(mapFormTemplateErrorCode(ErrorCode.FormNumberAlreadyExists)).toBe(
      'uploadDialog.errorNumberExists'
    );
    expect(mapFormTemplateErrorCode(ErrorCode.InvalidFormName)).toBe('uploadDialog.error');
    expect(mapFormTemplateErrorCode(ErrorCode.InvalidFormNumberFormat)).toBe('uploadDialog.error');
  });

  it('maps form template not found and normalized UI code to notFound', () => {
    expect(mapFormTemplateErrorCode(ErrorCode.FormTemplateNotFound)).toBe('errors.notFound');
    expect(mapFormTemplateErrorCode(EquipmentErrorCode.FORM_TEMPLATE_NOT_FOUND)).toBe(
      'errors.notFound'
    );
  });

  it('builds a toast from nested backend error responses', () => {
    const t = jest.fn((key: string) => `t:${key}`);

    expect(
      mapFormTemplateErrorToToast(
        { response: { data: { code: ErrorCode.InspectionTemplateNotFound } } },
        t
      )
    ).toEqual({
      title: 't:errors.title',
      description: 't:errors.inspectionTemplateNotFound',
    });
  });

  it('falls back to uploadDialog.error for unknown codes', () => {
    expect(mapFormTemplateErrorCode('UNKNOWN_CUSTOM_CODE')).toBe('uploadDialog.error');
    expect(mapFormTemplateErrorCode(undefined)).toBe('uploadDialog.error');
  });
});
