# 반출입 디자인 리뷰 100% 일치 구현 — 세션 핸드오프 (2026-04-28)

> **다음 세션 시작 시 이 문서를 먼저 읽어주세요.**
> 본 세션은 외부 디자인 리뷰(REVIEW_RESULT.md + 와이어프레임 4종)의 P0/P1 개선 22-항목 중
> Phase 0 (디자인 토큰) + Phase 1 (통합 stepper)을 완료. 다음 세션은 Phase 3부터 재개.

## 세션 결과 요약 (5 commit)

| Commit | Phase | 변경 파일 | 핵심 |
|---|---|---|---|
| `e4b2e8e2` | Phase 0 | 7 | 디자인 토큰 — `--surface-inline-action-*` 16변수, `.label-ko`/`.label-mono`, `CHECKOUT_DDAY_THRESHOLDS` SSOT 신설, dday 4-tier 신규 + 6-tier @deprecated, primitives stepDot 14px / zoneStatus 78px |
| `f629a5b8` | Phase 1 | 10 | 통합 stepper — `ProgressStepDescriptor` schema, `useCheckoutProgressSteps` hook, `CheckoutProgressStepper` 컴포넌트, `ProgressFlowSection` 캡슐화, CheckoutDetailClient 두 카드 grid → 단일 통합, deprecated 표시, ko/en i18n 8 키 |
| `b007e840` | Fix | 4 | verify-* P0 FAIL 3건 수정 — `text-[10.5px]` → `text-xs-tight`, `'rental'` → `CPVal.RENTAL`, requester role 의미론 오류 (viewer role을 actor로 매핑하던 것 제거) |
| `724e5bc3` | Fix | 7 | review-architecture Critical 2 + Warning 5 수정 — ProgressFlowSection ErrorBoundary 보호, descriptor `[0, steps.length-1]` 양쪽 클램프, `terminated` state 추가 (반려/취소 visualization), isOverdue/currentUserCanAct hook 내부 도출 (SSOT 강화), gridCols dead code 제거, sr-only 중복 발화 차단 |
| `2d8e0734` | Skills | 4 | manage-skills 결과 — verify-checkout-fsm Step 41, verify-design-tokens Step 44, verify-ssot Step 36 등록 |

**검증 결과**: pnpm exec tsc --noEmit (frontend) 0 errors. schemas/shared-constants 빌드 0 errors.

## 22-항목 매트릭스 진행 상황

| # | 항목 | 상태 | Phase |
|---|---|---|---|
| 1 | P0-1 진행 stepper 통합 | ✅ 완료 | Phase 1 |
| 2 | P0-2 단계명 줄바꿈 (`label-ko`) | ✅ 완료 | Phase 0 + 1 |
| 3 | P0-3 inline-action soft-tint | ⏳ 대기 | **Phase 3 (다음 세션)** |
| 4 | P1-1 KPI 1-hero + 3-mini (4-col) | ⏳ 대기 | Phase 4 |
| 5 | P1-2 알림 단일 노출 | ⏳ 대기 | Phase 5 |
| 6 | P1-3 필터 legend 분리 + chip 새 라인 | ⏳ 대기 | Phase 6 |
| 7 | P1-4 반입 3-section | ⏳ 대기 | Phase 7 (정렬만) |
| 8 | P1-5 탭 ↑/↓ + 부제 | ⏳ 대기 | Phase 8 (부제만 추가) |
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

**완료 6/22 + 의도적 비채택 1 + 대기 15.**

## 다음 세션 시작 액션 — Phase 3 (P0-3 inline action 토큰 마이그레이션)

### 0. 시작 시 필수 확인 (3분)

```bash
# 1. main 최신 + 본 세션 commit 5건 존재 확인
git log --oneline -7
# 기대: e4b2e8e2/f629a5b8/b007e840/724e5bc3/2d8e0734 모두 보임

# 2. 다른 세션의 dirty 파일 상태 확인 (병렬 작업 진행 중일 수 있음)
git status -s | wc -l
# 51 이상이면: 다른 세션 작업 진행 중. commit 시 본 작업 파일만 명시 add 필수
# (사용자 메모리: "lint-staged 다른 세션 파일 revert 금지")

# 3. tsc 0 errors 시작점 확인
cd apps/frontend && pnpm exec tsc --noEmit; echo "EXIT: $?"
# 기대: EXIT: 0
```

