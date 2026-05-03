# Threshold & Magic Number SSOT — verify-ssot references

> 2026-05-03 verify-ssot 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> 대상: 대시보드/반출 D-day 임계값, 테스트 hardcoded threshold, Visual layer 분리, calculateDaysRemaining, EXTENDED_TEXT_MAX_LENGTH, pagination SSOT, computeUrgency, config 파생 boolean, 도메인 유틸 상수.

## Step 16: 도메인 유틸 상수 SSOT 검증

`isCheckoutExportable` / `NON_EXPORTABLE_CHECKOUT_STATUSES` 등 도메인 유틸 파일에서 추출된 상수가
다른 파일에서 로컬 재정의 없이 SSOT 헬퍼를 경유하는지 확인.

**16a: NON_EXPORTABLE_CHECKOUT_STATUSES 로컬 재정의 금지**
```bash
# checkout-exportability.ts 외 파일에서 NON_EXPORTABLE 상수를 로컬 정의하면 SSOT 위반
grep -rn "NON_EXPORTABLE_CHECKOUT_STATUSES\s*=" \
  apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "checkout-exportability.ts"
# 결과: 0건
```

**16b: nonExportableStatuses 인라인 배열 금지 (이전 인라인 규칙 잔재 탐지)**
```bash
# CheckoutDetailClient 등에서 [CSVal.PENDING, CSVal.REJECTED] 인라인 배열로 판단하는 패턴 잔재 없어야 함
grep -rn "nonExportableStatuses\s*=" \
  apps/frontend --include="*.ts" --include="*.tsx"
# 결과: 0건 (isCheckoutExportable() SSOT 경유)
```

**16c: SSOT 소비 확인**
```bash
# isCheckoutExportable이 사용되는 모든 파일이 checkout-exportability.ts에서 import하는지 확인
grep -rn "isCheckoutExportable" \
  apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "checkout-exportability"
# 결과: import 라인만 존재 (정의 라인 없어야 함)
```

**PASS:** 16a·16b 0건 + 16c import 라인만.
**FAIL:** 로컬 재정의 또는 인라인 배열 발견 → `isCheckoutExportable()` SSOT 경유로 교체.

---

## Step 31: `computeUrgency` SSOT — 인라인 시간 계산 금지

긴급도(urgency) 계산은 `@equipment-management/schemas`의 `computeUrgency` SSOT 함수를 경유해야 한다.
`48 * 60 * 60 * 1000` 같은 인라인 시간 상수 + 직접 비교는 임계값 변경 시 SSOT와 분리된다.

```typescript
// ❌ 인라인 계산 — SSOT 분리
const msUntilDue = new Date(dueAt).getTime() - Date.now();
const urgency = msUntilDue < 0 ? 'critical' : msUntilDue < 48 * 60 * 60 * 1000 ? 'warning' : 'normal';

// ✅ SSOT 경유
import { computeUrgency } from '@equipment-management/schemas';
import type { CheckoutStatus } from '@equipment-management/schemas';

// 승인 컨텍스트: status='pending'으로 고정 — UnifiedApprovalStatus에 'overdue' 없으므로
// overdue→critical 단락 비활성화 후 날짜 기반 로직만 사용
const urgency = computeUrgency({ status: 'pending' as CheckoutStatus, dueAt });
```

**탐지 — `computeUrgency` 미경유 인라인 긴급도 계산:**
```bash
# 48 * 60 * 60 * 1000 또는 86400000 (1일) 시간 상수 탐지
grep -n "48 \* 60\|86_400_000\|86400000" \
  apps/frontend/components/**/*.tsx apps/frontend/lib/**/*.ts 2>/dev/null

# msUntilDue 등 인라인 긴급도 변수명 탐지
grep -n "msUntilDue\|msUntil\|urgencyMs" \
  apps/frontend/components/**/*.tsx apps/frontend/lib/**/*.ts 2>/dev/null

# computeUrgency를 경유하지 않고 urgency를 직접 계산하는 패턴
grep -n "urgency.*critical\|urgency.*warning\|urgency.*normal" \
  apps/frontend/components/**/*.tsx 2>/dev/null \
  | grep -v "computeUrgency\|t(\|className\|tokens\|design"
```

**PASS:** 긴급도 계산 전부 `computeUrgency` 경유.
**FAIL:** 인라인 시간 상수 → `computeUrgency` 교체.

