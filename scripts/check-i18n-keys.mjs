#!/usr/bin/env node
/**
 * check-i18n-keys.mjs — i18n 키 누락 감지 게이트
 *
 * checkouts.json 의 필수 키(FSM + 7개 신규 네임스페이스)가 모든 로케일에 존재하는지 검증.
 * i18n 키 변경 시 번역 파일과 동기화가 깨지는 상황을 빌드 시점에 차단.
 *
 * 사용법:
 *   node scripts/check-i18n-keys.mjs --all      # 모든 로케일 검사 (CI)
 *   node scripts/check-i18n-keys.mjs --changed  # staged/변경된 파일만 (pre-commit)
 *
 * 종료코드:
 *   0 — 모든 키 존재
 *   1 — 누락 키 있음 (stderr에 출력)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

const isAll = process.argv.includes('--all');
const isChanged = process.argv.includes('--changed');

if (!isAll && !isChanged) {
  console.log('Usage: node scripts/check-i18n-keys.mjs [--all | --changed]');
  console.log('  --all      모든 로케일의 checkouts.json 키 검사 (CI 용)');
  console.log('  --changed  staged/변경된 checkouts.json 파일만 검사 (pre-commit 용)');
  process.exit(0);
}

// ─── 검증 대상 로케일 ──────────────────────────────────────────────────────────
const LOCALES = ['ko', 'en'];

// ─── FSM 키 (packages/schemas/src/fsm/checkout-fsm.ts CHECKOUT_TRANSITIONS 파생) ─
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

// ─── PR-8 v2: 신규 7개 네임스페이스 필수 경로 ─────────────────────────────────
//
// 네임스페이스 소유권 규칙 (SSOT):
//   fsm.*          → 기존 NextStepPanel / FSMStepDisplay 컴포넌트 (레거시)
//   guidance.*     → 신규 GuidanceCallout / NextStepPanel v2 컴포넌트
//
// guidance.panelTitle ("다음 할 일") ≠ fsm.panelTitle ("다음 단계")
//   - fsm.panelTitle  : 단계 레이블 ("Next Step") — 기존 컴포넌트 전용
//   - guidance.panelTitle : 사용자 지향 패널 제목 ("What to do next") — v2 전용
//   두 키를 동시에 사용하는 컴포넌트 금지. 소유권 위반은 review-architecture에서 검출.

const REQUIRED_PATHS = [
  // guidance — GuidanceCallout / NextStepPanel v2 전용
  'guidance.nextStep',
  'guidance.currentStep',
  'guidance.actor',
  'guidance.panelTitle',       // ← v2 패널 제목. fsm.panelTitle은 레거시 전용
  'guidance.terminal',
  'guidance.blockedHint',
  'guidance.stepOf',
  'guidance.urgency.normal',
  'guidance.urgency.warning',
  'guidance.urgency.critical',
  // list 확장
  'list.subtab.inProgress',
  'list.subtab.completed',
  'list.count.checkouts',
  'list.count.equipment',
  'list.count.separator',
  // timeline
  'timeline.status.past',
  'timeline.status.current',
  'timeline.status.next',
  'timeline.status.future',
  'timeline.status.skipped',
  'timeline.tooltip.completedAt',
  'timeline.tooltip.pendingActor',
  // emptyState
  'emptyState.inProgress.title',
  'emptyState.inProgress.description',
  'emptyState.inProgress.cta',
  'emptyState.completed.title',
  'emptyState.completed.description',
  'emptyState.filtered.title',
  'emptyState.filtered.description',
  'emptyState.filtered.cta',
  // yourTurn
  'yourTurn.label',
  'yourTurn.tooltip',
  // toast.transition (FSM 전환 전용 — 기존 toasts.* 와 별개)
  'toast.transition.approve.success',
  'toast.transition.start.success',
  'toast.transition.submitReturn.success',
  'toast.transition.approveReturn.success',
  'toast.transition.overdue.warning',
  // help.status (WorkflowTimeline + CheckoutStatusBadge 공유 소스)
  'help.status.pending.title',
  'help.status.pending.description',
  'help.status.approved.title',
  'help.status.approved.description',
  'help.status.rejected.title',
  'help.status.rejected.description',
  'help.status.lender_checked.title',
  'help.status.lender_checked.description',
  'help.status.borrower_received.title',
  'help.status.borrower_received.description',
  'help.status.in_use.title',
  'help.status.in_use.description',
  'help.status.borrower_returned.title',
  'help.status.borrower_returned.description',
  'help.status.checked_out.title',
  'help.status.checked_out.description',
  'help.status.returned.title',
  'help.status.returned.description',
  'help.status.completed.title',
  'help.status.completed.description',
  'help.status.canceled.title',
  'help.status.canceled.description',
  'help.status.overdue.title',
  'help.status.overdue.description',
  'help.status.return_rejected.title',
  'help.status.return_rejected.description',
  'help.status.return_approved.title',
  'help.status.return_approved.description',
  'help.status.lender_received.title',
  'help.status.lender_received.description',
];

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

function checkPaths(locale, data, paths) {
  return paths.filter((path) => getNestedValue(data, path) === undefined);
}

function getChangedLocales() {
  try {
    const out = execSync('git diff --staged --name-only --diff-filter=ACM', { encoding: 'utf8', cwd: ROOT });
    const changed = out.trim().split('\n');
    const changedLocales = LOCALES.filter((locale) =>
      changed.some((f) => f.includes(`messages/${locale}/checkouts.json`))
    );
    // staged에 checkouts.json이 없어도 전체 검사로 폴백 — false negative 방지.
    // 다른 파일이 stage되는 도중에도 번역 키 무결성을 항상 보장한다.
    return changedLocales.length > 0 ? changedLocales : LOCALES;
  } catch {
    return LOCALES;
  }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

const localesToCheck = isAll ? LOCALES : getChangedLocales();

let exitCode = 0;

for (const locale of localesToCheck) {
  const filePath = resolve(ROOT, `apps/frontend/messages/${locale}/checkouts.json`);
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    process.stderr.write(`❌ i18n check: ${locale}/checkouts.json 파일을 읽을 수 없습니다.\n`);
    exitCode = 1;
    continue;
  }

  const fsmMissing = [
    ...checkKeys(locale, data, 'fsm.action', REQUIRED_LABEL_KEYS),
    ...checkKeys(locale, data, 'fsm.hint', REQUIRED_HINT_KEYS),
    ...checkKeys(locale, data, 'fsm.actor', REQUIRED_ACTOR_KEYS),
    ...checkKeys(locale, data, 'fsm.blocked', REQUIRED_BLOCKED_KEYS),
    ...checkKeys(locale, data, 'fsm.urgency', REQUIRED_URGENCY_KEYS),
    ...(getNestedValue(data, 'fsm.panelTitle') === undefined ? ['fsm.panelTitle'] : []),
  ];

  const v2Missing = checkPaths(locale, data, REQUIRED_PATHS);

  const missing = [...fsmMissing, ...v2Missing];

  if (missing.length === 0) {
    const fsmTotal =
      REQUIRED_LABEL_KEYS.length +
      REQUIRED_HINT_KEYS.length +
      REQUIRED_ACTOR_KEYS.length +
      REQUIRED_BLOCKED_KEYS.length +
      REQUIRED_URGENCY_KEYS.length +
      1;
    const total = fsmTotal + REQUIRED_PATHS.length;
    process.stdout.write(
      `✅ i18n check: ${locale}/checkouts.json — fsm ${fsmTotal}개 + v2 ${REQUIRED_PATHS.length}개 = ${total}개 키 모두 존재\n`
    );
  } else {
    process.stderr.write(`❌ i18n check: ${locale}/checkouts.json\n`);
    for (const key of missing) {
      process.stderr.write(`   누락: ${key}\n`);
    }
    exitCode = 1;
  }
}

process.exit(exitCode);
