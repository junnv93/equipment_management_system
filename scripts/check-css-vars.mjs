#!/usr/bin/env node
/**
 * check-css-vars.mjs — :root ↔ .dark brand CSS 변수 대칭 검증
 *
 * globals.css의 :root 블록에 정의된 --brand-* 변수가 .dark 블록에도 정의되어 있는지 확인.
 * brand 색상 추가 시 다크모드 선언 누락을 빌드 시점에 차단.
 *
 * 사용법:
 *   node scripts/check-css-vars.mjs
 *
 * 종료코드:
 *   0 — 대칭 OK
 *   1 — 불일치 감지
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const CSS_PATH = resolve(ROOT, 'apps/frontend/styles/globals.css');

// ── 파서 헬퍼 ────────────────────────────────────────────────────

/**
 * CSS 소스에서 특정 선택자 블록을 추출 (중첩 중괄호 처리)
 *
 * @param {string} source - 전체 CSS 소스
 * @param {RegExp} selectorPattern - 블록 시작 선택자 패턴
 * @returns {string[]} - 각 매칭 블록의 내용
 */
function extractBlockContents(source, selectorPattern) {
  const results = [];
  let match;
  const re = new RegExp(selectorPattern.source, 'g');

  while ((match = re.exec(source)) !== null) {
    const start = source.indexOf('{', match.index);
    if (start === -1) continue;

    let depth = 0;
    let i = start;
    while (i < source.length) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') {
        depth--;
        if (depth === 0) {
          results.push(source.slice(start + 1, i));
          break;
        }
      }
      i++;
    }
  }

  return results;
}

function extractBrandVars(blockContent) {
  const vars = new Set();
  const matches = blockContent.match(/--brand-[\w-]+(?=\s*:)/g) ?? [];
  for (const v of matches) vars.add(v);
  return vars;
}

// ── 실행 ────────────────────────────────────────────────────────

let source;
try {
  source = readFileSync(CSS_PATH, 'utf-8');
} catch {
  console.error(`❌ globals.css를 읽을 수 없습니다: ${CSS_PATH}`);
  process.exit(1);
}

const rootBlocks = extractBlockContents(source, /:root/);
const darkBlocks = extractBlockContents(source, /\.dark/);

const rootVars = new Set();
for (const block of rootBlocks) {
  for (const v of extractBrandVars(block)) rootVars.add(v);
}

const darkVars = new Set();
for (const block of darkBlocks) {
  for (const v of extractBrandVars(block)) darkVars.add(v);
}

if (rootVars.size === 0) {
  console.warn('⚠️  :root 블록에서 --brand-* 변수를 찾지 못했습니다. 파싱 스킵.');
  process.exit(0);
}

console.log(`:root brand 변수: ${rootVars.size}개`);
console.log(`.dark brand 변수: ${darkVars.size}개`);

const missingInDark = [...rootVars].filter((v) => !darkVars.has(v));
const missingInRoot = [...darkVars].filter((v) => !rootVars.has(v));

let failed = false;

if (missingInDark.length > 0) {
  console.error(`\n❌ .dark에 없는 brand 변수 (${missingInDark.length}개):`);
  missingInDark.forEach((v) => console.error(`  ${v}`));
  console.error('  → globals.css .dark 블록에 해당 변수를 추가하세요.');
  failed = true;
}

if (missingInRoot.length > 0) {
  console.error(`\n❌ :root에 없는 brand 변수 (${missingInRoot.length}개):`);
  missingInRoot.forEach((v) => console.error(`  ${v}`));
  console.error('  → globals.css :root 블록에 해당 변수를 추가하세요.');
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('\n✅ :root ↔ .dark brand 변수 대칭 OK');
process.exit(0);