**Note — 승인 컨텍스트 `status: 'pending' as CheckoutStatus`:**
`UnifiedApprovalStatus`에는 `'overdue'` 값이 없어 `item.status as CheckoutStatus`는 타입 거짓말.
`computeUrgency` 내부의 `overdue→critical` 단락을 우회하고 날짜 기반 로직만 실행하기 위해
`'pending' as CheckoutStatus`로 고정하는 것이 의도적 패턴.

**관련 파일:**
- `packages/schemas/src/fsm/checkout-fsm.ts` — `computeUrgency` 정의
- `apps/frontend/components/approvals/ApprovalDetailModal.tsx` — 도입 컴포넌트 (2026-04-27)

---

## Step 32: config 객체 파생 boolean 필드 → 수치 SSOT

설정 객체(TabMeta 등)에서 `boolean` 필드가 다른 수치 필드에서 **파생 가능**하면, boolean을 제거하고 수치 필드를 SSOT로 유지해야 한다. boolean은 수치의 중복 표현이므로 값이 어긋날 위험이 있다.

**패턴:** `multiStep?: boolean` 같은 필드가 `totalApprovalSteps: number`에서 `> 1`로 도출 가능하면 → boolean 제거.

```typescript
// ❌ boolean + 수치 중복 — drift 위험
interface TabMeta {
  multiStep?: boolean;        // totalApprovalSteps > 1과 중복
  totalApprovalSteps: number;
}

// ✅ 수치 SSOT 단일화
interface TabMeta {
  totalApprovalSteps: number; // 1=단일, 2=disposal, 3=calibration_plan
}
// 소비처: const isMultiStep = meta.totalApprovalSteps > 1;
```

**탐지 — approvals-api.ts TabMeta (barrel + 실제 구현 파일 양쪽 검사):**
```bash
# multiStep boolean 재도입 탐지 — barrel + 구현 파일(approvals/types.ts) 양쪽
# (2026-04-30: approvals-api.ts가 barrel로 전환됨. 실제 정의는 approvals/types.ts)
grep -rn "multiStep\s*[?:]\s*boolean" apps/frontend/lib/api/ --include="*.ts"

# totalApprovalSteps가 있는데 별도 boolean 필드로 중복 파생하는 패턴
grep -rn "totalSteps\s*[?:]\s*boolean\|stepCount\s*[?:]\s*boolean\|hasMultipleSteps\s*[?:]\s*boolean" \
  apps/frontend/lib/api/ --include="*.ts"
```

**PASS:** `multiStep?: boolean` 선언 0건 (approvals-api.ts + approvals/types.ts 포함 전 approve 카테고리 파일).
**FAIL:** boolean 재도입 → 제거 후 수치 비교 패턴으로 교체.

**관련 파일:**
- `apps/frontend/lib/api/approvals-api.ts` — barrel re-export (2026-04-30 분할 이후)
- `apps/frontend/lib/api/approvals/types.ts` — `TabMeta.totalApprovalSteps` SSOT 실제 정의 (2026-04-30)
- `apps/frontend/components/approvals/ApprovalRow.tsx` — `meta.totalApprovalSteps` 소비
- `apps/frontend/components/approvals/ApprovalDetailModal.tsx` — `meta.totalApprovalSteps > 1`

---

## Step 35: 대시보드 임계값 SSOT — `dashboard-thresholds.ts` 우회 금지

**규칙**: 대시보드 임계값(D-day 단계, 가동률, 분포 막대, 시스템 상태, 처리율, 시간 윈도우, 카드 표시 행수)은 반드시 `@equipment-management/shared-constants/dashboard-thresholds`에서 import. 컴포넌트/서비스에 인라인 매직 넘버 금지.

**커버리지 (9개 SSOT 상수)**:
- `DDAY_THRESHOLDS` (urgent=7, soon=30)
- `UTILIZATION_GAUGE_THRESHOLDS` (ok=60, warn=40)
- `DISTRIBUTION_BAR_THRESHOLDS` (danger=50, warn=60)
- `SYSTEM_HEALTH_THRESHOLDS` (DB ms / storage / queue 임계값)
- `SYSTEM_HEALTH_GAUGE_CAPS` (게이지 정규화 capacity)
- `SYSTEM_HEALTH_OVERALL_THRESHOLDS` (overallStatus 판정)
- `REVIEW_PROCESSING_RATE_THRESHOLDS` (green=90, amber=60)
- `DASHBOARD_TIME_WINDOWS` (recentActivityDays=7, upcomingCalibrationDays=30)
- `DASHBOARD_CARD_DISPLAY_LIMITS` (calibrationDday=8, approvalHeavyMinCount=5)
- `TEAM_DISTRIBUTION_DEFAULT_VISIBLE_ROWS` (=6)

