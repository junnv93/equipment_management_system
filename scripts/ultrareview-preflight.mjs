#!/usr/bin/env node
/**
 * ultrareview-preflight.mjs — ultrareview 업로드 전 secret 유출 게이트
 *
 * ultrareview는 working tree를 원격 샌드박스로 bundle 업로드한다.
 * pre-commit은 staged 파일만 검사하므로 unstaged/untracked secret은 그대로 전송될 수 있다.
 * 이 스크립트는 업로드 직전 working tree 전체를 재검사한다.
 *
 * 사용법:
 *   node scripts/ultrareview-preflight.mjs          # 표준 실행
 *   node scripts/ultrareview-preflight.mjs --verbose # 상세 로그
 *
 * 종료 코드:
 *   0 — 통과 (업로드 진행 가능)
 *   1 — 차단 (secret 의심 패턴 발견, 조치 필요)
 *
 * 상세: docs/references/ultrareview-usage.md (Pre-upload Secret Gate 섹션)
 * 관련: infra/secrets/README.md, .gitleaks.toml
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const VERBOSE = process.argv.includes('--verbose');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

function log(msg) {
  process.stdout.write(msg + '\n');
}
function warn(msg) {
  process.stderr.write(`${YELLOW}⚠  ${msg}${RESET}\n`);
}
function error(msg) {
  process.stderr.write(`${RED}❌ ${msg}${RESET}\n`);
}
function ok(msg) {
  log(`${GREEN}✅ ${msg}${RESET}`);
}
function verbose(msg) {
  if (VERBOSE) log(`   ${msg}`);
}

// ─── 검사 1: 위험 파일 working tree 존재 여부 ──────────────────────────────
// .gitignore에 있어도 working tree에 존재하면 bundle에 포함될 수 있음

const DANGEROUS_PATTERNS = [
  // 로컬 환경변수 (gitignore 대상이지만 존재 확인)
  { pattern: '.env.local',           reason: 'frontend 로컬 env (DB/NextAuth secret 포함 가능)' },
  { pattern: 'apps/frontend/.env.local', reason: 'frontend 로컬 env' },
  { pattern: 'apps/backend/.env',    reason: 'backend 로컬 env (DB_URL, JWT_SECRET 등)' },
  { pattern: '.env.test',            reason: 'test env (gitignore 대상)' },
  // sops 복호화 잔여물
  { pattern: 'run/secrets',          reason: 'sops 복호화 런타임 경로 (tmpfs 마운트 경로)' },
  // age 키 파일
  { pattern: '.age',                 reason: 'age private key 파일 (*.age)', glob: true },
  { pattern: 'keys.txt',             reason: '~/.config/sops/age/keys.txt 복사본' },
  // 명시적 복호화 잔여물
  { pattern: '.sops.decrypted',      reason: 'sops 복호화 잔여물 (*.sops.decrypted)', glob: true },
  { pattern: 'infra/secrets/lan.env',  reason: 'sops 복호화된 평문 env' },
  { pattern: 'infra/secrets/prod.env', reason: 'sops 복호화된 평문 env' },
];

function findGlobFiles(rootDir, suffix) {
  const found = [];
  function walk(dir) {
    try {
      for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
        const full = join(dir, entry);
        try {
          const st = statSync(full);
          if (st.isDirectory()) {
            walk(full);
          } else if (entry.endsWith(suffix)) {
            found.push(relative(rootDir, full));
          }
        } catch { /* skip unreadable */ }
      }
    } catch { /* skip unreadable */ }
  }
  walk(rootDir);
  return found;
}

let check1Blocked = false;
log('\n[ultrareview-preflight] 검사 1/3: 위험 파일 working tree 존재 확인...');

for (const { pattern, reason, glob } of DANGEROUS_PATTERNS) {
  if (glob) {
    const suffix = pattern.startsWith('.') ? pattern : `.${pattern}`;
    const found = findGlobFiles(ROOT, suffix);
    if (found.length > 0) {
      error(`위험 파일 발견: *${suffix} (${reason})`);
      for (const f of found) error(`  ${f}`);
      check1Blocked = true;
    } else {
      verbose(`OK: *${suffix} — 없음`);
    }
  } else {
    const fullPath = join(ROOT, pattern);
    if (existsSync(fullPath)) {
      error(`위험 파일 발견: ${pattern}`);
      error(`  이유: ${reason}`);
      error(`  조치: rm -f ${pattern}  또는  echo '${pattern}' >> .gitignore`);
      check1Blocked = true;
    } else {
      verbose(`OK: ${pattern} — 없음`);
    }
  }
}

