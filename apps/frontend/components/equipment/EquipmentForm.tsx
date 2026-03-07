'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import {
  type EquipmentStatus,
  type Site,
  createEquipmentSchema,
  updateEquipmentSchema,
} from '@equipment-management/schemas';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type UploadedFile } from '@/components/shared/FileUpload';
import { BasicInfoSection, type FormValues } from './BasicInfoSection';
import { CalibrationValidityChecker } from './CalibrationValidityChecker';
import { ManagementNumberPreviewBar } from './ManagementNumberPreviewBar';
import { FormWizardStepper, type WizardStep } from '@/components/shared/FormWizardStepper';
import { AlertCircle, CheckCircle2, Clock, Shield } from 'lucide-react';
import { FORM_WIZARD_STEP_TRANSITION, FORM_WIZARD_NAVIGATION_TOKENS } from '@/lib/design-tokens';
import { formatDate, toDate } from '@/lib/utils/date';
import type { CreateCalibrationHistoryInput, CalibrationRecord } from './CalibrationHistorySection';

// ✅ Dynamic import로 무거운 섹션 지연 로딩 (초기 번들 크기 감소)
const CalibrationInfoSection = dynamic(
  () => import('./CalibrationInfoSection').then((mod) => mod.CalibrationInfoSection),
  { loading: () => <Skeleton className="h-64 w-full" />, ssr: false }
);

const StatusLocationSection = dynamic(
  () => import('./StatusLocationSection').then((mod) => mod.StatusLocationSection),
  { loading: () => <Skeleton className="h-48 w-full" />, ssr: false }
);

const AttachmentSection = dynamic(
  () => import('./AttachmentSection').then((mod) => mod.AttachmentSection),
  { loading: () => <Skeleton className="h-32 w-full" />, ssr: false }
);

const LocationHistorySection = dynamic(
  () => import('./LocationHistorySection').then((mod) => mod.LocationHistorySection),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);

const MaintenanceHistorySection = dynamic(
  () => import('./MaintenanceHistorySection').then((mod) => mod.MaintenanceHistorySection),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);

const IncidentHistorySection = dynamic(
  () => import('./IncidentHistorySection').then((mod) => mod.IncidentHistorySection),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);

const CalibrationHistorySection = dynamic(
  () => import('./CalibrationHistorySection').then((mod) => mod.CalibrationHistorySection),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);
import equipmentApi from '@/lib/api/equipment-api';
import { useTranslations } from 'next-intl';
import type {
  LocationHistoryItem,
  MaintenanceHistoryItem,
  IncidentHistoryItem,
  CreateLocationHistoryInput,
  CreateMaintenanceHistoryInput,
  CreateIncidentHistoryInput,
} from '@/lib/api/equipment-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/lib/errors/equipment-errors';
import { useManagementNumberCheck } from '@/hooks/use-management-number-check';
import { sanitizeFormData } from '@/lib/utils/form-data-utils';

// 임시 이력 타입 (등록 모드에서 사용)
export interface PendingHistoryData {
  locationHistory: CreateLocationHistoryInput[];
  maintenanceHistory: CreateMaintenanceHistoryInput[];
  incidentHistory: CreateIncidentHistoryInput[];
  calibrationHistory: CreateCalibrationHistoryInput[];
}

/**
 * ★ Best Practice: 임시 이력 항목 타입 (고유 ID 매핑용)
 * - 기존 인덱스 기반 삭제는 동기화 문제 발생 가능
 * - tempId를 키로 사용하여 안전하게 매핑
 */
interface PendingHistoryItem<T> {
  tempId: string;
  data: T;
}

type PendingLocationHistoryItem = PendingHistoryItem<CreateLocationHistoryInput>;
type PendingMaintenanceHistoryItem = PendingHistoryItem<CreateMaintenanceHistoryInput>;
type PendingIncidentHistoryItem = PendingHistoryItem<CreateIncidentHistoryInput>;
type PendingCalibrationHistoryItem = PendingHistoryItem<CreateCalibrationHistoryInput>;

interface EquipmentFormProps {
  initialData?: Partial<FormValues & { uuid?: string }>;
  onSubmit: (
    data: Record<string, unknown>,
    files?: UploadedFile[],
    pendingHistory?: PendingHistoryData
  ) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
  mode?: 'normal' | 'temporary'; // 임시등록 모드 추가 (공용/렌탈 장비)
  existingAttachments?: Array<{
    uuid: string;
    fileName: string;
    fileSize: number;
    attachmentType: string;
    createdAt: string;
  }>;
  /** Server Component에서 전달하는 사용자 기본값 (mount 시점에 즉시 사용 가능) */
  userDefaults?: {
    site?: string;
    teamId?: string;
  };
}

/**
 * 역할별 권한 정보 (i18n 키와 정적 속성만 유지)
 */
