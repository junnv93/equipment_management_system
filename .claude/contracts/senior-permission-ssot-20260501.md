# 스프린트 계약: Senior Permission SSOT 5-Phase Sprint

## 생성 시점

2026-05-01T00:00:00+09:00

## 슬러그

`senior-permission-ssot-20260501`

## 모드

Mode 2 (Planner → Generator → Evaluator harness)

## 변경 영역

- `packages/shared-constants/src/role-permission-matrix.ts` (신규)
- `packages/shared-constants/src/__tests__/role-permission-matrix.spec.ts` (신규)
- `packages/shared-constants/src/index.ts` (re-export 추가)
- `apps/backend/test/helpers/test-permission-token.ts` (신규)
- `apps/backend/test/helpers/test-permission-token.spec.ts` (신규)
- `apps/backend/scripts/verify-e2e-actor-alignment.ts` (신규)
- `apps/backend/package.json` (devDep + script)
- `pnpm-lock.yaml` (자동 재생성)
- `.husky/pre-push` (1단계 추가)
- `.claude/skills/verify-e2e/SKILL.md` (Step 23/24/25 승격 명시)
- `apps/backend/test/lab-manager-permission-scope.e2e-spec.ts` (신규)
- `apps/backend/test/helpers/test-fixtures.ts` (시그니처 변경)
- `apps/backend/test/*.e2e-spec.ts` (codemod, 30+ 호출부)

## Other-Session No-Touch Zones (위반 시 즉시 FAIL)

다음 파일은 다른 세션 ownership으로 본 sprint에서 수정 금지:

- `apps/backend/src/common/cache/cache-event.registry.ts`
- `apps/backend/src/common/cache/cache-events.ts`
- `apps/backend/src/common/cache/cache-key-prefixes.ts`
- `apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts`
- `apps/backend/src/modules/equipment/dto/disposal.dto.ts`
- `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx`
- `apps/frontend/components/inspections/**`
- `apps/frontend/lib/analytics/events.ts`
- `apps/frontend/lib/utils/calibration-status.ts`
- `apps/frontend/messages/ko/calibration.json`
- `.claude/contracts/disposal-zod-defense-in-depth.md`
- `.claude/exec-plans/active/2026-05-01-inspection-template-*.md`
- `.claude/exec-plans/tech-debt-tracker.md` (★ Phase 5 결과는 별도 follow-up commit으로 추후 등재)
- `.claude/skills/verify-zod/SKILL.md`

`git diff --name-only HEAD~N..HEAD`로 검증 → 위 목록 1+ hit 시 자동 FAIL.

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### M1 — 빌드 무결성
- [ ] `pnpm tsc --noEmit` 전체 패키지 0 errors
- [ ] `pnpm --filter backend run lint:ci` 0 errors
- [ ] `pnpm --filter frontend run lint` 0 errors (frontend 변경 없음 — 회귀 가드)

#### M2 — Phase 1 SSOT 신설 검증
- [ ] `packages/shared-constants/src/role-permission-matrix.ts` 존재 + IIFE export
- [ ] `packages/shared-constants/src/index.ts`에 `ROLE_PERMISSION_MATRIX`, `getRolesWithPermission`, `roleHasPermission` re-export 추가
  - 검증: `grep -c "ROLE_PERMISSION_MATRIX" packages/shared-constants/src/index.ts` ≥ 1 AND `grep -c "getRolesWithPermission" packages/shared-constants/src/index.ts` ≥ 1
- [ ] `pnpm --filter @equipment-management/shared-constants run test` 모든 신규 spec 통과
- [ ] matrix는 derived view (손수 데이터 추가 0건) — `grep -c "= ROLE_PERMISSIONS\|= derivePermissionRoleMatrix\|reduce.*ROLE_PERMISSIONS" packages/shared-constants/src/role-permission-matrix.ts` ≥ 1

#### M3 — Phase 2 헬퍼 검증
- [ ] `apps/backend/test/helpers/test-permission-token.ts` 존재 + `getTokenForPermission` export
- [ ] unit spec 통과: `pnpm --filter backend run test test-permission-token`
- [ ] hierarchy ascending 정렬 확인 (system_admin이 fallback only)
  - 검증: spec에 `expect(...).toMatch(/technical_manager|lab_manager|test_engineer/)` AND `not.toMatch(/system_admin/)` for non-broaden case

#### M4 — Phase 3 정적 분석기 검증
- [ ] `apps/backend/scripts/verify-e2e-actor-alignment.ts` 존재
- [ ] `apps/backend/package.json` `scripts.verify:e2e-actors` 존재
  - 검증: `grep -c '"verify:e2e-actors"' apps/backend/package.json` ≥ 1
- [ ] `ts-morph` devDependency 등록
  - 검증: `grep -c '"ts-morph"' apps/backend/package.json` ≥ 1
- [ ] `.husky/pre-push`에 `verify:e2e-actors` 단계 추가
  - 검증: `grep -c "verify:e2e-actors" .husky/pre-push` ≥ 1
