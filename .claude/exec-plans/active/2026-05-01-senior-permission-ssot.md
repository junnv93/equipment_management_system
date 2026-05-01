# Senior Permission SSOT 5-Phase Sprint — exec-plan

## 메타
- 생성: 2026-05-01T00:00:00+09:00
- 모드: Mode 2 (Planner → Generator → Evaluator harness)
- 슬러그: `senior-permission-ssot-20260501`
- 예상 변경: 18~22개 파일 (Phase 1: 3, Phase 2: 2, Phase 3: 5, Phase 4: 1, Phase 5: 30+ — 단 Phase 5는 기계적 codemod라 1 PR 1 파일 카운트)
- 브랜치 정책: **main 직접 작업** (35차 결정 `feedback_main_only_no_branches.md`). pre-push hook이 게이트.
- 다른 세션 의존: 없음 (Other-Session No-Touch Zones 전부 회피)

---

## TL;DR (5 lines max)

1. `RolePermissionMatrix` SSOT를 **`shared-constants` 위에 derived view로 신설** — 기존 `ROLE_PERMISSIONS` 재가공만, 새 데이터 0건.
2. `getTokenForPermission(perm)` 테스트 헬퍼로 spec 작성 시 권한↔역할 매칭을 자동화.
3. `verify-e2e-actor-alignment.ts` 정적 분석을 pre-push에 추가하여 Step 23/24/25 grep을 실행 가능 검증으로 승격.
4. `lab_manager-permission-scope.e2e-spec.ts` 신규 — UL-QP-18 직무분리 명시 회귀 가드.
5. `createTestEquipment(_token)` deprecation cleanup — 30+ 호출부 codemod (마지막 phase).

---

## 설계 철학

**"Decorator는 사실 (truth), Matrix는 그 사실의 reverse-index, Test는 그 reverse-index를 query하는 사용자."**

기존 코드베이스는 이미 `@RequirePermissions(perm)` decorator (controller) ↔ `ROLE_PERMISSIONS[role]: Permission[]` (shared-constants) 두 SSOT가 **PermissionsGuard**(`apps/backend/src/modules/auth/guards/permissions.guard.ts:119`)에서 join된다. 이 join 자체는 production runtime에서 검증된다 — 그러나 **"임의의 Permission p에 대해 어떤 UserRole이 보유하는가?"** 라는 reverse query는 매번 manual scan이다. 이 sprint는 **새 SSOT를 생성하지 않고**, 기존 `ROLE_PERMISSIONS`의 reverse-index view + 그 view를 사용하는 test helper + 정적 invariant 가드를 추가한다.

**핵심 절제**: matrix는 `derivePermissionRoleMatrix()` 함수가 `ROLE_PERMISSIONS`로부터 build-time 또는 module-load-time에 도출한다. 별도 손으로 유지하는 mapping 테이블 만들지 않는다 (drift zero).

---

## L0 Inferred Requirements (Planner가 코드베이스에서 도출한 가정)

사용자가 명시 요청하지 않았으나, "시니어 표준 + 누락 없음" 요구로부터 코드베이스 탐색 후 도출한 요구사항:

- **L0-1**: 새 SSOT는 데이터 중복(role→perm 매핑이 두 곳)을 만들면 안 된다 — `ROLE_PERMISSIONS`가 유일한 source, matrix는 derived view. (근거: `packages/shared-constants/src/role-permissions.ts:35` 이미 SSOT 명시)
- **L0-2**: `system_admin`은 blacklist semantics(`Object.values(Permission).filter(...)`, role-permissions.ts:343) — matrix 빌드 시 자동 반영되므로 reverse query에서 거의 모든 Permission에 대해 system_admin이 등장. 이를 "최소 권한 역할" 우선 정렬로 처리해야 헬퍼가 의도된 도메인 역할을 반환.
- **L0-3**: `quality_manager`는 `TestRole` 유니언에 미포함 (test-auth.ts:20). Phase 4의 lab_manager scope spec은 quality_manager 권한 검증까지 확장하면 TestRole 유니언 확장이 필요해진다 — 현 sprint는 lab_manager만 스코프 (verify-e2e Step 23 4-place 갱신은 차후 sprint).
- **L0-4**: AST 추출은 ts-morph 의존성 1건 추가가 필요. devDependency만이라 production bundle 영향 0. 이미 codebase에 ts-morph 사용 흔적 없음 → 신규 도입.
- **L0-5**: `derivePermissionsFromRoles`(role-permissions.ts:369)는 이미 forward query 헬퍼 — reverse query 헬퍼만 추가하면 된다. 양방향 query SSOT는 같은 파일에 위치해야 자기 일관성.
- **L0-6**: pre-push hook(`.husky/pre-push:39-49`)은 이미 8단계 — 1단계 추가는 ~2초 미만이어야 senior 표준 (전체 ~30초 budget).
- **L0-7**: `lab_manager` ↔ `admin` TestRole alias가 의도적이지 사고가 아님 (test-auth.ts:18 명시). 새 spec은 alias 사용 — 별도 'labManager' TestRole 신설 불필요.

