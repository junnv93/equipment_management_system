'use client';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export function SkipLink({ href = '#main-content', children = '메인 콘텐츠로 건너뛰기' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2
        focus:bg-blue-600 focus:text-white
        focus:rounded-md focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200
      "
    >
      {children}
    </a>
  );
}
