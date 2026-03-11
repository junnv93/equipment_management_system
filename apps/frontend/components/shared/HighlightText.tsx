'use client';

import { memo } from 'react';

interface HighlightTextProps {
  /** 표시할 텍스트 */
  text: string;
  /** 하이라이팅할 검색어 */
  search?: string;
  /** 하이라이트 스타일 (기본: 노란색 배경) */
  highlightClassName?: string;
}

/**
 * 검색어 하이라이팅 컴포넌트
 *
 * 텍스트 내에서 검색어와 일치하는 부분을 하이라이트 처리합니다.
 * - 대소문자 구분 없이 매칭
 * - 정규식 특수문자 이스케이프 처리
 * - memo로 불필요한 리렌더 방지
 *
 * @example
 * <HighlightText text="Sample Equipment" search="equip" />
 * // "Sample <mark>Equip</mark>ment"
 */
function HighlightTextComponent({
  text,
  search,
  highlightClassName = 'bg-brand-warning/20 rounded px-0.5',
}: HighlightTextProps) {
  if (!search || !text) return <>{text}</>;

  // 정규식 특수문자 이스케이프
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearch})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export const HighlightText = memo(HighlightTextComponent);
export default HighlightText;
