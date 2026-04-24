# Harness 완료 프롬프트 아카이브 — UI/UX 디자인 리뷰

> 완료 처리된 프롬프트 섹션들. 최신 차수부터 역순 정렬.
> 전체 인덱스: [archive-index.md](./archive-index.md)

---

## ~~반출입 관리 PR-22: Checkout API 정리~~ ✅ 완료 (2026-04-24, 85차)

> getCheckoutSummary() 이미 제거됨 확인. CheckoutQuery.userId·startDate 레거시 필드 제거 (grep 실측 기반).
> verifyHandoverToken @UseInterceptors 이미 완료됨 확인.

```
조치:
- checkout-api.ts: CheckoutQuery.userId (line 153), startDate (line 158) 제거 — codebase grep 실측 결과 사용처 0
- checkouts.controller.ts: verifyHandoverToken @UseInterceptors(ZodSerializerInterceptor) line 195 이미 존재 → 스킵
- getCheckoutSummary(): 이전 세션에 이미 제거됨 → 스킵
- frontend tsc + backend tsc 모두 통과
```

---

## ~~반출입 관리 PR-7: HeroKPI·SparklineMini 컴포넌트 분리 + celebration EmptyState~~ ✅ 완료 (2026-04-24, 85차)

> AP-01·02·03·06·09 완료. g.statuses.includes('overdue') → CSVal.OVERDUE SSOT 교정 포함.

```
조치:
- HeroKPI.tsx 신규: ELEVATION_TOKENS.surface.floating + TYPOGRAPHY_TOKENS.kpi + trend 아이콘(TrendingUp/TrendingDown/Minus)
- SparklineMini.tsx 신규: 인라인 SVG polyline + min-max 정규화 + stroke=currentColor + aria-hidden
- OutboundCheckoutsTab: hero 카드 → HeroKPI 교체(col-span-2 유지), SparklineMini 슬롯, celebration EmptyState 분기
- InboundCheckoutsTab: SparklineMini 슬롯 추가
- CheckoutListSkeleton: getStaggerDelay stagger 적용 (두 탭 DRY)
- CheckoutsContent: SECTION_RHYTHM_TOKENS.spacious 적용
- semantic.ts: EMPTY_STATE_TOKENS celebration (text-brand-ok/bg-brand-ok/5) 추가
- g.statuses.includes('overdue') → g.statuses.includes(CSVal.OVERDUE) SSOT 교정
- 커밋: 84b9393d (병렬 세션)
```

---

## ~~반출입 관리 PR-3: Design Token Layer 2 확장~~ ✅ 완료 (2026-04-24, 82차)

> surface 5단/typography flat/CHECKOUT_ICON_MAP/NEXT_STEP_PANEL_TOKENS/brand-틴트/ring-dashed.
> PR-4·7·9·14 블로킹 해소.

```
조치:
- semantic.ts: ELEVATION_TOKENS.surface(flush/raised/floating/emphasis/overlay 5단) + TYPOGRAPHY_TOKENS + SPACING_RHYTHM_TOKENS export 추가
- checkout.ts: CHECKOUT_STEPPER_TOKENS.status.next + CHECKOUT_STATS_VARIANTS.hero + CHECKOUT_ROW_TOKENS.hover 추가
- workflow-panel.ts 신규: NEXT_STEP_PANEL_TOKENS (floating/inline/compact/labels/values/urgency/actionButton/terminal)
- checkout-icons.ts 신규: CHECKOUT_ICON_MAP (status/action/emptyState/urgency — 컴포넌트 단위 재선언 금지)
- brand.ts: brand-progress(진행중 블루그레이) + brand-archive(완료/취소 회색) CSS 변수 2개 추가
- globals.css: :root + .dark 양쪽 CSS 변수 정의 (hex 하드코딩 0건 — CSS 변수 경유)
- index.ts: workflow-panel.ts + checkout-icons.ts re-export 추가
- globals.css @layer utilities: .ring-dashed { outline: 2px dashed; outline-offset: 2px; } 추가
```

---

## ~~NC 상세 페이지 "다음 단계 가이던스" — Phase 1~4 프롬프트 (4건)~~ ✅ 전체 완료 (2026-04-22)

