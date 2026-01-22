'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  type EquipmentStatus,
  type CalibrationMethod,
  type Site,
  type SpecMatch,
  type CalibrationRequired,
} from '@equipment-management/schemas';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { type UploadedFile } from '@/components/shared/FileUpload';
import { BasicInfoSection, FormValues } from './BasicInfoSection';
import { CalibrationInfoSection } from './CalibrationInfoSection';
import { StatusLocationSection } from './StatusLocationSection';
import { AttachmentSection } from './AttachmentSection';
import { LocationHistorySection } from './LocationHistorySection';
import { MaintenanceHistorySection } from './MaintenanceHistorySection';
import { IncidentHistorySection } from './IncidentHistorySection';
import { CalibrationHistorySection, type CreateCalibrationHistoryInput } from './CalibrationHistorySection';
import { AlertCircle, CheckCircle2, Clock, Shield } from 'lucide-react';
import dayjs from 'dayjs';
import equipmentApi, {
  type LocationHistoryItem,
  type MaintenanceHistoryItem,
  type IncidentHistoryItem,
  type CreateLocationHistoryInput,
  type CreateMaintenanceHistoryInput,
  type CreateIncidentHistoryInput,
} from '@/lib/api/equipment-api';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/lib/errors/equipment-errors';

// 동적 Zod 스키마 생성 함수
const createDynamicSchema = (
  calibrationMethod?: CalibrationMethod,
  needsIntermediateCheck?: boolean
) => {
  return z.object({
    // 필수 필드
    name: z.string().min(2, '장비명은 최소 2자 이상이어야 합니다').max(100),
    managementNumber: z.string().min(2, '관리번호는 최소 2자 이상이어야 합니다').max(50),
    site: z.enum(['suwon', 'uiwang']),
    teamId: z.union([z.string(), z.number()]).optional(),
    modelName: z.string().min(1, '모델명을 입력하세요').optional(),
    manufacturer: z.string().min(1, '제조사를 입력하세요').optional(),
    manufacturerContact: z.string().optional(),
    serialNumber: z.string().min(1, '일련번호를 입력하세요').optional(),
    location: z.string().min(1, '현재 위치를 입력하세요').optional(),
    technicalManager: z.string().min(1, '기술책임자를 입력하세요').optional(),
    calibrationMethod: z.enum(['external_calibration', 'self_inspection', 'not_applicable']).optional(),

    // 조건부 필수 필드 - 외부 교정일 때
    ...(calibrationMethod === 'external_calibration' && {
      calibrationCycle: z.number().int().positive('교정 주기를 입력하세요'),
      lastCalibrationDate: z.string().min(1, '최종 교정일을 입력하세요'),
      calibrationAgency: z.string().min(1, '교정 기관을 입력하세요'),
    }),

    // 조건부 필수 필드 - 중간점검 대상일 때
    ...(needsIntermediateCheck && {
      lastIntermediateCheckDate: z.string().min(1, '최종 중간 점검일을 입력하세요'),
      intermediateCheckCycle: z.number().int().positive('중간점검 주기를 입력하세요'),
    }),

    // 선택적 필드
    assetNumber: z.string().optional(),
    description: z.string().optional(),
    specMatch: z.enum(['match', 'mismatch']).optional(),
    calibrationRequired: z.enum(['required', 'not_required']).optional(),
    calibrationCycle: z.number().int().positive().optional(),
    lastCalibrationDate: z.string().optional(),
    nextCalibrationDate: z.string().optional(),
    calibrationAgency: z.string().optional(),
    needsIntermediateCheck: z.boolean().optional(),
    lastIntermediateCheckDate: z.string().optional(),
    intermediateCheckCycle: z.number().int().positive().optional(),
    nextIntermediateCheckDate: z.string().optional(),
    purchaseYear: z.number().int().min(1990).max(2100).optional(),
    supplier: z.string().optional(),
    contactInfo: z.string().optional(),
    softwareVersion: z.string().optional(),
    firmwareVersion: z.string().optional(),
    manualLocation: z.string().optional(),
    accessories: z.string().optional(),
    initialLocation: z.string().optional(),
    installationDate: z.string().optional(),
    status: z.enum([
      'available', 'in_use', 'checked_out', 'calibration_scheduled',
      'calibration_overdue', 'non_conforming', 'spare', 'retired'
    ]).optional(),
    calibrationResult: z.string().optional(),
    correctionFactor: z.string().optional(),
  });
};

