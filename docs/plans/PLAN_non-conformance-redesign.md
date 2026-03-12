# 부적합 관리 리디자인 계획서

> **CRITICAL INSTRUCTIONS**: After completing each phase:
>
> 1. ✅ Check off completed task checkboxes
> 2. 🧪 Run all quality gate validation commands
> 3. ⚠️ Verify ALL quality gate items pass
> 4. 📅 Update "Last Updated" date
> 5. 📝 Document learnings in Notes section
> 6. ➡️ Only then proceed to next phase
>
> ⛔ DO NOT skip quality gates or proceed with failing checks

**Feature:** 부적합 관리 리디자인 (Non-Conformance Management Redesign)
**Status:** 🔵 Planning
**Created:** 2026-03-12
**Last Updated:** 2026-03-12
**Estimated Scope:** Large (6 Phases)
**Wireframe:** `docs/wireframes/non-conformance-redesign.html`

---

## Overview

현재 부적합 관리는 장비 상세의 서브 페이지(`/equipment/[id]/non-conformance`)에 765줄 모놀리식 컴포넌트로 구현되어 있음. 교정계획, 반출 등 다른 도메인이 독립 리스트 + 상세 + Design Token + 컴포넌트 분리로 리디자인된 것과 큰 격차가 존재.

### 목표

1. **독립 리스트 페이지** `/non-conformances` — 시스템 전체 부적합 현황 조회
2. **독립 상세 페이지** `/non-conformances/[id]` — 4단계 워크플로우 시각화
3. **Design Token 확장** — 현재 3개 → 15+ 섹션 (calibration.ts 대칭)
4. **컴포넌트 분리** — 모놀리식 → 5+ 분리 컴포넌트
5. **사이드바 내비게이션** — 독립 메뉴 항목 추가

### 아키텍처 결정

| 결정                            | 근거                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| 독립 라우트 `/non-conformances` | 교정계획, 반출과 동일 패턴. 장비 하위 경로는 유지 (하위 호환) |
| PPR Non-Blocking 패턴           | 교정계획 page.tsx 패턴 재사용 (Suspense + async wrapper)      |
| URL-Driven Filter (SSOT)        | useState 필터 금지. `non-conformances-filter-utils.ts` 생성   |
| 백엔드 `includeSummary` 확장    | KPI 스트립에 서버 집계 사용 (클라이언트 계산 금지)            |
| 기존 장비 하위 페이지 유지      | 하위 호환성. 추후 리스트 페이지로 리다이렉트 가능             |
| NCWorkflowTimeline 신규         | ApprovalTimeline 패턴 기반, 4단계 수평 타임라인               |

---

## Phase 1: Design Token 확장 + 공유 유틸리티

**Goal:** 리디자인에 필요한 모든 Design Token과 SSOT 유틸리티를 먼저 준비

### Tasks

- [ ] **1.1** `non-conformance.ts` Design Token 확장 (현재 3개 → 15+ 섹션)

  - NC_STATUS_TOKENS: 4가지 상태별 badge/container/dot 스타일
  - NC_TYPE_TOKENS: 6가지 유형별 chip 스타일
  - NC_HEADER_TOKENS: 페이지 헤더 (title, meta, actions)
  - NC_KPI_TOKENS: KPI 스트립 4가지 variant
  - NC_FILTER_TOKENS: 필터 바 (CALIBRATION_FILTER_BAR 대칭)
  - NC_LIST_TOKENS: 리스트 행 (grid cols, hover, border)
  - NC_LIST_GRID_COLS: 반응형 그리드 컬럼
  - NC_WORKFLOW_TOKENS: 4단계 워크플로우 타임라인 (node, connector, label)
  - NC_DETAIL_HEADER_TOKENS: 상세 헤더
  - NC_INFO_CARD_TOKENS: 기본정보/수리연결 카드
  - NC_COLLAPSIBLE_TOKENS: 분석/조치/종결 섹션
  - NC_ACTION_BAR_TOKENS: 하단 액션 바
  - NC_ELAPSED_DAYS_TOKENS: 경과일 긴급도 (visual-feedback 재사용)
  - NC_MINI_WORKFLOW_TOKENS: 테이블 행 내 미니 프로그레스
  - NC_EMPTY_STATE_TOKENS: 빈 상태
  - NC_MOTION: 모션 프리셋 (TRANSITION_PRESETS 참조)
  - 모든 색상은 brand.ts 시맨틱 경유, raw 색상 직접 사용 금지

