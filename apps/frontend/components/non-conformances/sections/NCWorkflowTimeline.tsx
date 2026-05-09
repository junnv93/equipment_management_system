'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { NonConformanceStatusValues as NCVal } from '@equipment-management/schemas';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import { type NonConformanceStatus } from '@equipment-management/schemas';
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import {
  NC_WORKFLOW_STEPS,
  NC_WORKFLOW_TOKENS,
  getNCWorkflowNodeClasses,
  getNCWorkflowLabelClasses,
  getNCWorkflowConnectorClasses,
} from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { resolveDisplayName } from '@/lib/utils/display-name';
import { cn } from '@/lib/utils';

const NC_STEP_ICONS: Record<(typeof NC_WORKFLOW_STEPS)[number], typeof AlertTriangle> = {
  open: AlertTriangle,
  corrected: CheckCircle2,
  closed: Lock,
};

export interface WorkflowTimelineProps {
  nc: NonConformance;
  currentStepIndex: number;
  isLongOverdue: boolean;
}

export function WorkflowTimeline({ nc, currentStepIndex, isLongOverdue }: WorkflowTimelineProps) {
  const t = useTranslations('non-conformances');
  const workflowLabels: Record<(typeof NC_WORKFLOW_STEPS)[number], string> = {
    open: t('detail.workflow.open'),
    corrected: t('detail.workflow.corrected'),
    closed: t('detail.workflow.closed'),
  };

  return (
    <div
      className={cn(
        NC_WORKFLOW_TOKENS.container,
        isLongOverdue && NC_WORKFLOW_TOKENS.containerUrgent
      )}
    >
      {/* flex sibling 패턴: 커넥터가 step div 밖 flex item — 절대 포지셔닝/z-index 전쟁 없음 */}
      <div className={NC_WORKFLOW_TOKENS.stepsLayout}>
        {NC_WORKFLOW_STEPS.map((stepKey: NonConformanceStatus, idx: number) => {
          const Icon = NC_STEP_ICONS[stepKey];
          return (
            <Fragment key={stepKey}>
              {/* 커넥터 — step div 밖 flex sibling (mt-5 = 노드 h-10 중심 맞춤) */}
              {idx > 0 && (
                <div className={getNCWorkflowConnectorClasses(idx - 1, currentStepIndex)} />
              )}
              {/* 스텝 */}
              <div className={NC_WORKFLOW_TOKENS.step}>
                {/* 노드 */}
                <div className={getNCWorkflowNodeClasses(idx, currentStepIndex, isLongOverdue)}>
                  {idx < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {/* 라벨 */}
                <span className={getNCWorkflowLabelClasses(idx, currentStepIndex, isLongOverdue)}>
                  {workflowLabels[stepKey]}
                </span>
                {/* 날짜 */}
                <StepDate nc={nc} stepKey={stepKey} />
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function StepDate({ nc, stepKey }: { nc: NonConformance; stepKey: NonConformanceStatus }) {
  const { fmtDate } = useDateFormatter();
  let dateStr: string | null = null;
  let actor: string | null = null;

  switch (stepKey) {
    case NCVal.OPEN:
      dateStr = nc.discoveryDate;
      actor = resolveDisplayName(nc.discoverer?.name, nc.discoveredBy);
      break;
    case NCVal.CORRECTED:
      dateStr = nc.correctionDate;
      actor = resolveDisplayName(nc.corrector?.name, nc.correctedBy);
      break;
    case NCVal.CLOSED:
      dateStr = nc.closedAt;
      actor = resolveDisplayName(nc.closer?.name, nc.closedBy);
      break;
  }

  if (!dateStr) return null;

  return (
    <>
      {dateStr && <span className={NC_WORKFLOW_TOKENS.date}>{fmtDate(dateStr)}</span>}
      {actor && <span className={NC_WORKFLOW_TOKENS.actor}>{actor}</span>}
    </>
  );
}
