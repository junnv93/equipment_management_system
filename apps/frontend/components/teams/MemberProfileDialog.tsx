'use client';

import { User, Mail, Phone, Building2, BadgeCheck, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { USER_ROLE_LABELS } from '@equipment-management/shared-constants';
import { SITE_CONFIG } from '@/lib/api/teams-api';
import type { TeamMember } from '@/lib/api/teams-api';
import { ROLE_BADGE_TOKENS } from '@/lib/design-tokens';

interface MemberProfileDialogProps {
  member: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        {isLink ? (
          <dd>
            <a href={`mailto:${value}`} className="text-sm hover:underline truncate block">
              {value}
            </a>
          </dd>
        ) : (
          <dd className="text-sm truncate">{value}</dd>
        )}
      </div>
    </div>
  );
}

export function MemberProfileDialog({ member, open, onOpenChange }: MemberProfileDialogProps) {
  const t = useTranslations('teams');
  const roleLabel = USER_ROLE_LABELS[member.role as keyof typeof USER_ROLE_LABELS] || member.role;
  const siteLabel = member.site
    ? SITE_CONFIG[member.site as keyof typeof SITE_CONFIG]?.label
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('memberProfile.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 프로필 헤더 */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">{member.name}</h3>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                  ROLE_BADGE_TOKENS[member.role] || 'bg-muted'
                )}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <Separator />

          {/* 상세 정보 */}
          <dl className="space-y-3">
            {member.position && (
              <InfoRow
                icon={BadgeCheck}
                label={t('memberProfile.position')}
                value={member.position}
              />
            )}
            {member.department && (
              <InfoRow
                icon={Building2}
                label={t('memberProfile.department')}
                value={member.department}
              />
            )}
            {member.email && (
              <InfoRow icon={Mail} label={t('memberProfile.email')} value={member.email} isLink />
            )}
            {member.phoneNumber && (
              <InfoRow icon={Phone} label={t('memberProfile.phone')} value={member.phoneNumber} />
            )}
            {member.employeeId && (
              <InfoRow
                icon={BadgeCheck}
                label={t('memberProfile.employeeId')}
                value={member.employeeId}
              />
            )}
            {member.managerName && (
              <InfoRow icon={User} label={t('memberProfile.manager')} value={member.managerName} />
            )}
            {siteLabel && (
              <InfoRow icon={MapPin} label={t('memberProfile.site')} value={siteLabel} />
            )}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