- [ ] **1.2** `design-tokens/index.ts`에 신규 토큰 export 추가

- [ ] **1.3** `non-conformances-filter-utils.ts` 생성 (URL-Driven SSOT)

  - `UINCFilters` 인터페이스 (status, ncType, siteId, search, page)
  - `DEFAULT_UI_NC_FILTERS` 상수
  - `parseNCFiltersFromSearchParams()` — URL → UI 필터
  - `convertNCFiltersToApiParams()` — UI 필터 → API 파라미터
  - `ncFiltersToSearchParams()` — UI 필터 → URL
  - `countActiveNCFilters()` — 활성 필터 수
  - `calibration-plans-filter-utils.ts` 패턴 완전 대칭

- [ ] **1.4** `use-nc-filters.ts` 훅 생성 (useCalibrationPlansFilters 패턴)

  - URL searchParams에서 필터 파싱 (useState 금지)
  - `router.replace()` 기반 필터 업데이트
  - `updateStatus`, `updateNcType`, `updateSiteId`, `updateSearch` 개별 핸들러
  - `resetFilters` 핸들러

- [ ] **1.5** `query-config.ts`에 `QUERY_CONFIG.NON_CONFORMANCES_LIST` / `NON_CONFORMANCES_DETAIL` 추가

- [ ] **1.6** `cache-invalidation.ts`에 `NonConformanceCacheInvalidation` 클래스 추가
  - `invalidateAfterStatusChange(queryClient, ncId)`
  - `invalidateAfterClose(queryClient, ncId, equipmentId)`
  - `invalidateList(queryClient)`

### Quality Gate

