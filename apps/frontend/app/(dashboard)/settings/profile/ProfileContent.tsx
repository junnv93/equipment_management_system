'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info, User as UserIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { type UserRole, type Site } from '@equipment-management/schemas';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  site?: Site;
  location?: string;
  teamId?: string;
  teamName?: string;
  position?: string;
  department?: string;
  phoneNumber?: string;
  employeeId?: string;
  managerName?: string;
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  const t = useTranslations('settings');
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/50 last:border-0 motion-safe:transition-colors motion-reduce:transition-none hover:bg-accent/30">
      <dt className="text-sm font-medium text-muted-foreground sm:w-40 flex-shrink-0 mb-1 sm:mb-0">
        {label}
      </dt>
      <dd className="text-sm font-mono text-foreground">
        {value || (
          <span className="text-muted-foreground/50 italic font-sans">
            {t('profile.notRegistered')}
          </span>
        )}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfileContent() {
  const t = useTranslations('settings');
  const tNav = useTranslations('navigation');
  const tEquip = useTranslations('equipment');

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    queryKey: queryKeys.settings.profile(),
    queryFn: async () => {
      const res = await apiClient.get<UserProfile>(API_ENDPOINTS.USERS.ME);
      return res.data;
    },
    staleTime: CACHE_TIMES.MEDIUM,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300"
      >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>{t('profile.loadError')}</AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return null;
  }

  // i18n을 통한 역할/사이트 라벨 (SSOT: navigation.roles.* / equipment.siteLabel.*)
  const roleLabel = tNav(`roles.${profile.role}` as Parameters<typeof tNav>[0]);
  const siteLabel = profile.site
    ? tEquip(`siteLabel.${profile.site}` as Parameters<typeof tEquip>[0])
    : undefined;

  return (
    <div className="space-y-6">
      {/* Profile Card with Enhanced Design */}
      <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md motion-safe:transition-shadow motion-safe:duration-300 motion-reduce:transition-none">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50 pb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 ring-4 ring-primary/5">
              <UserIcon className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-1.5">{t('profile.title')}</CardTitle>
              <CardDescription>{t('profile.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <dl className="divide-y divide-border/30">
            <ProfileField label={t('profile.fields.name')} value={profile.name} />
            <ProfileField label={t('profile.fields.email')} value={profile.email} />

            {/* Role with special styling */}
            <div className="group flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/50 motion-safe:transition-colors motion-reduce:transition-none hover:bg-accent/30">
              <dt className="text-sm font-medium text-muted-foreground sm:w-40 flex-shrink-0 mb-1 sm:mb-0">
                {t('profile.fields.role')}
              </dt>
              <dd>
                <Badge
                  variant="secondary"
                  className="font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 motion-safe:transition-colors motion-reduce:transition-none"
                >
                  {roleLabel}
                </Badge>
              </dd>
            </div>

            <ProfileField label={t('profile.fields.site')} value={siteLabel} />
            <ProfileField label={t('profile.fields.team')} value={profile.teamName} />
            <ProfileField label={t('profile.fields.position')} value={profile.position} />
            <ProfileField label={t('profile.fields.department')} value={profile.department} />
            <ProfileField label={t('profile.fields.phone')} value={profile.phoneNumber} />
            <ProfileField label={t('profile.fields.employeeId')} value={profile.employeeId} />
          </dl>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert
        className="border-info/30 bg-info/5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
        style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
      >
        <Info className="h-4 w-4 text-info-foreground" aria-hidden="true" />
        <AlertDescription className="text-sm leading-relaxed">
          {t.rich('profile.azureAdNote', {
            strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
          })}
        </AlertDescription>
      </Alert>
    </div>
  );
}
