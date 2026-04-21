'use client';

import { Users, Building, PackageCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { CHECKOUT_INBOUND_SECTION_TOKENS, type InboundSectionVariant } from '@/lib/design-tokens';

const SECTION_ICONS: Record<InboundSectionVariant, LucideIcon> = {
  teamLoan: Users,
  externalRental: Building,
  internalShared: PackageCheck,
};

const SECTION_I18N_KEYS: Record<InboundSectionVariant, { title: string; description: string }> = {
  teamLoan: {
    title: 'inbound.sections.teamLoan.title',
    description: 'inbound.sections.teamLoan.description',
  },
  externalRental: {
    title: 'inbound.sections.externalRental.title',
    description: 'inbound.sections.externalRental.description',
  },
  internalShared: {
    title: 'inbound.sections.internalShared.title',
    description: 'inbound.sections.internalShared.description',
  },
};

interface InboundSectionHeaderProps {
  variant: InboundSectionVariant;
  count: number;
  isLoading?: boolean;
}

export function InboundSectionHeader({ variant, count, isLoading }: InboundSectionHeaderProps) {
  const t = useTranslations('checkouts');
  const Icon = SECTION_ICONS[variant];
  const keys = SECTION_I18N_KEYS[variant];
  const tokens = CHECKOUT_INBOUND_SECTION_TOKENS.header;

  return (
    <div className={tokens.wrapper}>
      <div className={[tokens.iconContainer.base, tokens.iconContainer[variant]].join(' ')}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <div className={tokens.titleRow}>
          <span className={tokens.title}>{t(keys.title as Parameters<typeof t>[0])}</span>
          {isLoading ? (
            <Skeleton className="h-4 w-8 rounded" aria-hidden="true" />
          ) : (
            <>
              <span className={tokens.countBadge} aria-hidden="true">
                {count}
              </span>
              <span className="sr-only">{count}건</span>
            </>
          )}
        </div>
        <p className={tokens.description}>{t(keys.description as Parameters<typeof t>[0])}</p>
      </div>
    </div>
  );
}
