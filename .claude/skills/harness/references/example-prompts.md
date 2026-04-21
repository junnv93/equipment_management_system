# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-21 (QR Phase 1-3 후속 개선 섹션 완료 10건 전체 archive-domain.md 이동. 사용자 결정 대기 1건(커밋 귀속 오염 복구) → Option A 채택으로 폐기. 미완료 1건: sticky-header CSS 변수(트리거 조건 미달). UR-1/2/3 ultrareview 통합 프롬프트 추가 2026-04-21. 78차 반출입 관리 페이지 디자인/IA 개선 7종 추가 2026-04-21.)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## UltraReview 통합 — Layer 6 머지 관문 프롬프트 (3종)

> **배경 (2026-04-21)**: CAS stale 4차 재발, 트랜잭션 경계 3차 재발 등 verify-*/review-architecture 단일 패스로 못 잡는
> 의미론적·동시성·재현 버그 대응. ultrareview(원격 multi-agent fleet)를 머지 직전 관문으로 통합.
> 상세: `docs/references/ultrareview-usage.md`

### 🟠 HIGH — UR-1: 머지 직전 ultrareview Go/No-Go 판정 + 실행 준비 (Mode 0)

```
목적: 브랜치 머지 직전 ultrareview 실행 여부를 자동 판정하고 실행을 준비한다.
      판정 기준은 SSOT 파생 (review-learnings.md 고위험 패턴 + CLAUDE.md 예외 항목).

단계:
1. Advisor 실행
   node scripts/ultrareview-advisor.mjs --json
   결과를 읽고 decision / reasons / costEstimate 필드 확인

2. 판정에 따른 분기
   [Go] → 3단계로 진행
   [No-Go] → 이유 제시 + /review 또는 해당 verify-* 스킬 실행 권고로 종료

3. (Go인 경우) Pre-upload secret gate
   node scripts/ultrareview-preflight.mjs
   - exit 0: 4단계 진행
   - exit 1: 오류 메시지에 따라 파일 제거 또는 .gitleaks.toml allowlist 추가 후 재실행

4. (Preflight 통과 시) 사용자에게 실행 명령 제시
   - PR 번호 확인: gh pr list --state open --author @me
   - 제시 명령: /ultrareview <PR번호>
   - 예상 시간: 5~10분 (백그라운드, /tasks 로 추적)
   - 실행은 사용자가 직접 확인 후 입력 (자동 실행 금지)

검증:
- decision / category / costEstimate / 실행 명령 4개 필드 모두 출력됨
- Go 판정이면 preflight exit 0 확인됨
- 명령 제시 후 대기 (실제 /ultrareview 실행은 사용자 몫)
```

### 🔴 CRITICAL — UR-2: ultrareview Finding 후속 수정 (Mode 1)

```
입력: ultrareview 완료 후 /tasks에서 확인한 finding 리포트 (file:line + 설명)

finding 분류 → verify-* 2차 검증 매핑 테이블:
  CAS / VERSION_CONFLICT    → verify-cas 스킬 실행
  권한 / RBAC / SiteScope   → verify-auth 스킬 실행
  이벤트 / 캐시 무효화       → verify-cache-events 스킬 실행
  Zod / validation          → verify-zod 스킬 실행
  트랜잭션 경계 / this.db    → review-architecture 스킬 실행
  기타 설계 이슈             → review-architecture 스킬 실행

finding별 처리:
  [true positive]
  1. 해당 verify-* 스킬 Skill 호출로 패턴 준수 확인
  2. CLAUDE.md Behavioral Guidelines "수술적 변경" 원칙으로 최소 fix
  3. tsc + 관련 spec 실행 → green 확인
  4. 변경 파일 수 ≤ finding 수 × 3 (spread 제한)
  5. review-learnings.md 해당 섹션에 재발 기록 append:
     형식: [YYYY-MM-DD] {패턴명} — {file:line} ({n}차 재발)
     3회 도달 시: manage-skills 스킬로 신규 verify-* 스킬 생성 제안

  [false positive]
  1. 왜 false positive인지 근거 1문장 작성
  2. review-learnings.md "추가된 예외" 섹션에 기록:
     형식: [YYYY-MM-DD] ultrareview FP — {패턴명}: {근거}

검증:
- pnpm --filter backend exec tsc --noEmit
- pnpm --filter frontend exec tsc --noEmit
- 관련 모듈 spec 통과
- review-learnings.md에 결과 append 확인
- 변경 파일 수 ≤ finding 수 × 3
```

