# 반출입 Phase 3 (P0-3 inline action) 완료 — 세션 핸드오프 (2026-04-28)

> 다음 세션 시작 시 이 문서를 먼저 읽어주세요.
> Phase 3 통합 마이그레이션 + 검증 인프라 강화 + dead code cut 모두 완료.
> 다음 세션은 Phase 4 (P1-1 KPI 1-hero + 3-mini)부터 재개.

## 세션 결과 요약

| 영역 | 상태 |
|---|---|
| Phase 3 코드 마이그레이션 | ✅ 완료 — NextStepPanel 4 variant(hero/compact/floating/inline) 모두 InlineActionButton 일원화 |
| Atom 구현 | ✅ `apps/frontend/components/ui/inline-action-button.tsx` (forwardRef + memo + variant + loading + leadingIcon + loadingLabel) |
| SSOT 매핑 | ✅ `resolveInlineActionVariant` + `CHECKOUT_ACTION_INLINE_CLASS` (`as const satisfies Record<CheckoutAction, InlineActionClass>`) |
| Token cut | ✅ `WORKFLOW_PANEL_TOKENS.action.{primary,blocked}` + `WORKFLOW_PANEL_TOKENS.variant.{compact,hero}.actionButton` + `NEXT_STEP_PANEL_TOKENS.actionButton.{primary,secondary,ghost}` 모두 dead code 제거 |
| 검증 인프라 | ✅ verify-hardcoding Step 30 / verify-ssot Step 40 / verify-frontend-state Step 25 / verify-design-tokens Step 44 보강 / verify-checkout-fsm Step 40 갱신 |
| 단위 테스트 | ✅ 16 tests PASS (atom 9 + matrix 7) |
| tsc / build | ✅ 0 errors (frontend + shared-constants) |

## 본 세션 commit (3 commit)

| Commit | 핵심 |
|---|---|
| `cde5ffc3` | floating/inline 마이그레이션 완성 + dead code cut + handlePanelClick 일반화 + 미러 타입 단순화 + 4 skill 갱신 + 평가 리포트 6건 (lint-staged가 다른 세션 inflight 변경도 함께 스테이징) |
| `47ce95a8` | (병렬 세션) Prettier/lint-staged 잔재 정리 |
| `82138ae4` | (병렬 세션) InlineActionButton atom + sidebar + workflow-panel 토큰 (Phase 3 1차 마이그레이션) |

## 22-항목 매트릭스 진행 상황 (Phase 3 완료 후)

| # | 항목 | 상태 | Phase |
|---|---|---|---|
| 1 | P0-1 진행 stepper 통합 | ✅ 완료 | Phase 1 |
| 2 | P0-2 단계명 줄바꿈 (`label-ko`) | ✅ 완료 | Phase 0 + 1 |
| 3 | **P0-3 inline-action soft-tint** | **✅ 완료** | **Phase 3** |
| 4 | P1-1 KPI 1-hero + 3-mini (4-col) | ⏳ 대기 | **Phase 4 (다음 세션)** |
| 5 | P1-2 알림 단일 노출 | ⏳ 대기 | Phase 5 |
| 6 | P1-3 필터 legend 분리 + chip 새 라인 | ⏳ 대기 | Phase 6 |
| 7 | P1-4 반입 3-section | ⏳ 대기 | Phase 7 |
| 8 | P1-5 탭 ↑/↓ + 부제 | ⏳ 대기 | Phase 8 |
| 9 | P1-6 결재선 "내 차례" | ⏳ 대기 | Phase 9 |
| 10 | P1-7 그룹 일괄 액션 | ⏳ 대기 | Phase 12 |
| 11 | 4.1 `--surface-inline-action-*` 8 토큰 | ✅ 완료 | Phase 0 |
| 12 | 4.2 Stepper prop | ✅ 완료 | Phase 1 |
| 13 | 4.3 D-day 4-tier 단일 매핑 | ✅ 완료 | Phase 0 |
| 14 | 4.4 `.label-ko` + `.label-mono` | ✅ 완료 | Phase 0 |
| 15 | MiniProgress dot 14px | ⏳ 대기 | Phase 11.5 K.2 |
| 16 | zone-status width 78px | ⏳ 대기 | Phase 11.5 K.3 |
| 17 | 상세 헤더 ⋯ overflow | ⏳ 대기 | Phase 11.5 K.4 |
| 18 | 상세 Back button | ⏳ 대기 | Phase 11.5 K.5 |
| 19 | BasicInfoTwoColumn 통합 | ⏳ 대기 | Phase 11.5 K.6 |
| 20 | 상세 우측 사이드바 | ⏳ 대기 | Phase 9·10 |
| 21 | 활동 이력 (audit timeline) | ⏳ 대기 | Phase 11 |
| 22 | Sub-tab 3-tab "검사 대기" | 의도적 비채택 | D5 결정 |