### 1. 와이어프레임 사양 재확인

**참조 파일**: `/mnt/c/Users/kmjkd/Downloads/반출입페이지/04_before_after_inbound_button.html`

P0-3 핵심 spec table (line 89-95):
| 속성 | Before | After (target) |
|---|---|---|
| height | 34px | **28px** (h-7) |
| background | `linear-gradient(brand-info)` | **`hsl(brand / 0.10)`** soft-tint |
| color | white | **`hsl(brand)`** |
| border | 0 | **`1px solid hsl(brand / 0.22)`** |
| box-shadow | `0 4px 10px / inset highlight` | **`none`** |
| font-weight | 700 | **600** |
| 색상 매핑 | 모두 `brand-info` | **`danger / warning / ok` (D-day 매핑)** |

### 2. Phase 3 작업 단위 (3-4 commit 예상)

**A. `apps/frontend/components/ui/inline-action-button.tsx` 신규 atom (1 commit)**
- 4 variant prop: `info | ok | warning | danger`
- `SURFACE_INLINE_ACTION_TOKENS.base + variant` 합성 (이미 Phase 0에서 토큰 준비됨)
- shadcn Button과 별도 atom — asChild 패턴 충돌 회피
- props: `{ variant, asChild?, loading?, ...buttonProps }`
- a11y: `:disabled` 스타일, focus-visible:outline-2 outline-brand-info

**B. `CheckoutGroupCard.tsx` 행 액션 마이그레이션 (1 commit)**
- 현재 `CHECKOUT_ITEM_ROW_TOKENS.actionButtons.bulkApprove: 'bg-primary hover:bg-primary/90'` solid → `InlineActionButton variant="info"` (1차 승인) / `variant="warning"` (2차 승인 — 내 차례 시) / `variant="ok"` (반입 처리/수령 확인)
- 행 단위 액션은 모두 soft-tint, **그룹 헤더 단일 일괄 CTA만 primary solid 유지** (overdue 그룹은 critical solid — 와이어프레임 01 line 425)

**C. `NextStepPanel compact` variant 정렬 (1 commit)**
- `apps/frontend/components/shared/NextStepPanel.tsx` compact 분기 (line ~265-362)
- 액션 버튼이 `bg-primary` 류라면 → variant 분기 (`info`/`warning`/`ok`/`danger`)
- ⚠️ verify-checkout-fsm Step 40 위반 회피 — `{!canAct && <span>}`/`{canAct && <button>}` 상호 배타 패턴 보존

**D. `InboundCheckoutsTab.tsx` 일괄 처리 버튼 정렬 (1 commit, 선택)**
- `InboundSectionHeader` 일괄 처리 버튼도 `InlineActionButton variant="ok"` 사용
- 하지만 섹션 일괄 = 그룹 단일 CTA 위계로 primary solid 가능 — 와이어프레임 01 line 620 `class="inline-action return"` (soft-tint ok 채택)

### 3. 와이어프레임 100% 일치 + 사용자 요구 + 잔존 위험 검증

**현재 구현이 와이어프레임/REVIEW_RESULT.md와 매칭되는지 다음 검증 절차 사용**:

```bash
# 1. P0-3 marker — bg-primary 솔리드가 행 컨테이너 내부에 있는지 (FAIL 패턴)
grep -rn 'bg-primary\b' apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  apps/frontend/components/shared/NextStepPanel.tsx
# Phase 3 완료 후 기대: 그룹 헤더 단일 일괄 CTA 외 0건 (행 단위 액션은 SURFACE_INLINE_ACTION_TOKENS 사용)

# 2. 신규 atom export 확인
grep -n "InlineActionButton" apps/frontend/components/ui/inline-action-button.tsx \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: atom 정의 + 호출처 사용

# 3. verify-design-tokens Step 44 통과 (Phase 3 완료 후)
# - SURFACE_INLINE_ACTION_TOKENS variant 4종 모두 컴포넌트에서 사용
# - bg-surface-inline-action-* utility는 SURFACE_INLINE_ACTION_TOKENS 외부에서 0건

# 4. verify-checkout-fsm Step 40 회귀 방지 (NextStepPanel compact 정합)
grep -n "!canAct\|canAct &&" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: span/button 상호 배타 분기 보존
```

