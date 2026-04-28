# Evaluation — dev-server-hygiene

**Date**: 2026-04-28
**Evaluator**: QA agent (skeptical mode)
**Contract**: `.claude/contracts/dev-server-hygiene.md`

---

## Verdict

```
overall: FAIL
```

**Reason**: M4 and M10 fail on hook index mismatch (contract specifies `hooks[0]`, implementation places dev-doctor at `hooks[1]`). M2 and M9 fail on exit code specification mismatch (contract says "exit 0/1", implementation exits 2 for `fail` severity). Four MUST criteria fail.

---

## MUST criteria

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| M1 | dev-fresh.mjs dry-run works — zombie PID list + cache path reported | **PASS** | `node scripts/dev-fresh.mjs --dry-run` produced: zombie PGID 2개 (프로세스 4건) listed with pid/etime/friendly names + `apps/frontend/.next/dev` cache path reported. Exit 0. |
| M2 | dev-doctor.mjs — 진단 전용 (kill/clean 없음), ok/warn/fail 리포트, exit 0/1 | **FAIL** | Substantive criterion (no kill/clean) is met — grep for kill/rmSync/SIGTERM/SIGKILL in dev-doctor.mjs returns only a comment (line 6). However, **exit code spec fails**: contract states "exit 0/1" but implementation exits 0 (ok), 1 (warn), **2 (fail)**. Actual run exited 2 due to manifest-desync. The contract verification says `exit 0/1` — 2 is outside that range. |
| M3 | package.json에 `dev:fresh` + `dev:doctor` 스크립트 추가 | **PASS** | `jq -r '.scripts \| keys[] \| select(test("^dev:(fresh\|doctor)$"))' package.json` returns: `dev:doctor` + `dev:fresh`. Both scripts run `node scripts/dev-doctor.mjs` and `node scripts/dev-fresh.mjs` respectively. |
| M4 | SessionStart hook — 좀비 turbo/next/nest 카운트 + 경고만 (kill 금지) | **FAIL** | Contract verification command: `jq '.hooks.SessionStart[0].hooks[0].command' \| grep -E "turbo run dev\|nest start"` → **returns 0 matches**. `hooks[0]` is the pre-existing git-sync command. dev-doctor is placed at `hooks[1]`, not `hooks[0]`. Contract explicitly specifies `hooks[0]` in the verification path. The intent (zombie detection, no kill) IS achieved at `hooks[1]`, but the stated verification fails. |
| M5 | docs/references/dev-server-hygiene.md — 증상/원인/복구/예방 4섹션, ≥60줄 | **PASS** | `wc -l` = **147 lines** (≥60 ✓). Document has sections: 1. 증상, 2. 근본 원인, 3. 복구 절차, 4. 예방 — all four required sections present. |
| M6 | CLAUDE.md에 dev:fresh + dev-server-hygiene 링크 추가 | **PASS** | `grep -E "dev:fresh\|dev-server-hygiene" CLAUDE.md` returns 2 matches: (1) `pnpm dev:fresh # 좀비 정리 + .next/dev 클린 + dev 재기동` in Build section, (2) Dev Server Hygiene table row with doc link. |
| M7 | 하드코딩 금지: 포트 3000/3001 직접 숫자 0건 | **PASS** | `grep -nE "\b3000\b\|\b3001\b" scripts/dev-fresh.mjs scripts/dev-doctor.mjs` → **no output**. Port detection in dev-doctor.mjs uses `ss -tlnp` dynamically, matching against dev process PIDs — no hardcoded port numbers in either file. |
| M8 | node --check 양쪽 모두 exit 0 | **PASS** | `node --check scripts/dev-fresh.mjs && node --check scripts/dev-doctor.mjs` → exit 0. No syntax errors. |
| M9 | pnpm dev:doctor — 좀비/캐시 진단 정상 수행, exit 0 또는 1, JSON-구조화 출력 | **FAIL** | Diagnosis ran correctly and produced well-structured JSON (`{"level":"fail","issues":[...],"active":[...],"zombies":[...],"manifest":{...},"ports":[...]}` ✓). **Exit code fails spec**: contract says "exit 0 또는 1", actual exit was **2** (fail level due to manifest-desync). 2 is outside the stated "0 또는 1" range. |
| M10 | dev-doctor가 SessionStart hook SSOT 공유 — hook이 dev-doctor 호출 (인라인 중복 금지) | **FAIL** | Contract verification: `jq '.hooks.SessionStart[0].hooks[0].command' \| grep dev-doctor\|dev:doctor` → **0 matches**. `hooks[0]` is git-sync. `hooks[1]` IS the dev-doctor call (`node scripts/dev-doctor.mjs --json 2>/dev/null \| node -e ...`). Implementation is NOT inline duplicate (it calls dev-doctor correctly), but the contract verification path (`hooks[0]`) fails. |