> **배경 (2026-04-21, /review-design 부적합관리 상세 64/100)**: AP-01~10 개선 + 4개 안내 UI(반려 배너·전제조건 블록·roleHint·waitingGuidance)를 단일 GuidanceCallout 추상화로 통합.
> 실행 순서: NC-P1 → NC-P2·NC-P3 병렬 → NC-P4.

### ~~🟠 HIGH — NC-P1: Layer 2 Semantic 토큰 추가 — SECTION_RHYTHM, CALLOUT_TOKENS, staggerFadeInItem (Mode 0)~~ ✅

```
조치: semantic.ts에 SECTION_RHYTHM_TOKENS(tight/comfortable/spacious/dramatic) + getSectionRhythm(),
CALLOUT_TOKENS(5 variant × 3 emphasis × 3 size) + getCalloutClasses() 추가.
motion.ts에 ANIMATION_PRESETS.staggerFadeInItem(motion-reduce:opacity-100 guard) + getStaggerFadeInStyle() 추가.
index.ts re-export 추가. 비파괴 — 기존 export 불변.
```

### ~~🟠 HIGH — NC-P2: Layer 3 NC 토큰 + i18n — NC_WORKFLOW_GUIDANCE_TOKENS + detail spacing + 섹션 정리 (Mode 0)~~ ✅

```
조치: non-conformance.ts 섹션 20 추가 — NC_WORKFLOW_GUIDANCE_TOKENS(11 state×role 매트릭스) + resolveNCGuidanceKey() 순수 함수.
NC_SPACING_TOKENS.detail 6개 속성(pageWrapper/statusGroup/statusToContextGap/contextGroup/contextToActionGap/calloutAfterTimeline) getSectionRhythm() 경유.
섹션 17b 중복 정리 + NC_INFO_NOTICE_TOKENS @deprecated + NC_GUIDANCE_STEP_BADGE_TOKENS 추가.
ko/en i18n detail.guidance 11 시나리오 × 3 필드 + nextStep 레이블 + correction.emptyTitle/addAction + actionBar.hintNeedsContent 추가.
```

### ~~🟡 MEDIUM — NC-P3: URGENT_BADGE_TOKENS Semantic 승격 + NC_URGENT_BADGE_TOKENS @deprecated re-export (Mode 0)~~ ✅

```
조치: semantic.ts에 URGENT_BADGE_TOKENS(solid/outlined) Semantic Layer 2 추가.
NC_URGENT_BADGE_TOKENS → URGENT_BADGE_TOKENS.solid @deprecated re-export 유지(NCDetailClient.tsx:311 현재 사용 중).
```

### ~~🔴 CRITICAL — NC-P4: NCDetailClient.tsx 리팩토링 + GuidanceCallout 컴포넌트 + EmptyState 전환 + E2E (Mode 1)~~ ✅

```
조치:
- libs/non-conformances/guidance.ts — deriveGuidance() 순수함수(getNCPrerequisite + resolveNCGuidanceKey 경유).
- GuidanceCallout.tsx — React.memo + role="status" aria-live="polite", 11 state×role, ctaKind discriminated union('primary'|'repairLink'|'calibrationLink'|'none').
- NCDetailClient.tsx — statusGroup/contextGroup 2-섹션 구조, NC_INFO_NOTICE_TOKENS 블록 제거,
  correction/closure EmptyState 전환, scrollToActionBar(smooth+focus 400ms 가드),
  nc.status 전환 후 guidance title 포커스 복귀(h2 tabIndex={-1}), URGENT_BADGE_TOKENS.solid 교체.
- nc-guidance.spec.ts — 5 시나리오 E2E(blockedRepair/emptyCorrection/OPEN→CORRECTED/반려반려/CLOSED).
```

---

## ~~78차 — 반출입 관리 페이지 디자인/IA 개선 (2026-04-21)~~ ✅ 전체 완료 (2026-04-21)

> **배경**: 디자인 리뷰 64/100 판정. SSOT 토큰 우회·워크플로우 진입 실패·반입탭 IA 혼란·모바일 숨김 등 아키텍처 결함.

### ~~✅ DONE — 78-1: 타이포 primitives 확장 + checkout 토큰 SSOT 복구~~ ✅ 완료 (2026-04-21)

