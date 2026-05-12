'use client';

import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  KEYBOARD_SHORTCUTS,
  type ShortcutDef,
  type ShortcutId,
} from '@/lib/constants/keyboard-shortcuts';
import type { ShortcutOverrideMap } from '@/lib/shortcuts/overrides';
import { useKeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';

interface KeyboardShortcutsCheatsheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface KeyBadgeProps {
  def: ShortcutDef;
  overrideKey?: string;
}

function KeyBadge({ def, overrideKey }: KeyBadgeProps) {
  const t = useTranslations('checkouts.shortcuts');
  const modStr = (def.modifiers ?? [])
    .map((m) => {
      if (m === 'shift') return '⇧';
      if (m === 'ctrl') return 'Ctrl';
      if (m === 'alt') return 'Alt';
      if (m === 'meta') return '⌘';
      return m;
    })
    .join('+');
  const rawKey = overrideKey ?? def.key;
  const keyLabel = rawKey === 'Escape' ? 'Esc' : rawKey === 'Enter' ? '↵' : rawKey;
  const display = modStr ? `${modStr}+${keyLabel}` : keyLabel;
  const isOverridden = overrideKey !== undefined && overrideKey !== def.key;

  return (
    <Badge
      variant={isOverridden ? 'default' : 'outline'}
      className="font-mono text-xs"
      aria-label={isOverridden ? `${display} (${t('aria.customMarker')})` : display}
    >
      {display}
      {isOverridden ? <span aria-hidden="true">*</span> : null}
    </Badge>
  );
}

interface ShortcutRowProps {
  def: ShortcutDef;
  id: ShortcutId;
  label: string;
  overrides: ShortcutOverrideMap;
}

function ShortcutRow({ def, id, label, overrides }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <KeyBadge def={def} overrideKey={overrides[id]} />
    </div>
  );
}

/**
 * 키보드 단축키 치트시트 Dialog.
 * role="dialog" + aria-labelledby + Esc close는 Radix Dialog가 자동 처리.
 *
 * overrides 는 `KeyboardShortcutsContext` 에서 직접 consume — multi-tab storage sync
 * 와 setOverride 액션이 Context 단일 source 로 흐르도록 prop drilling 제거 (R-2).
 */
export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: KeyboardShortcutsCheatsheetProps) {
  const t = useTranslations('checkouts.shortcuts');
  const { overrides } = useKeyboardShortcutsContext();

  const listShortcuts = Object.entries(KEYBOARD_SHORTCUTS).filter(
    ([, def]) => def.scope === 'list'
  ) as [ShortcutId, ShortcutDef][];

  const detailShortcuts = Object.entries(KEYBOARD_SHORTCUTS).filter(
    ([, def]) => def.scope === 'detail'
  ) as [ShortcutId, ShortcutDef][];

  const globalShortcuts = Object.entries(KEYBOARD_SHORTCUTS).filter(
    ([, def]) => def.scope === 'global'
  ) as [ShortcutId, ShortcutDef][];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <section aria-labelledby="shortcuts-list-heading">
            <h3 id="shortcuts-list-heading" className="mb-2 text-sm font-semibold">
              {t('list.sectionTitle')}
            </h3>
            {listShortcuts.map(([id, def]) => (
              <ShortcutRow
                key={def.i18nKey}
                id={id}
                def={def}
                label={t(def.i18nKey as never)}
                overrides={overrides}
              />
            ))}
          </section>
          <Separator />
          <section aria-labelledby="shortcuts-detail-heading">
            <h3 id="shortcuts-detail-heading" className="mb-2 text-sm font-semibold">
              {t('detail.sectionTitle')}
            </h3>
            {detailShortcuts.map(([id, def]) => (
              <ShortcutRow
                key={def.i18nKey}
                id={id}
                def={def}
                label={t(def.i18nKey as never)}
                overrides={overrides}
              />
            ))}
          </section>
          <Separator />
          <section aria-labelledby="shortcuts-global-heading">
            <h3 id="shortcuts-global-heading" className="mb-2 text-sm font-semibold">
              {t('global.showHelp')}
            </h3>
            {globalShortcuts.map(([id, def]) => (
              <ShortcutRow
                key={def.i18nKey}
                id={id}
                def={def}
                label={t(def.i18nKey as never)}
                overrides={overrides}
              />
            ))}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
