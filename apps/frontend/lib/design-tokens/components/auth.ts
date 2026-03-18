/**
 * Auth Component Tokens
 *
 * 인증 관련 컴포넌트의 디자인 토큰
 * SSOT: 로그인/회원가입 UI의 모든 디자인 값은 여기서 정의
 */

import { MOTION_TOKENS, INTERACTIVE_TOKENS, CONTENT_TOKENS } from '../semantic';
import { TRANSITION_PRESETS } from '../motion';

/**
 * Auth Input Field Tokens
 *
 * Layer 3 아키텍처: Layer 2(semantic)만 참조
 */
export const AUTH_INPUT_TOKENS = {
  /** 인풋 필드 높이 */
  height: INTERACTIVE_TOKENS.size.comfortable, // 48px mobile, 44px desktop

  /** 아이콘 영역 여백 */
  iconPadding: { mobile: 40, desktop: 40 }, // 아이콘 공간 확보

  /** 아이콘 크기 */
  iconSize: INTERACTIVE_TOKENS.icon.standard, // 24px mobile, 20px desktop (semantic 표준)

  /** Border radius */
  borderRadius: INTERACTIVE_TOKENS.radius.default, // 6px (semantic 표준)

  /** Focus ring */
  focusRing: {
    width: 2,
    opacity: 0.2,
  },
} as const;

/**
 * Auth Motion Tokens
 */
export const AUTH_MOTION_TOKENS = {
  /** Form transition */
  formTransition: MOTION_TOKENS.transition.fast, // 200ms

  /** Success state transition */
  successTransition: MOTION_TOKENS.transition.moderate, // 300ms

  /** Error shake animation */
  errorShake: {
    duration: 500,
    keyframes:
      '@keyframes auth-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }',
  },

  /** Input focus scale */
  inputFocusScale: 1.01,

  /** Button hover scale */
  buttonHoverScale: 1.01,

  /** Button active scale */
  buttonActiveScale: 0.99,
} as const;

/**
 * Utility: Auth Input 클래스 생성
 *
 * @param hasError - 에러 상태 여부
 * @returns Tailwind 클래스 문자열
 *
 * @example
 * <Input className={getAuthInputClasses(!!errors.email)} />
 */
export function getAuthInputClasses(hasError = false): string {
  return [
    // Size
    'h-12', // 48px mobile (AUTH_INPUT_TOKENS.height)
    'pl-10', // Icon padding

    // Background
    'bg-white dark:bg-card',

    // Border
    'border-border',
    hasError
      ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
      : 'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',

    // Transition (TRANSITION_PRESETS.fastBorderShadow)
    TRANSITION_PRESETS.fastBorderShadow,
  ].join(' ');
}

/**
 * Utility: Auth Button 클래스 생성
 *
 * @param variant - 버튼 variant ('primary' | 'success')
 * @returns Tailwind 클래스 문자열
 *
 * @example
 * <Button className={getAuthButtonClasses(isSuccess ? 'success' : 'primary')} />
 */
export function getAuthButtonClasses(variant: 'primary' | 'success' = 'primary'): string {
  const baseClasses = [
    // Size
    'w-full h-12 text-base font-medium',

    // Focus
    'focus-visible:ring-2 focus-visible:ring-offset-2',

    // Transition (TRANSITION_PRESETS.fastBgColorShadowTransform)
    TRANSITION_PRESETS.fastBgColorShadowTransform,

    // Hover effects
    'hover:scale-[1.01] active:scale-[0.99]',
  ];

  const variantClasses = {
    primary: [
      'bg-ul-midnight hover:bg-ul-midnight-dark text-white',
      'focus-visible:ring-ul-midnight/50',
    ],
    success: ['bg-brand-ok hover:bg-brand-ok/90 text-white', 'focus-visible:ring-brand-ok/50'],
  };

  return [...baseClasses, ...variantClasses[variant]].join(' ');
}

/**
 * Utility: Auth Error Message 클래스
 */
export function getAuthErrorClasses(): string {
  return [
    'flex items-center gap-2 p-3',
    'text-sm text-destructive',
    'bg-destructive/10 border border-destructive/20',
    'rounded-lg',
  ].join(' ');
}

/**
 * Auth Content Tokens (SSOT)
 *
 * 모든 인증 페이지 텍스트의 단일 소스
 */