**검증 명령**:
```bash
# 1. 대시보드 영역에서 임계값 매직 넘버 직접 사용
grep -rn '\b(60|40|50|65|80|90|100|300|500|1500)\b' \
  apps/frontend/components/dashboard/ \
  apps/frontend/lib/design-tokens/components/dday-tone.ts \
  apps/backend/src/modules/dashboard/dashboard.service.ts 2>/dev/null \
  | grep -v '//\|shared-constants\|UTILIZATION_THRESHOLDS\|DASHBOARD_TIME_WINDOWS'

# 2. setDate 인라인 day window
grep -n 'setDate.*[+-] *\(7\|30\)\b' apps/backend/src/modules/dashboard/dashboard.service.ts \
  | grep -v 'DASHBOARD_TIME_WINDOWS\|CALIBRATION_THRESHOLDS'

# 3. 표시 행수 매직 넘버
grep -rn '\(length\|count\) *[<>]=\?\s*\(5\|6\|8\)\b' \
  apps/frontend/components/dashboard/ \
  | grep -v 'DISPLAY_LIMITS\|DASHBOARD_CARD_DISPLAY_LIMITS\|TEAM_DISTRIBUTION_DEFAULT_VISIBLE_ROWS'
```

**PASS:** 모든 grep 결과 0줄 (주석/SSOT import 제외).
**FAIL:** 매직 넘버 발견 → SSOT 상수 import로 교체.

**예외**:
- `dashboard-thresholds.ts` 내부 임계값 정의 (SSOT 자체)
- `dday-tone.ts` 내부 헬퍼 (SSOT import 후 비교)
- `business-rules.ts`의 `CALIBRATION_THRESHOLDS.WARNING_DAYS` (별도 SSOT)
- 페이지네이션 limit (`DASHBOARD_ITEM_LIMIT`은 별도 SSOT)

**발생 이력 (2026-04-28)**: 대시보드 영역에 50/60/65/80/90/100/300/500/1500 등 임계값이 frontend dday-tone + backend dashboard.service 2곳에 중복 인라인. `getMyQuickSummary` 30 day window + `getRecentActivities` 7 day window도 매직 넘버. SSOT 모듈 신설 + 일괄 교체.

---

## Step 36: 반출 도메인 D-day 임계값 SSOT — `checkout-thresholds.ts` 우회 금지

**규칙**: 반출 도메인의 D-day 4-tier 임계값(overdue/warning/ok/neutral)은 반드시 `@equipment-management/shared-constants/checkout-thresholds`에서 import. 대시보드 임계값(`dashboard-thresholds.ts`)과 의도적으로 분리되어 있으므로 **두 도메인 임계값을 교차 사용 금지**.

**도메인 분리 근거 (검증 시 참고)**:
| 도메인 | 모듈 | 의미 | 부호 규약 |
|---|---|---|---|
| 대시보드 | `dashboard-thresholds.ts` | 30일 horizon 가동률/배치 모니터링 | `days` 양수=초과, 음수=남음 |
| 반출 | `checkout-thresholds.ts` | 단기 워크플로 SLA — 즉시 조치 | `daysRemaining` 양수=미래, 음수=overdue |

**커버리지 (3개 SSOT export)**:
- `CHECKOUT_DDAY_THRESHOLDS` (overdue=0, warning=2, ok=14)
- `getCheckoutDdayTier(daysRemaining): CheckoutDdayTier` — `'danger' | 'warning' | 'ok' | 'neutral'`
- `CheckoutDdayTier` 타입