### 🟡 MEDIUM — UR-3: 무료 Quota 소진 시 로컬 Fleet Review 대체 (Mode 2)

```
사용 조건: ultrareview 무료 3회 소진 AND 비용 지출 불가 상황
          (또는 브랜치 모드 불가 환경)

구조: Explore subagent 3개 단일 메시지 병렬 실행

Agent A — Backend race/원자성/트랜잭션 경계
  조사 대상: review-learnings.md "트랜잭션 내 서비스 메서드" + "CAS 선점" 섹션의 파일 경로
  확인 항목:
  - 변경된 service.ts 파일에서 db.transaction() 내부 this.db 직접 사용 패턴
  - CAS 선점 순서 (상태 전이 → 작업 순서 위반)
  - 보상 코드 누락 (CAS 선점 후 후속 실패 시 미복원)
  보고: file:line + 재현 조건 1줄

Agent B — Frontend stale closure/CAS/SSOT 경로
  조사 대상: review-learnings.md "Stale CAS 버전" 4차 재발 섹션 패턴
  확인 항목:
  - mutation.mutationFn 내부 useQuery 캐시 스냅샷(version) 직접 참조
  - 상태 전이 액션에서 fresh fetch 없이 캐시 버전 사용
  - VERSION_CONFLICT 핸들러(onError) 누락
  보고: file:line + stale 경로 설명

Agent C — Cross-module 이벤트·캐시·권한 흐름
  조사 대상: review-learnings.md "이벤트" + "권한/RBAC" + "캐시 무효화" 섹션
  확인 항목:
  - emitAsync vs emit 사용 일관성 (verify-cache-events 스킬 기준)
  - 신규 엔드포인트 @SiteScoped/@Permissions 누락
  - 장비 상태 전이 후 캐시 무효화 이벤트 미발행
  보고: file:line + 이슈 설명

제약:
  - 세션당 1회 한도 (중복 실행 금지, /tasks로 이미 실행 중인지 확인)
  - 각 agent 보고 400단어 이내
  - 독립 재현 검증 없음 → ultrareview 대비 false positive 가능성 높음
  - finding은 반드시 해당 verify-* 스킬 2차 검증 후 수정

검증:
  - 세 agent 결과 합산 → 중복 제거 → priority 랭킹
  - ultrareview와 동일하게 UR-2 파이프라인으로 처리
```



> **완료된 항목은 [example-prompts-archive.md](./example-prompts-archive.md)로 분리 (2026-04-09 36차 정리).**
> 현재 파일은 활성(미해결) harness 프롬프트만 포함. 새 프롬프트는 활성 영역에 추가.

---

## 78차 — 반출입 관리 페이지 디자인/IA 개선 (2026-04-21)

> **배경**: 2회 디자인 리뷰(10 안티패턴 + 아키텍처 관점)에서 종합 64/100 판정.
> 표면 스타일 문제가 아니라 ① SSOT 토큰 시스템 우회(`text-[7-10px]`), ② 처음 사용 유저의 워크플로우 진입 실패,
> ③ 반입 탭 IA의 3섹션 혼란, ④ 모바일에서 워크플로우 정보 숨김 등 아키텍처 결함이 근본 원인.
> 7종 프롬프트로 SSOT 준수, 하드코딩 제거, 워크플로우 가이던스, 모바일 접근성을 일괄 개선한다.
> 각 프롬프트는 독립 실행 가능하되 의존 순서가 있음: **78-1 → 78-2 → 78-3·4·5·6·7**.

### 🔴 CRITICAL — 78-1: 타이포 primitives 확장 + checkout 토큰 SSOT 복구 (Mode 1)

