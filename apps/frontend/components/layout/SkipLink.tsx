'use client';

import { useTranslations } from 'next-intl';

/**
 * SkipLink (Client Component)
 *
 * 키보드 사용자를 위한 스킵 네비게이션 링크
 * - Tab 키로 포커스 시 화면에 표시
 * - 메인 콘텐츠로 바로 이동 가능
 *
 * 접근성 (WCAG 2.1 AA):
 * - 첫 번째 Tab 이동 시 접근 가능
 * - 명확한 포커스 표시
 * - prefers-reduced-motion 존중
 */

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export function SkipLink({ href = '#main-content', children }: SkipLinkProps) {
  const t = useTranslations('navigation');
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      (target as HTMLElement).focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="
        sr-only focus-visible:not-sr-only
        focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-[100]
        focus-visible:px-4 focus-visible:py-2
        focus-visible:bg-brand-info focus-visible:text-white
        focus-visible:rounded-md focus-visible:shadow-lg
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        motion-safe:transition-[opacity,transform] motion-safe:duration-200
        motion-reduce:transition-none
      "
    >
      {children ?? t('layout.skipToContent')}
    </a>
  );
}
