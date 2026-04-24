'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import calibrationPlansApi, { ExternalEquipment } from '@/lib/api/calibration-plans-api';
import { SITE_LABELS } from '@equipment-management/schemas';
import teamsApi from '@/lib/api/teams-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { ArrowLeft, Save, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TEAM_RESTRICTED_ROLES,
  SELECTOR_PAGE_SIZE,
  Permission,
} from '@equipment-management/shared-constants';
import type { UserRole, Site } from '@equipment-management/schemas';
import {
  CALIBRATION_PLAN_CREATE_TOKENS,
  NUMERIC_TOKENS,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { usePermissionGuard } from '@/hooks/use-permission-guard';

export default function CreateCalibrationPlanContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: session } = useSession();
  const t = useTranslations('calibration');

  // 권한 가드: CREATE_CALIBRATION_PLAN 없으면 목록으로 리다이렉트
  const { allowed, loading: guardLoading } = usePermissionGuard(Permission.CREATE_CALIBRATION_PLAN);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const [selectedYear, setSelectedYear] = useState<string>(String(nextYear));
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // 세션 기반 기본값 설정
  useEffect(() => {
    if (session?.user) {
      if (session.user.site && !selectedSite) {
        setSelectedSite(session.user.site);
      }
      if (session.user.teamId && !selectedTeamId) {
        setSelectedTeamId(session.user.teamId);
      }
    }
  }, [session, selectedSite, selectedTeamId]);

  // 역할 확인
  const userRole = session?.user?.role;
  const isTeamRestricted = userRole && TEAM_RESTRICTED_ROLES.includes(userRole as UserRole);

  // 팀 목록 조회 (사이트 선택 시)
  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.list({ site: selectedSite || undefined }),
    queryFn: () =>
      teamsApi.getTeams({
        site: (selectedSite as Site) || undefined,
        pageSize: SELECTOR_PAGE_SIZE,
      }),
    enabled: !!selectedSite,
  });

  const teams = teamsData?.data || [];

  // 외부교정 대상 장비 조회 (teamId 필터 추가)
  const {
    data: equipment,
    isLoading: isLoadingEquipment,
    isError: isEquipmentError,
  } = useQuery({
    queryKey: queryKeys.calibrationPlans.externalEquipment(
      selectedYear,
      selectedSite,
      selectedTeamId
    ),
    queryFn: () =>
      calibrationPlansApi.getExternalEquipment({
        year: selectedYear ? Number(selectedYear) : undefined,
        siteId: selectedSite || undefined,
        teamId: selectedTeamId || undefined,
      }),
    enabled: !!selectedYear && !!selectedSite,
  });

  // 계획서 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: calibrationPlansApi.createCalibrationPlan,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.calibrationPlans.lists() });
      toast({
        title: t('planCreate.toasts.createSuccess'),
        description: t('planCreate.toasts.createSuccessDesc', {
          year: selectedYear,
          site: SITE_LABELS[selectedSite as Site],
        }),
      });
      router.push(`/calibration-plans/${data.id}`);
    },
    onError: (error: unknown) => {
      toast({
        title: t('planCreate.toasts.createError'),
        description: getErrorMessage(error, t('planCreate.toasts.createError')),
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    if (!selectedYear || !selectedSite) {
      toast({
        title: t('planCreate.toasts.missingInfo'),
        description: t('planCreate.toasts.selectYearAndSite'),
        variant: 'destructive',
      });
      return;
    }

    // TM/TE는 teamId 필수
    if (isTeamRestricted && !selectedTeamId) {
      toast({
        title: t('planCreate.toasts.missingInfo'),
        description: t('planCreate.toasts.selectTeam'),
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      year: Number(selectedYear),
      siteId: selectedSite,
      teamId: selectedTeamId || undefined,
    });
  };

  // 연도 옵션 생성 (현재 연도 ~ +2년)
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear + i);

  // 권한 가드: 로딩 중이거나 미허용 시 렌더링 차단
  if (guardLoading || !allowed) return null;

  return (
    <div className={getPageContainerClasses()}>
      <div className={CALIBRATION_PLAN_CREATE_TOKENS.header.container}>
        <Button variant="ghost" size="icon" asChild aria-label={t('planCreate.backToList')}>
          <Link href="/calibration-plans">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className={CALIBRATION_PLAN_CREATE_TOKENS.header.title}>{t('planCreate.title')}</h1>
          <p className={CALIBRATION_PLAN_CREATE_TOKENS.header.subtitle}>
            {t('planCreate.description')}
          </p>
        </div>
      </div>

      {/* 기본 정보 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('planCreate.basicInfo.title')}</CardTitle>
          <CardDescription>{t('planCreate.basicInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={CALIBRATION_PLAN_CREATE_TOKENS.form.grid}>
            <div className="space-y-2">
              <Label htmlFor="year">{t('planCreate.fields.year')} *</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder={t('planCreate.fields.yearPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {t('planCreate.fields.yearUnit', { year })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site">{t('planCreate.fields.site')} *</Label>
              <Select
                value={selectedSite}
                onValueChange={setSelectedSite}
                disabled={!!isTeamRestricted && !!session?.user?.site}
              >
                <SelectTrigger id="site">
                  <SelectValue placeholder={t('planCreate.fields.sitePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SITE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">
                {t('planCreate.fields.team')} {isTeamRestricted && '*'}
                {isTeamRestricted && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {t('planCreate.fields.teamRestricted')}
                  </span>
                )}
              </Label>
              <Select
                value={selectedTeamId || '_all'}
                onValueChange={(v) => setSelectedTeamId(v === '_all' ? '' : v)}
                disabled={!selectedSite || (!!isTeamRestricted && !!session?.user?.teamId)}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder={t('planCreate.fields.teamPlaceholder')}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {selectedTeamId
                        ? teams.find((tm) => tm.id === selectedTeamId)?.name ||
                          t('planCreate.fields.teamPlaceholder')
                        : t('planCreate.fields.teamPlaceholder')}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {!isTeamRestricted && (
                    <SelectItem value="_all">{t('planCreate.fields.allTeams')}</SelectItem>
                  )}
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                  {teams.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      {t('planCreate.fields.selectSiteFirst')}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 외부교정 대상 장비 미리보기 */}
      {selectedYear && selectedSite && (
        <Card>
          <CardHeader>
            <CardTitle>{t('planCreate.preview.title')}</CardTitle>
            <CardDescription>
              {t('planCreate.preview.description', {
                year: selectedYear,
                site: SITE_LABELS[selectedSite as Site],
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEquipmentError ? (
              <p className="text-sm text-destructive py-2">{t('planCreate.preview.error')}</p>
            ) : isLoadingEquipment ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !equipment || equipment.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('planCreate.preview.noEquipment.title')}</AlertTitle>
                <AlertDescription>
                  {t('planCreate.preview.noEquipment.description')}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className={CALIBRATION_PLAN_CREATE_TOKENS.preview.count}>
                  {t('planCreate.preview.totalCount', { count: equipment.length })}
                </div>
                <div className={CALIBRATION_PLAN_CREATE_TOKENS.preview.scrollArea}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('planCreate.preview.headers.sequence')}</TableHead>
                        <TableHead>{t('planCreate.preview.headers.managementNumber')}</TableHead>
                        <TableHead>{t('planCreate.preview.headers.equipmentName')}</TableHead>
                        <TableHead>{t('planCreate.preview.headers.lastCalibrationDate')}</TableHead>
                        <TableHead>{t('planCreate.preview.headers.calibrationCycle')}</TableHead>
                        <TableHead>{t('planCreate.preview.headers.nextCalibrationDate')}</TableHead>
                        <TableHead>{t('planCreate.preview.headers.calibrationAgency')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipment.map((eq: ExternalEquipment, index: number) => (
                        <TableRow key={eq.id}>
                          <TableCell className={NUMERIC_TOKENS.tabular}>{index + 1}</TableCell>
                          <TableCell className="font-mono">{eq.managementNumber}</TableCell>
                          <TableCell>{eq.name}</TableCell>
                          <TableCell>
                            {eq.lastCalibrationDate
                              ? format(new Date(eq.lastCalibrationDate), 'yyyy-MM-dd')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {eq.calibrationCycle
                              ? t('planCreate.preview.cycleMonths', { count: eq.calibrationCycle })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {eq.nextCalibrationDate
                              ? format(new Date(eq.nextCalibrationDate), 'yyyy-MM-dd')
                              : '-'}
                          </TableCell>
                          <TableCell>{eq.calibrationAgency || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className={CALIBRATION_PLAN_CREATE_TOKENS.actions.container}>
        <Button variant="outline" asChild>
          <Link href="/calibration-plans">{t('planCreate.actions.cancel')}</Link>
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!selectedYear || !selectedSite || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>{t('planCreate.actions.saving')}</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('planCreate.actions.create')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