```
목적: 반출 페이지 토큰이 primitives 우회로 `text-[7px|8px|9px|10px]` 하드코딩 7곳을 포함한다.
      primitives.ts에 마이크로 타이포 scale을 추가하고, checkout.ts의 arbitrary 크기를 전부 토큰 참조로 교체한다.
      7-9px는 접근성 하한을 위반하므로 10px로 일괄 승격하여 가독성도 함께 확보한다.

선행 확인:
- apps/frontend/lib/design-tokens/primitives.ts:172 TYPOGRAPHY_PRIMITIVES.fontSize (현재 xs ≥ 11px가 최소)
- apps/frontend/lib/design-tokens/components/checkout.ts:197,251,254,259,670,746,824
- grep "text-\[[0-9]+px\]" apps/frontend/lib/design-tokens/components/checkout.ts → 7 hits

단계:
1. primitives.ts TYPOGRAPHY_PRIMITIVES.fontSize 확장
   - 2xs 추가: { mobile: 10, desktop: 10 } (최소 가독 크기 — WCAG 권장 하한)

2. semantic.ts에 MICRO_TYPO 신규 export (3-Layer 원칙: Primitives → Semantic → Components)
   export const MICRO_TYPO = {
     badge: 'text-[10px]',    // 상태/카운트 배지 (2xs 참조)
     label: 'text-[10px]',    // 범례·부속 레이블
     caption: 'text-xs',      // 일반 부연 설명
   } as const;
   // 7-9px는 접근성 하한 미달로 금지 (WCAG SC 1.4.4)

3. checkout.ts 하드코딩 제거
   - :197 CHECKOUT_MINI_PROGRESS.dot.base → text-[8px] 제거 (dot 내부 숫자는 sr-only 이동 — 78-3에서 처리)
   - :251,:254,:259 RENTAL_FLOW_INLINE_TOKENS → 원형 단계 UI 전체 재설계 (78-3에서 처리 — 여기선 토큰만 정리)
   - :670 CHECKOUT_PURPOSE_LEGEND_TOKENS.label → MICRO_TYPO.label 참조
   - :746 CHECKOUT_ITEM_ROW_TOKENS.dday → MICRO_TYPO.badge 참조
   - :824 CHECKOUT_TAB_BADGE_TOKENS.base → MICRO_TYPO.badge 참조

4. 픽셀 치수 토큰화
   - :734 purposeBar 'w-[3px]' → WIDTH_PRIMITIVES.hairline 상수 추가 (3px, 접근성 안전 최소 강조 바)
   - :804,:813 페이지네이션 w-[30px] h-[30px] → SIZE_PRIMITIVES.pagination 토큰 신규 정의 (30px 정사각)

5. 소비자 측 정리
   - CheckoutGroupCard.tsx:302,435 인라인 `text-[10px] py-0` → MICRO_TYPO.badge 참조
   - CheckoutListSkeleton.tsx:18-24 w-[Npx] Skeleton → 기존 w-XX Tailwind 유틸 매핑 후 교체

검증:
- grep "text-\[[0-9]+px\]" apps/frontend/lib/design-tokens/components/checkout.ts → 0 hit
- grep "text-\[[0-9]+px\]" apps/frontend/components/checkouts → 0 hit
- pnpm --filter frontend exec tsc --noEmit → green
- primitives.ts에 2xs 토큰 존재 + semantic.ts에 MICRO_TYPO 3종 export
- 변경 파일 ≤ 8개
```

### 🟠 HIGH — 78-2: 공용 EmptyState 컴포넌트 + 3-variant 팩토리 (Mode 1)