**검증 명령**:
```bash
# 1. 반출 컴포넌트/hook이 임계값 매직 넘버 직접 사용
grep -rn '\b\(daysRemaining\|days\)\s*[<>]=\?\s*\(0\|2\|14\)\b' \
  apps/frontend/components/checkouts/ \
  apps/frontend/hooks/use-checkout-*.ts \
  apps/frontend/lib/design-tokens/components/dday-colors.ts 2>/dev/null \
  | grep -v 'CHECKOUT_DDAY_THRESHOLDS\|getCheckoutDdayTier\|//'

# 2. dday-colors.ts 신규 4-tier 함수가 shared-constants 위임 패턴
grep -n "getCheckoutDdayTier\|CHECKOUT_DDAY_THRESHOLDS" \
  apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: import + getCheckoutDday4Tier 내부 위임

# 3. 반출 컴포넌트가 대시보드 임계값(DDAY_THRESHOLDS) 잘못 사용 검출
grep -rn "DDAY_THRESHOLDS\b" apps/frontend/components/checkouts/ apps/frontend/hooks/use-checkout-*.ts
# 기대: 0건 (반출 도메인은 CHECKOUT_DDAY_THRESHOLDS 사용 — 대시보드 모듈 우회 금지)

# 4. 백엔드 checkouts.service.ts 가 반출 임계값 사용 시 SSOT 경유
grep -n "CHECKOUT_DDAY_THRESHOLDS\|getCheckoutDdayTier" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: 향후 priority 정렬/overdue 필터 인입 시 1건 이상 (현재는 frontend-only OK)

# 5. 6-tier legacy 회귀 방지 (dday-colors.ts에서 제거됨)
grep -n "DDAY_TIERS\b\|DDAY_TIER_CLASSES\b\|farFuture\|upcoming\|overdueShort\|overdueLong" \
  apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: 0건 (정리 완료, 회귀 시 FAIL)
```

**PASS:**
1. 반출 컴포넌트/hook의 D-day 비교는 모두 `getCheckoutDdayTier()` 또는 그 결과(`tier === 'danger'`)로 평가
2. `dday-colors.ts`의 4-tier 함수는 shared-constants `getCheckoutDdayTier` 위임
3. 반출 컴포넌트가 대시보드 `DDAY_THRESHOLDS.urgent/soon` 사용하지 않음 (의미 다른 도메인)
4. 백엔드 인입 시 frontend와 동일 모듈 import (frontend/backend 일관성)
5. 6-tier legacy 임계값(7/4/1/0/-3) 잔존 0건

**FAIL:**
- 반출 컴포넌트/hook에 `daysRemaining < 0`, `daysRemaining <= 2`, `daysRemaining <= 14` 인라인
- 반출 컴포넌트가 `DDAY_THRESHOLDS` (대시보드 모듈) import — 도메인 의미 충돌
- 6-tier legacy 함수/상수 회귀 (DDAY_TIERS, DDAY_TIER_CLASSES, farFuture/upcoming/overdueShort/overdueLong)

**예외**:
- `checkout-thresholds.ts` 내부 임계값 정의 (SSOT 자체)
- `dday-colors.ts`의 `getCheckoutDday4Tier` (shared-constants 위임)
- `DdayBadge.tsx` 내부의 tier 비교(`tier === 'danger'` 등) — tier가 SSOT 결과이므로 OK

**관련 파일**:
- `packages/shared-constants/src/checkout-thresholds.ts` — SSOT 정의
- `packages/shared-constants/src/index.ts` — re-export
- `apps/frontend/lib/design-tokens/components/dday-colors.ts` — 4-tier 위임 (6-tier 정리됨)
- `apps/frontend/components/checkouts/DdayBadge.tsx` — 호출처
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — 호출처

**발생 이력 (2026-04-28)**: REVIEW_RESULT.md §4.3 명세에 따라 반출 도메인 D-day pill 색상(`dday-ok / dday-warn / dday-danger`)을 4-tier로 표준화. 기존 6-tier는 의미 단계가 너무 많아 와이어프레임 시각 어휘와 불일치 → 4-tier 단일화 + 대시보드와 분리된 도메인 임계값 SSOT 신설. frontend/backend 양쪽 동일 모듈 사용으로 시각·로직 일관성 보장.

---

## Step 42: 테스트 파일 hardcoded threshold vs SSOT 토큰 import 강제

**규칙**: 테스트 파일이 SSOT 토큰(`packages/shared-constants/*` 또는 `apps/{frontend,backend}/lib/config/*`)으로 정의된 임계값/경계의 boundary 케이스를 검증할 때, **반드시 SSOT 토큰을 import**해서 동적 boundary를 계산해야 한다. `toBe(70)` / `toEqual(40)` 같은 매직 넘버 hardcoding 금지.

