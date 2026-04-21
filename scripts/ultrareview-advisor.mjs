#!/usr/bin/env node
/**
 * ultrareview-advisor.mjs — ultrareview Go/No-Go 자동 판정
 *
 * 판정 기준은 하드코딩하지 않는다. 3개 SSOT에서 실시간 파생:
 *   1. CLAUDE.md   — "브랜치 필요한 예외" 4항목
 *   2. review-learnings.md — "✅ 승격 완료" / "N차 재발" 고위험 패턴 + 발견 위치 파일 경로
 *   3. git diff    — 변경 파일 목록 + LoC
 *
 * 사용법:
 *   node scripts/ultrareview-advisor.mjs           # 상세 출력
 *   node scripts/ultrareview-advisor.mjs --hint    # pre-push용 1줄 요약
 *   node scripts/ultrareview-advisor.mjs --json    # JSON 출력 (CI 친화)
 *
 * 종료 코드: 항상 0 (정보성, push를 막지 않음)
 *
 * 상세: docs/references/ultrareview-usage.md (Trigger Derivation Algorithm 섹션)
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';

const ROOT = process.cwd();
const HINT_MODE = process.argv.includes('--hint');
const JSON_MODE = process.argv.includes('--json');

// ─── SSOT 경로 ────────────────────────────────────────────────────────────────
const REVIEW_LEARNINGS_PATH = join(
  ROOT,
  '.claude/skills/review-architecture/references/review-learnings.md',
);
const CLAUDE_MD_PATH = join(ROOT, 'CLAUDE.md');

// ─── 출력 헬퍼 ───────────────────────────────────────────────────────────────
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const RESET  = '\x1b[0m';

function log(msg)  { if (!JSON_MODE) process.stdout.write(msg + '\n'); }
function warn(msg) { if (!JSON_MODE) process.stderr.write(`${YELLOW}⚠  ${msg}${RESET}\n`); }

// ─── 1. git diff 통계 수집 ────────────────────────────────────────────────────

function getGitDiff() {
  // 원격 main과 비교. origin/main 없으면 HEAD~1 fallback.
  const baseRef = (() => {
    try {
      execSync('git rev-parse origin/main', { cwd: ROOT, stdio: 'pipe' });
      return 'origin/main';
    } catch {
      try {
        execSync('git rev-parse main', { cwd: ROOT, stdio: 'pipe' });
        return 'main';
      } catch {
        return 'HEAD~1';
      }
    }
  })();

  let changedFiles = [];
  let insertions = 0;
  let deletions = 0;

  try {
    const nameOnly = execSync(`git diff --name-only ${baseRef}...HEAD`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    changedFiles = nameOnly.trim().split('\n').filter(Boolean);
  } catch {
    // 비교 기준 없으면 staged + unstaged
    try {
      const nameOnly = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf8' });
      changedFiles = nameOnly.trim().split('\n').filter(Boolean);
    } catch { /* empty */ }
  }

  try {
    const stat = execSync(`git diff --shortstat ${baseRef}...HEAD`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    const ins = stat.match(/(\d+) insertion/);
    const del = stat.match(/(\d+) deletion/);
    if (ins) insertions = parseInt(ins[1]);
    if (del) deletions = parseInt(del[1]);
  } catch { /* no shortstat */ }

  return { changedFiles, insertions, deletions, totalLoc: insertions + deletions, baseRef };
}

// ─── 2. SSOT 파싱 — CLAUDE.md "브랜치 필요한 예외" ──────────────────────────

