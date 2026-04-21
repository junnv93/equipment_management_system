'use client';

import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SoftwareValidation } from '@/lib/api/software-api';
import { Permission, FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { ValidationStatusValues } from '@equipment-management/schemas';
import { useRouter } from 'next/navigation';

interface MutationHandle<T> {
  mutate: (args: T) => void;
  isPending: boolean;
}

interface ValidationActionsBarProps {
  validation: SoftwareValidation;
  softwareId: string;
  can: (permission: (typeof Permission)[keyof typeof Permission]) => boolean;
  userId: string | undefined;
  submitMutation: MutationHandle<{ id: string; version: number }>;
  approveMutation: MutationHandle<{ id: string; version: number }>;
  qualityApproveMutation: MutationHandle<{ id: string; version: number }>;
  reviseMutation: MutationHandle<{ id: string; version: number }>;
  onReject: (validation: SoftwareValidation) => void;
}

export function ValidationActionsBar({
  validation: v,
  softwareId,
  can,
  userId,
  submitMutation,
  approveMutation,
  qualityApproveMutation,
  reviseMutation,
  onReject,
}: ValidationActionsBarProps) {
  const t = useTranslations('software');
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      {v.status === ValidationStatusValues.DRAFT && (
        <>
          {can(Permission.CREATE_SOFTWARE_VALIDATION) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `${FRONTEND_ROUTES.SOFTWARE.VALIDATION_DETAIL(softwareId, v.id)}?edit=true`
                );
              }}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {t('validation.actions.edit')}
            </Button>
          )}
          {can(Permission.SUBMIT_SOFTWARE_VALIDATION) && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                submitMutation.mutate({ id: v.id, version: v.version });
              }}
              disabled={submitMutation.isPending}
            >
              {t('validation.actions.submit')}
            </Button>
          )}
        </>
      )}
      {v.status === ValidationStatusValues.SUBMITTED &&
        can(Permission.APPROVE_SOFTWARE_VALIDATION) && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                approveMutation.mutate({ id: v.id, version: v.version });
              }}
              // ISO 17025 §6.2.2: 제출자는 승인 불가 (서버 가드 UI 대칭)
              disabled={approveMutation.isPending || v.submittedBy === userId}
              title={
                v.submittedBy === userId ? t('validation.actions.selfApprovalForbidden') : undefined
              }
            >
              {t('validation.actions.approve')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onReject(v);
              }}
            >
              {t('validation.actions.reject')}
            </Button>
          </>
        )}
      {v.status === ValidationStatusValues.APPROVED &&
        can(Permission.APPROVE_SOFTWARE_VALIDATION) && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              qualityApproveMutation.mutate({ id: v.id, version: v.version });
            }}
            // ISO 17025 §6.2.2: 기술 승인자는 품질 승인 불가 (서버 가드 UI 대칭)
            disabled={qualityApproveMutation.isPending || v.technicalApproverId === userId}
            title={
              v.technicalApproverId === userId
                ? t('validation.actions.dualApprovalForbidden')
                : undefined
            }
          >
            {t('validation.actions.qualityApprove')}
          </Button>
        )}
      {v.status === ValidationStatusValues.REJECTED && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            reviseMutation.mutate({ id: v.id, version: v.version });
          }}
          disabled={reviseMutation.isPending}
        >
          {t('validation.actions.revise')}
        </Button>
      )}
    </div>
  );
}