---

## SHOULD criteria

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| S1 | dev-fresh — confirm 프롬프트 (--force 우회) | **PASS** | `confirm()` function (line 164) checks `FLAGS.force` first; `--force` and `-y` both bypass. TTY detection: non-TTY stdin auto-confirms. |
| S2 | dev-fresh — docker compose(DB/Redis) 보존 | **PASS** | dev-fresh.mjs only calls `killZombies` (PGID-based, matching DEV_PROCESS_SIGNATURES) and `cleanNextDevCache` (removes `.next/dev` only). No docker/compose references. Comment on line 17 explicitly states scope exclusion. |
| S3 | dev-doctor 출력 — 색상/마커 ok/warn/fail 구분 (TTY 감지) | **PASS** | `useColor()` checks `process.stdout.isTTY && !process.env.NO_COLOR`. ANSI codes applied to `[OK]`/`[WARN]`/`[FAIL]` tags and severity markers. Color-agnostic text labels also present for non-TTY. |
| S4 | dev-fresh -- `--no-restart` 플래그 | **PASS** | `FLAGS.noRestart = args.includes('--no-restart')` (line 38). Applied at line 255 to skip `startPnpmDev`. Also documented in file header (line 12). |
| S5 | hygiene 문서 — 매니페스트 desync 증거 체인 (app-paths-manifest.json 검사 방법) | **PASS** | Section 2.3 "증거 체인 검증 명령" contains two bash snippets: (1) zombie PGID count via ps, (2) manifest desync ratio check by reading `app-paths-manifest.json` and counting per-route manifests with `ratio=(reg/comp).toFixed(2)`. Threshold ≥ 0.5 documented. |

All 5 SHOULD criteria PASS.

---

## Architecture observations

### SSOT Import (dev-fresh ← dev-doctor)

**Confirmed**: `dev-fresh.mjs` line 27: `import { runDiagnosis, REPO_ROOT } from './dev-doctor.mjs';`. dev-fresh does NOT duplicate process detection logic — it calls `runDiagnosis()` from dev-doctor as SSOT. No inline zombie-detection code in dev-fresh. This is correctly implemented.

### Hook calling dev-doctor (no inline duplicate logic)

**Confirmed with caveat**: `hooks[1]` command calls `node scripts/dev-doctor.mjs --json` and pipes output to a small inline node -e parser (35 characters of JSON extraction logic). The inline parser only extracts `zombies.length`, `manifest.state`, and `pgids` for a one-line warning message — it does NOT duplicate the diagnostic logic itself. The SSOT call pattern is correct functionally. The failure is purely the index (`hooks[1]` vs `hooks[0]` as specified in the contract).

### Hardcoded values

None found. Port detection is fully dynamic via `ss -tlnp` + PID tree traversal. Process patterns are exported constants in dev-doctor.mjs (`DEV_PROCESS_SIGNATURES`, `MANIFEST_SYNC_THRESHOLD`, `NEXT_DEV_MANIFEST_PATH`).

### Exit code spec inconsistency (root cause of M2/M9 failures)

The contract M2 and M9 state "exit 0/1", but the implementation implements three exit codes: 0 (ok), 1 (warn), 2 (fail). The doc `dev-server-hygiene.md` Section 3.2 explicitly documents all three: "0=정상, 1=경고, 2=치명". This creates an internal inconsistency: **the documentation describes the correct 3-level exit behavior, but the contract spec was not updated to match**. The implementation (3-level) is objectively superior to the contract spec (2-level) because it allows callers to distinguish warn from fatal. However, grading against the stated contract, M2 and M9 fail.

### M4/M10 hook index mismatch

