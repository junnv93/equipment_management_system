#!/usr/bin/env node
/**
 * onprem-verify.mjs — ADR-0006 Same-Origin Reverse-Proxy 운영 스모크 게이트
 *
 * `pnpm compose:onprem` 직후(또는 모든 deploy 직후) 운영자가 1줄 명령으로 실행한다.
 * NextAuth handler 경로가 frontend로, backend 전용 경로가 backend로 정상 분기되는지
 * + Set-Cookie 보안 속성(SameSite/HttpOnly/Secure)이 ADR-0006 invariant를 만족하는지 검증한다.
 *
 * 검증 대상 경로 (SSOT: scripts/diagnostics/csrf-invariants.json `nextAuthHandlerPaths.smoke`):
 *   - GET /api/auth/csrf       → frontend NextAuth handler 200 + JSON {csrfToken: string}
 *   - GET /api/auth/session    → frontend NextAuth handler 200 + JSON (null 또는 object)
 *   - GET /api/auth/providers  → frontend NextAuth handler 200 + JSON object
 *   - GET /api/auth/login      → backend 분기 disjoint sanity (NextAuth shape 반환 시 FAIL)
 *
 * 사용법:
 *   pnpm compose:onprem:verify                            # 표준 (env=ONPREM_PUBLIC_ORIGIN)
 *   pnpm compose:onprem:verify -- --json                  # CI-friendly JSON 출력
 *   pnpm compose:onprem:verify -- --dry-run               # 네트워크 호출 skip (CI 회귀 차단)
 *   pnpm compose:onprem:verify -- --verbose               # 상세 로그
 *   pnpm compose:onprem:verify -- --origin <url>          # ad-hoc 검증 (env override)
 *
 * 종료 코드:
 *   0 — 통과 (또는 DRY_RUN_PASS)
 *   1 — 실패 (invariant breach 감지)
 *   2 — 사용 오류 (env 누락 또는 bad CLI flag)
 *
 * Invariants SSOT: scripts/diagnostics/csrf-invariants.json
 * 관련 ADR:        docs/adr/0006-frontend-backend-routing-model.md
 * SSOT 코드:       packages/shared-constants/src/api-routing.ts
 *
 * CI 통합 결정 (Phase 5):
 *   pre-push hook 통합 안 함 (외부 네트워크 의존이 solo trunk-based 정책과 충돌).
 *   권장 모델: 운영자가 `pnpm compose:onprem && pnpm compose:onprem:verify`로 chain.
 *   향후 infra/scripts/deploy.sh 표준화 시점에 자동 wiring 후보.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const INVARIANTS_PATH = join(REPO_ROOT, 'scripts', 'diagnostics', 'csrf-invariants.json');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const args = parseArgs(process.argv.slice(2));
const VERBOSE = args.verbose;
const DRY_RUN = args.dryRun;
const JSON_OUT = args.json;

function log(msg) {
  if (!JSON_OUT) process.stdout.write(msg + '\n');
}
function err(msg) {
  if (!JSON_OUT) process.stderr.write(`${RED}${msg}${RESET}\n`);
}
function ok(msg) {
  if (!JSON_OUT) log(`${GREEN}${msg}${RESET}`);
}
function dim(msg) {
  if (!JSON_OUT && VERBOSE) log(`${DIM}${msg}${RESET}`);
}
function warn(msg) {
  if (!JSON_OUT) log(`${YELLOW}${msg}${RESET}`);
}

// ─── Invariants 로드 ──────────────────────────────────────────────────────
let invariants;
try {
  invariants = JSON.parse(readFileSync(INVARIANTS_PATH, 'utf8'));
} catch (e) {
  err(`[onprem-verify] csrf-invariants.json 로드 실패: ${e.message}`);
  process.exit(2);
}

// ─── Origin 결정 (env || --origin) ────────────────────────────────────────
//
// CLI 계약: trace.mjs와 동일한 의미론.
//   - LIVE mode: env 또는 --origin 필수, 미설정 시 exit 2 (fail-close)
//   - DRY_RUN mode: env 없이도 정적 검증 가능 (CI 회귀 차단 용도)
const requiredEnvKey = invariants.requiredEnvVars.smoke[0]; // ONPREM_PUBLIC_ORIGIN
const ORIGIN = args.origin || process.env[requiredEnvKey] || null;

if (!DRY_RUN && !ORIGIN) {
  err(`[onprem-verify] ${requiredEnvKey} 환경변수가 설정되지 않았습니다.`);
  err(`  조치: ${requiredEnvKey}=https://your-onprem.example.com pnpm compose:onprem:verify`);
  err(`  또는: pnpm compose:onprem:verify -- --origin https://your-onprem.example.com`);
  err(`  또는 정적 회귀 차단만: pnpm compose:onprem:verify -- --dry-run`);
  process.exit(2);
}

if (ORIGIN && !/^https?:\/\/[^\s/]+/.test(ORIGIN)) {
  err(`[onprem-verify] origin 형식 오류: ${ORIGIN}`);
  err(`  기대 형식: http(s)://host[:port]`);
  process.exit(2);
}

const originIsHttps = ORIGIN ? ORIGIN.startsWith('https://') : false;

// ─── 체크 정의 ────────────────────────────────────────────────────────────
// invariants.json에서 SSOT 도출 — 하드코딩 0건
const SMOKE_PATHS = invariants.nextAuthHandlerPaths.smoke;
const BACKEND_DISJOINT_SAMPLE = invariants.backendAuthDisjointSample;
const PERF = invariants.performanceBudget;

const checks = [
  ...SMOKE_PATHS.map((path) => ({
    id: `nextauth:${path.split('/').pop()}`,
    kind: 'nextauth',
    path,
    expectStatus: 200,
    expectJsonShape: invariants.expectedJsonShape[path.split('/').pop()],
  })),
  {
    id: `disjoint:${BACKEND_DISJOINT_SAMPLE.path.split('/').pop()}`,
    kind: 'disjoint',
    path: BACKEND_DISJOINT_SAMPLE.path,
    acceptableStatus: BACKEND_DISJOINT_SAMPLE.acceptableHttpStatus,
    rejectJsonShape: BACKEND_DISJOINT_SAMPLE.expectedNotJsonShape,
  },
];

// ─── Redaction 헬퍼 ───────────────────────────────────────────────────────
const REDACT = invariants.redactionPatterns;

function redactValue(value) {
  if (typeof value !== 'string') return value;
  return REDACT.redactedFormat.replace('N', String(value.length));
}

function redactJson(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const clone = Array.isArray(payload) ? [] : {};
  for (const [k, v] of Object.entries(payload)) {
    if (REDACT.valueKeys.includes(k)) {
      clone[k] = redactValue(v);
    } else if (v && typeof v === 'object') {
      clone[k] = redactJson(v);
    } else {
      clone[k] = v;
    }
  }
  return clone;
}

function redactSetCookie(rawSetCookie) {
  if (!rawSetCookie) return null;
  const cookies = Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie];
  return cookies.map((c) => {
    // 첫 `=` 이전의 cookie 이름은 보존, 첫 attribute 시작 전까지의 value를 redact
    const m = c.match(/^([^=]+)=([^;]*)(;.*)?$/s);
    if (!m) return c;
    const [, name, value, rest] = m;
    const isSensitive = REDACT.cookieNames.some((n) => name.trim().toLowerCase() === n.toLowerCase());
    return `${name}=${isSensitive ? redactValue(value) : value}${rest ?? ''}`;
  });
}

// ─── HTTP 헬퍼 (timeout + redacted output) ────────────────────────────────
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = global.setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { Accept: 'application/json, */*' },
      signal: controller.signal,
    });
  } finally {
    global.clearTimeout(timer);
  }
}

