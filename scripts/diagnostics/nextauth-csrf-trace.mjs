#!/usr/bin/env node
/**
 * nextauth-csrf-trace.mjs — ADR-0006 Same-Origin 회귀 1차 진단 harness
 *
 * §J1 영구 결빙: 과거 manual 재현 시나리오(SW internals / Network Initiator stack /
 * `unset NEXT_PUBLIC_API_URL`)를 코드로 결빙해 동일 증상 재발 시 즉시 실행 가능하게 한다.
 *
 * 진단 항목 (모두 csrf-invariants.json SSOT 기반):
 *   1. 환경변수 stack          (NEXT_PUBLIC_API_URL / INTERNAL_BACKEND_URL / NEXTAUTH_URL / ONPREM_PUBLIC_ORIGIN)
 *   2. 정적 코드 검사          (apps/frontend/app/sw.ts NetworkOnly 보존 + lib/auth.ts basePath 미override)
 *   3. NextAuth client basePath (Auth.js v5 default `/api/auth` 대비)
 *   4. 외부 proxy header chain  (X-Forwarded-Proto / -Host / -For / -Real-IP / Host / Server / Via)
 *   5. cookie domain            (host-only 또는 origin host 일치)
 *   6. ADR-0006 invariant 평가  (위 관측치를 invariants.json 룰에 대입 → breach 리스트)
 *
 * 결과 산출물:
 *   - stdout 휴먼 요약 (verdict + breach 리스트)
 *   - tmp/diagnostics/<ISO>-trace.json (machine-readable)
 *
 * 사용법:
 *   pnpm diagnostics:csrf                                 # ONPREM_PUBLIC_ORIGIN || NEXTAUTH_URL 사용
 *   pnpm diagnostics:csrf -- --origin <url>               # ad-hoc
 *   pnpm diagnostics:csrf -- --dry-run                    # 정적 검사만(network 호출 skip)
 *   pnpm diagnostics:csrf -- --json                       # 휴먼 요약 대신 JSON만
 *   pnpm diagnostics:csrf -- --out tmp/diagnostics/x.json # artifact 경로 override
 *   pnpm diagnostics:csrf -- --verbose
 *
 * 종료 코드:
 *   0 — 진단 정상 종료 (breach 없음 또는 dry-run)
 *   1 — invariant breach 감지
 *   2 — 사용 오류
 *
 * Invariants SSOT: scripts/diagnostics/csrf-invariants.json
 * 관련 ADR:        docs/adr/0006-frontend-backend-routing-model.md
 * 1차 응답 절차:   scripts/diagnostics/README.md
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const INVARIANTS_PATH = join(__dirname, 'csrf-invariants.json');

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
function warn(msg) {
  if (!JSON_OUT) log(`${YELLOW}${msg}${RESET}`);
}
function dim(msg) {
  if (!JSON_OUT && VERBOSE) log(`${DIM}${msg}${RESET}`);
}

// ─── Invariants 로드 ──────────────────────────────────────────────────────
let invariants;
try {
  invariants = JSON.parse(readFileSync(INVARIANTS_PATH, 'utf8'));
} catch (e) {
  err(`[csrf-trace] csrf-invariants.json 로드 실패: ${e.message}`);
  process.exit(2);
}

// ─── Origin 결정 ──────────────────────────────────────────────────────────
const ORIGIN =
  args.origin ||
  process.env.ONPREM_PUBLIC_ORIGIN ||
  process.env.NEXTAUTH_URL ||
  null;

if (!DRY_RUN && !ORIGIN) {
  err(`[csrf-trace] origin 미결정: ONPREM_PUBLIC_ORIGIN, NEXTAUTH_URL 환경변수가 모두 비어 있고 --origin도 미지정.`);
  err(`  조치: --origin <url> 또는 환경변수 설정`);
  process.exit(2);
}

if (ORIGIN && !/^https?:\/\/[^\s/]+/.test(ORIGIN)) {
  err(`[csrf-trace] origin 형식 오류: ${ORIGIN}`);
  process.exit(2);
}

const originIsHttps = ORIGIN ? ORIGIN.startsWith('https://') : false;

// ─── Redaction 헬퍼 (smoke와 동일 SSOT) ───────────────────────────────────
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

function redactSetCookieList(rawList) {
  if (!rawList) return null;
  return rawList.map((c) => {
    const m = c.match(/^([^=]+)=([^;]*)(;.*)?$/s);
    if (!m) return c;
    const [, name, value, rest] = m;
    const isSensitive = REDACT.cookieNames.some((n) => name.trim().toLowerCase() === n.toLowerCase());
    return `${name}=${isSensitive ? redactValue(value) : value}${rest ?? ''}`;
  });
}

function redactEnvValue(key, value) {
  if (!value) return value;
  // env URL 값은 host만 보존, query/secret 잠재 노출 차단
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    return REDACT.valueKeys.includes(key.toLowerCase()) ? redactValue(value) : value;
  }
}

// ─── 단계 1: 환경변수 stack ───────────────────────────────────────────────
function captureEnvStack() {
  const keys = invariants.requiredEnvVars.neverHardcodedInScripts;
  const out = {};
  for (const k of keys) {
    const v = process.env[k];
    out[k] = v ? redactEnvValue(k, v) : null;
  }
  return out;
}

// ─── 단계 2: 정적 코드 검사 (SW + auth basePath) ─────────────────────────
function inspectServiceWorker() {
  const swPath = join(REPO_ROOT, invariants.serviceWorkerInvariants.swEntryPoint);
  if (!existsSync(swPath)) {
    return { ok: false, reason: `sw entry point not found: ${invariants.serviceWorkerInvariants.swEntryPoint}` };
  }
  const src = readFileSync(swPath, 'utf8');
  const matcherKw = invariants.serviceWorkerInvariants.matcherKeyword;
  const handlerKw = invariants.serviceWorkerInvariants.handlerKeyword;
  const hasMatcher = src.includes(matcherKw);
  const hasHandler = src.includes(handlerKw);

  // 진짜 invariant: runtimeCaching 배열에서 NetworkOnly entry가 defaultCache spread보다 먼저 등록.
  // import 순서나 변수 선언 순서가 아니라 *실제 등록 순서* 검사.
  // 매칭 패턴: runtimeCaching: [<networkOnlyEntry>, ...defaultCache]
  // 또는 변수 식별자로 등록된 경우: runtimeCaching: [apiNetworkOnly, ...defaultCache]
  const runtimeCachingMatch = src.match(/runtimeCaching\s*:\s*\[([^\]]*)\]/s);
  let registeredBeforeDefaultCache = false;
  let runtimeCachingBody = null;
  if (runtimeCachingMatch) {
    runtimeCachingBody = runtimeCachingMatch[1].trim();
    const spreadDefaultIdx = runtimeCachingBody.indexOf('...defaultCache');
    // 배열 안에서 첫 entry가 spread defaultCache가 아니면 invariant 만족
    // (정확히는 "defaultCache spread보다 앞에 NetworkOnly handler를 가진 entry가 1+개 존재")
    if (spreadDefaultIdx > 0) {
      registeredBeforeDefaultCache = true;
    } else if (spreadDefaultIdx < 0) {
      // defaultCache 미사용 케이스 → /api/* NetworkOnly 단독이면 invariant 만족
      registeredBeforeDefaultCache = hasMatcher && hasHandler;
    }
  }

  return {
    ok: hasMatcher && hasHandler && registeredBeforeDefaultCache,
    file: invariants.serviceWorkerInvariants.swEntryPoint,
    matcherFound: hasMatcher,
    handlerFound: hasHandler,
    networkOnlyBeforeDefaultCache: registeredBeforeDefaultCache,
    runtimeCachingArrayDetected: Boolean(runtimeCachingMatch),
  };
}

function inspectNextAuthBasePath() {
  const authPath = join(REPO_ROOT, invariants.nextAuthClientBasePath.frontendAuthEntry);
  if (!existsSync(authPath)) {
    return { ok: false, reason: `auth entry point not found: ${invariants.nextAuthClientBasePath.frontendAuthEntry}` };
  }
  const src = readFileSync(authPath, 'utf8');
  // basePath: 가 명시되면 default(/api/auth) override → ADR-0006 위반 가능성
  // 단, 주석 안에 basePath 단어가 있는 건 무시 (라인 기준)
  const lines = src.split('\n');
  const codeLines = lines.filter((line) => {
    const trim = line.trim();
    return !trim.startsWith('*') && !trim.startsWith('//') && !trim.startsWith('/*');
  });
  const codeSrc = codeLines.join('\n');
  const overrides = codeSrc.match(/basePath\s*:\s*['"`]([^'"`]+)['"`]/);
  return {
    ok: !overrides,
    file: invariants.nextAuthClientBasePath.frontendAuthEntry,
    expectedDefault: invariants.nextAuthClientBasePath.expectedDefault,
    observedOverride: overrides ? overrides[1] : null,
  };
}

// ─── 단계 3-5: 네트워크 호출 (proxy headers + cookie) ─────────────────────
async function captureNetworkSnapshot() {
  if (DRY_RUN || !ORIGIN) {
    return { mode: 'skipped', reason: DRY_RUN ? 'dry-run' : 'no origin' };
  }
  const url = ORIGIN.replace(/\/$/, '') + invariants.nextAuthHandlerPaths.smoke[0]; // /api/auth/csrf
  const startedAt = Date.now();
  let response;
  try {
    const controller = new AbortController();
    const timer = global.setTimeout(() => controller.abort(), invariants.performanceBudget.perCheckTimeoutMs);
    try {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } finally {
      global.clearTimeout(timer);
    }
  } catch (e) {
    return { mode: 'error', url, reason: e.name === 'AbortError' ? `timeout > ${invariants.performanceBudget.perCheckTimeoutMs}ms` : e.message };
  }

  const collectedHeaders = {};
  for (const k of invariants.responseHeaders.proxyChainHeaders) {
    const v = response.headers.get(k.toLowerCase());
    if (v) collectedHeaders[k] = v;
  }
  const setCookieRaw = response.headers.getSetCookie ? response.headers.getSetCookie() : null;

  // Cookie domain 추출
  let cookieDomain = null;
  if (setCookieRaw) {
    for (const c of setCookieRaw) {
      const m = c.match(/domain=([^;]+)/i);
      if (m) {
        cookieDomain = m[1].trim();
        break;
      }
    }
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    /* non-JSON */
  }

  return {
    mode: 'live',
    url,
    httpStatus: response.status,
    elapsedMs: Date.now() - startedAt,
    proxyChainHeaders: collectedHeaders,
    setCookieRedacted: redactSetCookieList(setCookieRaw),
    cookieDomain,
    bodyRedacted: redactJson(body),
  };
}