if (!check1Blocked) ok('검사 1/3 통과: 위험 파일 없음');

// ─── 검사 2: gitleaks working tree 전체 스캔 ──────────────────────────────
// pre-commit은 staged만 검사. 여기서는 --no-git 으로 working tree 전체 재검사.

log('\n[ultrareview-preflight] 검사 2/3: gitleaks working tree 전체 스캔...');

let check2Blocked = false;
let gitleaksAvailable = false;

const whichResult = spawnSync('which', ['gitleaks'], { encoding: 'utf8' });
gitleaksAvailable = whichResult.status === 0;

if (!gitleaksAvailable) {
  warn('gitleaks 미설치 — working tree 전체 스캔 건너뜀 (docs/operations/secret-backup.md 참조)');
  warn('  설치 권장: brew install gitleaks  또는  https://github.com/gitleaks/gitleaks');
} else {
  const configPath = join(ROOT, '.gitleaks.toml');
  const configArg = existsSync(configPath) ? `--config ${configPath}` : '';
  const cmd = `gitleaks detect --no-git --source . --redact --no-banner --exit-code=1 ${configArg}`.trim();
  verbose(`실행: ${cmd}`);

  try {
    execSync(cmd, { cwd: ROOT, stdio: VERBOSE ? 'inherit' : 'pipe' });
    ok('검사 2/3 통과: gitleaks 이상 없음');
  } catch {
    error('gitleaks: working tree에 secret 의심 패턴 감지');
    error('  상세: gitleaks detect --no-git --source . --verbose --config .gitleaks.toml');
    error('  오탐이면: .gitleaks.toml allowlist 또는 .gitleaksignore에 fingerprint 추가');
    check2Blocked = true;
  }
}

// ─── 검사 3: 최근 5 커밋 범위 재확인 ──────────────────────────────────────
// ultrareview PR 모드는 GitHub에서 직접 clone → 히스토리 포함.
// 브랜치 모드도 bundle에 .git history가 일부 포함될 수 있음.

log('\n[ultrareview-preflight] 검사 3/3: 최근 5 커밋 diff secret 재확인...');

let check3Blocked = false;

if (!gitleaksAvailable) {
  warn('gitleaks 미설치 — 커밋 히스토리 스캔 건너뜀');
} else {
  const configPath = join(ROOT, '.gitleaks.toml');
  const configArg = existsSync(configPath) ? `--config ${configPath}` : '';
  // 최근 5 커밋을 staged 모드로 스캔 (gitleaks protect는 HEAD만 보므로 직접 detect)
  const cmd = `gitleaks detect --log-opts="HEAD~5..HEAD" --redact --no-banner --exit-code=1 ${configArg}`.trim();
  verbose(`실행: ${cmd}`);

  try {
    execSync(cmd, { cwd: ROOT, stdio: VERBOSE ? 'inherit' : 'pipe' });
    ok('검사 3/3 통과: 최근 5 커밋 이상 없음');
  } catch {
    error('gitleaks: 최근 5 커밋에 secret 의심 패턴 감지');
    error('  커밋에 포함된 secret은 업로드 시 원격 샌드박스에서 접근 가능합니다.');
    error('  조치: git filter-repo 또는 BFG Repo-Cleaner로 히스토리에서 제거 필요');
    check3Blocked = true;
  }
}

// ─── 결과 종합 ──────────────────────────────────────────────────────────────

const anyBlocked = check1Blocked || check2Blocked || check3Blocked;

log('');
if (anyBlocked) {
  error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  error('ultrareview 업로드 전 secret 검사 실패');
  error('위 항목을 해결한 후 다시 실행하세요.');
  error('상세 가이드: docs/references/ultrareview-usage.md');
  error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
} else {
  ok('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ok('ultrareview-preflight 통과 — 업로드 진행 가능');
  ok('다음 단계: /ultrareview <PR번호>');
  ok('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}
