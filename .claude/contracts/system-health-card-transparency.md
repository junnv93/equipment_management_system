---
slug: system-health-card-transparency
mode: 1
status: in_progress
domain: frontend / dashboard / system-health observability
date: 2026-05-06
---

# Sprint 1 — SystemHealthCard transparency 표시

## 배경
이전 sprint(`system-health-data-source-ssot`, fd8d221b)에서 backend `SystemHealthMetricsDto`에 transparency 필드 3개 (`storageBackend`, `queueBackend`, `errorSource`) + `dbSizeBytes`가 추가되어 응답에 포함되었으나, frontend `SystemHealthCard`가 해당 필드를 무시 — 운영자가 admin dashboard에서 "왜 이 숫자인가"를 추적 불가. 특히 `storageBackend='pg-database'`(host-disk + configured-capacity 측정 모두 실패) 시 `storagePct=0`이 "디스크 0%"로 오해 가능.

## SSOT 출처
- enum: `packages/shared-constants/src/system-health-backends.ts` (`SYSTEM_HEALTH_STORAGE_BACKENDS` / `_QUEUE_BACKENDS` / `_ERROR_SOURCES`)
- backend DTO: `apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts:272` (`SystemHealthMetricsDto`)
- 운영 문서: `docs/operations/system-health-data-sources.md`

## 작업 (Generator)

### 1. Frontend 타입 동기화
**File**: `apps/frontend/lib/api/dashboard-api.ts:117`
- `SystemHealthMetrics` interface에 추가:
  - `storageBackend: SystemHealthStorageBackend`
  - `queueBackend: SystemHealthQueueBackend`
  - `errorSource: SystemHealthErrorSource`
  - `dbSizeBytes: number`
- import: `@equipment-management/shared-constants`에서 type 직접 가져옴 (SSOT 우회 금지)

### 2. design-tokens 추가
**File**: `apps/frontend/lib/design-tokens/components/dashboard.ts:841` (`DASHBOARD_SYSTEM_HEALTH_TOKENS`)
- `backendBadge`: 작은 caption + muted-foreground (`text-2xs font-medium text-muted-foreground`)
- `backendBadgeWarn`: pg-database 등 측정 불가 케이스 강조 (`text-2xs font-semibold text-brand-warning`)
- `backendBadgeContainer`: tooltip trigger wrapper (`inline-flex items-center gap-0.5 cursor-help focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm`)
- `backendInfoIcon`: `h-3 w-3 text-muted-foreground/70`

### 3. SystemHealthCard 컴포넌트 수정
**File**: `apps/frontend/components/dashboard/SystemHealthCard.tsx`
- 정상 케이스: 라벨 옆 작은 ⓘ 아이콘 + Tooltip — backend identifier 의미 표시
- pg-database 케이스: storage 행에 inline "측정 불가" 라벨 (warn 톤) — discovery 강제
- footer (errorsLast24h) 옆에도 errorSource tooltip
- `TooltipProvider` 카드 단위로 wrap (single instance)
- a11y: Tooltip이 Radix로 keyboard accessible, aria-describedby 자동 wiring

### 4. i18n 키 (ko + en parity)
**Files**: `apps/frontend/messages/{ko,en}/dashboard.json`
- `dashboard.systemHealth.backend.storage.host-disk`
- `dashboard.systemHealth.backend.storage.configured-capacity`
- `dashboard.systemHealth.backend.storage.pg-database` (측정 불가)
- `dashboard.systemHealth.backend.queue.pending-work-aggregate`
- `dashboard.systemHealth.backend.queue.bullmq`
- `dashboard.systemHealth.backend.error.system-error-events`
- `dashboard.systemHealth.backend.error.audit-rejection-proxy`
- `dashboard.systemHealth.backendInfo` ("데이터 소스" / "Data source")
- `dashboard.systemHealth.unmeasured` ("측정 불가" / "Unmeasured")

### 5. spec 추가 (신규)
**File**: `apps/frontend/components/dashboard/__tests__/SystemHealthCard.test.tsx`
- storageBackend='host-disk' → tooltip 보유
- storageBackend='pg-database' → 인라인 "측정 불가" 라벨 표시 (warn 톤)
- queueBackend tooltip 표시
- errorSource tooltip 표시 (footer)
- a11y: TooltipTrigger button focusable + aria-describedby wiring

## MUST 기준 (Evaluator)

| # | 검증 | Expected |
|---|------|----------|
| M1 | `SystemHealthMetrics` interface에 4개 신규 필드 (`storageBackend`, `queueBackend`, `errorSource`, `dbSizeBytes`) | tsc PASS |
| M2 | shared-constants type import (로컬 재정의 0건) — verify-ssot Rule 0 | grep `import.*SystemHealthStorageBackend.*shared-constants` ≥1 hit |
| M3 | i18n ko+en parity — `systemHealth.backend.{storage,queue,error}.*` 모두 양쪽 동시 존재 | check-i18n-keys PASS |
| M4 | pg-database 케이스 명시적 시각 차별화 — inline "측정 불가" 라벨 (warn 톤) | grep `text-brand-warning` 또는 `unmeasured` 키 사용 ≥1 hit in SystemHealthCard.tsx |
| M5 | Tooltip a11y — Radix `<TooltipTrigger>` + `<TooltipContent>` 사용 (custom title 속성 금지) | grep `TooltipTrigger\|TooltipContent` ≥3 hit (storage/queue/error) |
| M6 | design-token 경유 — 인라인 클래스 0 (color/size 모두 토큰) | 새 className 직접 사용 0건, `T.backend*` 토큰 사용 ≥3 |
| M7 | 새 spec 5+ 케이스 PASS | `pnpm jest SystemHealthCard.test.tsx` 5+ pass |
| M8 | frontend tsc + lint | 0 error |
| M9 | 단일 cohesive commit (`feat(dashboard): system-health transparency badges`) | 1 commit |

## SHOULD 기준 (후속, 루프 차단 X)

| # | 검증 | 비고 |
|---|------|------|
| S1 | review-design 통과 (카드 수프 / spacing / typography 6-tier) | 시각 점검 |
| S2 | Storybook story 추가 (pg-database vs host-disk 비교) | 후속 sprint |
| S3 | DashboardRow3/Row4가 SystemHealthMetrics 추가 필드를 prop으로 전달 — 자동 (interface 확장이라 변경 불필요) | tsc로 자동 검증 |

## Anti-patterns (회귀 차단)

```tsx
// ❌ 로컬 enum 재정의 (Rule 0 SSOT 위반)
type StorageBackend = 'host-disk' | 'configured-capacity' | 'pg-database';

// ❌ HTML title 속성으로 tooltip (keyboard inaccessible)
<span title="host disk">{backend}</span>

// ❌ 인라인 색상 클래스
<span className="text-yellow-500">측정 불가</span>

// ❌ 누락된 i18n parity (한쪽 언어만 추가)
// ko에는 backend.storage.host-disk 있는데 en에는 없으면 missing key
```
