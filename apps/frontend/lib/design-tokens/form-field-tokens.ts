/**
 * Form Field Tokens (Layer 2: 폼 필드 공통 SSOT)
 *
 * 필수/선택 필드 표시, char count, a11y 속성 등 폼 필드 공통 스타일 토큰.
 * 반출입/교정/부적합 등 전 도메인 form에서 재사용.
 *
 * WCAG 2.2 SC 3.3.2 (Labels or Instructions):
 *   - 필수 필드는 visual(`*`) + sr-only 텍스트 + aria-required 3중 표기
 *
 * SSOT 경계:
 *   - 색상 → brand.ts (text-brand-critical 등) — 직접 리터럴 금지, 헬퍼 경유
 *   - 필드 레이아웃 → 이 파일
 *   - 도메인 form 특화 스타일 → components/*.ts
 */

import { getSemanticContainerTextClasses, getSemanticLeftBorderClasses } from './brand';

/**
 * 필수 필드 시각화 토큰
 *
 * 색상은 brand.ts 헬퍼 경유 (SSOT) — `text-brand-critical` 리터럴 직접 사용 금지.
 *
 * @example 필수 필드 라벨
 * <Label className={REQUIRED_FIELD_TOKENS.labelWrapper}>
 *   {t('fields.cause')}
 *   <span className={REQUIRED_FIELD_TOKENS.asterisk} aria-hidden="true">*</span>
 *   <span className={REQUIRED_FIELD_TOKENS.srOnlyLabel}>{t('required')}</span>
 * </Label>
 * <Textarea
 *   className={REQUIRED_FIELD_TOKENS.inputBorder}
 *   {...REQUIRED_FIELD_A11Y}
 *   maxLength={500}
 * />
 * <div className={REQUIRED_FIELD_TOKENS.charCount}>{value.length} / 500</div>
 */
export const REQUIRED_FIELD_TOKENS = {
  /** 라벨 래퍼 — asterisk/sr-only와 정렬 */
  labelWrapper: 'flex items-center gap-1',
  /** 필수 표식 asterisk (시각용, aria-hidden) — brand.ts 헬퍼 경유 */
  asterisk: getSemanticContainerTextClasses('critical'),
  /** 스크린리더 전용 "필수" 텍스트 (i18n 키 값 삽입) */
  srOnlyLabel: 'sr-only',
  /** 필수 필드 textarea/input 좌측 강조 보더 — brand.ts 헬퍼 경유 */
  inputBorder: `border-l-[3px] ${getSemanticLeftBorderClasses('critical')}`,
  /** 문자 수 카운터 (우측 정렬, mono) */
  charCount: 'text-2xs font-mono text-muted-foreground text-right',
  /** 선택 필드 힌트 라벨 ("optional" 표기) */
  optionalHint: 'text-2xs font-mono text-muted-foreground',
} as const;

/**
 * 필수 필드 a11y 속성 상수
 *
 * `required` + `aria-required="true"` 페어를 한 곳에서 관리.
 * 컴포넌트에서 스프레드로 전달: `<Textarea {...REQUIRED_FIELD_A11Y} />`
 */
export const REQUIRED_FIELD_A11Y = {
  required: true,
  'aria-required': 'true',
} as const satisfies { required: true; 'aria-required': 'true' };