---

## 아키텍처 결정

| # | 결정 사항 | 선택 | 근거 | 기각된 대안 |
|---|---------|-----|------|------------|
| AD-1 | Matrix 위치 | `packages/shared-constants/src/role-permission-matrix.ts` (신규) | 양방향 query (forward `derivePermissionsFromRoles` ↔ reverse `getRolesWithPermission`)가 같은 패키지에 있어야 SSOT 자기 일관성. shared-constants는 frontend도 import하므로 frontend가 reverse query 필요할 때(예: PermissionGate) 즉시 사용 가능. | (a) `apps/backend/src/modules/auth/rbac/`: backend 전용이라 frontend가 권한 정책 추론 불가. (b) `packages/schemas/src/`: schemas는 Zod 검증 layer라 정책 데이터와 분리 필요. |
| AD-2 | Matrix 빌드 방식 | **Module-load-time derivation** (`derivePermissionRoleMatrix()` IIFE export) | drift 원천 차단 (controller @RequirePermissions은 매트릭스에 영향 없고, ROLE_PERMISSIONS만이 source). Module load 1회만 비용 (~ms). | (a) 손수 유지 매트릭스: drift 보장. (b) AST extraction: 빌드 시점에만 효과, runtime 사용 불가. |
| AD-3 | Matrix-Decorator 정합 검증 | **Phase 3에서 ts-morph AST scanner로 별도 invariant 검증** | matrix는 `ROLE_PERMISSIONS`의 reverse-view라 자체 정합 보장. 하지만 controller `@RequirePermissions(P_X)` 가 등장했는데 어떤 role도 P_X를 안 가진 경우(=dead permission) 검출 필요. AST scan은 runtime 비용 0, pre-push에서만. | (a) runtime self-check: controller 인스턴스화 시 reflector scan하면 module init 비용 증가. (b) jest test로 통합: jest 부팅 비용 5초+ 추가. AST scan은 ~500ms. |
| AD-4 | `getTokenForPermission` 다중 역할 동률 시 정렬 | **Hierarchy ascending — 최소 권한 우선** (test_engineer < technical_manager < quality_manager < lab_manager < system_admin) | "이 perm을 가진 가장 narrow scope role"이 도메인 검증 의도와 일치. `system_admin`이 거의 모든 perm 보유라 첫 매치되면 항상 scope 우회 = Step 25 안티패턴 재발. | (a) 첫 매칭 role: 사전순/선언순 의존, 비결정성. (b) opt-in `{ broaden: true }`: 디폴트 안전, 명시 요청 시만 broaden. → 본 sprint 채택 |
| AD-5 | Phase 3 정적 분석기 위치 | `apps/backend/scripts/verify-e2e-actor-alignment.ts` + `package.json` `verify:e2e-actors` script + `.husky/pre-push`에 추가 | scripts/ 디렉토리는 이미 `ultrareview-*.mjs`, `verify-routing-origin.sh` 같은 검증 도구 위치. backend monorepo 내부라 ts-morph + TypeScript 모듈 import 정합. | (a) jest 통합 테스트: 부팅 비용. (b) ESLint custom rule: ESLint context 외부 파일(test-auth.ts 4곳 mapping 등) 참조 불가. |
| AD-6 | Phase 4 spec 위치 | `apps/backend/test/lab-manager-permission-scope.e2e-spec.ts` (신규) | 기존 `manager-role-constraint.e2e-spec.ts`, `site-permissions.e2e-spec.ts` naming convention 일치 (`<scope>-<axis>.e2e-spec.ts`). | (a) 기존 spec에 describe 추가: 회귀 진단 어려움 + 격리성 ↓. |
| AD-7 | Phase 5 codemod 적용 | **수술적 sed 기반 codemod 단일 commit + 검증** (`grep -rn "createTestEquipment(.*,.*token" apps/backend/test/*.e2e-spec.ts` → script 변환) | 30+ 파일을 1 commit에 묶으면 review 부담 ↑이지만, fail-close test로 검증 가능. 5 phase 마지막에 위치하므로 다른 phase가 새 호출부 추가하지 않음을 보장. | (a) phase별 분산 cleanup: 새 호출부 등장으로 누락 위험. |