**왜 hardcoded threshold가 위험한가**:
- SSOT 변경 시 코드는 즉시 추종하지만 테스트는 매직 넘버에 묶여 있어 boundary case가 fail — SSOT 변경의 자동 추종이 끊긴다.
- 회귀 자동 차단의 신호가 *변경 의도된 SSOT drift*에서 발생하므로 false positive 노이즈 → 진짜 회귀 신호가 묻힘.
- 같은 boundary 의미가 SSOT(코드)·hardcoded 매직넘버(테스트)·describe 라벨 등 3곳에 중복 → SSOT 분산.

**검증 명령**:
```bash
# 1. SSOT 도메인의 임계값을 hardcoded로 사용하는 테스트 (FAIL 패턴)
#    - 대시보드 임계값(40, 50, 60, 65, 80, 90, 100, 300, 500)
#    - 반출 D-day 임계값(0, 2, 14)
#    - 가동률 hysteresis(2)
grep -rnE 'toBe\((40|50|60|65|80|90|100|300|500|1500)\)|toEqual\((40|50|60|65|80|90|100|300|500|1500)\)' \
  apps/frontend/**/__tests__ apps/backend/**/__tests__ 2>/dev/null \
  | grep -v 'shared-constants\|UTILIZATION_THRESHOLDS\|DDAY_THRESHOLDS\|DASHBOARD_TIME_WINDOWS'

# 2. 같은 테스트 파일이 SSOT 모듈을 import하는지 cross-check
#    매직 넘버를 사용하면서 SSOT 모듈을 import 안 하는 파일 = FAIL
grep -rL 'shared-constants\|@/lib/config/dashboard-config\|@/lib/config/checkout-thresholds' \
  $(grep -rlE 'toBe\((40|50|60|65|70|80|90|100)\)' \
    apps/frontend/**/__tests__ apps/backend/**/__tests__ 2>/dev/null)
# 기대: 0 hits (모든 테스트가 SSOT 토큰 import)

# 3. 모범 사례 패턴 — describe 라벨도 동적 보간
grep -rnE 'describe\(`.*\$\{(HIGH|MEDIUM|LOW|HIGH_EXIT|MEDIUM_EXIT|HIGH_ENTRY)' \
  apps/frontend/**/__tests__/utilization-state.test.ts apps/frontend/**/__tests__/dday-tone.test.ts
# 기대: ≥ 1 hit (라벨도 SSOT 추종)
```

**PASS:**
- 모든 boundary 테스트가 SSOT 토큰 import 후 `HIGH`, `MEDIUM`, `HIGH_EXIT = HIGH - HYSTERESIS` 같은 파생 상수로 boundary 계산
- SSOT 변경 시 테스트 코드 수정 없이 자동 추종 — boundary case가 *변경된 임계값*으로 다시 계산됨
- describe/it 라벨도 매직 넘버 대신 동적 보간 (예: `` `HIGH_ENTRY(${HIGH_ENTRY}) 이상 → good` ``)

**FAIL:**
- `expect(state).toBe('warning')` 다음 줄에 `expect(computeUtilizationState(70)).toBe(...)` 패턴 — 70은 매직 넘버
- 테스트 파일이 SSOT 모듈을 import하지 않음

**예외:**
- enum 멤버 수 검증 (`expect(Object.keys(EquipmentStatus).length).toBe(8)`) — 임계값이 아니라 *enum 정의 자체* 검증
- fixture 데이터 길이 (`expect(equipments).toHaveLength(3)`) — 임계값과 무관한 setup data
- HTTP status code (200/400/403/404/409) — 표준 코드, SSOT 의미 없음
- 0/1 같은 trivial 경계값 (toBeGreaterThan(0), toHaveLength(1)) — 의미적 임계값 아님
- 시간 단위 변환 (`60 * 1000` for ms) — 도메인 임계값이 아닌 단위 환산

**관련 파일 (모범 사례):**
- `apps/frontend/lib/utils/__tests__/utilization-state.test.ts` — `UTILIZATION_THRESHOLDS` import + `HIGH/MEDIUM/HYSTERESIS` 구조분해 + `HIGH_EXIT = HIGH - HYSTERESIS` 파생 + describe 라벨 동적 보간
- `apps/frontend/lib/design-tokens/components/__tests__/dday-tone.test.ts` — `DDAY_THRESHOLDS` import 후 `urgent`, `soon` 동적 boundary

**발생 이력 (2026-04-28 → 2026-04-30 신설)**: 2026-04-28 dashboard-redesign 세션에서 `UTILIZATION_THRESHOLDS.HIGH`를 70→60으로 변경(`6ddff791b`). 코드 사용처는 즉시 추종됐으나 `utilization-state.test.ts`는 hardcoded `expect(...).toBe('good')` 70 boundary 유지 → 1차 push 시 frontend test 6 fail. fix 패턴(이후 모범 사례): SSOT 토큰 import + 구조분해 + 파생 상수 + describe 라벨 보간.

---

## Step 52: Visual layer ↔ domain SSOT 의식적 분리 — frontend 시각 임계값 named constant

**규칙**: backend domain SSOT 임계값(`CHECKOUT_DDAY_THRESHOLDS` 0/2/14, shared-constants)은 backend aggregation 일관성을 위해 보존하되, frontend가 더 세분화된 시각 표현(예: 6단계 색온도)이 필요할 때는 **별도 named constant SSOT**로 분리한다. 인라인 magic number 또는 4-tier 임계값 재사용으로 시각 계산을 우회하지 않는다.

**왜 분리가 필요한가**: domain SSOT는 frontend/backend 양측에서 같은 분류(`getCheckoutDdayTier(days) → 'danger'|'warning'|'ok'|'neutral'`)를 보장. visual layer는 이 분류와 무관한 시각 차별성(예: D-7+/D-6~4/D-3~1/D-0/D+1~3/D+4+)을 표현. 두 SSOT를 의식적으로 분리하면:
1. backend aggregation 영향 0 (domain threshold 보존)
2. visual 차별성 자유롭게 확장 (UI 디자인 반복)
3. tier(아이콘) ↔ visual level(색온도) 책임 분리 — `getCheckoutDday4TierIconKey` ↔ `getCheckoutDdayVisualClasses`

**검증 명령**:
```bash
# 1. visual threshold가 named constant로 정의되어 있는가
grep -n "CHECKOUT_DDAY_VISUAL_THRESHOLDS\|export const CHECKOUT_DDAY_VISUAL_THRESHOLDS" \
  apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: 1건 이상 (named constant 정의)

# 2. visual level 헬퍼가 named constant만 사용하는가 (인라인 magic number 0)
grep -E "if \(daysRemaining (>=|===|<=) -?[0-9]+\)" \
  apps/frontend/lib/design-tokens/components/dday-colors.ts | grep -v "T\."
# 기대: 0건 (모든 비교는 T.relaxedFloor 등 SSOT 경유)

# 3. domain SSOT 호출자 보존 — 4-tier 헬퍼 export 유지
grep -E "(getCheckoutDday4Tier|DDAY_4TIER_CLASSES|getCheckoutDday4TierClasses)" \
  apps/frontend/lib/design-tokens/index.ts
# 기대: 4-tier export 보존 (visual 6-level 도입이 4-tier 제거를 강제하지 않음)

# 4. domain SSOT 재정의 0건 (frontend가 backend threshold를 우회/재정의 안 함)
grep -rn "CHECKOUT_DDAY_THRESHOLDS\b" apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: import만 (재정의 0)
```

**PASS**: visual constant 정의 + magic number 0 + 4-tier 보존 + domain SSOT 재정의 0
**FAIL**: visual 헬퍼 내 인라인 임계값 발견 → named constant로 추출 후 `T.<name>` 경유

**올바른 패턴**:
```typescript
// ✅ CORRECT — visual layer 별도 named constant
export const CHECKOUT_DDAY_VISUAL_THRESHOLDS = {
  relaxedFloor: 7,
  normalFloor: 4,
  warningFloor: 1,
  urgentDay: 0,
  overdueLightFloor: -3,
} as const;

export function getCheckoutDdayVisualLevel(daysRemaining: number): CheckoutDdayVisualLevel {
  const T = CHECKOUT_DDAY_VISUAL_THRESHOLDS;
  if (daysRemaining >= T.relaxedFloor) return 1;
  // ...
}

// ❌ WRONG — magic number 인라인
export function getCheckoutDdayVisualLevel(daysRemaining: number): CheckoutDdayVisualLevel {
  if (daysRemaining >= 7) return 1;  // magic 7
  // ...
}

// ❌ WRONG — backend domain threshold 재사용으로 시각 계산
import { CHECKOUT_DDAY_THRESHOLDS } from '@equipment-management/shared-constants';
export function getCheckoutDdayVisualLevel(daysRemaining: number) {
  // domain threshold(0/2/14)는 시각 6단계와 의도가 다름 — 재사용 금지
}
```

**관련 파일**:
- `apps/frontend/lib/design-tokens/components/dday-colors.ts` — `CHECKOUT_DDAY_VISUAL_THRESHOLDS` SSOT (2026-04-30 신설)
- `packages/shared-constants/src/checkout-thresholds.ts` — backend domain SSOT (보존 대상)
- `apps/frontend/components/checkouts/DdayBadge.tsx` — `getCheckoutDdayVisualClasses` 호출

**발생 이력 (2026-04-30 신설)**: Sprint 4.5 U-09 D-day 색온도 6단계 작업에서, backend `CHECKOUT_DDAY_THRESHOLDS` 4-tier(0/2/14)는 backend aggregation 일관성을 위해 보존해야 하지만 사용자가 시각 6단계 표현을 요구. 하이브리드 접근으로 visual layer를 별도 SSOT(`CHECKOUT_DDAY_VISUAL_THRESHOLDS`)로 분리. 시각 임계값(7/4/1/0/-3)은 domain 임계값(0/2/14)과 의도적으로 다름 — 시각 차별성과 도메인 분류는 다른 책임.

---

## Step 56: `calculateDaysRemaining` SSOT — `dday-utils.ts` 외부에서 인라인 날짜 D-day 산술 금지

**규칙**: "오늘로부터 날짜 X까지 남은 일수(정수)" 계산은 반드시 `calculateDaysRemaining(date)` (`@/lib/utils/dday-utils`) 를 사용해야 함. `new Date()`, `setHours(0,0,0,0)`, `.getTime() / 86400000` 조합의 인라인 D-day 산술을 `dday-utils.ts` 외부에서 직접 작성하는 것은 금지.

**왜 중요한가**: 자정 정규화(midnight normalization)를 빠뜨리거나 `Math.ceil` vs `Math.round` 차이로 edge-case에서 ±1일 오차가 발생. SSOT 하나만 올바르게 유지하면 전체 코드베이스에서 일관된 D-day 계산 보장.

**올바른 구조**:
```typescript
// ✅ CORRECT — SSOT 경유
import { calculateDaysRemaining } from '@/lib/utils/dday-utils';
const diffDays = calculateDaysRemaining(nextCalibrationDate);

// ❌ WRONG — 인라인 산술 (dday-utils.ts 외부)
const today = new Date(); today.setHours(0,0,0,0);
const target = new Date(date); target.setHours(0,0,0,0);
const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86400000);
```

**검증 명령어**:
```bash
# 1. dday-utils.ts 외부에서 setHours(0, 0, 0, 0) 인라인 패턴 탐지
grep -rn "setHours(0, 0, 0, 0)" \
  apps/frontend/lib/ apps/frontend/components/ apps/frontend/hooks/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "dday-utils.ts\|node_modules"
