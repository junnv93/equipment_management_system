import { NC_WORKFLOW_GUIDANCE_TOKENS, resolveNCGuidanceKey } from '@/lib/design-tokens';
import koMessages from '@/messages/ko/non-conformances.json';
import enMessages from '@/messages/en/non-conformances.json';

describe('NC workflow guidance tokens', () => {
  it('routes blocked repair quality-manager cases to a role-aware guidance key', () => {
    const key = resolveNCGuidanceKey({
      status: 'open',
      canCloseNC: false,
      needsRepair: true,
      needsRecalibration: false,
      hasRejection: false,
      canCreateCalibration: false,
    });

    expect(key).toBe('openBlockedRepair_quality_manager');
    expect(NC_WORKFLOW_GUIDANCE_TOKENS[key].ctaKind).toBe('none');
    expect(NC_WORKFLOW_GUIDANCE_TOKENS[key].roleChip).toBe('blocked');
  });

  it('keeps repair operator guidance for users who can create prerequisite records', () => {
    const key = resolveNCGuidanceKey({
      status: 'open',
      canCloseNC: false,
      needsRepair: true,
      needsRecalibration: false,
      hasRejection: false,
      canCreateCalibration: true,
    });

    expect(key).toBe('openBlockedRepair_operator');
  });

  it('has ko/en copy for the repair quality-manager guidance key', () => {
    expect(koMessages.detail.guidance.openBlockedRepair_quality_manager.title).toBeTruthy();
    expect(enMessages.detail.guidance.openBlockedRepair_quality_manager.title).toBeTruthy();
  });
});