```
목적: 현재 각 페이지가 EQUIPMENT_EMPTY_STATE_TOKENS 재사용만 하고 컴포넌트 자체는 페이지별 JSX로 중복한다.
      처음 사용 유저가 "데이터 없음"과 "필터 결과 없음"을 구분할 수 없고, 워크플로우 진입 CTA도 없다.
      shared/EmptyState 컴포넌트를 3-variant(no-data | filtered | status-filtered)로 설계하고
      checkouts/equipment를 마이그레이션한다.

선행 확인:
- apps/frontend/lib/design-tokens/components/equipment.ts:453-468 — 공용 토큰 후보
- apps/frontend/components/equipment/EquipmentEmptyState.tsx — variant 분리 선례 참조
- apps/frontend/components/shared/ 에 EmptyState 없음 확인됨

단계:
1. 공용 토큰 승격
   - equipment.ts의 EQUIPMENT_EMPTY_STATE_TOKENS → semantic.ts 또는 components/shared.ts로 이동
   - 이름: EMPTY_STATE_TOKENS (도메인 중립)
   - equipment.ts는 재export로 후방 호환 유지 (@deprecated 주석)

2. components/shared/EmptyState.tsx 신규
   interface EmptyStateProps {
     variant: 'no-data' | 'filtered' | 'status-filtered';
     icon: LucideIcon;
     title: string;
     description: string;
     primaryAction?: { label: string; onClick?: () => void; href?: string; permission?: Permission };
     secondaryAction?: { label: string; onClick: () => void };
   }
   - variant별 아이콘 색상/배경 차등: no-data=brand-info/5, filtered=muted, status-filtered=문맥 색상
   - primaryAction은 permission prop이 있으면 useAuth().can() 체크 후 표시
   - aria-live="polite" + role="status" 적용

3. checkouts 마이그레이션
   - OutboundCheckoutsTab.tsx:200 renderEmptyState() → <EmptyState variant={filterActive ? 'filtered' : 'no-data'} ... />
     - no-data: primaryAction "반출 신청하기" (Permission.CREATE_CHECKOUT) → FRONTEND_ROUTES.CHECKOUTS.CREATE
     - filtered: secondaryAction "필터 초기화" → onResetFilters
   - InboundCheckoutsTab.tsx:160 renderEmptyState() → no-data variant + "반입 요청하기" CTA
   - i18n 키 추가: checkouts.empty.noData.title/description, checkouts.empty.filtered.title/description

4. equipment 마이그레이션 (선택적)
   - EquipmentEmptyState.tsx 내부 구현을 공용 EmptyState로 대체
   - public API(컴포넌트 이름/props)는 유지하여 호출부 변경 없음

검증:
- pnpm --filter frontend exec tsc --noEmit
- components/shared/EmptyState.tsx 존재
- checkouts 빈 상태에서 no-data와 filtered가 시각적으로 구분 (CTA 차이)
- 첫 사용자 시나리오: 새 계정으로 /checkouts 접근 시 "반출 신청하기" CTA 표시
- i18n 키 누락 없음 (messages/ko + messages/en)
- 변경 파일 ≤ 10개
```

### 🟠 HIGH — 78-3: 워크플로우 가시성 — MiniProgress/RentalFlow 재설계 + 모바일 접근성 (Mode 1)

