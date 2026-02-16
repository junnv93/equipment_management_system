'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info, User as UserIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  USER_ROLE_LABELS,
  SITE_LABELS,
  type UserRole,
  type Site,
} from '@equipment-management/schemas';

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
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/50 last:border-0 motion-safe:transition-colors motion-reduce:transition-none hover:bg-accent/30">
      <dt className="text-sm font-medium text-muted-foreground sm:w-40 flex-shrink-0 mb-1 sm:mb-0">
        {label}
      </dt>
      <dd className="text-sm font-mono text-foreground">
        {value || <span className="text-muted-foreground/50 italic font-sans">미등록</span>}
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
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    queryKey: queryKeys.settings.profile(),
    queryFn: () => apiClient.get(API_ENDPOINTS.USERS.ME),
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
        <AlertDescription>프로필 정보를 불러오는데 실패했습니다.</AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return null;
  }

  const roleLabel = USER_ROLE_LABELS[profile.role] || profile.role;
  const siteLabel = profile.site ? SITE_LABELS[profile.site] || profile.site : undefined;

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
              <CardTitle className="text-xl mb-1.5">내 프로필</CardTitle>
              <CardDescription>
                현재 로그인한 사용자의 정보입니다. Azure AD에서 동기화됩니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <dl className="divide-y divide-border/30">
            <ProfileField label="이름" value={profile.name} />
            <ProfileField label="이메일" value={profile.email} />

            {/* Role with special styling */}
            <div className="group flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/50 motion-safe:transition-colors motion-reduce:transition-none hover:bg-accent/30">
              <dt className="text-sm font-medium text-muted-foreground sm:w-40 flex-shrink-0 mb-1 sm:mb-0">
                역할
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

            <ProfileField label="사이트" value={siteLabel} />
            <ProfileField label="팀" value={profile.teamName} />
            <ProfileField label="직위" value={profile.position} />
            <ProfileField label="부서" value={profile.department} />
            <ProfileField label="회사 전화" value={profile.phoneNumber} />
            <ProfileField label="사원번호" value={profile.employeeId} />
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
          프로필 정보는 <strong className="font-semibold">Azure AD</strong>에서 동기화됩니다. 수정이
          필요한 경우 IT 관리자에게 문의하세요.
        </AlertDescription>
      </Alert>
    </div>
  );
}
