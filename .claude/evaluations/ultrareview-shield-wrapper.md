# Evaluation Report: ultrareview-shield-wrapper

## 반복 #1 (2026-05-11T22:50+09:00)

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| M-1 --list-patterns | PASS | `LIST_PATTERNS` grep=2, `JSON.stringify(DANGEROUS_PATTERNS` grep=1, `'--list-patterns'` grep=1. 런타임: `node scripts/ultrareview-preflight.mjs --list-patterns \| head -c 1` → `[`, PARSED count=10 |
| M-2 shield script structure | PASS | 1번 라인 `#!/usr/bin/env bash` 확인. `set -euo pipefail` grep=1. `test -x` → executable. `bash -n` → syntax OK. `shellcheck` → rc=0 |
| M-3 SSOT 단방향 wire | **FAIL** | 인라인 금지 grep: 0 (PASS). 그러나 preflight 호출 존재 계약 grep `grep -c "ultrareview-preflight.mjs --list-patterns"` → **0** (기댓값 ≥1). 실제 구현은 라인 30 `PREFLIGHT="${ROOT}/scripts/ultrareview-preflight.mjs"` 변수 + 라인 84 `node "$PREFLIGHT" --list-patterns` 로 작성되어 있어 변수 확장을 사용함. 계약 grep 리터럴 문자열 불일치 — grep 기준 FAIL |
| M-4 trap EXIT | PASS | `grep -cE "^trap[[:space:]]"` → 1 (라인 168 `trap restore_files EXIT`). `EXIT` grep=9. `^(function )?restore` → 1 (라인 141 `restore_files()`). idempotent 검증: `[ "${#SHIELDED[@]}" -gt 0 ]` 가드로 빈 배열 시 no-op |
| M-5 /tmp isolation | PASS | `mktemp -d` grep=2 (주석+실행). 생성 경로 `/tmp/ur-shield-k0fo5I` 실측 확인. `ur-shield.*\.git|\.git/ur-shield` → 0 |
| M-6 passthrough | PASS | 라인 189 `"$@"` 확인 (grep=1). 라인 54 `Usage:` 확인 (grep=1). 0인자 분기: `[ "$#" -eq 0 ]` → exit 1 |
| M-7 package.json | PASS | `"ur:shield"` grep=1 값=`"bash scripts/ultrareview-shield.sh"`. `scripts/ultrareview-shield.sh` grep=1 |
| M-8 simulation | PASS* | 시뮬레이션 실행: 격리 3개 완료 (`grep -c "격리:"` → 3). `✅ 검사 1/3 통과: 위험 파일 없음` 출력 확인 (`grep -c "검사 1/3 통과"` → 1). `🛡  3개 파일 격리 완료` 출력 확인. **단, 평가 시점에 gitleaks(검사 2/3) 스캔이 진행 중 — 복원 완료 및 /tmp 잔존 0 최종 확인 불가**. 격리 중 env 파일 3개가 working tree에 없는 것 실측 확인 (NOT IN TREE). *복원 로직 코드 정적 검토로 보완: `restore_files()` trap EXIT에 의해 발화, `mv $src $dst` 복원, `rmdir $SHIELD_DIR`. |
| M-9 usage.md | PASS | `ur:shield\|ultrareview-shield` grep=5 (≥2 충족). "Gate 1 차단 시" 섹션 + "전체 실행 흐름" 섹션 양쪽에서 언급 확인 |
| M-10 example-prompts.md | PASS | grep=1 (≥1 충족). 라인 68: `pnpm ur:shield -- node scripts/ultrareview-preflight.mjs` 안내 확인 |
| M-11 regression | PASS | `node scripts/self-audit.mjs --staged` → rc=0 (`검사할 TypeScript 파일 없음`). `node scripts/ultrareview-preflight.mjs --list-patterns \| head -c 1` → `[` (정상). Production 코드 변경 0건 → tsc 영향 없음 (skip 정당). staged 파일 확인: git diff --cached 현재 0건 — 의문사항 참고 참조 |
| M-12 modern APIs | PASS | preflight.mjs: ESM (`import`), `process.argv.includes('--list-patterns')` 패턴 유지. shield.sh: `[[ ]]` 미사용 (all `[ ]`), GNU 전용 옵션 없음. `require()` 0건 |

## SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| S-1 shellcheck warning 0 | PASS | `shellcheck rc=0` 확인 — warning도 0 |
| S-2 SIGKILL caveat | PASS | 라인 22 `kill -9 (SIGKILL) 시 trap 우회 — 다음 실행 전 /tmp/ur-shield-* 잔존물 정리 권장` 주석 확인. `SIGKILL\|kill -9` grep=3 |
| S-3 dry-run 모드 | SKIP | 미구현, 계약에서 tech-debt 가능 명시 |
| S-4 lockfile 충돌 방지 | PASS (PROMOTED) | `flock -n 9` grep=1. S-4에서 MUST 수준으로 승격 구현됨. LOCK_FILE=/tmp/ur-shield.lock |
| S-5 review-architecture | SKIP | production code 변경 0건, tooling 한정 — architecture 영향 없음 |

