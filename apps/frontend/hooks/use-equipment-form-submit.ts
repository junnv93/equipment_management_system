'use client';

import { useState } from 'react';
import { z } from 'zod';
import {
  type CreateEquipmentInput,
  type UpdateEquipmentInput,
  createEquipmentSchema,
  updateEquipmentSchema,
} from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeFormData } from '@/lib/utils/form-data-utils';
import { toDate } from '@/lib/utils/date';
import { validateFile } from '@/lib/utils/file-validation';
import { DOCUMENT_FILE_RULES } from '@equipment-management/shared-constants';
import type { UploadedFile } from '@/components/shared/FileUpload';
import type { FormValues } from '@/components/equipment/BasicInfoSection';
import type { PendingHistoryData } from './use-equipment-history-handlers';

// ✅ SSOT: 필드명 i18n 키 매핑 (Zod 에러 메시지용)
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
  managementMethod: 'managementMethod',
  lastIntermediateCheckDate: 'lastIntermediateCheckDate',
  intermediateCheckCycle: 'intermediateCheckCycle',
  managerId: 'managerId',
  deputyManagerId: 'deputyManagerId',
};

export interface UseEquipmentFormSubmitOptions {
  isEdit: boolean;
  isTemporary: boolean;
  needsApproval: boolean;
  equipmentType: 'common' | 'rental';
  owner: string;
  usagePeriodStart: string;
  usagePeriodEnd: string;
  calibrationCertificateFile: File | null;
  uploadedFiles: UploadedFile[];
  photoFiles: UploadedFile[];
  manualFiles: UploadedFile[];
  pendingHistory: PendingHistoryData | undefined;
  onSubmit: (
    data: CreateEquipmentInput | UpdateEquipmentInput,
    files?: UploadedFile[],
    pendingHistory?: PendingHistoryData,
    documentFiles?: { photos: File[]; manuals: File[] }
  ) => Promise<void>;
}

export function useEquipmentFormSubmit({
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
}: UseEquipmentFormSubmitOptions) {
  const t = useTranslations('equipment');
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  const processSubmit = async (data: FormValues) => {
    const processedData = sanitizeFormData(
      {
        name: data.name,
        managementNumber: data.managementNumber,
        site: data.site,
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
        calibrationCycle: data.calibrationCycle,
        intermediateCheckCycle: data.intermediateCheckCycle,
        purchaseYear: data.purchaseYear,
        needsIntermediateCheck: data.needsIntermediateCheck ?? false,
        assetNumber: data.assetNumber,
        modelName: data.modelName,
        manufacturer: data.manufacturer,
        manufacturerContact: data.manufacturerContact,
        serialNumber: data.serialNumber,
        location: isEdit ? data.location : data.initialLocation,
        description: data.description,
        specMatch: data.specMatch,
        calibrationRequired: data.calibrationRequired,
        calibrationAgency: data.calibrationAgency,
        managementMethod: data.managementMethod,
        teamId: data.teamId,
        supplier: data.supplier,
        supplierContact: data.supplierContact,
        firmwareVersion: data.firmwareVersion,
        manualLocation: data.manualLocation,
        accessories: data.accessories,
        managerId: data.managerId,
        deputyManagerId: data.deputyManagerId,
        initialLocation: data.initialLocation,
        status: isTemporary ? 'temporary' : data.status,
        calibrationResult: data.calibrationResult,
        correctionFactor: data.correctionFactor,
        externalIdentifier: data.externalIdentifier,
        classification: data.classification,
        managementSerialNumberStr: data.managementSerialNumberStr,
      },
      {
        nullableFields: [
          'teamId',
          'sharedSource',
          'owner',
          'externalIdentifier',
          'managerId',
          'deputyManagerId',
        ],
      }
    );

    if (data.calibrationRequired === 'not_required') {
      Object.assign(processedData, {
        calibrationCycle: null,
        lastCalibrationDate: null,
        nextCalibrationDate: null,
        calibrationAgency: null,
      });
      if (data.managementMethod !== 'self_inspection') {
        Object.assign(processedData, {
          lastIntermediateCheckDate: null,
          intermediateCheckCycle: null,
          nextIntermediateCheckDate: null,
          needsIntermediateCheck: false,
        });
      }
    }

    if (isTemporary) {
      Object.assign(processedData, {
        isShared: true,
        sharedSource: equipmentType === 'common' ? 'safety_lab' : 'external',
        owner: owner || undefined,
        usagePeriodStart: usagePeriodStart ? toDate(usagePeriodStart) : undefined,
        usagePeriodEnd: usagePeriodEnd ? toDate(usagePeriodEnd) : undefined,
      });
    }

    const allFiles: UploadedFile[] = [...uploadedFiles];
    if (isTemporary && calibrationCertificateFile) {
      const error = validateFile(calibrationCertificateFile, {
        accept: DOCUMENT_FILE_RULES.calibration_certificate.accept,
      });
      if (!error) allFiles.push({ file: calibrationCertificateFile });
    }

    const docFiles = {
      photos: photoFiles.map((f) => f.file),
      manuals: manualFiles.map((f) => f.file),
    };
    const hasDocFiles = docFiles.photos.length > 0 || docFiles.manuals.length > 0;

    await onSubmit(
      processedData as unknown as CreateEquipmentInput | UpdateEquipmentInput,
      allFiles.length > 0 ? allFiles : undefined,
      pendingHistory,
      hasDocFiles ? docFiles : undefined
    );
  };

  const handleFormSubmit = async (data: FormValues) => {
    try {
      const schema = isEdit ? updateEquipmentSchema : createEquipmentSchema;
      schema.parse({
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
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
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

    if (needsApproval) {
      setPendingFormData(data);
      setShowConfirmDialog(true);
      return;
    }

    await processSubmit(data);
  };

  const handleConfirmSubmit = async () => {
    if (pendingFormData) {
      setShowConfirmDialog(false);
      await processSubmit(pendingFormData);
      setPendingFormData(null);
    }
  };

  return {
    handleFormSubmit,
    handleConfirmSubmit,
    showConfirmDialog,
    setShowConfirmDialog,
  };
}