The contract was likely written when dev-doctor was planned as `hooks[0]`, but the implementation appended it as `hooks[1]` (after the existing git-sync hook at `hooks[0]`). This is an off-by-one error in implementation relative to the contract's verification path. The functional behavior is correct — dev-doctor IS invoked on SessionStart, it IS SSOT-shared — but the contract's verification commands fail because they query the wrong index.

### Risks not covered by contract

1. **`startPnpmDev` in non-TTY mode spawns detached**: When dev-fresh is piped (stdin not TTY), it auto-confirms AND spawns `pnpm dev` detached (`proc.unref()`). If invoked from a script, the user may not realize dev is now running detached in background with no visible output. Low risk in practice but worth noting.

2. **SIGTERM to PGID may hit unintended processes**: `process.kill(-pgid, 'SIGTERM')` sends to the entire process group. If a dev-adjacent process (e.g., a terminal emulator) happens to share the PGID (rare but possible in some setups), it would be terminated. The 5-second grace period mitigates this.

3. **Manifest desync detection may give false positives on cold start**: `compiled` count uses recursive walk of `.next/dev/server/app` counting `app-paths-manifest.json` files. On a freshly started dev server that has only compiled 3 routes, `ratio = 3/50` would trigger desync even though the server is still initializing. This is an inherent limitation of the detection heuristic, not unique to this implementation.

---

## Recommendations

1. **Fix M4/M10 (blocking)**: Either update the contract verification commands to reference `hooks[1]` (if git-sync is always `hooks[0]`), or restructure settings.json to place dev-doctor at `hooks[0]`. Contract must match implementation.

2. **Fix M2/M9 exit code spec (blocking)**: Update the contract to say "exit 0/1/2" matching the implementation and the hygiene doc. Three-level exit codes are correct and more useful — the contract description is simply stale.

3. **`startPnpmDev` non-TTY documentation (non-blocking)**: Add a note to `dev-server-hygiene.md` that `--force` in non-TTY mode spawns dev detached, directing users to check `ps` or logs.

4. **Cold-start false positive guard (non-blocking)**: Consider adding a `manifest.state === 'absent'` early exit or suppressing desync warning when the ratio is low AND fewer than N routes have been compiled, to avoid false alarms during initial server warmup.

---

# Re-Evaluation (after contract amendment)

**Date**: 2026-04-28 (rev 2)
**Trigger**: Contract amended to fix specification errors (M2/M9 exit codes 0/1/2 allowed; M4/M10 index-agnostic via `hooks[].command`).
**Implementation**: unchanged.

## Verdict

```
overall: PASS
```

**Reason**: With the amended contract, all 10 MUST criteria PASS. The four previously-failing criteria (M2, M4, M9, M10) were failing on contract spec mismatches (off-by-one hook index; missing exit code 2 in spec). Now that the contract reflects the implementation+documentation reality, no MUST criterion fails. All 5 SHOULD criteria continue to PASS.

## MUST criteria (re-run with amended contract)