- [ ] `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] 모든 신규 토큰이 `index.ts`에서 export 확인
- [ ] 필터 유틸 함수 시그니처가 calibration-plans-filter-utils.ts와 대칭
- [ ] 기존 테스트 통과

---

## Phase 2: 백엔드 확장 (Summary 집계 + 검색)

**Goal:** 리스트 페이지 KPI 스트립에 필요한 서버 사이드 집계 추가
**Dependencies:** 없음 (Phase 1과 병렬 가능)

### Tasks

- [ ] **2.1** `findAll()` 엔드포인트에 `includeSummary` 쿼리 파라미터 추가

  - `summary: { total, open, analyzing, corrected, closed }` 반환
  - SQL GROUP BY 집계 (클라이언트 계산 금지)
  - 기존 응답 구조 하위 호환 유지 (`includeSummary` 없으면 summary 생략)

- [ ] **2.2** 검색 필터 확장

  - `search` 파라미터: 장비명 + 관리번호 + 원인 LIKE 검색
  - `siteId` 파라미터: 사이트별 필터
  - `ncType` 파라미터: 유형별 필터
  - SQL LIKE 와일드카드 이스케이프 (verify-sql-safety 준수)

- [ ] **2.3** 정렬 옵션 추가

  - `sort` 파라미터: `discoveryDate`, `status`, `ncType` (기본: discoveryDate DESC)

- [ ] **2.4** `non-conformances-api.ts` (클라이언트) 업데이트

  - `getNonConformances()` 쿼리 인터페이스에 `includeSummary`, `search`, `siteId`, `ncType` 추가
  - 응답 타입에 `meta.summary` 추가

- [ ] **2.5** `non-conformances-api-server.ts` (서버) 업데이트
  - `getNonConformancesList(params)` 함수 — 리스트 페이지 전용 서버 API

### Quality Gate

- [ ] `pnpm --filter backend run tsc --noEmit` 통과
- [ ] `pnpm --filter backend run test -- --grep "non-conformance"` 통과
- [ ] API 응답에 summary 필드 포함 확인 (curl 테스트)
- [ ] 기존 장비별 부적합 조회 하위 호환 확인

---

## Phase 3: 리스트 페이지 (`/non-conformances`)

**Goal:** 독립 리스트 페이지 — KPI 스트립 + 필터 + 테이블 + 미니 워크플로우
**Dependencies:** Phase 1 (토큰, 필터 유틸), Phase 2 (백엔드 summary)

### Tasks

- [ ] **3.1** `app/(dashboard)/non-conformances/page.tsx` 생성

  - PPR Non-Blocking 패턴 (Suspense + async wrapper)
  - 서버 사이드 role-based 필터 리다이렉트
  - `non-conformances-api-server.ts` 로 initialData 프리페치
  - `includeSummary: true` 전달

- [ ] **3.2** `app/(dashboard)/non-conformances/loading.tsx` 생성

  - `ListPageSkeleton` 재사용 (title, 4 filters, search, 8 cards)

- [ ] **3.3** `NonConformancesContent.tsx` 클라이언트 컴포넌트 생성

  - `useNCFilters` 훅으로 URL-driven 필터
  - `useQuery` + `placeholderData` (initialData)
  - `QUERY_CONFIG.NON_CONFORMANCES_LIST` 적용
  - KPI 스트립 / 필터 바 / 테이블 / 페이지네이션 렌더링

- [ ] **3.4** `components/non-conformances/NCStatsStrip.tsx` 생성

  - KPI 4칸: 미해결(critical), 분석중(warning), 조치완료(info), 종결(ok)
  - `NC_KPI_TOKENS` 사용
  - 클릭 시 필터 연동 (`updateStatus`)
  - `summary` 서버 집계 데이터 사용

- [ ] **3.5** `components/non-conformances/NCFilterBar.tsx` 생성

  - 상태 / 유형 / 사이트 Select + 검색 Input
  - `NC_FILTER_TOKENS` 사용
  - 활성 필터 태그 + 초기화 버튼
  - `useNCFilters` 훅 연동

- [ ] **3.6** `components/non-conformances/NCListTable.tsx` 생성

  - 테이블 헤더: 상태 | 유형 | 장비 | 원인 | 발견일 | 경과일 | 액션
  - `NC_LIST_TOKENS`, `NC_LIST_GRID_COLS` 사용
  - 경과일 긴급도: `getElapsedDaysUrgency()` (visual-feedback.ts)
  - 장기 미조치 행 강조 (14일+: warning border, 30일+: critical border)
  - 장비 링크 → `/equipment/[id]`
  - 상세 링크 → `/non-conformances/[id]`

- [ ] **3.7** `components/non-conformances/NCMiniWorkflow.tsx` 생성

  - 테이블 행 내 4-step 인라인 프로그레스 dot
  - `NC_MINI_WORKFLOW_TOKENS` 사용
  - done/current/pending 상태별 dot 스타일

- [ ] **3.8** `route-metadata.ts`에 `/non-conformances` 라우트 메타 추가

- [ ] **3.9** `nav-config.ts` 사이드바에 부적합 관리 메뉴 추가

  - Operations 섹션, Calibration 아래 위치
  - `Permission.VIEW_NON_CONFORMANCES` 권한 제한
  - 아이콘: `AlertTriangle` (lucide-react)

- [ ] **3.10** i18n 번역 키 추가 (`messages/ko/non-conformances.json` 확장)

### Quality Gate

- [ ] `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] `pnpm --filter frontend run lint` 통과
- [ ] `/non-conformances` 페이지 렌더링 확인
- [ ] KPI 스트립 서버 집계 데이터 표시 확인
- [ ] 필터 변경 시 URL 파라미터 반영 확인
- [ ] 경과일 색상 (normal/warn/critical) 정확성 확인
- [ ] 사이드바 메뉴 노출 + 권한 필터링 확인

