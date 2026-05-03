'use client';

import { memo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CHAR_COUNTER_TOKENS, REQUIRED_FIELD_TOKENS } from '@/lib/design-tokens';

interface CharsCounterBaseProps {
  /** textarea aria-describedby 등에서 참조할 id */
  id?: string;
  /** 현재 입력 길이 */
  count: number;
  /** 사용자 정의 클래스 (REQUIRED_FIELD_TOKENS.charCount 위에 합성됨) */
  className?: string;
  /** SR 알림 정책. 기본 'polite' — 입력 중 시끄럽지 않게. 'off'는 정적 라벨 용도. */
  ariaLive?: 'polite' | 'off';
  /**
   * 사용자 정의 텍스트. 미지정 시 글로벌 `common.charCounter.ratio` i18n 키로 자동 렌더.
   * "X자 남음" 같은 다른 표현이 필요한 호출자만 children으로 override.
   */
  children?: ReactNode;
}

type CharsCounterProps =
  | (CharsCounterBaseProps & {
      /** count/max ratio counter. */
      mode?: 'ratio';
      /** 최대 허용 길이 */
      max: number;
      /**
       * warning 임계값 (0~1) override. 미지정 시 디자인 토큰 SSOT
       * (`CHAR_COUNTER_TOKENS.warningRatio`, 현재 0.8) 사용.
       */
      warningRatio?: number;
    })
  | (CharsCounterBaseProps & {
      /** minimum-length hint counter. */
      mode: 'min';
      /** 최소 요구 길이 */
      min: number;
    });

/**
 * 문자 수 카운터 SSOT — ratio 또는 min-hint 색상 자동 토글.
 *
 * ratio 색상 정책:
 *   - 0 ~ warningRatio*max:    text-muted-foreground  (REQUIRED_FIELD_TOKENS.charCount 기본)
 *   - warningRatio*max ~ max:  text-warning           (80~99% 구간 시각 경고)
 *   - ≥ max:                   text-destructive       (한도 도달 — submit 시 불가능 신호)
 *
 * min 색상 정책:
 *   - count < min:              text-destructive
 *   - count >= min:             text-muted-foreground
 *
 * 호출 예시:
 *   <CharsCounter count={value.length} max={500}>
 *     {t('common.charCountRatio', { count: value.length, max: 500 })}
 *   </CharsCounter>
 *
 *   <CharsCounter count={reason.length} max={MAX} aria-live="polite">
 *     {t('rejectModal.charsRemaining', { remaining: MAX - reason.length })}
 *   </CharsCounter>
 *
 * SSOT 경계:
 *   - 클래스 베이스: REQUIRED_FIELD_TOKENS.charCount (lib/design-tokens/form-field-tokens.ts)
 *   - 색상 토큰: text-warning / text-destructive — globals.css 정의 semantic
 *   - i18n: 호출자 책임 (children prop). 컴포넌트는 텍스트 무지각.
 *
 * 성능:
 *   - memo 래핑 — count/max/children 안정 시 미렌더.
 *   - 소비자가 children에 inline t() 호출하는 경우 부모 리렌더 시 children 재생성으로 memo 효과 제한 — 정상 동작.
 *
 * 접근성:
 *   - aria-live="polite" (기본) — 입력 중 textarea aria-describedby로 연결 권장.
 *   - role="status" — SR이 라이브 영역으로 인식 (alert보다 약한 우선순위).
 */
export const CharsCounter = memo(function CharsCounter({
  id,
  count,
  className,
  ariaLive = 'polite',
  children,
  ...props
}: CharsCounterProps) {
  const t = useTranslations('common');
  const isMinMode = props.mode === 'min';
  const isOverLimit = !isMinMode && count >= props.max;
  const isBelowMin = isMinMode && count < props.min;
  const isWarning =
    !isMinMode &&
    !isOverLimit &&
    count >= Math.floor(props.max * (props.warningRatio ?? CHAR_COUNTER_TOKENS.warningRatio));

  const stateClass =
    isOverLimit || isBelowMin
      ? CHAR_COUNTER_TOKENS.destructiveClass
      : isWarning
        ? CHAR_COUNTER_TOKENS.warningClass
        : undefined;

  return (
    <span
      id={id}
      className={cn(REQUIRED_FIELD_TOKENS.charCount, 'block', stateClass, className)}
      aria-live={ariaLive}
      role="status"
    >
      {children ??
        (isMinMode
          ? t('charCounter.min', { count, min: props.min })
          : t('charCounter.ratio', { count, max: props.max }))}
    </span>
  );
});
