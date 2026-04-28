# Evaluation Report — deps-supply-chain-hardening

## Iteration: 1
## Verdict: FAIL
## Evaluator: QA Agent (Step 5, Mode 2 harness)
## Evaluated At: 2026-04-28

---

## MUST Results

| ID | 기준 | 결과 | 근거 |
|----|------|------|------|
| M1 | Dependabot 4건 → 0건 OR 명시적 suppression with justification | **FAIL** | `gh api .../dependabot/alerts?state=open` → #200, #201, #203 open (dismiss 없음). #202만 dismissed. audit:dependabot: REAL=0, FALSE_POSITIVE=2, STALE_MANIFEST=1. 그러나 contract 검증 명령 "결과 []" 미달 — 3건 open 상태 유지 |
| M2 | root package.json overrides `>=` 패턴 0건 | PASS | node -e 검증 결과 `PASS`. 모든 overrides가 `^x.y.z` 형식 |
| M3 | backend src `from 'uuid'` 0건 | PASS | `grep -rn "from ['\"]uuid['\"]" apps/backend/src/` 0 hits. coverage HTML 잔존본은 src/ 외 |
| M4 | pnpm tsc --noEmit exit 0 | PASS | exit=0 확인 |
| M5 | pnpm --filter backend run test:cov PASS, coverage threshold 미하락 | PASS | 74 suites 961 tests all pass, exit 0. (주의: collectCoverageFrom 경로 mismatch로 All files 0% 표시 — 기존 설정 동일, threshold 미달 FAIL 없음) |
| M6 | pnpm --filter frontend run test PASS | PASS | 19 suites 262 tests all pass |
| M7 | backend build 성공 + dist require IdentifierService | PASS | `nest build` exit 0. `node -e require(dist/common/identifiers/identifier.service)` → IdentifierService typeof function, "OK" 출력 |
| M8 | pnpm --filter frontend run build 성공 | PASS | exit 0 확인 |
| M9 | preinstall guard >= 잔존 시 exit 1 차단 | PASS | 실측: postcss `>=8.5.10` 주입 후 `node ./scripts/check-dependabot-drift.mjs` exit **1** 확인. 에러 메시지 명확. (첫 시뮬레이션에서 `cp` 명령이 마지막 실행돼 `$?=0`으로 오판했으나 직접 재확인 결과 guard exit=1) |
| M10 | verify-ssot Step 44 / verify-security / verify-hardcoding PASS | PASS | Step 44 검사 1~3 모두 PASS. CSPRNG(node:crypto.randomUUID) 사용 확인. 도메인 prefix 인라인 0건 확인 |
| M11 | pre-push hook 시뮬레이션 전체 exit 0 | PASS | M4(tsc)+M5(backend test)+M6(frontend test) 전체 exit 0. pre-push hook 동일 명령 구성 확인 |
| M12 | lockfile 변경 라인 수 ≤ 400 lines | **FAIL** | `git diff pnpm-lock.yaml \| wc -l` = **698** (> 400 기준). 순수 변경은 +165 -170 = 335줄이나 contract 검증 명령은 전체 diff 줄수 기준이므로 FAIL |

---

## SHOULD Results

| ID | 기준 | 결과 | 비고 |
|----|------|------|------|
| S1 | verify-ssot SKILL.md Step 44 본문 존재 | PASS | line 1321: `### Step 44: Supply-Chain SSOT ...` 존재. 검사 1/2/3 + why 설명 포함. manage-skills + skills-index 갱신 확인 |
| S2 | drift guard 검사 2 (gh 호출) 구현 | PASS | `gh api repos/{owner}/{repo}/dependabot/alerts` best-effort 구현. graceful skip on gh unavailability |
| S3 | bundle-size baseline 갱신 | SKIP | backend 위주 작업, frontend bundle 무관 (phase D postcss는 devDep). tech-debt-tracker 기록 권장 |
| S4 | review-architecture Critical 이슈 0개 | PASS | 아키텍처 관점 Critical 이슈 없음 (Step 5 Architectural Concerns 섹션 참조) |
| S5 | identifier.service.spec.ts ≥ 5 케이스 | PASS | 6개 케이스 확인: generateAttachmentId 36자/v4/1000회중복, generateMigrationBatchId v4, generateOpaqueId no-prefix/prefix/empty |
| S6 | NestJS Global 등록 — feature module imports 변경 없이 주입 | PASS | `@Global()` identifier.module.ts line 10. app.module.ts line 68에 IdentifierModule import. file-upload/data-migration 모듈 imports 수정 불필요 확인 |
| S7 | 의사결정 로그 7건 | PASS | exec-plan 의사결정 로그 1~7번 모두 존재. commit/PR 본문 첨부는 커밋 전이라 N/A |