```
목적: CheckoutMiniProgress와 RentalFlowInline이 모바일에서 hidden sm:flex로 완전 숨김되며,
      데스크톱에서도 aria-label이 "N/M단계"만 제공하여 처음 사용 유저가 각 단계 의미를 알 수 없다.
      7-9px 원형 UI를 제거하고 "단계명 + 진행도" 표현으로 재설계한다. STEPPER_LABEL_MAP을 SSOT로 승격.

선행 확인:
- apps/frontend/components/checkouts/CheckoutStatusStepper.tsx:45 — STEPPER_LABEL_MAP (로컬 상수)
- apps/frontend/components/checkouts/CheckoutMiniProgress.tsx:52-58 — aria-label 단계명 없음
- apps/frontend/components/checkouts/CheckoutGroupCard.tsx:51-91 — RentalFlowInline 7px 원
- checkout.ts:250 RENTAL_FLOW_INLINE_TOKENS.container — hidden sm:flex

단계:
1. STEPPER_LABEL_MAP → checkout.ts SSOT 승격
   - CheckoutStatusStepper.tsx:45의 STEPPER_LABEL_MAP → checkout.ts로 이동
   - 이름: CHECKOUT_STEP_LABELS (i18n key 매핑 — 값은 useTranslations로 해석)
   - CheckoutStatusStepper / CheckoutMiniProgress / RentalFlowInline 3곳에서 공용 참조

2. CheckoutMiniProgress 재설계 (components/checkouts/CheckoutMiniProgress.tsx)
   - aria-label에 현재 단계명 포함: `${t(CHECKOUT_STEP_LABELS[currentStatus])}, ${current}/${total}단계`
   - 각 dot에 title 속성으로 단계명 tooltip (마우스 호버)
   - 8px 텍스트 제거 → dot 내부 ✓/!/숫자는 aria-hidden, 시각 전용
   - hidden sm:flex 제거 → 모바일 축약형 "단계명 (3/5)" 텍스트로 대체:
     <div>
       <span className="sm:hidden">단계명 (3/5)</span>
       <div className="hidden sm:flex ...">{dots}</div>
     </div>

3. RentalFlowInline 재설계 (CheckoutGroupCard.tsx:51) — 칩 + 호버 tooltip 패턴
   - 5개 7px 원 제거 → "현재 단계명 칩 + 진행도" 형태: [렌탈 · 차용자 확인 중 · 2/5]
   - 칩 hover 시 전체 5단계 tooltip (Tooltip 컴포넌트 활용)
   - 모바일 표시 허용 (hidden sm:flex 제거)
   - 칩 색상: 기존 bg-brand-purple/5 border-brand-purple/20 유지

4. 토큰 스키마 업데이트 (checkout.ts RENTAL_FLOW_INLINE_TOKENS)
   - 기존: circle/arrow/stepLabel → @deprecated
   - 신규: { chip: string, chipText: string, tooltipList: string }
   - statusToStep 매핑은 유지

5. i18n 키 추가
   - groupCard.progressLabelWithStep: "{stepName}, {total}단계 중 {current}단계"
   - rentalFlow.currentStep: "{stepName} · {current}/{total}"

검증:
- grep "text-\[7px\]\|text-\[8px\]\|text-\[9px\]" apps/frontend/lib/design-tokens/components/checkout.ts → 0 hit
- grep "hidden sm:flex" apps/frontend/components/checkouts → 0 hit
- 스크린 리더 시나리오: CheckoutMiniProgress에 커서 → "승인 대기 중, 5단계 중 1단계" 낭독됨
- 모바일 뷰(375px) 수동 확인: 각 행에 단계명 + 진행도 표시
- pnpm --filter frontend exec tsc --noEmit
- 변경 파일 ≤ 7개
```

### 🟠 HIGH — 78-4: 반입 탭 IA 재구성 + 3섹션 페이지네이션 (Mode 1)

```
목적: 반입 탭이 타팀 대여/외부 렌탈/내부 공용 3개 워크플로우를 text-sm muted h3로 약하게 구분한다.
      외부 렌탈·내부 공용은 SELECTOR_PAGE_SIZE 고정 limit으로 잘려 데이터 누락 가능성이 있다.
      섹션 헤더를 맥락 아이콘+설명+카운트로 강화하고, 3섹션 모두 독립 페이지네이션을 제공한다.

선행 확인:
- apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx:181,253,304 — 약한 h3 헤더
- :104,:121 — SELECTOR_PAGE_SIZE limit, 페이지네이션 없음
- 타팀 대여만 페이지네이션 있음 (L263-292)
- 개별 섹션 빈 상태 → 전체 빈 상태 fallback (L244-246) — 섹션별 개별 처리 필요

단계:
1. CHECKOUT_INBOUND_SECTION_TOKENS 신규 (checkout.ts)
   - container: 섹션 컨테이너 (border-l-4 + 색상으로 섹션 식별)
   - header: 아이콘 컨테이너 + 타이틀 + 설명 + 카운트 배지 레이아웃
   - description: 섹션 목적 설명 (처음 사용 유저용)
   - 각 섹션별 색상: teamLoan=brand-info, external=brand-purple, internalShared=brand-ok

2. InboundSectionHeader 컴포넌트 신규 (components/checkouts/InboundSectionHeader.tsx)
   interface Props {
     variant: 'teamLoan' | 'externalRental' | 'internalShared';
     count: number;
     isLoading?: boolean;
   }
   - 아이콘: Users(teamLoan) / Building(externalRental) / PackageCheck(internalShared)
   - 타이틀 + 설명(i18n) + 카운트 배지
   - aria-label + sr-only 설명

3. 페이지네이션 훅 신규 (hooks/use-inbound-section-pagination.ts)
   - URL 파라미터: ?view=inbound&rentalPage=2&internalPage=1 (섹션별 독립)
   - SELECTOR_PAGE_SIZE → DEFAULT_PAGE_SIZE로 교체 (실제 페이지네이션)

4. InboundCheckoutsTab.tsx 마이그레이션
   - 3개 섹션 각각 <InboundSectionHeader /> + 페이지네이션 적용
   - 섹션별 독립 빈 상태 (78-2 EmptyState variant='no-data' 활용)
   - 전체 빈 상태는 3섹션 모두 count=0일 때만 표시

5. i18n 키 추가
   - inbound.sections.teamLoan.title/description
   - inbound.sections.externalRental.title/description
   - inbound.sections.internalShared.title/description

검증:
- pnpm --filter frontend exec tsc --noEmit
- grep "SELECTOR_PAGE_SIZE" apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx → 0 hit
- 각 섹션 21개 이상 데이터 수동 테스트 → 페이지네이션 표시 + 다음 페이지 동작
- 섹션 헤더에 아이콘/설명/카운트 모두 표시
- 한 섹션만 비었을 때 해당 섹션만 빈 상태 표시 (전체 fallback 아님)
- 변경 파일 ≤ 8개
```

