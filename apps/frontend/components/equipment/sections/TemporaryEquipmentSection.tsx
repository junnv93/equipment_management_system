'use client';

import { useTranslations } from 'next-intl';
import {
  EQUIPMENT_OWNER_OPTIONS,
  DOCUMENT_FILE_RULES,
} from '@equipment-management/shared-constants';
import { validateFile } from '@/lib/utils/file-validation';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalibrationValidityChecker } from '@/components/equipment/CalibrationValidityChecker';

export interface TemporaryEquipmentSectionProps {
  equipmentType: 'common' | 'rental';
  onEquipmentTypeChange: (v: 'common' | 'rental') => void;
  owner: string;
  onOwnerChange: (v: string) => void;
  usagePeriodStart: string;
  onUsagePeriodStartChange: (v: string) => void;
  usagePeriodEnd: string;
  onUsagePeriodEndChange: (v: string) => void;
  calibrationCertificateFile: File | null;
  onCalibrationCertificateChange: (file: File | null) => void;
  watchedNextCalibrationDate: string | undefined;
}

export function TemporaryEquipmentSection({
  equipmentType,
  onEquipmentTypeChange,
  owner,
  onOwnerChange,
  usagePeriodStart,
  onUsagePeriodStartChange,
  usagePeriodEnd,
  onUsagePeriodEndChange,
  calibrationCertificateFile,
  onCalibrationCertificateChange,
  watchedNextCalibrationDate,
}: TemporaryEquipmentSectionProps) {
  const t = useTranslations('equipment');
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('form.temporary.title')}</CardTitle>
        <CardDescription>{t('form.temporary.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 장비 유형 선택 */}
        <div className="space-y-2">
          <Label>
            {t('form.temporary.equipmentType')} <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={equipmentType}
            onValueChange={(v) => onEquipmentTypeChange(v as 'common' | 'rental')}
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

        {/* 소유처 */}
        <div className="space-y-2">
          <Label htmlFor="owner">
            {t('form.temporary.owner')} <span className="text-destructive">*</span>
          </Label>
          {equipmentType === 'common' ? (
            <Select value={owner} onValueChange={onOwnerChange} required>
              <SelectTrigger id="owner">
                <SelectValue placeholder={t('form.temporary.ownerPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_OWNER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(`form.temporary.${opt.i18nKey}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="owner"
              placeholder={t('form.temporary.ownerRentalPlaceholder')}
              value={owner}
              onChange={(e) => onOwnerChange(e.target.value)}
              required
            />
          )}
        </div>

        {/* 소유처 원본 식별번호 (선택) */}
        <div className="space-y-2">
          <Label htmlFor="externalIdentifier">{t('form.temporary.externalIdentifierLabel')}</Label>
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

        {/* 사용 예정 기간 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usagePeriodStart">
              {t('form.temporary.usagePeriodStart')} <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="usagePeriodStart"
              value={usagePeriodStart}
              onChange={(e) => onUsagePeriodStartChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usagePeriodEnd">
              {t('form.temporary.usagePeriodEnd')} <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              id="usagePeriodEnd"
              value={usagePeriodEnd}
              onChange={(e) => onUsagePeriodEndChange(e.target.value)}
              required
            />
          </div>
        </div>

        {/* 교정성적서 업로드 */}
        <div className="space-y-2">
          <Label htmlFor="calibrationCertificate">
            {t('form.temporary.calibrationCertificate')} <span className="text-destructive">*</span>
          </Label>
          <Input
            type="file"
            id="calibrationCertificate"
            accept={DOCUMENT_FILE_RULES.calibration_certificate.accept}
            required
            className="cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const error = validateFile(file, {
                  accept: DOCUMENT_FILE_RULES.calibration_certificate.accept,
                });
                if (error) {
                  toast({
                    title:
                      error.type === 'size'
                        ? t('form.temporary.fileSizeError')
                        : t('form.temporary.fileTypeError'),
                    description:
                      error.type === 'size'
                        ? `${error.maxSizeMB}MB`
                        : DOCUMENT_FILE_RULES.calibration_certificate.accept,
                    variant: 'destructive',
                  });
                  e.target.value = '';
                  return;
                }
                onCalibrationCertificateChange(file);
              }
            }}
          />
          {calibrationCertificateFile && (
            <p className="text-xs text-muted-foreground">
              {t('form.temporary.selectedFile', { name: calibrationCertificateFile.name })}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t('form.temporary.pdfOnly')}</p>
        </div>

        {/* 교정 유효성 자동 검증 */}
        {watchedNextCalibrationDate && usagePeriodEnd && (
          <CalibrationValidityChecker
            nextCalibrationDate={watchedNextCalibrationDate}
            usagePeriodEnd={usagePeriodEnd}
          />
        )}
      </CardContent>
    </Card>
  );
}
