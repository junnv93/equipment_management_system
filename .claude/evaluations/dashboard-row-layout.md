---
slug: dashboard-row-layout
verdict: FAIL
iteration: 1
---

# Evaluation Report — Dashboard Row Layout

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M-01 | `DASHBOARD_GRID.row3` 존재, `minmax(280px,1fr)` 포함 | PASS | `dashboard-config.ts:102` — `row3: 'grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,1fr)] gap-4 items-start'` |
| M-02 | `DASHBOARD_GRID.bottomRow`에 `items-stretch` 사용 (`items-start` 미존재) | PASS | `dashboard-config.ts:108` — `bottomRow: '... gap-4 items-stretch'`. `items-start`는 `row3`에만 존재하며 `bottomRow`에 없음 |
| M-03 | `DashboardClient.tsx`에 인라인 `grid-cols-[1fr_280px]` 미존재 | PASS | grep 결과 0건. 검색 히트 2건(lines 219, 222)은 JSX 주석(`* ...`) 내 텍스트 — className에 미사용 |
| M-04 | `DashboardClient.tsx`가 `DASHBOARD_GRID.row3` 사용 | PASS | `DashboardClient.tsx:230` — `className={cn(DASHBOARD_GRID.row3, 'mb-8 motion-safe:animate-fade-in-up')}` |
| M-05 | `DASHBOARD_CALENDAR_TOKENS.container`에 `flex-1` 포함 | PASS | `dashboard.ts:395` — `container: \`flex-1 bg-card border border-border rounded-lg flex flex-col overflow-hidden ...\`` |
| M-06 | `DashboardClient.tsx` 사이드바 wrapper에 `h-full` 포함 | PASS | `DashboardClient.tsx:286` — `<div className="flex flex-col gap-4 h-full">` |
| M-07 | `loading.tsx` Row 3에 인라인 `1fr_280px` 미존재 | PASS | grep 결과 0건. `loading.tsx:52`는 `DASHBOARD_GRID.row3` SSOT 참조 사용 |
| M-08 | `tsc --noEmit` 오류 없음 | PASS | `pnpm --filter frontend exec tsc --noEmit` — 출력 없음 (오류 0건) |
| M-09 | build 성공 | **FAIL** | `pnpm --filter frontend run build` — exit status 1. 오류: `Error occurred prerendering page "/~offline"` — `Event handlers cannot be passed to Client Component props` (`apps/frontend/app/~offline/page.tsx:26` button onClick). 빌드 프로세스 종료 코드 1 |

## SHOULD Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| S-01 | `loading.tsx` Row 4 sidebar wrapper에 `h-full` 포함 | PASS | `loading.tsx:113` — `<div className="flex flex-col gap-4 h-full">` |
| S-02 | `DASHBOARD_GRID.actionRow` 구버전 키 제거 또는 deprecation 주석 추가 | PASS | `dashboard-config.ts` 전체 검색 결과 `actionRow` 키 미존재 — 구버전 키가 제거된 상태 |

## Summary

M-01 ~ M-08 및 SHOULD S-01/S-02 전 항목이 통과한다. 그러나 M-09(build 성공) 기준이 실패하여 최종 판정은 **FAIL**이다. 빌드 실패 원인은 대시보드 레이아웃 변경과 무관한 `apps/frontend/app/~offline/page.tsx`에서 Server Component(`'use client'` 미선언)가 `button`의 `onClick` 핸들러를 사용하는 기존 버그다 — 해당 파일은 `feat(pwa)` 커밋(`49fdf5ca`)에서 도입되었으며 이번 대시보드 패치(`2ab9db8f`)에서는 수정되지 않았다. 계약 기준은 부분 점수를 허용하지 않으므로 M-09 FAIL = 전체 FAIL이다. `~offline/page.tsx`에 `'use client'` 지시어를 추가하거나 `onClick`을 Client Component로 분리하면 빌드가 통과될 것으로 예상된다.
