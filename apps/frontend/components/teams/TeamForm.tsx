'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
import { ClassificationEnum, SiteEnum, optionalUuid } from '@equipment-management/schemas';
import teamsApi, { type Team, SITE_CONFIG, CLASSIFICATION_CONFIG } from '@/lib/api/teams-api';
import { queryKeys } from '@/lib/api/query-config';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { LeaderCombobox } from './LeaderCombobox';
import { TeamTypeIcon } from './TeamTypeIcon';

// 드롭다운에 표시할 주요 팀 분류 (소문자_언더스코어)
const PRIMARY_CLASSIFICATIONS = [
  'fcc_emc_rf',
  'general_emc',
  'general_rf',
  'sar',
  'automotive_emc',
  'software',
] as const;

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
  const t = useTranslations('teams');
  const siteLabels = useSiteLabels();

  const isEditMode = mode === 'edit';

  // i18n 적용 Zod 스키마 (컴포넌트 내부에서 생성)
  const teamFormSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(1, t('form.validation.nameRequired'))
          .max(100, t('form.validation.nameMaxLength')),
        classification: ClassificationEnum,
        description: z.string().max(500, t('form.validation.descMaxLength')).optional(),
        site: SiteEnum,
        leaderId: optionalUuid(t('form.validation.invalidUserId')),
      }),
    [t]
  );

  type TeamFormValues = z.infer<typeof teamFormSchema>;

  // 폼 초기화
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || '',
      classification: (team?.classification as TeamFormValues['classification']) || 'fcc_emc_rf',
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
        classification: data.classification,
        description: data.description,
        site: data.site,
        leaderId: data.leaderId || undefined,
      }),
    onSuccess: async (newTeam) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams.lists() });
      toast({
        title: t('form.createSuccess'),
        description: t('form.createSuccessDesc', { name: newTeam.name }),
      });
      router.push(`/teams/${newTeam.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('form.createError'),
        description: error.message || t('form.createErrorFallback'),
      });
    },
  });

  // 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: (data: TeamFormValues) =>
      teamsApi.updateTeam(team!.id, {
        name: data.name,
        classification: data.classification,
        description: data.description,
        site: data.site,
        leaderId: data.leaderId || undefined,
      }),
    onSuccess: async (updatedTeam) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(team!.id) }),
      ]);
      toast({
        title: t('form.updateSuccess'),
        description: t('form.updateSuccessDesc', { name: updatedTeam.name }),
      });
      router.push(`/teams/${team!.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('form.updateError'),
        description: error.message || t('form.updateErrorFallback'),
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
            <CardTitle>{t('form.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 팀 이름 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.nameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder={t('form.namePlaceholder')}
                      aria-describedby="name-description"
                    />
                  </FormControl>
                  <FormDescription id="name-description">
                    {t('form.nameDescription')}
                  </FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* 팀 분류 */}
            <FormField
              control={form.control}
              name="classification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.classificationLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-describedby="classification-description">
                        <SelectValue placeholder={t('form.classificationPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIMARY_CLASSIFICATIONS.map((key) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <TeamTypeIcon classification={key} size="sm" />
                            {CLASSIFICATION_CONFIG[key]?.label || key}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription id="classification-description">
                    {t('form.classificationDescription')}
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
                  <FormLabel>{t('form.siteLabel')}</FormLabel>
                  <Select
                    onValueChange={(newSite) => {
                      field.onChange(newSite);
                      // 사이트 변경 시 팀장 초기화 (다른 사이트 사용자가 팀장으로 남는 것 방지)
                      if (newSite !== field.value) {
                        form.setValue('leaderId', '', { shouldDirty: true });
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger aria-describedby="site-description">
                        <SelectValue placeholder={t('form.sitePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SITE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {siteLabels[key as keyof typeof siteLabels]} ({config.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription id="site-description">
                    {t('form.siteDescription')}
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
                  <FormLabel>{t('form.descriptionLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder={t('form.descriptionPlaceholder')}
                      rows={3}
                      aria-describedby="description-description"
                    />
                  </FormControl>
                  <FormDescription id="description-description">
                    {t('form.descriptionHint')}
                  </FormDescription>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            {/* 팀장 선택 */}
            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => {
                const currentSite = form.watch('site');
                // Edit 모드: site가 원래 팀 site와 동일할 때만 teamId 필터 적용
                // site 변경 시 teamId 필터 무효 → site 기반 검색으로 전환
                const effectiveTeamId =
                  isEditMode && team?.site === currentSite ? team?.id : undefined;

                return (
                  <FormItem>
                    <FormLabel>{t('form.leaderLabel')}</FormLabel>
                    <FormControl>
                      <LeaderCombobox
                        value={field.value || undefined}
                        onChange={(val) => field.onChange(val || '')}
                        site={currentSite}
                        teamId={effectiveTeamId}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>{t('form.leaderDescription')}</FormDescription>
                    <FormMessage role="alert" />
                  </FormItem>
                );
              }}
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
            {t('form.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
                {isEditMode ? t('form.submittingEdit') : t('form.submitting')}
              </>
            ) : isEditMode ? (
              t('form.submitEdit')
            ) : (
              t('form.submit')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
