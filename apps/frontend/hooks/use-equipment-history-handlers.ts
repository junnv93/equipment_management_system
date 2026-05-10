'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalibrationApprovalStatusValues,
  CalibrationResultEnum,
} from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import equipmentApi from '@/lib/api/equipment-api';
import calibrationApi from '@/lib/api/calibration-api';
import type {
  LocationHistoryItem,
  MaintenanceHistoryItem,
  IncidentHistoryItem,
  CreateLocationHistoryInput,
  CreateMaintenanceHistoryInput,
  CreateIncidentHistoryInput,
} from '@/lib/api/equipment-api';
import type {
  CreateCalibrationHistoryInput,
  CalibrationRecord,
} from '@/components/equipment/CalibrationHistorySection';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { ApiError } from '@/lib/errors/equipment-errors';

// 임시 이력 타입 (등록 모드에서 사용) — equipment-history-utils.ts에서 import
export interface PendingHistoryData {
  locationHistory: CreateLocationHistoryInput[];
  maintenanceHistory: CreateMaintenanceHistoryInput[];
  incidentHistory: CreateIncidentHistoryInput[];
  calibrationHistory: CreateCalibrationHistoryInput[];
}

interface PendingHistoryItem<T> {
  tempId: string;
  data: T;
}

type PendingLocationHistoryItem = PendingHistoryItem<CreateLocationHistoryInput>;
type PendingMaintenanceHistoryItem = PendingHistoryItem<CreateMaintenanceHistoryInput>;
type PendingIncidentHistoryItem = PendingHistoryItem<CreateIncidentHistoryInput>;
type PendingCalibrationHistoryItem = PendingHistoryItem<CreateCalibrationHistoryInput>;

interface UseEquipmentHistoryHandlersOptions {
  isEdit: boolean;
  equipmentUuid?: string;
}

