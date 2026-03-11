'use client';

import type { LucideIcon } from 'lucide-react';
import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Loader2, Check } from 'lucide-react';
import {
  SETTINGS_FORM_ITEM_TOKENS,
  SETTINGS_SAVE_INDICATOR_TOKENS,
  getSettingsFormItemClasses,
} from '@/lib/design-tokens';

interface SettingsToggleFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description: string;
  icon?: LucideIcon;
  isSaving?: boolean;
  isSaved?: boolean;
  onToggle?: (fieldName: string, checked: boolean) => void;
}

/**
 * 설정 토글 항목 (FormField 래핑)
 *
 * SSOT: SETTINGS_FORM_ITEM_TOKENS + SETTINGS_SAVE_INDICATOR_TOKENS
 *
 * 두 가지 패턴 지원:
 * - Auto-save: onToggle 제공 시 토글 즉시 서버 저장 (NotificationsContent)
 * - Form-submit: onToggle 미제공 시 폼 제출로 일괄 저장 (DisplayPreferencesContent)
 */
export function SettingsToggleField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  icon: Icon,
  isSaving,
  isSaved,
  onToggle,
}: SettingsToggleFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={getSettingsFormItemClasses()}>
          <div className={SETTINGS_FORM_ITEM_TOKENS.layout}>
            {Icon ? (
              <div className={SETTINGS_FORM_ITEM_TOKENS.labelSection.withIcon}>
                <Icon className={SETTINGS_FORM_ITEM_TOKENS.labelIcon} aria-hidden="true" />
                <div className={SETTINGS_FORM_ITEM_TOKENS.labelWrapper}>
                  <FormLabel className={SETTINGS_FORM_ITEM_TOKENS.label}>{label}</FormLabel>
                  <FormDescription className={SETTINGS_FORM_ITEM_TOKENS.description}>
                    {description}
                  </FormDescription>
                </div>
              </div>
            ) : (
              <div className={SETTINGS_FORM_ITEM_TOKENS.labelSection.withoutIcon}>
                <FormLabel className={SETTINGS_FORM_ITEM_TOKENS.label}>{label}</FormLabel>
                <FormDescription className={SETTINGS_FORM_ITEM_TOKENS.description}>
                  {description}
                </FormDescription>
              </div>
            )}

            <div className={SETTINGS_FORM_ITEM_TOKENS.actionArea}>
              {isSaving && (
                <Loader2 className={SETTINGS_SAVE_INDICATOR_TOKENS.saving} aria-hidden="true" />
              )}
              {isSaved && (
                <Check className={SETTINGS_SAVE_INDICATOR_TOKENS.saved} aria-hidden="true" />
              )}
              <FormControl>
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    onToggle?.(name as string, checked);
                  }}
                />
              </FormControl>
            </div>
          </div>
        </FormItem>
      )}
    />
  );
}