```
조치: primitives.ts 2xs(10px) 추가 → semantic.ts MICRO_TYPO 3종(badge/label/caption) →
      checkout.ts 하드코딩 7곳 토큰 교체. CheckoutGroupCard text-[10px] → MICRO_TYPO.badge.
```

### ~~✅ DONE (b9e1b989) — 78-2: 공용 EmptyState 컴포넌트 + 3-variant 팩토리 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: EMPTY_STATE_TOKENS 공용 승격, components/shared/EmptyState.tsx no-data|filtered|status-filtered 3종.
      OutboundCheckoutsTab/InboundCheckoutsTab 마이그레이션, 첫 사용자 CTA(Permission 연동), i18n 추가.
```

### ~~✅ DONE — 78-3: 워크플로우 가시성 — MiniProgress/RentalFlow 재설계 + 모바일 접근성 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: CHECKOUT_STEP_LABELS SSOT 승격, CheckoutMiniProgress hidden sm:flex 제거 → 모바일 단계명 텍스트,
      RentalFlowInline 7px 원 → 칩+tooltip 패턴, RENTAL_FLOW_INLINE_TOKENS chip/chipText/tooltipList 신규.
```

### ~~✅ DONE — 78-4: 반입 탭 IA 재구성 + 3섹션 페이지네이션 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: CHECKOUT_INBOUND_SECTION_TOKENS, InboundSectionHeader 3-variant(teamLoan/externalRental/internalShared),
      use-inbound-section-pagination URL 파라미터, SELECTOR_PAGE_SIZE → 독립 페이지네이션, 섹션별 빈 상태.
```

### ~~✅ DONE — 78-5: 통계 카드 계층화 + Alert 배너 elevation (Mode 0)~~ ✅ 완료 (2026-04-21)

```
조치: CHECKOUT_STATS_VARIANTS alertRing 추가, CHECKOUT_STATS_ALERT_THRESHOLD SSOT({pending:10}),
      overdue>0 ring-2 강조, CHECKOUT_ALERT_TOKENS shadow-md/shadow-sm, activeFilter text-[9px] → MICRO_TYPO.
```

### ~~✅ DONE — 78-6: PageHeader onboardingHint 슬롯 + 테이블 프리미엄 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: OnboardingHint interface, use-onboarding-hint 훅(localStorage dismiss), PAGE_HEADER_TOKENS.onboarding* 3종,
      PREMIUM_TABLE_TOKENS(stripe/stickyHeader/importantCol) 신규, CheckoutsContent/InboundTab 적용.
```

### ~~✅ DONE — 78-7: 모션 & 접근성 마감 (Mode 0)~~ ✅ 완료 (2026-04-21)

```
조치: STAGGER_PRESETS(statsCards 40ms/listGroups 60ms) 신규, renderLoadingState role="status" aria-busy,
      sr-only 로딩 텍스트. 자체감사: staggerItem dead token 제거, PREMIUM_TABLE_TOKENS 누락 보완,
      max-w-[160px] → CHECKOUT_INTERACTION_TOKENS.destinationLabel SSOT.
```

---

## ~~부적합 관리 페이지 디자인 리뷰 후속 — 1차·2차 전체 이슈 (9건)~~ ✅ 전체 완료 (2026-04-21)

> **발견 배경**: `/non-conformances` 목록+상세 디자인 리뷰 22건. 버그 2·SSOT 3·온보딩 5·접근성 3·i18n 2·AP 7건.
> 의존 순서: **P1 → P2 → P5 → P6 → P7** (P3·P4·P8·P9 독립).

### ~~✅ DONE (f0896a9b·9f94275e·3ac54412) — P1: NC 워크플로우 종결 노드 색상 버그 수정 (Mode 0)~~ ✅ 완료 (2026-04-21)

```
조치: getNCWorkflowNodeClasses/LabelClasses terminal state 분기 추가(closed→completed green),
      NC_TERMINAL_STEP_INDEX = NC_WORKFLOW_STEPS.length - 1 상수화.
```

### ~~✅ DONE (08980674·9f94275e·3ac54412) — P2: NC 리스트 스태거 애니메이션 Dead Code 제거 + SSOT 복구 (Mode 0)~~ ✅ 완료 (2026-04-21)

