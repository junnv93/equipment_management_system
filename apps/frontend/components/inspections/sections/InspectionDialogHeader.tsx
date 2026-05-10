'use client';

import { useTranslations } from 'next-intl';
import { ClipboardList } from 'lucide-react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormNumberBadge } from '@/components/form-templates/FormNumberBadge';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
import { INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';

interface TemplateInfo {
  version: number;
  createdAt: string;
  createdByName: string | null;
}

export interface InspectionDialogHeaderProps {
  equipmentName?: string;
  isInspectionTemplateEnabled: boolean;
  currentTemplate: TemplateInfo | null | undefined;
  isTemplateMissing: boolean;
}

export function InspectionDialogHeader({
  equipmentName,
  isInspectionTemplateEnabled,
  currentTemplate,
  isTemplateMissing,
}: InspectionDialogHeaderProps) {
  const t = useTranslations('calibration');
  const { fmtDate } = useDateFormatter();

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 flex-wrap">
        {t('intermediateInspection.formTitle')}
        <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-03'].name} />
        {isInspectionTemplateEnabled && currentTemplate ? (
          <span
            className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.container}
            aria-label={t('intermediateInspection.template.versionBadgeAria', {
              version: currentTemplate.version,
              date: fmtDate(currentTemplate.createdAt),
              author:
                currentTemplate.createdByName ?? t('intermediateInspection.template.systemAuthor'),
            })}
          >
            <ClipboardList
              className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.icon}
              aria-hidden="true"
            />
            <span className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.version}>
              v{currentTemplate.version}
            </span>
            <span className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.separator} aria-hidden="true">
              ·
            </span>
            <span className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.meta}>
              {fmtDate(currentTemplate.createdAt)}
              {' · '}
              {currentTemplate.createdByName ?? t('intermediateInspection.template.systemAuthor')}
            </span>
          </span>
        ) : isInspectionTemplateEnabled && isTemplateMissing ? (
          <span className={INSPECTION_TEMPLATE_VERSION_BADGE_TOKENS.missing}>
            {t('intermediateInspection.template.missingBadge')}
          </span>
        ) : null}
      </DialogTitle>
      {equipmentName && <DialogDescription>{equipmentName}</DialogDescription>}
    </DialogHeader>
  );
}