| ID | Criterion (amended) | Result | Evidence |
|----|---------------------|--------|----------|
| M1 | dev-fresh.mjs --dry-run lists target PIDs + cache path | **PASS** | Output: `좀비 PGID 2개 (프로세스 4건)` listed with `pgid=54587 pid=54943 turbo run dev (etime=54:10)` etc. + `Next.js dev 캐시: apps/frontend/.next/dev (매니페스트 desync)`. Exit 0. |
| M2 | dev-doctor: 진단 전용, kill/clean 없음, ok/warn/fail 리포트, **exit 0/1/2** (POSIX 3-level) | **PASS** | No kill/rmSync/SIGTERM/SIGKILL in dev-doctor.mjs (only a doc comment on line 6). Output produced `[FAIL] dev-doctor — overall: fail` + active/zombies/manifest/ports sections + WARN/FAIL issue tags. Exit 2 (fail level) — now within allowed `0/1/2` range per amended spec. |
| M3 | package.json `dev:fresh` + `dev:doctor` 스크립트 ≥ 2 | **PASS** | `jq -r '.scripts \| keys[]' package.json \| grep -E '^dev:(fresh\|doctor)$' \| wc -l` → **2**. |
| M4 | SessionStart hook — turbo/next/nest 카운트 + 경고만, **인덱스 무관**, dev-doctor 호출 매칭 ≥ 1 | **PASS** | `jq -r '.hooks.SessionStart[0].hooks[].command' .claude/settings.json \| grep -c "dev-doctor\|dev:doctor"` → **1** (≥ 1 ✓). dev-doctor invocation present at `hooks[1]` (git-sync at `hooks[0]` preserved as priority hook per amended contract). No inline kill logic. |
| M5 | dev-server-hygiene.md ≥ 60줄, 4섹션 | **PASS** | `wc -l` = **147** lines. Sections 1.증상 / 2.근본 원인 / 3.복구 절차 / 4.예방 all present. |
| M6 | CLAUDE.md에 dev:fresh + dev-server-hygiene 링크 ≥ 2 매칭 | **PASS** | `grep -cE "dev:fresh\|dev-server-hygiene" CLAUDE.md` → **2**: Build/Lint/Test 섹션 `pnpm dev:fresh` 라인 + Deep-Dive References 테이블 row. |
| M7 | 포트 3000/3001 직접 숫자 0건 | **PASS** | `grep -nE "\b3000\b\|\b3001\b" scripts/dev-fresh.mjs scripts/dev-doctor.mjs` → no output (exit 1, 매칭 없음). 포트 탐지는 `ss -tlnp` + PID tree로 완전 동적. |
| M8 | `node --check` 양쪽 통과 | **PASS** | `node --check scripts/dev-fresh.mjs && node --check scripts/dev-doctor.mjs && echo OK` → exit 0, "M8=PASS". |
| M9 | dev-doctor 실행 → 진단 정상 + **exit 0/1/2** + JSON-구조화 출력 | **PASS** | `--json` 출력 첫 200바이트: `{"level":"fail","issues":[{"severity":"warn","kind":"zombie-process","message":"4개의 좀비 dev 프로세스 발견 ...` — 유효 JSON, 구조화 정상. Exit 2 (fail level) — 이제 amended contract `0/1/2`에 부합. |
| M10 | dev-doctor SSOT 공유 — hook이 dev-doctor 호출, **인덱스 무관** ≥ 1 | **PASS** | `jq -r '.hooks.SessionStart[0].hooks[].command' \| grep -c "dev-doctor\|dev:doctor"` → **1** (≥ 1 ✓). hook command: `node scripts/dev-doctor.mjs --json 2>/dev/null \| node -e '...JSON 파싱 35자...'` — 진단 본체로직은 dev-doctor가 100% 담당, hook의 inline 코드는 출력 1줄 가공만. SSOT 공유 정상. |

**MUST 결과: 10/10 PASS**

## SHOULD criteria (unchanged from rev 1)

| ID | Result |
|----|--------|
| S1 | PASS — `--force`/`-y` flag bypasses confirm; non-TTY auto-confirms |
| S2 | PASS — docker compose 컨테이너 미터치 (코드 + 코멘트로 명시) |
| S3 | PASS — `useColor()` TTY 감지 + ANSI [OK]/[WARN]/[FAIL] 마커 |
| S4 | PASS — `--no-restart` 플래그 구현 (line 38, 255) |
| S5 | PASS — 문서 Section 2.3 매니페스트 desync 증거 체인 명령 포함 |

**SHOULD 결과: 5/5 PASS**

## Architecture observations (unchanged, recap)

- `dev-fresh.mjs` imports `runDiagnosis` and `REPO_ROOT` from `dev-doctor.mjs` (line 27) — SSOT 공유 정상, 진단 로직 중복 없음.
- SessionStart hook는 `node scripts/dev-doctor.mjs --json`을 호출하고 출력 JSON을 파싱하여 1줄 경고를 생성 — kill/clean 액션 없음, 진단 결과 표시만.
- 코드에 하드코딩된 포트 없음 — `ss -tlnp` + dev process tree 매칭으로 동적 발견.

## Final Recommendations (non-blocking)

1. (Carried over) `startPnpmDev` 비-TTY 시 detached spawn 동작을 `dev-server-hygiene.md`에 명시 권장.
2. (Carried over) 매니페스트 cold-start false positive 방지를 위한 최소 컴파일 라우트 임계값 도입 검토.

These are non-blocking enhancements; the contract is satisfied.
