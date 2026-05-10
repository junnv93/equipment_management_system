'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import dynamic from 'next/dynamic';
import {
  type EquipmentStatus,
  type Site,
  UserRoleValues as URVal,
} from '@equipment-management/schemas';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { type UploadedFile } from '@/components/shared/FileUpload';
import { BasicInfoSection, type FormValues } from './BasicInfoSection';
import { ManagementNumberPreviewBar } from './ManagementNumberPreviewBar';
import { FormWizardStepper, type WizardStep } from '@/components/shared/FormWizardStepper';
import { Clock, Shield } from 'lucide-react';
import {
  FORM_WIZARD_STEP_TRANSITION,
  FORM_WIZARD_NAVIGATION_TOKENS,
  getSemanticStatusClasses,
  type SemanticColorKey,
} from '@/lib/design-tokens';
import { formatDate } from '@/lib/utils/date';
import { useTranslations } from 'next-intl';
import { useManagementNumberCheck } from '@/hooks/use-management-number-check';
import { useEquipmentHistoryHandlers } from '@/hooks/use-equipment-history-handlers';
import { useEquipmentFormSubmit } from '@/hooks/use-equipment-form-submit';
import { TemporaryEquipmentSection } from './sections/TemporaryEquipmentSection';
import { EquipmentApprovalConfirmDialog } from './sections/EquipmentApprovalConfirmDialog';
import { HistoryAttachmentStep } from './sections/HistoryAttachmentStep';

// PendingHistoryData re-export — equipment-history-utils.ts에서 이 경로로 import 중
export type { PendingHistoryData } from '@/hooks/use-equipment-history-handlers';

// ✅ Dynamic import로 무거운 섹션 지연 로딩 (초기 번들 크기 감소)
const CalibrationInfoSection = dynamic(
  () => import('./CalibrationInfoSection').then((mod) => mod.CalibrationInfoSection),
  { loading: () => <Skeleton className="h-64 w-full" />, ssr: false }
);

const StatusLocationSection = dynamic(
  () => import('./StatusLocationSection').then((mod) => mod.StatusLocationSection),
  { loading: () => <Skeleton className="h-48 w-full" />, ssr: false }
);

/**
 * 역할별 권한 정보 (i18n 키와 정적 속성만 유지)
 *
 * UL-QP-18 직무분리:
 * - test_engineer · technical_manager: 승인 요청 생성 (같은 팀 기술책임자가 승인)
 * - system_admin: 직접 등록 (승인 절차 없음)
 */
const ROLE_SEMANTIC: Record<string, SemanticColorKey> = {
  test_engineer: 'warning',
  technical_manager: 'warning',
  system_admin: 'purple',
};

const ROLE_INFO = {
  test_engineer: {
    needsApproval: true,
    icon: Clock,
    color: getSemanticStatusClasses(ROLE_SEMANTIC.test_engineer),
  },
  technical_manager: {
    needsApproval: true,
    icon: Clock,
    color: getSemanticStatusClasses(ROLE_SEMANTIC.technical_manager),
  },
  system_admin: {
    needsApproval: false,
    icon: Shield,
    color: getSemanticStatusClasses(ROLE_SEMANTIC.system_admin),
  },
};

interface EquipmentFormProps {
  initialData?: Partial<FormValues & { uuid?: string }>;
  /**
   * 제출 핸들러. isEdit에 따라 CreateEquipmentInput 또는 UpdateEquipmentInput 타입의
   * sanitize된 데이터가 전달됨. 호출자는 union으로 받아 내부에서 narrow.
   */
  onSubmit: Parameters<typeof useEquipmentFormSubmit>[0]['onSubmit'];
  onCancel?: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
  mode?: 'normal' | 'temporary';
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
  const isTemporary = mode === 'temporary';
  const { user } = useAuth();
  const userSite = (user as { site?: Site })?.site;
  const userTeamId = (user as { teamId?: string })?.teamId;

  // ✅ Server Component에서 전달받은 기본값 우선 사용 (mount 시점에 즉시 사용 가능)
  const effectiveSite = (initialData?.site || userDefaults?.site || userSite) as Site | undefined;
  const effectiveTeamId =
    initialData?.teamId !== undefined && initialData?.teamId !== null
      ? String(initialData.teamId)
      : userDefaults?.teamId || userTeamId || undefined;

  // 사용자 역할 결정
  const userRole = useMemo(() => {
    const roles = (user as { roles?: string[] })?.roles || [];
    if (roles.includes(URVal.SYSTEM_ADMIN)) return URVal.SYSTEM_ADMIN;
    if (roles.includes(URVal.TECHNICAL_MANAGER)) return URVal.TECHNICAL_MANAGER;
    return URVal.TEST_ENGINEER;
  }, [user]);

  const roleInfo = ROLE_INFO[userRole];
  const needsApproval = roleInfo.needsApproval;

  // 사이트 선택 상태
  const [selectedSite, setSelectedSite] = useState<Site | undefined>(effectiveSite);

