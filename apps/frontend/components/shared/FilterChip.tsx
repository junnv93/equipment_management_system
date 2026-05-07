'use client';

import type { ReactNode } from 'react';
import { FILTER_CHIP_TOKENS } from '@/lib/design-tokens';

interface FilterChipProps {
  /** 필터 라벨 (예: "장비:") — `<span>` 으로 렌더된다. */
  label: string;
  /** 필터 값 — 문자열 또는 ReactNode. 비어있어도 chip 자체는 렌더된다 (호출자가 가드). */
  value: ReactNode;
  /** chip 해제 콜백. clear 버튼 클릭 시 호출. */
  onClear: () => void;
  /** clear 버튼의 a11y 라벨 — i18n 키 경유 필수 (하드코딩 금지). */
  clearAriaLabel: string;
  /** clear 버튼 텍스트 (예: "해제" / "Clear"). i18n 키 경유 필수. */
  clearLabel: string;
}

/**
 * FilterChip — deep-link 필터 (예: `?equipmentId=...`) 활성화 시 표시하는 SSOT chip.
 *
 * 도메인 중립 — calibration / checkouts / equipment 등 동일 패턴 재사용.
 * 디자인 토큰: `FILTER_CHIP_TOKENS` (`lib/design-tokens/components/filter-chip.ts`).
 */
export function FilterChip({ label, value, onClear, clearAriaLabel, clearLabel }: FilterChipProps) {
  return (
    <div className={FILTER_CHIP_TOKENS.container}>
      <span className={FILTER_CHIP_TOKENS.label}>{label}</span>
      <span className={FILTER_CHIP_TOKENS.value}>{value}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={clearAriaLabel}
        className={FILTER_CHIP_TOKENS.clearButton}
      >
        {clearLabel}
      </button>
    </div>
  );
}
