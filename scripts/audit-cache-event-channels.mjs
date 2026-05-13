#!/usr/bin/env node
/**
 * Proactive audit: NOTIFICATION_EVENTS ↔ CACHE_EVENTS dual-channel exclusivity.
 *
 * Why this exists (ADR-0012):
 *   동일 logical 비즈니스 이벤트(예: software validation submitted)의 캐시 무효화는
 *   단일 채널만 담당해야 한다. 양 채널에 동일 invalidation rule이 등록되면 status 전이마다
 *   동일 invalidateAllDashboard + 패턴 삭제가 2x 실행되어 p99 latency가 증가한다.
 *
 *   cache-event-listener.ts `validateDualChannelExclusivity()` 부팅타임 invariant가 이미
 *   존재하지만 NestJS bootstrap에서만 트리거되므로 reactive 안전망 역할. 본 audit script는
 *   build/PR time에 동일 검출 로직을 실행해서 회귀를 proactive로 차단한다.
 *
 * What this script reports:
 *   1. VIOLATIONS — 양 채널에 mirror로 등록된 동일 rule (즉시 fix 필요)
 *   2. POTENTIAL — mirror 후보지만 한쪽만 등록 (잠재 회귀: 다른 채널 추가 시 invariant 트리거)
 *   3. SUMMARY — 검사한 mirror pair 수
 *
 * Usage:
 *   node scripts/audit-cache-event-channels.mjs           # human-readable
 *   node scripts/audit-cache-event-channels.mjs --json    # CI 사용
 *   exit 0 = no violations, exit 1 = violations detected
 *
 * 본 script는 TypeScript source 를 직접 정규식 추출로 파싱한다 — ts-node/tsx 종속성 없이
 * lint-fast(<100ms) 실행 보장. CACHE_EVENTS / NOTIFICATION_EVENTS / SYNONYM 등 SSOT를
 * 단일 진입점(`apps/backend/src/common/cache/cache-events.ts` + `cache-event.registry.ts`)
 * 에서 추출.
 *
 * 회귀 차단 책임 분리:
 *   - boot-time invariant: 실 NestJS bootstrap (production / dev / e2e)
 *   - 본 script: CI/pre-push lint-fast (production code 미실행)
 *   - cache-events-naming.spec.ts: jest 단위 — 명명 규약 + dead synonym/legacy 차단
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const MODULES_DIR = join(ROOT, 'apps/backend/src/modules');
const CACHE_EVENTS_FILE = join(ROOT, 'apps/backend/src/common/cache/cache-events.ts');
const NOTIFICATION_EVENTS_FILE = join(
  ROOT,
  'apps/backend/src/modules/notifications/events/notification-events.ts'
);
const REGISTRY_FILE = join(ROOT, 'apps/backend/src/common/cache/cache-event.registry.ts');

const isJson = process.argv.includes('--json');

function exitWith(payload, code) {
  if (isJson) {
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } else {
    process.stdout.write(payload.report + '\n');
  }
  process.exit(code);
}

function readSource(path) {
  if (!existsSync(path)) {
    exitWith(
      {
        ok: false,
        error: `source missing: ${path}`,
        report: `audit-cache-event-channels: source missing — ${path}`,
      },
      2
    );
  }
  return readFileSync(path, 'utf8');
}

/**
 * `KEY: 'string-literal'` 형태의 enum-style object literal 멤버를 모두 추출.
 * 주석 라인은 건너뛰며, `as const` 객체 자체 끝(`} as const`)에서 멈춘다.
 */
function extractStringEnum(source, constName) {
  const startPattern = new RegExp(`export const ${constName}\\s*=\\s*{`);
  const startMatch = source.match(startPattern);
  if (!startMatch) return new Map();

  const startIdx = startMatch.index + startMatch[0].length;
  const endIdx = source.indexOf('} as const', startIdx);
  if (endIdx < 0) return new Map();

  const body = source.slice(startIdx, endIdx);
  const entries = new Map();
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*')
    ) {
      continue;
    }
    const m = trimmed.match(/^([A-Z_]+)\s*:\s*'([^']+)'/);
    if (m) entries.set(m[1], m[2]);
  }
  return entries;
}

