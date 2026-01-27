'use client';

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

export function SkipLink({ href = '#main-content', children = '메인 콘텐츠로 건너뛰기' }: SkipLinkProps) {
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
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2
        focus:bg-blue-600 focus:text-white
        focus:rounded-md focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        motion-safe:transition-all motion-safe:duration-200
        motion-reduce:transition-none
      "
    >
      {children}
    </a>
  );
}
