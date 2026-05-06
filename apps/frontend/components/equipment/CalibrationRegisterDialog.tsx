'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import type { ExtractedCalibrationCertificate } from '@equipment-management/schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { CalibrationForm } from '@/components/calibration/CalibrationForm';
import { CalibrationCertificatePdfUploader } from '@/components/calibration/CalibrationCertificatePdfUploader';
import { extractedToFormDefaults } from '@/lib/calibration/extracted-to-form-defaults';
import type { Calibration } from '@/lib/api/calibration-api';

interface CalibrationRegisterDialogProps {
  equipmentId: string;
  /**
   * 현재 컨텍스트 장비의 관리번호.
   * PDF 추출 결과의 managementNumber와 비교하여 mismatch 시 사용자에게 경고.
   * 미제공 시 관리번호 검증을 skip (호환성 유지).
   */
  managementNumber?: string;
}

/**
 * 장비 상세 페이지에서 교정 기록을 등록하는 dialog.
 *
 * Phase A 통합: PDF 드래그-드롭 → 표지 메타 자동 추출 → CalibrationForm defaults 사전 채움.
 * equipmentId가 이미 컨텍스트에 있으므로 managementNumber 검증만 수행 — 추출된 PDF가
 * 현재 장비와 다른 장비의 성적서면 destructive toast로 즉시 안내.
 */
export function CalibrationRegisterDialog({
  equipmentId,
  managementNumber,
}: CalibrationRegisterDialogProps) {
  const t = useTranslations('equipment');
  const tCal = useTranslations('calibration');
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [extractedCertificate, setExtractedCertificate] =
    useState<ExtractedCalibrationCertificate | null>(null);
  const [extractedFile, setExtractedFile] = useState<File | null>(null);

  /**
   * PDF 추출 결과 처리.
   * - extracted.managementNumber !== 현재 장비 managementNumber → mismatch 경고 + state 미보존
   * - 일치 또는 managementNumber prop 미제공 → state 보존하여 form defaults 적용
   */
  const handleExtracted = (extracted: ExtractedCalibrationCertificate, file: File): void => {
    if (managementNumber && extracted.managementNumber !== managementNumber) {
      toast({
        variant: 'destructive',
        description: tCal('certificateUpload.noEquipmentMatch', {
          managementNumber: extracted.managementNumber,
        }),
      });
      return;
    }
    setExtractedCertificate(extracted);
    setExtractedFile(file);
    toast({
      description: tCal('certificateUpload.successDesc', {
        certificateNumber: extracted.certificateNumber,
      }),
    });
  };

  const formDefaults = useMemo(() => {
    if (!extractedCertificate || !extractedFile) return undefined;
    return extractedToFormDefaults(extractedCertificate, extractedFile, equipmentId);
  }, [extractedCertificate, extractedFile, equipmentId]);

  const handleSuccess = (_calibration: Calibration) => {
    setIsOpen(false);
    setExtractedCertificate(null);
    setExtractedFile(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setExtractedCertificate(null);
    setExtractedFile(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setExtractedCertificate(null);
          setExtractedFile(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('calibrationHistoryTab.register')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('calibrationHistoryTab.dialog.title')}</DialogTitle>
          <DialogDescription>{t('calibrationHistoryTab.dialog.description')}</DialogDescription>
        </DialogHeader>
        <CalibrationCertificatePdfUploader onExtracted={handleExtracted} />
        <CalibrationForm
          mode="dialog"
          equipmentId={equipmentId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={formDefaults}
        />
      </DialogContent>
    </Dialog>
  );
}