/**
 * `CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM` Readonly<Record<string,string>> 멤버 추출.
 */
function extractSynonymMap(source) {
  const startPattern = /export const CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM[^=]*=\s*{/;
  const startMatch = source.match(startPattern);
  if (!startMatch) return {};

  const startIdx = startMatch.index + startMatch[0].length;
  const endIdx = source.indexOf('} as const', startIdx);
  if (endIdx < 0) return {};

  const body = source.slice(startIdx, endIdx);
  const map = {};
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    const m = trimmed.match(/^([a-zA-Z]+)\s*:\s*'([^']+)'/);
    if (m) map[m[1]] = m[2];
  }
  return map;
}

function deriveNotificationMirror(cacheEventValue, synonymMap) {
  if (!cacheEventValue.startsWith('cache.')) return null;
  const stripped = cacheEventValue.slice('cache.'.length);
  const dotIdx = stripped.indexOf('.');
  if (dotIdx < 0) return null;
  const domain = stripped.slice(0, dotIdx);
  const rest = stripped.slice(dotIdx);
  return `${synonymMap[domain] ?? domain}${rest}`;
}

/** 라운드 #3 갭 D — noti → cache 역추론 (양방향 mirror 검사). */
function deriveCacheMirror(notificationEventValue, synonymMap) {
  if (notificationEventValue.startsWith('cache.')) return notificationEventValue;
  const dotIdx = notificationEventValue.indexOf('.');
  if (dotIdx < 0) return null;
  const notiDomain = notificationEventValue.slice(0, dotIdx);
  const rest = notificationEventValue.slice(dotIdx);
  let cacheDomain = notiDomain;
  for (const [cacheKey, notiVal] of Object.entries(synonymMap)) {
    if (notiVal === notiDomain) {
      cacheDomain = cacheKey;
      break;
    }
  }
  return `cache.${cacheDomain}${rest}`;
}

/**
 * 라운드 #3 갭 O / 라운드 #4 갭 R8 — wholesale 패턴 탐지 (ADR-0012 §Decision-2 금지).
 *
 * 두 형식 모두 catch:
 * 1. template literal: `${CACHE_KEY_PREFIXES.X}*` (sub-prefix 없음)
 * 2. raw string: `'x:*'` 또는 `"x:*"` 또는 `` `x:*` `` (sub-prefix 없음, 라운드 #4 R8)
 *
 * "sub-prefix 없음" 정의: 첫 ':' 다음에 '*' 만 있고 다른 문자 없음.
 *   - 'checkouts:*' → wholesale (segments=['checkouts', '*'])
 *   - 'checkouts:list:*' → specific (segments=['checkouts', 'list', '*'])
 *   - 'checkouts:detail:abc' → specific (segments.length===3, 마지막 != '*')
 */
