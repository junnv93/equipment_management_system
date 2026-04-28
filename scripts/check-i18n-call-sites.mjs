#!/usr/bin/env node
/**
 * check-i18n-call-sites.mjs — 호출지 ↔ messages JSON 정적 검증 게이트
 *
 * 목적:
 *   `useTranslations`/`getTranslations` 호출지에서 사용한 키가 실제로
 *   `messages/{ko,en}/<ns>.json`에 존재하는지 정적으로 검증한다.
 *   기존 `check-i18n-keys.mjs`(필수 키 contract)와 책임 분리:
 *     - check-i18n-keys.mjs       : 소량 known-critical 필수 키 검증 (FSM 등)
 *     - check-i18n-call-sites.mjs : 호출지 ↔ 메시지 일반 게이트 (이 스크립트)
 *
 * 사용법:
 *   node scripts/check-i18n-call-sites.mjs --all              전체 검사 (CI / pre-push)
 *   node scripts/check-i18n-call-sites.mjs --changed          staged 파일만 (pre-commit)
 *   node scripts/check-i18n-call-sites.mjs --file <path>      단일 파일 디버깅
 *   node scripts/check-i18n-call-sites.mjs --all --quiet      WARN 출력 억제
 *
 * 종료코드:
 *   0 — 누락 없음
 *   1 — 누락 키 1개 이상
 *   2 — I/O 또는 사용법 오류
 *
 * 정확도 정책:
 *   - shadowed binding (같은 변수명에 useTranslations 다중 선언) → 검증 스킵 + WARN
 *   - 동적 키 (template literal interpolation `t(\`prefix.${var}\`)`) → 스킵
 *   - 주석 안 t-호출 → 스킵 (block + line comment 인식)
 *   - 문자열 리터럴 안 t-호출 (JSDoc 예제 등) → 스킵
 */

import { readFileSync, statSync } from 'node:fs';
import { resolve, relative, join, sep, extname } from 'node:path';
import { execSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';

const ROOT = process.cwd();
const FRONTEND_DIR = resolve(ROOT, 'apps/frontend');
const MESSAGES_DIR = resolve(FRONTEND_DIR, 'messages');

// ─── 검증 대상 로케일 ──────────────────────────────────────────────────────────
// `messages/<locale>` 디렉토리가 SSOT. 하드코딩이 아니라 디렉토리 실측으로 도출하면
// 더 정확하지만 (a) 새 로케일 추가 시 의도된 미존재 ns 표현이 어렵고
// (b) i18n.ts의 namespaces 배열과 정합 유지 비용이 크므로 명시 배열 유지.
const LOCALES = ['ko', 'en'];

// 검사 제외 경로 (테스트 fixture, 빌드 산출물, 스크립트 자체)
const EXCLUDE_PATTERNS = [
  /\/node_modules\//,
  /\/\.next\//,
  /\/\.turbo\//,
  /\/coverage\//,
  /\/dist\//,
  /\/tests\/e2e\/.*\.spec\.ts$/,
  /\/tests\/.*fixtures?\//,
  /\.d\.ts$/,
];

// CLI 파싱
const argv = process.argv.slice(2);
const isAll = argv.includes('--all');
const isChanged = argv.includes('--changed');
const fileFlagIdx = argv.indexOf('--file');
const isFile = fileFlagIdx !== -1;
const targetFile = isFile ? argv[fileFlagIdx + 1] : null;
const isQuiet = argv.includes('--quiet');

if (!isAll && !isChanged && !isFile) {
  process.stdout.write(`Usage: node scripts/check-i18n-call-sites.mjs [--all | --changed | --file <path>] [--quiet]\n`);
  process.exit(2);
}

// ─── messages JSON 캐시 (네임스페이스별 flat key Set) ────────────────────────────

/** @type {Map<string, Set<string>>} key: '<locale>:<topNs>', value: flat key Set */
const messageCache = new Map();

function flattenKeys(obj, prefix = '') {
  const out = new Set();
  if (obj == null || typeof obj !== 'object') return out;
  for (const key of Object.keys(obj)) {
    const np = prefix ? `${prefix}.${key}` : key;
    const v = obj[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const x of flattenKeys(v, np)) out.add(x);
    } else {
      out.add(np);
    }
  }
  return out;
}

