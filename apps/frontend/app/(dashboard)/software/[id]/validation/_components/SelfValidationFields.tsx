'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCombobox } from '@/components/ui/user-combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValidationFunctionsTable } from './ValidationFunctionsTable';
import { ValidationControlTable } from './ValidationControlTable';
import type { CreateFormState } from './validation-create-form.types';

interface SelfValidationFieldsProps {
  form: CreateFormState;
  set: (patch: Partial<CreateFormState>) => void;
}

const SELF_TEXT_FIELDS = [
  ['referenceDocuments', 'referenceDocumentsPlaceholder'],
  ['operatingUnitDescription', 'operatingUnitPlaceholder'],
  ['softwareComponents', 'softwareComponentsPlaceholder'],
  ['hardwareComponents', 'hardwareComponentsPlaceholder'],
] as const;

/**
 * P1-3: 자체 시험 폼을 sub-tabs로 분할.
 * 한 다이얼로그에 4개 카테고리를 길게 몰아넣어 스크롤이 길어지는 문제 해결.
 */
export function SelfValidationFields({ form, set }: SelfValidationFieldsProps) {
  const t = useTranslations('software');
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">{t('validation.form.selfTabs.basic')}</TabsTrigger>
        <TabsTrigger value="acquisition">{t('validation.form.selfTabs.acquisition')}</TabsTrigger>
        <TabsTrigger value="processing">{t('validation.form.selfTabs.processing')}</TabsTrigger>
        <TabsTrigger value="control">{t('validation.form.selfTabs.control')}</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 pt-4">
        <h4 className="text-sm font-semibold">{t('validation.form.selfBasicInfoTitle')}</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SELF_TEXT_FIELDS.map(([field, placeholder]) => (
            <div key={field} className="space-y-2">
              <Label>{t(`validation.form.${field}Label`)}</Label>
              <Textarea
                value={form[field]}
                onChange={(e) => set({ [field]: e.target.value })}
                placeholder={t(`validation.form.${placeholder}`)}
                className="min-h-[80px]"
              />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label>{t('validation.form.performedByLabel')}</Label>
          <UserCombobox
            value={form.performedBy || undefined}
            onChange={(id) => set({ performedBy: id ?? '' })}
            placeholder={t('validation.form.performedByPlaceholder')}
          />
        </div>
      </TabsContent>

      <TabsContent value="acquisition" className="pt-4">
        <ValidationFunctionsTable
          title={t('validation.form.acquisitionTitle')}
          description={t('validation.form.acquisitionDesc')}
          items={form.acquisitionFunctions}
          onItemsChange={(items) => set({ acquisitionFunctions: items })}
        />
      </TabsContent>

      <TabsContent value="processing" className="pt-4">
        <ValidationFunctionsTable
          title={t('validation.form.processingTitle')}
          description={t('validation.form.processingDesc')}
          items={form.processingFunctions}
          onItemsChange={(items) => set({ processingFunctions: items })}
        />
      </TabsContent>

      <TabsContent value="control" className="pt-4">
        <ValidationControlTable
          items={form.controlFunctions}
          onItemsChange={(items) => set({ controlFunctions: items })}
        />
      </TabsContent>
    </Tabs>
  );
}