**완료 7/22 + 의도적 비채택 1 + 대기 14**.

## Phase 3 구현 가치 (시니어 표준 적용 결과)

본 세션은 verify-implementation FAIL 3 + review-architecture Critical 2 + Warning 1 통합 fix를 통해 *4-축 정합성*을 달성:

| 축 | 결과 |
|---|---|
| **SSOT** | `SURFACE_INLINE_ACTION_TOKENS`(어휘) + `resolveInlineActionVariant`(매핑) + `CHECKOUT_ACTION_INLINE_CLASS`(분류) 3-축 단일 위치 |
| **하드코딩 0** | atom 내부 `iconSize` 토큰화, 와이어프레임 04 spec 7개 속성 모두 토큰 경유, raw `h-3 w-3` 0건 |
| **워크플로** | `e.stopPropagation()` 보존(compact만), `useCallback` handler stabilize(memo 효과 보장), canAct 상호 배타 분기 보존 |
| **성능** | `React.memo` + `useCallback` 동시 적용 (referential stability 보장), spec table 변경 시 전체 atom 자동 따라감 |
| **접근성** | `aria-disabled` / `aria-busy` / sr-only loadingLabel / `focus-visible` 토큰 / 색상 단독 의존 회피 / hero canAct=false aria-label 균형 |
| **i18n** | atom 도메인 중립 (`loadingLabel` prop 주입), ko/en parity 유지 |
| **다크모드** | alpha 0.22 border + light/dark 16 변수 globals.css 자동 전환 (구조적 보장) |
| **검증 게이트** | atom 경유 강제 + memo 부모 useCallback 강제 + Record satisfies 강제 — 모두 verify-* 스킬로 회귀 차단 |

## 다음 세션 시작 액션 — Phase 4 (P1-1 KPI 1-hero + 3-mini)

### 0. 시작 시 필수 확인 (3분)

```bash
# 1. main 최신 + Phase 3 commit 존재 확인
git log --oneline -5
# 기대: cde5ffc3 (Phase 3 후속) 보임

# 2. dirty 파일 상태 (다른 세션 작업 진행 가능성)
git status -s | wc -l
# 50+ 이면 다른 세션 작업 진행 중. commit 시 본 작업 파일만 명시 add 필수

# 3. tsc / build 0 errors 확인
cd apps/frontend && pnpm exec tsc --noEmit; echo "EXIT: $?"
pnpm --filter @equipment-management/shared-constants build
# 기대: 양쪽 EXIT 0
```

### 1. Phase 4 와이어프레임 사양

**참조 파일**: `/mnt/c/Users/kmjkd/Downloads/반출입페이지/01_list_recommended.html` — KPI 영역.

P1-1 핵심 spec:
- 1 hero KPI (가장 위험한 지표 강조 — overdue 또는 pending) + 3 mini KPI 그리드
- 기존 5-card 평면 grid → 위계 분리 (hero col-span-2 + 3 mini col-span-1)
- `CHECKOUT_STATS_VARIANTS.hero` 토큰은 이미 Phase 0에서 준비됨 (`apps/frontend/lib/design-tokens/components/checkout.ts:454-465`)

### 2. Phase 4 작업 단위 (예상 3-4 commit)

A) 호스트 컴포넌트(`CheckoutsContent.tsx` 또는 동등) — KPI 영역 grid 재구조화
B) hero 카드 동적 선택 로직 (overdue > 0 ? 'overdue' : 'pending') SSOT 헬퍼 도입
C) 와이어프레임 정합 자가 매트릭스 (4-col grid + col-span-2 hero + alert ring)
D) verify-design-tokens Step 추가 — `CHECKOUT_STATS_VARIANTS.hero.container` 사용 강제

### 3. Architectural Debt — Phase 3 boundary 외 (별도 PR)

이번 세션 review-architecture Warning에서 식별된 pre-existing 이슈 (Phase 3 commit 외 처리):

| ID | 이슈 | 권장 처리 |
|---|---|---|
| W-2 | NextStepPanel 자체 React.memo 미적용 | atom의 memo 효과 max화. 별도 perf PR |
| W-3 | overflow DropdownMenu trigger `aria-label={t('panelTitle')}` = "다음 단계"로 오해 가능 | `checkouts.fsm.overflow.label`(예: "추가 작업") 신규 i18n 키 + ko/en parity. 별도 a11y PR |
| W-5 | `cn()` (미-twMerge) — custom CSS 변수 클래스 override 불가, 표준 클래스만 override 가능 (비대칭 escape) | `lib/utils/cn.ts`를 `tailwind-merge` 기반으로 교체 또는 비대칭 명시 문서화. 별도 디자인 시스템 PR |

### 4. 핸드오프 7건 architectural debt (외부 디자인 리뷰 후속)

