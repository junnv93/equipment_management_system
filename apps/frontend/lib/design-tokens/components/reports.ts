/**
 * Reports Component Tokens
 *
 * 보고서 생성 페이지 디자인 토큰
 * - 헤더, 성공 배너, 설정 요약, 빈 상태
 * - 다크 모드 호환 시맨틱 컬러 사용
 */

import { getTransitionClasses } from '../motion';

/**
 * 페이지 헤더
 */
export const REPORTS_HEADER_TOKENS = {
  container: 'flex items-center justify-between mb-6',
  title: 'text-2xl font-bold tracking-tight text-foreground',
  subtitle: 'text-muted-foreground',
} as const;

/**
 * 성공 배너 (보고서 생성 완료)
 */
export const REPORTS_SUCCESS_BANNER_TOKENS = {
  container: [
    'mb-6 p-4 border rounded-md flex items-start space-x-2',
    'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    getTransitionClasses('fast', ['opacity']),
  ].join(' '),
  icon: 'h-5 w-5 mt-0.5',
  title: 'font-medium',
} as const;

/**
 * 설정 요약 카드
 */
export const REPORTS_SUMMARY_TOKENS = {
  container: 'border rounded-lg p-4 bg-muted/50',
  heading: 'font-medium mb-2',
  list: 'space-y-2 text-sm',
  row: 'flex justify-between',
  label: 'text-muted-foreground',
  value: 'font-medium',
  valueWithIcon: 'font-medium flex items-center',
} as const;

/**
 * 보고서 내용 목록
 */
export const REPORTS_CONTENT_LIST_TOKENS = {
  container: 'mt-4',
  heading: 'font-medium mb-2',
  list: 'list-disc pl-5 space-y-1 text-sm',
} as const;

/**
 * 빈 상태 (보고서 유형 미선택)
 */
export const REPORTS_EMPTY_STATE_TOKENS = {
  container: 'text-center p-4',
  icon: 'h-16 w-16 mx-auto mb-4 text-muted-foreground/30',
  text: 'text-muted-foreground',
} as const;

/**
 * 레이아웃
 */
export const REPORTS_LAYOUT_TOKENS = {
  grid: 'grid gap-6 md:grid-cols-2',
  formGroup: 'grid gap-6',
  fieldGroup: 'grid gap-3',
  optionSection: 'space-y-4',
  optionFieldGroup: 'grid gap-2',
  formatRow: 'flex items-center space-x-6',
  formatItem: 'flex items-center space-x-2',
  formatLabel: 'cursor-pointer flex items-center',
  submitButton: 'w-full mt-2',
} as const;

/**
 * 로딩 스피너
 */
export const REPORTS_SPINNER_TOKENS = {
  container: 'flex items-center',
  spinner: 'animate-spin -ml-1 mr-3 h-4 w-4 text-white',
} as const;

/**
 * 아이콘 공통 크기
 */
export const REPORTS_ICON_TOKENS = {
  inline: 'mr-2 h-4 w-4',
  inlineSmall: 'mr-1 h-4 w-4',
} as const;
