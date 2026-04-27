'use client';

import Link from 'next/link';
import { X, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  PAGE_HEADER_TOKENS,
  SUB_PAGE_HEADER_TOKENS,
  PAGE_HEADER_ONBOARDING_TOKENS,
} from '@/lib/design-tokens';
import { useOnboardingHint } from '@/hooks/use-onboarding-hint';

export interface OnboardingHint {
  /** localStorage 키 (per-page 고유 — `onboarding-dismissed:<id>` 로 저장) */
  id: string;
  icon?: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  /** 권한 게이트 — 컨테이너에서 can(Permission.*) 결과를 주입. false이면 CTA 숨김. 미전달 시 항상 표시. */
  canShowPrimaryAction?: boolean;
  /** default: true */
  dismissible?: boolean;
}

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
  /** 처음 사용 유저 온보딩 힌트 배너 (리스트 페이지 전용) */
  onboardingHint?: OnboardingHint;
}

interface SubPageLinkProps extends BaseProps {
  backUrl: string;
  onBack?: undefined;
  backLabel?: string;
}

interface SubPageCallbackProps extends BaseProps {
  onBack: () => void;
  backUrl?: undefined;
  backLabel?: string;
}

export type PageHeaderProps = ListPageProps | SubPageLinkProps | SubPageCallbackProps;

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingHintBanner — 분리된 하위 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

function OnboardingHintBanner({ hint }: { hint: OnboardingHint }) {
  const { isVisible, dismiss } = useOnboardingHint(hint.id);
  const isDismissible = hint.dismissible !== false;

  if (!isVisible) return null;

  const showAction = hint.canShowPrimaryAction !== false;
  const Icon = hint.icon ?? Info;

  return (
    <div className={PAGE_HEADER_ONBOARDING_TOKENS.container} role="note">
      <div className={PAGE_HEADER_ONBOARDING_TOKENS.inner}>
        <div className={PAGE_HEADER_ONBOARDING_TOKENS.iconWrapper}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className={PAGE_HEADER_ONBOARDING_TOKENS.content}>
          <p className={PAGE_HEADER_ONBOARDING_TOKENS.title}>{hint.title}</p>
          <p className={PAGE_HEADER_ONBOARDING_TOKENS.description}>{hint.description}</p>
          {showAction && hint.primaryAction && (
            <div className={PAGE_HEADER_ONBOARDING_TOKENS.actions}>
              <Button size="sm" asChild>
                <Link href={hint.primaryAction.href}>{hint.primaryAction.label}</Link>
              </Button>
            </div>
          )}
        </div>
        {isDismissible && (
          <button
            type="button"
            className={PAGE_HEADER_ONBOARDING_TOKENS.dismissBtn}
            onClick={dismiss}
            aria-label="온보딩 힌트 닫기"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

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
  ...rest
}: PageHeaderProps) {
  const isSubPage = backUrl || onBack;
  const onboardingHint = !isSubPage ? (rest as ListPageProps).onboardingHint : undefined;

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
    <>
      {onboardingHint && <OnboardingHintBanner hint={onboardingHint} />}
      <div className={PAGE_HEADER_TOKENS.container}>
        <div className={PAGE_HEADER_TOKENS.titleGroup}>
          <h1 className={PAGE_HEADER_TOKENS.title}>{title}</h1>
          {subtitle && <p className={PAGE_HEADER_TOKENS.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={PAGE_HEADER_TOKENS.actionsGroup}>{actions}</div>}
      </div>
    </>
  );
}

export default PageHeader;
