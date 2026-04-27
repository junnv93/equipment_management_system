export type FeatureFlagName = 'APPROVAL_UI_R2';

export function getFeatureFlag(name: FeatureFlagName): boolean {
  switch (name) {
    case 'APPROVAL_UI_R2':
      return process.env.NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2 === 'true';
  }
}