function shapeMatches(actual, expected) {
  if (expected._or) return expected._or.some((cand) => shapeMatchesAtom(actual, cand));
  if (expected._type === 'object') return actual !== null && typeof actual === 'object' && !Array.isArray(actual);
  // structural shape: every key must be present with matching primitive type
  if (actual === null || typeof actual !== 'object') return false;
  for (const [k, t] of Object.entries(expected)) {
    if (k.startsWith('_')) continue;
    if (!(k in actual)) return false;
    if (typeof t === 'string' && typeof actual[k] !== t) return false;
  }
  return true;
}

function shapeMatchesAtom(actual, atom) {
  if (atom === 'null') return actual === null;
  if (atom === 'object') return actual !== null && typeof actual === 'object';
  return false;
}

function shapeContains(actual, partial) {
  if (!partial || typeof partial !== 'object') return false;
  if (!actual || typeof actual !== 'object') return false;
  for (const k of Object.keys(partial)) {
    if (k in actual) return true;
  }
  return false;
}

function checkCookieAttributes(setCookieList) {
  if (!setCookieList || setCookieList.length === 0) {
    return { ok: false, reason: 'no Set-Cookie header on /api/auth/csrf response' };
  }
  const csrfCookie = setCookieList.find((c) =>
    invariants.cookieInvariants.expectedCookies.some((name) => c.toLowerCase().includes(name.toLowerCase())),
  );
  if (!csrfCookie) {
    return {
      ok: false,
      reason: `Set-Cookie does not match expected NextAuth cookie names ${invariants.cookieInvariants.expectedCookies.join(',')}`,
    };
  }
  const lower = csrfCookie.toLowerCase();
  const failures = [];
  if (invariants.cookieInvariants.httpOnlyRequired && !lower.includes('httponly')) {
    failures.push('HttpOnly missing');
  }
  const hasSameSite = invariants.cookieInvariants.samesite.some((v) =>
    lower.includes(`samesite=${v.toLowerCase()}`),
  );
  if (!hasSameSite) {
    failures.push(`SameSite must be one of ${invariants.cookieInvariants.samesite.join('|')}`);
  }
  if (originIsHttps && invariants.cookieInvariants.secureWhen === 'https' && !lower.includes('secure')) {
    failures.push('Secure flag required on https origin');
  }
  // Domain attribute policy
  const domainMatch = csrfCookie.match(/domain=([^;]+)/i);
  if (domainMatch) {
    const cookieDomain = domainMatch[1].trim();
    const originHost = new URL(ORIGIN).host;
    if (!originHost.endsWith(cookieDomain) || cookieDomain.startsWith('.')) {
      failures.push(`cookie Domain=${cookieDomain} violates host-only policy`);
    }
  }
  return { ok: failures.length === 0, reason: failures.join('; ') || null };
}