**100% 일치 매트릭스 자가 검증 (Phase 3 완료 후)**:
- [ ] 와이어프레임 04 spec table 7개 속성 모두 일치 (height 28 / bg alpha / color / border alpha / no shadow / font-weight 600 / D-day 색상 매핑)
- [ ] 와이어프레임 01 line 444, 469, 508, 533 등의 inline-action 클래스 사용 위치 모두 매핑
- [ ] 다크 모드 대비비 ≥ 3:1 (저시력) — `border` alpha 0.22+
- [ ] verify-design-tokens / verify-hardcoding / verify-ssot 모두 0 violations
- [ ] tsc + lint + frontend test 0 errors

### 4. 잔존 architectural debt (Phase 3와 별개로 추적)

본 세션의 review-architecture가 식별한 WARN 5건 + Cross-cutting WARN 2건 — Phase 3 외 별도 처리 권장:
1. **Layer 3 stepper 토큰 승격** — `CheckoutProgressStepper.tsx`의 closure 토큰을 `lib/design-tokens/components/checkout-progress-stepper.ts`로 분리. 30분 작업.
2. **`box-shadow 0.18 alpha` 매직넘버** — stepper current/late ring 토큰화.
3. **`max-w-[12ch]` arbitrary unit** — `DIMENSION_TOKENS.stepLabelMaxCh` 토큰화.
4. **connector 좌표 1024px 회귀 위험** — `right-[calc(-50%+18px)]` 음수값. 실측 검증.
5. **`useFormatter` preset 호이스팅** — N=8 rental 대비 모듈 레벨 const.
6. **`deriveProgressStepState` 단위 테스트 12 케이스** — `packages/schemas/src/fsm/__tests__/progress-step.test.ts`.
7. **deprecated 잔존 호출처 2건 마이그레이션** — `ReturnCheckoutClient.tsx:24` + `ConditionCheckClient.tsx:20`. 다음 마이너 제거 전 필수.

**다음 세션 권장 시작 멘트**:
> "Phase 3 (P0-3 inline action 토큰 마이그레이션) 시작. 먼저 git log -7로 본 세션 5 commit 확인 후
> /verify-implementation으로 잔존 위험 자가 검증 → InlineActionButton atom 신규 → CheckoutGroupCard +
> NextStepPanel compact 마이그레이션. 와이어프레임 04 spec table 7개 속성 정확 복제 + 다크 모드
> 대비비 ≥ 3:1 보장. 구현 도중 와이어프레임/REVIEW_RESULT.md 100% 일치 자가 매트릭스 매번 갱신.
> Architectural debt 7건은 Phase 3와 별개로 별도 PR로 처리 (Layer 3 stepper 토큰 승격이 우선)."

## 핵심 참조 파일

| 파일 | 용도 |
|---|---|
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/REVIEW_RESULT.md` | P0/P1 명세 + §4.1·4.3·4.4 토큰 사양 |
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/01_list_recommended.html` | 목록 와이어프레임 (Phase 4-8) |
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/02_detail_recommended.html` | 상세 와이어프레임 (Phase 9-11) |
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/04_before_after_inbound_button.html` | **Phase 3 핵심 — inline action spec table** |
| `/home/kmjkds/.claude/plans/c-users-kmjkd-downloads-html-typed-valley.md` | 13 Phase 마스터 플랜 |
| `apps/frontend/lib/design-tokens/semantic.ts:559+` | `SURFACE_INLINE_ACTION_TOKENS` (Phase 3 활용) |
| `apps/frontend/styles/globals.css:474-510` | 16개 `--surface-inline-action-*` CSS 변수 |
| `packages/shared-constants/src/checkout-thresholds.ts` | 반출 D-day 4-tier SSOT (`getCheckoutDdayTier`) |

## 사용자 정책 재확인

- **main 직접 작업, 브랜치 금지** — 1인 trunk-based, pre-push hook 게이트
- **lint-staged 다른 세션 파일 revert 금지** — staged 파일 항상 명시 add
- **시니어 아키텍처 수준** — 단편적 임시방편 금지, SSOT 준수, 하드코딩 X, 워크플로/성능 고려
- **타협 없이 100% 일치** — 와이어프레임과 REVIEW_RESULT.md 정확 복제
- **세션 정리 시 자동 커밋** — 미커밋 작업은 자동 커밋 (push는 별도)