### 🟡 MEDIUM — 78-5: 통계 카드 계층화 + Alert 배너 elevation (Mode 0)

```
목적: 5개 통계 카드가 완전 균등하여 overdue(위험)와 total(정보)이 동일 시각 무게를 가진다.
      CHECKOUT_ALERT_TOKENS 배너가 카드와 동일 elevation이라 긴급성이 전달되지 않는다.
      active 상태에서 9px 텍스트로 "활성 필터" 피드백이 사실상 보이지 않는다.
      ⚠️ 78-1 선행 필요 (MICRO_TYPO.badge 참조)

선행 확인:
- apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx:215 grid-cols-5
- :261 activeFilter 라벨 text-[9px]
- checkout.ts:370 CHECKOUT_STATS_VARIANTS — hoverBorder/activeBorder/activeBg만 있음
- checkout.ts:623 CHECKOUT_ALERT_TOKENS.overdue.container — shadow 없음

단계:
1. CHECKOUT_STATS_VARIANTS에 alertElevated 스타일 추가 (checkout.ts)
   각 variant에 alertRing 필드 추가:
     overdue.alertRing: 'ring-2 ring-brand-critical/30 shadow-md'
     pending.alertRing: 'ring-1 ring-brand-warning/20'
   getCheckoutStatsClasses(variant, isActive, isAlert) 3번째 인자 추가

2. OutboundCheckoutsTab.tsx renderStats() 수정
   - overdue 카드: summary.overdue > 0일 때 isAlert=true 전달
   - pending 카드: summary.pending > CHECKOUT_STATS_ALERT_THRESHOLD.pending일 때 isAlert=true
   - 임계값 상수: checkout.ts에 CHECKOUT_STATS_ALERT_THRESHOLD = { pending: 10 } (SSOT)

3. activeFilter 피드백 텍스트 크기 수정
   - OutboundCheckoutsTab.tsx:261 `text-[9px]` → MICRO_TYPO.badge (78-1 이후 10px)

4. Alert 배너 elevation (checkout.ts)
   - CHECKOUT_ALERT_TOKENS.overdue.container → shadow-md 추가
   - CHECKOUT_ALERT_TOKENS.pendingCheck.container → shadow-sm 추가

검증:
- pnpm --filter frontend exec tsc --noEmit
- overdue=0 → alertRing 미적용, overdue>0 → ring-2 가시적 강조
- "활성 필터" 라벨 판독 가능 (≥10px)
- Alert 배너에 shadow 존재
- 변경 파일 ≤ 3개
```

### 🟠 HIGH — 78-6: PageHeader onboardingHint 슬롯 + 테이블 프리미엄 (Mode 1)