const ROLE_INFO = {
  test_engineer: {
    needsApproval: true,
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  technical_manager: {
    needsApproval: false,
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  lab_manager: {
    needsApproval: false,
    icon: Shield,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  system_admin: {
    needsApproval: false,
    icon: Shield,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
};

/**
 * ✅ SSOT: 필드명 i18n 키 매핑 (사용자 친화적 에러 메시지용)
 * 실제 라벨은 t('form.fieldLabels.{key}')로 가져옴
 */
const FIELD_LABEL_KEYS: Record<string, string> = {
  name: 'name',
  managementNumber: 'managementNumber',
  site: 'site',
  teamId: 'teamId',
  modelName: 'modelName',
  manufacturer: 'manufacturer',
  serialNumber: 'serialNumber',
  location: 'location',
  calibrationCycle: 'calibrationCycle',
  lastCalibrationDate: 'lastCalibrationDate',
  nextCalibrationDate: 'nextCalibrationDate',
  calibrationAgency: 'calibrationAgency',
  calibrationMethod: 'calibrationMethod',
  lastIntermediateCheckDate: 'lastIntermediateCheckDate',
  intermediateCheckCycle: 'intermediateCheckCycle',
  technicalManager: 'technicalManager',
};

export function EquipmentForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  isLoading = false,
  mode = 'normal',
  existingAttachments = [],
  userDefaults,
}: EquipmentFormProps) {
  const t = useTranslations('equipment');
  // 임시등록 모드 여부
  const isTemporary = mode === 'temporary';
  // 사용자 정보 가져오기
  const { user, isManager: _isManager, isAdmin: _isAdmin } = useAuth();
  const { toast } = useToast();
  const userSite = (user as { site?: Site })?.site;
  const userTeamId = (user as { teamId?: string })?.teamId;

  // ✅ Server Component에서 전달받은 기본값 우선 사용 (mount 시점에 즉시 사용 가능)
  // useAuth()는 비동기 로딩이라 mount 시점에 undefined → useForm defaultValues에 반영 불가
  const effectiveSite = (initialData?.site || userDefaults?.site || userSite) as Site | undefined;
  const effectiveTeamId =
    initialData?.teamId !== undefined && initialData?.teamId !== null
      ? String(initialData.teamId)
      : userDefaults?.teamId || userTeamId || undefined;

  // 사용자 역할 결정 - useMemo 내부에서 직접 roles 접근하여 의존성 안정화
  const userRole = useMemo(() => {
    const roles = (user as { roles?: string[] })?.roles || [];
    if (roles.some((r) => ['system_admin', 'SYSTEM_ADMIN'].includes(r))) return 'system_admin';
    if (roles.some((r) => ['lab_manager', 'LAB_MANAGER', 'admin', 'ADMIN'].includes(r)))
      return 'lab_manager';
    if (
      roles.some((r) =>
        ['technical_manager', 'TECHNICAL_MANAGER', 'manager', 'MANAGER'].includes(r)
      )
    )
      return 'technical_manager';
    return 'test_engineer';
  }, [user]);

  const roleInfo = ROLE_INFO[userRole];
  const needsApproval = roleInfo.needsApproval;

  // 확인 모달 상태
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  // 사이트 선택 상태 (서버에서 전달된 effectiveSite 사용)
  const [selectedSite, setSelectedSite] = useState<Site | undefined>(effectiveSite);

  // 위저드 스텝 상태
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errorSteps, setErrorSteps] = useState<Set<number>>(new Set());

  // 파일 업로드 상태
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // 이력 데이터 로드 (수정 모드: useQuery SSOT 패턴)
  const { data: serverLocationHistory = [], isLoading: isLocationHistoryLoading } = useQuery({
    queryKey: queryKeys.equipment.locationHistory(initialData?.uuid ?? ''),
    queryFn: () => equipmentApi.getLocationHistory(initialData!.uuid!),
    enabled: isEdit && !!initialData?.uuid,
    ...QUERY_CONFIG.HISTORY,
  });

  const { data: serverMaintenanceHistory = [], isLoading: isMaintenanceHistoryLoading } = useQuery({
    queryKey: queryKeys.equipment.maintenanceHistory(initialData?.uuid ?? ''),
    queryFn: () => equipmentApi.getMaintenanceHistory(initialData!.uuid!),
    enabled: isEdit && !!initialData?.uuid,
    ...QUERY_CONFIG.HISTORY,
  });

  const { data: serverIncidentHistory = [], isLoading: isIncidentHistoryLoading } = useQuery({
    queryKey: queryKeys.equipment.incidentHistory(initialData?.uuid ?? ''),
    queryFn: () => equipmentApi.getIncidentHistory(initialData!.uuid!),
    enabled: isEdit && !!initialData?.uuid,
    ...QUERY_CONFIG.HISTORY,
  });

  const { data: serverCalibrationHistory = [], isLoading: isCalibrationHistoryLoading } = useQuery({
    queryKey: queryKeys.calibrations.byEquipment(initialData?.uuid ?? ''),
    queryFn: async () => {
      const calibrations = await equipmentApi.getCalibrationHistory(initialData!.uuid!);
      // CalibrationHistoryItem → CalibrationRecord 변환
      return calibrations.map((item) => ({
        id: item.id,
        calibrationDate: item.calibrationDate,
        nextCalibrationDate: item.nextCalibrationDate,
        calibrationAgency: item.calibrationAgency,
        result: item.result,
        approvalStatus: item.approvalStatus,
        status: 'completed' as const, // API 응답에서는 완료된 이력만 반환
      }));
    },
    enabled: isEdit && !!initialData?.uuid,
    ...QUERY_CONFIG.HISTORY,
  });

  const isHistoryLoading =
    isLocationHistoryLoading ||
    isMaintenanceHistoryLoading ||
    isIncidentHistoryLoading ||
    isCalibrationHistoryLoading;

  // 로컬 변경 상태 (Form State, NOT server state)
  // - 수정 모드: useQuery로 로드한 서버 데이터를 1회 복사 → 로컬 뮤테이션 (add/delete)
  // - 등록 모드: 순수 로컬 상태 (pending 배열)
  // - 제출 시: 모든 pending 이력을 서버로 전송
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

  /**
   * ★ Best Practice: Map 기반 임시 이력 관리
   * - 기존: 배열 인덱스 기반 → 삭제 시 인덱스 불일치 버그
   * - 개선: tempId를 키로 사용하는 Map 구조 → 안전한 삭제/조회
   */
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

  // 임시등록 모드 전용 상태
  const [equipmentType, setEquipmentType] = useState<'common' | 'rental'>('common');
  const [owner, setOwner] = useState('');
  const [usagePeriodStart, setUsagePeriodStart] = useState('');
  const [usagePeriodEnd, setUsagePeriodEnd] = useState('');
  const [calibrationCertificateFile, setCalibrationCertificateFile] = useState<File | null>(null);

  /**
   * ★ Best Practice: 관리번호 중복 검사 훅
   * - 디바운스 적용 (300ms)으로 과도한 API 호출 방지
   * - React Query 캐싱으로 동일 관리번호 재검사 시 캐시 활용
   * - 수정 모드에서는 현재 장비 ID를 제외하고 검사
   */
  const {
    checkManagementNumber,
    isChecking: isCheckingManagementNumber,
    checkResult: managementNumberCheckResult,
  } = useManagementNumberCheck({
    excludeId: isEdit ? initialData?.uuid : undefined,
  });

  // 기본 스키마로 폼 초기화
  const form = useForm<FormValues>({
    defaultValues: {
      name: initialData?.name || '',
      managementNumber: initialData?.managementNumber || '',
      assetNumber: initialData?.assetNumber || '',
      modelName: initialData?.modelName || '',
      manufacturer: initialData?.manufacturer || '',
      manufacturerContact: initialData?.manufacturerContact || '',
      serialNumber: initialData?.serialNumber || '',
      location: initialData?.location || '',
      description: initialData?.description || '',
      specMatch: initialData?.specMatch || undefined,
      calibrationRequired: initialData?.calibrationRequired || undefined,
      calibrationCycle: initialData?.calibrationCycle,
      lastCalibrationDate: initialData?.lastCalibrationDate
        ? formatDate(initialData.lastCalibrationDate, 'yyyy-MM-dd')
        : '',
      nextCalibrationDate: initialData?.nextCalibrationDate
        ? formatDate(initialData.nextCalibrationDate, 'yyyy-MM-dd')
        : '',
      calibrationAgency: initialData?.calibrationAgency || '',
      needsIntermediateCheck: initialData?.needsIntermediateCheck || false,
      calibrationMethod: initialData?.calibrationMethod,
      lastIntermediateCheckDate: initialData?.lastIntermediateCheckDate
        ? formatDate(initialData.lastIntermediateCheckDate, 'yyyy-MM-dd')
        : '',
      intermediateCheckCycle: initialData?.intermediateCheckCycle,
      nextIntermediateCheckDate: initialData?.nextIntermediateCheckDate
        ? formatDate(initialData.nextIntermediateCheckDate, 'yyyy-MM-dd')
        : '',
      purchaseYear:
        initialData?.purchaseYear !== undefined && initialData?.purchaseYear !== null
          ? Number(initialData.purchaseYear)
          : undefined,
      teamId: effectiveTeamId,
      site: effectiveSite,
      supplier: initialData?.supplier || '',
      contactInfo: initialData?.contactInfo || '',
      softwareVersion: initialData?.softwareVersion || '',
      firmwareVersion: initialData?.firmwareVersion || '',
      manualLocation: initialData?.manualLocation || '',
      accessories: initialData?.accessories || '',
      technicalManager: initialData?.technicalManager || '',
      initialLocation: initialData?.initialLocation || '',
      installationDate: initialData?.installationDate
        ? formatDate(initialData.installationDate, 'yyyy-MM-dd')
        : '',
      status: (initialData?.status || 'available') as EquipmentStatus,
      calibrationResult: initialData?.calibrationResult || '',
      correctionFactor: initialData?.correctionFactor || '',
      externalIdentifier: initialData?.externalIdentifier || '',
      classification: initialData?.classification,
      managementSerialNumberStr: initialData?.managementSerialNumberStr || '',
    },
  });

  // ✅ useWatch — form.watch() JSX 직접 호출 대신 훅으로 선언 (구독 명시화)
  // form.watch() in JSX: 매 렌더마다 구독 재등록, 의존성 추적 불가
  // useWatch(): 구독이 상단에 명시됨, stable 변수로 JSX에서 참조
  const watchedTeamId = useWatch({ control: form.control, name: 'teamId' });
  const watchedNextCalibrationDate = useWatch({
    control: form.control,
    name: 'nextCalibrationDate',
  });

  // ✅ useAuth() 로딩 완료 후 폼 값 동기화 (Server Component 미경유 시 fallback)
  // userDefaults가 없고, 수정 모드가 아닌 경우에만 동작
  useEffect(() => {
    if (!isEdit && !userDefaults && user) {
      if (!form.getValues('site') && userSite) {
        form.setValue('site', userSite);
        setSelectedSite(userSite);
      }
      if (!form.getValues('teamId') && userTeamId) {
        form.setValue('teamId', userTeamId);
      }
    }
  }, [user, userSite, userTeamId, isEdit, userDefaults, form]);

  /**
   * 이력 저장 에러 핸들러
   */
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

  /**
   * ★ Best Practice: tempId 생성 함수
   * - crypto.randomUUID() 대신 호환성 높은 방식 사용
   */
  const generateTempId = useCallback(() => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 이력 추가/삭제 핸들러 (수정 모드: API 호출, 등록 모드: 임시 상태 업데이트)
  const handleAddLocationHistory = useCallback(
    async (data: CreateLocationHistoryInput) => {
      if (isEdit && initialData?.uuid) {
        // 수정 모드: API 호출
        try {
          const newItem = await equipmentApi.createLocationHistory(initialData.uuid, data);
          setLocationHistory((prev) => [newItem, ...prev]);
          toast({
            title: t('form.toasts.locationHistoryAdd'),
            description: t('form.toasts.historySaved'),
          });
        } catch (error) {
          handleHistoryError(error, t('form.toasts.locationHistoryError'));
          throw error; // 상위 컴포넌트에서 처리할 수 있도록 재throw
        }
      } else {
        // 등록 모드: 임시 상태에 추가 (화면 표시용 + 나중에 일괄 저장)
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
        // ★ Best Practice: tempId를 키로 저장하여 안전한 삭제 보장
        setPendingLocationHistory((prev) => [...prev, { tempId, data }]);
      }
    },
    [isEdit, initialData?.uuid, toast, handleHistoryError, generateTempId]
  );

  const handleDeleteLocationHistory = useCallback(
    async (historyId: string) => {
      try {
        if (isEdit) {
          // 수정 모드: API 호출
          await equipmentApi.deleteLocationHistory(historyId);
        }
        // 둘 다 로컬 상태에서 제거
        setLocationHistory((prev) => prev.filter((item) => item.id !== historyId));
        /**
         * ★ Best Practice: tempId 기반 삭제
         * - 기존 인덱스 기반: locationHistory 상태와 동기화 문제 발생
         * - 개선된 tempId 기반: historyId와 직접 매칭하여 정확한 삭제
         */
        if (!isEdit && historyId.startsWith('temp-')) {
          setPendingLocationHistory((prev) => prev.filter((item) => item.tempId !== historyId));
        }
      } catch (error) {
        handleHistoryError(error, t('form.toasts.locationHistoryError'));
        throw error;
      }
    },
    [isEdit, handleHistoryError]
  );

  const handleAddMaintenanceHistory = useCallback(
    async (data: CreateMaintenanceHistoryInput) => {
      if (isEdit && initialData?.uuid) {
        // 수정 모드: API 호출
        try {
          const newItem = await equipmentApi.createMaintenanceHistory(initialData.uuid, data);
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
        // 등록 모드: 임시 상태에 추가
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
    [isEdit, initialData?.uuid, toast, handleHistoryError, generateTempId]
  );

  const handleDeleteMaintenanceHistory = useCallback(
    async (historyId: string) => {
      try {
        if (isEdit) {
          // 수정 모드: API 호출
          await equipmentApi.deleteMaintenanceHistory(historyId);
        }
        setMaintenanceHistory((prev) => prev.filter((item) => item.id !== historyId));
        // ★ Best Practice: tempId 기반 삭제
        if (!isEdit && historyId.startsWith('temp-')) {
          setPendingMaintenanceHistory((prev) => prev.filter((item) => item.tempId !== historyId));
        }
      } catch (error) {
        handleHistoryError(error, t('form.toasts.maintenanceHistoryError'));
        throw error;
      }
    },
    [isEdit, handleHistoryError]
  );

  const handleAddIncidentHistory = useCallback(
    async (data: CreateIncidentHistoryInput) => {
      if (isEdit && initialData?.uuid) {
        // 수정 모드: API 호출
        try {
          const newItem = await equipmentApi.createIncidentHistory(initialData.uuid, data);
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
        // 등록 모드: 임시 상태에 추가
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
    [isEdit, initialData?.uuid, toast, handleHistoryError, generateTempId]
  );

  const handleDeleteIncidentHistory = useCallback(
    async (historyId: string) => {
      try {
        if (isEdit) {
          // 수정 모드: API 호출
          await equipmentApi.deleteIncidentHistory(historyId);
        }
        setIncidentHistory((prev) => prev.filter((item) => item.id !== historyId));
        // ★ Best Practice: tempId 기반 삭제
        if (!isEdit && historyId.startsWith('temp-')) {
          setPendingIncidentHistory((prev) => prev.filter((item) => item.tempId !== historyId));
        }
      } catch (error) {
        handleHistoryError(error, t('form.toasts.incidentHistoryError'));
        throw error;
      }
    },
    [isEdit, handleHistoryError]
  );

  // 교정 이력 추가/삭제 핸들러 (등록 모드용)
  const handleAddCalibrationHistory = useCallback(
    async (data: CreateCalibrationHistoryInput) => {
      // 등록 모드: 임시 상태에 추가
      const tempId = generateTempId();
      const tempItem: CalibrationRecord = {
        id: tempId,
        calibrationDate: data.calibrationDate,
        nextCalibrationDate: data.nextCalibrationDate,
        calibrationAgency: data.calibrationAgency,
        result: data.result,
        status: 'completed',
        approvalStatus: 'approved',
      };
      setCalibrationHistory((prev) => [tempItem, ...prev]);
      setPendingCalibrationHistory((prev) => [...prev, { tempId, data }]);
      toast({
        title: t('form.toasts.calibrationHistoryAdd'),
        description: t('form.toasts.calibrationHistoryTempSaved'),
      });
    },
    [toast, generateTempId]
  );

  const handleDeleteCalibrationHistory = useCallback(async (historyId: string) => {
    setCalibrationHistory((prev) => prev.filter((item) => item.id !== historyId));
    // ★ Best Practice: tempId 기반 삭제
    if (historyId.startsWith('temp-')) {
      setPendingCalibrationHistory((prev) => prev.filter((item) => item.tempId !== historyId));
    }
  }, []);

  // 폼 제출 핸들러
  const handleFormSubmit = async (data: FormValues) => {
    /**
     * ✅ SSOT: 제출 전 Zod 스키마 검증
     * - 백엔드 에러를 기다리지 않고 즉시 사용자에게 피드백
     * - 명확한 에러 메시지 제공
     */
    try {
      const schema = isEdit ? updateEquipmentSchema : createEquipmentSchema;

      // 날짜 변환 후 검증
      const dataToValidate = {
        ...data,
        lastCalibrationDate: data.lastCalibrationDate
          ? toDate(data.lastCalibrationDate)
          : undefined,
        nextCalibrationDate: data.nextCalibrationDate
          ? toDate(data.nextCalibrationDate)
          : undefined,
        lastIntermediateCheckDate: data.lastIntermediateCheckDate
          ? toDate(data.lastIntermediateCheckDate)
          : undefined,
        nextIntermediateCheckDate: data.nextIntermediateCheckDate
          ? toDate(data.nextIntermediateCheckDate)
          : undefined,
        installationDate: data.installationDate ? toDate(data.installationDate) : undefined,
      };

      // Zod 스키마 검증
      schema.parse(dataToValidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Zod 검증 에러를 사용자 친화적 메시지로 변환
        const firstError = error.issues[0];
        const fieldPath = firstError.path.join('.');
        const fieldLabelKey = FIELD_LABEL_KEYS[fieldPath];
        const fieldLabel = fieldLabelKey
          ? t(`form.fieldLabels.${fieldLabelKey}`)
          : fieldPath || t('form.fieldLabels.unknown');
        toast({
          title: t('form.toasts.validationFailed'),
          description: `${fieldLabel}: ${firstError.message}`,
          variant: 'destructive',
        });
        console.error('🔴 Frontend Zod validation failed:', error.issues);
        return;
      }
      throw error;
    }

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
    /**
     * ✅ SSOT: sanitizeFormData 유틸리티로 일관된 데이터 정제
     * - 빈 문자열 → undefined (Zod .optional() 필드와 호환)
     * - 날짜 문자열 → Date 객체 변환
     * - teamId: 빈 문자열 → undefined (schema: .optional().nullable())
     */

    // 1. 날짜 필드 변환
    const processedData = sanitizeFormData(
      {
        // 필수 필드
        name: data.name,
        managementNumber: data.managementNumber,
        site: data.site, // 필수 - 절대 undefined가 되면 안 됨

        // 날짜 필드 (문자열 → Date)
        lastCalibrationDate: data.lastCalibrationDate
          ? toDate(data.lastCalibrationDate)
          : undefined,
        nextCalibrationDate: data.nextCalibrationDate
          ? toDate(data.nextCalibrationDate)
          : undefined,
        lastIntermediateCheckDate: data.lastIntermediateCheckDate
          ? toDate(data.lastIntermediateCheckDate)
          : undefined,
        nextIntermediateCheckDate: data.nextIntermediateCheckDate
          ? toDate(data.nextIntermediateCheckDate)
          : undefined,
        installationDate: data.installationDate ? toDate(data.installationDate) : undefined,

        // 숫자 필드 (명시적 타입 유지)
        calibrationCycle: data.calibrationCycle,
        intermediateCheckCycle: data.intermediateCheckCycle,
        purchaseYear: data.purchaseYear,

        // Boolean 필드 (기본값 적용)
        needsIntermediateCheck: data.needsIntermediateCheck ?? false,

        // 나머지 선택적 필드 (빈 문자열 자동 제거)
        assetNumber: data.assetNumber,
        modelName: data.modelName,
        manufacturer: data.manufacturer,
        manufacturerContact: data.manufacturerContact,
        serialNumber: data.serialNumber,
        location: data.location,
        description: data.description,
        specMatch: data.specMatch,
        calibrationRequired: data.calibrationRequired,
        calibrationAgency: data.calibrationAgency,
        calibrationMethod: data.calibrationMethod,
        teamId: data.teamId, // optional().nullable() - 빈 문자열 → undefined
        supplier: data.supplier,
        contactInfo: data.contactInfo,
        softwareVersion: data.softwareVersion,
        firmwareVersion: data.firmwareVersion,
        manualLocation: data.manualLocation,
        accessories: data.accessories,
        technicalManager: data.technicalManager,
        initialLocation: data.initialLocation,
        status: isTemporary ? 'temporary' : data.status,
        calibrationResult: data.calibrationResult,
        correctionFactor: data.correctionFactor,
        externalIdentifier: data.externalIdentifier,
        classification: data.classification,
        managementSerialNumberStr: data.managementSerialNumberStr,
      },
      {
        // nullable 필드 명시 (schema에서 .nullable()인 필드)
        nullableFields: ['teamId', 'sharedSource', 'owner', 'externalIdentifier'],
      }
    );

    // 2. 임시등록 모드 전용 필드 추가
    if (isTemporary) {
      Object.assign(processedData, {
        isShared: true,
        sharedSource: equipmentType === 'common' ? 'safety_lab' : 'external',
        owner: owner || undefined,
        usagePeriodStart: usagePeriodStart ? toDate(usagePeriodStart) : undefined,
        usagePeriodEnd: usagePeriodEnd ? toDate(usagePeriodEnd) : undefined,
      });
    }

    /**
     * ★ Best Practice: 임시 이력 데이터 변환
     * - PendingHistoryItem[] → CreateXxxInput[] 변환
     * - tempId는 내부 관리용이므로 API 전송 시 제거
     */
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

    // Collect all files to upload
    const allFiles: UploadedFile[] = [...uploadedFiles];

    // Add calibration certificate if in temporary mode
    if (isTemporary && calibrationCertificateFile) {
      allFiles.push({
        file: calibrationCertificateFile,
      });
    }

    await onSubmit(processedData, allFiles.length > 0 ? allFiles : undefined, pendingHistory);
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

  // 위저드 스텝 정의 — validationFields가 유일한 SSOT (별도 맵 불필요)
  const wizardSteps = useMemo<WizardStep[]>(
    () => [
      { id: 'basic', label: t('form.wizard.step1'), validationFields: ['name', 'site', 'teamId'] },
      { id: 'status-location', label: t('form.wizard.step2') },
      { id: 'calibration', label: t('form.wizard.step3') },
      { id: 'history-attachment', label: t('form.wizard.step4'), hidden: isEdit },
    ],
    [t, isEdit]
  );

  const visibleStepCount = useMemo(
    () => wizardSteps.filter((s) => !s.hidden).length,
    [wizardSteps]
  );
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === visibleStepCount - 1;

  // 다음 스텝으로 이동 — wizardSteps.validationFields가 SSOT
  const handleNext = useCallback(async () => {
    const fields = (wizardSteps[currentStep]?.validationFields ?? []) as (keyof FormValues)[];
    if (fields.length > 0) {
      const valid = await form.trigger(fields);
      if (!valid) {
        setErrorSteps((prev) => new Set(prev).add(currentStep));
        return;
      }
    }
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    setErrorSteps((prev) => {
      const s = new Set(prev);
      s.delete(currentStep);
      return s;
    });
    setCurrentStep((prev) => prev + 1);
  }, [currentStep, form, wizardSteps]);

  // 이전 스텝으로 이동
  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  // 완료된 스텝 클릭으로 이동
  const handleStepClick = useCallback(
    (index: number) => {
      if (completedSteps.has(index)) {
        setCurrentStep(index);
      }
    },
    [completedSteps]
  );

  const RoleIcon = roleInfo.icon;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 역할별 안내 배너 */}
        <Alert className={roleInfo.color}>
          <RoleIcon className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {t('form.roleHeader.currentRole')} {t(`form.roles.${userRole}.label`)}
            <Badge variant="outline" className={roleInfo.color}>
              {needsApproval
                ? t('form.roleHeader.approvalRequired')
                : t('form.roleHeader.directProcess')}
            </Badge>
          </AlertTitle>
          <AlertDescription>{t(`form.roles.${userRole}.description`)}</AlertDescription>
        </Alert>

        {/* 위저드 스테퍼 + 관리번호 미리보기 바 */}
        <FormWizardStepper
          steps={wizardSteps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          errorSteps={errorSteps}
          onStepClick={handleStepClick}
          previewBar={<ManagementNumberPreviewBar isEdit={isEdit} />}
        />

        {/* Step 0: 기본 정보 */}
        {currentStep === 0 && (
          <div
            key={0}
            className={[
              FORM_WIZARD_STEP_TRANSITION.enter,
              FORM_WIZARD_STEP_TRANSITION.wrapper,
            ].join(' ')}
          >
            <BasicInfoSection
              control={form.control}
              isEdit={isEdit}
              selectedSite={selectedSite}
              onSiteChange={handleSiteChange}
              userRole={userRole}
              userTeamId={(user as { teamId?: string })?.teamId}
              onManagementNumberChange={checkManagementNumber}
              managementNumberCheckResult={managementNumberCheckResult}
              isCheckingManagementNumber={isCheckingManagementNumber}
              wizardMode
            />
          </div>
        )}

        {/* Step 1: 상태·위치 (+ 임시등록 전용 필드) */}
        {currentStep === 1 && (
          <div
            key={1}
            className={[
              FORM_WIZARD_STEP_TRANSITION.enter,
              FORM_WIZARD_STEP_TRANSITION.wrapper,
            ].join(' ')}
          >
            <StatusLocationSection
              control={form.control}
              isEdit={isEdit}
              selectedSite={selectedSite}
              selectedTeamId={watchedTeamId}
            />

            {/* 임시등록 전용 필드 (공용/렌탈 장비) */}
            {isTemporary && !isEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('form.temporary.title')}</CardTitle>
                  <CardDescription>{t('form.temporary.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 1. 장비 유형 선택 */}
                  <div className="space-y-2">
                    <Label>
                      {t('form.temporary.equipmentType')} <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={equipmentType}
                      onValueChange={(v) => setEquipmentType(v as 'common' | 'rental')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="common" id="type-common" />
                        <Label htmlFor="type-common" className="font-normal cursor-pointer">
                          {t('form.temporary.commonEquipment')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rental" id="type-rental" />
                        <Label htmlFor="type-rental" className="font-normal cursor-pointer">
                          {t('form.temporary.rentalEquipment')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 2. 소유처 */}
                  <div className="space-y-2">
                    <Label htmlFor="owner">
                      {t('form.temporary.owner')} <span className="text-red-500">*</span>
                    </Label>
                    {equipmentType === 'common' ? (
                      <Select value={owner} onValueChange={setOwner} required>
                        <SelectTrigger id="owner">
                          <SelectValue placeholder={t('form.temporary.ownerPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Safety팀">{t('form.temporary.ownerTeam1')}</SelectItem>
                          <SelectItem value="Battery팀">
                            {t('form.temporary.ownerTeam2')}
                          </SelectItem>
                          <SelectItem value="기타">{t('form.temporary.ownerOther')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="owner"
                        placeholder={t('form.temporary.ownerRentalPlaceholder')}
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  {/* 2-1. 소유처 원본 식별번호 (선택) */}
                  <div className="space-y-2">
                    <Label htmlFor="externalIdentifier">
                      {t('form.temporary.externalIdentifierLabel')}
                    </Label>
                    <Input
                      id="externalIdentifier"
                      name="externalIdentifier"
                      placeholder={
                        equipmentType === 'common'
                          ? t('form.temporary.externalIdentifierCommonPlaceholder')
                          : t('form.temporary.externalIdentifierRentalPlaceholder')
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      {equipmentType === 'common'
                        ? t('form.temporary.externalIdentifierCommonHelp')
                        : t('form.temporary.externalIdentifierRentalHelp')}
                    </p>
                  </div>

                  {/* 3. 사용 예정 기간 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="usagePeriodStart">
                        {t('form.temporary.usagePeriodStart')}{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        id="usagePeriodStart"
                        value={usagePeriodStart}
                        onChange={(e) => setUsagePeriodStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usagePeriodEnd">
                        {t('form.temporary.usagePeriodEnd')} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        id="usagePeriodEnd"
                        value={usagePeriodEnd}
                        onChange={(e) => setUsagePeriodEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* 4. 교정성적서 업로드 */}
                  <div className="space-y-2">
                    <Label htmlFor="calibrationCertificate">
                      {t('form.temporary.calibrationCertificate')}{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="file"
                      id="calibrationCertificate"
                      accept=".pdf"
                      required
                      className="cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCalibrationCertificateFile(file);
                        }
                      }}
                    />
                    {calibrationCertificateFile && (
                      <p className="text-xs text-muted-foreground">
                        {t('form.temporary.selectedFile', {
                          name: calibrationCertificateFile.name,
                        })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{t('form.temporary.pdfOnly')}</p>
                  </div>

                  {/* 5. 교정 유효성 자동 검증 */}
                  {watchedNextCalibrationDate && usagePeriodEnd && (
                    <CalibrationValidityChecker
                      nextCalibrationDate={watchedNextCalibrationDate}
                      usagePeriodEnd={usagePeriodEnd}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: 교정 정보 */}
        {currentStep === 2 && (
          <div
            key={2}
            className={[
              FORM_WIZARD_STEP_TRANSITION.enter,
              FORM_WIZARD_STEP_TRANSITION.wrapper,
            ].join(' ')}
          >
            <CalibrationInfoSection control={form.control} />
          </div>
        )}

        {/* Step 3: 이력·첨부 (create 모드 전용) */}
        {!isEdit && currentStep === 3 && (
          <div
            key={3}
            className={[
              FORM_WIZARD_STEP_TRANSITION.enter,
              FORM_WIZARD_STEP_TRANSITION.wrapper,
            ].join(' ')}
          >
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('form.historyGuide.title')}</AlertTitle>
              <AlertDescription>{t('form.historyGuide.description')}</AlertDescription>
            </Alert>

            <AttachmentSection
              files={uploadedFiles}
              onChange={setUploadedFiles}
              isEdit={isEdit}
              isLoading={isLoading}
              existingAttachments={existingAttachments}
            />

            <LocationHistorySection
              equipmentUuid={initialData?.uuid || 'new'}
              history={locationHistory}
              onAdd={handleAddLocationHistory}
              onDelete={handleDeleteLocationHistory}
              isLoading={isHistoryLoading}
              disabled={isLoading}
            />

            <MaintenanceHistorySection
              equipmentUuid={initialData?.uuid || 'new'}
              history={maintenanceHistory}
              onAdd={handleAddMaintenanceHistory}
              onDelete={handleDeleteMaintenanceHistory}
              isLoading={isHistoryLoading}
              disabled={isLoading}
            />

            <IncidentHistorySection
              equipmentUuid={initialData?.uuid || 'new'}
              history={incidentHistory}
              onAdd={handleAddIncidentHistory}
              onDelete={handleDeleteIncidentHistory}
              isLoading={isHistoryLoading}
              disabled={isLoading}
            />

            <CalibrationHistorySection
              equipmentUuid={initialData?.uuid}
              history={calibrationHistory}
              onAdd={handleAddCalibrationHistory}
              onDelete={handleDeleteCalibrationHistory}
              isLoading={isHistoryLoading}
              disabled={isLoading}
              isCreateMode
            />
          </div>
        )}

        {/* 수정 모드: Step 2(교정정보)가 마지막 → 첨부/이력은 상세 페이지에서 관리 */}
        {isEdit && currentStep === 2 && (
          <div
            key="edit-attachment"
            className={[
              FORM_WIZARD_STEP_TRANSITION.enter,
              FORM_WIZARD_STEP_TRANSITION.wrapper,
            ].join(' ')}
          >
            <AttachmentSection
              files={uploadedFiles}
              onChange={setUploadedFiles}
              isEdit={isEdit}
              isLoading={isLoading}
              existingAttachments={existingAttachments}
            />
          </div>
        )}

        {/* 위저드 네비게이션 버튼 */}
        <div className={FORM_WIZARD_NAVIGATION_TOKENS.container}>
          <div className={FORM_WIZARD_NAVIGATION_TOKENS.leftGroup}>
            {onCancel && isFirstStep && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {t('form.actions.cancel')}
              </Button>
            )}
            {!isFirstStep && (
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={isLoading}>
                {t('form.wizard.previous')}
              </Button>
            )}
          </div>

          <div className={FORM_WIZARD_NAVIGATION_TOKENS.rightGroup}>
            {!isLastStep ? (
              <Button type="button" onClick={handleNext} disabled={isLoading}>
                {t('form.wizard.next')}
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t('form.actions.saving')
                  : isEdit
                    ? t('form.actions.edit')
                    : t('form.actions.create')}
                {needsApproval && !isLoading && t('form.actions.approvalSuffix')}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* 승인 요청 확인 모달 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              {isEdit ? t('form.confirmDialog.editTitle') : t('form.confirmDialog.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? t('form.confirmDialog.editDescription')
                : t('form.confirmDialog.createDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>{t('form.confirmDialog.approvalProcessTitle')}</AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>{t('form.confirmDialog.approvalProcessStep1')}</li>
                  <li>{t('form.confirmDialog.approvalProcessStep2')}</li>
                  <li>{t('form.confirmDialog.approvalProcessStep3')}</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t('form.confirmDialog.cancel')}
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={isLoading}>
              {isLoading ? t('form.confirmDialog.saving') : t('form.confirmDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