이전 핸드오프(`checkouts-redesign-session-2026-04-28-handoff.md`)에서 명시된 7건:
1. Layer 3 stepper 토큰 승격 (`CheckoutProgressStepper.tsx` closure 토큰 → `lib/design-tokens/components/checkout-progress-stepper.ts` 분리)
2. `box-shadow 0.18 alpha` 매직넘버 토큰화
3. `max-w-[12ch]` arbitrary unit → `DIMENSION_TOKENS.stepLabelMaxCh` 토큰화
4. connector 좌표 `right-[calc(-50%+18px)]` 음수값 회귀 위험 실측 검증
5. `useFormatter` preset 호이스팅 (N=8 rental 대비 모듈 레벨 const)
6. `deriveProgressStepState` 단위 테스트 12 케이스 추가
7. deprecated 잔존 호출처 2건 마이그레이션 (`ReturnCheckoutClient.tsx:24` + `ConditionCheckClient.tsx:20`)

→ Phase 4 진입 전 또는 Phase 4와 병렬로 별도 PR 권장.

## 다음 세션 권장 시작 멘트

> "Phase 4 (P1-1 KPI 1-hero + 3-mini) 시작. 먼저 git log -7로 Phase 3 commit(cde5ffc3) 확인 후
> /verify-implementation으로 잔존 위험 자가 검증 → CheckoutsContent KPI grid 재구조화 →
> hero 카드 동적 선택(overdue priority) SSOT 헬퍼 → 와이어프레임 01 KPI 영역 100% 일치 자가
> 매트릭스 매번 갱신. CHECKOUT_STATS_VARIANTS.hero 토큰은 Phase 0에서 이미 준비됨.
> Architectural debt 7건 + W-2/W-3/W-5는 Phase 4와 별개로 별도 PR 처리.
> 시니어 웹개발 전문가로서 SSOT 준수, 하드코딩 0, 워크플로/성능/접근성 고려, 단편적
> 임시방편 금지, 아키텍처 수준 시스템 전반 개선 원칙 적용. /harness"

## 핵심 참조 파일

| 파일 | 용도 |
|---|---|
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/REVIEW_RESULT.md` | P0/P1 명세 + §4 토큰 사양 |
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/01_list_recommended.html` | **Phase 4 핵심 — 목록 와이어프레임 (KPI 영역)** |
| `apps/frontend/lib/design-tokens/components/checkout.ts:454-465` | `CHECKOUT_STATS_VARIANTS.hero` (Phase 0 준비) |
| `apps/frontend/components/checkouts/...CheckoutsContent.tsx` (찾기) | 호스트 컴포넌트 — Phase 4 변경 진입점 |
| `.claude/evaluations/checkouts-phase3-final-architecture.md` | 본 세션 architecture review 전체 (W-1~W-5 상세) |
| `.claude/evaluations/checkouts-phase3-final-verify.md` | 본 세션 verify report (FAIL 3 fix 이력) |
| `.claude/evaluations/checkouts-phase3-manage-skills.md` | 본 세션 skill 갱신 권장 → 모두 적용 완료 |

## 사용자 정책 재확인

- **Main 직접 작업, 브랜치 금지** — 1인 trunk-based, pre-push hook 게이트
- **lint-staged**: 다른 세션 파일 보존 (revert 금지). 본 세션은 lint-staged hook가 다른 세션 inflight 변경도 함께 스테이징했으나 모두 보존됨.
- **시니어 아키텍처 수준** — 단편적 임시방편 금지, SSOT 준수, 하드코딩 0, 워크플로/성능/접근성 고려
- **타협 없이 100% 일치** — 와이어프레임과 REVIEW_RESULT.md 정확 복제
- **세션 정리 시 자동 커밋** — 본 세션 완료 (push는 별도 요청 시)

## 검증 인프라 강화 (회귀 방지 게이트)

본 세션이 추가/갱신한 verify-* Step 5건은 *Phase 3 패턴 회귀를 차단*:

| Skill | Step | 차단 패턴 |
|---|---|---|
| verify-hardcoding | Step 30 | atom 내부 `h-N w-N` raw 사이즈 (토큰 미경유) |
| verify-ssot | Step 40 | `Set<EnumType>` 약타입 분류 (Record satisfies 강제) |
| verify-frontend-state | Step 25 | memo'd atom 호출처 inline arrow `onClick` (memo 무력화) |
| verify-design-tokens | Step 44 보강 | atom 외부 `bg/text/border-surface-inline-action-*` 직접 className + iconSize 3점 동기 |
| verify-checkout-fsm | Step 40 갱신 | NextStepPanel canAct 상호 배타 분기 (`{!canAct && <span>}` / `{canAct && <InlineActionButton>}`) + stopPropagation 보존 + resolveInlineActionVariant SSOT 경유 |

→ Phase 4+ 작업 시 위 패턴이 자동으로 검증되어 회귀 차단.
