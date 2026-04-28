# Dashboard Redesign — Manage-Skills 평가 보고서

**생성일:** 2026-04-28  
**세션:** 대시보드 리디자인 (대시보드 개선안 §1.1~§A.19)  
**분석 범위:** 7개 신규 패턴 → 기존 스킬 업데이트/신규 스킬 생성 여부 결정

---

## 1. 패턴별 커버리지 분석

### 패턴 1: Dashboard Thresholds SSOT

**파일:** `packages/shared-constants/src/dashboard-thresholds.ts`  
**소비처:** `apps/frontend/lib/design-tokens/components/dday-tone.ts` + `apps/backend/src/modules/dashboard/dashboard.service.ts`  
**위험:** 향후 기여자가 임계값을 컴포넌트/서비스에 인라인 하드코딩  
**커버 스킬:** `verify-ssot` — SSOT import 패턴 검증, `verify-hardcoding` — Step 29 `*_WINDOW_MS` 시간 상수 유사 패턴  
**판정:** `verify-ssot` **업데이트** (Step 35 추가) — `dashboard-thresholds.ts` SSOT 신규 소비 패턴 등록

---

### 패턴 2: Dual-Mode Component (Controlled/Uncontrolled Hybrid)

**파일:** `apps/frontend/components/dashboard/cards/CheckoutCard.tsx`  
**패턴:** `isControlled = upcomingProp !== undefined && overdueProp !== undefined`  
**위험:** props 쌍 중 하나만 전달 (비대칭 상태) → `isControlled=false`인데 일부 prop이 주입되어 자체 fetch + props 혼용  
**커버 스킬:** `verify-frontend-state` — 상태 관리 패턴. 현재 이 패턴을 명시적으로 다루는 Step 없음  
**판정:** `verify-frontend-state` **업데이트** (Step 24 추가) — dual-mode asymmetric props 탐지

---

### 패턴 3: RoleGate + simulateRole

**파일:** `apps/frontend/components/auth/RoleGate.tsx`, `apps/frontend/hooks/use-effective-role.ts`  
**패턴:** `SYSTEM_ADMIN`이 `?simulateRole=` 쿼리로 다른 역할 UI 시뮬, UI는 `effectiveRole` 사용 / 백엔드는 `actualRole` 유지  
**위험:** 개발자가 `session.user.role`을 직접 참조하여 시뮬레이션 우회  
**실측:** `app/(dashboard)/page.tsx`에서 `session.user.role` 직접 사용 확인 (SSC — 시뮬 불필요, 허용), `DashboardClient.tsx`는 `useEffectiveRole()` 경유  
**커버 스킬:** `verify-ssot` Step 2a (client-side hasRole 금지)가 일부 관련. 별도 `effectiveRole` 준수 검증은 없음  
**판정:** `verify-ssot` **업데이트** (Step 36 추가) — `useEffectiveRole` SSOT 경유 검증

---

### 패턴 4: DashboardCardErrorBoundary 카드별 격리

**파일:** `apps/frontend/components/dashboard/DashboardCardErrorBoundary.tsx`  
**패턴:** 각 대시보드 카드를 개별 ErrorBoundary로 감싸 단일 카드 오류가 Row 전체를 크래시하지 않음  
**실측:** Row3(42건), Row4(11건) 모두 `DashboardCardErrorBoundary`로 정상 래핑. `RecentActivities`, `TeamEquipmentDistribution`, `MiniCalendar`도 포함  
**위험:** 신규 Row 추가 시 래핑 누락  
**커버 스킬:** 없음  
**판정:** **신규 스킬 후보 — `verify-error-boundary`** (우선순위 낮음, 현재 100% 준수 확인됨)

---

### 패턴 5: OfflineBanner + useOnlineStatus

**파일:** `apps/frontend/hooks/use-online-status.ts`, `apps/frontend/components/dashboard/OfflineBanner.tsx`  
**패턴:** `navigator.onLine + online/offline` 이벤트 + `lastOnlineAt` 추적  
**위험:** 다른 페이지에서 독자적인 오프라인 감지 로직 생성  
**커버 스킬:** `verify-frontend-state` Step 21의 `useOnboardingHint` SSOT 훅 패턴과 동일 구조 — 훅 재사용 강제 패턴  
**판정:** `verify-frontend-state` **업데이트** (Step 21의 useOnboardingHint 섹션에 `useOnlineStatus` 병기)

---