// ─── Per-check 실행 ───────────────────────────────────────────────────────
async function runCheck(check) {
  // DRY_RUN에서 origin이 없으면 표시용 placeholder만 사용 — 실제 fetch는 skip
  const baseOrigin = ORIGIN ? ORIGIN.replace(/\/$/, '') : '(dry-run, no origin)';
  const url = `${baseOrigin}${check.path}`;
  const startedAt = Date.now();
  if (DRY_RUN) {
    return {
      id: check.id,
      url,
      status: 'DRY_RUN_SKIPPED',
      ok: true,
      elapsedMs: Date.now() - startedAt,
    };
  }

  let response;
  try {
    response = await fetchWithTimeout(url, PERF.perCheckTimeoutMs);
  } catch (e) {
    return {
      id: check.id,
      url,
      status: 'NETWORK_ERROR',
      ok: false,
      reason: e.name === 'AbortError' ? `timeout > ${PERF.perCheckTimeoutMs}ms` : e.message,
      elapsedMs: Date.now() - startedAt,
    };
  }

  const httpStatus = response.status;
  const setCookieRaw = response.headers.getSetCookie ? response.headers.getSetCookie() : null;
  const setCookieRedacted = redactSetCookie(setCookieRaw);
  const cacheControl = response.headers.get('cache-control');

  let body = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON body is OK for disjoint check (backend may return HTML/text)
  }

  if (check.kind === 'nextauth') {
    if (httpStatus !== check.expectStatus) {
      return {
        id: check.id,
        url,
        status: 'UNEXPECTED_HTTP_STATUS',
        ok: false,
        reason: `expected ${check.expectStatus}, got ${httpStatus}`,
        httpStatus,
        elapsedMs: Date.now() - startedAt,
      };
    }
    if (check.expectJsonShape && !shapeMatches(body, check.expectJsonShape)) {
      return {
        id: check.id,
        url,
        status: 'JSON_SHAPE_MISMATCH',
        ok: false,
        reason: `body did not match expected shape`,
        httpStatus,
        bodyRedacted: redactJson(body),
        elapsedMs: Date.now() - startedAt,
      };
    }
    // Cookie + Cache-Control assertions only on /api/auth/csrf (it's the cookie-emitting endpoint)
    let cookieAssertion = { ok: true };
    if (check.path === '/api/auth/csrf') {
      cookieAssertion = checkCookieAttributes(setCookieRaw);
    }
    const cacheControlOk = cacheControl
      ? invariants.responseHeaders.cacheControlPolicy.matchAny.some((tok) => cacheControl.toLowerCase().includes(tok))
      : true; // missing Cache-Control is acceptable; intermediaries may inject it
    return {
      id: check.id,
      url,
      status: cookieAssertion.ok && cacheControlOk ? 'PASS' : 'COOKIE_OR_CACHE_VIOLATION',
      ok: cookieAssertion.ok && cacheControlOk,
      reason: !cookieAssertion.ok
        ? cookieAssertion.reason
        : !cacheControlOk
          ? `Cache-Control "${cacheControl}" not in ${invariants.responseHeaders.cacheControlPolicy.matchAny.join('|')}`
          : null,
      httpStatus,
      setCookie: setCookieRedacted,
      cacheControl,
      bodyRedacted: redactJson(body),
      elapsedMs: Date.now() - startedAt,
    };
  }

  if (check.kind === 'disjoint') {
    const statusOk = check.acceptableStatus.includes(httpStatus);
    const noNextAuthShape = !shapeContains(body, check.rejectJsonShape);
    return {
      id: check.id,
      url,
      status: statusOk && noNextAuthShape ? 'PASS' : 'BACKEND_ROUTING_BREACH',
      ok: statusOk && noNextAuthShape,
      reason: !statusOk
        ? `expected one of ${check.acceptableStatus.join(',')}, got ${httpStatus}`
        : !noNextAuthShape
          ? `backend path responded with NextAuth JSON shape (csrfToken). nginx routing regression — disjoint sanity FAIL`
          : null,
      httpStatus,
      bodyRedacted: redactJson(body),
      elapsedMs: Date.now() - startedAt,
    };
  }
  return { id: check.id, url, status: 'UNKNOWN_KIND', ok: false };
}

