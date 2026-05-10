/**
 * Keyboard Shortcuts SSOT
 *
 * 단축키 정의 변경 시 이 파일만 수정 → Provider/Cheatsheet 자동 반영.
 * 단축키 추가 시 satisfies 타입 체크가 completeness를 컴파일타임 보장.
 */

export type ShortcutScope = 'global' | 'list' | 'detail';

export interface ShortcutDef {
  key: string;
  modifiers?: Array<'ctrl' | 'shift' | 'alt' | 'meta'>;
  scope: ShortcutScope;
  i18nKey: string;
  /** 입력 포커스(INPUT/TEXTAREA/SELECT/contenteditable)에서도 실행 여부 */
  allowInInput?: boolean;
}

export const KEYBOARD_SHORTCUTS = {
  // ── List scope ────────────────────────────────
  NAVIGATE_UP: {
    key: 'j',
    scope: 'list',
    i18nKey: 'shortcuts.list.navigateUp',
  },
  NAVIGATE_DOWN: {
    key: 'k',
    scope: 'list',
    i18nKey: 'shortcuts.list.navigateDown',
  },
  OPEN_ITEM: {
    key: 'Enter',
    scope: 'list',
    i18nKey: 'shortcuts.list.openItem',
  },
  FOCUS_SEARCH: {
    key: '/',
    scope: 'list',
    i18nKey: 'shortcuts.list.focusSearch',
  },
  FILTER_PANEL: {
    key: 'f',
    scope: 'list',
    i18nKey: 'shortcuts.list.filterPanel',
  },
  GO_FIRST: {
    key: 'g',
    scope: 'list',
    i18nKey: 'shortcuts.list.goFirst',
  },
  GO_LAST: {
    key: 'G',
    modifiers: ['shift'],
    scope: 'list',
    i18nKey: 'shortcuts.list.goLast',
  },
  APPROVE_SELECTED: {
    key: 'a',
    scope: 'list',
    i18nKey: 'shortcuts.list.approveSelected',
  },
  REJECT_SELECTED: {
    key: 'A',
    modifiers: ['shift'],
    scope: 'list',
    i18nKey: 'shortcuts.list.rejectSelected',
  },
  // ── Detail scope ──────────────────────────────
  APPROVE: {
    key: 'y',
    scope: 'detail',
    i18nKey: 'shortcuts.detail.approve',
  },
  REJECT: {
    key: 'n',
    scope: 'detail',
    i18nKey: 'shortcuts.detail.reject',
  },
  OPEN_QR: {
    key: 'q',
    scope: 'detail',
    i18nKey: 'shortcuts.detail.openQr',
  },
  BACK: {
    key: 'Escape',
    scope: 'detail',
    i18nKey: 'shortcuts.detail.back',
    allowInInput: true,
  },
  // ── Global ────────────────────────────────────
  SHOW_HELP: {
    key: '?',
    modifiers: ['shift'],
    scope: 'global',
    i18nKey: 'shortcuts.global.showHelp',
  },
} as const satisfies Record<string, ShortcutDef>;

export type ShortcutId = keyof typeof KEYBOARD_SHORTCUTS;