  // 위저드 스텝 상태
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errorSteps, setErrorSteps] = useState<Set<number>>(new Set());

  // 파일 업로드 상태
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [photoFiles, setPhotoFiles] = useState<UploadedFile[]>([]);
  const [manualFiles, setManualFiles] = useState<UploadedFile[]>([]);

  // 임시등록 모드 전용 상태
  const [equipmentType, setEquipmentType] = useState<'common' | 'rental'>('common');
  const [owner, setOwner] = useState('');
  const [usagePeriodStart, setUsagePeriodStart] = useState('');
  const [usagePeriodEnd, setUsagePeriodEnd] = useState('');
  const [calibrationCertificateFile, setCalibrationCertificateFile] = useState<File | null>(null);

  const {
    checkManagementNumber,
    isChecking: isCheckingManagementNumber,
    checkResult: managementNumberCheckResult,
  } = useManagementNumberCheck({
    excludeId: isEdit ? initialData?.uuid : undefined,
  });

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
      managementMethod: initialData?.managementMethod,
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
      supplierContact: initialData?.supplierContact || '',
      firmwareVersion: initialData?.firmwareVersion || '',
      manualLocation: initialData?.manualLocation || '',
      accessories: initialData?.accessories || '',
      managerId: initialData?.managerId || null,
      deputyManagerId: initialData?.deputyManagerId || null,
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
  const watchedTeamId = useWatch({ control: form.control, name: 'teamId' });
  const watchedNextCalibrationDate = useWatch({
    control: form.control,
    name: 'nextCalibrationDate',
  });

  // ✅ useAuth() 로딩 완료 후 폼 값 동기화 (Server Component 미경유 시 fallback)
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

  // 이력 핸들러 훅
  const {
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
  } = useEquipmentHistoryHandlers({ isEdit, equipmentUuid: initialData?.uuid });

  // 폼 제출 훅
  const { handleFormSubmit, handleConfirmSubmit, showConfirmDialog, setShowConfirmDialog } =
    useEquipmentFormSubmit({
      isEdit,
      isTemporary,
      needsApproval,
      equipmentType,
      owner,
      usagePeriodStart,
      usagePeriodEnd,
      calibrationCertificateFile,
      uploadedFiles,
      photoFiles,
      manualFiles,
      pendingHistory,
      onSubmit,
    });

  // 사이트 변경 핸들러
  const handleSiteChange = (site: Site) => {
    setSelectedSite(site);
    form.setValue('teamId', undefined);
  };

  // 위저드 스텝 정의 — validationFields가 유일한 SSOT
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

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

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
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
              isCreateMode={!isEdit}
              selectedSite={selectedSite}
              selectedTeamId={watchedTeamId}
            />

            {isTemporary && !isEdit && (
              <TemporaryEquipmentSection
                equipmentType={equipmentType}
                onEquipmentTypeChange={setEquipmentType}
                owner={owner}
                onOwnerChange={setOwner}
                usagePeriodStart={usagePeriodStart}
                onUsagePeriodStartChange={setUsagePeriodStart}
                usagePeriodEnd={usagePeriodEnd}
                onUsagePeriodEndChange={setUsagePeriodEnd}
                calibrationCertificateFile={calibrationCertificateFile}
                onCalibrationCertificateChange={setCalibrationCertificateFile}
                watchedNextCalibrationDate={watchedNextCalibrationDate}
              />
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
            <HistoryAttachmentStep
              isEdit={false}
              isLoading={isLoading}
              existingAttachments={existingAttachments}
              equipmentUuid={initialData?.uuid}
              uploadedFiles={uploadedFiles}
              onUploadedFilesChange={setUploadedFiles}
              photoFiles={photoFiles}
              onPhotoFilesChange={setPhotoFiles}
              manualFiles={manualFiles}
              onManualFilesChange={setManualFiles}
              locationHistory={locationHistory}
              onAddLocationHistory={handleAddLocationHistory}
              onDeleteLocationHistory={handleDeleteLocationHistory}
              maintenanceHistory={maintenanceHistory}
              onAddMaintenanceHistory={handleAddMaintenanceHistory}
              onDeleteMaintenanceHistory={handleDeleteMaintenanceHistory}
              incidentHistory={incidentHistory}
              onAddIncidentHistory={handleAddIncidentHistory}
              onDeleteIncidentHistory={handleDeleteIncidentHistory}
              calibrationHistory={calibrationHistory}
              onAddCalibrationHistory={handleAddCalibrationHistory}
              onDeleteCalibrationHistory={handleDeleteCalibrationHistory}
              isHistoryLoading={isHistoryLoading}
            />
          </div>
        )}

        {/* 수정 모드: Step 2(교정정보)가 마지막 → 첨부는 동일 스텝에 표시 */}
        {isEdit && currentStep === 2 && (
          <div
            key="edit-attachment"
            className={[
              FORM_WIZARD_STEP_TRANSITION.enter,
              FORM_WIZARD_STEP_TRANSITION.wrapper,
            ].join(' ')}
          >
            <HistoryAttachmentStep
              isEdit={true}
              isLoading={isLoading}
              existingAttachments={existingAttachments}
              uploadedFiles={uploadedFiles}
              onUploadedFilesChange={setUploadedFiles}
              photoFiles={photoFiles}
              onPhotoFilesChange={setPhotoFiles}
              manualFiles={manualFiles}
              onManualFilesChange={setManualFiles}
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
              <Button
                type="button"
                disabled={isLoading}
                onClick={() => form.handleSubmit(handleFormSubmit)()}
              >
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
      <EquipmentApprovalConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        isEdit={isEdit}
        isLoading={isLoading}
        onConfirm={handleConfirmSubmit}
      />
    </FormProvider>
  );
}