---

## Phase 4: 상세 페이지 (`/non-conformances/[id]`)

**Goal:** 독립 상세 페이지 — 워크플로우 타임라인 + 정보 카드 + 분석/조치 섹션
**Dependencies:** Phase 1 (토큰), Phase 2 (백엔드)

### Tasks

- [ ] **4.1** `app/(dashboard)/non-conformances/[id]/page.tsx` 생성

  - PPR Non-Blocking 패턴
  - `non-conformances-api-server.ts` 로 상세 프리페치
  - 404 처리 (`isNotFoundError → notFound()`)

- [ ] **4.2** `app/(dashboard)/non-conformances/[id]/loading.tsx` 생성

- [ ] **4.3** `components/non-conformances/NCDetailClient.tsx` 생성 (메인 클라이언트)

  - `useQuery` + `placeholderData`
  - 브레드크럼 동적 라벨 설정
  - 역할별 액션 가능 여부 계산
  - 서브 컴포넌트 조합 (Timeline + InfoCards + Analysis + ActionBar)
  - `useMutation` for status change, close, reject-correction

- [ ] **4.4** `components/non-conformances/NCWorkflowTimeline.tsx` 생성

  - 4단계 수평 타임라인 (open → analyzing → corrected → closed)
  - `NC_WORKFLOW_TOKENS` 사용
  - completed/current/pending 노드 스타일
  - current-critical: 장기 미조치 시 pulse 애니메이션
  - 각 단계별 날짜 + 담당자 표시
  - 커넥터 라인 (done: brand-ok, pending: border-default)

- [ ] **4.5** `components/non-conformances/NCInfoCards.tsx` 생성

  - 2-column grid: 기본 정보 카드 + 수리 연결 카드
  - `NC_INFO_CARD_TOKENS` 사용
  - 기본 정보: 유형, 발견자, 발견일, 원인, 조치계획
  - 수리 연결: 연결됨(ok 스타일) / 미연결+수리필요(warning 스타일) / 해당없음
  - 수리 이력 등록 링크 → `/equipment/[id]/repair-history?ncId=...&autoOpen=true`

- [ ] **4.6** `components/non-conformances/NCAnalysisSection.tsx` 생성

  - 3개 Collapsible 섹션: 원인 분석 / 시정 조치 / 종결 의견
  - `NC_COLLAPSIBLE_TOKENS` 사용 (COLLAPSIBLE_TOKENS 패턴)
  - 읽기 모드: 기존 내용 표시 + 날짜/작성자 메타
  - 편집 모드: Textarea + 저장/취소 (역할 제한)
  - CAS: `useOptimisticMutation` + version 필드

- [ ] **4.7** `components/non-conformances/NCActionBar.tsx` 생성

  - 역할별 동적 액션 버튼
  - 시험실무자: 상태 변경 (분석중/조치완료) + 저장
  - 기술책임자: 조치 반려 + 종결 승인
  - `NC_ACTION_BAR_TOKENS` + `ACTION_BUTTON_TOKENS` 사용
  - 확인 다이얼로그 (Dialog 컴포넌트)

- [ ] **4.8** 반려 사유 Alert 컴포넌트

  - `rejection_reason` 존재 시 상단 표시
  - `brand-critical` 배경 + 아이콘
  - 반려일 + 반려자 표시

- [ ] **4.9** `route-metadata.ts`에 `/non-conformances/[id]` 메타 추가

### Quality Gate

