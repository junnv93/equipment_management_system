/// <reference types="@testing-library/jest-dom" />
/**
 * SoftForkDialog — Phase 1B-E 단위 검증
 *
 * 시나리오:
 * 1. open=true면 dialog 렌더 + diff 카운트 표시
 * 2. canApplyForward=false면 apply_forward 옵션 disabled
 * 3. confirm 클릭 시 onChoice('this_only' | 'apply_forward') 호출
 * 4. cancel 클릭 시 onChoice('cancel') + onOpenChange(false)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SoftForkDialog } from '../SoftForkDialog';
import type { StructureDiff } from '@equipment-management/schemas';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params && 'count' in params) return `${key}:${params.count}`;
    return key;
  },
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

jest.mock('@/lib/design-tokens', () => ({
  INSPECTION_TEMPLATE_DIFF_TOKENS: {
    summary: 'summary',
    detailContainer: 'detailContainer',
    detailRow: 'detailRow',
    added: { badge: 'added-badge', icon: 'added-icon', text: 'added-text' },
    removed: { badge: 'removed-badge', icon: 'removed-icon', text: 'removed-text' },
    changed: { badge: 'changed-badge', icon: 'changed-icon', text: 'changed-text' },
  },
  INSPECTION_TEMPLATE_FORK_RADIO_TOKENS: {
    optionCard: 'optionCard',
    optionHeader: 'optionHeader',
    optionTitle: 'optionTitle',
    optionDescription: 'optionDescription',
    optionCheckmark: 'optionCheckmark',
  },
}));

jest.mock('@/lib/analytics/track', () => ({
  track: jest.fn(),
}));

const baseDiff: StructureDiff = {
  itemsAdded: ['신규항목'],
  itemsRemoved: [],
  itemsChanged: [],
  sectionsAdded: [],
  sectionsRemoved: [],
  sectionsTypeChanged: [],
  hasChanges: true,
};

describe('SoftForkDialog', () => {
  it('renders title + description + diff summary when open', () => {
    render(
      <SoftForkDialog
        open={true}
        onOpenChange={jest.fn()}
        diff={baseDiff}
        canApplyForward={true}
        onChoice={jest.fn()}
        isProcessing={false}
        inspectionType="intermediate"
      />
    );
    expect(screen.getByText('intermediateInspection.softFork.title')).toBeInTheDocument();
    // addedSummary count 1 표시
    expect(
      screen.getByText('intermediateInspection.softFork.diff.addedSummary:1')
    ).toBeInTheDocument();
  });

  it('disables apply_forward option when canApplyForward=false', () => {
    render(
      <SoftForkDialog
        open={true}
        onOpenChange={jest.fn()}
        diff={baseDiff}
        canApplyForward={false}
        onChoice={jest.fn()}
        isProcessing={false}
        inspectionType="intermediate"
      />
    );
    // disabled 사유 카피 노출 (descriptionDisabled)
    expect(
      screen.getByText('intermediateInspection.softFork.option.applyForward.descriptionDisabled')
    ).toBeInTheDocument();
  });

  it('calls onChoice with selected value on confirm', () => {
    const onChoice = jest.fn();
    render(
      <SoftForkDialog
        open={true}
        onOpenChange={jest.fn()}
        diff={baseDiff}
        canApplyForward={true}
        onChoice={onChoice}
        isProcessing={false}
        inspectionType="intermediate"
      />
    );
    // default selected = apply_forward (canApplyForward=true)
    fireEvent.click(screen.getByLabelText('intermediateInspection.softFork.confirmAriaLabel'));
    expect(onChoice).toHaveBeenCalledWith('apply_forward');
  });

  it('calls onChoice("cancel") + onOpenChange(false) on cancel', () => {
    const onChoice = jest.fn();
    const onOpenChange = jest.fn();
    render(
      <SoftForkDialog
        open={true}
        onOpenChange={onOpenChange}
        diff={baseDiff}
        canApplyForward={true}
        onChoice={onChoice}
        isProcessing={false}
        inspectionType="intermediate"
      />
    );
    fireEvent.click(screen.getByLabelText('intermediateInspection.softFork.cancelAriaLabel'));
    expect(onChoice).toHaveBeenCalledWith('cancel');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