```
조치: NC_STAGGER_DELAY_MS 제거, NCListRow에 ANIMATION_PRESETS.slideUpFade 적용,
      raw 곱셈 → getStaggerDelay(index, 'list') SSOT 함수 사용.
```

### ~~✅ DONE (a505d2c2·a16d95cd) — P3: NC i18n 정리 — 내부 데이터 노출 + management.* 레거시 키 (Mode 0)~~ ✅ 완료 (2026-04-21)

```
조치: NCDetailClient version/createdAt/updatedAt InfoRow 3개 + 컨테이너 제거,
      messages/ko+en "management" 70+키 제거.
```

### ~~✅ DONE (a505d2c2) — P4: NC 접근성 일괄 — aria-pressed / aria-hidden / aria-label (Mode 0)~~ ✅ 완료 (2026-04-21)

```
조치: KPI 버튼 aria-pressed + aria-label, MiniWorkflow 컨테이너 aria-hidden="true",
      페이지네이션 prev/next aria-label + 숫자 aria-label + aria-current="page".
```

### ~~✅ DONE (b9e1b989·106ba84d) — P5: NC SSOT 일괄 — NCDocumentsSection 토큰화 + 이모지 제거 + Collapsible 모션 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: NC_DOCUMENTS_SECTION_TOKENS 신규, NCDocumentsSection raw Tailwind → 토큰 교체,
      🔧/✅ 이모지 → Wrench/CheckCircle2 Lucide, NC_COLLAPSIBLE_TOKENS grid-rows 애니메이션.
```

### ~~✅ DONE (106ba84d) — P6: NC 신규 유저 온보딩 종합 — roleHint 강화 + 빈 상태 CTA + KPI 필터 힌트 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: NC_ACTION_BAR_TOKENS roleHintActive/waitingGuidance/waitingGuidanceIcon 추가,
      NC_KPI_CARD_TOKENS.filterHint, EmptyState hasFilters=false → /equipment CTA 링크.
```

### ~~✅ DONE (106ba84d) — P7: NC 상세 Sticky Action Bar + Elevation 3단계 체계 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: NC_ELEVATION flush/raised/floating 상수, KPI/정보카드/Collapsible shadow-sm(raised),
      ActionBar shadow-md+ring(floating), stickyWrapper sticky bottom-4 z-10.
```

### ~~✅ DONE (a505d2c2) — P8: NC 리스트 모바일 레이아웃 + 테이블 프리미엄 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: NC_LIST_MOBILE_TOKENS 신규, NCListRow hidden lg:grid/lg:hidden block 이중 레이아웃,
      모바일 카드(상태배지+경과일/장비명/원인+Eye), even:bg-muted/20 stripe.
```

### ~~✅ DONE (a505d2c2) — P9: NC 카드 계층화 + 간격 리듬 재설계 + 타이포 드라마 강화 (Mode 1)~~ ✅ 완료 (2026-04-21)

```
조치: NC_SPACING_TOKENS 5단계(pageOuter/afterHeader/afterKpi/afterFilter/afterList),
      NC_KPI_CARD_TOKENS heroValue/heroCard(open>0 동적 강조),
      NC_INFO_CARD_TOKENS.gridRepairLinked 비율 조정(1fr/1.2fr).
```

---

## ~~40차 신규 — 중간점검 통합 워크플로우 UX 개선 (Mode 2)~~ ✅ 전체 완료 (2026-04-10)

> **발견 배경 (2026-04-10, 40차)**: 9개 실제 완성 문서(E0001~E0350) 분석 결과,
> 점검 항목·측정 장비·결과 섹션이 현재 2단계 UX(생성 → 목록 펼침)로 분리되어 있음.
> 실무자가 한 화면에서 점검 전체를 완료할 수 없는 UX 갭. 또한 점검주기/교정유효기간은
> 장비 마스터 데이터에서 자동 적용 가능하고, 점검 항목은 9개 문서에서 반복되는 패턴이
> 프리셋으로 제공 가능.

### ~~🟠 HIGH — 중간점검 폼 통합 리디자인 (InspectionFormDialog → 통합 워크플로우)~~ ✅ 완료 (2026-04-10 41차)