// ─── 단계 6: invariant breach 평가 ───────────────────────────────────────
function evaluateBreaches({ envStack, sw, basePath, network }) {
  const breaches = [];

  if (!sw.ok) {
    breaches.push({
      id: 'SW-NETWORK-ONLY',
      severity: 'high',
      message: `Service Worker /api/* NetworkOnly invariant 위배 — sw.ts에 NetworkOnly handler가 defaultCache보다 먼저 등록되어야 함`,
      ref: 'ADR-0006#mitigations',
      observation: sw,
    });
  }

  if (!basePath.ok && basePath.observedOverride) {
    breaches.push({
      id: 'AUTHJS-BASEPATH-OVERRIDE',
      severity: 'high',
      message: `NextAuth basePath override 감지: '${basePath.observedOverride}' (default '${basePath.expectedDefault}'). Single-origin 모델은 default를 유지해야 함`,
      ref: 'ADR-0006#decision',
      observation: basePath,
    });
  } else if (!basePath.ok) {
    breaches.push({
      id: 'AUTHJS-FILE-MISSING',
      severity: 'medium',
      message: basePath.reason || 'frontend auth entry point unreadable',
      ref: 'ADR-0006#decision',
    });
  }

  // Env stack — NEXT_PUBLIC_API_URL은 빈 문자열(또는 미설정)이어야 함.
  // SSOT: api-routing.ts API_ROUTING_ENV.PUBLIC_API_URL과 동일 키. invariants.json 배열 순서에
  // 의존하지 않도록 명시적 키 lookup.
  const publicApiUrlKey = 'NEXT_PUBLIC_API_URL';
  const publicApiUrl = envStack[publicApiUrlKey];
  if (publicApiUrl && publicApiUrl !== '') {
    breaches.push({
      id: 'NEXT_PUBLIC_API_URL-NONEMPTY',
      severity: 'medium',
      message: `${publicApiUrlKey}='${publicApiUrl}' — same-origin 모델은 빈 문자열을 기대(클라이언트 baseURL 상대 경로)`,
      ref: 'ADR-0006#consequences',
    });
  }

  if (network.mode === 'live') {
    // X-Forwarded-Proto가 origin scheme과 일치해야 함
    const xfp = network.proxyChainHeaders['X-Forwarded-Proto'];
    if (xfp && originIsHttps && xfp !== 'https') {
      breaches.push({
        id: 'X-FORWARDED-PROTO-MISMATCH',
        severity: 'medium',
        message: `X-Forwarded-Proto='${xfp}' 이지만 origin scheme=https. proxy chain 비정상`,
        ref: 'ADR-0006#decision',
      });
    }
    // Cookie domain 정책
    if (network.cookieDomain) {
      try {
        const originHost = new URL(ORIGIN).host;
        if (network.cookieDomain.startsWith('.') || !originHost.endsWith(network.cookieDomain)) {
          breaches.push({
            id: 'COOKIE-DOMAIN-VIOLATION',
            severity: 'high',
            message: `cookie Domain=${network.cookieDomain} 가 host-only 정책 또는 origin host(${originHost})와 불일치`,
            ref: 'ADR-0006#decision',
          });
        }
      } catch {
        /* origin parse 이미 위에서 검증 */
      }
    }
    // HTTP status
    if (network.httpStatus !== 200) {
      breaches.push({
        id: 'CSRF-HTTP-STATUS',
        severity: 'critical',
        message: `/api/auth/csrf returned ${network.httpStatus}. NextAuth handler가 frontend로 분기되지 않음 (nginx 회귀 의심)`,
        ref: 'ADR-0006#decision',
      });
    }
    // body shape
    if (network.bodyRedacted && !('csrfToken' in network.bodyRedacted)) {
      breaches.push({
        id: 'CSRF-BODY-SHAPE',
        severity: 'critical',
        message: `/api/auth/csrf body에 csrfToken 키 부재. backend가 응답 중일 가능성(분기 위배)`,
        ref: 'ADR-0006#decision',
      });
    }
  }

  return breaches;
}

