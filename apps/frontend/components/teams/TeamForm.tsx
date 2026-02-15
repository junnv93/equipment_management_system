'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { TeamTypeEnum, SiteEnum } from '@equipment-management/schemas';
import teamsApi, { type Team, SITE_CONFIG, TEAM_TYPE_CONFIG } from '@/lib/api/teams-api';
import { queryKeys } from '@/lib/api/query-config';
import { LeaderCombobox } from './LeaderCombobox';
import { TeamTypeIcon } from './TeamTypeIcon';

// 드롭다운에 표시할 주요 팀 유형 (레거시 제외)
const PRIMARY_TEAM_TYPES = [
  'FCC_EMC_RF',
  'GENERAL_EMC',
  'GENERAL_RF',
  'SAR',
  'AUTOMOTIVE_EMC',
  'SOFTWARE',
] as const;

// 폼 검증 스키마 — SSOT enums from @equipment-management/schemas
const teamFormSchema = z.object({
  name: z.string().min(1, '팀 이름은 필수입니다').max(100, '팀 이름은 100자 이내여야 합니다'),
  type: TeamTypeEnum,
  description: z.string().max(500, '팀 설명은 500자 이내여야 합니다').optional(),
  site: SiteEnum,
  leaderId: z.string().uuid('유효한 사용자 ID가 아닙니다').optional().or(z.literal('')),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  team?: Team;
  mode: 'create' | 'edit';
}

/**
 * 팀 등록/수정 폼 컴포넌트 ('use client')
 *
 * 기능:
 * - 팀 기본 정보 입력 (이름, 유형, 설명)
 * - 소속 사이트 선택
 * - 팀장 지정 (선택)
 *
 * 접근성:
 * - aria-describedby로 도움말/에러 연결
 * - 필드별 에러 메시지 (role="alert")
 */
export function TeamForm({ team, mode }: TeamFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditMode = mode === 'edit';

  // 폼 초기화
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || '',
      type: (team?.type as TeamFormValues['type']) || 'FCC_EMC_RF',
      description: team?.description || '',
      site: (team?.site as TeamFormValues['site']) || 'suwon',
      leaderId: team?.leaderId || '',
    },
  });

  // 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: (data: TeamFormValues) =>
      teamsApi.createTeam({
        name: data.name,
        type: data.type,
        description: data.description,
        site: data.site,
        leaderId: data.leaderId || undefined,
      }),
    onSuccess: (newTeam) => {
      toast({
        title: '팀이 생성되었습니다',
        description: `${newTeam.name} 팀이 성공적으로 생성되었습니다.`,
      });
      router.push(`/teams/${newTeam.id}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.lists() });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '팀 생성 실패',
        description: error.message || '팀을 생성하는 중 오류가 발생했습니다.',
      });
    },
  });

  // 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: (data: TeamFormValues) =>
      teamsApi.updateTeam(team!.id, {
        name: data.name,
        type: data.type, // UpdateTeamInput은 partial이므로 undefined도 허용
        description: data.description,
        site: data.site,
        leaderId: data.leaderId || undefined,
      }),
    onSuccess: (updatedTeam) => {
      toast({
        title: '팀이 수정되었습니다',
        description: `${updatedTeam.name} 팀 정보가 성공적으로 수정되었습니다.`,
      });
      router.push(`/teams/${team!.id}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(team!.id) });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '팀 수정 실패',
        description: error.message || '팀 정보를 수정하는 중 오류가 발생했습니다.',
      });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isDirty = form.formState.isDirty;

  // 미저장 변경 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const onSubmit = (data: TeamFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 팀 이름 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>팀 이름 *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="예: RF 테스트팀"
                      aria-describedby="name-description"
                    />
                  </FormControl>
                  <FormDescription id="name-description">팀의 표시 이름입니다.</FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* 팀 유형 */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>팀 유형</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-describedby="type-description">
                        <SelectValue placeholder="팀 유형 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIMARY_TEAM_TYPES.map((key) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <TeamTypeIcon type={key} size="sm" />
                            {TEAM_TYPE_CONFIG[key]?.label || key}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription id="type-description">
                    RF, EMC, SAR 등 팀의 전문 분야입니다.
                  </FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* 소속 사이트 */}
            <FormField
              control={form.control}
              name="site"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>소속 사이트</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-describedby="site-description">
                        <SelectValue placeholder="사이트 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SITE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label} ({config.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription id="site-description">
                    팀이 소속된 시험소 사이트입니다.
                  </FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* 팀 설명 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>팀 설명</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="팀의 역할과 담당 업무를 설명해주세요"
                      rows={3}
                      aria-describedby="description-description"
                    />
                  </FormControl>
                  <FormDescription id="description-description">
                    최대 500자까지 입력할 수 있습니다.
                  </FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* 팀장 선택 */}
            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>팀장 (선택)</FormLabel>
                  <FormControl>
                    <LeaderCombobox
                      value={field.value || undefined}
                      onChange={(val) => field.onChange(val || '')}
                      site={form.watch('site')}
                      teamId={team?.id}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    팀을 이끌 책임자를 선택합니다. 선택하지 않으면 비워둡니다.
                  </FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditMode ? '수정 중...' : '생성 중...'}
              </>
            ) : isEditMode ? (
              '수정'
            ) : (
              '생성'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
