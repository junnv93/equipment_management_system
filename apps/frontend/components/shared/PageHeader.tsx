'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  backUrl?: string;
  backLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  actionButton,
  backUrl,
  backLabel = '뒤로 가기',
}: PageHeaderProps) {
  // 컴포넌트 구현
  return (
    <div className="flex flex-col space-y-2 mb-6">
      {backUrl && (
        <div className="mb-2">
          <Button variant="ghost" size="sm" asChild className="gap-1 px-2 h-8">
            <Link href={backUrl}>
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {actionButton && <div className="flex-shrink-0 mt-2 sm:mt-0">{actionButton}</div>}
      </div>
    </div>
  );
}

// default export 추가 (레거시 호환성)
export default PageHeader;