- [ ] `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] `pnpm --filter frontend run lint` 통과
- [ ] `/non-conformances/[id]` 페이지 렌더링 확인
- [ ] 4단계 워크플로우 타임라인 상태별 정확성 확인
- [ ] CAS 버전 충돌 시 에러 처리 확인
- [ ] 역할별 액션 버튼 노출/숨김 확인
- [ ] 수리 연결 링크 동작 확인

---

## Phase 5: 기존 페이지 통합 + 하위 호환

**Goal:** 기존 장비별 부적합 페이지를 새 리스트/상세로 연결, 승인 페이지 통합
**Dependencies:** Phase 3, Phase 4

### Tasks

- [ ] **5.1** `/equipment/[id]/non-conformance` → 새 리스트 페이지 연동

  - 기존 페이지에서 "전체 부적합 관리" 링크 추가
  - 장비별 필터 적용: `/non-conformances?equipmentId=[id]`
  - 기존 페이지는 유지 (장비 상세에서 빠른 접근용)

- [ ] **5.2** `/admin/non-conformance-approvals` → 새 리스트 페이지로 리다이렉트

  - `?status=corrected` 필터 적용 리다이렉트
  - 기존 페이지의 종결 기능은 상세 페이지 NCActionBar로 이전
  - admin 승인 페이지는 리다이렉트만 남기고 deprecated

- [ ] **5.3** 대시보드 부적합 위젯 링크 업데이트

  - `AlertBanner`, `KpiStatusGrid` 등의 부적합 링크 → `/non-conformances`로 변경

- [ ] **5.4** `NonConformanceBanner` 컴포넌트 "관리" 버튼 링크 업데이트

  - 장비 상세에서 보이는 부적합 배너 → 개별 NC 상세 페이지 링크 추가

- [ ] **5.5** 기존 `NonConformanceManagementClient.tsx` 경량화
  - 등록 폼만 유지 (장비 상세에서 빠른 등록용)
  - 목록/수정/상태변경은 새 리스트/상세 페이지로 이동 안내
  - 또는 `/non-conformances?equipmentId=[id]`로 리다이렉트

### Quality Gate

- [ ] `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] 기존 장비 상세 → 부적합 탭 동작 유지 확인
- [ ] `/admin/non-conformance-approvals` → 리다이렉트 확인
- [ ] 대시보드 링크 정상 동작 확인
- [ ] 모든 기존 부적합 관련 기능 하위 호환 확인

---

## Phase 6: 검증 + 접근성 + 최종 정리

**Goal:** 전체 흐름 검증, 접근성, 스켈레톤 일관성, 코드 리뷰
**Dependencies:** Phase 1–5 모두 완료

### Tasks

- [ ] **6.1** verify-design-tokens 스킬 실행 — 하드코딩 토큰 탐지
- [ ] **6.2** verify-frontend-state 스킬 실행 — useState 남용 탐지
- [ ] **6.3** verify-ssot 스킬 실행 — 로컬 재정의 탐지
- [ ] **6.4** 접근성 검증
  - 모든 아이콘에 `aria-hidden="true"` 확인
  - 버튼/링크에 접근 가능한 라벨 확인
  - focus-visible 스타일 확인 (FOCUS_TOKENS)
  - 키보드 네비게이션 (Tab, Enter, Escape)
- [ ] **6.5** 반응형 검증
  - 모바일(375px): KPI 2×2, 테이블 카드 뷰 전환
  - 태블릿(768px): 적절한 그리드 조정
  - 데스크탑(1200px): 전체 레이아웃
- [ ] **6.6** 스켈레톤 일관성
  - loading.tsx 스켈레톤이 실제 컨텐츠 레이아웃과 1:1 매칭
- [ ] **6.7** 미사용 import/변수 정리 (자신의 변경으로 인한 잔여물만)
- [ ] **6.8** i18n 완전성 — en/ko 키 쌍 확인

### Quality Gate

