'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import {
  SITE_TO_CODE,
  CLASSIFICATION_TO_CODE,
  generateManagementNumber,
  formatSerialNumber,
} from '@/lib/constants/management-number';
import { FORM_WIZARD_PREVIEW_BAR_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';
import type { FormValues } from './BasicInfoSection';

/**
 * 관리번호 실시간 미리보기 바
 *
 * FormProvider 컨텍스트 내부에서 사용. site/classification/managementSerialNumberStr
 * 필드를 watch하여 관리번호를 실시간으로 계산·표시합니다.
 *
 * 등록 모드에서만 렌더링 (isEdit=true면 숨김).
 */
interface ManagementNumberPreviewBarProps {
  isEdit?: boolean;
}

export function ManagementNumberPreviewBar({ isEdit = false }: ManagementNumberPreviewBarProps) {
  const t = useTranslations('equipment');
  const form = useFormContext<FormValues>();

  const [site, classification, serialNumberStr] = form.watch([
    'site',
    'classification',
    'managementSerialNumberStr',
  ]);

  const preview = useMemo(() => {
    if (site && classification && serialNumberStr) {
      const formatted = formatSerialNumber(serialNumberStr);
      if (formatted) {
        return generateManagementNumber(site, classification, formatted);
      }
    }
    return null;
  }, [site, classification, serialNumberStr]);

  if (isEdit) return null;

  const siteCode = site ? SITE_TO_CODE[site] : null;
  const classCode = classification ? CLASSIFICATION_TO_CODE[classification] : null;
  const serialDisplay = serialNumberStr ? formatSerialNumber(serialNumberStr) : null;

  return (
    <div className={FORM_WIZARD_PREVIEW_BAR_TOKENS.container}>
      <span className={FORM_WIZARD_PREVIEW_BAR_TOKENS.label}>
        {t('form.wizard.managementNumberPreview')}
      </span>

      {preview ? (
        <span className={FORM_WIZARD_PREVIEW_BAR_TOKENS.managementNumber}>{preview}</span>
      ) : (
        <div className={FORM_WIZARD_PREVIEW_BAR_TOKENS.badgeGroup}>
          <Badge
            variant="outline"
            className={
              siteCode
                ? FORM_WIZARD_PREVIEW_BAR_TOKENS.badgeFilled
                : FORM_WIZARD_PREVIEW_BAR_TOKENS.badgeEmpty
            }
          >
            {siteCode ?? 'XXX'}
          </Badge>
          <span className={FORM_WIZARD_PREVIEW_BAR_TOKENS.separator}>-</span>
          <Badge
            variant="outline"
            className={
              classCode
                ? FORM_WIZARD_PREVIEW_BAR_TOKENS.badgeFilled
                : FORM_WIZARD_PREVIEW_BAR_TOKENS.badgeEmpty
            }
          >
            {classCode ?? 'X'}
          </Badge>
          <Badge
            variant="outline"
            className={
              serialDisplay
                ? FORM_WIZARD_PREVIEW_BAR_TOKENS.badgeFilled
                : FORM_WIZARD_PREVIEW_BAR_TOKENS.badgeEmpty
            }
          >
            {serialDisplay ?? '????'}
          </Badge>
        </div>
      )}
    </div>
  );
}
