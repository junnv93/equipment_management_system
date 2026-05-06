# Permission & Role SSOT — verify-ssot references

> 2026-05-03 verify-ssot 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> 대상: Permission 임포트 소스, RolePermissionMatrix, useEffectiveRole SSOT, 권한 라벨 렌더링, UASVal approvals mappers.

## Step 2: Permission 임포트 소스 확인

모든 `Permission` 열거형은 `@equipment-management/shared-constants`에서 import해야 한다.
다른 파일에서 `Permission`을 재정의하거나 `@equipment-management/schemas`에서 import하면 SSOT 위반.

```bash
# Permission이 shared-constants 외 소스에서 import되는 패턴 탐지
grep -rn "import.*Permission\b" \
  apps/backend/src/modules apps/frontend \
  --include="*.ts" --include="*.tsx" \
  | grep -v "@equipment-management/shared-constants\|node_modules\|\.d\.ts\|//\|spec\|test"
# 기대: 0건 (모두 shared-constants 경유)
```

**PASS:** 모든 Permission이 `@equipment-management/shared-constants`에서 import.
**FAIL:** 다른 소스 사용 → `import { Permission } from '@equipment-management/shared-constants'`로 교체.

---

## Step 2a: Client-side `hasRole()` 금지 (role literal 기반 권한 게이트 탐지)

프론트엔드 컴포넌트/페이지에서 `useAuth().hasRole` 또는 role 리터럴 배열을 권한 게이트로 쓰는 패턴 금지.
2026-04-08 (49fb6d7e)에 role-based client gating이 전면 `can(Permission.X)`로 마이그레이션되어 백엔드 `@RequirePermissions`와 단일 SSOT를 공유.

```bash
# 컴포넌트/hook에서 hasRole 패턴 탐지
grep -rn "useAuth.*hasRole\|\.hasRole(" \
  apps/frontend/components apps/frontend/hooks \
  --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|//\|spec\|test"
# 기대: 0건

# role 리터럴 배열로 권한 게이트 구성하는 패턴
grep -rn "URVal\.\w\+.*URVal\." \
  apps/frontend/components apps/frontend/hooks \
  --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|//\|spec\|test"
# 기대: 0건
```

**PASS:** 프론트엔드 컴포넌트/페이지에 `useAuth().hasRole` 사용 0건. role 리터럴 배열을 권한 게이트로 쓰는 패턴 0건.
**FAIL:** client code에서 hasRole 또는 `[URVal.XXX, ...]`로 권한 결정 → `can(Permission.X)` 패턴으로 전환.

---

## Step 20: Permission 라벨 렌더링 SSOT

프론트엔드에서 권한 표시명을 i18n JSON이 아닌 TypeScript 상수(`PERMISSION_LABELS_LOCALIZED`)에서
직접 읽어야 함. `t.raw('profile.permissions.labels')` 패턴은 레거시이며 타입 안전성이 없음.

**배경:** `PERMISSION_LABELS_LOCALIZED: Record<string, Record<Permission, string>>`이
`@equipment-management/shared-constants`에서 export됨. `Record<Permission, string>` 타입이
컴파일 타임에 완전성을 강제 — 새 Permission 추가 시 `PERMISSION_LABELS_EN`에 누락이면 tsc 에러.

**20a: t.raw permission labels 레거시 패턴 탐지**
```bash
grep -rn "t\.raw.*profile\.permissions\.labels\|t\.raw.*permissions\.labels" \
  apps/frontend --include="*.tsx" --include="*.ts"
# 결과: 0건 (PERMISSION_LABELS_LOCALIZED[locale] 패턴으로 대체됨)
```

**20b: PERMISSION_LABELS_LOCALIZED SSOT 경유 확인**
```bash
grep -n "PERMISSION_LABELS_LOCALIZED" \
  apps/frontend/app/\(dashboard\)/settings/profile/ProfileContent.tsx
# 결과: import + 사용 2건 이상
```

