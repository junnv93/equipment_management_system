export type FeatureFlagName = 'APPROVAL_UI_R2' | 'INSPECTION_TEMPLATE';

export function getFeatureFlag(name: FeatureFlagName): boolean {
  switch (name) {
    case 'APPROVAL_UI_R2':
      return process.env.NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2 === 'true';
    case 'INSPECTION_TEMPLATE':
      return process.env.NEXT_PUBLIC_INSPECTION_TEMPLATE_ENABLED !== 'false';
  }
}
