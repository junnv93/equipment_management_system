'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useSafeTimeout } from '@/hooks/use-safe-timeout';
import {
  KEYBOARD_SHORTCUTS,
  type ShortcutDef,
  type ShortcutId,
} from '@/lib/constants/keyboard-shortcuts';
import {
  loadShortcutOverrides,
  saveShortcutOverrides,
  resetShortcutOverrides,
  isValidOverrideKey,
  type ShortcutOverrideMap,
} from '@/lib/shortcuts/overrides';

type Scope = 'list' | 'detail' | 'global';

const SCOPE_ORDER: Scope[] = ['list', 'detail', 'global'];

function effectiveKey(def: ShortcutDef, override?: string): string {
  return override ?? def.key;
}

function displayKey(rawKey: string, modifiers: ShortcutDef['modifiers']): string {
  const modStr = (modifiers ?? [])
    .map((m) => {
      if (m === 'shift') return '⇧';
      if (m === 'ctrl') return 'Ctrl';
      if (m === 'alt') return 'Alt';
      if (m === 'meta') return '⌘';
      return m;
    })
    .join('+');
  const keyLabel = rawKey === 'Escape' ? 'Esc' : rawKey === 'Enter' ? '↵' : rawKey;
  return modStr ? `${modStr}+${keyLabel}` : keyLabel;
}

export default function ShortcutsSettingsContent() {
  const t = useTranslations('settings.shortcuts');
  const [overrides, setOverrides] = useState<ShortcutOverrideMap>({});
  const [editingId, setEditingId] = useState<ShortcutId | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Mount 후 1회 read — SSR/hydration mismatch 회피
  useEffect(() => {
    setOverrides(loadShortcutOverrides());
  }, []);

  // 편집 시작 시 input auto-focus
  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  const groupedShortcuts = useMemo(() => {
    return SCOPE_ORDER.map((scope) => ({
      scope,
      items: (Object.entries(KEYBOARD_SHORTCUTS) as [ShortcutId, ShortcutDef][]).filter(
        ([, def]) => def.scope === scope
      ),
    }));
  }, []);

  // SSOT 키 + 현재 override 를 종합한 key→ShortcutId 역매핑 — 충돌 검증용
  const usedKeyMap = useMemo(() => {
    const map = new Map<string, ShortcutId>();
    for (const [id, def] of Object.entries(KEYBOARD_SHORTCUTS) as [ShortcutId, ShortcutDef][]) {
      const k = effectiveKey(def, overrides[id]);
      const modKey = `${k}|${(def.modifiers ?? []).slice().sort().join(',')}`;
      map.set(modKey, id);
    }
    return map;
  }, [overrides]);

  // useSafeTimeout SSOT — unmount 시 자동 clearTimeout (verify-frontend-state Step 13/44)
  const setSafeTimeout = useSafeTimeout();
  const announce = (msg: string) => {
    setStatusMessage(msg);
    // 짧게 비우고 다시 채우면 동일 텍스트 announce 가능 (Radix toast와 동일 패턴)
    setSafeTimeout(() => setStatusMessage(''), 50);
    setSafeTimeout(() => setStatusMessage(msg), 100);
  };

  const startEdit = (id: ShortcutId) => {
    const def: ShortcutDef = KEYBOARD_SHORTCUTS[id];
    setEditingId(id);
    setEditValue(effectiveKey(def, overrides[id]));
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditError(null);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditError(t('help.empty'));
      return;
    }
    if (!isValidOverrideKey(trimmed)) {
      setEditError(t('help.invalid'));
      return;
    }
    const def: ShortcutDef = KEYBOARD_SHORTCUTS[editingId];
    const modKey = `${trimmed}|${(def.modifiers ?? []).slice().sort().join(',')}`;
    const conflictId = usedKeyMap.get(modKey);
    if (conflictId && conflictId !== editingId) {
      setEditError(t('help.duplicate'));
      return;
    }
    const next: ShortcutOverrideMap = { ...overrides };
    if (trimmed === def.key) delete next[editingId];
    else next[editingId] = trimmed;
    setOverrides(next);
    saveShortcutOverrides(next);
    announce(t('help.savedNotice'));
    cancelEdit();
  };

  const resetOne = (id: ShortcutId) => {
    const next = { ...overrides };
    delete next[id];
    setOverrides(next);
    saveShortcutOverrides(next);
  };

  const resetAll = () => {
    resetShortcutOverrides();
    setOverrides({});
    announce(t('help.resetAllNotice'));
  };

  return (
    <div className="space-y-6">
      {/* sr-only live region — 변경 announce */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
            disabled={Object.keys(overrides).length === 0}
          >
            {t('actions.resetAll')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedShortcuts.map(({ scope, items }, scopeIdx) => (
            <section key={scope} aria-labelledby={`shortcuts-section-${scope}`}>
              {scopeIdx > 0 && <Separator className="mb-4" />}
              <h3 id={`shortcuts-section-${scope}`} className="mb-3 text-sm font-semibold">
                {t(`sectionTitle.${scope}` as never)}
              </h3>
              <ul className="space-y-2">
                {items.map(([id, def]) => {
                  const ovr = overrides[id];
                  const isEditing = editingId === id;
                  const display = displayKey(effectiveKey(def, ovr), def.modifiers);
                  const isOverridden = ovr !== undefined && ovr !== def.key;
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
                      aria-label={t('aria.rowLabel', { label: def.i18nKey })}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{def.i18nKey}</span>
                        <span className="text-xs text-muted-foreground">
                          {t(`sectionTitle.${scope}` as never)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <label className="sr-only" htmlFor={`shortcut-input-${id}`}>
                              {t('help.ariaCapture')}
                            </label>
                            <Input
                              id={`shortcut-input-${id}`}
                              ref={inputRef}
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                setEditError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.nativeEvent.isComposing) return;
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  commitEdit();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelEdit();
                                }
                              }}
                              maxLength={6}
                              className="h-8 w-20 font-mono text-xs"
                              aria-invalid={editError ? 'true' : 'false'}
                              aria-describedby={`shortcut-help-${id}`}
                            />
                            <span id={`shortcut-help-${id}`} className="sr-only">
                              {editError ?? t('help.allowedKeysHint')}
                            </span>
                            <Button type="button" size="sm" onClick={commitEdit}>
                              {t('actions.save')}
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                              {t('actions.cancel')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge
                              variant={isOverridden ? 'default' : 'outline'}
                              className="font-mono text-xs"
                              aria-label={
                                isOverridden ? `${display} (${t('aria.customMarker')})` : display
                              }
                            >
                              {display}
                              {isOverridden ? <span aria-hidden="true">*</span> : null}
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(id)}
                            >
                              {t('actions.change')}
                            </Button>
                            {isOverridden && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => resetOne(id)}
                              >
                                {t('actions.reset')}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {editingId && items.some(([id]) => id === editingId) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {editError ?? t('help.allowedKeysHint')}
                </p>
              )}
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