function loadMessageKeys(locale, topNs) {
  const cacheKey = `${locale}:${topNs}`;
  if (messageCache.has(cacheKey)) return messageCache.get(cacheKey);
  const filePath = resolve(MESSAGES_DIR, locale, `${topNs}.json`);
  let keys = null;
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    keys = flattenKeys(data);
  } catch {
    // 네임스페이스 파일 부재 — i18n.ts dynamic import도 silent skip
    keys = null;
  }
  messageCache.set(cacheKey, keys);
  return keys;
}

// ─── Source 텍스트 정제 (주석 + 문자열 인식) ──────────────────────────────────

/**
 * 주석을 공백으로 치환하되 줄 번호를 보존한다.
 * 문자열 리터럴 내부는 그대로 둔다 (template literal interpolation 포함).
 *
 * 한계:
 *   - 정규식 리터럴 `/pattern/`을 division operator와 정확히 구분하지 않음.
 *     실무에서 t(`...`) 호출과 충돌하는 케이스는 거의 없음 (검증 도구 한계 인식).
 */
function stripCommentsPreservingLines(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    // 문자열 리터럴 (' " `)
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      out += c;
      i++;
      while (i < n) {
        const ch = src[i];
        if (ch === '\\') {
          out += ch + (src[i + 1] || '');
          i += 2;
          continue;
        }
        if (ch === quote) {
          out += ch;
          i++;
          break;
        }
        // template literal interpolation은 보존 (그대로 출력)
        out += ch;
        if (ch === '\n') {
          // 줄 번호 동기화 — 그대로 유지
        }
        i++;
      }
      continue;
    }

    // 라인 코멘트
    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }

    // 블록 코멘트 — newline은 유지하여 line 번호 동기
    if (c === '/' && next === '*') {
      i += 2;
      while (i < n) {
        if (src[i] === '*' && src[i + 1] === '/') {
          i += 2;
          break;
        }
        if (src[i] === '\n') out += '\n';
        i++;
      }
      continue;
    }

    out += c;
    i++;
  }
  return out;
}

// ─── 호출지 추출 ──────────────────────────────────────────────────────────────