---

## Phase 1: `RolePermissionMatrix` SSOT 신설 (정책 엔진)

**목표:** `ROLE_PERMISSIONS`의 reverse-index view 신설 + 양방향 query API 통합.

### 변경 파일

1. **신규**: `packages/shared-constants/src/role-permission-matrix.ts`
   - export `RolePermissionMatrix` 타입: `Readonly<Record<Permission, readonly UserRole[]>>`
   - export `ROLE_PERMISSION_MATRIX`: const, IIFE로 `ROLE_PERMISSIONS`로부터 derived
   - export `getRolesWithPermission(p: Permission): readonly UserRole[]` — reverse query
   - export `roleHasPermission(role: UserRole, p: Permission): boolean` — forward (기존 `hasPermission` re-export, naming은 양방향 일관성)
   - JSDoc: "이 매트릭스는 `ROLE_PERMISSIONS`의 reverse-index view입니다. 직접 데이터 추가 금지."

2. **수정**: `packages/shared-constants/src/index.ts`
   - 신규 모듈 re-export 추가 (`ROLE_PERMISSION_MATRIX`, `getRolesWithPermission`, `roleHasPermission`, `RolePermissionMatrix` 타입)

3. **신규**: `packages/shared-constants/src/__tests__/role-permission-matrix.spec.ts`
   - matrix가 `ROLE_PERMISSIONS`의 정확한 reverse-view인지 검증 (양방향 round-trip): 모든 (role, perm) 쌍에 대해 `roleHasPermission(r, p) ↔ getRolesWithPermission(p).includes(r)` 동치성 검증
   - Permission enum의 모든 값이 matrix key로 등장하는지 (dead permission 0건) 검증
   - 빌드 결정성 검증: 동일 입력 → 동일 출력 (sort 안정)

### 검증

```bash
pnpm --filter @equipment-management/shared-constants run test --silent
pnpm tsc --noEmit
```

**PASS 기준**: 신규 spec 통과 + tsc 0 errors + matrix가 모든 Permission enum 값을 key로 보유.

### Trade-off

- IIFE module-load 비용: 약 0.5ms (Permission ~80개 × UserRole 5개 = 400 iterations). frontend bundle에 reverse-index 데이터 추가됨 (JSON 직렬화 시 ~3KB). → SHOULD 기준에서 bundle baseline 측정 권고.

---

## Phase 2: `getTokenForPermission(p)` 테스트 헬퍼

**목표:** 테스트 작성자가 "어떤 token이 perm X를 가지는가?"를 코드로 묻게 한다.

### 변경 파일

1. **신규**: `apps/backend/test/helpers/test-permission-token.ts`
   - export `async function getTokenForPermission(app: INestApplication, perm: Permission, opts?: { broaden?: boolean }): Promise<string>`
   - 내부: `getRolesWithPermission(perm)` → `TEST_USERS_WITH_ROLE_HIERARCHY` 정렬(`test_engineer` < `technical_manager` < `quality_manager` < `lab_manager` < `system_admin`) → 가장 narrow role의 TestRole alias 매핑 → `loginAs(app, role)` 호출.
   - error path: `getRolesWithPermission(perm).length === 0` → `throw new Error(\`Permission '${perm}' has no role coverage — dead permission?\`)`
   - quality_manager TestRole 미존재 처리: matrix가 quality_manager 반환 시 본 sprint는 throw with actionable message ("quality_manager TestRole alias not yet seeded — 차후 verify-e2e Step 23 확장 sprint 필요"). broaden=true 옵션 시 다음 hierarchy 단계로 fallback.

2. **수정**: `apps/backend/test/helpers/test-permission-token.spec.ts` (신규 unit spec)
   - perm → 예상 narrow role 매핑 5종 검증 (CREATE_EQUIPMENT → technical_manager, APPROVE_CALIBRATION_PLAN → lab_manager, REVIEW_CALIBRATION_PLAN → quality_manager throw, MANAGE_SYSTEM_SETTINGS → lab_manager, PERFORM_DATA_MIGRATION → lab_manager(blacklist) — `system_admin`은 fallback only)
   - dead permission negative case (Permission enum 외부 값 강제)
   - broaden=true 동작 검증