# 기대: 0건

# 2. 86400000 나누기 인라인 D-day 산술 탐지
grep -rn "/ (1000 \* 60 \* 60 \* 24)\|/ 86400000" \
  apps/frontend/lib/ apps/frontend/components/ apps/frontend/hooks/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "dday-utils.ts\|node_modules"
# 기대: 0건 (dday-utils.ts만 허용)
```

**PASS**: `dday-utils.ts` 외부에서 `setHours(0,0,0,0)` 및 `/86400000` 패턴 0건
**FAIL**: 인라인 D-day 산술 발견 → `calculateDaysRemaining()` 경유로 교체

**관련 파일**:
- `apps/frontend/lib/utils/dday-utils.ts` — `calculateDaysRemaining(date: string | Date): number` SSOT (자정 정규화 + Math.round)
- `apps/frontend/lib/utils/calibration-status.ts` — 마이그레이션 완료 참조 (인라인 7줄 → 1줄, 2026-04-30)

**발생 이력 (2026-04-30 신설)**: `calibration-status.ts`가 `calculateDaysRemaining`과 동일한 날짜 산술 로직을 7줄 인라인으로 중복 구현. `dday-utils.ts`의 타입 시그니처를 `string | Date`로 확장하고 인라인 코드를 1줄로 대체.

---

## Step 58: `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH` SSOT — `.max(200)` 매직넘버 DTO 인라인 금지

**배경**: `packages/shared-constants/src/validation-rules.ts`에 `EXTENDED_TEXT_MAX_LENGTH: 200` 상수가 추가되었다 (`zod-trim-max-system-wide-residual` sprint, 2026-05-03). 이 상수는 소프트웨어명·제조사·URL 등 varchar(200) 컬럼 최대 길이를 나타낸다. 기존 `.max(200, ...)` 인라인 매직넘버는 모두 이 SSOT로 교체되었다. 신규 코드에서 `.max(200, ...)` 직접 사용은 SSOT 우회다.

**규칙**: DTO에서 `.max(200, ...)` 매직넘버 직접 사용 금지 — `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH` 경유 필수.

**탐지 명령**:

```bash
# DTO 파일에서 .max(200) 매직넘버 인라인 사용 탐지
grep -rn "\.max(200," apps/backend/src/modules --include="*.dto.ts"
# 기대: 0건 (VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH SSOT 경유 필수)
```

**PASS 기준**: `.max(200,` 패턴 0건.

**FAIL 기준**: 1건 이상 → `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH` 교체 + `import { VALIDATION_RULES } from '@equipment-management/shared-constants'` 추가.

**SSOT 체인**:
- `packages/shared-constants/src/validation-rules.ts` — `EXTENDED_TEXT_MAX_LENGTH: 200`
- 용도: 소프트웨어명, 제조사명, URL, linkUrl, externalIdentifier 등 varchar(200) 필드

**발생 이력**: `zod-trim-max-system-wide-residual` sprint (2026-05-03) — notification.dto의 `.max(200, ...)` 인라인에서 상수 신설. 기존 매직넘버 전수 교체 완료.

---

## Step 59: Backend pagination default/max SSOT — 서비스·컨트롤러 clamp 매직넘버 금지

**배경**: pagination canonical source가 `packages/schemas/src/pagination.ts`로 승격되었고 `packages/shared-constants/src/pagination.ts`는 재수출 전용이다. DTO만 `MAX_PAGE_SIZE`를 사용해도 controller/service에서 `Math.min(..., 100)` 또는 `pageSize = 20`을 유지하면 문서·검증·런타임 정책이 갈라진다.

**규칙**:
- backend controller/service의 페이지네이션 기본값은 `DEFAULT_PAGE_SIZE` 경유
- backend controller/service의 최대 clamp는 `MAX_PAGE_SIZE` 경유
- Swagger 설명도 동일 상수 interpolation 사용
- 특별한 도메인 limit이 필요하면 pagination SSOT에 별도 named constant를 추가하고 그 상수를 사용

**탐지 명령**:

```bash
# backend 런타임 경계에서 pagination 매직넘버 직접 사용 탐지
grep -rnE "Math\.min\([^\\n]*(100|20|30)|pageSize\\s*=\\s*20|limit\\s*=\\s*20|limit\\s*=\\s*30|기본값: 20, 최대: 100|기본값: 100" \
  apps/backend/src/modules --include="*.ts" \
  | grep -v "__tests__"
# 기대: 0건. 발견 시 DEFAULT_PAGE_SIZE/MAX_PAGE_SIZE 또는 named SSOT 상수 경유.
```

**PASS 기준**: backend production controller/service에서 pagination 기본값·최대값 매직넘버 직접 사용 0건.

**FAIL 기준**: 1건 이상 → `DEFAULT_PAGE_SIZE`/`MAX_PAGE_SIZE` import로 교체하거나, 도메인별 의미가 다르면 shared pagination SSOT에 named constant 추가.

**SSOT 체인**:
- `packages/schemas/src/pagination.ts` — `PAGE_SIZE_OPTIONS`, `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`
- `packages/shared-constants/src/pagination.ts` — 기존 import surface 호환용 재수출

**발생 이력**: `validation-message-pagination-residual` follow-up (2026-05-03) — audit controller, equipment repair history service, self-inspection service에 남은 `20/30/100` runtime clamp를 SSOT로 교체.