---

## Domain Results

| ID | 기준 | 결과 | 근거 |
|----|------|------|------|
| D1 | file-upload 파일 키 `{subdir}/{36자-v4-uuid}{ext}` 호환 | PASS | identifiers.generateAttachmentId() → randomUUID() → 36자 RFC 4122 v4. 기존 형식 동일 |
| D2 | data-migration batch ID 호환 | PASS | `generateMigrationBatchId()` → randomUUID(). 기존 uuidv4() 출력 형식 동일. spec mock 확인 |
| D3 | ESM/CJS 호환성 — dist require 정상 | PASS | M7에서 node -e require(dist/.../identifier.service) → OK |
| D4 | Phase A~G 원자적 커밋 단위 | **FAIL** | 모든 변경이 uncommitted dirty 상태. Phase별 커밋 분리 없음. exec-plan "Phase A~G 각 1커밋 권장" 미이행 |

---

## Critical Issues (FAIL 항목 상세)

### Issue 1 — M1: Dependabot #200, #201, #203 open (미해결 또는 미dismissed)

**파일:라인:** `apps/backend/package.json` (uuid 제거 완료), `pnpm-lock.yaml` (override ^11.0.0 적용), `package.json` (postcss ^8.5.10, fast-xml-parser ^5.7.0 추가)

**문제 설명:**
- 실제로 취약 버전은 설치되지 않음 (REAL=0). 그러나 GitHub Dependabot은 아직 재스캔하지 않아 3건이 open 상태 유지.
- #200 (uuid): `apps/backend/package.json`이 manifest로 기록됨. backend/package.json에서 uuid 제거됐으나 Dependabot 미갱신 → STALE_MANIFEST.
- #201 (fast-xml-parser): lockfile에 5.7.2 설치됨 (취약범위 < 5.7.0 벗어남) → FALSE_POSITIVE지만 GitHub open.
- #203 (postcss): lockfile에 8.5.12 설치됨 (취약범위 < 8.5.10 벗어남) → FALSE_POSITIVE지만 GitHub open.
- contract 검증 조건: "gh api .../dependabot/alerts?state=open 결과 []" — 3건 미달.

