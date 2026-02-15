'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
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

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => teamsApi.deleteTeam(team.id),
    onSuccess: () => {
      toast({
        title: '팀이 삭제되었습니다',
        description: `${team.name} 팀이 성공적으로 삭제되었습니다.`,
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
        title: '팀 삭제 실패',
        description: error.message || '팀을 삭제하는 중 오류가 발생했습니다.',
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
        className="animate-in zoom-in-95 fade-in duration-200"
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>팀 삭제</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>
                <strong className="text-foreground">{team.name}</strong> 팀을 삭제하시겠습니까?
              </p>

              {hasRelatedData && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                    연관된 데이터가 있습니다:
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1">
                    {team.memberCount && team.memberCount > 0 && <li>팀원 {team.memberCount}명</li>}
                    {team.equipmentCount && team.equipmentCount > 0 && (
                      <li>장비 {team.equipmentCount}개</li>
                    )}
                  </ul>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    삭제 전 팀원과 장비를 다른 팀으로 이동해주세요.
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">이 작업은 되돌릴 수 없습니다.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>취소</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