**20c: settings.json labels 섹션 부재 확인 (TypeScript로 이관됨)**
```bash
grep -n '"labels"' apps/frontend/messages/ko/settings.json apps/frontend/messages/en/settings.json
# 결과: 0건 (labels 섹션은 TypeScript SSOT로 이관되어 JSON에 없어야 함)
```

**PASS:** 20a·20c 0건, 20b 2건 이상.
**FAIL:** t.raw 레거시 패턴 재도입 또는 settings.json에 labels 섹션 복원.

---

## Step 24: UnifiedApprovalStatus (UASVal) SSOT — approvals mappers

`mapCheckoutToApprovalItem` / `mapNonConformanceToApprovalItem` /
`mapInspectionToApprovalItem` 등 매핑 함수에서 `UnifiedApprovalStatus` 값을 raw 문자열 리터럴로
할당하는 패턴 탐지. `UnifiedApprovalStatusValues` (= `UASVal`)에서 상수를 경유해야 함.

> **2026-04-30 파일 구조 변경:** `approvals-api.ts`가 barrel로 전환되고 매핑 함수는 `approvals/mappers.ts`로 이동. 검증 대상 파일 경로가 변경됨.

**24a: approvals 매핑 파일 내 UnifiedApprovalStatus raw 리터럴 탐지**
```bash
# barrel + 실제 구현 파일 양쪽 검사 (2026-04-30 분할 이후)
grep -rn "status: 'pending'\|status: 'pending_review'\|status: 'approved'\|status: 'rejected'\|status: 'in_progress'" \
  apps/frontend/lib/api/approvals/ \
  apps/frontend/lib/api/approvals-api.ts \
  | grep -v "//\|import\|type\|interface"
# 결과: 0건 (UASVal.PENDING 등 SSOT 상수 경유)
```

**24b: UASVal import 확인 — mappers.ts**
```bash
grep -n "UnifiedApprovalStatusValues\|UASVal" apps/frontend/lib/api/approvals/mappers.ts | head -5
# 결과: import 라인 + 사용 라인 2건 이상 (mappers.ts가 실제 UASVal 소비처)
```

**PASS:** 24a 0건 + 24b mappers.ts에서 UASVal import 확인.
**FAIL:** raw 리터럴 직접 할당 발견 시 `UASVal.PENDING_REVIEW` 등 상수로 교체.

> **배경:** 2026-04-22 verify-implementation에서 `status: 'pending_review'`(L1142), `status: 'pending'`(L1165, L1192) 3건 발견. 현재 값이 SSOT 값과 우연히 일치하여 런타임 버그는 없으나, 향후 SSOT 값 변경 시 무결성 보장 불가. 2026-04-30에 `approvals/mappers.ts`로 이관 후 UASVal 경유 패턴 확립.

**관련 파일:**
- `apps/frontend/lib/api/approvals/mappers.ts` — 매핑 함수 SSOT (2026-04-30 이후)
- `apps/frontend/lib/api/approvals-api.ts` — barrel re-export (2026-04-30 이후)

---

## Step 37: `useEffectiveRole` SSOT — 클라이언트 컴포넌트의 `session.user.role` 직접 참조 금지

**규칙**: 대시보드 + 모든 클라이언트 컴포넌트/hook에서 역할 기반 UI 분기 시 반드시 `useEffectiveRole().effectiveRole`을 경유. `useSession().data.user.role` 또는 `session.user.role` 직접 참조는 시뮬레이션 모드(`?simulateRole=`)를 우회하여 SYSTEM_ADMIN의 역할 미리보기 기능을 무력화시킨다.

**근거**: `useEffectiveRole`은 SYSTEM_ADMIN이 `?simulateRole=...` 쿼리 파라미터로 다른 역할 UI를 미리볼 수 있게 한다. 백엔드 권한은 항상 JWT의 `actualRole` 기준이지만 UI는 `effectiveRole`로 분기. 컴포넌트가 raw `session.user.role`을 읽으면 시뮬 의도가 깨진다.

