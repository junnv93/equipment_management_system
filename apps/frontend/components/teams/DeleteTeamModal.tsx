'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ANIMATION_PRESETS } from '@/lib/design-tokens';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import teamsApi, { type Team } from '@/lib/api/teams-api';
import { queryKeys } from '@/lib/api/query-config';

interface DeleteTeamModalProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 팀 삭제 확인 모달
 *
 * 접근성 요구사항:
 * - role="alertdialog"
 * - aria-modal="true"
 * - 포커스 트랩 (AlertDialog 컴포넌트 내장)
 * - Escape로 닫기 가능
 *
 * 디자인 요구사항:
 * - scale + fade 애니메이션 (AlertDialog 컴포넌트 내장)
 * - 연관 데이터(장비/팀원) 정보 표시
 *
 * 비즈니스 규칙:
 * - system_admin만 팀 삭제 가능
 * - 팀 삭제 전 소속 장비/팀원 이동 안내 필요
 */
export function DeleteTeamModal({ team, open, onOpenChange }: DeleteTeamModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('teams');

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => teamsApi.deleteTeam(team.id),
    onSuccess: () => {
      toast({
        title: t('deleteModal.successTitle'),
        description: t('deleteModal.successDesc', { name: team.name }),
      });

      onOpenChange(false);
      router.push('/teams');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('deleteModal.errorTitle'),
        description: error.message || t('toasts.deleteError'),
      });
    },
  });

  const hasRelatedData =
    (team.memberCount && team.memberCount > 0) || (team.equipmentCount && team.equipmentCount > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        role="alertdialog"
        aria-modal="true"
        className={ANIMATION_PRESETS.dialogEnter}
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>{t('deleteModal.title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>
                {t.rich('deleteModal.confirmMessage', {
                  name: team.name,
                  bold: (chunks) => <strong className="text-foreground">{chunks}</strong>,
                })}
              </p>

              {hasRelatedData && (
                <div className="p-3 rounded-lg bg-brand-warning/10 border border-brand-warning/20">
                  <p className="text-sm text-brand-warning font-medium mb-2">
                    {t('deleteModal.relatedDataWarning')}
                  </p>
                  <ul className="text-sm text-brand-warning list-disc list-inside space-y-1">
                    {team.memberCount && team.memberCount > 0 && (
                      <li>{t('deleteModal.relatedMembers', { count: team.memberCount })}</li>
                    )}
                    {team.equipmentCount && team.equipmentCount > 0 && (
                      <li>{t('deleteModal.relatedEquipment', { count: team.equipmentCount })}</li>
                    )}
                  </ul>
                  <p className="text-xs text-brand-warning mt-2">
                    {t('deleteModal.relatedDataHint')}
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">{t('deleteModal.irreversible')}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('deleteModal.cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('deleteModal.deleting')}
              </>
            ) : (
              t('deleteModal.confirm')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
