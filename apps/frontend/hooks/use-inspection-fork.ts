'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { queryKeys } from '@/lib/api/query-config';
import calibrationApi from '@/lib/api/calibration-api';
import type { CreateInspectionDto, CreateResultSectionDto } from '@/lib/api/calibration-api';
import type {
  ForkChoice,
  StructureDiff,
  ExtractedInspectionStructure,
} from '@equipment-management/schemas';
import { Permission } from '@equipment-management/shared-constants';
import { isConflictError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';
import { useUpsertTemplate } from '@/hooks/use-inspection-template';
import { diffFormAgainstTemplate, buildCurrentStructure } from '@/lib/inspection/structure-diff';

interface InspectionItemForm {
  checkItem: string;
  checkCriteria: string;
  checkResult: string;
  judgment: string;
}

interface LatestTemplate {
  id: string;
  version: number;
  structure: ExtractedInspectionStructure;
}

export interface UseInspectionForkOptions {
  equipmentId: string;
  calibrationId?: string;
  isInspectionTemplateEnabled: boolean;
  latestTemplate: LatestTemplate | null | undefined;
  items: InspectionItemForm[];
  resultSections: CreateResultSectionDto[];
  hasInvalidItems: boolean;
  buildDto: () => CreateInspectionDto;
  onSubmitSuccess: () => void;
  onForceClose: () => void;
}

export function useInspectionFork({
  equipmentId,
  calibrationId,
  isInspectionTemplateEnabled,
  latestTemplate,
  items,
  resultSections,
  hasInvalidItems,
  buildDto,
  onSubmitSuccess,
  onForceClose,
}: UseInspectionForkOptions) {
  const t = useTranslations('calibration');
  const tEquip = useTranslations('equipment');
  const tErrors = useTranslations('errors');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const canApplyForward = can(Permission.MANAGE_INSPECTION_TEMPLATE);
  const upsertTemplateMutation = useUpsertTemplate(equipmentId);

  const [softForkOpen, setSoftForkOpen] = useState(false);
  const [pendingDto, setPendingDto] = useState<CreateInspectionDto | null>(null);
  const [softForkDiff, setSoftForkDiff] = useState<StructureDiff | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: CreateInspectionDto) => {
      if (calibrationId) {
        return calibrationApi.intermediateInspections.create(calibrationId, data);
      }
      return calibrationApi.intermediateInspections.createByEquipment(equipmentId, data);
    },
    onSuccess: () => {
      toast({ description: t('intermediateInspection.toasts.createSuccess') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(equipmentId) });
      if (calibrationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.all });
      onSubmitSuccess();
    },
    onError: (error: Error) => {
      const apiError = error as Error & { response?: { code?: string } };
      if (apiError.response?.code === 'NO_ACTIVE_CALIBRATION') {
        toast({
          variant: 'destructive',
          description: tEquip('inspection.noActiveCalibration'),
        });
        return;
      }
      if (isConflictError(error)) {
        const conflictInfo = getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT, tErrors);
        toast({
          title: conflictInfo.title,
          description: conflictInfo.message,
          variant: 'destructive',
        });
        queryClient.removeQueries({
          queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
        });
        if (calibrationId) {
          queryClient.removeQueries({
            queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
          });
        }
        onForceClose();
        return;
      }
      toast({
        variant: 'destructive',
        description: t('intermediateInspection.toasts.createError'),
      });
    },
  });

  const handleSubmit = (inspectionDate: string) => {
    if (!inspectionDate || hasInvalidItems) return;
    const dto = buildDto();

    if (!isInspectionTemplateEnabled || !latestTemplate) {
      createMutation.mutate(dto);
      return;
    }

    const diff = diffFormAgainstTemplate(items, resultSections, latestTemplate.structure);
    if (!diff.hasChanges) {
      createMutation.mutate(dto);
      return;
    }

    setPendingDto(dto);
    setSoftForkDiff(diff);
    setSoftForkOpen(true);
  };

  const handleForkChoice = (choice: ForkChoice) => {
    if (!pendingDto) return;
    if (choice === 'cancel') return;

    if (choice === 'this_only') {
      setSoftForkOpen(false);
      createMutation.mutate(pendingDto);
      return;
    }

    if (!latestTemplate) return;
    const dtoToSubmit = pendingDto;
    const newStructure = buildCurrentStructure(items, resultSections);
    upsertTemplateMutation.mutate(
      {
        inspectionType: 'intermediate',
        version: latestTemplate.version + 1,
        structure: newStructure,
        supersededBy: latestTemplate.id,
        sourceInspectionId: null,
        forkChoice: 'apply_forward',
      },
      {
        onSuccess: () => {
          setSoftForkOpen(false);
          createMutation.mutate(dtoToSubmit);
        },
        onError: (error) => {
          if (isConflictError(error)) {
            toast({
              title: t('intermediateInspection.softFork.conflict.title'),
              description: t('intermediateInspection.softFork.conflict.description'),
              variant: 'destructive',
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.inspectionTemplate.latest(equipmentId, 'intermediate'),
            });
            return;
          }
          toast({
            variant: 'destructive',
            description: t('intermediateInspection.toasts.createError'),
          });
        },
      }
    );
  };

  return {
    handleSubmit,
    handleForkChoice,
    softForkOpen,
    setSoftForkOpen,
    softForkDiff,
    canApplyForward,
    isSubmitting: createMutation.isPending || upsertTemplateMutation.isPending,
    isCreatePending: createMutation.isPending,
  };
}