**검증 명령**:
```bash
# 클라이언트 컴포넌트/hook/app 에서 session.user.role 직접 참조 탐지
# Server Component (page.tsx, layout.tsx server) + lib/auth NextAuth callback 정당 — 명시 예외
grep -rEn "session\??\.user\??\.role" \
  apps/frontend/components apps/frontend/hooks apps/frontend/app \
  --include='*.ts' --include='*.tsx' \
  | grep -v "use-effective-role" \
  | grep -v "// allow:" \
  | grep -v "/lib/auth\.ts:" \
  | grep -v "/lib/auth/server-session\.ts:" \
  | grep -v "(dashboard)/page\.tsx:" \
  | grep -v "(dashboard)/calibration/register/page\.tsx:" \
  | grep -v "(dashboard)/admin/data-migration/page\.tsx:" \
  | grep -v "(dashboard)/admin/monitoring/page\.tsx:" \
  | grep -v "(dashboard)/software/layout\.tsx:" \
  | grep -v "(dashboard)/admin/approvals/page\.tsx:" \
  | grep -v "node_modules"
# 기대: 0건 (모든 client 사용처는 useEffectiveRole 경유)
```

**Baseline (2026-05-06 ssot-recovery-3finding sprint Phase 3A 후)**:
- client 사용처 0건 — 12 files 마이그레이션 완료 (DashboardClient/RecentActivities/WelcomeHeader/PendingApprovalCard/CalibrationPlansContent/CreateCalibrationPlanContent/AuditLogsContent/SettingsNavigationClient/DashboardShell/CheckoutGroupCard/CheckoutDetailClient/use-checkout-next-step)
- server 정당 예외 8 files: lib/auth.ts / lib/auth/server-session.ts / 6 server pages·layout
- React Hooks rule 주의: useEffectiveRole는 early return 전 호출 (조건부 호출 금지)

**PASS**:
1. `useEffectiveRole` 외 컴포넌트/hook이 `session.user.role`을 읽지 않음
2. SYSTEM_ADMIN의 `?simulateRole=test_engineer` 쿼리가 dashboard layout/cards 모두에 일관 적용됨
3. 백엔드 API 호출은 항상 JWT actualRole 기준 (RoleGate JSDoc 명시)

**FAIL**:
- 컴포넌트에서 `useSession()`으로 `session.user.role` 추출 후 분기 — 시뮬 우회
- 새 hook이 raw role을 받아 분기하면서 useEffectiveRole 호출 누락

**예외**:
- `apps/frontend/app/**/page.tsx` (Server Component) — NextAuth session 사용, 시뮬 미적용 의도
- `hooks/use-effective-role.ts` 자체 — SSOT 정의

**관련 파일**:
- `apps/frontend/hooks/use-effective-role.ts` — SSOT
- `apps/frontend/components/auth/RoleGate.tsx` — UI 게이트 (UI-only 명시)
- `apps/frontend/components/dashboard/DashboardClient.tsx` — 다중 useQuery enabled 분기

**발생 이력 (2026-04-28)**: dashboard redesign에서 SYSTEM_ADMIN simulateRole 기능 도입. 컴포넌트가 raw role 사용 시 시뮬 깨짐 → SSOT 경유 강제 룰 추가.

---

## Step 57: `RolePermissionMatrix` derived view 정책 — 직접 데이터 추가 금지

`packages/shared-constants/src/role-permission-matrix.ts`의 `ROLE_PERMISSION_MATRIX`는 **`ROLE_PERMISSIONS`의 reverse-index view**다. matrix 자체가 SSOT가 아니며 module-load IIFE가 도출한 derived 결과. 매트릭스에 직접 데이터를 추가하면 **두 SSOT가 발생**하여 drift가 보장된다.

**위반 패턴:**

```typescript
// ❌ WRONG — matrix 파일에 손수 매핑 추가
export const ROLE_PERMISSION_MATRIX: RolePermissionMatrix = {
  [Permission.NEW_PERMISSION]: ['system_admin'],  // ← 손수 추가
  ...derivePermissionRoleMatrix(),
};

// ❌ WRONG — matrix import 위치에 두 번째 데이터 source
import { CUSTOM_PERMISSION_MAPPING } from './custom-mappings';  // ← 외부 source
```

