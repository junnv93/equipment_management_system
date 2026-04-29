# 스프린트 계약: 의존성 공급망 강화 (Dependency Supply-Chain Hardening)

## 생성 시점
2026-04-30

## 작업 메타
- **slug:** `deps-supply-chain-hardening`
- **mode:** Mode 2 (시스템 통합)
- **iteration_max:** 3
- **scope (예상 변경 파일):**
  - 신규: `apps/backend/src/common/identifiers/{identifier.service.ts, identifier.module.ts, identifier.service.spec.ts}`, `scripts/check-dependabot-drift.mjs`
  - 수정: `apps/backend/src/common/file-upload/file-upload.service.ts`, `apps/backend/src/modules/data-migration/services/data-migration.service.ts`, `apps/backend/src/common/common.module.ts` (또는 app.module.ts), `apps/backend/package.json`, `package.json` (root), `pnpm-lock.yaml`, `.claude/skills/verify-ssot/SKILL.md`, `.claude/skills/manage-skills/SKILL.md`, `docs/references/skills-index.md`, 기존 spec 2건

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **M1**: Dependabot open alerts (#200 uuid, #201 fast-xml-parser, #202 uuid, #203 postcss) **4건 → 0건** 또는 명시적 suppression with justification (justification은 PR 본문 또는 CODEOWNERS 코멘트에 기록).
  - 검증: `pnpm audit:dependabot` 출력에서 `REAL=0` 확인 + `gh api repos/{owner}/{repo}/dependabot/alerts?state=open` 결과 [].
- [ ] **M2**: root `package.json` `pnpm.overrides`의 모든 값이 `^x.y.z` 또는 정확한 `x.y.z` 형식. **`>=` 패턴 0건**.
  - 검증: `! grep -E '">=' package.json` exit 0.
- [ ] **M3**: backend `apps/backend/src/**/*.ts`에서 raw uuid 직접 import **0건** (헬퍼 경유).
  - 검증: `! grep -rn "from ['\"]uuid['\"]" apps/backend/src/ && ! grep -rn "require('uuid')" apps/backend/src/` exit 0.
- [ ] **M4**: `pnpm tsc --noEmit` (root, 전체 패키지) exit 0.
- [ ] **M5**: `pnpm --filter backend run test:cov` PASS — file-upload + data-migration + identifier.service 테스트 포함, coverage threshold 미하락 (현 baseline: lines/branches/functions/statements 각각 25/20/25/25).
- [ ] **M6**: `pnpm --filter frontend run test` PASS.
- [ ] **M7**: `pnpm --filter backend run build` 성공 + dist에서 IdentifierService 정상 require 가능.
  - 검증: `pnpm --filter backend run build && node -e "const m = require('./apps/backend/dist/common/identifiers/identifier.service'); console.assert(typeof m.IdentifierService === 'function', 'class export'); console.log('OK');"` exit 0.
- [ ] **M8**: `pnpm --filter frontend run build` 성공 (postcss 8.5.10 정상 동작 검증).
- [ ] **M9**: preinstall guard 확장 작동 — `>=` 잔존 시 install 차단.
  - 검증 (회귀 시뮬레이션): `package.json`에 `"_test_drift": ">=1.0.0"` 임시 추가 → `node scripts/check-dependabot-drift.mjs` exit 1 + 명확한 에러 메시지 → 원복.
- [ ] **M10**: verify-implementation 13개 스킬 PASS (특히 **verify-ssot, verify-security, verify-hardcoding**).
- [ ] **M11**: pre-push hook (`.husky/pre-push`) 통과 시뮬레이션 — `pnpm verify:env-sync && pnpm tsc --noEmit && pnpm --filter backend run test --silent --passWithNoTests && pnpm --filter frontend run test --silent --passWithNoTests` 전체 exit 0.
- [ ] **M12**: lockfile 변경 *순수 라인 수* (insertions+deletions, `git diff --stat`) ≤ **400 lines** budget. (a) `git diff` 기본 출력은 ±3 line context 포함이라 부풀려짐, (b) `git diff --unified=0`은 hunk 헤더 포함이라 약간 부풀려짐, (c) `--stat`이 정확. 초과 시 메이저 통합 회귀 신호 — 부분 적용 + 분리 커밋. 333 lines 이하면 PASS.

검증: `git diff --stat pnpm-lock.yaml | tail -1 | grep -oE '[0-9]+ insertions.*[0-9]+ deletions' | grep -oE '[0-9]+' | paste -sd+ | bc` ≤ 400

### 권장 (SHOULD) — 실패 시 tech-debt-tracker.md 기록, 루프 차단 없음

- [ ] **S1**: `verify-ssot` SKILL.md에 supply-chain Step 44 추가 (Phase G) — manage-skills 인덱스 + skills-index.md 갱신.
- [ ] **S2**: `scripts/check-dependabot-drift.mjs`의 검사 2 (Dependabot API mismatch 감지) 구현. `gh` 미가용 시 graceful skip.
- [ ] **S3**: `pnpm measure:bundle` baseline 갱신 — postcss/fast-xml-parser 변경 후 frontend bundle 변동 ≤ ±2% 측정 + 기록.
- [ ] **S4**: review-architecture (Mode 2) Critical 이슈 0개.
- [ ] **S5**: identifier.service.spec.ts 단위 테스트 ≥ **5 케이스** (36자 길이, v4 형식 정규식, 100회 호출 중복 0, prefix 옵션, 빈 prefix raw UUID).
- [ ] **S6**: NestJS Global Module 등록 검증 — file-upload/data-migration 모듈 imports 변경 없이 IdentifierService 주입 가능.
- [ ] **S7**: 의사결정 로그 (exec-plan) 7건 모두 README 또는 PR 본문에 요약 첨부.

---

## 도메인 성공 기준

- [ ] **D1**: file-upload 파일 키 형식 호환성 — 변경 전후 모두 `{subdir}/{36자-v4-uuid}{ext}` 형식. 기존 DB `documents.file_path` 레코드 마이그레이션 불필요.
  - 검증: `pnpm --filter backend run test -- file-upload` 기존 테스트 PASS + S3 키 정규식 (`^[a-z]+\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.\w+$`) 통과.
- [ ] **D2**: data-migration batch ID 형식 — 변경 전 (raw v4 UUID) → 변경 후 (`generateMigrationBatchId()` 또는 `generateOpaqueId('mig')` 출력) 호환. 기존 진행 중인 마이그레이션 세션 status 추적 깨짐 0건.
- [ ] **D3**: ESM/CJS 호환성 — `crypto.randomUUID()`는 Node 빌트인이라 backend `module: 'commonjs'`에서 `require('node:crypto')` 정상 동작. NestJS dist 빌드 후 require 실측 (M7).
- [ ] **D4**: Phase A~G 각 Phase가 **원자적 커밋 단위** — 각 Phase 단독 revert 가능.

---

## 적용 verify 스킬

변경 파일 경로 기반 자동 선택 (verify-implementation orchestrator):

- **verify-ssot** (필수, Phase G에서 Step 44 추가): supply-chain SSOT (raw uuid import 0건, overrides `>=` 0건, IdentifierService 존재).
- **verify-security**: CSPRNG 사용 확인 (`crypto.randomUUID()` v4), file-upload magic bytes 검증 회귀 0.
- **verify-hardcoding**: 도메인 prefix/형식 패턴 인라인 0건 (헬퍼 내부 격리).
- **verify-implementation** (orchestrator): 13개 스킬 자동 선택.

---

## 검증 명령 (전체)

```bash
# Pre-flight
pnpm audit:dependabot                                    # baseline 4 REAL
grep -rn "from 'uuid'" apps/ packages/ scripts/ 2>/dev/null  # 직접 사용처
grep -A1 "^[a-z @'-]*uuid@" pnpm-lock.yaml | head        # transitive

# Phase 단위 검증 (각 Phase 후)
pnpm --filter backend run type-check
pnpm --filter backend run test
pnpm --filter backend run build
pnpm --filter frontend run type-check
pnpm --filter frontend run test
pnpm --filter frontend run build

# 최종 검증 (PR 직전)
pnpm install                                             # lockfile 갱신 확정
pnpm tsc --noEmit                                        # M4
pnpm --filter backend run test:cov                       # M5
pnpm --filter frontend run test                          # M6
pnpm --filter backend run build                          # M7
node -e "const m = require('./apps/backend/dist/common/identifiers/identifier.service'); console.assert(typeof m.IdentifierService === 'function');"  # M7
pnpm --filter frontend run build                         # M8
pnpm audit:dependabot                                    # M1: REAL=0
! grep -E '">=' package.json                             # M2
! grep -rn "from ['\"]uuid['\"]" apps/backend/src/       # M3
node scripts/check-dependabot-drift.mjs                  # M9 (정상)
git diff pnpm-lock.yaml | wc -l                          # M12: ≤ 400
```

---

## 종료 조건

- **성공:** 필수(MUST) M1~M12 + 도메인 D1~D4 전체 PASS → PR 가능 (또는 main 직접 커밋).
- **루프 재진입:** 1건이라도 FAIL → Generator에 evaluation-report 전달 후 재시도.
- **수동 개입 요청:**
  - 동일 이슈 2회 연속 FAIL (예: ESM 호환 실패가 Phase B에서 반복 — 단, Plan A 채택으로 발생 가능성 매우 낮음).
  - 3회 반복 초과.
  - lockfile 변경 라인 > 600 (Phase E overrides caret 변환 시 메이저 통합 발생 신호).
- **SHOULD 실패는 종료 조건에 영향 없음** — `.claude/exec-plans/tech-debt-tracker.md`에 기록 후 PR 가능.

---

## 위험 및 fallback (Evaluator 판단 보조)

| 위험 | 발생 신호 | Fallback |
|---|---|---|
| transitive uuid 잔존 + Dependabot 재경고 | Phase C 후 `pnpm audit:dependabot`에서 uuid REAL 잔존 | `pnpm.overrides`에 `"uuid": "^11.0.0"` 추가 (transitive 강제 bump, 우리 코드 무관) |
| overrides caret 변환 후 회귀 (Phase E) | tsc/test FAIL 또는 lockfile diff > 400 | `git checkout package.json pnpm-lock.yaml` → 1건씩 분리 커밋으로 재적용 |
| postcss 8.5.10 frontend 빌드 깨짐 | `pnpm --filter frontend run build` FAIL | postcss 8.5.10 → 8.5.x 마지막 안정버전으로 pin (lockfile 측정 기반) |
| preinstall guard false positive | 정상 install 차단 | guard 검사 1 정규식 수정 또는 일시 disable + tech-debt 기록 |
| identifier.service NestJS DI 실패 | backend 부팅 실패 | `@Global()` 누락 가능 — IdentifierModule에 `@Global()` 추가 또는 각 feature module imports에 명시적 추가 |

---

## 출력 형식 (Evaluator → Generator)

평가 결과는 `.claude/evaluations/deps-supply-chain-hardening.md`에 누적 기록.
필수 기준 미달 시 수정 지시 섹션에 (a) 파일:라인, (b) 문제 설명, (c) 코드 수준 수정 지시, (d) 검증 명령 4종 모두 포함.