### 패턴 6: Skeleton-per-Card 패턴

**파일:** `apps/frontend/components/dashboard/skeletons/*.tsx` (7개)  
**패턴:** 각 카드가 구조 일치 전용 스켈레톤 + i18n sr-only 텍스트 포함  
**실측:** Row4의 `dynamic()` loading에서 `RecentActivities`, `TeamEquipmentDistribution`, `MiniCalendar`에 전용 스켈레톤 대신 `<Skeleton className="...">` 제네릭 사용 확인 — 규칙 위반 후보  
**위험:** 신규 카드가 전용 스켈레톤 대신 제네릭 `<Skeleton>` 사용  
**커버 스킬:** 없음  
**판정:** `verify-design-tokens` **업데이트** (Step 42 추가) — dynamic() loading의 skeleton 커버리지 검증

---

### 패턴 7: EmptyState 3-Variant (neutral/success/error)

**파일:** `apps/frontend/components/dashboard/atoms/EmptyState.tsx`  
**패턴:** `variant="error"` 추가 → ErrorBoundary 폴백에서 `role="alert"` 자동 적용  
**위험:** 개발자가 ErrorBoundary 폴백에 인라인 에러 UI 작성  
**커버 스킬:** `verify-design-tokens` Step 38 (AlertBanner severity → ARIA role 분기)와 유사 원칙  
**판정:** `verify-design-tokens` **업데이트** (Step 38 확장 또는 Step 43 추가) — `DashboardCardErrorBoundary` fallback이 `EmptyState variant="error"` 경유인지 확인

---

## 2. 우선순위별 권고 목록

### 우선순위 P1 (HIGH) — 즉시 업데이트

#### A. `verify-ssot` — Step 35: Dashboard Thresholds SSOT 검증

**추가 이유:** `DDAY_THRESHOLDS`, `UTILIZATION_GAUGE_THRESHOLDS`, `DISTRIBUTION_BAR_THRESHOLDS`, `SYSTEM_HEALTH_THRESHOLDS`, `SYSTEM_HEALTH_GAUGE_CAPS`, `SYSTEM_HEALTH_OVERALL_THRESHOLDS` 6개 상수가 `packages/shared-constants/src/dashboard-thresholds.ts`에서만 정의·소비되어야 한다. 프론트엔드·백엔드 양쪽이 같은 임계값을 보장하는 핵심 SSOT다.

**탐지 명령어 (예시):**
```bash
# 프론트엔드에서 인라인 임계값 하드코딩 탐지
grep -rn "daysUntilDue.*[<>].*7\|days.*<.*30\|days > 0" \
  apps/frontend/components/ apps/frontend/lib/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "DDAY_THRESHOLDS\|shared-constants\|dday-tone\|//\|test"

# 백엔드에서 임계값 하드코딩 탐지
grep -rn "utilizationPct.*[<>].*60\|utilizationPct.*[<>].*40" \
  apps/backend/src/modules/dashboard/ \
  --include="*.ts" \
  | grep -v "UTILIZATION_GAUGE_THRESHOLDS\|shared-constants\|//\|test"
```

**관련 파일:** `packages/shared-constants/src/dashboard-thresholds.ts`, `apps/frontend/lib/design-tokens/components/dday-tone.ts`, `apps/backend/src/modules/dashboard/dashboard.service.ts`

---

#### B. `verify-design-tokens` — Step 42: 대시보드 카드 스켈레톤 커버리지 검증

**추가 이유:** `apps/frontend/components/dashboard/skeletons/`에 7개 전용 스켈레톤이 있음에도 `DashboardRow4.tsx`의 `RecentActivities`, `TeamEquipmentDistribution`, `MiniCalendar`의 `dynamic()` loading에 제네릭 `<Skeleton className="...">` 사용이 잔존. i18n sr-only 텍스트 없는 스켈레톤은 접근성 위반이기도 함.

**탐지 명령어:**
```bash
# dynamic() loading에서 전용 Skeleton 대신 제네릭 Skeleton 사용 탐지
grep -n "loading: () => <Skeleton" \
  apps/frontend/components/dashboard/layout/*.tsx
# 결과: 0건 (모두 전용 Skeleton 컴포넌트 사용) 기대
# 현재: DashboardRow4.tsx에 RecentActivities/TeamEquipmentDistribution/MiniCalendar가 제네릭 Skeleton 사용

# 대시보드 스켈레톤 파일 목록 — 신규 카드 추가 시 대응 스켈레톤 존재 확인
ls apps/frontend/components/dashboard/skeletons/ | grep -v '^__tests__$'
```