// 임시 이력 타입 (등록 모드에서 사용)
export interface PendingHistoryData {
  locationHistory: CreateLocationHistoryInput[];
  maintenanceHistory: CreateMaintenanceHistoryInput[];
  incidentHistory: CreateIncidentHistoryInput[];
  calibrationHistory: CreateCalibrationHistoryInput[];
}

interface EquipmentFormProps {
  initialData?: Partial<FormValues & { uuid?: string }>;
  onSubmit: (
    data: any,
    files?: UploadedFile[],
    pendingHistory?: PendingHistoryData
  ) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
  existingAttachments?: Array<{
    uuid: string;
    fileName: string;
    fileSize: number;
    attachmentType: string;
    createdAt: string;
  }>;
}

/**
 * 역할별 권한 정보
 */
const ROLE_INFO = {
  test_engineer: {
    label: '시험실무자',
    needsApproval: true,
    description: '등록/수정 요청 후 기술책임자의 승인이 필요합니다.',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  technical_manager: {
    label: '기술책임자',
    needsApproval: false,
    description: '직접 등록/수정이 가능합니다. (승인 불필요)',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  lab_manager: {
    label: '시험소 관리자',
    needsApproval: false,
    description: '전체 권한으로 직접 등록/수정이 가능합니다.',
    icon: Shield,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  system_admin: {
    label: '시스템 관리자',
    needsApproval: false,
    description: '전체 시스템 권한으로 직접 등록/수정이 가능합니다.',
    icon: Shield,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
};

export function EquipmentForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  isLoading = false,
  existingAttachments = [],
}: EquipmentFormProps) {
  // 사용자 정보 가져오기
  const { user, isManager, isAdmin } = useAuth();
  const { toast } = useToast();
  const userSite = (user as { site?: Site })?.site;
  const userRoles = (user as { roles?: string[] })?.roles || [];

  // 사용자 역할 결정
  const userRole = useMemo(() => {
    if (userRoles.some((r) => ['system_admin', 'SYSTEM_ADMIN'].includes(r))) return 'system_admin';
    if (userRoles.some((r) => ['lab_manager', 'LAB_MANAGER', 'admin', 'ADMIN'].includes(r)))
      return 'lab_manager';
    if (
      userRoles.some((r) =>
        ['technical_manager', 'TECHNICAL_MANAGER', 'manager', 'MANAGER'].includes(r)
      )
    )
      return 'technical_manager';
    return 'test_engineer';
  }, [userRoles]);

  const roleInfo = ROLE_INFO[userRole];
  const needsApproval = roleInfo.needsApproval;

  // 확인 모달 상태
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  // 사이트 선택 상태
  const [selectedSite, setSelectedSite] = useState<Site | undefined>(
    (initialData?.site || userSite) as Site | undefined
  );

  // 파일 업로드 상태
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // 이력 데이터 상태 (수정 모드: 실제 데이터, 등록 모드: 임시 데이터)
  const [locationHistory, setLocationHistory] = useState<LocationHistoryItem[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistoryItem[]>([]);
  const [incidentHistory, setIncidentHistory] = useState<IncidentHistoryItem[]>([]);
  const [calibrationHistory, setCalibrationHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // 등록 모드용 임시 이력 상태 (장비 생성 후 일괄 저장)
  const [pendingLocationHistory, setPendingLocationHistory] = useState<CreateLocationHistoryInput[]>([]);
  const [pendingMaintenanceHistory, setPendingMaintenanceHistory] = useState<CreateMaintenanceHistoryInput[]>([]);
  const [pendingIncidentHistory, setPendingIncidentHistory] = useState<CreateIncidentHistoryInput[]>([]);
  const [pendingCalibrationHistory, setPendingCalibrationHistory] = useState<CreateCalibrationHistoryInput[]>([]);

  // 기본 스키마로 폼 초기화
  const form = useForm<FormValues>({
    defaultValues: {
      name: initialData?.name || '',
      managementNumber: initialData?.managementNumber || '',
      assetNumber: initialData?.assetNumber || '',
      modelName: initialData?.modelName || '',
      manufacturer: initialData?.manufacturer || '',
      manufacturerContact: (initialData as any)?.manufacturerContact || '',
      serialNumber: initialData?.serialNumber || '',
      location: initialData?.location || '',
      description: initialData?.description || '',
      specMatch: (initialData as any)?.specMatch || undefined,
      calibrationRequired: (initialData as any)?.calibrationRequired || undefined,
      calibrationCycle: initialData?.calibrationCycle,
      lastCalibrationDate: initialData?.lastCalibrationDate
        ? dayjs(initialData.lastCalibrationDate).format('YYYY-MM-DD')
        : '',
      nextCalibrationDate: initialData?.nextCalibrationDate
        ? dayjs(initialData.nextCalibrationDate).format('YYYY-MM-DD')
        : '',
      calibrationAgency: initialData?.calibrationAgency || '',
      needsIntermediateCheck: initialData?.needsIntermediateCheck || false,
      calibrationMethod: initialData?.calibrationMethod,
      lastIntermediateCheckDate: (initialData as any)?.lastIntermediateCheckDate
        ? dayjs((initialData as any).lastIntermediateCheckDate).format('YYYY-MM-DD')
        : '',
      intermediateCheckCycle: (initialData as any)?.intermediateCheckCycle,
      nextIntermediateCheckDate: (initialData as any)?.nextIntermediateCheckDate
        ? dayjs((initialData as any).nextIntermediateCheckDate).format('YYYY-MM-DD')
        : '',
      purchaseYear:
        initialData?.purchaseYear !== undefined && initialData?.purchaseYear !== null
          ? Number(initialData.purchaseYear)
          : undefined,
      teamId:
        initialData?.teamId !== undefined && initialData?.teamId !== null
          ? Number(initialData.teamId)
          : undefined,
      site: (initialData?.site || userSite) as Site | undefined,
      supplier: initialData?.supplier || '',
      contactInfo: initialData?.contactInfo || '',
      softwareVersion: initialData?.softwareVersion || '',
      firmwareVersion: initialData?.firmwareVersion || '',
      manualLocation: initialData?.manualLocation || '',
      accessories: initialData?.accessories || '',
      technicalManager: initialData?.technicalManager || '',
      initialLocation: (initialData as any)?.initialLocation || '',
      installationDate: (initialData as any)?.installationDate
        ? dayjs((initialData as any).installationDate).format('YYYY-MM-DD')
        : '',
      status: (initialData?.status || 'available') as EquipmentStatus,
      calibrationResult: initialData?.calibrationResult || '',
      correctionFactor: initialData?.correctionFactor || '',
    },
  });

  // 수정 모드일 때 이력 데이터 로드
  useEffect(() => {
    if (isEdit && initialData?.uuid) {
      const loadHistory = async () => {
        setIsHistoryLoading(true);
        try {
          const [locations, maintenance, incidents, calibrations] = await Promise.all([
            equipmentApi.getLocationHistory(initialData.uuid!).catch(() => []),
            equipmentApi.getMaintenanceHistory(initialData.uuid!).catch(() => []),
            equipmentApi.getIncidentHistory(initialData.uuid!).catch(() => []),
            equipmentApi.getCalibrationHistory(initialData.uuid!).catch(() => []),
          ]);
          setLocationHistory(locations);
          setMaintenanceHistory(maintenance);
          setIncidentHistory(incidents);
          setCalibrationHistory(calibrations);
        } catch (error) {
          console.error('Failed to load history:', error);
        } finally {
          setIsHistoryLoading(false);
        }
      };
      loadHistory();
    }
  }, [isEdit, initialData?.uuid]);

  /**
   * 이력 저장 에러 핸들러
   */
  const handleHistoryError = useCallback((error: unknown, historyType: string) => {
    const errorMessage = error instanceof ApiError
      ? error.getUserMessage()
      : error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.';

    toast({
      title: `${historyType} 저장 실패`,
      description: errorMessage,
      variant: 'destructive',
    });
  }, [toast]);

  // 이력 추가/삭제 핸들러 (수정 모드: API 호출, 등록 모드: 임시 상태 업데이트)
  const handleAddLocationHistory = useCallback(async (data: CreateLocationHistoryInput) => {
    if (isEdit && initialData?.uuid) {
      // 수정 모드: API 호출
      try {
        const newItem = await equipmentApi.createLocationHistory(initialData.uuid, data);
        setLocationHistory((prev) => [newItem, ...prev]);
        toast({
          title: '위치 변동 이력 추가',
          description: '이력이 저장되었습니다.',
        });
      } catch (error) {
        handleHistoryError(error, '위치 변동 이력');
        throw error; // 상위 컴포넌트에서 처리할 수 있도록 재throw
      }
    } else {
      // 등록 모드: 임시 상태에 추가 (화면 표시용 + 나중에 일괄 저장)
      const tempItem: LocationHistoryItem = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        equipmentId: '',
        changedAt: new Date(data.changedAt),
        newLocation: data.newLocation,
        notes: data.notes,
        createdAt: new Date(),
      };
      setLocationHistory((prev) => [tempItem, ...prev]);
      setPendingLocationHistory((prev) => [...prev, data]);
    }
  }, [isEdit, initialData?.uuid, toast, handleHistoryError]);

  const handleDeleteLocationHistory = useCallback(async (historyId: string) => {
    try {
      if (isEdit) {
        // 수정 모드: API 호출
        await equipmentApi.deleteLocationHistory(historyId);
      }
      // 둘 다 로컬 상태에서 제거
      setLocationHistory((prev) => prev.filter((item) => item.id !== historyId));
      // 등록 모드인 경우 pending에서도 제거 (인덱스 기반)
      if (!isEdit && historyId.startsWith('temp-')) {
        const index = locationHistory.findIndex((item) => item.id === historyId);
        if (index !== -1) {
          setPendingLocationHistory((prev) => prev.filter((_, i) => i !== index));
        }
      }
    } catch (error) {
      handleHistoryError(error, '위치 변동 이력 삭제');
      throw error;
    }
  }, [isEdit, locationHistory, handleHistoryError]);

  const handleAddMaintenanceHistory = useCallback(async (data: CreateMaintenanceHistoryInput) => {
    if (isEdit && initialData?.uuid) {
      // 수정 모드: API 호출
      try {
        const newItem = await equipmentApi.createMaintenanceHistory(initialData.uuid, data);
        setMaintenanceHistory((prev) => [newItem, ...prev]);
        toast({
          title: '유지보수 내역 추가',
          description: '이력이 저장되었습니다.',
        });
      } catch (error) {
        handleHistoryError(error, '유지보수 내역');
        throw error;
      }
    } else {
      // 등록 모드: 임시 상태에 추가
      const tempItem: MaintenanceHistoryItem = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        equipmentId: '',
        performedAt: new Date(data.performedAt),
        content: data.content,
        createdAt: new Date(),
      };
      setMaintenanceHistory((prev) => [tempItem, ...prev]);
      setPendingMaintenanceHistory((prev) => [...prev, data]);
    }
  }, [isEdit, initialData?.uuid, toast, handleHistoryError]);

  const handleDeleteMaintenanceHistory = useCallback(async (historyId: string) => {
    try {
      if (isEdit) {
        // 수정 모드: API 호출
        await equipmentApi.deleteMaintenanceHistory(historyId);
      }
      setMaintenanceHistory((prev) => prev.filter((item) => item.id !== historyId));
      if (!isEdit && historyId.startsWith('temp-')) {
        const index = maintenanceHistory.findIndex((item) => item.id === historyId);
        if (index !== -1) {
          setPendingMaintenanceHistory((prev) => prev.filter((_, i) => i !== index));
        }
      }
    } catch (error) {
      handleHistoryError(error, '유지보수 내역 삭제');
      throw error;
    }
  }, [isEdit, maintenanceHistory, handleHistoryError]);

  const handleAddIncidentHistory = useCallback(async (data: CreateIncidentHistoryInput) => {
    if (isEdit && initialData?.uuid) {
      // 수정 모드: API 호출
      try {
        const newItem = await equipmentApi.createIncidentHistory(initialData.uuid, data);
        setIncidentHistory((prev) => [newItem, ...prev]);
        toast({
          title: '손상/수리 내역 추가',
          description: '이력이 저장되었습니다.',
        });
      } catch (error) {
        handleHistoryError(error, '손상/수리 내역');
        throw error;
      }
    } else {
      // 등록 모드: 임시 상태에 추가
      const tempItem: IncidentHistoryItem = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        equipmentId: '',
        occurredAt: new Date(data.occurredAt),
        incidentType: data.incidentType,
        content: data.content,
        createdAt: new Date(),
      };
      setIncidentHistory((prev) => [tempItem, ...prev]);
      setPendingIncidentHistory((prev) => [...prev, data]);
    }
  }, [isEdit, initialData?.uuid, toast, handleHistoryError]);

  const handleDeleteIncidentHistory = useCallback(async (historyId: string) => {
    try {
      if (isEdit) {
        // 수정 모드: API 호출
        await equipmentApi.deleteIncidentHistory(historyId);
      }
      setIncidentHistory((prev) => prev.filter((item) => item.id !== historyId));
      if (!isEdit && historyId.startsWith('temp-')) {
        const index = incidentHistory.findIndex((item) => item.id === historyId);
        if (index !== -1) {
          setPendingIncidentHistory((prev) => prev.filter((_, i) => i !== index));
        }
      }
    } catch (error) {
      handleHistoryError(error, '손상/수리 내역 삭제');
      throw error;
    }
  }, [isEdit, incidentHistory, handleHistoryError]);

  // 교정 이력 추가/삭제 핸들러 (등록 모드용)
  const handleAddCalibrationHistory = useCallback(async (data: CreateCalibrationHistoryInput) => {
    // 등록 모드: 임시 상태에 추가
    const tempItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      calibrationDate: data.calibrationDate,
      nextCalibrationDate: data.nextCalibrationDate,
      calibrationAgency: data.calibrationAgency,
      calibrationResult: data.calibrationResult,
      status: 'completed',
      approvalStatus: 'approved',
    };
    setCalibrationHistory((prev) => [tempItem, ...prev]);
    setPendingCalibrationHistory((prev) => [...prev, data]);
    toast({
      title: '교정 이력 추가',
      description: '임시로 추가되었습니다. 장비 등록 시 함께 저장됩니다.',
    });
  }, [toast]);

  const handleDeleteCalibrationHistory = useCallback(async (historyId: string) => {
    setCalibrationHistory((prev) => prev.filter((item) => item.id !== historyId));
    if (historyId.startsWith('temp-')) {
      const index = calibrationHistory.findIndex((item) => item.id === historyId);
      if (index !== -1) {
        setPendingCalibrationHistory((prev) => prev.filter((_, i) => i !== index));
      }
    }
  }, [calibrationHistory]);

  // 폼 제출 핸들러
  const handleFormSubmit = async (data: FormValues) => {
    // 승인 필요 시 확인 모달 표시
    if (needsApproval) {
      setPendingFormData(data);
      setShowConfirmDialog(true);
      return;
    }

    await processSubmit(data);
  };

  // 실제 제출 처리
  const processSubmit = async (data: FormValues) => {
    // 날짜 문자열을 Date 객체로 변환
    const processedData = {
      name: data.name,
      managementNumber: data.managementNumber,
      assetNumber: data.assetNumber || undefined,
      modelName: data.modelName || undefined,
      manufacturer: data.manufacturer || undefined,
      manufacturerContact: data.manufacturerContact || undefined,
      serialNumber: data.serialNumber || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
      specMatch: data.specMatch || undefined,
      calibrationRequired: data.calibrationRequired || undefined,
      calibrationCycle: data.calibrationCycle || undefined,
      lastCalibrationDate: data.lastCalibrationDate
        ? dayjs(data.lastCalibrationDate).toDate()
        : undefined,
      nextCalibrationDate: data.nextCalibrationDate
        ? dayjs(data.nextCalibrationDate).toDate()
        : undefined,
      calibrationAgency: data.calibrationAgency || undefined,
      needsIntermediateCheck: data.needsIntermediateCheck || false,
      calibrationMethod: data.calibrationMethod || undefined,
      lastIntermediateCheckDate: data.lastIntermediateCheckDate
        ? dayjs(data.lastIntermediateCheckDate).toDate()
        : undefined,
      intermediateCheckCycle: data.intermediateCheckCycle || undefined,
      nextIntermediateCheckDate: data.nextIntermediateCheckDate
        ? dayjs(data.nextIntermediateCheckDate).toDate()
        : undefined,
      purchaseYear: data.purchaseYear || undefined,
      teamId: data.teamId || undefined,
      site: data.site || undefined,
      supplier: data.supplier && data.supplier.trim() ? data.supplier : undefined,
      contactInfo: data.contactInfo && data.contactInfo.trim() ? data.contactInfo : undefined,
      softwareVersion:
        data.softwareVersion && data.softwareVersion.trim() ? data.softwareVersion : undefined,
      firmwareVersion:
        data.firmwareVersion && data.firmwareVersion.trim() ? data.firmwareVersion : undefined,
      manualLocation:
        data.manualLocation && data.manualLocation.trim() ? data.manualLocation : undefined,
      accessories: data.accessories && data.accessories.trim() ? data.accessories : undefined,
      technicalManager:
        data.technicalManager && data.technicalManager.trim() ? data.technicalManager : undefined,
      initialLocation:
        data.initialLocation && data.initialLocation.trim() ? data.initialLocation : undefined,
      installationDate: data.installationDate
        ? dayjs(data.installationDate).toDate()
        : undefined,
      status: data.status || undefined,
      calibrationResult:
        data.calibrationResult && data.calibrationResult.trim() ? data.calibrationResult : undefined,
      correctionFactor:
        data.correctionFactor && data.correctionFactor.trim() ? data.correctionFactor : undefined,
    };

    // 등록 모드일 때 임시 이력 데이터 전달
    const pendingHistory: PendingHistoryData | undefined = !isEdit && (
      pendingLocationHistory.length > 0 ||
      pendingMaintenanceHistory.length > 0 ||
      pendingIncidentHistory.length > 0 ||
      pendingCalibrationHistory.length > 0
    ) ? {
      locationHistory: pendingLocationHistory,
      maintenanceHistory: pendingMaintenanceHistory,
      incidentHistory: pendingIncidentHistory,
      calibrationHistory: pendingCalibrationHistory,
    } : undefined;

    await onSubmit(
      processedData,
      uploadedFiles.length > 0 ? uploadedFiles : undefined,
      pendingHistory
    );
  };

  // 확인 모달에서 제출
  const handleConfirmSubmit = async () => {
    if (pendingFormData) {
      setShowConfirmDialog(false);
      await processSubmit(pendingFormData);
      setPendingFormData(null);
    }
  };

  // 사이트 변경 핸들러
  const handleSiteChange = (site: Site) => {
    setSelectedSite(site);
    // 팀 선택 초기화
    form.setValue('teamId', undefined);
  };

  const RoleIcon = roleInfo.icon;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 역할별 안내 배너 */}
        <Alert className={roleInfo.color}>
          <RoleIcon className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            현재 권한: {roleInfo.label}
            <Badge variant="outline" className={roleInfo.color}>
              {needsApproval ? '승인 필요' : '직접 처리'}
            </Badge>
          </AlertTitle>
          <AlertDescription>{roleInfo.description}</AlertDescription>
        </Alert>

        {/* 섹션 1: 기본 정보 */}
        <BasicInfoSection
          control={form.control}
          isEdit={isEdit}
          selectedSite={selectedSite}
          onSiteChange={handleSiteChange}
        />

        {/* 섹션 2: 교정 정보 */}
        <CalibrationInfoSection control={form.control} />

        {/* 섹션 3: 상태 및 위치 */}
        <StatusLocationSection
          control={form.control}
          isEdit={isEdit}
          selectedSite={selectedSite}
          selectedTeamId={form.watch('teamId')}
        />

        {/* 섹션 4: 파일 첨부 */}
        <AttachmentSection
          files={uploadedFiles}
          onChange={setUploadedFiles}
          isEdit={isEdit}
          isLoading={isLoading}
          existingAttachments={existingAttachments}
        />

        {/* 섹션 5-8: 이력 관리 (등록/수정 모두 가능) */}
        {/* 등록 모드 안내 */}
        {!isEdit && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>이력 관리 안내</AlertTitle>
            <AlertDescription>
              아래에서 이력 정보를 미리 입력할 수 있습니다. 장비 등록 완료 시 함께 저장됩니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 섹션 5: 위치 변동 이력 */}
        <LocationHistorySection
          equipmentUuid={initialData?.uuid || 'new'}
          history={locationHistory}
          onAdd={handleAddLocationHistory}
          onDelete={handleDeleteLocationHistory}
          isLoading={isHistoryLoading}
          disabled={isLoading}
        />

        {/* 섹션 6: 유지보수 내역 */}
        <MaintenanceHistorySection
          equipmentUuid={initialData?.uuid || 'new'}
          history={maintenanceHistory}
          onAdd={handleAddMaintenanceHistory}
          onDelete={handleDeleteMaintenanceHistory}
          isLoading={isHistoryLoading}
          disabled={isLoading}
        />

        {/* 섹션 7: 손상/오작동/변경/수리 내역 */}
        <IncidentHistorySection
          equipmentUuid={initialData?.uuid || 'new'}
          history={incidentHistory}
          onAdd={handleAddIncidentHistory}
          onDelete={handleDeleteIncidentHistory}
          isLoading={isHistoryLoading}
          disabled={isLoading}
        />

        {/* 섹션 8: 교정 이력 (등록/수정 모두 가능) */}
        <CalibrationHistorySection
          equipmentUuid={initialData?.uuid}
          history={calibrationHistory}
          onAdd={!isEdit ? handleAddCalibrationHistory : undefined}
          onDelete={!isEdit ? handleDeleteCalibrationHistory : undefined}
          isLoading={isHistoryLoading}
          disabled={isLoading}
          isCreateMode={!isEdit}
        />

        {/* 버튼 */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '처리 중...' : isEdit ? '수정' : '등록'}
            {needsApproval && !isLoading && ' (승인 요청)'}
          </Button>
        </div>
      </form>

      {/* 승인 요청 확인 모달 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              {isEdit ? '수정 요청 확인' : '등록 요청 확인'}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? '장비 정보 수정을 요청하시겠습니까?'
                : '새 장비 등록을 요청하시겠습니까?'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>승인 프로세스 안내</AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>요청 후 기술책임자의 승인이 필요합니다.</li>
                  <li>승인 전까지 장비 정보는 반영되지 않습니다.</li>
                  <li>요청 상태는 알림에서 확인할 수 있습니다.</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={isLoading}>
              {isLoading ? '처리 중...' : '요청하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
