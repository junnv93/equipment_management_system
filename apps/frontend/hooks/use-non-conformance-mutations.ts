'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { useCasGuardedMutation } from '@/hooks/use-cas-guarded-mutation';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import { NonConformanceCacheInvalidation } from '@/lib/api/cache-invalidation';
import { queryKeys } from '@/lib/api/query-config';
import { mapNonConformanceErrorToToast } from '@/lib/errors/non-conformance-errors';
import {
  type NonConformanceStatus,
  NonConformanceStatusValues as NCVal,
} from '@equipment-management/schemas';

export interface UseNonConformanceMutationsOptions {
  onSaveSuccess?: () => void;
  onCloseSuccess?: () => void;
  onRejectSuccess?: () => void;
}

export function useNonConformanceMutations(
  ncId: string,
  options: UseNonConformanceMutationsOptions = {}
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('non-conformances');
  const tErrors = useTranslations('errors');

  const fetchNcVersion = () => nonConformancesApi.getNonConformance(ncId).then((r) => r.version);

  const updateMutation = useCasGuardedMutation<
    NonConformance,
    { status: Exclude<NonConformanceStatus, 'closed'>; correctionContent?: string }
  >({
    fetchCasVersion: fetchNcVersion,
    mutationFn: (vars, casVersion) =>
      nonConformancesApi.updateNonConformance(ncId, {
        version: casVersion,
        status: vars.status,
        correctionContent: vars.correctionContent,
        correctionDate:
          vars.status === NCVal.CORRECTED ? new Date().toISOString().split('T')[0] : undefined,
      }),
    onSuccess: (data) => {
      toast({ title: t('toasts.statusChangeSuccess') });
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        data.equipmentId
      );
    },
    onError: () => {
      toast({ title: t('toasts.statusChangeError'), variant: 'destructive' });
    },
  });

  const saveMutation = useCasGuardedMutation<NonConformance, { correctionContent?: string }>({
    fetchCasVersion: fetchNcVersion,
    mutationFn: (vars, casVersion) =>
      nonConformancesApi.updateNonConformance(ncId, { version: casVersion, ...vars }),
    onSuccess: () => {
      toast({ title: t('toasts.saveSuccess') });
      options.onSaveSuccess?.();
      queryClient.invalidateQueries({ queryKey: queryKeys.nonConformances.lists() });
    },
    onError: () => {
      toast({ title: t('toasts.saveError'), variant: 'destructive' });
    },
  });

  const closeMutation = useCasGuardedMutation<NonConformance, { closureNotes?: string }>({
    fetchCasVersion: fetchNcVersion,
    mutationFn: (vars, casVersion) =>
      nonConformancesApi.closeNonConformance(ncId, {
        version: casVersion,
        closureNotes: vars.closureNotes,
      }),
    onSuccess: (data) => {
      toast({ title: t('toasts.closureSuccess') });
      options.onCloseSuccess?.();
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        data.equipmentId
      );
    },
    onError: () => {
      toast({ title: t('toasts.closureError'), variant: 'destructive' });
    },
  });

  const rejectMutation = useCasGuardedMutation<NonConformance, { rejectionReason: string }>({
    fetchCasVersion: fetchNcVersion,
    mutationFn: (vars, casVersion) =>
      nonConformancesApi.rejectCorrection(ncId, {
        version: casVersion,
        rejectionReason: vars.rejectionReason,
      }),
    onSuccess: (data) => {
      toast({ title: t('toasts.rejectionSuccess') });
      options.onRejectSuccess?.();
      NonConformanceCacheInvalidation.invalidateAfterStatusChange(
        queryClient,
        ncId,
        data.equipmentId
      );
    },
    onError: (error: unknown) => {
      const { title, description } = mapNonConformanceErrorToToast(error, t, tErrors);
      toast({ title, description, variant: 'destructive' });
    },
  });

  return { updateMutation, saveMutation, closeMutation, rejectMutation };
}