// ─── artifact 저장 ────────────────────────────────────────────────────────
function saveArtifact(report) {
  const isoTs = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = args.out || join(REPO_ROOT, 'tmp', 'diagnostics', `${isoTs}-trace.json`);
  const dir = dirname(outPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return outPath;
}

// ─── 메인 ────────────────────────────────────────────────────────────────
async function main() {
  log('');
  log(`[csrf-trace] ADR-0006 invariant trace${DRY_RUN ? ' (DRY_RUN)' : ''}`);
  log(`[csrf-trace] origin: ${ORIGIN ?? '(none — static checks only)'}`);
  dim(`[csrf-trace] invariants: ${INVARIANTS_PATH}`);
  log('');

  const envStack = captureEnvStack();
  const sw = inspectServiceWorker();
  const basePath = inspectNextAuthBasePath();
  const network = await captureNetworkSnapshot();
  const breaches = evaluateBreaches({ envStack, sw, basePath, network });

  const verdict = breaches.length === 0 ? 'OK' : 'BREACH';
  const report = {
    timestamp: new Date().toISOString(),
    origin: ORIGIN,
    mode: DRY_RUN ? 'dry-run' : network.mode,
    adrRef: invariants.adrRef,
    invariantsFile: 'scripts/diagnostics/csrf-invariants.json',
    envVars: envStack,
    swSnapshot: sw,
    nextAuthBasePath: basePath,
    network,
    invariantBreaches: breaches,
    verdict,
  };

  const artifactPath = DRY_RUN ? null : saveArtifact(report);

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    log(`  env stack:`);
    for (const [k, v] of Object.entries(envStack)) {
      dim(`    ${k}=${v ?? '(unset)'}`);
    }
    log(`  service worker:    ${sw.ok ? `${GREEN}OK${RESET}` : `${RED}WARN${RESET}`} ${sw.file ?? ''}`);
    log(`  authjs basePath:   ${basePath.ok ? `${GREEN}OK (default ${basePath.expectedDefault})${RESET}` : `${RED}OVERRIDE: ${basePath.observedOverride ?? basePath.reason}${RESET}`}`);
    if (network.mode === 'live') {
      log(`  /api/auth/csrf:    ${network.httpStatus === 200 ? `${GREEN}${network.httpStatus}${RESET}` : `${RED}${network.httpStatus}${RESET}`} (${network.elapsedMs}ms)`);
      log(`  cookie domain:     ${network.cookieDomain ?? '(host-only)'}`);
      if (VERBOSE) {
        for (const [k, v] of Object.entries(network.proxyChainHeaders)) dim(`    ${k}: ${v}`);
      }
    }
    log('');
    if (verdict === 'OK') {
      ok(`[csrf-trace] verdict: OK — invariant breaches 0건`);
    } else {
      err(`[csrf-trace] verdict: BREACH — ${breaches.length}건`);
      for (const b of breaches) {
        err(`  · [${b.severity}] ${b.id}: ${b.message}`);
        err(`      ref: ${b.ref}`);
      }
    }
    if (artifactPath) log(`  artifact: ${artifactPath}`);
    log('');
  }

  process.exit(verdict === 'OK' || DRY_RUN ? 0 : 1);
}

// ─── CLI parsing ──────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { verbose: false, dryRun: false, json: false, origin: null, out: null };
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
    } else if (a === '--out') {
      out.out = argv[++i];
      if (!out.out) {
        process.stderr.write(`${RED}--out requires a path argument${RESET}\n`);
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
      'nextauth-csrf-trace.mjs — ADR-0006 1차 진단 harness',
      '',
      'Usage:',
      '  pnpm diagnostics:csrf',
      '  pnpm diagnostics:csrf -- --origin <url>',
      '  pnpm diagnostics:csrf -- --dry-run',
      '  pnpm diagnostics:csrf -- --json',
      '  pnpm diagnostics:csrf -- --out tmp/diagnostics/x.json',
      '',
      'Origin precedence: --origin > ONPREM_PUBLIC_ORIGIN > NEXTAUTH_URL',
      'Invariants:        scripts/diagnostics/csrf-invariants.json',
      'ADR:               docs/adr/0006-frontend-backend-routing-model.md',
      'Procedure:         scripts/diagnostics/README.md',
      '',
    ].join('\n'),
  );
}

main().catch((e) => {
  err(`[csrf-trace] uncaught error: ${e.stack || e.message}`);
  process.exit(1);
});
