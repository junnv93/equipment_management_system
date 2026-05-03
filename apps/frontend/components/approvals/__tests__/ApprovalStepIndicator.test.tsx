/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';
import { UnifiedApprovalStatusValues as UASVal } from '@equipment-management/schemas';
import { ApprovalStepIndicator } from '../ApprovalStepIndicator';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ApprovalStepIndicator', () => {
  it('renders a visual start marker only for disposal flow', () => {
    const { rerender } = render(
      <ApprovalStepIndicator type="disposal" currentStatus={UASVal.PENDING_REVIEW} />
    );

    expect(screen.getByText('▸')).toBeInTheDocument();
    expect(screen.getByLabelText('steps.startNodeLabel')).toBeInTheDocument();

    rerender(
      <ApprovalStepIndicator type="calibration_plan" currentStatus={UASVal.PENDING_REVIEW} />
    );

    expect(screen.queryByText('▸')).not.toBeInTheDocument();
    expect(screen.getByLabelText('steps.startNodeLabel')).toBeInTheDocument();
  });
});
