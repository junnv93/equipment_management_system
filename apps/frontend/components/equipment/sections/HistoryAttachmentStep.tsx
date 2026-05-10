'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { type UploadedFile } from '@/components/shared/FileUpload';
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
} from '../CalibrationHistorySection';

const AttachmentSection = dynamic(
  () => import('../AttachmentSection').then((mod) => mod.AttachmentSection),
  { loading: () => <Skeleton className="h-32 w-full" />, ssr: false }
);

const LocationHistorySection = dynamic(
  () => import('../LocationHistorySection').then((mod) => mod.LocationHistorySection),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);

const MaintenanceHistorySection = dynamic(
  () => import('../MaintenanceHistorySection').then((mod) => mod.MaintenanceHistorySection),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);

const IncidentHistorySection = dynamic(
  () => import('../IncidentHistorySection').then((mod) => mod.IncidentHistorySection),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);

const CalibrationHistorySection = dynamic(
  () => import('../CalibrationHistorySection').then((mod) => mod.CalibrationHistorySection),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);

export interface HistoryAttachmentStepProps {
  isEdit: boolean;
  isLoading: boolean;
  existingAttachments: Array<{
    uuid: string;
    fileName: string;
    fileSize: number;
    attachmentType: string;
    createdAt: string;
  }>;
  equipmentUuid?: string;
  uploadedFiles: UploadedFile[];
  onUploadedFilesChange: (files: UploadedFile[]) => void;
  photoFiles: UploadedFile[];
  onPhotoFilesChange: (files: UploadedFile[]) => void;
  manualFiles: UploadedFile[];
  onManualFilesChange: (files: UploadedFile[]) => void;
  // 등록 모드 전용 이력 핸들러
  locationHistory?: LocationHistoryItem[];
  onAddLocationHistory?: (data: CreateLocationHistoryInput) => Promise<void>;
  onDeleteLocationHistory?: (id: string) => Promise<void>;
  maintenanceHistory?: MaintenanceHistoryItem[];
  onAddMaintenanceHistory?: (data: CreateMaintenanceHistoryInput) => Promise<void>;
  onDeleteMaintenanceHistory?: (id: string) => Promise<void>;
  incidentHistory?: IncidentHistoryItem[];
  onAddIncidentHistory?: (data: CreateIncidentHistoryInput) => Promise<void>;
  onDeleteIncidentHistory?: (id: string) => Promise<void>;
  calibrationHistory?: CalibrationRecord[];
  onAddCalibrationHistory?: (data: CreateCalibrationHistoryInput) => Promise<void>;
  onDeleteCalibrationHistory?: (id: string) => Promise<void>;
  isHistoryLoading?: boolean;
}

export function HistoryAttachmentStep({
  isEdit,
  isLoading,
  existingAttachments,
  equipmentUuid,
  uploadedFiles,
  onUploadedFilesChange,
  photoFiles,
  onPhotoFilesChange,
  manualFiles,
  onManualFilesChange,
  locationHistory = [],
  onAddLocationHistory,
  onDeleteLocationHistory,
  maintenanceHistory = [],
  onAddMaintenanceHistory,
  onDeleteMaintenanceHistory,
  incidentHistory = [],
  onAddIncidentHistory,
  onDeleteIncidentHistory,
  calibrationHistory = [],
  onAddCalibrationHistory,
  onDeleteCalibrationHistory,
  isHistoryLoading = false,
}: HistoryAttachmentStepProps) {
  const t = useTranslations('equipment');

  return (
    <>
      {!isEdit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('form.historyGuide.title')}</AlertTitle>
          <AlertDescription>{t('form.historyGuide.description')}</AlertDescription>
        </Alert>
      )}

      <AttachmentSection
        files={uploadedFiles}
        onChange={onUploadedFilesChange}
        photoFiles={photoFiles}
        onPhotoChange={onPhotoFilesChange}
        manualFiles={manualFiles}
        onManualChange={onManualFilesChange}
        isEdit={isEdit}
        isLoading={isLoading}
        existingAttachments={existingAttachments}
      />

      {!isEdit && onAddLocationHistory && onDeleteLocationHistory && (
        <>
          <LocationHistorySection
            equipmentUuid={equipmentUuid || 'new'}
            history={locationHistory}
            onAdd={onAddLocationHistory}
            onDelete={onDeleteLocationHistory}
            isLoading={isHistoryLoading}
            disabled={isLoading}
          />
          <MaintenanceHistorySection
            equipmentUuid={equipmentUuid || 'new'}
            history={maintenanceHistory}
            onAdd={onAddMaintenanceHistory!}
            onDelete={onDeleteMaintenanceHistory!}
            isLoading={isHistoryLoading}
            disabled={isLoading}
          />
          <IncidentHistorySection
            equipmentUuid={equipmentUuid || 'new'}
            history={incidentHistory}
            onAdd={onAddIncidentHistory!}
            onDelete={onDeleteIncidentHistory!}
            isLoading={isHistoryLoading}
            disabled={isLoading}
          />
          <CalibrationHistorySection
            equipmentUuid={equipmentUuid}
            history={calibrationHistory}
            onAdd={onAddCalibrationHistory!}
            onDelete={onDeleteCalibrationHistory!}
            isLoading={isHistoryLoading}
            disabled={isLoading}
            isCreateMode
          />
        </>
      )}
    </>
  );
}