### 검증

```bash
pnpm --filter backend run test test-permission-token.spec
pnpm tsc --noEmit
```

### Trade-off

- 헬퍼 호출 시 `loginAs` 1회 더 → 테스트당 ~30ms 추가. ResourceTracker fixture 패턴과 동일 비용. → SHOULD: token cache (test-auth.ts에 이미 적용된 패턴 재사용)는 본 sprint 외부.

---

## Phase 3: E2E spec actor token 정렬 검증 자동화

**목표:** verify-e2e Step 23/24/25를 grep guidance에서 실행 가능 invariant로 승격.

### 변경 파일

1. **신규**: `apps/backend/scripts/verify-e2e-actor-alignment.ts`
   - ts-morph로 `apps/backend/test/*.e2e-spec.ts` 파싱
   - 검출 룰:
     - **R1 (Step 25 strict)**: 파일명 `*permission*` / `*-scope*` / `*role-constraint*` 인 spec에서 `loginAs(*, 'systemAdmin')`이 actor token으로 사용되면 FAIL
     - **R2 (Step 24 strict)**: `test-fixtures.ts`의 `createTestEquipment` 시그니처가 `_token` 사용 미사용임을 정적 검증 (Phase 5 완료 후엔 시그니처 자체 변경 — 이 룰은 Phase 5 후 자동 통과)
     - **R3 (Step 23 strict)**: `test-auth.ts`의 `TestRole` 멤버 수 = `CANONICAL_ROLE` / `TEST_USERS` / `TEST_USER_IDS` 키 수 = `TEST_USER_DETAILS` 배열 길이 — 4-place 동치
     - **R4 (신규 invariant)**: spec에서 `loginAs(*, role)` 호출 시 actor 변수가 mutation 대상 endpoint 호출에 사용된다면, 해당 endpoint controller의 `@RequirePermissions` 메타데이터를 ts-morph로 reverse-resolve → role이 `getRolesWithPermission(perm)`에 포함되는지 검증. 미포함 시 FAIL with "spec asserts role X can call <endpoint>, but X lacks <perm>"
   - exit code: 위반 1+ → 1, 0건 → 0
   - 출력: 위반 spec 파일:라인 + 룰 ID + 수정 가이드

2. **수정**: `apps/backend/package.json`
   - `scripts.verify:e2e-actors`: `tsx scripts/verify-e2e-actor-alignment.ts`
   - devDependency: `ts-morph` 추가 (latest stable, 캐럿 잠금)

3. **수정**: `pnpm-lock.yaml` (자동 재생성)

4. **수정**: `.husky/pre-push`
   - line 50 인근 (env-sync 직후, tsc 직전) 단계 추가:
     ```
     echo "▶ pre-push: e2e actor alignment..."
     pnpm --filter backend run verify:e2e-actors
     ```
   - 위치 근거: tsc보다 먼저 실행해야 spec 파일 수정 후 빠른 피드백.

5. **수정**: `.claude/skills/verify-e2e/SKILL.md` Step 23/24/25 섹션
   - 실행 가능 검증으로 승격됨을 명시 + grep 명령은 보조 수단으로 강등
   - `pnpm verify:e2e-actors` 명령 단일 출처화

### 검증

```bash
pnpm --filter backend run verify:e2e-actors
# 기대: 0 violations (Phase 1-2 완료 후, Phase 5 완료 전엔 R2가 _token 시그니처 잔존 보고하나 deprecation 단계로 WARN 처리)
pnpm --filter backend run test --silent
pnpm tsc --noEmit
```

### Trade-off

- ts-morph 첫 실행은 module 빌드 ~500ms. pre-push 추가 비용 < 2초.
- R4는 ts-morph endpoint→permission resolution 정확도에 의존 — 동적 라우트 (`@Param`) 또는 method override는 분석 불가, conservative skip + WARN 출력.

---

## Phase 4: `lab-manager-permission-scope` E2E spec 신규 (MEDIUM)

**목표:** UL-QP-18 직무분리 — lab_manager가 장비 등록/승인/반출 신청 권한 박탈됨을 명시 회귀 가드.

### 변경 파일