- [ ] `pnpm --filter backend run verify:e2e-actors` 0 violations (R1-R3 strict, R2/R4 WARN 허용 — Phase 5 전 단계)
- [ ] `.claude/skills/verify-e2e/SKILL.md` Step 23/24/25 섹션에 "실행 가능 검증으로 승격됨" 명시
  - 검증: `grep -c "verify:e2e-actors" .claude/skills/verify-e2e/SKILL.md` ≥ 3 (Step 23, 24, 25 각 1회 이상)

#### M5 — Phase 4 lab_manager spec 검증
- [ ] `apps/backend/test/lab-manager-permission-scope.e2e-spec.ts` 존재
- [ ] 최소 6 테스트 케이스 (TC-1 ~ TC-6 in plan)
  - 검증: `grep -c "^\s*it(" apps/backend/test/lab-manager-permission-scope.e2e-spec.ts` ≥ 6
- [ ] UL-QP-18 §4.2 / §4.3 인용 명시
  - 검증: `grep -c "UL-QP-18" apps/backend/test/lab-manager-permission-scope.e2e-spec.ts` ≥ 2
- [ ] spec 통과: `pnpm --filter backend run test:e2e lab-manager-permission-scope` 6/6 PASS
- [ ] 본 spec이 Phase 2 헬퍼 사용 (dogfood)
  - 검증: `grep -c "getTokenForPermission" apps/backend/test/lab-manager-permission-scope.e2e-spec.ts` ≥ 1

#### M6 — Phase 5 deprecation cleanup 검증
- [ ] `apps/backend/test/helpers/test-fixtures.ts`에서 `createTestEquipment` 시그니처가 `_token` 미보유
  - 검증: `grep -c "_token" apps/backend/test/helpers/test-fixtures.ts` = 0
- [ ] 모든 호출부 갱신
  - 검증: `grep -rn "createTestEquipment(.*Token" apps/backend/test/*.e2e-spec.ts` = 0 hits
- [ ] e2e suite 전체 통과: `pnpm --filter backend run test:e2e` 14+1 스위트 PASS

#### M7 — Workflow 통합 검증
- [ ] pre-push hook 시뮬레이션:
  ```bash
  pnpm verify:env-sync
  pnpm tsc --noEmit
  pnpm --filter backend run lint:ci
  pnpm --filter frontend run lint
  pnpm --filter backend run test --silent --passWithNoTests
  pnpm --filter backend run verify:e2e-actors
  ```
  → 모든 단계 exit 0
- [ ] 추가 시간: pre-push 전체 < 35s (기존 ~30s + ~3s budget)

#### M8 — SSOT 무결성 회귀 가드
- [ ] `Permission` enum 모든 값이 matrix key로 등장
  - 검증: spec에서 `Object.values(Permission).every(p => p in ROLE_PERMISSION_MATRIX)` 통과
- [ ] matrix는 `ROLE_PERMISSIONS` 외 데이터 source 0건
  - 검증: `grep -c "import.*ROLE_PERMISSIONS" packages/shared-constants/src/role-permission-matrix.ts` ≥ 1 AND `grep -c "import.*Permission" packages/shared-constants/src/role-permission-matrix.ts` ≥ 1 (다른 import 없음 확인)

#### M9 — Security 회귀 가드
- [ ] `permissions.guard.ts` 변경 0줄 (production permission 검증 로직 무변경)
  - 검증: `git diff apps/backend/src/modules/auth/guards/permissions.guard.ts` empty
- [ ] `ROLE_PERMISSIONS` 변경 0줄 (forward query SSOT 무변경)
  - 검증: `git diff packages/shared-constants/src/role-permissions.ts` empty
- [ ] 새로운 production endpoint 0건 (test/script만 추가)

#### M10 — No-Touch Zone 준수
- [ ] No-Touch Zones 13개 파일/패턴 변경 0건
  - 검증: `git diff --name-only HEAD~5..HEAD | grep -E '(cache-event\.registry|cache-events|cache-key-prefixes|approve-calibration-plan\.dto|disposal\.dto|CalibrationPlanDetailClient|inspections/|analytics/events|calibration-status|messages/ko/calibration|disposal-zod|inspection-template-|tech-debt-tracker|verify-zod/SKILL)'` = 0 hits

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

#### S1 — Bundle 영향 측정
- [ ] `pnpm --filter frontend run build` 후 baseline 비교
  - 기대: matrix는 frontend import되지 않음 → bundle delta 0KB
  - 위반 시 tech-debt: `matrix-frontend-tree-shake-verification`

#### S2 — i18n parity (이번 sprint 영향 0 예상)
- [ ] `node scripts/check-i18n-call-sites.mjs --all --quiet` PASS (회귀 가드)

#### S3 — review-architecture
- [ ] Critical 이슈 0건
- [ ] HIGH/MED 이슈는 tech-debt 등재로 허용

#### S4 — Documentation 갱신
- [ ] CLAUDE.md `Useful Skills` 섹션에 Phase 3 검증 명령 1줄 안내
  - 위반 시 tech-debt: `claudemd-permission-ssot-skills-index-update`
- [ ] `docs/references/skills-index.md` (skills 한줄 요약)에 verify-e2e Step 23/24/25 승격 반영
  - 위반 시 tech-debt: `skills-index-permission-ssot-update`

