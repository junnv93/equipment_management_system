# 스프린트 계약: 누락된 loading.tsx 추가 (6개 라우트)

## 생성 시점
2026-04-01

## Context

page.tsx는 있지만 loading.tsx가 없는 라우트에 로딩 스켈레톤 추가.
Next.js 16 PPR에서 loading.tsx는 라우트 전환 시 즉시 표시되는 스켈레톤.
각 page.tsx의 Suspense fallback과 동일한 컴포넌트를 재사용하여 PPR 경험 일관성 보장.

**대상 라우트 (6개):**
- (dashboard)/checkouts/pending-checks/ → RouteLoading variant="table"
- (dashboard)/checkouts/[id]/ → RouteLoading variant="detail"
- (dashboard)/reports/calibration-factors/ → CalibrationFactorsLoadingSkeleton (인라인)
- (dashboard)/equipment/create/ → CreateEquipmentFormSkeleton (인라인)
- (dashboard)/calibration/register/ → 텍스트 fallback → RouteLoading variant="detail"로 개선
- (dashboard)/teams/create/ → CreateTeamPageSkeleton (인라인, container 포함)

**제외 (순수 redirect):** checkouts/manage/, checkouts/import/

## 성공 기준

### 필수 (MUST)
- [ ] M1: `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] M2: `pnpm --filter frontend run build` 성공
- [ ] M3: 각 loading.tsx가 해당 page.tsx의 Suspense fallback과 동일한 스켈레톤 사용
- [ ] M4: 순수 redirect 라우트(manage/, import/)에는 loading.tsx 미생성
- [ ] M5: design token (`getPageContainerClasses` 등) 사용 — 하드코딩 금지
- [ ] M6: 모든 loading.tsx는 Server Component (use client 없음)

### 권장 (SHOULD)
- [ ] S1: 기존 프로젝트 loading.tsx 네이밍 컨벤션 준수 (`XxxLoading`)
- [ ] S2: 인라인 스켈레톤이 있는 page.tsx는 스켈레톤을 export하여 loading.tsx에서 재사용 (DRY)

### 적용 verify 스킬
- verify-hardcoding (하드코딩 검출)
- verify-design-tokens (디자인 토큰 레이어 참조)
- verify-nextjs (Next.js 16 패턴)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