1. **신규**: `apps/backend/test/lab-manager-permission-scope.e2e-spec.ts`
   - describe 텍스트: `'UL-QP-18 §4.2 직무분리: lab_manager 권한 스코프'`
   - 사용 헬퍼: Phase 2 `getTokenForPermission` 사용 (negative path 직접 확인 + 단순 `loginAs(app, 'admin')` 결합)
   - 케이스 매트릭스 (최소 5):
     - **TC-1 (positive)**: lab_manager는 VIEW_EQUIPMENT 가능 (200)
     - **TC-2 (negative — UL-QP-18 §4.2)**: lab_manager는 CREATE_EQUIPMENT 불가 (403, code `AUTH_INSUFFICIENT_PERMISSIONS`)
     - **TC-3 (negative)**: lab_manager는 APPROVE_EQUIPMENT 불가 (등록·승인 분리)
     - **TC-4 (negative)**: lab_manager는 CREATE_CHECKOUT 불가 (반출 신청 박탈)
     - **TC-5 (positive — boundary)**: lab_manager는 APPROVE_CALIBRATION_PLAN 가능 (최종 승인 권한 보유 — UL-QP-18 §4.3)
     - **TC-6 (positive)**: lab_manager는 APPROVE_DISPOSAL 가능 (폐기 최종 승인)
   - JSDoc 헤더에 UL-QP-18 §4.2/§4.3 명시 인용

### 검증

```bash
pnpm --filter backend run test:e2e lab-manager-permission-scope
# 기대: 6/6 PASS (CI 환경 + Phase 1-2 완료 전제)
```

### Trade-off

- 본 spec은 Phase 1-2 헬퍼에 의존 → Phase 1-2-4 순서 강제. Phase 3은 본 spec과 독립.

---

## Phase 5: `createTestEquipment(_token)` deprecation cleanup (LOW)

**목표:** `_token` 인자 제거 + 30+ 호출부 일괄 갱신.

### 변경 파일

1. **수정**: `apps/backend/test/helpers/test-fixtures.ts`
   - `createTestEquipment(app, _token, overrides?)` → `createTestEquipment(app, overrides?)`
   - JSDoc 갱신: deprecation 마커 제거, 자체 systemAdmin 토큰 발급만 명시

2. **수정 (codemod, 30+ 파일)**: `apps/backend/test/*.e2e-spec.ts` 중 `createTestEquipment` 호출자
   - regex: `createTestEquipment\(\s*ctx\.app\s*,\s*\w+Token\s*(?:,\s*({[^}]*}))?\s*\)` → `createTestEquipment(ctx.app$1)` (capture group 1: overrides)
   - 검증 명령: codemod 후 `grep -rn "createTestEquipment(.*Token" apps/backend/test/*.e2e-spec.ts` → 0 hit

3. **수정**: `.claude/exec-plans/tech-debt-tracker.md`
   - **다른 세션 충돌 회피**: 이 파일은 No-Touch Zone에 포함됨 → Phase 5 commit에서 직접 수정 금지. 대신 plan 완료 후 별도 follow-up commit (다른 세션과 시간 분리) 또는 본 Sprint 완료 시점에 다른 세션이 unlock된 뒤 추가.
   - **이 phase가 active상태에서는 tracker.md 수정하지 않는다**.

### 검증

```bash
grep -rn "createTestEquipment(.*Token" apps/backend/test/*.e2e-spec.ts
# 기대: 0 hits (헬퍼 시그니처에서 _token 제거 확인)

pnpm --filter backend run test:e2e
# 기대: 모든 e2e 스위트 통과 (Phase 4 신규 spec 포함)

pnpm tsc --noEmit
```

### Trade-off

- 30+ 파일 단일 commit → diff 큼. 그러나 mechanical 변환이라 review 비용 낮음.
- 회귀 위험: codemod regex가 multi-line/3rd argument(overrides) 누락 가능 → 검증 grep + tsc로 안전망.

---

## Cross-Phase Concerns (시니어 아키텍처 감사)

### SSOT 무결성

| SSOT | 신규/기존 | 의존성 |
|------|-----------|-------|
| `Permission` enum | 기존 (`packages/shared-constants/src/permissions.ts`) | 본 sprint 변경 0 |
| `UserRole` 타입 | 기존 (`packages/schemas`) | 본 sprint 변경 0 |
| `ROLE_PERMISSIONS` | 기존 (`role-permissions.ts:35`) | 본 sprint 변경 0 — **유일한 source** |
| `ROLE_PERMISSION_MATRIX` | **신규** (`role-permission-matrix.ts`) | `ROLE_PERMISSIONS`의 derived view (IIFE) |
| `TEST_USERS` / `TEST_USER_IDS` / `TEST_USER_DETAILS` / `CANONICAL_ROLE` | 기존 (`test-auth.ts`) | Phase 3 R3 룰이 4-place 정합 검증 |
| `getTokenForPermission` | **신규** (`test-permission-token.ts`) | matrix + TestRole alias 결합 |

