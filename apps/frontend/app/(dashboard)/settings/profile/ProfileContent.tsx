'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Info } from 'lucide-react';
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
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border last:border-0">
      <dt className="text-sm font-medium text-muted-foreground sm:w-32 flex-shrink-0">{label}</dt>
      <dd className="text-sm mt-1 sm:mt-0">
        {value || <span className="text-muted-foreground/50">-</span>}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-24" />
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
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
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
      <Card>
        <CardHeader>
          <CardTitle>내 프로필</CardTitle>
          <CardDescription>현재 로그인한 사용자의 정보입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl>
            <ProfileField label="이름" value={profile.name} />
            <ProfileField label="이메일" value={profile.email} />
            <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border">
              <dt className="text-sm font-medium text-muted-foreground sm:w-32 flex-shrink-0">
                역할
              </dt>
              <dd className="mt-1 sm:mt-0">
                <Badge variant="secondary">{roleLabel}</Badge>
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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          프로필 정보는 Azure AD에서 동기화됩니다. 수정이 필요한 경우 IT 관리자에게 문의하세요.
        </AlertDescription>
      </Alert>
    </div>
  );
}