const BIND_PATTERN = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:['"`]([\w.\-]+)['"`])\s*\)/g;

// 동적 키 / 인터폴레이션은 `${`가 키 안에 있으면 매치 실패하도록 negation 클래스 사용.
// `t.raw('key')`도 t-호출과 동등 (반환 타입만 다름).
const CALL_PATTERN = /\b(\w+)(?:\.raw)?\s*\(\s*(['"])([^'"`$\\]+)\2\s*[,)]/g;

/**
 * 한 파일에서 위반 사항 목록을 추출한다.
 * @returns {{
 *   broken: Array<{file:string, line:number, ns:string, key:string, fullKey:string, locales:string[]}>,
 *   shadowed: Array<{file:string, varName:string, namespaces:string[]}>,
 * }}
 */
function scanFile(absPath, relPath) {
  const broken = [];
  const shadowedDetails = [];

  let raw;
  try {
    raw = readFileSync(absPath, 'utf-8');
  } catch {
    return { broken, shadowed: shadowedDetails };
  }

  if (!raw.includes('useTranslations') && !raw.includes('getTranslations')) {
    return { broken, shadowed: shadowedDetails };
  }

  const src = stripCommentsPreservingLines(raw);

  // 바인딩 수집
  /** @type {Map<string, {ns: string, shadowed: boolean, namespaces: Set<string>}>} */
  const bindings = new Map();
  BIND_PATTERN.lastIndex = 0;
  let m;
  while ((m = BIND_PATTERN.exec(src)) !== null) {
    const varName = m[1];
    const ns = m[2];
    const existing = bindings.get(varName);
    if (existing) {
      if (existing.ns !== ns) {
        existing.shadowed = true;
        existing.namespaces.add(ns);
      }
    } else {
      bindings.set(varName, { ns, shadowed: false, namespaces: new Set([ns]) });
    }
  }

  // shadowed binding 보고
  for (const [varName, info] of bindings) {
    if (info.shadowed) {
      shadowedDetails.push({
        file: relPath,
        varName,
        namespaces: [...info.namespaces],
      });
    }
  }

  // t-호출 수집
  CALL_PATTERN.lastIndex = 0;
  while ((m = CALL_PATTERN.exec(src)) !== null) {
    const varName = m[1];
    const key = m[3];
    const binding = bindings.get(varName);
    if (!binding || binding.shadowed) continue;
    if (key.length === 0) continue;
    if (key.includes('${')) continue; // template literal interpolation (negation 클래스로 이미 차단되지만 이중 안전)
    if (key.endsWith('.')) continue; // prefix only — 동적 키 잔재

    const ns = binding.ns;
    const [topNs, ...subPath] = ns.split('.');
    const fullKey = subPath.length ? `${subPath.join('.')}.${key}` : key;

    const missingLocales = [];
    for (const locale of LOCALES) {
      const flatKeys = loadMessageKeys(locale, topNs);
      if (flatKeys === null) {
        // ns 파일 자체 부재 — 등록되지 않은 ns에 대한 호출
        missingLocales.push(`${locale}(no-ns)`);
        continue;
      }
      // 정확 매치 + 부모 매치 (서브트리 전체 추출 — t.raw)도 허용
      // 단 t.raw의 경우 leaf가 아닐 가능성 → 둘 중 하나라도 있으면 OK
      const exactMatch = flatKeys.has(fullKey);
      const parentMatch = !exactMatch && [...flatKeys].some((k) => k.startsWith(`${fullKey}.`));
      if (!exactMatch && !parentMatch) {
        missingLocales.push(locale);
      }
    }

    if (missingLocales.length > 0) {
      // 라인 번호 계산
      const beforeMatch = src.substring(0, m.index);
      const line = beforeMatch.split('\n').length;
      broken.push({ file: relPath, line, ns, key, fullKey: `${topNs}.${fullKey}`, locales: missingLocales });
    }
  }

  return { broken, shadowed: shadowedDetails };
}

// ─── 파일 walker ───────────────────────────────────────────────────────────────

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

async function walkSourceFiles(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.name === 'node_modules') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await walkSourceFiles(full, out);
    } else if (e.isFile() && SOURCE_EXTS.has(extname(e.name))) {
      const rel = relative(ROOT, full);
      if (EXCLUDE_PATTERNS.some((re) => re.test(`/${rel}`))) continue;
      out.push(full);
    }
  }
  return out;
}

function getStagedFiles() {
  try {
    const out = execSync('git diff --staged --name-only --diff-filter=ACM', { encoding: 'utf8', cwd: ROOT });
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((f) => SOURCE_EXTS.has(extname(f)) && f.startsWith(`apps${sep}frontend`));
  } catch {
    return [];
  }
}

// ─── common.json 구조 검증 ──────────────────────────────────────────────────────
//
// 정책 근거 (docs/references/frontend-patterns.md "Atom-level i18n 금지 원칙"):
//   atom 컴포넌트는 cross-cutting `common.*` namespace의 *flat top-level* 키 의존 금지.
//   sub-namespace(예: `common.fileUpload.uploading`)는 atom-owned로 허용.
//   본 회귀(`tCommon('loading')` 자기 모순)의 메커니즘은 "flat top-level 키"가 추가되어
//   atom이 그것을 호출하기 시작하는 패턴. 이를 빌드 타임에 *구조적으로* 차단한다.

function checkCommonJsonStructure() {
  const violations = [];
  for (const locale of LOCALES) {
    const filePath = resolve(MESSAGES_DIR, locale, 'common.json');
    let data;
    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      // common.json 부재는 다른 검증에서 잡힘 — 여기선 skip
      continue;
    }
    for (const [key, value] of Object.entries(data)) {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        violations.push({ locale, key, valueType: Array.isArray(value) ? 'array' : typeof value });
      }
    }
  }
  return violations;
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  let files = [];
  if (isFile) {
    if (!targetFile) {
      process.stderr.write('--file 플래그에 경로가 필요합니다.\n');
      process.exit(2);
    }
    const abs = resolve(ROOT, targetFile);
    try {
      const st = statSync(abs);
      if (!st.isFile()) {
        process.stderr.write(`경로가 파일이 아닙니다: ${targetFile}\n`);
        process.exit(2);
      }
      files = [abs];
    } catch {
      process.stderr.write(`파일을 찾을 수 없습니다: ${targetFile}\n`);
      process.exit(2);
    }
  } else if (isChanged) {
    const staged = getStagedFiles();
    files = staged.map((f) => resolve(ROOT, f));
  } else {
    // --all
    files = await walkSourceFiles(FRONTEND_DIR);
  }

  if (files.length === 0) {
    process.stdout.write('ℹ️  i18n call-sites: 검사할 파일이 없습니다.\n');
    process.exit(0);
  }

  const allBroken = [];
  const allShadowed = [];

  for (const abs of files) {
    const rel = relative(ROOT, abs);
    const { broken, shadowed } = scanFile(abs, rel);
    allBroken.push(...broken);
    allShadowed.push(...shadowed);
  }

  // common.json 구조 검증 — flat top-level key 금지 (atom 회귀 차단)
  // --all 또는 --file 모드에서만 실행 (--changed는 messages/* 변경분 추적은 별도 책임)
  const commonStructureViolations = (isAll || isFile) ? checkCommonJsonStructure() : [];

  // 보고
  if (allBroken.length === 0 && commonStructureViolations.length === 0) {
    let totalCalls = 0;
    let totalNamespaces = 0;
    for (const [, val] of messageCache) {
      if (val !== null) totalCalls += val.size;
    }
    totalNamespaces = new Set([...messageCache.keys()].map((k) => k.split(':')[1])).size;
    process.stdout.write(
      `✅ i18n call-sites: ${files.length}개 파일 / ${totalNamespaces}개 ns 검사 — 누락 0건\n`
    );
    if (allShadowed.length > 0 && !isQuiet) {
      process.stderr.write(
        `⚠️  shadowed binding ${allShadowed.length}건 (정확 검증 스킵 — tech-debt):\n`
      );
      const grouped = new Map();
      for (const s of allShadowed) {
        const key = `${s.file}:${s.varName}`;
        if (!grouped.has(key)) grouped.set(key, s);
      }
      for (const s of [...grouped.values()].slice(0, 10)) {
        process.stderr.write(`   ${s.file} :: ${s.varName} = [${s.namespaces.join(', ')}]\n`);
      }
      if (grouped.size > 10) {
        process.stderr.write(`   … (${grouped.size - 10}건 더 — --quiet으로 숨김 가능)\n`);
      }
    }
    process.exit(0);
  } else {
    if (allBroken.length > 0) {
      process.stderr.write(`❌ i18n call-sites: 누락 키 ${allBroken.length}건\n`);
      for (const b of allBroken) {
        process.stderr.write(
          `   누락: ${b.file}:${b.line} → ${b.fullKey} [${b.locales.join(', ')}] (binding ns: ${b.ns}, call key: ${b.key})\n`
        );
      }
    }
    if (commonStructureViolations.length > 0) {
      process.stderr.write(
        `\n❌ common.json 구조 위반 ${commonStructureViolations.length}건 (atom 회귀 차단 정책):\n`
      );
      for (const v of commonStructureViolations) {
        process.stderr.write(
          `   ${v.locale}/common.json :: "${v.key}" — root level은 sub-namespace(object)만 허용, ${v.valueType} 타입 발견\n`
        );
      }
      process.stderr.write(
        `   원인: atom이 flat top-level common.* 키를 호출하면 자기-모순 회귀 가능 (frontend-patterns.md "Atom-level i18n 금지" 참조)\n` +
          `   해결: 해당 키를 sub-namespace로 그룹화 (예: "loading" → "status.loading"). atom은 prop 주입으로 cross-cutting 라벨 받음\n`
      );
    }
    if (allShadowed.length > 0 && !isQuiet) {
      process.stderr.write(`\n⚠️  shadowed binding ${allShadowed.length}건은 검증 스킵됨\n`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  process.stderr.write(`I/O 오류: ${e.message}\n`);
  process.exit(2);
});
