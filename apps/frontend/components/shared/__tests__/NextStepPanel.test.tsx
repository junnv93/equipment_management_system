/**
 * NextStepPanel — 공용 FSM 다음 단계 안내 패널
 *
 * @testing-library/react 사용 (jest-axe 미설치)
 */
/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from '@testing-library/react';

import type { NextStepDescriptor } from '@equipment-management/schemas';

import { NextStepPanel } from '../NextStepPanel';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_DESCRIPTOR: NextStepDescriptor = {
  currentStatus: 'pending',
  currentStepIndex: 1,
  totalSteps: 5,
  nextAction: 'approve',
  nextActor: 'approver',
  nextStatus: 'approved',
  availableToCurrentUser: true,
  blockingReason: null,
  labelKey: 'approve',
  hintKey: 'pendingApprove',
  urgency: 'normal',
};

const TERMINAL_DESCRIPTOR: NextStepDescriptor = {
  currentStatus: 'return_approved',
  currentStepIndex: 5,
  totalSteps: 5,
  nextAction: null,
  nextActor: 'none',
  nextStatus: null,
  availableToCurrentUser: false,
  blockingReason: null,
  labelKey: 'terminal',
  hintKey: 'terminal',
  urgency: 'normal',
};

const BLOCKED_DESCRIPTOR: NextStepDescriptor = {
  ...BASE_DESCRIPTOR,
  availableToCurrentUser: false,
  blockingReason: 'permission',
};

const CRITICAL_DESCRIPTOR: NextStepDescriptor = {
  ...BASE_DESCRIPTOR,
  currentStatus: 'overdue',
  urgency: 'critical',
  hintKey: 'overdueReturn',
  nextAction: 'submit_return',
  labelKey: 'submit_return',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NextStepPanel', () => {
  it('terminal 상태 (nextAction=null): terminal 배지 렌더, 버튼 없음', () => {
    render(<NextStepPanel descriptor={TERMINAL_DESCRIPTOR} />);

    // terminal 배지 텍스트 (i18n mock: key 그대로 반환)
    expect(screen.getByText('hint.terminal')).toBeInTheDocument();

    // 액션 버튼 없음
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('availableToCurrentUser=true: 버튼 렌더, onActionClick 호출', () => {
    const handleAction = jest.fn();
    render(
      <NextStepPanel
        descriptor={BASE_DESCRIPTOR}
        onActionClick={handleAction}
        data-testid="next-step"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(handleAction).toHaveBeenCalledWith('approve');
  });

  it('availableToCurrentUser=false: 버튼 없음, actor hint 표시', () => {
    render(<NextStepPanel descriptor={BLOCKED_DESCRIPTOR} />);

    // 버튼 없음
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // actor hint 텍스트는 존재 (p 태그로 렌더)
    // actor.approver 키가 여러 번 렌더될 수 있으므로 getAll 사용
    const actorTexts = screen.getAllByText('actor.approver');
    expect(actorTexts.length).toBeGreaterThan(0);
  });

  it('isPending=true: 버튼 disabled + aria-disabled="true"', () => {
    render(
      <NextStepPanel descriptor={BASE_DESCRIPTOR} isPending={true} onActionClick={jest.fn()} />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('urgency=critical: animate-pulse 클래스 포함', () => {
    const { container } = render(<NextStepPanel descriptor={CRITICAL_DESCRIPTOR} />);

    // NEXT_STEP_PANEL_TOKENS.urgency.critical 에 animate-pulse 포함
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('animate-pulse');
  });
});