#### S5 — verify-ssot SKILL 갱신
- [ ] verify-ssot SKILL에 "RolePermissionMatrix는 derived view, 직접 데이터 추가 금지" Step 신규 추가
  - 위반 시 tech-debt: `verify-ssot-matrix-step-신규`

#### S6 — Phase 4 추가 케이스 (확장)
- [ ] quality_manager 권한 케이스 (REVIEW_CALIBRATION_PLAN 200, CREATE_EQUIPMENT 403)
  - 본 sprint Out-of-Scope로 명시 — TestRole 'qualityManager' alias 부재로 이연
  - 위반 시 tech-debt: `quality-manager-testrole-alias-신규`

#### S7 — Phase 3 R4 룰 보강
- [ ] R4 (controller @RequirePermissions ↔ matrix 정합)이 5+ controller에서 정확 분석
  - 위반 시 (ts-morph 분석 한계) tech-debt: `verify-e2e-actor-r4-conservative-skip-cases`

---

### 적용 verify 스킬

변경 파일 경로 기반 자동 선택:
- `verify-ssot` (packages/shared-constants 변경)
- `verify-e2e` (apps/backend/test 변경 — Step 23/24/25 자동 실행)
- `verify-implementation` (전체 영역 통합)
- `verify-hardcoding` (Phase 4 spec UL-QP-18 인용 + Permission/role 리터럴 회귀 가드)
- `verify-security` (permissions.guard.ts 무변경 회귀 가드)

---

## Verification Commands (Evaluator 실행)

```bash
# 전체 sprint 검증 (순서 중요)

# 1. Build 무결성
pnpm tsc --noEmit
pnpm --filter backend run lint:ci
pnpm --filter frontend run lint

# 2. Phase 1 SSOT
pnpm --filter @equipment-management/shared-constants run test
test $(grep -c "ROLE_PERMISSION_MATRIX" packages/shared-constants/src/index.ts) -ge 1
test $(grep -c "getRolesWithPermission" packages/shared-constants/src/index.ts) -ge 1

# 3. Phase 2 헬퍼
pnpm --filter backend run test test-permission-token

# 4. Phase 3 분석기
pnpm --filter backend run verify:e2e-actors
test $(grep -c "verify:e2e-actors" .husky/pre-push) -ge 1
test $(grep -c '"ts-morph"' apps/backend/package.json) -ge 1
test $(grep -c "verify:e2e-actors" .claude/skills/verify-e2e/SKILL.md) -ge 3

# 5. Phase 4 lab_manager spec
pnpm --filter backend run test:e2e lab-manager-permission-scope
test $(grep -c "^\s*it(" apps/backend/test/lab-manager-permission-scope.e2e-spec.ts) -ge 6
test $(grep -c "UL-QP-18" apps/backend/test/lab-manager-permission-scope.e2e-spec.ts) -ge 2

# 6. Phase 5 cleanup
test $(grep -c "_token" apps/backend/test/helpers/test-fixtures.ts) -eq 0
test $(grep -rln "createTestEquipment(.*Token" apps/backend/test/ 2>/dev/null | wc -l) -eq 0

# 7. e2e suite 전체
pnpm --filter backend run test:e2e

# 8. No-Touch Zone 회귀 검증
NO_TOUCH_REGEX='(cache-event\.registry|cache-events|cache-key-prefixes|approve-calibration-plan\.dto|disposal\.dto|CalibrationPlanDetailClient|inspections/|analytics/events|calibration-status|messages/ko/calibration|disposal-zod|inspection-template-|tech-debt-tracker|verify-zod/SKILL)'
test $(git diff --name-only HEAD~10..HEAD | grep -cE "$NO_TOUCH_REGEX") -eq 0

# 9. Security 회귀 가드
test -z "$(git diff HEAD~10..HEAD apps/backend/src/modules/auth/guards/permissions.guard.ts)"
test -z "$(git diff HEAD~10..HEAD packages/shared-constants/src/role-permissions.ts)"
```

---

## Acceptance Evidence (PASS 증명 artifacts)

다음을 evaluation report에 첨부:

1. **Commit SHA list** (Phase 1~5 분리 commit)
2. **tsc output**: `pnpm tsc --noEmit` exit 0 확인
3. **Phase 2 unit test output**: `test-permission-token.spec.ts` PASS 카운트
4. **Phase 3 verify:e2e-actors output**: `0 violations` 메시지
5. **Phase 4 e2e output**: 6/6 PASS 트랜스크립트
6. **Phase 5 codemod evidence**: before/after grep counts (`createTestEquipment(.*Token` 0 hits)
7. **No-Touch Zone evidence**: `git diff --name-only` 출력에서 zone 미포함 확인
8. **pre-push timing**: 9-step 전체 시간 <35s 측정

---

## 종료 조건

- 필수 기준 (M1~M10) 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD (S1~S7) 실패는 tech-debt-tracker 등재로 허용 (slug 추가 후 follow-up commit)

---

**Contract 서명**: senior-permission-ssot-20260501 contract rev-1 — 2026-05-01