**관련 파일:** `apps/frontend/components/dashboard/layout/DashboardRow3.tsx`, `DashboardRow4.tsx`, `apps/frontend/components/dashboard/skeletons/`

---

### 우선순위 P2 (MEDIUM) — 다음 세션 업데이트

#### C. `verify-ssot` — Step 36: `useEffectiveRole` SSOT 경유 검증

**추가 이유:** 대시보드 클라이언트 컴포넌트는 역할 기반 UI 분기 시 `useEffectiveRole().effectiveRole`을 경유해야 한다. `session.user.role` 직접 참조는 시뮬레이션 모드를 우회한다.

**탐지 명령어:**
```bash
# 클라이언트 컴포넌트에서 session.user.role 직접 참조 탐지
grep -rn "session\.user\.role" \
  apps/frontend/components/ apps/frontend/hooks/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "auth.ts\|//\|type\|interface\|as UserRole\|node_modules"
# 결과: 0건 기대 (컴포넌트에서 useEffectiveRole() 경유)
# 예외: apps/frontend/app/ 하위 Server Component — 시뮬 불필요, 직접 참조 허용
```

**예외:** `app/(dashboard)/page.tsx` 같은 Server Component — NextAuth session 사용, 시뮬레이션 미적용 의도적 패턴.

---

#### D. `verify-frontend-state` — Step 24: Dual-Mode 비대칭 props 탐지

**추가 이유:** `isControlled = propA !== undefined && propB !== undefined` 패턴에서 `propA`만 전달하고 `propB`를 누락하면 `isControlled=false`이 되어 자체 fetch가 활성화되어 props+fetch 혼용 버그 발생.

**탐지 명령어:**
```bash
# isControlled 패턴 파일 탐지
grep -rn "isControlled\s*=.*!==.*undefined.*&&.*!==.*undefined" \
  apps/frontend/components/ \
  --include="*.tsx" \
  | head -10
# isControlled 컴포넌트에서 단일 prop만 전달하는 소비처 탐지는 수동 검토 필요
```

---

#### E. `verify-frontend-state` — Step 21 확장: `useOnlineStatus` SSOT 훅 병기

**추가 이유:** `useOnboardingHint` SSOT 훅 패턴과 동일 구조. `useOnlineStatus`도 재사용 필수 훅이며, 다른 페이지에서 독자적 offline 감지 패턴 방지 필요.

**탐지 명령어:**
```bash
# useOnlineStatus 없이 navigator.onLine 직접 사용 탐지
grep -rn "navigator\.onLine\|'online'\|'offline'" \
  apps/frontend/components/ apps/frontend/app/ apps/frontend/hooks/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "use-online-status\|//\|node_modules"
# 결과: 0건 (useOnlineStatus 훅 경유)
```

---

#### F. `verify-design-tokens` — Step 43: ErrorBoundary fallback `EmptyState variant="error"` 경유

**추가 이유:** `DashboardCardErrorBoundary`는 `EmptyState variant="error"`를 통해 `role="alert"` ARIA live region을 올바르게 설정한다. 인라인 에러 UI 작성 시 접근성 위반 및 디자인 일관성 파괴.

**탐지 명령어:**
```bash
# ErrorBoundary fallback에서 인라인 에러 div 탐지
grep -rn "componentDidCatch\|getDerivedStateFromError" \
  apps/frontend/components/ \
  --include="*.tsx" \
  | grep -v "DashboardCardErrorBoundary\|node_modules" | head -10
# getDerivedStateFromError가 있는 ErrorBoundary 클래스가 EmptyState variant="error" 없이 직접 에러 렌더 탐지
grep -rn "getDerivedStateFromError" \
  apps/frontend/components/ --include="*.tsx" \
  | grep -v "node_modules"
# 결과: DashboardCardErrorBoundary만 존재해야 함
```

---

### 우선순위 P3 (LOW) — 신규 스킬 생성 후보

#### G. 신규 스킬: `verify-error-boundary` — **현재는 불필요 (Defer)**

**근거:** Row3(42건)·Row4(11건) 전 카드가 `DashboardCardErrorBoundary`로 100% 래핑 확인. 현재 위반 사례 없음. 패턴이 3개 이상 파일에 추가되고 누락 사례가 실제로 발생할 때 신규 스킬로 격상 권고.