**코드 수준 수정 지시:**
두 가지 옵션 중 하나 선택:
- (A) 변경사항 commit + push → GitHub Dependabot 자동 재스캔 대기 → #200/#201/#203 자동 close 예상.
- (B) 즉시 dismiss: `gh api -X PATCH repos/{owner}/{repo}/dependabot/alerts/200 -f state=dismissed -f dismissed_reason=tolerable_risk -f dismissed_comment="uuid removed from backend/package.json; transitive via pnpm.overrides ^11.0.0. CVE is buf-param-only for v3/v5/v6, not v4."` (동일 패턴으로 #201, #203 처리)

**검증 명령 4종:**
```bash
# 1) dismiss 후 확인
gh api 'repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=20' --jq '[.[] | {number, state}]'
# 기대: []

# 2) audit:dependabot REAL=0 확인
pnpm audit:dependabot 2>&1 | grep "Totals:"
# 기대: REAL=0

# 3) #200 상태 확인
gh api 'repos/{owner}/{repo}/dependabot/alerts/200' --jq '{state, dismissed_reason}'
# 기대: dismissed

# 4) 전체 open 건수
gh api 'repos/{owner}/{repo}/dependabot/alerts?state=open' --jq 'length'
# 기대: 0
```

---

### Issue 2 — M12: lockfile diff 698줄 > 400줄 임계값

**파일:라인:** `pnpm-lock.yaml` (전체)

**문제 설명:**
`git diff pnpm-lock.yaml | wc -l` = 698. contract 기준 ≤ 400.
순수 변경 라인(+165 -170 = 335)은 임계값 이하지만, contract 검증 명령(`wc -l`)은 context 라인 포함 전체 diff 줄수를 측정하므로 698이 측정값.
698이 > 400인 이유 분석: overrides 9건(Phase E) + uuid 제거(Phase C) + postcss/fast-xml(Phase D) + 관련 lockfile entries 변동이 context 3줄/hunk × 다수 hunk = 총 698줄.
exec-plan 위험 대응 방침("lockfile diff > 400 → 1건씩 분리 커밋")이 미이행됨.

**코드 수준 수정 지시:**
Phase별 분리 커밋이 이미 이 시점에서는 불가 (모든 변경이 한 세트로 묶임). 두 가지 선택:
- (A) contract M12 기준 재협상: `git diff --unified=0 pnpm-lock.yaml | wc -l`로 변경 (context=0이면 +165-170+헤더 ≈ 340 < 400). 실질적 의미가 이 숫자에 가까움.
- (B) 현재 상태 그대로 문서화 후 PASS 판단 예외 처리 — "Phase E overrides caret 9건 전환이 lockfile context를 부풀림, 순수 변경 335줄"을 exec-plan 위험 로그에 기록.

**검증 명령 4종:**
```bash
# 1) context=0 기준 측정
git diff --unified=0 pnpm-lock.yaml | wc -l
# 기대: ~340 (< 400)

# 2) 실제 변경 줄 수
git diff pnpm-lock.yaml | grep "^[+-]" | grep -v "^---\|^+++" | wc -l
# 기대: ~335

# 3) 어떤 패키지가 변경됐는지
git diff pnpm-lock.yaml | grep "^@@" | wc -l
# hunk 수 확인

# 4) Phase E overrides 변경만 확인
git diff pnpm-lock.yaml | grep "overrides" | head -20
```

---

### Issue 3 — D4: Phase A~G 원자적 커밋 분리 없음

**파일:라인:** git working tree 전체

**문제 설명:**
exec-plan에서 "Phase A~G 각 Phase가 원자적 커밋 단위 — 각 Phase 단독 revert 가능"을 명시했으나, 현재 모든 변경이 uncommitted dirty 상태. 단일 dirty blob으로 관리 중이어서 Phase별 독립 revert 불가.

**코드 수준 수정 지시:**
현재 시점에서는 전체를 하나 또는 2~3개 논리 커밋으로 분리해 커밋:
- 커밋 1: `feat(identifiers): ID 생성 SSOT IdentifierModule 신설 (Phase A+B)` — identifier.service.ts + module.ts + spec.ts + file-upload + data-migration + app.module.ts + backend/package.json
- 커밋 2: `chore(deps): pnpm.overrides caret 통일 + postcss/uuid 패치 (Phase C+D+E)` — root/package.json + pnpm-lock.yaml
- 커밋 3: `feat(scripts): preinstall drift guard (Phase F)` — scripts/check-dependabot-drift.mjs + preinstall script
- 커밋 4: `chore(skills): verify-ssot Step 44 supply-chain 추가 (Phase G)` — SKILL.md + manage-skills + skills-index

**검증 명령 4종:**
```bash
# 커밋 후 확인
git log --oneline -7
# 기대: 4개 커밋 로그

# Phase별 독립성 확인
git show HEAD~3 --stat | head -10  # Phase A+B 내용만

# revert 가능성 확인 (dry-run)
git revert --no-commit HEAD~1  # Phase G만 revert 시뮬레이션
git checkout -q HEAD -- .     # 복원

# pre-push 통과 확인
pnpm tsc --noEmit && pnpm --filter backend run test --silent --passWithNoTests && pnpm --filter frontend run test --silent --passWithNoTests
```

---

## Architectural Concerns (Mode 2 review-architecture 수준)

### A1. coverage 수집 경로 mismatch (기존 버그 — 본 작업과 무관하나 발견)
`apps/backend/package.json` jest 설정: `rootDir: "src"` + `collectCoverageFrom: ["src/**/*.ts"]`.
`rootDir`이 `src`이면 `collectCoverageFrom`의 `src/**/*.ts`는 실제 경로 `{rootDir}/src/**` = `apps/backend/src/src/**`를 탐색하여 0건 매칭. 결과: "All files 0%" (커버리지 표시 없음). 임계값 check가 0건에 대해 pass되므로 test:cov exit 0은 정상이지만 커버리지 측정 자체가 무의미. **본 작업 범위 외 기존 tech-debt 항목.**

### A2. uuid pnpm.overrides v11 + GitHub Dependabot #200 gap
`pnpm.overrides: "uuid": "^11.0.0"` 설정으로 lockfile에는 uuid@11.1.0만 존재. 그러나 GitHub Dependabot alert #200이 `apps/backend/package.json`을 manifest로 가리키고 있어, push/재스캔 전까지 STALE_MANIFEST로 오분류됨. push 후 Dependabot이 재스캔하면 자동 close 예상.

### A3. check-dependabot-drift.mjs 검사 2 gh API endpoint
Line 104: `repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=50`. `{owner}/{repo}`는 gh CLI가 자동 치환하는 placeholder. 로컬 환경에서 동작 확인됨. CI에서는 `GITHUB_REPOSITORY` env 사용 필요 — 현재 스크립트에 `GH_TOKEN` 또는 `GITHUB_REPOSITORY` 처리 없음. `tryGh`가 catch-all로 실패 시 skip 처리하므로 false negative 발생 가능 (경고 출력 안됨). 검사 2는 exit 0만이므로 install 차단 위험 없음 — S4 위험 낮음.

### A4. data-migration.service.ts IdentifierService 주입 패턴 확인
`data-migration.service.ts:104`: `private readonly identifiers: IdentifierService` 주입 확인. `@Global()` 모듈이라 DataMigrationModule에 IdentifierModule imports 추가 불필요 — S6 기준 충족.

---

## 다음 액션

**FAIL 항목 2건 (M1, M12) + Domain 1건 (D4) 수정 지시:**

### 즉시 조치 가능 (Generator 단독)
1. **M1 해결 옵션**: #200/#201/#203 dismiss (justification 포함) 또는 commit+push 후 Dependabot 재스캔 대기.
   - 권장: dismiss API 즉시 호출 (push 전에 처리 가능)
   - `gh api -X PATCH repos/{owner}/{repo}/dependabot/alerts/{200,201,203}` 각각 호출

2. **D4 해결**: Phase별 커밋 분리 후 commit. 최소 3~4개 논리 커밋으로 분리.

### M12 처리
- M12는 contract 검증 명령(`wc -l` 전체 줄)과 실질 변경(335줄)의 gap으로 발생.
- Generator가 "M12 tech-debt 기록 + 예외 사유 문서화" 처리하거나, contract M12 검증 명령을 `--unified=0` 기준으로 재측정 요청 가능.
- 단, contract MUST는 binary. 예외 처리 시 Generator가 exec-plan에 명시적으로 기록해야 함.

### 검증 재실행 순서 (iteration 2)
```bash
# 1. Dismiss 또는 commit+push 후
gh api 'repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=20' --jq 'length'
# 기대: 0

# 2. lockfile diff 재측정
git diff --unified=0 pnpm-lock.yaml | wc -l
# 기대: < 400 (context=0 기준)

# 3. tsc 재확인
pnpm tsc --noEmit; echo "exit=$?"

# 4. test:cov
pnpm --filter backend run test:cov 2>&1 | tail -5

# 5. frontend build
pnpm --filter frontend run build 2>&1 | tail -3
```

---

## 요약

| 카테고리 | PASS | FAIL |
|---|---|---|
| MUST (M1~M12) | 10 | 2 (M1, M12) |
| SHOULD (S1~S7) | 6 | 0 (S3=SKIP) |
| Domain (D1~D4) | 3 | 1 (D4) |

**핵심 판단:**
- 기술적 구현 품질은 높음. IdentifierService SSOT, Global Module, spec 6케이스, drift guard, verify-ssot Step 44 모두 정상.
- FAIL 2건 중 M12는 context 줄 포함 측정 방식의 gap 문제로 실질 위험 낮음.
- M1은 GitHub Dependabot 미갱신 문제로 dismiss API 호출 또는 push 후 재스캔으로 즉시 해소 가능.
- D4(원자적 커밋 분리)는 프로세스 이슈.

**Verdict: FAIL** — MUST M1, M12 미달. Generator는 위 Critical Issues 해소 후 iteration 2 재제출.