```
목적: PageHeader에 onboardingHint 전용 prop 슬롯을 추가하여 전체 앱에서 처음 사용 유저 힌트를 재사용 가능한
      패턴으로 제공한다. dismissible(localStorage 저장) + 권한 연동 + 페이지별 문맥 메시지 지원.
      반입 탭의 외부 렌탈·내부 공용 테이블도 stripe/sticky header로 프리미엄 수준으로 승격한다.

선행 확인:
- apps/frontend/components/shared/PageHeader.tsx — title/subtitle/actions 3슬롯 (온보딩 슬롯 없음)
- apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx:183,308 — 표준 Table
- grep "onboardingHint\|firstVisit\|welcome" apps/frontend → 0 hit (선례 없음 — 신규 패턴)

단계:
1. PageHeader onboardingHint prop 추가 (components/shared/PageHeader.tsx)
   interface OnboardingHint {
     id: string;                    // localStorage 키 (per-page 고유)
     icon?: LucideIcon;
     title: string;
     description: string;
     primaryAction?: { label: string; href: string; permission?: Permission };
     dismissible?: boolean;         // default true
   }
   interface PageHeaderProps {
     ...기존...
     onboardingHint?: OnboardingHint;
   }

2. use-onboarding-hint 훅 신규 (hooks/use-onboarding-hint.ts)
   - localStorage 키: `onboarding-dismissed:<id>`
   - dismiss 시 해당 id 저장, 재방문 시 숨김
   - SSR 안전 (useEffect에서 읽기)

3. PAGE_HEADER_TOKENS 확장 (lib/design-tokens/components/page-layout.ts)
   - onboardingContainer: 'rounded-lg border border-brand-info/20 bg-brand-info/5 p-4 mb-4'
   - onboardingIcon: 'text-brand-info'
   - onboardingDismissBtn: 기존 버튼 토큰 활용
   - 하드코딩 없이 brand 시맨틱 토큰만 사용

4. CheckoutsContent.tsx 온보딩 힌트 적용
   <PageHeader
     title={t('title')}
     subtitle={t('description')}
     onboardingHint={{
       id: 'checkouts-first-visit',
       icon: Info,
       title: t('onboarding.title'),
       description: t('onboarding.description'),
       primaryAction: {
         label: t('onboarding.cta'),
         href: FRONTEND_ROUTES.CHECKOUTS.CREATE,
         permission: Permission.CREATE_CHECKOUT,
       },
     }}
     actions={...}
   />

5. PREMIUM_TABLE_TOKENS 신규 (lib/design-tokens/components/shared.ts 또는 table.ts)
   export const PREMIUM_TABLE_TOKENS = {
     stripe: 'even:bg-muted/20',
     stickyHeader: 'sticky top-0 bg-background z-10',
     importantCol: 'font-semibold text-foreground',
   } as const;

6. InboundCheckoutsTab 테이블 적용
   - 외부 렌탈·내부 공용 TableRow에 PREMIUM_TABLE_TOKENS.stripe 클래스
   - TableHead에 PREMIUM_TABLE_TOKENS.stickyHeader
   - status 컬럼에 PREMIUM_TABLE_TOKENS.importantCol

7. i18n 키 추가
   - checkouts.onboarding.title: "반출입 관리 시작하기"
   - checkouts.onboarding.description: "장비 반출(교정·수리·렌탈)을 신청하고, 승인·반입 과정을 관리할 수 있습니다."
   - checkouts.onboarding.cta: "첫 반출 신청하기"

검증:
- pnpm --filter frontend exec tsc --noEmit
- PageHeader onboardingHint prop 타입 export됨
- 첫 방문: 힌트 배너 표시 + CTA 가시 + 권한 없으면 CTA 숨김
- dismiss 클릭 → localStorage 저장 → 새로고침 시 숨김 유지
- 반입 탭 테이블에 줄무늬 + sticky header 적용
- 변경 파일 ≤ 7개
```

### 🟢 LOW — 78-7: 모션 & 접근성 마감 (Mode 0)