**잠재 탐지 (참고용):**
```bash
# Row 레이아웃 파일에서 DashboardCardErrorBoundary 없이 카드 컴포넌트 직접 렌더 탐지
grep -rn "^.*<\(CheckoutCard\|CalibrationDdayList\|SystemHealthCard\|PendingApprovalCard\)" \
  apps/frontend/components/dashboard/layout/ --include="*.tsx" \
  | grep -v "DashboardCardErrorBoundary\|//"
```

---

#### H. 신규 스킬: `verify-skeleton-coverage` — **현재는 불필요 (Defer)**

**근거:** Row4에서 `RecentActivities`, `TeamEquipmentDistribution`, `MiniCalendar`의 제네릭 Skeleton 잔존이 탐지되었으나, 이는 Step 42(verify-design-tokens 업데이트)로 충분히 커버 가능. 독립 스킬로 분리하기에는 스코프가 좁음. 대시보드 외 페이지로 skeleton-per-card 패턴이 확산될 때 재검토.

---

## 3. `verify-i18n` 관련 분석

**대시보드 i18n 상태:**
- `apps/frontend/messages/ko/dashboard.json` ↔ `apps/frontend/messages/en/dashboard.json` 키 쌍: 완전 일치 (missingInEn=[], missingInKo=[])
- 스켈레톤 sr-only 텍스트: 모두 `t()` 경유 (하드코딩 없음) — `CheckoutCardSkeleton.tsx`, `ReviewPendingHeroSkeleton.tsx`, `MyActivityCardSkeleton.tsx`, `SystemHealthSkeleton.tsx`, `DDayListSkeleton.tsx`, `MyQuickSummarySkeleton.tsx`, `PendingApprovalSkeleton.tsx`

**판정:** `verify-i18n` 업데이트 **불필요** — 현재 구현이 올바름. Step 1~2에서 dashboard.json 쌍이 이미 자동 검사됨.

---

## 4. CLAUDE.md "Useful Skills" 섹션 변경 불필요

현재 CLAUDE.md는 스킬을 개별 나열하지 않고 ".claude/skills/ 디렉토리에 25+ 커스텀 스킬"과 "verify-* 19개" 범주로 언급. 새 스킬이 생성되지 않으므로 변경 불필요. P3 스킬이 확정될 시 업데이트 필요.

---

## 5. 요약 테이블

| 우선순위 | 대상 스킬 | 액션 | 패턴 | 근거 |
|---|---|---|---|---|
| P1 | `verify-ssot` Step 35 | **업데이트** | Dashboard Thresholds SSOT | 6개 임계값 상수 인라인 하드코딩 방지 |
| P1 | `verify-design-tokens` Step 42 | **업데이트** | dynamic() Skeleton 커버리지 | Row4 제네릭 Skeleton 잔존 실측 |
| P2 | `verify-ssot` Step 36 | **업데이트** | useEffectiveRole SSOT 경유 | 시뮬레이션 우회 방지 |
| P2 | `verify-frontend-state` Step 24 | **업데이트** | Dual-Mode 비대칭 props | isControlled 절반 주입 버그 방지 |
| P2 | `verify-frontend-state` Step 21 확장 | **업데이트** | useOnlineStatus SSOT 훅 | navigator.onLine 인라인 사용 방지 |
| P2 | `verify-design-tokens` Step 43 | **업데이트** | ErrorBoundary fallback 토큰 | EmptyState variant="error" 강제 |
| P3 | `verify-error-boundary` (신규) | **Defer** | 카드별 ErrorBoundary 래핑 | 현재 100% 준수, 실 위반 없음 |
| P3 | `verify-skeleton-coverage` (신규) | **Defer** | 전용 Skeleton 커버리지 | Step 42로 흡수, 스코프 좁음 |

---

## 6. manage-skills SKILL.md 등록 테이블 업데이트 항목

`manage-skills/SKILL.md`의 "등록된 검증 스킬" 테이블에서:

- **`verify-ssot`**: 커버 파일 패턴에 `packages/shared-constants/src/dashboard-thresholds.ts` 명시 + Step 35/36 설명 추가
- **`verify-design-tokens`**: Step 42 (dynamic skeleton 커버리지), Step 43 (ErrorBoundary fallback EmptyState) 추가
- **`verify-frontend-state`**: Step 24 (dual-mode asymmetric props), Step 21 확장 (useOnlineStatus SSOT) 추가