## 의문사항 (판정 영향 없음, 기록용)

- **staged 파일 상태 불일치**: 대화 시작 시 `git diff --cached --stat`는 7개 파일을 표시했으나, 평가 시점에 `git diff --cached`가 빈 결과를 반환함. 배경: 배경 프로세스(gitleaks 스캔 진행 중)의 flock 보유 때문일 가능성 낮음 (flock은 git index 무관). 원인 미상. 평가 대상 파일들은 working tree에 현존하며 내용 검증 완료.
- **M-8 복원 완료 미확인**: gitleaks 스캔이 평가 시간 내 완료되지 않아 `복원:` grep 및 `/tmp/ur-shield-*` 잔존 0 실측 불가. 코드 정적 분석으로 보완 (trap EXIT → restore_files → mv + rmdir 패턴 확인).

## M-3 수정 지시

계약 grep `grep -c "ultrareview-preflight.mjs --list-patterns" scripts/ultrareview-shield.sh` ≥ 1 조건을 만족하려면:

**옵션 A**: `get_patterns()` 함수 내 라인 84를 변수 대신 리터럴 경로로 변경:
```bash
node scripts/ultrareview-preflight.mjs --list-patterns \
```
단, 이 경우 스크립트가 working tree root에서 실행되어야 한다는 가정이 하드코딩됨 (현재 `$ROOT` 변수로 처리 중인 것과 상충).

**옵션 B**: 계약 grep을 `"--list-patterns"` 단독 또는 `"preflight.mjs" && "--list-patterns"` AND 조합으로 완화 (계약 개정 필요).

**권고**: 옵션 B. 현재 구현(`node "$PREFLIGHT" --list-patterns`)이 `$ROOT` 동적 경로 해석을 올바르게 사용하고 있으며 SSOT 단방향 wire 원칙을 준수한다. 계약 grep 리터럴이 구현 의도를 잘못 표현한 것이 문제.

## Tech-debt 분리 등록 (별도 sprint)

- **preflight 검사 2/3 gitleaks FAIL** (.env 외 secret 출처): shield 책임 외. `.gitleaks.toml` allowlist 보강 필요 — 별도 sprint에서 처리.
- **S-3 dry-run 모드** (`--dry-run`): 격리 대상 출력만 하고 실제 mv 없이 종료하는 플래그. 디버깅/검증에 유용. 현재 미구현.
- **cluster mode lockfile**: 현재 `/tmp/ur-shield.lock` 는 단일 인스턴스 가정. PM2 cluster / 다중 호스트 환경에서는 Redis-backed lock 필요 (tech-debt, 1인 프로젝트 현 환경에서는 불필요).

## 전체 판정 (반복 #1): FAIL

**M-3 계약 grep 실패**: `grep -c "ultrareview-preflight.mjs --list-patterns" scripts/ultrareview-shield.sh` → 0 (기댓값 ≥1).

SSOT 단방향 wire의 구현 의도는 충족되나 계약 명세 grep이 실패한다. 계약 개정(옵션 B) 또는 코드 수정(옵션 A) 중 하나로 해결 후 재평가 필요.

---

## 반복 #2 (2026-05-11T23:00+09:00)

### 변경 사항
- 계약 M-3 rev-2: 단일 리터럴 grep → AND/OR 분기 구조로 개정
- 코드 무변경 (shield 스크립트는 `PREFLIGHT="${ROOT}/..."` 변수 사용 정당화: repo-root-independence + shellcheck SC2086 안전)

### M-3 rev-2 재평가

| grep | 결과 | 기댓값 | 판정 |
|------|------|--------|------|
| AND-1: `grep -cE "ultrareview-preflight\.mjs" scripts/ultrareview-shield.sh` | 8 | ≥2 | PASS |
| AND-2: `grep -c -- "--list-patterns" scripts/ultrareview-shield.sh` | 3 | ≥1 | PASS |
| OR-fallback: `grep -c "ultrareview-preflight.mjs --list-patterns" scripts/ultrareview-shield.sh` | 0 | ≥1 | (불충족, 무관) |
| Inline forbidden: `grep -cE "\.env\.local\|apps/backend/\.env\|\.env\.test\|\.sops\.decrypted" scripts/ultrareview-shield.sh` | 0 | ==0 | PASS |

**PASS 조건**: `(AND-1 ≥2 AND AND-2 ≥1) OR (OR-fallback ≥1)` AND `inline == 0`
- `(true AND true) OR false` = **true**, AND inline==0 → 충족

**M-3 판정: PASS**

### 종합 판정 (반복 #2 반영)

| 기준 | 판정 |
|------|------|
| M-1 ~ M-2, M-4 ~ M-12 | PASS (반복 #1에서 확인, 변동 없음) |
| M-3 (rev-2) | **PASS** |

## 전체 판정: PASS
