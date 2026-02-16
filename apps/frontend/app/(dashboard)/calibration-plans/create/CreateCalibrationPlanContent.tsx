'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import calibrationPlansApi, {
  ExternalEquipment,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import teamsApi from '@/lib/api/teams-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { ArrowLeft, Save, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TEAM_RESTRICTED_ROLES } from '@equipment-management/shared-constants';

export default function CreateCalibrationPlanContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
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
  const isTeamRestricted = userRole && TEAM_RESTRICTED_ROLES.includes(userRole as any);

  // 팀 목록 조회 (사이트 선택 시)
  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.list({ site: selectedSite || undefined }),
    queryFn: () => teamsApi.getTeams({ site: (selectedSite as any) || undefined, pageSize: 100 }),
    enabled: !!selectedSite,
  });

  const teams = teamsData?.data || [];

  // 외부교정 대상 장비 조회 (teamId 필터 추가)
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery({
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
    onSuccess: (data) => {
      toast({
        title: '계획서 생성 완료',
        description: `${selectedYear}년 ${SITE_LABELS[selectedSite]} 교정계획서가 생성되었습니다.`,
      });
      router.push(`/calibration-plans/${data.id}`);
    },
    onError: (error: unknown) => {
      toast({
        title: '계획서 생성 실패',
        description: getErrorMessage(error, '계획서 생성 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    if (!selectedYear || !selectedSite) {
      toast({
        title: '필수 정보 누락',
        description: '연도와 시험소를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // TM/TE는 teamId 필수
    if (isTeamRestricted && !selectedTeamId) {
      toast({
        title: '필수 정보 누락',
        description: '팀을 선택해주세요.',
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/calibration-plans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">교정계획서 작성</h1>
          <p className="text-muted-foreground">
            새로운 연간 교정계획서를 작성합니다. 외부교정 대상 장비가 자동으로 로드됩니다.
          </p>
        </div>
      </div>

      {/* 기본 정보 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>계획서의 연도와 시험소를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="year">연도 *</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="연도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site">시험소 *</Label>
              <Select
                value={selectedSite}
                onValueChange={setSelectedSite}
                disabled={!!isTeamRestricted && !!session?.user?.site}
              >
                <SelectTrigger id="site">
                  <SelectValue placeholder="시험소 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suwon">수원</SelectItem>
                  <SelectItem value="uiwang">의왕</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">
                팀 {isTeamRestricted && '*'}
                {isTeamRestricted && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (기술책임자는 자기 팀만 선택 가능)
                  </span>
                )}
              </Label>
              <Select
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
                disabled={!selectedSite || (!!isTeamRestricted && !!session?.user?.teamId)}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="팀 선택">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {selectedTeamId
                        ? teams.find((t) => t.id === selectedTeamId)?.name || '팀 선택'
                        : '팀 선택'}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {!isTeamRestricted && <SelectItem value="">전체 팀 (팀 없음)</SelectItem>}
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                  {teams.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      시험소를 먼저 선택하세요
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
            <CardTitle>외부교정 대상 장비 (미리보기)</CardTitle>
            <CardDescription>
              {selectedYear}년 {SITE_LABELS[selectedSite]} 시험소의 외부교정 예정 장비 목록입니다.
              계획서 생성 시 자동으로 포함됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEquipment ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !equipment || equipment.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>장비 없음</AlertTitle>
                <AlertDescription>
                  해당 연도에 교정 예정인 외부교정 대상 장비가 없습니다.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  총 {equipment.length}개의 장비가 포함됩니다.
                </div>
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>순번</TableHead>
                        <TableHead>관리번호</TableHead>
                        <TableHead>장비명</TableHead>
                        <TableHead>최종교정일</TableHead>
                        <TableHead>교정주기</TableHead>
                        <TableHead>차기교정일</TableHead>
                        <TableHead>교정기관</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipment.map((eq: ExternalEquipment, index: number) => (
                        <TableRow key={eq.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">{eq.managementNumber}</TableCell>
                          <TableCell>{eq.name}</TableCell>
                          <TableCell>
                            {eq.lastCalibrationDate
                              ? format(new Date(eq.lastCalibrationDate), 'yyyy-MM-dd')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {eq.calibrationCycle ? `${eq.calibrationCycle}개월` : '-'}
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
      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/calibration-plans">취소</Link>
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!selectedYear || !selectedSite || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>저장 중...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              계획서 생성
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
