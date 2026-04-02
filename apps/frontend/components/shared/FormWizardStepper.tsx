'use client';

import { useTranslations } from 'next-intl';
import { Check, AlertCircle } from 'lucide-react';
import {
  FORM_WIZARD_STEPPER_TOKENS,
  getWizardStepperNodeClasses,
  getWizardStepperLabelClasses,
  getWizardConnectorClasses,
  FOCUS_TOKENS,
  getTransitionClasses,
  type WizardStepStatus,
} from '@/lib/design-tokens';

export interface WizardStep {
  id: string;
  label: string;
  /** 이 스텝에서 검증할 react-hook-form 필드명 목록 */
  validationFields?: string[];
  /** true면 스텝 목록에서 숨김 (edit 모드의 Step 4 등) */
  hidden?: boolean;
}

interface FormWizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: Set<number>;
  errorSteps?: Set<number>;
  /** 완료된 스텝 클릭 시 해당 스텝으로 이동 */
  onStepClick?: (index: number) => void;
  /** 스테퍼 하단에 렌더링할 슬롯 (관리번호 미리보기 바 등) */
  previewBar?: React.ReactNode;
  className?: string;
}

function getStepStatus(
  index: number,
  currentStep: number,
  completedSteps: Set<number>,
  errorSteps: Set<number>
): WizardStepStatus {
  if (errorSteps.has(index)) return 'error';
  if (completedSteps.has(index)) return 'completed';
  if (index === currentStep) return 'current';
  return 'pending';
}

export function FormWizardStepper({
  steps,
  currentStep,
  completedSteps,
  errorSteps = new Set(),
  onStepClick,
  previewBar,
  className,
}: FormWizardStepperProps) {
  const tStep = useTranslations('common.stepStatus');
  const visibleSteps = steps.filter((s) => !s.hidden);

  return (
    <div className={className}>
      {/* 스테퍼 노드 행 */}
      <nav aria-label={tStep('stepNav')} className={FORM_WIZARD_STEPPER_TOKENS.container}>
        {visibleSteps.map((step, visibleIndex) => {
          // hidden 스텝을 제외한 실제 인덱스를 원본 steps 배열에서 찾기
          const originalIndex = steps.indexOf(step);
          const status = getStepStatus(originalIndex, currentStep, completedSteps, errorSteps);
          const isCompleted = status === 'completed';
          const isClickable = isCompleted && !!onStepClick;
          const isLast = visibleIndex === visibleSteps.length - 1;

          return (
            <div key={step.id} className={FORM_WIZARD_STEPPER_TOKENS.stepRow}>
              {/* 스텝 노드 + 라벨 */}
              <div className={FORM_WIZARD_STEPPER_TOKENS.step}>
                <button
                  type="button"
                  onClick={isClickable ? () => onStepClick(originalIndex) : undefined}
                  disabled={!isClickable}
                  aria-current={originalIndex === currentStep ? 'step' : undefined}
                  aria-label={`${step.label} - ${
                    status === 'completed'
                      ? tStep('completed')
                      : status === 'current'
                        ? tStep('current')
                        : status === 'error'
                          ? tStep('error')
                          : tStep('incomplete')
                  }`}
                  className={[
                    getWizardStepperNodeClasses(status),
                    isClickable
                      ? FORM_WIZARD_STEPPER_TOKENS.clickable
                      : FORM_WIZARD_STEPPER_TOKENS.nonClickable,
                    isClickable ? FOCUS_TOKENS.classes.default : '',
                    isClickable
                      ? `hover:opacity-80 ${getTransitionClasses('fast', ['opacity', 'transform'])} motion-safe:hover:scale-105`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {status === 'completed' ? (
                    <Check
                      className={[
                        FORM_WIZARD_STEPPER_TOKENS.icon,
                        'motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-150',
                      ].join(' ')}
                      aria-hidden
                    />
                  ) : status === 'error' ? (
                    <AlertCircle className={FORM_WIZARD_STEPPER_TOKENS.icon} aria-hidden />
                  ) : (
                    <span className="text-xs font-semibold tabular-nums">{visibleIndex + 1}</span>
                  )}
                </button>
                <span className={getWizardStepperLabelClasses(status)}>{step.label}</span>
              </div>

              {/* 연결선 (마지막 스텝 제외) */}
              {!isLast && (
                <div
                  className={[
                    getWizardConnectorClasses(isCompleted),
                    getTransitionClasses('moderate', ['background-color']),
                    'mx-2 self-start mt-4',
                  ].join(' ')}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* 미리보기 바 슬롯 */}
      {previewBar}
    </div>
  );
}
