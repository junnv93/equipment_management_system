/**
 * verify-route-metadata spec — Node 내장 test runner.
 *
 * 실행: `node --test scripts/__tests__/verify-route-metadata.spec.mjs`
 *
 * fixture 격리: mkdtemp 에 미니 프론트엔드 트리를 만들고 --root 플래그로 스크립트 실행.
 * 실제 코드베이스 수정 없이 Step 8a/8b FAIL 케이스 검증.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(__dirname, '../../apps/frontend/scripts/verify-route-metadata.mjs');
const REPO_ROOT = resolve(__dirname, '../..');

/**
 * 미니 fixture frontend root 생성.
 *
 * @param {{ routes, koNavigation, enNavigation, pages? }} opts
 *   routes:  { [path]: { labelKey } }  — routeMap entries
 *   koNavigation: plain flat object — messages/ko/navigation.json
 *   enNavigation: plain flat object — messages/en/navigation.json
 *   pages: string[] — paths relative to app/ (e.g. '(dashboard)/equipment')
 *           that get a page.tsx written; root page.tsx always added
 */
function makeFixture({ routes = {}, koNavigation = {}, enNavigation = {}, pages = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'vrm-fixture-'));

  // root page.tsx (routeMap '/' 에 대응)
  mkdirSync(join(dir, 'app'), { recursive: true });
  writeFileSync(join(dir, 'app', 'page.tsx'), 'export default function Page() { return null; }\n');

  // additional page.tsx files
  for (const rel of pages) {
    const dir2 = join(dir, 'app', rel);
    mkdirSync(dir2, { recursive: true });
    writeFileSync(join(dir2, 'page.tsx'), 'export default function Page() { return null; }\n');
  }

  // route-metadata.ts
  mkdirSync(join(dir, 'lib', 'navigation'), { recursive: true });
  const entries = Object.entries(routes)
    .map(([p, m]) => `  '${p}': { labelKey: '${m.labelKey}' },`)
    .join('\n');
  writeFileSync(
    join(dir, 'lib', 'navigation', 'route-metadata.ts'),
    `export const routeMap = {\n${entries}\n};\n`
  );

  // navigation.json (ko + en)
  mkdirSync(join(dir, 'messages', 'ko'), { recursive: true });
  mkdirSync(join(dir, 'messages', 'en'), { recursive: true });
  writeFileSync(join(dir, 'messages', 'ko', 'navigation.json'), JSON.stringify(koNavigation));
  writeFileSync(join(dir, 'messages', 'en', 'navigation.json'), JSON.stringify(enNavigation));

  return dir;
}

function run(fixtureRoot) {
  const r = spawnSync('node', [SCRIPT, '--root', fixtureRoot], { encoding: 'utf8' });
  return { code: r.status ?? 1, stdout: r.stdout, stderr: r.stderr };
}

// ── Step 8a: labelKey → navigation.json ──────────────────────────────────────

describe('Step 8a — labelKey → navigation.json', () => {
  test('정상 fixture (ko + en 모두 있음) → PASS', () => {
    const dir = makeFixture({
      routes: {
        '/': { labelKey: 'navigation.dashboard' },
        '/equipment': { labelKey: 'navigation.equipment' },
      },
      koNavigation: { dashboard: '대시보드', equipment: '장비 관리' },
      enNavigation: { dashboard: 'Dashboard', equipment: 'Equipment' },
    });
    try {
      const r = run(dir);
      assert.equal(r.code, 0, `PASS 기대. stderr=${r.stderr}`);
      assert.match(r.stdout, /PASS/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('ko/navigation.json 에 labelKey 누락 → FAIL', () => {
    const dir = makeFixture({
      routes: {
        '/': { labelKey: 'navigation.dashboard' },
        '/equipment': { labelKey: 'navigation.equipment' },
      },
      koNavigation: { dashboard: '대시보드' }, // equipment 누락
      enNavigation: { dashboard: 'Dashboard', equipment: 'Equipment' },
    });
    try {
      const r = run(dir);
      assert.equal(r.code, 1, 'FAIL 기대');
      assert.match(r.stderr, /step-8a:ko/);
      assert.match(r.stderr, /equipment/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('en/navigation.json 에 labelKey 누락 → FAIL', () => {
    const dir = makeFixture({
      routes: {
        '/': { labelKey: 'navigation.dashboard' },
        '/equipment': { labelKey: 'navigation.equipment' },
      },
      koNavigation: { dashboard: '대시보드', equipment: '장비 관리' },
      enNavigation: { dashboard: 'Dashboard' }, // equipment 누락
    });
    try {
      const r = run(dir);
      assert.equal(r.code, 1, 'FAIL 기대');
      assert.match(r.stderr, /step-8a:en/);
      assert.match(r.stderr, /equipment/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── Step 8b: page.tsx → routeMap ─────────────────────────────────────────────

describe('Step 8b — page.tsx → routeMap', () => {
  test('page.tsx 가 routeMap 에 없으면 FAIL', () => {
    const dir = makeFixture({
      routes: {
        '/': { labelKey: 'navigation.dashboard' },
        // /equipment 는 routeMap 에 없음
      },
      koNavigation: { dashboard: '대시보드' },
      enNavigation: { dashboard: 'Dashboard' },
      pages: ['(dashboard)/equipment'], // page.tsx 존재
    });
    try {
      const r = run(dir);
      assert.equal(r.code, 1, 'FAIL 기대');
      assert.match(r.stderr, /step-8b/);
      assert.match(r.stderr, /\/equipment/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('page.tsx 가 routeMap 에 있으면 PASS', () => {
    const dir = makeFixture({
      routes: {
        '/': { labelKey: 'navigation.dashboard' },
        '/equipment': { labelKey: 'navigation.equipment' },
      },
      koNavigation: { dashboard: '대시보드', equipment: '장비 관리' },
      enNavigation: { dashboard: 'Dashboard', equipment: 'Equipment' },
      pages: ['(dashboard)/equipment'],
    });
    try {
      const r = run(dir);
      assert.equal(r.code, 0, `PASS 기대. stderr=${r.stderr}`);
      assert.match(r.stdout, /PASS/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('동적 라우트 page.tsx → routeMap PASS', () => {
    const dir = makeFixture({
      routes: {
        '/': { labelKey: 'navigation.dashboard' },
        '/equipment': { labelKey: 'navigation.equipment' },
        '/equipment/[id]': { labelKey: 'navigation.equipmentDetail' },
        '/equipment/[id]/edit': { labelKey: 'navigation.equipmentEdit' },
      },
      koNavigation: {
        dashboard: '대시보드',
        equipment: '장비',
        equipmentDetail: '상세',
        equipmentEdit: '편집',
      },
      enNavigation: {
        dashboard: 'Dashboard',
        equipment: 'Equipment',
        equipmentDetail: 'Detail',
        equipmentEdit: 'Edit',
      },
      pages: ['(dashboard)/equipment', '(dashboard)/equipment/[id]', '(dashboard)/equipment/[id]/edit'],
    });
    try {
      const r = run(dir);
      assert.equal(r.code, 0, `PASS 기대. stderr=${r.stderr}`);
      assert.match(r.stdout, /PASS/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── Integration: 실제 코드베이스 ─────────────────────────────────────────────

describe('Integration — 실제 코드베이스', () => {
  test('현재 코드베이스 전체 → PASS', () => {
    const r = spawnSync('node', [SCRIPT], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.equal(
      r.status,
      0,
      `실제 코드베이스 PASS 기대.\nstderr=${r.stderr}\nstdout=${r.stdout}`
    );
    assert.match(r.stdout, /PASS/);
  });
});