→ **drift 방지**: matrix는 derived view라 손수 갱신 불가. `Permission` 추가 시 `ROLE_PERMISSIONS`에 매핑 추가 → matrix 자동 반영. Phase 3 R4가 controller decorator ↔ matrix 정합 추가 검증.

### 하드코딩 0

본 sprint에서 introduce되지 않는 하드코딩:
- 권한 string ('view:equipment' 등)은 모두 `Permission` enum 경유
- 역할 string ('lab_manager' 등)은 모두 `UserRole` / `UserRoleValues` 경유
- TestRole alias ('admin', 'manager', ...)는 `test-auth.ts` `TestRole` 유니언 SSOT

본 sprint에서 격상되는 매직값: 없음 (모든 source가 이미 SSOT). Phase 4 신규 spec에서 발견될 수 있는 하드코딩은 verify-hardcoding SKILL이 Mode 2 harness Evaluator에서 자동 차단.

### Workflow

- pre-push hook `+1` 단계 추가 (Phase 3). 기존 8단계 → 9단계.
- 시간 영향: ts-morph 첫 실행 ~500ms + ~1s scan = +1.5s. 전체 pre-push ~30s budget 내.
- bypass 전략: `git push --no-verify`는 기존 정책대로 비상시만 (본 sprint에서 정책 변경 없음).

### Performance

- Phase 1 IIFE: module-load 시 1회 ~0.5ms. backend startup에 추가 비용 미미.
- Phase 2 helper: per-test +30ms (loginAs 1회). 평균 e2e suite당 1-2회 호출 → 무시 가능.
- Phase 3 scanner: pre-push에서만 실행, runtime 영향 0.
- frontend bundle: matrix는 frontend가 import하지 않는 한 zero impact (tree-shake). 본 sprint에서 frontend import 없음 → bundle delta 0.

### Security

- **Production permission 검증 우회 없음**: matrix는 reverse-view라 PermissionsGuard.canActivate 로직(role-permissions.ts:121 `flatMap`)에 영향 0. Guard는 forward query(`ROLE_PERMISSIONS[role]`)만 사용 — matrix 사용처는 test-only.
- `getTokenForPermission`는 `loginAs` 경유 → `/auth/test-login` 엔드포인트 사용 → production 환경에서는 비활성화되는 dev-only 엔드포인트. 본 sprint에서 신규 production 진입점 0건.
- Phase 3 ts-morph는 build-time tool, runtime 비용 0, supply-chain risk: ts-morph는 dsherret/maintained, 1M weekly downloads. devDependency만이라 production 미반영.

### Accessibility

**N/A** — 본 sprint는 backend + test infra-only. UI 변경 0건. WCAG SC 적용 부분 없음.

### Observability

- Phase 3 invariant 위반 시: pre-push가 stdout에 위반 spec:line + 룰 ID + 수정 가이드 출력 → 즉시 가시화. 별도 dashboard/alerting 불필요 (commit 차단으로 충분).
- Phase 1 IIFE는 throw on inconsistent input (Permission enum value missing from ROLE_PERMISSIONS) → backend startup이 즉시 fail-close (fail-loud 신호).
- Future signal (이연): matrix mismatch가 production runtime에서 감지될 시나리오는 코드상 불가능 (derived view) → 별도 sentry breadcrumb 불필요.

### Test Matrix

| Phase | Positive | Negative | Scope/Boundary |
|-------|----------|----------|----------------|
| 1 | matrix가 모든 Permission key 보유 | Permission 외 값 → matrix key 부재 | round-trip 동치성 (forward ↔ reverse) |
| 2 | CREATE_EQUIPMENT → technical_manager 토큰 | dead permission throw | quality_manager(TestRole 미존재) → throw with actionable message |
| 3 | site-permissions.spec OK (이미 lab_manager 사용) | systemAdmin 사용 spec 위반 reproduce | controller @RequirePermissions ↔ matrix 정합 (R4) |
| 4 | lab_manager VIEW_EQUIPMENT 200 / APPROVE_CALIBRATION_PLAN 200 | lab_manager CREATE_EQUIPMENT 403 / APPROVE_EQUIPMENT 403 / CREATE_CHECKOUT 403 | UL-QP-18 §4.2/§4.3 직무분리 boundary |
| 5 | tsc + e2e suite 전체 PASS (codemod 후) | `_token` 잔존 시 R2 룰이 검출 | grep `_token` 0 hits |