function parseClaudeExceptions() {
  if (!existsSync(CLAUDE_MD_PATH)) return [];
  const content = readFileSync(CLAUDE_MD_PATH, 'utf8');
  const match = content.match(/\*\*브랜치 필요한 예외\*\*[^\n]*:\s*([^\n]+)/);
  if (!match) return [];
  // "DB 마이그레이션 / major dep bump / 50+ 파일 리팩토링 / 실험적 작업" 파싱
  return match[1]
    .split(/\/|,/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// ─── 3. SSOT 파싱 — review-learnings.md 고위험 패턴 ─────────────────────────

/**
 * 고위험 패턴 추출 기준:
 *   - "✅ 승격 완료" 또는 "(N차 재발)" (N>=2) 마커가 있는 섹션
 *   - 섹션 내 "발견 위치" 파일 경로 목록
 * 반환: [{ name, paths: string[], keywords: string[] }]
 */
function parseHighRiskPatterns() {
  if (!existsSync(REVIEW_LEARNINGS_PATH)) return [];

  const content = readFileSync(REVIEW_LEARNINGS_PATH, 'utf8');
  const sections = content.split(/^### /m).filter(Boolean);
  const patterns = [];

  for (const section of sections) {
    const lines = section.split('\n');
    const header = lines[0] || '';

    // 승격 완료이거나 2차 이상 재발 섹션만
    const isHighRisk =
      section.includes('✅ 승격 완료') ||
      /[2-9]차 재발/.test(section) ||
      /발견 빈도.*[4-9]\s*회/.test(section) ||
      /발견 빈도.*[1-9][0-9]+\s*회/.test(section);

    if (!isHighRisk) continue;

    // 헤더에서 이름 추출 (날짜 제거)
    const name = header.replace(/^\[\d{4}-\d{2}-\d{2}\]\s*/, '').trim();

    // "발견 위치" 및 "발견 빈도" 내 backtick 파일 경로 추출
    const pathMatches = section.matchAll(/`(apps\/[^`]+|packages\/[^`]+)`/g);
    const paths = [...pathMatches].map((m) => m[1]);

    // 헤더 키워드 추출 (CAS, 트랜잭션, 이벤트, 권한 등)
    const keywords = extractKeywords(name + ' ' + section.slice(0, 300));

    if (keywords.length > 0 || paths.length > 0) {
      patterns.push({ name, paths, keywords });
    }
  }

  return patterns;
}

function extractKeywords(text) {
  const lower = text.toLowerCase();
  const found = [];
  if (/\bcas\b|stale cas|cas 버전|cas 선점|version_conflict/.test(lower)) found.push('CAS');
  if (/트랜잭션|transaction|this\.db|external.*tx|outer.*tx/.test(lower)) found.push('TRANSACTION');
  if (/이벤트|emitasync|cache.*invalidat|캐시 무효화/.test(lower)) found.push('EVENT_CACHE');
  if (/권한|@sitescoped|rbac|permission|guard/.test(lower)) found.push('AUTH_PERMISSION');
  if (/마이그레이션|migration|drizzle|db.*schema/.test(lower)) found.push('DB_MIGRATION');
  if (/querykey|stale.*data|refetch|캐시.*stale/.test(lower)) found.push('QUERY_CACHE');
  return found;
}

// ─── 4. 변경 파일 vs 고위험 패턴 교차 매칭 ───────────────────────────────────

function matchCategories(changedFiles, highRiskPatterns) {
  const matched = new Map(); // category → { pattern, matchedFiles }

  for (const pattern of highRiskPatterns) {
    // 방법 A: 발견 위치 파일 경로의 디렉토리/모듈명이 변경 파일과 겹치는지
    const patternModules = pattern.paths.map((p) => {
      const parts = p.split('/');
      // apps/backend/src/modules/calibration/... → 'calibration'
      const moduleIdx = parts.indexOf('modules');
      if (moduleIdx >= 0 && parts[moduleIdx + 1]) return parts[moduleIdx + 1];
      // apps/frontend/components/equipment/... → 'equipment'
      return parts[parts.length - 2] || basename(p, '.ts').replace('.tsx', '');
    });

    const matchedFiles = changedFiles.filter((f) => {
      const lower = f.toLowerCase();
      // 발견 위치와 동일 모듈/파일명
      if (pattern.paths.some((p) => f.includes(p) || p.includes(f))) return true;
      // 동일 모듈 디렉토리
      if (patternModules.some((m) => m && lower.includes(m.toLowerCase()))) return true;
      return false;
    });

    // 방법 B: 키워드로 파일 패턴 직접 매핑
    const keywordFiles = changedFiles.filter((f) => {
      const lower = f.toLowerCase();
      if (pattern.keywords.includes('CAS') && /service|mutation|form/.test(lower)) return true;
      if (pattern.keywords.includes('TRANSACTION') && /service/.test(lower)) return true;
      if (pattern.keywords.includes('EVENT_CACHE') && /service|listener|cache/.test(lower)) return true;
      if (pattern.keywords.includes('AUTH_PERMISSION') && /controller|guard|service/.test(lower)) return true;
      return false;
    });

    const allMatchedFiles = [...new Set([...matchedFiles, ...keywordFiles])];

    if (allMatchedFiles.length > 0) {
      for (const kw of pattern.keywords.length > 0 ? pattern.keywords : ['GENERAL']) {
        if (!matched.has(kw)) {
          matched.set(kw, { pattern, matchedFiles: allMatchedFiles });
        }
      }
    }
  }

  return matched;
}

// ─── 5. CLAUDE.md 예외 항목 vs 변경 파일 교차 ────────────────────────────────

function matchExceptions(changedFiles, exceptions, totalLoc) {
  const found = [];
  for (const ex of exceptions) {
    if (/db.마이그레이션|db migration|마이그레이션/.test(ex)) {
      if (changedFiles.some((f) => /\/migrations\/|\.migration\.|drizzle|db:push|db:migrate/.test(f))) {
        found.push('DB 마이그레이션 파일 변경');
      }
    }
    if (/major dep|dep bump/.test(ex)) {
      if (changedFiles.some((f) => /package\.json|pnpm-lock/.test(f))) {
        found.push('의존성(package.json) 변경');
      }
    }
    if (/50\+|50 파일/.test(ex)) {
      if (changedFiles.length >= 50) {
        found.push(`50+ 파일 변경 (현재 ${changedFiles.length}개)`);
      }
    }
    if (/실험적/.test(ex)) {
      // 실험적 작업은 사용자가 명시하므로 자동 감지 불가
    }
  }
  return found;
}

// ─── 6. 비용 band 추정 ────────────────────────────────────────────────────────

function costBand(totalLoc) {
  if (totalLoc < 200) return '$5~$10 (small diff)';
  if (totalLoc < 500) return '$10~$15 (medium diff)';
  return '$15~$20 (large diff)';
}

// ─── 7. 트리비얼 변경 감지 ───────────────────────────────────────────────────

function isTrivial(changedFiles, totalLoc) {
  if (totalLoc > 50) return false;
  const trivialExtensions = changedFiles.every((f) =>
    /\.(md|txt|json)$/.test(f) ||
    f.startsWith('docs/') ||
    f.startsWith('.claude/') ||
    f.includes('seed-data'),
  );
  return trivialExtensions;
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

const { changedFiles, insertions, deletions, totalLoc, baseRef } = getGitDiff();
const exceptions = parseClaudeExceptions();
const highRiskPatterns = parseHighRiskPatterns();
const matchedCategories = matchCategories(changedFiles, highRiskPatterns);
const matchedExceptions = matchExceptions(changedFiles, exceptions, totalLoc);

const trivial = isTrivial(changedFiles, totalLoc);
const hasMatch = matchedCategories.size > 0 || matchedExceptions.length > 0;
const decision = (!trivial && hasMatch) ? 'Go' : 'No-Go';

const reasons = [];
for (const [category, { pattern, matchedFiles }] of matchedCategories) {
  reasons.push({
    category,
    pattern: pattern.name,
    matchedFiles: matchedFiles.slice(0, 3),
  });
}
for (const ex of matchedExceptions) {
  reasons.push({ category: 'EXCEPTION', pattern: ex, matchedFiles: [] });
}

const result = {
  decision,
  totalFiles: changedFiles.length,
  totalLoc,
  insertions,
  deletions,
  costEstimate: costBand(totalLoc),
  baseRef,
  reasons,
  trivialSkip: trivial,
  ssotParsed: {
    reviewLearningsPatterns: highRiskPatterns.length,
    claudeExceptions: exceptions.length,
  },
};

// ─── 출력 ─────────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} else if (HINT_MODE) {
  if (decision === 'Go') {
    const categories = reasons.map((r) => r.category).join(', ');
    process.stdout.write(
      `\n${CYAN}[ultrareview-advisor]${RESET} ${GREEN}Go${RESET}: category=${categories} (${costBand(totalLoc)})\n` +
      `  → 머지 직전 실행: ${CYAN}node scripts/ultrareview-preflight.mjs && /ultrareview <PR번호>${RESET}\n`,
    );
  } else {
    const reason = trivial ? '트리비얼 변경' : '고위험 패턴 없음';
    process.stdout.write(
      `${YELLOW}[ultrareview-advisor]${RESET} No-Go (${reason}) — /review 또는 verify-* 스킬로 충분\n`,
    );
  }
} else {
  log(`\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  log(`${CYAN}[ultrareview-advisor] 판정 결과${RESET}`);
  log(`${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);

  const decisionColor = decision === 'Go' ? GREEN : YELLOW;
  log(`  결정: ${decisionColor}${decision}${RESET}`);
  log(`  기준 브랜치: ${baseRef}`);
  log(`  변경 파일: ${changedFiles.length}개 (+${insertions}/-${deletions} LoC)`);
  log(`  비용 추정: ${costBand(totalLoc)}`);

  if (trivial) {
    log(`\n  ${YELLOW}트리비얼 변경 감지 → ultrareview 불필요${RESET}`);
    log(`  (docs/주석/seed 변경 또는 LoC < 50)`);
  }

  if (reasons.length > 0) {
    log(`\n  매칭된 고위험 카테고리:`);
    for (const r of reasons) {
      log(`  ${RED}●${RESET} [${r.category}] ${r.pattern}`);
      if (r.matchedFiles.length > 0) {
        for (const f of r.matchedFiles) log(`      ${f}`);
      }
    }
  } else if (!trivial) {
    log(`\n  ${YELLOW}고위험 패턴 매칭 없음 — /review + verify-* 스킬로 충분${RESET}`);
  }

  log(`\n  SSOT 파싱: review-learnings.md ${result.ssotParsed.reviewLearningsPatterns}개 패턴, CLAUDE.md ${result.ssotParsed.claudeExceptions}개 예외`);
  log(`  (상세: docs/references/ultrareview-usage.md)`);

  if (decision === 'Go') {
    log(`\n${GREEN}  실행 순서:${RESET}`);
    log(`  1. node scripts/ultrareview-preflight.mjs  # secret gate`);
    log(`  2. /ultrareview <PR번호>                   # 원격 fleet 리뷰 시작`);
    log(`  3. /tasks                                  # 5~10분 후 결과 확인`);
  }

  log(`${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);
}

// 항상 exit 0 — pre-push를 막지 않음
process.exit(0);
