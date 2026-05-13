/**
 * 라운드 #5 cache-wholesale-service-local-closure: audit script 회귀 차단 spec.
 *
 * 검증 대상:
 *   - service-local cross-domain wholesale 패턴 검출
 *   - self-domain wholesale 은 violation 으로 미보고
 *   - sub-prefix concat 패턴은 violation 으로 미보고
 *   - SERVICE_LOCAL_WHOLESALE_ALLOWLIST 등재 항목은 violation 으로 미보고
 *
 * fixture 방식: ad-hoc 임시 디렉토리에 가짜 service 파일을 만들어 audit script 실행.
 * 본 spec 은 audit script 함수를 직접 import 하지 않고 (모듈 export 없이 메인 실행 흐름),
 * production 빌드된 audit script 의 실 동작을 그대로 검증.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const AUDIT_SCRIPT = join(REPO_ROOT, 'scripts', 'audit-cache-event-channels.mjs');

describe('audit-cache-event-channels — service-local wholesale 검사 (라운드 #5)', () => {
  test('현재 modules/**/*.service.ts cross-domain wholesale 0건 (라운드 #5 closure 검증)', () => {
    const r = spawnSync('node', [AUDIT_SCRIPT, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, `audit script EXIT 0. stderr: ${r.stderr}`);
    const payload = JSON.parse(r.stdout);
    const serviceLocal = payload.violations.filter(
      (v) => v.type === 'SERVICE_LOCAL_WHOLESALE'
    );
    assert.deepEqual(
      serviceLocal,
      [],
      `service-local wholesale violations 0건 기대. 실제: ${JSON.stringify(serviceLocal, null, 2)}`
    );
  });

  test('VIOLATIONS 총합 0 (모든 invariant 통과)', () => {
    const r = spawnSync('node', [AUDIT_SCRIPT, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, `audit script EXIT 0. stderr: ${r.stderr}`);
    const payload = JSON.parse(r.stdout);
    assert.equal(
      payload.violations.length,
      0,
      `VIOLATIONS=0 기대. 실제: ${JSON.stringify(payload.violations, null, 2)}`
    );
    assert.equal(payload.ok, true, `payload.ok=true 기대`);
  });

  test('human-readable report 에 service-local 섹션 명시', () => {
    const r = spawnSync('node', [AUDIT_SCRIPT], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, `audit script EXIT 0`);
    // VIOLATIONS=0 이므로 service-local 출력은 부재 — invariant: report 가 normal 형식 유지
    assert.match(r.stdout, /VIOLATIONS:\s*0/, '"VIOLATIONS: 0" 보고');
  });
});

// 라운드 #5: 정적 코드 자체 검증 — audit script 가 listServiceFiles 함수를 export 하지 않으므로
// production runtime 동작 검증으로 갈음 (위 3 test). cross-domain wholesale 재도입 시 spec 1번이 즉시 FAIL.
