'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PAGE_HEADER_TOKENS, SUB_PAGE_HEADER_TOKENS } from '@/lib/design-tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** 우측 액션 영역 (버튼, 드롭다운 등) */
  actions?: React.ReactNode;
  /** 뒤로가기 URL — 지정 시 SUB_PAGE_HEADER_TOKENS 자동 적용 */
  backUrl?: string;
  backLabel?: string;
}

/**
 * 통합 페이지 헤더 컴포넌트
 *
 * - backUrl 없음 → 리스트 페이지 (PAGE_HEADER_TOKENS)
 * - backUrl 있음 → 서브 페이지 (SUB_PAGE_HEADER_TOKENS)
 *
 * SSOT: page-layout.ts의 PAGE_HEADER_TOKENS / SUB_PAGE_HEADER_TOKENS 참조
 */
export function PageHeader({ title, subtitle, actions, backUrl, backLabel }: PageHeaderProps) {
  // 서브 페이지 (생성/편집/상세)
  if (backUrl) {
    return (
      <div className={SUB_PAGE_HEADER_TOKENS.container}>
        <Button variant="outline" size="icon" asChild>
          <Link href={backUrl} aria-label={backLabel}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className={SUB_PAGE_HEADER_TOKENS.titleGroup}>
          <h1 className={SUB_PAGE_HEADER_TOKENS.title}>{title}</h1>
          {subtitle && <p className={SUB_PAGE_HEADER_TOKENS.subtitle}>{subtitle}</p>}
        </div>
      </div>
    );
  }

  // 리스트/관리 페이지
  return (
    <div className={PAGE_HEADER_TOKENS.container}>
      <div className={PAGE_HEADER_TOKENS.titleGroup}>
        <h1 className={PAGE_HEADER_TOKENS.title}>{title}</h1>
        {subtitle && <p className={PAGE_HEADER_TOKENS.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={PAGE_HEADER_TOKENS.actionsGroup}>{actions}</div>}
    </div>
  );
}

export default PageHeader;