### CAS 영향

**NO** — 본 sprint는 권한 정책/테스트 인프라만 변경. CAS는 mutation endpoint의 Versioned BaseService 패턴 (CLAUDE.md docs/references/cas-patterns.md)에 의존 — 본 sprint에서 mutation 경로/version 필드/cache invalidation 변경 0건. 명시적 NO.

### Dependency 검증 명령 (각 Phase 완료 시 실행 — pre-push 모방)

```bash
# Phase 1 완료 검증
pnpm --filter @equipment-management/shared-constants run test --silent
pnpm tsc --noEmit
grep -c "ROLE_PERMISSION_MATRIX\|getRolesWithPermission" packages/shared-constants/src/index.ts
# 기대: ≥ 2 (re-export 확인)

# Phase 2 완료 검증
pnpm --filter backend run test test-permission-token
pnpm tsc --noEmit

# Phase 3 완료 검증
pnpm --filter backend run verify:e2e-actors
# 기대: 0 violations (Phase 5 전이라 _token 잔존 → R2는 WARN 정책)
git diff .husky/pre-push  # 1단계 추가 확인

# Phase 4 완료 검증
pnpm --filter backend run test:e2e lab-manager-permission-scope

# Phase 5 완료 검증
grep -rn "createTestEquipment(.*Token" apps/backend/test/*.e2e-spec.ts
# 기대: 0 hits
pnpm --filter backend run test:e2e
# 기대: 14+1 suite 전체 PASS

# 전체 sprint 완료 검증 (pre-push 모방)
pnpm tsc --noEmit
pnpm --filter backend run lint:ci
pnpm --filter frontend run lint
pnpm --filter backend run test --silent
pnpm --filter backend run verify:e2e-actors
```

### WCAG SC

**N/A** — backend-heavy sprint, UI 변경 0건.

### Rollback 전략

각 Phase는 독립 commit으로 분리 → phase별 `git revert <SHA>` 가능.

| Phase | Rollback 명령 | 영향 |
|-------|--------------|------|
| 1 | `git revert <P1-SHA>` | matrix 미존재로 Phase 2-3 빌드 실패 → 전체 sprint 롤백 신호 |
| 2 | `git revert <P2-SHA>` | 헬퍼 미존재로 Phase 4 spec 빌드 실패 |
| 3 | `git revert <P3-SHA>` | pre-push 추가 단계 제거. 기존 verify-e2e SKILL grep guidance 복구 |
| 4 | `git revert <P4-SHA>` | lab_manager spec 미존재로 회귀 가드 부재. 권한 정책 회귀 시 사후 발견 가능 — 다른 phase는 동작 유지 |
| 5 | `git revert <P5-SHA>` | `_token` 시그니처 복구 → 30+ 호출부 자동 작동 (codemod 역방향이지만 시그니처 호환성 유지하므로 호출부 변경 불필요한 phase에서는 시그니처만 revert) |

**Cascading rollback**: Phase 1 revert는 2-3-4 컴파일 에러 유발 → 1+2+3+4 동시 revert 필요. Phase 5는 1-4와 독립.

### 예외 / 알려진 trade-off

- **quality_manager TestRole 미존재**: Phase 4 spec은 `'admin'` (lab_manager) 토큰만 사용. quality_manager scope 검증은 차후 sprint (verify-e2e Step 23 4-place 갱신 + jest-global-setup 시드 확장 필요). 트리거: quality_manager 권한 회귀 발견 시.
- **R4 룰 conservative**: ts-morph가 동적 라우트(@Param 의존)에서 endpoint↔permission 매핑 정확 분석 불가 → conservative skip + WARN. 누락된 invariant는 PermissionsGuard 런타임이 cover.

---

## Risk Register

