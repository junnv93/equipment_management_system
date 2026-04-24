/**
 * NextStepPanel Stories — 공용 FSM 다음 단계 안내 패널
 *
 * variant: floating / inline / compact
 * urgency: normal / warning / critical
 */
import type { Meta, StoryObj } from '@storybook/react';

import type { NextStepDescriptor } from '@equipment-management/schemas';

import { NextStepPanel } from './NextStepPanel';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PENDING_DESCRIPTOR: NextStepDescriptor = {
  currentStatus: 'pending',
  currentStepIndex: 1,
  totalSteps: 5,
  nextAction: 'approve',
  nextActor: 'approver',
  nextStatus: 'approved',
  availableToCurrentUser: false,
  blockingReason: 'permission',
  labelKey: 'approve',
  hintKey: 'waitingApprover',
  urgency: 'normal',
};

const PENDING_APPROVER_DESCRIPTOR: NextStepDescriptor = {
  ...PENDING_DESCRIPTOR,
  availableToCurrentUser: true,
  blockingReason: null,
  hintKey: 'pendingApprove',
};

const APPROVED_DESCRIPTOR: NextStepDescriptor = {
  currentStatus: 'approved',
  currentStepIndex: 2,
  totalSteps: 5,
  nextAction: 'start',
  nextActor: 'requester',
  nextStatus: 'checked_out',
  availableToCurrentUser: true,
  blockingReason: null,
  labelKey: 'start',
  hintKey: 'approvedStart',
  urgency: 'normal',
};

const OVERDUE_DESCRIPTOR: NextStepDescriptor = {
  currentStatus: 'overdue',
  currentStepIndex: 3,
  totalSteps: 5,
  nextAction: 'submit_return',
  nextActor: 'requester',
  nextStatus: 'returned',
  availableToCurrentUser: true,
  blockingReason: null,
  labelKey: 'submit_return',
  hintKey: 'overdueReturn',
  urgency: 'critical',
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

const LENDER_CHECKED_DESCRIPTOR: NextStepDescriptor = {
  currentStatus: 'lender_checked',
  currentStepIndex: 3,
  totalSteps: 7,
  nextAction: 'borrower_receive',
  nextActor: 'borrower',
  nextStatus: 'borrower_received',
  availableToCurrentUser: true,
  blockingReason: null,
  labelKey: 'borrower_receive',
  hintKey: 'lenderCheckedBorrowerReceive',
  urgency: 'normal',
};

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof NextStepPanel> = {
  title: 'Shared/NextStepPanel',
  component: NextStepPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'FSM NextStepDescriptor를 기반으로 다음 단계를 안내하는 공용 패널. variant로 floating/inline/compact를 선택할 수 있습니다.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['floating', 'inline', 'compact'],
    },
    isPending: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof NextStepPanel>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** 승인 대기 중 — 현재 사용자가 승인 권한 없음 (actor hint만 표시) */
export const PendingWaitingApprover: Story = {
  name: 'Pending — 승인 대기 (권한 없음)',
  args: {
    descriptor: PENDING_DESCRIPTOR,
    variant: 'inline',
  },
};

/** 승인자 뷰 — 승인 버튼 활성화 */
export const PendingApproverView: Story = {
  name: 'Pending — 승인자 뷰 (버튼 활성)',
  args: {
    descriptor: PENDING_APPROVER_DESCRIPTOR,
    variant: 'inline',
    onActionClick: () => {},
  },
};

/** 승인 완료 — 반출 시작 가능 */
export const ApprovedCanStart: Story = {
  name: 'Approved — 반출 시작 가능',
  args: {
    descriptor: APPROVED_DESCRIPTOR,
    variant: 'inline',
    onActionClick: () => {},
  },
};

/** 연체 — critical urgency (animate-pulse) */
export const OverdueCritical: Story = {
  name: 'Overdue — critical urgency',
  args: {
    descriptor: OVERDUE_DESCRIPTOR,
    variant: 'inline',
    onActionClick: () => {},
  },
};

/** 반납 승인 완료 — terminal state */
export const TerminalReturnApproved: Story = {
  name: 'Terminal — 반납 승인 완료',
  args: {
    descriptor: TERMINAL_DESCRIPTOR,
    variant: 'inline',
  },
};

/** 다크 모드 — pending 상태 */
export const DarkModePending: Story = {
  name: 'Dark Mode — Pending',
  parameters: {
    backgrounds: { default: 'dark' },
    themes: { default: 'dark' },
  },
  args: {
    descriptor: PENDING_APPROVER_DESCRIPTOR,
    variant: 'inline',
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

/** Floating variant — 모달/강조 수준 */
export const InlineVariant: Story = {
  name: 'Variant — inline',
  args: {
    descriptor: APPROVED_DESCRIPTOR,
    variant: 'inline',
  },
};

/** Compact variant — 좁은 공간용 */
export const CompactVariant: Story = {
  name: 'Variant — compact',
  args: {
    descriptor: APPROVED_DESCRIPTOR,
    variant: 'compact',
  },
};

/** Floating variant — 강조 패널 */
export const PendingVariant: Story = {
  name: 'Variant — floating',
  args: {
    descriptor: PENDING_APPROVER_DESCRIPTOR,
    variant: 'floating',
    onActionClick: () => {},
  },
};

/** 렌탈 — 빌린 사람 수령 확인 (borrower_receive) */
export const BorrowerReceiveView: Story = {
  name: 'Rental — 빌린 사람 수령 확인',
  args: {
    descriptor: LENDER_CHECKED_DESCRIPTOR,
    variant: 'inline',
    onActionClick: () => {},
  },
};