> 검증: Mode 2 harness 실행. 1-step UX 구현 (inspection + resultSections 동시 생성).
> 12개 프리셋 (9개 실제 문서 기반), 장비 마스터 prefill (중간점검 주기, 교정유효기간 기간 표시),
> InlineResultSectionsEditor 통합, classification 교정기기 고정, "측정 결과 데이터" 리네이밍.
> E2E 5/5 통과. tsc + build + backend test 559 전체 PASS.

### 원문 (참고용)

```
현재 문제:
1. 점검 생성(InspectionFormDialog) → 목록으로 돌아감 → 행 펼침 → 결과 섹션 추가
   = 2단계 UX, 사용자가 점검 완료까지 왕복해야 함
2. 점검주기/교정유효기간을 수동 입력해야 함 (장비 마스터에 이미 있는 데이터)
3. 점검 항목을 매번 수동 입력 (9/9 문서에서 "외관 검사"가 반복됨)

실제 문서 분석 결과 (C:\...\새 폴더, 9개 완성 문서):

■ 점검 항목 프리셋 (9개 문서에서 추출):
  - [9/9] 외관 검사 — 기준: 마모 상태 확인
  - RF 입력 검사 — 기준: S/G Level ±1 dB
  - DC 전압 출력 특성 검사 — 기준: Output 대비 0.1V
  - 출력 특성 점검 — 기준: 제조사 선언 오차범위 이내
  - VSWR 특성 — 기준: SWR < 2.0
  - OBW 특성 검사 — 기준: 99% BW
  - 정합 특성 검사 — 기준: VSWR < 1.2
  - 신호 경로 특성 검사
  - RF 출력 검사 — 기준: CW Level ±1 dB
  - 장비 내부 자체 점검 프로그램

■ 자동 적용 가능 필드:
  - 점검주기: equipment.inspectionCycle 또는 calibrations 테이블
  - 교정유효기간: calibrations.validUntil에서 계산
  - 분류: equipment.calibrationRequired → 교정기기/비교정기기
  - 관리팀/장비위치/모델명: equipment 마스터

작업 (Mode 2 — 15+ 파일, 폼 구조 변경):

Phase 1: 점검 항목 프리셋 SSOT
  - packages/shared-constants/src/inspection-presets.ts (신규)
    DEFAULT_INSPECTION_ITEMS: { checkItem, checkCriteria }[]
    장비 분류별 기본 항목 매핑 (RF, DC, 패시브, OTA 등)
  - 프론트엔드: 프리셋 Select + 커스텀 입력 토글

Phase 2: InspectionFormDialog 통합 리디자인
  - 자동 적용 필드: 점검주기, 교정유효기간, 분류를 장비/교정 데이터에서 prefill
    (수동 오버라이드 가능하되 기본값 자동 설정)
  - 점검 항목: 프리셋 선택 + 직접 입력 모드 전환
    프리셋 선택 시 checkItem + checkCriteria 자동 채움
  - 결과 섹션: 폼 하단에 ResultSectionsPanel 인라인 통합
    (현재 목록 펼침 → 폼 내부로 이동)
  - 측정 장비: 기존 장비 검색 Select 유지 (시스템에 등록된 장비에서 선택)

Phase 3: 점검 항목별 결과 입력 UX
  - 점검 항목마다:
    a. checkResult: 텍스트 입력 (간단한 결과)
    b. detailedResult: 접을 수 있는 상세 영역 (멀티라인)
    c. 사진/그래프 첨부: 인라인 업로드 (기존 items/:itemId/photos API 재사용)
    d. judgment: pass/fail Select
  - 결과 섹션(data_table, photo 등): 항목 아래 또는 폼 하단에 통합

Phase 4: 워크플로우 연결
  - 생성 시 결과 섹션까지 한 번에 저장 (2단계 → 1단계)
  - 편집 시에도 결과 섹션 인라인 표시

검증:
- pnpm tsc --noEmit + frontend/backend build PASS
- E2E: 점검 생성 → 프리셋 항목 선택 → 결과 데이터 입력 → Export → DOCX 검증
- 기존 wf-19c 테스트 회귀 없음
- 9개 실제 문서 패턴 재현 가능 확인
```

---