export function useEquipmentHistoryHandlers({
  isEdit,
  equipmentUuid,
}: UseEquipmentHistoryHandlersOptions) {
  const t = useTranslations('equipment');
  const { toast } = useToast();

  // useQuery SSOT 패턴 (수정 모드) — setQueryData 금지, invalidateQueries 사용
  const { data: serverLocationHistory = [], isLoading: isLocationHistoryLoading } = useQuery({
    queryKey: queryKeys.equipment.locationHistory(equipmentUuid ?? ''),
    queryFn: () => equipmentApi.getLocationHistory(equipmentUuid!),
    enabled: isEdit && !!equipmentUuid,
    ...QUERY_CONFIG.HISTORY,
  });

  const { data: serverMaintenanceHistory = [], isLoading: isMaintenanceHistoryLoading } = useQuery({
    queryKey: queryKeys.equipment.maintenanceHistory(equipmentUuid ?? ''),
    queryFn: () => equipmentApi.getMaintenanceHistory(equipmentUuid!),
    enabled: isEdit && !!equipmentUuid,
    ...QUERY_CONFIG.HISTORY,
  });

  const { data: serverIncidentHistory = [], isLoading: isIncidentHistoryLoading } = useQuery({
    queryKey: queryKeys.equipment.incidentHistory(equipmentUuid ?? ''),
    queryFn: () => equipmentApi.getIncidentHistory(equipmentUuid!),
    enabled: isEdit && !!equipmentUuid,
    ...QUERY_CONFIG.HISTORY,
  });

  const { data: serverCalibrationHistory = [], isLoading: isCalibrationHistoryLoading } = useQuery({
    queryKey: queryKeys.calibrations.byEquipment(equipmentUuid ?? ''),
    queryFn: async () => {
      const calibrations = await calibrationApi.getEquipmentCalibrations(equipmentUuid!);
      return calibrations.map((item) => {
        const parsedResult = CalibrationResultEnum.safeParse(item.result);
        return {
          id: item.id,
          calibrationDate: item.calibrationDate,
          nextCalibrationDate: item.nextCalibrationDate,
          calibrationAgency: item.calibrationAgency,
          result: parsedResult.success ? parsedResult.data : undefined,
          approvalStatus: item.approvalStatus,
          status: 'completed' as const,
        };
      });
    },
    enabled: isEdit && !!equipmentUuid,
    ...QUERY_CONFIG.HISTORY,
  });

  const isHistoryLoading =
    isLocationHistoryLoading ||
    isMaintenanceHistoryLoading ||
    isIncidentHistoryLoading ||
    isCalibrationHistoryLoading;

  // ✅ 예외: verify-frontend-state Exception #6 (폼 상태 useState)
  const [locationHistory, setLocationHistory] = useState<LocationHistoryItem[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistoryItem[]>([]);
  const [incidentHistory, setIncidentHistory] = useState<IncidentHistoryItem[]>([]);
  const [calibrationHistory, setCalibrationHistory] = useState<CalibrationRecord[]>([]);

  // 수정 모드: 서버 데이터로 초기화 (1회만)
  useEffect(() => {
    if (isEdit && serverLocationHistory.length > 0 && locationHistory.length === 0) {
      setLocationHistory(serverLocationHistory);
    }
  }, [isEdit, serverLocationHistory, locationHistory.length]);

  useEffect(() => {
    if (isEdit && serverMaintenanceHistory.length > 0 && maintenanceHistory.length === 0) {
      setMaintenanceHistory(serverMaintenanceHistory);
    }
  }, [isEdit, serverMaintenanceHistory, maintenanceHistory.length]);

  useEffect(() => {
    if (isEdit && serverIncidentHistory.length > 0 && incidentHistory.length === 0) {
      setIncidentHistory(serverIncidentHistory);
    }
  }, [isEdit, serverIncidentHistory, incidentHistory.length]);

  useEffect(() => {
    if (isEdit && serverCalibrationHistory.length > 0 && calibrationHistory.length === 0) {
      setCalibrationHistory(serverCalibrationHistory);
    }
  }, [isEdit, serverCalibrationHistory, calibrationHistory.length]);

  const [pendingLocationHistory, setPendingLocationHistory] = useState<
    PendingLocationHistoryItem[]
  >([]);
  const [pendingMaintenanceHistory, setPendingMaintenanceHistory] = useState<
    PendingMaintenanceHistoryItem[]
  >([]);
  const [pendingIncidentHistory, setPendingIncidentHistory] = useState<
    PendingIncidentHistoryItem[]
  >([]);
  const [pendingCalibrationHistory, setPendingCalibrationHistory] = useState<
    PendingCalibrationHistoryItem[]
  >([]);

  const handleHistoryError = useCallback(
    (error: unknown, historyType: string) => {
      const errorMessage =
        error instanceof ApiError
          ? error.getUserMessage()
          : error instanceof Error
            ? error.message
            : t('form.toasts.unknownError');
      toast({
        title: t('form.toasts.historyError', { type: historyType }),
        description: errorMessage,
        variant: 'destructive',
      });
    },
    [toast, t]
  );

  const generateTempId = useCallback(() => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleAddLocationHistory = useCallback(
    async (data: CreateLocationHistoryInput) => {
      if (isEdit && equipmentUuid) {
        try {
          const newItem = await equipmentApi.createLocationHistory(equipmentUuid, data);
          setLocationHistory((prev) => [newItem, ...prev]);
          toast({
            title: t('form.toasts.locationHistoryAdd'),
            description: t('form.toasts.historySaved'),
          });
        } catch (error) {
          handleHistoryError(error, t('form.toasts.locationHistoryError'));
          throw error;
        }
      } else {
        const tempId = generateTempId();
        const tempItem: LocationHistoryItem = {
          id: tempId,
          equipmentId: '',
          changedAt: new Date(data.changedAt),
          newLocation: data.newLocation,
          notes: data.notes,
          createdAt: new Date(),
        };
        setLocationHistory((prev) => [tempItem, ...prev]);
        setPendingLocationHistory((prev) => [...prev, { tempId, data }]);
      }
    },
    [isEdit, equipmentUuid, toast, handleHistoryError, generateTempId, t]
  );

  const handleDeleteLocationHistory = useCallback(
    async (historyId: string) => {
      try {
        if (isEdit) await equipmentApi.deleteLocationHistory(historyId);
        setLocationHistory((prev) => prev.filter((item) => item.id !== historyId));
        if (!isEdit && historyId.startsWith('temp-')) {
          setPendingLocationHistory((prev) => prev.filter((item) => item.tempId !== historyId));
        }
      } catch (error) {
        handleHistoryError(error, t('form.toasts.locationHistoryError'));
        throw error;
      }
    },
    [isEdit, handleHistoryError, t]
  );

  const handleAddMaintenanceHistory = useCallback(
    async (data: CreateMaintenanceHistoryInput) => {
      if (isEdit && equipmentUuid) {
        try {
          const newItem = await equipmentApi.createMaintenanceHistory(equipmentUuid, data);
          setMaintenanceHistory((prev) => [newItem, ...prev]);
          toast({
            title: t('form.toasts.maintenanceHistoryAdd'),
            description: t('form.toasts.historySaved'),
          });
        } catch (error) {
          handleHistoryError(error, t('form.toasts.maintenanceHistoryError'));
          throw error;
        }
      } else {
        const tempId = generateTempId();
        const tempItem: MaintenanceHistoryItem = {
          id: tempId,
          equipmentId: '',
          performedAt: new Date(data.performedAt),
          content: data.content,
          createdAt: new Date(),
        };
        setMaintenanceHistory((prev) => [tempItem, ...prev]);
        setPendingMaintenanceHistory((prev) => [...prev, { tempId, data }]);
      }
    },
    [isEdit, equipmentUuid, toast, handleHistoryError, generateTempId, t]
  );

  const handleDeleteMaintenanceHistory = useCallback(
    async (historyId: string) => {
      try {
        if (isEdit) await equipmentApi.deleteMaintenanceHistory(historyId);
        setMaintenanceHistory((prev) => prev.filter((item) => item.id !== historyId));
        if (!isEdit && historyId.startsWith('temp-')) {
          setPendingMaintenanceHistory((prev) => prev.filter((item) => item.tempId !== historyId));
        }
      } catch (error) {
        handleHistoryError(error, t('form.toasts.maintenanceHistoryError'));
        throw error;
      }
    },
    [isEdit, handleHistoryError, t]
  );

  const handleAddIncidentHistory = useCallback(
    async (data: CreateIncidentHistoryInput) => {
      if (isEdit && equipmentUuid) {
        try {
          const newItem = await equipmentApi.createIncidentHistory(equipmentUuid, data);
          setIncidentHistory((prev) => [newItem, ...prev]);
          toast({
            title: t('form.toasts.incidentHistoryAdd'),
            description: t('form.toasts.historySaved'),
          });
        } catch (error) {
          handleHistoryError(error, t('form.toasts.incidentHistoryError'));
          throw error;
        }
      } else {
        const tempId = generateTempId();
        const tempItem: IncidentHistoryItem = {
          id: tempId,
          equipmentId: '',
          occurredAt: new Date(data.occurredAt),
          incidentType: data.incidentType,
          content: data.content,
          createdAt: new Date(),
        };
        setIncidentHistory((prev) => [tempItem, ...prev]);
        setPendingIncidentHistory((prev) => [...prev, { tempId, data }]);
      }
    },
    [isEdit, equipmentUuid, toast, handleHistoryError, generateTempId, t]
  );

  const handleDeleteIncidentHistory = useCallback(
    async (historyId: string) => {
      try {
        if (isEdit) await equipmentApi.deleteIncidentHistory(historyId);
        setIncidentHistory((prev) => prev.filter((item) => item.id !== historyId));
        if (!isEdit && historyId.startsWith('temp-')) {
          setPendingIncidentHistory((prev) => prev.filter((item) => item.tempId !== historyId));
        }
      } catch (error) {
        handleHistoryError(error, t('form.toasts.incidentHistoryError'));
        throw error;
      }
    },
    [isEdit, handleHistoryError, t]
  );

  const handleAddCalibrationHistory = useCallback(
    async (data: CreateCalibrationHistoryInput) => {
      const tempId = generateTempId();
      const tempItem: CalibrationRecord = {
        id: tempId,
        calibrationDate: data.calibrationDate,
        nextCalibrationDate: data.nextCalibrationDate,
        calibrationAgency: data.calibrationAgency,
        result: data.result,
        status: 'completed',
        approvalStatus: CalibrationApprovalStatusValues.APPROVED,
      };
      setCalibrationHistory((prev) => [tempItem, ...prev]);
      setPendingCalibrationHistory((prev) => [...prev, { tempId, data }]);
      toast({
        title: t('form.toasts.calibrationHistoryAdd'),
        description: t('form.toasts.calibrationHistoryTempSaved'),
      });
    },
    [toast, generateTempId, t]
  );

  const handleDeleteCalibrationHistory = useCallback(async (historyId: string) => {
    setCalibrationHistory((prev) => prev.filter((item) => item.id !== historyId));
    if (historyId.startsWith('temp-')) {
      setPendingCalibrationHistory((prev) => prev.filter((item) => item.tempId !== historyId));
    }
  }, []);

  // 제출 시 pendingHistory 빌드 (임시 → PendingHistoryData 변환)
  const pendingHistory: PendingHistoryData | undefined =
    !isEdit &&
    (pendingLocationHistory.length > 0 ||
      pendingMaintenanceHistory.length > 0 ||
      pendingIncidentHistory.length > 0 ||
      pendingCalibrationHistory.length > 0)
      ? {
          locationHistory: pendingLocationHistory.map((item) => item.data),
          maintenanceHistory: pendingMaintenanceHistory.map((item) => item.data),
          incidentHistory: pendingIncidentHistory.map((item) => item.data),
          calibrationHistory: pendingCalibrationHistory.map((item) => item.data),
        }
      : undefined;

  return {
    locationHistory,
    maintenanceHistory,
    incidentHistory,
    calibrationHistory,
    isHistoryLoading,
    pendingHistory,
    handleAddLocationHistory,
    handleDeleteLocationHistory,
    handleAddMaintenanceHistory,
    handleDeleteMaintenanceHistory,
    handleAddIncidentHistory,
    handleDeleteIncidentHistory,
    handleAddCalibrationHistory,
    handleDeleteCalibrationHistory,
  };
}