```typescript
// ✅ CORRECT — ROLE_PERMISSIONS만이 source, matrix는 자동 도출
// 신규 권한 추가 시:
//   1. permissions.ts: Permission enum에 키 추가 + PERMISSION_LABELS(ko/en) 추가
//   2. role-permissions.ts: ROLE_PERMISSIONS의 보유 역할에 추가
//   3. matrix는 자동 반영 (수정 불필요)
```

**탐지:**

```bash
# 1. matrix 파일이 ROLE_PERMISSIONS + Permission 외 데이터 source import 검출
grep -nE "^import" packages/shared-constants/src/role-permission-matrix.ts \
  | grep -vE "(UserRole|Permission|ROLE_PERMISSIONS)"
# 기대: 0건 (UserRole 타입 + Permission enum + ROLE_PERMISSIONS 외 import 0)

# 2. matrix 파일에 직접 매핑(콜론 + 배열) 인라인 검출 — IIFE 외부에서 손수 매핑 추가 차단
grep -nE "Permission\.\w+:\s*\[" packages/shared-constants/src/role-permission-matrix.ts
# 기대: 0건 (모든 매핑은 derivePermissionRoleMatrix() 함수 내부에서 자동 도출)

# 3. 양방향 query API SSOT 활용 — 신규 코드는 matrix 경유 권장
grep -rn "ROLE_PERMISSIONS\[.*\]\.includes\|ROLE_PERMISSIONS\[.*\]\.filter" \
  apps/backend/src apps/frontend/components apps/frontend/hooks \
  --include="*.ts" --include="*.tsx" \
  | grep -v "role-permissions.ts\|role-permission-matrix.ts\|node_modules"
# 결과: 직접 인라인 사용처 발견 시 `getRolesWithPermission()` 또는 `roleHasPermission()` 경유로 격상 검토
```

**SSOT 의존성 체인:**
- `Permission` enum (`permissions.ts`) — 권한 키 source
- `UserRole` 타입 (`@equipment-management/schemas`) — 역할 키 source
- `ROLE_PERMISSIONS` (`role-permissions.ts`) — 역할-권한 매핑 source (forward query)
- `ROLE_PERMISSION_MATRIX` (`role-permission-matrix.ts`) — derived view (reverse query)
- `getTokenForPermission` (`apps/backend/test/helpers/test-permission-token.ts`) — matrix 활용 헬퍼

**위반 시 영향:**
- matrix 손수 매핑 → `ROLE_PERMISSIONS` 갱신 시 두 곳 누락 위험 (CI 검증 부재)
- 새 SSOT 데이터 source → drift 보장, dead permission 검출 무력화
- matrix 외부 import → 빌드 환경별 resolve 차이로 frontend bundle bloat 가능성

**자동 검증:**
- Phase 1 spec (`packages/shared-constants/__tests__/role-permission-matrix.spec.ts`)이 `ROLE_PERMISSIONS`와 양방향 round-trip + Permission enum 완전성 검증
- Phase 3 정적 분석기 R4 룰이 controller `@RequirePermissions(P_X)` ↔ matrix 정합 (dead permission) 검출

**관련 파일:**
- `packages/shared-constants/src/role-permission-matrix.ts` — derived view + IIFE
- `packages/shared-constants/__tests__/role-permission-matrix.spec.ts` — 18 케이스 spec
- `apps/backend/test/helpers/test-permission-token.ts` — matrix 활용 헬퍼
- `apps/backend/scripts/verify-e2e-actor-alignment.ts` — R4 룰 (matrix consistency)

**발생 이력 (2026-05-02 신설)**: senior-permission-ssot-20260501 sprint Phase 1에서 `ROLE_PERMISSIONS`의 reverse-index view 신설. 시니어 표준 자기 검토에서 SSOT 정책이 SKILL doc에 미반영된 점 발견하여 즉시 추가 (별도 sprint 이연 회피).
