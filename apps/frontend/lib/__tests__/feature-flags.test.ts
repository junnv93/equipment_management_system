import { getFeatureFlag } from '../feature-flags';

describe('getFeatureFlag', () => {
  const originalInspectionTemplateEnabled = process.env.NEXT_PUBLIC_INSPECTION_TEMPLATE_ENABLED;
  const originalApprovalUiR2 = process.env.NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2;

  afterEach(() => {
    if (originalInspectionTemplateEnabled === undefined) {
      delete process.env.NEXT_PUBLIC_INSPECTION_TEMPLATE_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_INSPECTION_TEMPLATE_ENABLED = originalInspectionTemplateEnabled;
    }

    if (originalApprovalUiR2 === undefined) {
      delete process.env.NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2;
    } else {
      process.env.NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2 = originalApprovalUiR2;
    }
  });

  it('keeps inspection templates enabled by default', () => {
    delete process.env.NEXT_PUBLIC_INSPECTION_TEMPLATE_ENABLED;

    expect(getFeatureFlag('INSPECTION_TEMPLATE')).toBe(true);
  });

  it('disables inspection templates only when explicitly set to false', () => {
    process.env.NEXT_PUBLIC_INSPECTION_TEMPLATE_ENABLED = 'false';

    expect(getFeatureFlag('INSPECTION_TEMPLATE')).toBe(false);
  });

  it('preserves approval UI R2 opt-in semantics', () => {
    delete process.env.NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2;
    expect(getFeatureFlag('APPROVAL_UI_R2')).toBe(false);

    process.env.NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2 = 'true';
    expect(getFeatureFlag('APPROVAL_UI_R2')).toBe(true);
  });
});
