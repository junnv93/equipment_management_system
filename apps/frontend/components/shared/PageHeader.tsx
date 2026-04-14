'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PAGE_HEADER_TOKENS, SUB_PAGE_HEADER_TOKENS } from '@/lib/design-tokens';

interface BaseProps {
  title: string;
  subtitle?: string;
  /** 우측 액션 영역 (버튼, 드롭다운 등) */
  actions?: React.ReactNode;
}

interface ListPageProps extends BaseProps {
  backUrl?: undefined;
  onBack?: undefined;
  backLabel?: undefined;
}

interface SubPageLinkProps extends BaseProps {
  /** 뒤로가기 정적 URL (Link 기반) */
  backUrl: string;
  onBack?: undefined;
  backLabel?: string;
}

interface SubPageCallbackProps extends BaseProps {
  /** 뒤로가기 콜백 (router.back() 등 동적 네비게이션) */
  onBack: () => void;
  backUrl?: undefined;
  backLabel?: string;
}

type PageHeaderProps = ListPageProps | SubPageLinkProps | SubPageCallbackProps;

/**
 * 통합 페이지 헤더 컴포넌트
 *
 * 3가지 모드:
 * - 리스트 페이지: `<PageHeader title={} />` → PAGE_HEADER_TOKENS
 * - 서브 페이지 (정적 URL): `<PageHeader title={} backUrl="/teams" />` → SUB_PAGE_HEADER_TOKENS + Link
 * - 서브 페이지 (동적 back): `<PageHeader title={} onBack={() => router.back()} />` → SUB_PAGE_HEADER_TOKENS + Button onClick
 *
 * SSOT: page-layout.ts의 PAGE_HEADER_TOKENS / SUB_PAGE_HEADER_TOKENS 참조
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  backUrl,
  onBack,
  backLabel,
}: PageHeaderProps) {
  const isSubPage = backUrl || onBack;

  // 서브 페이지 (생성/편집/상세)
  if (isSubPage) {
    return (
      <div className={SUB_PAGE_HEADER_TOKENS.container}>
        {backUrl ? (
          <Button variant="outline" size="icon" asChild aria-label={backLabel}>
            <Link href={backUrl}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon" onClick={onBack} aria-label={backLabel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className={SUB_PAGE_HEADER_TOKENS.titleGroup}>
          <h1 className={SUB_PAGE_HEADER_TOKENS.title}>{title}</h1>
          {subtitle && <p className={SUB_PAGE_HEADER_TOKENS.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className="ml-auto shrink-0">{actions}</div>}
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
