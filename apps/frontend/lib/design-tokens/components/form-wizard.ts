/**
 * Form Wizard Component Tokens (Layer 3: Component-Specific)
 *
 * 멀티스텝 폼 위저드 컴포넌트의 디자인 값 SSOT
 * - Stepper (4단계: 기본정보 → 상태·위치 → 교정정보 → 이력·첨부)
 * - 관리번호 미리보기 바 (Sticky)
 * - 네비게이션 버튼 영역
 * - 스텝 전환 애니메이션
 *
 * 패턴: DISPOSAL_STEPPER_TOKENS과 동일한 구조 + error 상태 확장
 */

import { getTransitionClasses } from '../motion';

// ============================================================================
// Form Wizard Stepper Tokens
// ============================================================================

/**
 * 위저드 스테퍼 스타일 (4-step workflow, error 상태 포함)
 */
export const FORM_WIZARD_STEPPER_TOKENS = {
  /** 스텝 노드 크기 */
  node: {
    size: 'h-8 w-8',
    base: 'flex items-center justify-center rounded-full border-2',
  },

  /** 스텝 상태별 스타일 */
  status: {
    completed: 'border-green-500 bg-green-500 text-white',
    current: 'border-primary bg-primary text-primary-foreground',
    pending: 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400',
    error: 'border-destructive bg-destructive text-white',
  },

  /** 스텝 라벨 */
  label: {
    base: 'text-xs font-medium mt-1',
    completed: 'text-green-700 dark:text-green-400',
    current: 'text-primary',
    pending: 'text-gray-400',
    error: 'text-destructive',
  },

  /** 연결선 */
  connector: {
    base: 'h-[2px] flex-1',
    completed: 'bg-green-500',
    pending: 'bg-gray-200 dark:bg-gray-700',
  },

  /** 아이콘 */
  icon: 'h-4 w-4',

  /** 스테퍼 컨테이너 */
  container: 'flex items-start justify-between w-full pt-2 pb-4',

  /** 개별 스텝 래퍼 */
  step: 'flex flex-col items-center',

  /** 스텝 노드 + 연결선 행 */
  stepRow: 'flex items-center w-full',

  /** 클릭 가능 스텝 (완료된 스텝) */
  clickable: 'cursor-pointer',

  /** 클릭 불가 스텝 */
  nonClickable: 'cursor-default',
} as const;

// ============================================================================
// Management Number Preview Bar Tokens
// ============================================================================

/**
 * 관리번호 실시간 미리보기 바
 * - Stepper 하단에 sticky로 배치
 * - site/classification/serialNumber 입력 시 실시간 업데이트
 */
export const FORM_WIZARD_PREVIEW_BAR_TOKENS = {
  /** 컨테이너 (sticky + backdrop-blur) */
  container: [
    'sticky top-0 z-10',
    'flex items-center gap-3 px-4 py-2',
    'bg-background/90 backdrop-blur-sm',
    'border-b border-border/50',
    getTransitionClasses('fast', ['background-color', 'border-color']),
  ].join(' '),

  /** 레이블 */
  label: 'text-xs font-medium text-muted-foreground shrink-0',

  /** 구분자 */
  separator: 'text-muted-foreground/50 text-xs',

  /** 완성된 관리번호 */
  managementNumber: 'font-mono text-sm font-semibold text-primary tabular-nums',

  /** 미완성 플레이스홀더 */
  placeholder: 'font-mono text-sm text-muted-foreground/50 tabular-nums',

  /** 배지 그룹 */
  badgeGroup: 'flex items-center gap-1',

  /** 구성요소 배지 — 입력 완료 */
  badgeFilled: 'font-mono text-xs border-primary/50 text-primary',

  /** 구성요소 배지 — 미입력 플레이스홀더 */
  badgeEmpty: 'font-mono text-xs text-muted-foreground/50 border-dashed',
} as const;

// ============================================================================
// Form Wizard Step Transition Tokens
// ============================================================================

/**
 * 스텝 전환 애니메이션
 * - ANIMATION_PRESETS.slideUp 기반 (모션 토큰 참조)
 * - key={currentStep}으로 재마운트 트리거
 */
export const FORM_WIZARD_STEP_TRANSITION = {
  /** 진입 애니메이션 클래스 (motion-safe prefix 포함) */
  enter:
    'motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in motion-safe:duration-200',

  /** 스텝 콘텐츠 래퍼 */
  wrapper: 'space-y-6',
} as const;

// ============================================================================
// Form Wizard Completion Animation Tokens
// ============================================================================

/**
 * 스텝 완료 체크 아이콘 애니메이션
 * - 완료 상태 전환 시 zoom-in 효과
 */
export const FORM_WIZARD_COMPLETION_ANIMATION = {
  /** 체크 아이콘 애니메이션 클래스 */
  checkIcon: 'motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-150',
} as const;

// ============================================================================
// Form Wizard Navigation Tokens
// ============================================================================

/**
 * 위저드 네비게이션 버튼 영역
 */
export const FORM_WIZARD_NAVIGATION_TOKENS = {
  /** 전체 컨테이너 */
  container: 'flex justify-between items-center pt-4 border-t',

  /** 좌측 그룹 (취소, 이전) */
  leftGroup: 'flex gap-2',

  /** 우측 그룹 (다음, 등록) */
  rightGroup: 'flex gap-2',
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

type WizardStepStatus = 'completed' | 'current' | 'pending' | 'error';

/**
 * 위저드 스테퍼 노드 상태 클래스 반환
 */
export function getWizardStepperNodeClasses(status: WizardStepStatus): string {
  return [
    FORM_WIZARD_STEPPER_TOKENS.node.base,
    FORM_WIZARD_STEPPER_TOKENS.node.size,
    FORM_WIZARD_STEPPER_TOKENS.status[status],
  ].join(' ');
}

/**
 * 위저드 스테퍼 라벨 상태 클래스 반환
 */
export function getWizardStepperLabelClasses(status: WizardStepStatus): string {
  return [FORM_WIZARD_STEPPER_TOKENS.label.base, FORM_WIZARD_STEPPER_TOKENS.label[status]].join(
    ' '
  );
}

/**
 * 위저드 커넥터 상태 클래스 반환
 */
export function getWizardConnectorClasses(completed: boolean): string {
  return [
    FORM_WIZARD_STEPPER_TOKENS.connector.base,
    completed
      ? FORM_WIZARD_STEPPER_TOKENS.connector.completed
      : FORM_WIZARD_STEPPER_TOKENS.connector.pending,
  ].join(' ');
}
