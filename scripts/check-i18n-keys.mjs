#!/usr/bin/env node
/**
 * check-i18n-keys.mjs — FSM i18n 키 누락 감지 게이트
 *
 * CHECKOUT_TRANSITIONS의 labelKey / hintKey가 모든 로케일에 존재하는지 검증.
 * FSM 변경 시 번역 파일과 동기화가 깨지는 상황을 빌드 시점에 차단.
 *
 * 사용법:
 *   node scripts/check-i18n-keys.mjs
 *
 * 종료코드:
 *   0 — 모든 키 존재
 *   1 — 누락 키 있음 (stderr에 출력)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

// ─── FSM에서 사용되는 labelKey / hintKey SSOT ────────────────────────────────
// packages/schemas/src/fsm/checkout-fsm.ts CHECKOUT_TRANSITIONS에서 파생.
// FSM 수정 시 이 목록도 업데이트 필요 (check-i18n-keys.mjs가 누락 감지).
const REQUIRED_LABEL_KEYS = [
  'approve',
  'approve_return',
  'borrower_receive',
  'borrower_return',
  'cancel',
  'lender_check',
  'lender_receive',
  'mark_in_use',
  'reject',
  'reject_return',
  'start',
  'submit_return',
  'terminal',
];

const REQUIRED_HINT_KEYS = [
  'approvedLenderCheck',
  'approvedStart',
  'borrowerReceivedMarkInUse',
  'borrowerReturnedLenderReceive',
  'checkedOutSubmitReturn',
  'inUseBorrowerReturn',
  'lenderCheckedBorrowerReceive',
  'overdueReturn',
  'pendingApprove',
  'pendingCancel',
  'returnedApproveReturn',
  'returnedRejectReturn',
  'terminal',
  'waitingApprover',
];

const REQUIRED_ACTOR_KEYS = ['requester', 'approver', 'logistics', 'lender', 'borrower', 'system', 'none'];
const REQUIRED_BLOCKED_KEYS = ['permission', 'role_mismatch'];
const REQUIRED_URGENCY_KEYS = ['normal', 'warning', 'critical'];

// ─── 검증 대상 로케일 ──────────────────────────────────────────────────────────
const LOCALES = ['ko', 'en'];

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function getNestedValue(obj, path) {
  return path.split('.').reduce((cur, key) => (cur != null ? cur[key] : undefined), obj);
}

function checkKeys(locale, data, prefix, keys) {
  const missing = [];
  for (const key of keys) {
    const fullPath = `${prefix}.${key}`;
    if (getNestedValue(data, fullPath) === undefined) {
      missing.push(fullPath);
    }
  }
  return missing;
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

let exitCode = 0;

for (const locale of LOCALES) {
  const filePath = resolve(ROOT, `apps/frontend/messages/${locale}/checkouts.json`);
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    process.stderr.write(`❌ i18n check: ${locale}/checkouts.json 파일을 읽을 수 없습니다.\n`);
    exitCode = 1;
    continue;
  }

  const missing = [
    ...checkKeys(locale, data, 'fsm.action', REQUIRED_LABEL_KEYS),
    ...checkKeys(locale, data, 'fsm.hint', REQUIRED_HINT_KEYS),
    ...checkKeys(locale, data, 'fsm.actor', REQUIRED_ACTOR_KEYS),
    ...checkKeys(locale, data, 'fsm.blocked', REQUIRED_BLOCKED_KEYS),
    ...checkKeys(locale, data, 'fsm.urgency', REQUIRED_URGENCY_KEYS),
  ];

  // panelTitle 단독 키 검사
  if (getNestedValue(data, 'fsm.panelTitle') === undefined) {
    missing.push('fsm.panelTitle');
  }

  if (missing.length === 0) {
    const total = REQUIRED_LABEL_KEYS.length + REQUIRED_HINT_KEYS.length +
      REQUIRED_ACTOR_KEYS.length + REQUIRED_BLOCKED_KEYS.length + REQUIRED_URGENCY_KEYS.length + 1;
    process.stdout.write(`✅ i18n check: ${locale}/checkouts.json — ${total}개 fsm.* 키 모두 존재\n`);
  } else {
    process.stderr.write(`❌ i18n check: ${locale}/checkouts.json\n`);
    for (const key of missing) {
      process.stderr.write(`   누락: ${key}\n`);
    }
    exitCode = 1;
  }
}

process.exit(exitCode);
