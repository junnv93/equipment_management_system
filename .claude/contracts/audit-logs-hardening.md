---
slug: audit-logs-hardening
mode: 1
scope: 감사로그 아키텍처 하드닝 (frontend 가상화 + backend findAllCursor unit test)
created: 2026-04-12
---

# 스프린트 계약: 감사로그 아키텍처 하드닝

## 생성 시점
2026-04-12T09:00:00+09:00

## 배경

tech-debt-tracker 미완료 2건을 단일 스프린트로 묶음. 둘 다 audit-logs 도메인이고 cross-cutting(모든 모듈의 감사 로그가 한 화면에 수렴)이라 응집성이 높다.

### A. 프론트엔드 가상화
`apps/frontend/components/audit-logs/AuditTimelineFeed.tsx` — 2026-04-10 커서 기반 무한 스크롤 도입 완료했으나 **react-window 가상화 미적용**. 수백/수천 건 누적 시 DOM 노드 과다 → 스크롤/호버 jank. 패키지는 이미 설치됨(`react-window@2.2.7`, `@types/react-window@2.0.0`).

### B. findAllCursor 백엔드 unit test 부재
`apps/backend/src/modules/audit/audit.service.ts:172 findAllCursor` — 커서 인코딩/디코딩, keyset row-value WHERE, Invalid cursor fallback, summary first-page only, limit+1 페치 후 hasMore 파생 로직이 테스트 미커버. `findAll`(legacy offset)만 spec에 존재. 회귀 가드 없음.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **MUST1**: `pnpm --filter frontend exec tsc --noEmit` exit 0
- [ ] **MUST2**: `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] **MUST3**: `pnpm --filter frontend run build` exit 0
- [ ] **MUST4**: `pnpm --filter backend run build` exit 0
- [ ] **MUST5**: `pnpm --filter backend run test` exit 0 — audit.service.spec 포함 모든 기존 테스트 회귀 없음
- [ ] **MUST6**: `apps/frontend/components/audit-logs/AuditTimelineFeed.tsx` 에 `react-window` 의 `List` (또는 `Grid`) import + 사용
- [ ] **MUST7**: 동일 파일 내 row height / overscan / default list height 값은 **상수 참조** — 리터럴 하드코딩 없음. grep 검증: row height 관련 숫자 리터럴이 JSX 속성에 직접 박혀있지 않음 (`rowHeight={숫자}` 금지, `rowHeight={VIRTUALIZATION.rowHeight...}` 또는 함수 참조 OK)
- [ ] **MUST8**: `apps/backend/src/modules/audit/__tests__/audit.service.spec.ts` 에 `describe('findAllCursor')` 블록 존재 + 최소 5 테스트 케이스
- [ ] **MUST9**: findAllCursor 테스트는 다음 경로를 커버해야 함 (각 1 케이스 이상):
    1. **첫 페이지 (cursor 없음)** — summary 포함, items 반환, hasMore 파생
    2. **후속 페이지 (유효 cursor)** — summary null, keyset WHERE 추가 호출 확인
    3. **Invalid cursor fallback** — 깨진 base64 or 잘못된 JSON 필드 → 첫 페이지 취급 (summary 포함)
    4. **limit+1 fetch → hasMore true + pageItems slice** — limit 개보다 1개 더 반환 시 hasMore=true, pageItems 길이 == limit, nextCursor 인코딩 존재
    5. **limit 이하 fetch → hasMore false** — nextCursor null
- [ ] **MUST10**: 기존 a11y 속성 보존 — AuditTimelineFeed.tsx 에 다음 문자열 전부 grep 히트:
    - `aria-label=` (최소 2회 — logList, 개별 entry)
    - `role="list"` 또는 `role="listitem"` 보존
    - `<time` 엘리먼트 유지 (시간 컬럼)
    - `aria-busy=`, `aria-live=`
    - `aria-hidden="true"` (스파인 dot/line, 화살표)
- [ ] **MUST11**: 다음 blacklist 파일 수정 0건 (다른 세션 작업 영역):
    - `packages/db/src/schema/checkouts.ts`
    - `apps/backend/drizzle/**`
    - `apps/backend/src/modules/checkouts/**`
    - `apps/backend/src/modules/intermediate-inspections/**`
    - `apps/backend/src/modules/self-inspections/**`
    - `apps/backend/src/modules/reports/form-template-export.service.ts`
    - `apps/frontend/lib/api/calibration-api.ts`
    - `apps/frontend/components/inspections/result-sections/**`
    - `apps/frontend/components/equipment/SelfInspectionTab.tsx`
    - `packages/shared-constants/src/api-endpoints.ts`
    - `packages/shared-constants/src/file-types.ts`
    - `apps/frontend/messages/{ko,en}/{calibration,equipment}.json`
- [ ] **MUST12**: `AuditLogsContent.tsx` 무수정 — AuditTimelineFeed.tsx 의 공개 Props 시그니처 (logs/onLogClick/getActionLabel/getEntityTypeLabel/isRefetching/hasNextPage/isFetchingNextPage/onLoadMore) 변경 금지
- [ ] **MUST13**: 하드코딩 금지 — 에러/라벨/키는 SSOT 사용. `useTranslations('audit')`, `SYSTEM_USER_UUID`, `AUDIT_TIMELINE_TOKENS`, `AUDIT_TIMELINE_DOT_COLORS`, `ANIMATION_PRESETS` 등 기존 import 계속 사용

### 권장 (SHOULD) — 실패 시 tech-debt 기록, 루프 차단 없음

- [ ] **SHOULD1**: `verify-frontend-state` PASS (TanStack Query, queryKeys SSOT)
- [ ] **SHOULD2**: `verify-ssot` Rule 0 위반 0건
- [ ] **SHOULD3**: `verify-hardcoding` violation 0건 (AuditTimelineFeed.tsx 범위)
- [ ] **SHOULD4**: `review-architecture` Critical 0개 (변경 영역)
- [ ] **SHOULD5**: 가상화 후 100건+ 로그 렌더 시 가시 영역 밖 row 가 DOM 에 존재하지 않음 (virtualization 본질 검증). 수동 브라우저 검증 또는 `grep` 기반 heuristic.
- [ ] **SHOULD6**: stagger animation + fadeIn preset 이 가상화 후에도 기존 인터랙션과 조화 (기존 `ANIMATION_PRESETS.fadeIn`, `getStaggerDelay` import 유지)

### 적용 verify 스킬

- `verify-frontend-state` (무한 스크롤 + useInfiniteQuery 정합)
- `verify-ssot` (Rule 0)
- `verify-hardcoding` (URL/키/상수)
- `verify-implementation` (fallback 자동 라우팅)
- `review-architecture` (SHOULD, 변경 영역)

## 종료 조건
- 필수 기준 전체 PASS → 성공 → /git-commit + main push (solo trunk-based)
- 동일 이슈 2회 연속 FAIL → 수동 개입
- 3회 반복 초과 → 수동 개입
- SHOULD 실패는 tech-debt-tracker 기록

## 비고
- **Mode 1**: lightweight — 단일 도메인(audit-logs), 2 파일 주 수정, 기존 패턴 재사용.
- **수정 방식**: main 브랜치 직접 작업 (사용자 요청 + CLAUDE.md 기본 원칙).
- **react-window v2 API**: `List<RowProps>` + `rowComponent` + `rowHeight` (number/function/DynamicRowHeight) + `rowProps` (stable ref required) + `onRowsRendered` (가시성 콜백 — IntersectionObserver 대체 가능)
- **무한 스크롤 전략**: IntersectionObserver 센티널 유지 OR `onRowsRendered` stopIndex 감시 중 1택 — 일관성 보장. 센티널은 가상화 리스트의 마지막 row 로 렌더해도 무방 (rowCount + 1).
- **높이 설정**: `List` 는 명시적 height 가 필요. `style={{ height: VIRTUALIZATION.defaultListHeight }}` 또는 부모 flex 로 제공. AuditLogsContent.tsx 무수정 원칙이라 컴포넌트 내부에서 height 결정.