| ID | 위험 | 확률 | 영향 | Mitigation |
|----|------|------|------|------------|
| R-1 | matrix IIFE가 module-load 시 throw → backend startup 실패 | LOW | HIGH | spec에서 enum 모든 값 검증 + try/catch 정상 throw 시나리오 unit test |
| R-2 | Phase 5 codemod regex가 multi-line createTestEquipment 호출 누락 | MED | LOW | tsc + e2e suite 통과 = 100% 검증 (build-time signal) |
| R-3 | Phase 3 R4 ts-morph가 controller method dispatch 분석 불가 → 거짓 위반 | LOW | MED | conservative skip + WARN 정책. unit test에 5 controller 샘플 정확 분석 보장 |
| R-4 | ts-morph supply-chain risk | VERY LOW | MED | dependabot + verify-supply-chain SKILL이 cover. devDependency만 |
| R-5 | 다른 세션이 `tech-debt-tracker.md` 수정 중 | MED | LOW | Phase 5에서 본 파일 수정 금지 (No-Touch Zone). 별도 follow-up commit으로 추후 추가 |
| R-6 | `lab_manager-permission-scope.e2e-spec.ts` jest-global-setup 시드 의존 누락 | LOW | MED | 시드는 이미 lab_manager 포함 (test-auth.ts:60-67). 추가 변경 0 |
| R-7 | `getTokenForPermission`가 system_admin fallback 과도 사용 | LOW | MED | hierarchy ascending 정렬 + opt-in broaden. unit test가 system_admin이 fallback only임을 보장 |

---

## Out-of-Scope (이연)

| 항목 | 트리거 |
|------|-------|
| `quality_manager` TestRole alias 신설 (4-place + jest-global-setup 시드) | quality_manager 권한 회귀 발견 시 또는 별도 sprint |
| frontend `PermissionGate` 컴포넌트가 matrix 사용하도록 격상 | UI에서 reverse query 필요해질 시 (예: "이 페이지 보려면 어떤 역할 필요?" 안내) |
| `useEffectiveRole` simulateRole audit log (이미 tech-debt-tracker 등재) | 별도 observability sprint |
| controller `@RequirePermissions` JSDoc 자동 생성 (matrix 기반) | DX 개선 sprint |
| matrix를 backend `permissions.guard.ts`도 사용하도록 통합 (forward query 통일) | 본 sprint는 forward query는 기존 `derivePermissionsFromRoles` 유지 (수술적 변경 원칙) |
| Phase 5 후 `createTestEquipment`의 다른 fixture(`createTestCable`, `createTestCheckout`)에도 동일 패턴 적용 | fixture 정비 sprint |

---

## Verification Gate (Pre-commit Self-Audit Checklist)

Phase별 commit 직전 7대 영역 점검:

- [ ] **L0 inferred**: 본 plan에 7개 L0 항목 명시 ✓
- [ ] **L4ext (확장 영향)**: matrix가 frontend import되지 않음 / pre-push +1단계 시간 영향 측정됨 ✓
- [ ] **관측성**: invariant violation 시 stdout 출력 + commit 차단 (별도 dashboard 불필요) ✓
- [ ] **테스트매트릭스**: 5 phase × positive/negative/scope 매트릭스 명시 ✓
- [ ] **CAS 영향**: 명시적 NO ✓
- [ ] **의존성 검증명령**: phase별 pnpm/grep 명령 명시 ✓
- [ ] **WCAG SC**: 명시적 N/A (backend-heavy) ✓
- [ ] **Pre-commit audit**: SSOT 경유/하드코딩 0/eslint-disable 0/접근성/워크플로 재사용 7개 항목 manual 점검

---

## 의사결정 로그

- 2026-05-01T00:30 — Planner: matrix를 새 SSOT로 만들지 vs derived view로 만들지 선택. ROLE_PERMISSIONS이 이미 SSOT라 derived view 채택 (AD-2). drift 원천 차단.
- 2026-05-01T00:45 — Planner: AST extraction(빌드타임) vs runtime IIFE 선택. runtime IIFE 채택 — frontend도 사용 가능 + bundle 비용 미미 (AD-2).
- 2026-05-01T01:00 — Planner: `getTokenForPermission` 다중 매칭 시 정렬. system_admin이 거의 모든 perm 보유라 첫 매칭 시 항상 system_admin = scope 우회 = Step 25 안티패턴 재발. hierarchy ascending(narrowest first) 채택 (AD-4).
- 2026-05-01T01:15 — Planner: pre-push 9단계 추가가 budget 초과인지 확인. ts-morph ~500ms + 1s scan = +1.5s, 전체 30s 내 → 채택.
- 2026-05-01T01:30 — Planner: Phase 5 codemod single commit vs phase별 분산. 30+ 파일이 mechanical 변환이고 5 phase 마지막에 위치하므로 다른 phase가 새 호출부 추가하지 않음 → single commit 채택 (AD-7).
- 2026-05-01T01:45 — Planner: tech-debt-tracker.md 다른 세션 수정 중. Phase 5에서 직접 수정 금지 명시 (No-Touch Zone 준수).

---

**Planner 서명**: senior-permission-ssot-20260501 plan rev-1 — 2026-05-01