function extractWholesalePatterns(registrySource) {
  const wholesale = [];
  const entryRe = /\[(NOTIFICATION_EVENTS|CACHE_EVENTS)\.([A-Z_]+)\]:\s*\{([\s\S]*?)\n\s*\},/g;
  let m;
  while ((m = entryRe.exec(registrySource)) !== null) {
    const namespace = m[1];
    const key = m[2];
    const body = m[3];
    // Form 1: template literal `${CACHE_KEY_PREFIXES.X}*`
    const tplMatches = [
      ...body.matchAll(/pattern:\s*`\$\{CACHE_KEY_PREFIXES\.([A-Z_]+)\}\*`/g),
    ];
    for (const wm of tplMatches) {
      wholesale.push({ eventKey: `${namespace}.${key}`, prefix: wm[1], form: 'template' });
    }
    // Form 2 (라운드 #4 R8): raw string wholesale — `pattern: 'x:*'` 또는 backtick 둘 다.
    // CACHE_KEY_PREFIXES 변수 사용한 template은 위에서 catch했으므로 이건 raw literal 전용.
    const rawMatches = [
      ...body.matchAll(/pattern:\s*['"`]([^'"`]+):\*['"`]/g),
    ];
    for (const rm of rawMatches) {
      // ${...} interpolation을 포함한 경우는 template 매치에서 이미 처리 → 제외.
      const raw = rm[1];
      if (raw.includes('${')) continue;
      // segments 검증 (sub-prefix 없음만 wholesale)
      const segments = raw.split(':');
      if (segments.length === 1) {
        wholesale.push({
          eventKey: `${namespace}.${key}`,
          prefix: `<raw:${raw}>`,
          form: 'raw',
        });
      }
    }
  }
  return wholesale;
}

/**
 * 라운드 #5 — service-local cross-domain wholesale 검사.
 *
 * 책임:
 *   modules/**\/*.service.ts 파일을 스캔하여 `deleteByPrefix(CACHE_KEY_PREFIXES.X)` 패턴이
 *   sub-prefix concatenation 없이 단독 호출되는 경우 violation 으로 보고.
 *
 * 분류 규칙:
 *   1. self-domain: X == 해당 service의 `private CACHE_PREFIX = CACHE_KEY_PREFIXES.Y` 의 Y
 *      → ADR-0012 §Decision-2 예외 (책임 분리 정합, allowed)
 *   2. cross-domain: X != Y
 *      → VIOLATION (registry 채널 또는 specific sub-prefix 로 분해 필요)
 *
 * 검사 제외:
 *   - common/cache/cache-invalidation.helper.ts (centralized wholesale API)
 *   - listeners/ 디렉토리 (event listener 도메인 책임)
 *   - .spec.ts / .test.ts (테스트 fixture)
 */
const SERVICE_LOCAL_WHOLESALE_ALLOWLIST = new Set([
  // 형식: 'modules/<domain>/.../<file>.service.ts:<line>'
  // 점진 마이그레이션 대상은 여기에 등록 + tech-debt-tracker 동시 기록.
]);

function listServiceFiles(dir) {
  const out = [];
  function walk(d) {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        // listeners/ 디렉토리는 검사 제외 (event listener 도메인 책임)
        if (entry.name === 'listeners') continue;
        walk(full);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.service.ts') &&
        !entry.name.endsWith('.spec.ts') &&
        !entry.name.endsWith('.test.ts')
      ) {
        out.push(full);
      }
    }
  }
  walk(dir);
  return out;
}

function extractServiceCachePrefix(source) {
  // `private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.<NAME>;`
  const m = source.match(
    /private\s+readonly\s+CACHE_PREFIX\s*=\s*CACHE_KEY_PREFIXES\.([A-Z_]+)\s*;/
  );
  return m ? m[1] : null;
}

function extractServiceLocalWholesaleViolations() {
  const violations = [];
  const files = listServiceFiles(MODULES_DIR);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const ownPrefix = extractServiceCachePrefix(source);
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 1-line pattern: `deleteByPrefix(CACHE_KEY_PREFIXES.X)` — sub-prefix concat 없음
      const m = line.match(/deleteByPrefix\(\s*CACHE_KEY_PREFIXES\.([A-Z_]+)\s*\)/);
      if (!m) continue;
      const targetPrefix = m[1];
      const lineNum = i + 1;
      const relPath = relative(ROOT, file);
      const allowlistKey = `${relPath}:${lineNum}`;
      if (SERVICE_LOCAL_WHOLESALE_ALLOWLIST.has(allowlistKey)) continue;
      // self-domain wholesale → ADR-0012 §Decision-2 예외 (책임 분리 정합)
      if (ownPrefix && ownPrefix === targetPrefix) continue;
      violations.push({
        type: 'SERVICE_LOCAL_WHOLESALE',
        file: relPath,
        line: lineNum,
        targetPrefix,
        ownPrefix,
        message:
          ownPrefix
            ? `cross-domain wholesale: 자기 도메인(${ownPrefix}) 아닌 ${targetPrefix} 를 wholesale 무효화. ` +
              `\${CACHE_KEY_PREFIXES.${targetPrefix}}<sub>: 로 specific sub-prefix 분해 필요 (ADR-0012 §Decision-2).`
            : `wholesale 패턴 \`deleteByPrefix(CACHE_KEY_PREFIXES.${targetPrefix})\` 사용 — ` +
              `specific sub-prefix 분해 또는 SERVICE_LOCAL_WHOLESALE_ALLOWLIST 등록 필요.`,
      });
    }
  }
  return violations;
}