export const AUTH_CONTENT = {
  brand: {
    systemName: '장비 관리 시스템',
    systemNameKey: 'auth.errorPage.systemName',
    systemNameEn: 'Equipment Management System',
    companyName: 'UL Solutions',
    tagline: 'Working for a safer world.',
  },
  login: {
    heading: '시스템 로그인',
    headingKey: 'auth.login.heading',
    description: '장비 관리 시스템에 접근하려면 인증이 필요합니다',
    descriptionKey: 'auth.login.description',
    formHeading: '계정 로그인',
    formHeadingKey: 'auth.login.formHeading',
  },
  branding: {
    headline: '효율적인 장비 관리를',
    headlineKey: 'auth.branding.headline',
    headlineAccent: '통합 솔루션',
    headlineAccentKey: 'auth.branding.headlineAccent',
    headlineSuffix: '으로',
    headlineSuffixKey: 'auth.branding.headlineSuffix',
    subtitle: '시험소 장비의 등록, 교정, 대여, 반출을 한 곳에서 관리하세요.',
    subtitleKey: 'auth.branding.subtitle',
  },
  button: {
    login: '로그인',
    loginKey: 'auth.login.submitButton',
    loginLoading: '인증 진행 중\u2026', // WIG Rule 35: Loading states end with …
    loginLoadingKey: 'auth.login.submitting',
    loginSuccess: '인증 완료',
    loginSuccessKey: 'auth.login.submitSuccess',
    azureAd: 'Microsoft 계정으로 로그인',
    azureAdKey: 'auth.login.ssoButton',
    azureAdLoading: '연결 중\u2026',
    azureAdLoadingKey: 'auth.login.ssoLoading',
    skipToForm: '로그인 폼으로 이동',
    skipToFormKey: 'auth.login.skipToForm',
  },
  error: {
    authFailed: '이메일 또는 비밀번호가 일치하지 않습니다. 입력 내용을 확인해 주세요.',
    authFailedKey: 'auth.login.authFailed',
    systemError: '시스템 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    systemErrorKey: 'auth.login.systemError',
    configRequired: '인증 설정이 필요합니다.',
    configRequiredKey: 'auth.login.configRequired',
  },
  separator: '또는',
  separatorKey: 'auth.login.separator',
  copyright: (year: number) =>
    `\u00A9 ${year} ${AUTH_CONTENT.brand.systemNameEn}. All rights reserved.`,
  features: [
    {
      icon: 'Settings' as const,
      title: '체계적인 장비 관리',
      titleKey: 'auth.branding.features.management',
    },
    {
      icon: 'Calendar' as const,
      title: '실시간 교정 추적',
      titleKey: 'auth.branding.features.tracking',
    },
    {
      icon: 'Shield' as const,
      title: '역할 기반 승인',
      titleKey: 'auth.branding.features.approval',
    },
  ],
} as const;

/**
 * Auth Background Tokens
 *
 * 다크 테마 전용 — 전체 배경 + 미세 그리드 패턴 (연구소/측정 느낌)
 */
export const AUTH_BACKGROUND_TOKENS = {
  /** 전체 페이지 배경 (dark 강제) */
  page: 'bg-brand-bg-base min-h-screen',
  /** CSS-only 그리드 패턴 */
  grid: {
    opacity: 0.04,
    size: 48, // px
    lineColor: 'rgba(255,255,255,0.08)',
  },
} as const;

/**
 * Auth Split Screen Tokens
 *
 * Split Screen 레이아웃 — 좌 브랜딩 패널 + 우 로그인 폼
 */
export const AUTH_SPLIT_TOKENS = {
  left: {
    bg: '#122C49',
    gradient: 'radial-gradient(circle at 30% 70%, #1e3a5f 0%, #122C49 60%, #0a1c30 100%)',
    grid: { opacity: 0.04, size: 48, lineColor: 'rgba(255,255,255,0.08)' },
  },
  right: {
    grid: { opacity: 0.05, size: 48, lineColor: 'hsl(220 15% 60%)' },
  },
} as const;

/**
 * Auth Layout Tokens
 *
 * 중앙 카드 레이아웃 — "정밀 계측 연구소 출입 게이트"
 */
