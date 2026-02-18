/**
 * Auth Component Tokens
 *
 * 인증 관련 컴포넌트의 디자인 토큰
 * SSOT: 로그인/회원가입 UI의 모든 디자인 값은 여기서 정의
 */

import { MOTION_TOKENS, INTERACTIVE_TOKENS } from '../semantic';

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

    // Transition
    'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 motion-reduce:transition-none',
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

    // Transition
    'motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none',

    // Hover effects
    'hover:scale-[1.01] active:scale-[0.99]',
  ];

  const variantClasses = {
    primary: [
      'bg-ul-midnight hover:bg-ul-midnight-dark text-white',
      'focus-visible:ring-ul-midnight/50',
    ],
    success: ['bg-ul-green hover:bg-ul-green text-white', 'focus-visible:ring-ul-green/50'],
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
 */
export const AUTH_BACKGROUND_TOKENS = {
  /** BrandingSection 그리드 패턴 */
  grid: {
    opacity: 0.03,
    size: 48, // px
    lineColor: 'rgba(255,255,255,0.1)',
  },
  /** BrandingSection 그라데이션 */
  gradient: 'bg-gradient-to-br from-ul-midnight to-ul-midnight-dark',
} as const;

/**
 * Auth Layout Tokens
 */
export const AUTH_LAYOUT_TOKENS = {
  /** 로고 컨테이너 — SSOT (파일 간 w-12 vs w-11 불일치 해결) */
  logo: {
    container: 'w-12 h-12',
    iconSize: 'w-6 h-6',
    borderRadius: 'rounded-xl',
  },
  /** Feature 아이콘 컨테이너 */
  featureIcon: {
    container: 'w-10 h-10',
    iconSize: 'w-5 h-5',
  },
  /** 카드 스타일 */
  card: 'bg-card rounded-2xl border border-border p-8',
  /** 분리선 */
  separator: {
    container: 'relative flex items-center gap-4',
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