/** registry source에서 `CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST` 추출 (string Set). */
function extractWholesaleLegacyAllowlist(registrySource) {
  const allowlist = new Set();
  const startPattern = /export const CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST[^=]*=\s*new Set\(\[/;
  const startMatch = registrySource.match(startPattern);
  if (!startMatch) return allowlist;
  const startIdx = startMatch.index + startMatch[0].length;
  const endIdx = registrySource.indexOf(']);', startIdx);
  if (endIdx < 0) return allowlist;
  const body = registrySource.slice(startIdx, endIdx);
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*'([^']+)'/);
    if (m) allowlist.add(m[1]);
  }
  return allowlist;
}

/**
 * cache-event.registry.ts에서 registry entry signature(actions+patterns) 추출.
 *
 * 정규식 기반 lite parse — 키마다 `actions:` + `patterns:` 블록을 capture해서
 * 비교용 정규화 문자열로 변환. nested ternary나 동적 값 없음(static literal만)을 가정.
 */
function extractRegistrySignatures(registrySource) {
  const sigs = new Map();
  // [NAMESPACE.KEY]: { ... }, 블록 매칭. NAMESPACE = NOTIFICATION_EVENTS or CACHE_EVENTS
  const entryRe = /\[(NOTIFICATION_EVENTS|CACHE_EVENTS)\.([A-Z_]+)\]:\s*\{([\s\S]*?)\n\s*\},/g;
  let m;
  while ((m = entryRe.exec(registrySource)) !== null) {
    const namespace = m[1];
    const key = m[2];
    const body = m[3];

    const methods = [...body.matchAll(/method:\s*'([^']+)'/g)].map((x) => x[1]).sort();
    // pattern: `${CACHE_KEY_PREFIXES.X}suffix`  → `X|suffix`
    const patterns = [
      ...body.matchAll(/pattern:\s*`\$\{CACHE_KEY_PREFIXES\.([A-Z_]+)\}([^`]*)`/g),
    ]
      .map((x) => `${x[1]}|${x[2]}`)
      .sort();
    const fields = [...body.matchAll(/equipmentIdField:\s*'([^']+)'/g)].map((x) => x[1]).sort();
    const flags = [
      ...body.matchAll(/(statusChanged|teamIdChanged|equipmentStatusChanged):\s*(true|false)/g),
    ]
      .map((x) => `${x[1]}=${x[2]}`)
      .sort();

    const signature = JSON.stringify({ methods, patterns, fields, flags });
    sigs.set(`${namespace}.${key}`, signature);
  }
  return sigs;
}

// ─── Main ────────────────────────────────────────────────────────────────
const cacheSrc = readSource(CACHE_EVENTS_FILE);
const notiSrc = readSource(NOTIFICATION_EVENTS_FILE);
const registrySrc = readSource(REGISTRY_FILE);

const cacheEvents = extractStringEnum(cacheSrc, 'CACHE_EVENTS');
const notificationEvents = extractStringEnum(notiSrc, 'NOTIFICATION_EVENTS');
const synonymMap = extractSynonymMap(cacheSrc);
const registrySigs = extractRegistrySignatures(registrySrc);

if (cacheEvents.size === 0 || notificationEvents.size === 0) {
  exitWith(
    {
      ok: false,
      error: 'enum extraction failed — CACHE_EVENTS or NOTIFICATION_EVENTS unparseable',
      report: 'audit-cache-event-channels: enum 추출 실패 (source 파일 구조 변경 추정)',
    },
    2
  );
}

const cacheEnumKeyByValue = new Map([...cacheEvents].map(([k, v]) => [v, k]));
const notiEnumKeyByValue = new Map([...notificationEvents].map(([k, v]) => [v, k]));

const violations = [];
const potential = [];
const seenPairs = new Set(); // 양방향 중복 보고 방지
let mirrorPairsChecked = 0;

function recordPair(cacheKey, cacheValue, notiKey, notiValue) {
  const pairId = `${cacheKey}|${notiKey}`;
  if (seenPairs.has(pairId)) return;
  seenPairs.add(pairId);
  mirrorPairsChecked += 1;

  const cacheRegKey = `CACHE_EVENTS.${cacheKey}`;
  const notiRegKey = `NOTIFICATION_EVENTS.${notiKey}`;
  const cacheSig = registrySigs.get(cacheRegKey);
  const notiSig = registrySigs.get(notiRegKey);

  if (cacheSig && notiSig) {
    if (cacheSig === notiSig) {
      violations.push({
        type: 'VIOLATION',
        cacheEvent: { key: cacheRegKey, value: cacheValue },
        notificationEvent: { key: notiRegKey, value: notiValue },
        signature: cacheSig,
        message:
          '동일 logical 이벤트의 mirror pair가 양 채널에 동일 invalidation rule로 등록됨. ' +
          'NOTIFICATION_EVENTS 측을 cache-event.registry.ts 에서 제거하세요 (ADR-0012).',
      });
    } else {
      potential.push({
        type: 'POTENTIAL_DIVERGENCE',
        cacheEvent: { key: cacheRegKey, value: cacheValue },
        notificationEvent: { key: notiRegKey, value: notiValue },
        cacheSignature: cacheSig,
        notiSignature: notiSig,
        message:
          '양 채널 모두 registry에 등록되어 있으나 actions/patterns가 다름. 의도된 분기인지 ' +
          'review 필요 — 우연일 경우 시간이 지나면 동일해지면서 violation으로 회귀할 수 있음.',
      });
    }
  } else if (cacheSig || notiSig) {
    potential.push({
      type: 'POTENTIAL_ONE_SIDED',
      cacheEvent: { key: cacheRegKey, registered: Boolean(cacheSig) },
      notificationEvent: { key: notiRegKey, registered: Boolean(notiSig) },
      message:
        'mirror 후보 중 한쪽만 registry에 등록됨. 다른 채널이 추가되면 invariant violation 트리거.',
    });
  }
}

// 라운드 #3 갭 D: 양방향 mirror 검사
// 방향 1: cache → noti
for (const [cacheKey, cacheValue] of cacheEvents) {
  const mirror = deriveNotificationMirror(cacheValue, synonymMap);
  if (!mirror || !notiEnumKeyByValue.has(mirror)) continue;
  recordPair(cacheKey, cacheValue, notiEnumKeyByValue.get(mirror), mirror);
}
// 방향 2: noti → cache reverse
for (const [notiKey, notiValue] of notificationEvents) {
  const mirror = deriveCacheMirror(notiValue, synonymMap);
  if (!mirror || !cacheEnumKeyByValue.has(mirror)) continue;
  recordPair(cacheEnumKeyByValue.get(mirror), mirror, notiKey, notiValue);
}

// 라운드 #5: service-local wholesale violation (cross-domain)
const serviceLocalViolations = extractServiceLocalWholesaleViolations();
for (const v of serviceLocalViolations) {
  violations.push(v);
}

// 라운드 #3 갭 O: wholesale 패턴 violation (LEGACY allowlist 제외)
const wholesalePatterns = extractWholesalePatterns(registrySrc);
const wholesaleLegacyAllowlist = extractWholesaleLegacyAllowlist(registrySrc);
for (const w of wholesalePatterns) {
  if (wholesaleLegacyAllowlist.has(w.eventKey)) {
    potential.push({
      type: 'WHOLESALE_LEGACY',
      eventKey: w.eventKey,
      prefix: w.prefix,
      message:
        `LEGACY wholesale 패턴 (ADR-0012 §Decision-2 점진 마이그레이션 대상). ` +
        `cache-event.registry.ts CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST에 등재됨. ` +
        `해당 도메인의 service-local invalidateCache()와 책임 분리 후 specific sub-prefix로 마이그레이션 권장.`,
    });
    continue;
  }
  violations.push({
    type: 'WHOLESALE_PATTERN',
    eventKey: w.eventKey,
    prefix: w.prefix,
    message:
      `wholesale 패턴 \${CACHE_KEY_PREFIXES.${w.prefix}}* 사용 (ADR-0012 §Decision-2 금지). ` +
      `specific sub-prefix(list:* / pending:* / detail:* 등)로 분해하거나, ` +
      `점진 마이그레이션 대상이면 CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST 등재 (review 필수).`,
  });
}

// ─── Report ──────────────────────────────────────────────────────────────
let report = '';
report += '╔══════════════════════════════════════════════════════════════════╗\n';
report += '║ audit-cache-event-channels — ADR-0012 dual-channel exclusivity   ║\n';
report += '╚══════════════════════════════════════════════════════════════════╝\n';
report += '\n';
report += `mirror pair 후보: ${mirrorPairsChecked}개 (synonym: ${Object.keys(synonymMap).length}개)\n`;
report += `VIOLATIONS: ${violations.length}\n`;
report += `POTENTIAL:  ${potential.length}\n`;
report += '\n';

if (violations.length > 0) {
  report += '── VIOLATIONS (즉시 fix 필요) ─────────────────────────────────────\n';
  for (const v of violations) {
    if (v.type === 'WHOLESALE_PATTERN') {
      report += `\n  ✗ [wholesale] ${v.eventKey}\n`;
      report += `    pattern: \${CACHE_KEY_PREFIXES.${v.prefix}}*\n`;
      report += `    → ${v.message}\n`;
    } else if (v.type === 'SERVICE_LOCAL_WHOLESALE') {
      report += `\n  ✗ [service-local wholesale] ${v.file}:${v.line}\n`;
      report += `    target: CACHE_KEY_PREFIXES.${v.targetPrefix}`;
      report += v.ownPrefix ? ` (own: ${v.ownPrefix})\n` : ` (own: <untracked>)\n`;
      report += `    → ${v.message}\n`;
    } else {
      report += `\n  ✗ ${v.cacheEvent.key} (= '${v.cacheEvent.value}')\n`;
      report += `    + ${v.notificationEvent.key} (= '${v.notificationEvent.value}')\n`;
      report += `    → ${v.message}\n`;
    }
  }
  report += '\n';
}

if (potential.length > 0) {
  report += '── POTENTIAL (잠재 회귀, review 권장) ──────────────────────────────\n';
  for (const p of potential) {
    report += `\n  ⚠ ${p.type}\n`;
    if (p.type === 'POTENTIAL_DIVERGENCE') {
      report += `    cache: ${p.cacheEvent.key}\n`;
      report += `    noti:  ${p.notificationEvent.key}\n`;
    } else if (p.type === 'WHOLESALE_LEGACY') {
      report += `    event:  ${p.eventKey}\n`;
      report += `    pattern: \${CACHE_KEY_PREFIXES.${p.prefix}}*\n`;
    } else {
      report += `    cache: ${p.cacheEvent.key} (registered=${p.cacheEvent.registered})\n`;
      report += `    noti:  ${p.notificationEvent.key} (registered=${p.notificationEvent.registered})\n`;
    }
    report += `    → ${p.message}\n`;
  }
  report += '\n';
}

if (violations.length === 0 && potential.length === 0) {
  report += '✓ 위반 / 잠재 회귀 없음. ADR-0012 정책 정합.\n';
}

const exitCode = violations.length > 0 ? 1 : 0;
exitWith(
  {
    ok: violations.length === 0,
    mirrorPairsChecked,
    synonymCount: Object.keys(synonymMap).length,
    violations,
    potential,
    report,
  },
  exitCode
);