export const AUTH_LAYOUT_TOKENS = {
  /** 로고 컨테이너 */
  logo: {
    container: 'w-10 h-10',
    iconSize: 'w-5 h-5',
    borderRadius: 'rounded-lg',
  },
  /** 중앙 카드 */
  card: 'bg-brand-bg-surface border border-brand-border-subtle rounded-2xl p-8',
  /** 분리선 */
  separator: {
    container: 'relative flex items-center gap-4',
  },
  /** Microsoft 버튼 */
  microsoft: {
    bg: '#0078D4',
    bgHover: '#106EBE',
  },
} as const;

/**
 * Utility: Auth Interactive Scale 클래스 생성
 *
 * AzureAdButton 스케일 값 통일 (1.02/0.98 → 1.01/0.99)
 *
 * @returns Tailwind scale 클래스 문자열
 *
 * @example
 * <Button className={getAuthInteractiveScaleClasses()}>
 */
export function getAuthInteractiveScaleClasses(): string {
  return 'hover:scale-[1.01] active:scale-[0.99]';
}

/**
 * Animation: Stagger 딜레이 계산
 *
 * @param index - 아이템 인덱스
 * @param baseDelay - 기본 딜레이 (ms)
 * @param increment - 증가 딜레이 (ms)
 * @returns CSS animation-delay 값
 *
 * @example
 * style={{ animationDelay: getAuthStaggerDelay(1, 300, 100) }}
 * → '400ms'
 */
export function getAuthStaggerDelay(
  index: number,
  baseDelay: number = 200,
  increment: number = 100
): string {
  return `${baseDelay + index * increment}ms`;
}

// ─── Idle Timeout Dialog (무활동 타임아웃 경고) ──────────────────────────────

/**
 * Idle Timeout Dialog Tokens
 *
 * Layer 3 아키텍처: Layer 2(semantic) 참조
 * DeleteTeamModal의 AlertDialog 패턴과 시각적 일관성 유지
 */
export const IDLE_TIMEOUT_DIALOG_TOKENS = {
  /** 아이콘 컨테이너 (DeleteTeamModal 원형 배경 패턴) */
  iconContainer:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10',
  /** 아이콘 크기 + 색상 */
  iconSize: 'h-5 w-5 text-destructive',
  /** 카운트다운 링 SVG 수치 */
  ring: {
    size: 80,
    strokeWidth: 3,
  },
  /** 카운트다운 숫자 (Layer 2 CONTENT_TOKENS 참조 — 레이아웃 시프트 방지) */
  countdownText: `${CONTENT_TOKENS.numeric.tabular} text-2xl font-semibold leading-none`,
  /** 카운트다운 하위 라벨 */
  countdownLabel: 'text-xs text-muted-foreground mt-0.5',
  /** 링 트랙 (배경 원) 색상 */
  ringTrack: 'text-muted-foreground/20',
  /** 링 진행률 transition (motion-safe, specific property — transition-all 금지) */
  ringTransition:
    'motion-safe:transition-[stroke-dashoffset,color] motion-safe:duration-1000 motion-safe:ease-linear',
  /** 긴급 시각 전환 임계값 (초) — 이 시간 이하에서 amber → destructive */
  urgentThresholdSeconds: 60,
} as const;

/**
 * Utility: Idle Timeout 긴급도 기반 색상 클래스
 *
 * 남은 시간에 따라 warning(amber) → critical(destructive) 전환.
 * Visual Feedback 아키텍처의 urgency → color 매핑 원칙 준수.
 *
 * @param secondsRemaining - 자동 로그아웃까지 남은 초
 * @returns 텍스트/링 색상 클래스
 *
 * @example
 * const urgency = getIdleTimeoutUrgencyClasses(45); // ≤60s → destructive
 * <span className={urgency.text}>{countdown}</span>
 */
export function getIdleTimeoutUrgencyClasses(secondsRemaining: number): {
  text: string;
  ring: string;
} {
  const isUrgent = secondsRemaining <= IDLE_TIMEOUT_DIALOG_TOKENS.urgentThresholdSeconds;
  return {
    text: isUrgent ? 'text-destructive' : 'text-brand-warning',
    ring: isUrgent ? 'text-destructive' : 'text-brand-warning',
  };
}
