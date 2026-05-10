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
import { KEYBOARD_SHORTCUTS, type ShortcutDef } from '@/lib/constants/keyboard-shortcuts';

interface KeyboardShortcutsCheatsheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function KeyBadge({ def }: { def: ShortcutDef }) {
  const modStr = (def.modifiers ?? [])
    .map((m) => {
      if (m === 'shift') return '⇧';
      if (m === 'ctrl') return 'Ctrl';
      if (m === 'alt') return 'Alt';
      if (m === 'meta') return '⌘';
      return m;
    })
    .join('+');
  const keyLabel = def.key === 'Escape' ? 'Esc' : def.key === 'Enter' ? '↵' : def.key;
  const display = modStr ? `${modStr}+${keyLabel}` : keyLabel;

  return (
    <Badge variant="outline" className="font-mono text-xs">
      {display}
    </Badge>
  );
}

interface ShortcutRowProps {
  def: ShortcutDef;
  label: string;
}

function ShortcutRow({ def, label }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <KeyBadge def={def} />
    </div>
  );
}

/**
 * 키보드 단축키 치트시트 Dialog.
 * role="dialog" + aria-labelledby + Esc close는 Radix Dialog가 자동 처리.
 */
export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: KeyboardShortcutsCheatsheetProps) {
  const t = useTranslations('checkouts.shortcuts');

  const listShortcuts = Object.entries(KEYBOARD_SHORTCUTS).filter(
    ([, def]) => def.scope === 'list'
  ) as [string, ShortcutDef][];

  const detailShortcuts = Object.entries(KEYBOARD_SHORTCUTS).filter(
    ([, def]) => def.scope === 'detail'
  ) as [string, ShortcutDef][];

  const globalShortcuts = Object.entries(KEYBOARD_SHORTCUTS).filter(
    ([, def]) => def.scope === 'global'
  ) as [string, ShortcutDef][];

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
            {listShortcuts.map(([, def]) => (
              <ShortcutRow key={def.i18nKey} def={def} label={t(def.i18nKey as never)} />
            ))}
          </section>
          <Separator />
          <section aria-labelledby="shortcuts-detail-heading">
            <h3 id="shortcuts-detail-heading" className="mb-2 text-sm font-semibold">
              {t('detail.sectionTitle')}
            </h3>
            {detailShortcuts.map(([, def]) => (
              <ShortcutRow key={def.i18nKey} def={def} label={t(def.i18nKey as never)} />
            ))}
          </section>
          <Separator />
          <section aria-labelledby="shortcuts-global-heading">
            <h3 id="shortcuts-global-heading" className="mb-2 text-sm font-semibold">
              {t('global.showHelp')}
            </h3>
            {globalShortcuts.map(([, def]) => (
              <ShortcutRow key={def.i18nKey} def={def} label={t(def.i18nKey as never)} />
            ))}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