// ─── 메인 ────────────────────────────────────────────────────────────────
async function main() {
  log('');
  log(`[onprem-verify] origin: ${ORIGIN ?? '(dry-run, no origin set)'}`);
  log(`[onprem-verify] mode:   ${DRY_RUN ? 'DRY_RUN' : 'LIVE'}`);
  log(`[onprem-verify] checks: ${checks.length} (parallel, per-check timeout ${PERF.perCheckTimeoutMs}ms, total budget ${PERF.smokeWallTimeMs}ms)`);
  dim(`[onprem-verify] invariants: ${INVARIANTS_PATH}`);

  // Total budget guard via Promise.race against a delay
  const startedAt = Date.now();
  const totalBudget = delay(PERF.smokeWallTimeMs).then(() => ({ __budgetExceeded: true }));
  const allChecks = Promise.all(checks.map((c) => runCheck(c)));
  const result = await Promise.race([allChecks, totalBudget]);

  if (!Array.isArray(result) && result.__budgetExceeded) {
    err('');
    err(`[onprem-verify] FAIL — total wall time exceeded budget ${PERF.smokeWallTimeMs}ms`);
    if (JSON_OUT) {
      process.stdout.write(JSON.stringify({ status: 'FAIL', reason: 'budget_exceeded', origin: ORIGIN }, null, 2) + '\n');
    }
    process.exit(1);
  }

  const elapsedMs = Date.now() - startedAt;
  const allOk = result.every((r) => r.ok);
  const verdict = DRY_RUN ? (allOk ? 'DRY_RUN_PASS' : 'DRY_RUN_FAIL') : allOk ? 'PASS' : 'FAIL';

  if (JSON_OUT) {
    process.stdout.write(
      JSON.stringify(
        {
          status: verdict,
          origin: ORIGIN,
          mode: DRY_RUN ? 'dry-run' : 'live',
          elapsedMs,
          adrRef: invariants.adrRef,
          checks: result,
        },
        null,
        2,
      ) + '\n',
    );
  } else {
    log('');
    for (const r of result) {
      const symbol = r.ok ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`;
      log(`  ${symbol}  ${r.id.padEnd(28)}  ${r.status.padEnd(24)}  ${r.elapsedMs}ms`);
      if (!r.ok && r.reason) err(`        ${r.reason}`);
      if (VERBOSE && r.setCookie) dim(`        Set-Cookie: ${JSON.stringify(r.setCookie)}`);
      if (VERBOSE && r.cacheControl) dim(`        Cache-Control: ${r.cacheControl}`);
      if (VERBOSE && r.bodyRedacted) dim(`        body (redacted): ${JSON.stringify(r.bodyRedacted)}`);
    }
    log('');
    if (allOk) {
      ok(`[onprem-verify] ${verdict} — ADR-0006 Same-Origin invariants satisfied (${elapsedMs}ms total)`);
    } else {
      err(`[onprem-verify] ${verdict} — invariant breach detected (${elapsedMs}ms total)`);
      err(`  detail: docs/adr/0006-frontend-backend-routing-model.md  +  scripts/diagnostics/nextauth-csrf-trace.mjs --origin ${ORIGIN}`);
    }
  }

  process.exit(allOk ? 0 : 1);
}

// ─── CLI parsing ──────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { verbose: false, dryRun: false, json: false, origin: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--verbose' || a === '-v') out.verbose = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--json') out.json = true;
    else if (a === '--origin') {
      out.origin = argv[++i];
      if (!out.origin) {
        process.stderr.write(`${RED}--origin requires a URL argument${RESET}\n`);
        process.exit(2);
      }
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else if (a.startsWith('--')) {
      process.stderr.write(`${RED}unknown flag: ${a}${RESET}\n`);
      process.exit(2);
    }
  }
  return out;
}

function printHelp() {
  process.stdout.write(
    [
      'onprem-verify.mjs — ADR-0006 Same-Origin Reverse-Proxy 운영 스모크 게이트',
      '',
      'Usage:',
      '  pnpm compose:onprem:verify',
      '  pnpm compose:onprem:verify -- --json',
      '  pnpm compose:onprem:verify -- --dry-run',
      '  pnpm compose:onprem:verify -- --origin <url>',
      '',
      'Required env: ONPREM_PUBLIC_ORIGIN (or --origin override)',
      'Invariants:   scripts/diagnostics/csrf-invariants.json',
      'ADR:          docs/adr/0006-frontend-backend-routing-model.md',
      '',
    ].join('\n'),
  );
}

main().catch((e) => {
  err(`[onprem-verify] uncaught error: ${e.stack || e.message}`);
  process.exit(1);
});