- [ ] `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] `pnpm --filter frontend run lint` 통과
- [ ] `pnpm --filter backend run tsc --noEmit` 통과
- [ ] verify-design-tokens: 하드코딩 0건
- [ ] verify-frontend-state: useState 위반 0건
- [ ] verify-ssot: 로컬 재정의 0건
- [ ] 브라우저 수동 테스트: 전체 CRUD 플로우 확인

---

## Risk Assessment

| 리스크                                   | 확률 | 영향 | 완화 전략                                           |
| ---------------------------------------- | ---- | ---- | --------------------------------------------------- |
| 백엔드 summary 집계 성능                 | 낮음 | 중간 | GROUP BY 인덱스 확인, 캐시 적용                     |
| 기존 장비별 부적합 페이지 하위 호환 깨짐 | 중간 | 높음 | Phase 5에서 점진적 마이그레이션, 기존 페이지 유지   |
| NC 상태 전이 로직 프/백 불일치           | 낮음 | 높음 | VALID_TRANSITIONS 상수를 schemas 패키지로 이동 검토 |
| Design Token 과다 — 유지보수 부담        | 낮음 | 낮음 | calibration.ts 22개 대칭으로 범위 제한              |

## Rollback Strategy

| Phase   | 롤백 방법                                  |
| ------- | ------------------------------------------ |
| Phase 1 | 토큰 파일 삭제, index.ts export 제거       |
| Phase 2 | 백엔드 쿼리 파라미터 무시 (기존 동작 유지) |
| Phase 3 | 라우트 디렉토리 삭제, nav-config 원복      |
| Phase 4 | 라우트 디렉토리 삭제                       |
| Phase 5 | 링크 원복 (git revert)                     |
| Phase 6 | N/A (검증만 수행)                          |

---

## File Map

```
신규 생성:
├── apps/frontend/
│   ├── app/(dashboard)/non-conformances/
│   │   ├── page.tsx                              # Phase 3
│   │   ├── loading.tsx                           # Phase 3
│   │   ├── NonConformancesContent.tsx            # Phase 3
│   │   └── [id]/
│   │       ├── page.tsx                          # Phase 4
│   │       └── loading.tsx                       # Phase 4
│   ├── components/non-conformances/
│   │   ├── NCStatsStrip.tsx                      # Phase 3
│   │   ├── NCFilterBar.tsx                       # Phase 3
│   │   ├── NCListTable.tsx                       # Phase 3
│   │   ├── NCMiniWorkflow.tsx                    # Phase 3
│   │   ├── NCDetailClient.tsx                    # Phase 4
│   │   ├── NCWorkflowTimeline.tsx                # Phase 4
│   │   ├── NCInfoCards.tsx                       # Phase 4
│   │   ├── NCAnalysisSection.tsx                 # Phase 4
│   │   └── NCActionBar.tsx                       # Phase 4
│   ├── hooks/
│   │   └── use-nc-filters.ts                     # Phase 1
│   └── lib/
│       └── utils/
│           └── non-conformances-filter-utils.ts  # Phase 1

수정:
├── apps/frontend/lib/
│   ├── design-tokens/
│   │   ├── components/non-conformance.ts         # Phase 1 (확장)
│   │   └── index.ts                              # Phase 1 (export 추가)
│   ├── api/
│   │   ├── query-config.ts                       # Phase 1 (QUERY_CONFIG 추가)
│   │   ├── cache-invalidation.ts                 # Phase 1 (NC 클래스 추가)
│   │   ├── non-conformances-api.ts               # Phase 2 (쿼리 확장)
│   │   └── non-conformances-api-server.ts        # Phase 2 (리스트 함수)
│   └── navigation/
│       ├── nav-config.ts                         # Phase 3 (메뉴 추가)
│       └── route-metadata.ts                     # Phase 3, 4 (라우트 메타)
├── apps/backend/src/modules/non-conformances/
│   ├── non-conformances.controller.ts            # Phase 2 (summary, search)
│   └── non-conformances.service.ts               # Phase 2 (집계 쿼리)
└── apps/frontend/
    ├── components/equipment/NonConformanceBanner.tsx  # Phase 5 (링크 업데이트)
    └── app/(dashboard)/
        ├── equipment/[id]/non-conformance/       # Phase 5 (통합)
        └── admin/non-conformance-approvals/      # Phase 5 (리다이렉트)
```

---

## Notes & Learnings

_(Phase 완료 시 여기에 기록)_