```
목적: 통계 카드/그룹 카드 등장 시 스태거 애니메이션이 없어 단조롭고,
      Skeleton 로딩 상태에 aria-busy가 없으며, sr-only 스크린리더 전용 텍스트가 명시 사용되지 않는다.

선행 확인:
- checkout.ts:438 CHECKOUT_MOTION — TRANSITION_PRESETS 기반 4종 정의, 스태거 없음
- OutboundCheckoutsTab.tsx:182 renderLoadingState — Skeleton만 사용, aria-busy 없음
- grep "sr-only" apps/frontend/components/checkouts → 0 hit

단계:
1. STAGGER_PRESETS 신규 (lib/design-tokens/motion.ts)
   export const STAGGER_PRESETS = {
     statsCards: (index: number) => ({ animationDelay: `${index * 40}ms` }),
     listGroups: (index: number) => ({ animationDelay: `${index * 60}ms` }),
   };

2. 통계 카드 스태거 적용 (OutboundCheckoutsTab.tsx renderStats())
   - 각 카드에 style={STAGGER_PRESETS.statsCards(index)}
   - 초기 등장 시 fade-in + translate-y
   - prefers-reduced-motion 준수 (motion-reduce:animation-none)

3. 로딩 상태 aria-busy 추가
   - renderLoadingState() 컨테이너에 role="status" aria-busy="true" aria-live="polite"
   - sr-only 텍스트: <span className="sr-only">{t('loading')}</span>

4. Overdue 알림 배너 sr-only 보강 (CheckoutAlertBanners.tsx)
   - 이미 role="alert" aria-live="polite" 있음 (OK)
   - sr-only로 "긴급 알림 {N}건" 요약 텍스트 추가

검증:
- 초기 렌더 시 5개 통계 카드가 순차 등장 (40ms 간격)
- motion-reduce 시 즉시 표시
- 스크린 리더: 로딩 중 "로딩 중" 낭독됨
- pnpm --filter frontend exec tsc --noEmit
- 변경 파일 ≤ 4개
```

---

## 34차 후속 — wf20-infra-debt harness 결과 review-architecture tech debt (3건)

> **발견 배경 (2026-04-08, wf20-infra-debt harness PASS 직후 review-architecture)**:
> SelfInspectionTab.tsx 행 액션 aria-label SSOT 패턴 도입 후, 동일 도메인의 다른 컴포넌트에서
> divergence가 확인되었다. wf20-infra-debt harness contract의 SHOULD criteria로 분류되었던
> 항목 + producer/consumer scope 정합성 검증 중 발견된 항목을 등재.

### 🟢 LOW — sticky-header CSS 변수명 string literal 중복 (3 곳, 4번째 등장 시 상수화)

```
배경: wf20-infra-debt harness review-architecture 검증 결과:
'--sticky-header-height' CSS 변수가 producer 1곳 + consumer 2곳에 string literal 로 중복 박혀 있다:
1. Producer: apps/frontend/components/equipment/EquipmentDetailClient.tsx:96
   document.documentElement.style.setProperty('--sticky-header-height', ...)
2. Consumer (CSS): apps/frontend/lib/design-tokens/components/equipment.ts:809
   top-[var(--sticky-header-height,0px)]
3. Consumer (e2e): apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts:34
   getComputedStyle(documentElement).getPropertyValue('--sticky-header-height')

세 지점 모두 :root 스코프로 통일되어 silent 0 반환 리스크는 없으나, 4번째 consumer (예: 다른
sticky tab 컨테이너) 가 등장할 때 오타/스코프 불일치 가능성이 있다.

작업 (4번째 consumer 등장 시점에만 진행 — 현재는 over-engineering):
1. apps/frontend/lib/design-tokens/primitives/ 또는 shared-constants 에
   STICKY_HEADER_HEIGHT_VAR = '--sticky-header-height' 상수 추가
2. 3 곳 모두 import 로 교체
3. /verify-hardcoding 룰: CSS 변수명 string literal 2회+ 사용 시 상수화 권고 추가 (선택)

검증:
- pnpm tsc --noEmit exit 0
- grep "'--sticky-header-height'" apps/frontend → import 외 0 hit

⚠️ 현재는 트리거 조건 미달 (3 hit). 4번째 hit 발생 시 자동 승격.
```

