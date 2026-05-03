'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Package, Users } from 'lucide-react';
import { ANIMATION_PRESETS, TEAM_DELETE_MODAL_TOKENS } from '@/lib/design-tokens';
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast({
        title: t('deleteModal.successTitle'),
        description: t('deleteModal.successDesc', { name: team.name }),
      });

      onOpenChange(false);
      router.push('/teams');
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
  const memberCount = team.memberCount ?? 0;
  const equipmentCount = team.equipmentCount ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        role="alertdialog"
        aria-modal="true"
        className={ANIMATION_PRESETS.dialogEnter}
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={TEAM_DELETE_MODAL_TOKENS.warningIconWrap}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <AlertDialogTitle>
              {hasRelatedData ? t('deleteModal.blockedTitle') : t('deleteModal.title')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>
                {hasRelatedData
                  ? t.rich('deleteModal.blockedDescription', {
                      name: team.name,
                      bold: (chunks) => <strong className="text-foreground">{chunks}</strong>,
                    })
                  : t.rich('deleteModal.confirmMessage', {
                      name: team.name,
                      bold: (chunks) => <strong className="text-foreground">{chunks}</strong>,
                    })}
              </p>

              {hasRelatedData && (
                <div className={TEAM_DELETE_MODAL_TOKENS.blockedPanel}>
                  <p className={TEAM_DELETE_MODAL_TOKENS.blockedTitle}>
                    {t('deleteModal.relatedDataWarning')}
                  </p>
                  <div className={TEAM_DELETE_MODAL_TOKENS.relatedList}>
                    {memberCount > 0 && (
                      <div className={TEAM_DELETE_MODAL_TOKENS.relatedRow}>
                        <span className="inline-flex items-center gap-2">
                          <Users className="h-4 w-4" aria-hidden="true" />
                          {t('deleteModal.relatedMembers', { count: memberCount })}
                        </span>
                        <button
                          type="button"
                          className={TEAM_DELETE_MODAL_TOKENS.relatedAction}
                          onClick={() => router.push(`/teams/${team.id}`)}
                        >
                          {t('deleteModal.moveMembersAction')}
                        </button>
                      </div>
                    )}
                    {equipmentCount > 0 && (
                      <div className={TEAM_DELETE_MODAL_TOKENS.relatedRow}>
                        <span className="inline-flex items-center gap-2">
                          <Package className="h-4 w-4" aria-hidden="true" />
                          {t('deleteModal.relatedEquipment', { count: equipmentCount })}
                        </span>
                        <button
                          type="button"
                          className={TEAM_DELETE_MODAL_TOKENS.relatedAction}
                          onClick={() => router.push(`/equipment?teamId=${team.id}`)}
                        >
                          {t('deleteModal.moveEquipmentAction')}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={TEAM_DELETE_MODAL_TOKENS.hint}>
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
            disabled={deleteMutation.isPending || Boolean(hasRelatedData)}
            aria-disabled={hasRelatedData || undefined}
            title={hasRelatedData ? t('deleteModal.blockedButtonTitle') : undefined}
            loading={deleteMutation.isPending}
            loadingLabel={t('deleteModal.deleting')}
          >
            {hasRelatedData ? t('deleteModal.blockedConfirm') : t('deleteModal.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
