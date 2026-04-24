# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-24 (92차 정리: PR-19 Loading Skeleton + inline Error 완료 → archive 이동. active: PR-16·PR-17·PR-21~PR-23 + tech-debt 11건)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.
> **v2 설계 SSOT**: `.claude/plans/zany-swimming-feigenbaum.md` (Section 0 UX Philosophy + 시각 재구성 A~T + 신규 흡수 P~T)

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
  **finding 3개 이상 & 도메인 독립적** → 단일 메시지에 parallel Explore 에이전트 실행:
    - `name="verify-{domain}"`, `subagent_type="Explore"`, `run_in_background=true` (도메인별 1개)
    - 완료 후 `SendMessage({to: "verify-{domain}"})` 로 follow-up 가능 (재스캔 불필요)
  **finding 1~2개** → 직접 해당 verify-* 스킬 순차 호출

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

구조: Explore subagent 3개 **단일 메시지** 병렬 실행 (`run_in_background: true`)
     각 에이전트에 `name` 지정 → 결과 도착 후 `SendMessage`로 컨텍스트 유지 후속 질문 가능

Agent A (`name="fleet-backend"`, `subagent_type="Explore"`, `run_in_background=true`) — Backend race/원자성/트랜잭션 경계
  조사 대상: review-learnings.md "트랜잭션 내 서비스 메서드" + "CAS 선점" 섹션의 파일 경로
  확인 항목:
  - 변경된 service.ts 파일에서 db.transaction() 내부 this.db 직접 사용 패턴
  - CAS 선점 순서 (상태 전이 → 작업 순서 위반)
  - 보상 코드 누락 (CAS 선점 후 후속 실패 시 미복원)
  보고: file:line + 재현 조건 1줄

Agent B (`name="fleet-frontend"`, `subagent_type="Explore"`, `run_in_background=true`) — Frontend stale closure/CAS/SSOT 경로
  조사 대상: review-learnings.md "Stale CAS 버전" 4차 재발 섹션 패턴
  확인 항목:
  - mutation.mutationFn 내부 useQuery 캐시 스냅샷(version) 직접 참조
  - 상태 전이 액션에서 fresh fetch 없이 캐시 버전 사용
  - VERSION_CONFLICT 핸들러(onError) 누락
  보고: file:line + stale 경로 설명

Agent C (`name="fleet-infra"`, `subagent_type="Explore"`, `run_in_background=true`) — Cross-module 이벤트·캐시·권한 흐름
  조사 대상: review-learnings.md "이벤트" + "권한/RBAC" + "캐시 무효화" 섹션
  확인 항목:
  - emitAsync vs emit 사용 일관성 (verify-cache-events 스킬 기준)
  - 신규 엔드포인트 @SiteScoped/@Permissions 누락
  - 장비 상태 전이 후 캐시 무효화 이벤트 미발행
  보고: file:line + 이슈 설명

세 에이전트 완료 알림 수신 후 중복 제거 → priority 랭킹.
추가 확인 필요 시: `SendMessage({to: "fleet-backend"})` 등으로 재스캔 없이 컨텍스트 유지 질문.

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

---

## 반출입 관리 페이지 아키텍처 개선 — Phase 1~8 프롬프트 (11건)

> **발견 배경 (2026-04-21, /review-design 반출입 페이지 종합 68/100)**:
> AP-01~10 전 항목 개선 + FSM SSOT 도입 아키텍처 플랜 기반.
> 검증일: 2026-04-21. `packages/schemas/src/fsm/` 미존재, `NextStepPanel.tsx` 미존재,
> `ELEVATION_TOKENS.surface` 미존재, `TYPOGRAPHY_TOKENS` export 미존재,
> `CHECKOUT_STEPPER_TOKENS.status.next` 미존재, `checkouts.fsm` i18n 키 미존재 확인.
> AuditLogService는 `.log()` 아닌 `.create(dto: CreateAuditLogDto)` 사용.
> PR 순서: PR-1 → PR-2 → PR-3·PR-4 병렬 → PR-5 → PR-6 → PR-7 → PR-8·PR-9 병렬.

---

### 🟠 HIGH — PR-13: YourTurnBadge + 그룹 카드 Redesign + checkout-your-turn.ts 토큰 [P2,P4] (Mode 1) ✅ 완료

> 아카이브: [archive-design.md](./archive-design.md) — 반출입 관리 PR-13

---

### 🟠 HIGH — PR-14: WorkflowTimeline — 5/8단계 분기 + 노드 상태 5종 + checkout-timeline.ts 토큰 [P1,P3] (Mode 1) ✅ 완료

> 아카이브: [archive-design.md](./archive-design.md) — 반출입 관리 PR-14

---

### 🟡 MEDIUM — PR-15: 모션 디자인 7종 + prefers-reduced-motion [P1] (Mode 1) ✅ 완료

> 아카이브: [archive-design.md](./archive-design.md) — 반출입 관리 PR-15

---

### 🟡 MEDIUM — PR-16: 접근성 강화 — skip link + kbd nav + focus trap + aria-live 다단계 [전원칙] (Mode 1)

```
문제:
서브탭 ←/→ 키 탐색, NextStepPanel aria-live, skip-to-content 링크 미구현.

조건: PR-12(서브탭) + PR-14(Timeline) 완료 후 진행.

작업:

1. 레이아웃 skip link:
   apps/frontend/components/layout/ — skip link 추가:
   <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 ...">
     {t('common.skipToContent')}
   </a>
   페이지 <main> 에 id="main-content" 부착

2. 서브탭 ←/→ 키보드:
   CheckoutsContent.tsx onKeyDown: ArrowLeft/ArrowRight 시 탭 인덱스 순환
   포커스 탭에 FOCUS_TOKENS.classes.default ring 부착

3. NextStepPanel aria-live:
   urgency === 'critical' → aria-live="assertive"
   urgency !== 'critical' → aria-live="polite"
   상태 전이 후 NextStepPanel로 focus 복귀 (useRef + focus())
   GuidanceCallout.tsx L52-58 패턴 미러링

4. WorkflowTimeline tooltip keyboard:
   각 노드 button role + Enter/Space → Radix Tooltip 토글 (내장 keyboard 지원)

SSOT 주의:
- FOCUS_TOKENS.classes.default: lib/design-tokens/ 에서 import
- aria-live: GuidanceCallout.tsx L52-58 패턴 참조
- hex 하드코딩 금지

검증:
- pnpm --filter frontend run tsc --noEmit
- Tab → NextStepPanel 버튼 도달 + Enter 활성화
- urgency critical → aria-live="assertive" 확인 (playwright getAttribute)
- axe-core: role="tablist" + aria-selected 위반 0
```

---

### 🟢 LOW — PR-17: 최종 리뷰 + 번들 크기 diff + S-14 Feature Flag tech-debt 등록 + 3-Phase rollout (Mode 0)

```
문제:
PR-3~PR-16 완료 후 전체 통합 검증 없음.
NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 상시화 계획 미등록.

조건: PR-3~PR-16 전부 완료 후 진행 (최종 단계, 병렬 불가).

작업:

1. 전체 통합 검증:
   pnpm --filter frontend run tsc --noEmit && pnpm --filter backend run tsc --noEmit
   pnpm --filter frontend run lint
   node scripts/self-audit.mjs --all         (체크 ①~⑨ 위반 0)
   node scripts/check-i18n-keys.mjs --all    (8 네임스페이스 누락 0)
   pnpm --filter frontend run build
   NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true \
     pnpm --filter frontend run test:e2e -- --grep "@next-step|@checkout-ia|@your-turn|@empty-state"
   (11 시나리오 전부 PASS)

2. S-14 Feature Flag tech-debt 등록:
   .claude/exec-plans/tech-debt-tracker.md 항목 추가:
   - 제목: "Feature Flag NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 상시화"
   - 분류: MEDIUM / 기술부채
   - 조건: Beta 2 세션 안정 + 프로덕션 A/B 1주 관찰 후
   - 대응: flag 코드 제거 → flag=false 분기 삭제 → .env.example 해당 줄 삭제
   - 예상 시점: 2026-Q2

3. 번들 크기 diff:
   pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --compare
   /checkouts, /checkouts/[id], /dashboard 라우트 < 5% 증가 확인

4. Feature Flag 3-Phase rollout 체크리스트:

   | 단계 | 시점                             | NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL | 비고                       |
   |------|----------------------------------|--------------------------------------|----------------------------|
   | Alpha| PR-5 머지 직후                   | false (기본)                         | 내부 QA만 true 수동 토글   |
   | Beta | E2E 11 시나리오 2 세션 안정화 후 | true (개발 환경)                     | 프로덕션은 여전히 false    |
   | GA   | 프로덕션 A/B 1주 관찰 후         | true (전역)                          | flag 코드 제거 (S-14 후속) |

SSOT 주의:
- tech-debt-tracker 항목 형식: 기존 항목 스타일 준수
- 번들 baseline: check-bundle-size.mjs baseline 파일 갱신 금지 (비교 기준 보존)

검증:
- 위 1번 전체 통합 검증 PASS
- tech-debt-tracker.md에 NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 항목 존재
- 번들 증가분 < 5% 확인
```

---

### 🟠 HIGH — PR-18: Contextual Tooltip + Onboarding + Toast 템플릿 + Mobile Bottom Sheet + E2E 3 시나리오 [P1,P2,P4] (Mode 2) ✅ 완료

> 아카이브: [archive-design.md](./archive-design.md) — 반출입 관리 PR-18

---

### 🟡 MEDIUM — PR-19: Loading Skeleton 6종 + inline Error 3 위치 + checkout-loading-skeleton.ts 토큰 [P1] (Mode 1) ✅ 완료

```
문제:
데이터 로딩 중 spinner 표시 또는 빈 화면 — 레이아웃 시프트. 부분 에러 표시 불가.

조건: PR-5(통합) + PR-7(HeroKPI) + PR-14(Timeline) 완료 후 진행.

작업:

1. lib/design-tokens/components/checkout-loading-skeleton.ts (신규):
   export const CHECKOUT_LOADING_SKELETON_TOKENS = {
     base:     'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
     text:     { sm: 'h-3 w-24', md: 'h-4 w-40', lg: 'h-5 w-56' },
     card:     'h-24 w-full rounded-lg',
     badge:    'h-6 w-16 rounded-full',
     icon:     'h-8 w-8 rounded-full',
     timeline: 'h-64 w-full',
   } as const;

2. Loading Skeleton 6종 (신규 4 + 기존 2 확장):
   신규:
   - HeroKPISkeleton.tsx:        Hero floating card + 4 secondary raised 그리드
   - WorkflowTimelineSkeleton.tsx: 5/7 노드 dot + connector line
   - NextStepPanelSkeleton.tsx:  icon + title + button 3-line
   - CheckoutGroupCardSkeleton.tsx: 그룹 헤더 + row 3개
   기존 확장:
   - CheckoutListSkeleton.tsx:   HeroKPI skeleton 섹션 추가
   - CheckoutDetailSkeleton.tsx: WorkflowTimeline skeleton 섹션 추가
   모든 skeleton: animate-pulse + motion-reduce:animate-none, spinner 사용 금지

3. inline Error 3 위치:
   - HeroKPIError:         목록 페이지 KPI 영역, role="alert" + retry 버튼 (목록 정상 유지)
   - NextStepPanelError:   상세 페이지, "다음 단계를 계산하지 못했습니다" + retry
   - WorkflowTimelineError:접힌 상태, "진행 단계를 표시할 수 없습니다" + retry
   모든 Error 컴포넌트: role="alert" + aria-live="assertive"

4. Suspense 경계 세분화:
   CheckoutDetailClient.tsx: statusGroup / contextGroup / actionBar 각각 Suspense
   각 fallback: 해당 skeleton 컴포넌트

SSOT 주의:
- spinner 금지: animate-pulse + CHECKOUT_LOADING_SKELETON_TOKENS만 사용
- hex 하드코딩 금지

검증:
- pnpm --filter frontend run tsc --noEmit
- 네트워크 throttle → 각 Suspense 영역 skeleton 렌더 확인
- HeroKPI API 에러 → HeroKPIError inline (목록 하단은 정상) 확인
- grep 'spinner\|Spinner' apps/frontend/components/checkouts/ → 0 hit
```

---

---

### 🟡 MEDIUM — PR-23: 마무리 정리 — NextStepPanel 플래그 상시화 + .env.example + focus-visible + i18n urgency (Mode 1)

```
배경 (2026-04-22 checkout-arch-pr3-11 tech-debt 4건):
PR-5에서 도입된 NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 피처 플래그가
Beta 2 세션 안정화 완료 후 제거 대상. 동시에 소규모 접근성/i18n 마무리 3건 처리.

트리거 조건: 이 PR은 다음 조건 모두 충족 후 진행:
- E2E 11 시나리오 2 세션 연속 안정 (PR-9 이후)
- NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true 개발 환경 1주 이상 운영

문제:
1. [플래그 제거 🟡] NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 코드 정리
   CheckoutDetailClient.tsx: showNextStepPanel 분기 + LegacyActionsBlock
   CheckoutGroupCard.tsx:    showNextStepPanel 분기 + LegacyInlineActions
   checkout-flags.ts (있다면): isNextStepPanelEnabled() 호출부 3곳

2. [접근성 🟢] workflow-panel.ts:49-52 blocked 버튼 focus-visible 누락
   WORKFLOW_PANEL_TOKENS.action.blocked에 FOCUS_TOKENS.classes.default 없음.
   primary 버튼에는 이미 존재.
   → blocked 버튼도 동일하게 focus-visible ring 추가.

3. [문서화 🟢] .env.example 플래그 문서화 누락
   .env.example, apps/frontend/.env.local.example 양쪽에
   # NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false 항목 누락.
   → 플래그 제거 시: 항목 삭제. 제거 전이면: 항목 추가.

4. [i18n 🟢] checkouts.json guidance.urgency.normal 빈 문자열
   apps/frontend/messages/ko/checkouts.json + en/checkouts.json:
   "guidance": { "urgency": { "normal": "" } }  ← 빈 문자열
   런타임 호출 코드가 현재 없으나 키 정의는 유지해야 함.
   → 적절한 fallback 텍스트 추가 또는 명시적 빈 문자열 유지 (의도 주석 추가).

조건: PR-5(플래그 도입) + E2E 11 시나리오 안정 확인 후. 트리거 조건 충족 전 대기.

작업:

1. NextStepPanel 플래그 상시화 (트리거 조건 충족 시)
   CheckoutDetailClient.tsx:
   - showNextStepPanel 분기 삭제
   - LegacyActionsBlock 컴포넌트 제거 (로컬 함수 또는 별도 파일 모두)
   - NextStepPanel 단일 렌더만 남김

   CheckoutGroupCard.tsx:
   - showNextStepPanel 분기 삭제
   - LegacyInlineActions 컴포넌트 제거
   - NextStepPanel compact variant 단일 렌더만 남김

   checkout-flags.ts (파일 존재 시):
   - isNextStepPanelEnabled() 함수 제거
   - 파일 전체 비면 파일 삭제
   - import 정리: 해당 파일 import하던 모든 곳에서 제거

   환경변수:
   - .env.local: NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true 줄 삭제
   - .env.local.example: 해당 줄 삭제
   - .env.example: 해당 줄 삭제 (있으면)

2. workflow-panel.ts blocked 버튼 focus-visible 추가
   apps/frontend/lib/design-tokens/components/workflow-panel.ts:49-52:
   WORKFLOW_PANEL_TOKENS.action.blocked 객체에:
   focusVisible: FOCUS_TOKENS.classes.default   ← 추가
   참조: 동일 파일의 primary 버튼 focusVisible 속성 (이미 존재하는 값 재사용).
   FOCUS_TOKENS import: @/lib/design-tokens에서 import (이미 있으면 추가 불필요).

3. .env.example 문서화 (트리거 조건 충족 전인 경우만)
   이 항목은 PR-23 트리거 전에 먼저 실행 가능:
   apps/frontend/.env.local.example 파일에 추가:
   # Next Step Panel 피처 플래그 (Beta 완료 후 제거 예정)
   # NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false
   .env.example에도 동일하게 추가.

4. guidance.urgency.normal i18n 처리
   apps/frontend/messages/ko/checkouts.json:
   "guidance": { "urgency": { "normal": "일반" } }  ← 빈 문자열 → 의미있는 값 또는
   또는 키 자체를 제거 (런타임 미사용이면 PR-8의 check-i18n-keys.mjs REQUIRED_KEYS에도 없으므로 제거 안전).
   apps/frontend/messages/en/checkouts.json 동일.
   선택: "일반" / "Normal" 추가 또는 키 제거 — 어느 쪽이든 빈 문자열 불허.

SSOT 주의:
- FOCUS_TOKENS: @/lib/design-tokens에서 import (하드코딩 금지)
- 레거시 컴포넌트 제거 시: 참조 import 흔적 0 확인 필수
- i18n 키 제거 시: check-i18n-keys.mjs REQUIRED_KEYS에서 해당 키도 제거

검증:
- pnpm --filter frontend exec tsc --noEmit
- grep "NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL\|showNextStepPanel\|LegacyActionsBlock\|LegacyInlineActions" apps/frontend/ → 0 hit (플래그 제거 시)
- grep "blocked" apps/frontend/lib/design-tokens/components/workflow-panel.ts → focusVisible 존재 확인
- grep '"normal": ""' apps/frontend/messages/ → 0 hit
```

---

> **PR 실행 순서 (의존성 그래프 — PR-1~PR-9·PR-20·PR-24 완료 ✅)**
>
> **Phase 1 (완료)**: PR-1 (FSM schemas) ✅ → PR-2 (backend) ✅
>
> **Phase 2&3 (완료)**:
> - PR-3 (tokens) ✅ → PR-4 (NextStepPanel) ✅ → PR-5 (통합+flag) ✅ → PR-9 (E2E 11) ✅
> - PR-8 (i18n 8NS) ✅ ───────────────────────────────────→ PR-9 ✅, PR-12
>
> **Phase 4 (완료)**:
> - PR-6 (Stepper/MiniProgress) ✅ | PR-7 (HeroKPI/Stat) ✅ | PR-14 ✅ (WorkflowTimeline)
>
> **Phase 5 (완료)**: PR-5 ✅ + PR-8 ✅ + PR-9 ✅ 완료 → PR-12 ✅ (목록 IA + 서브탭)
>
> **Phase 6 (완료)**: PR-12 ✅ 완료 → PR-13 ✅ (YourTurnBadge + 그룹 카드)
>
> **Phase 7 (완료)**: PR-4 ✅ 완료 → PR-15 ✅ (모션 7종)
>
> **Phase 8**: PR-12 ✅ + PR-14 ✅ 완료 → PR-16 (접근성)
>
> **Phase 9**: PR-5 ✅ + PR-7 ✅ + PR-14 ✅ 완료 → PR-19 (Loading skeleton + Error)
>
> **Phase 10 (완료)**: PR-5 + PR-8 ✅ 완료 → PR-18 ✅ (Tooltip + Onboarding + Toast + Mobile)
>
> **Phase 11 (독립)**: PR-3 ✅ + NC e2e PASS → PR-10 (NC elevation 승격)
>
> **Phase 12 (독립)**: PR-2 이후 → PR-11 (Audit gate)
>
> **Phase 16 (최종)**: PR-3~PR-19 전부 완료 → PR-17 (최종 리뷰 + 번들 + Flag rollout)
>
> **Phase A (완료)**: PR-2 이후 → PR-20 (Backend 보안/SSOT) ✅
>
> **Phase B (독립 — 즉시 진행 가능)**: PR-2 이후 → PR-22 (API 정리 + Zod)
>
> **Phase C (완료)**: PR-2 이후 → PR-24 (FSM 리터럴 7건) ✅
>
> **Phase D**: PR-12 ✅(서브탭 완료) → PR-21 (WCAG + QUERY_CONFIG + URL SSOT) 진행 가능
>
> **Phase E (조건부)**: PR-5 + E2E 2세션 안정 후 → PR-23 (플래그 상시화 + 마무리)
>
> ※ **현재 완료**: PR-12 ✅ (목록 IA), PR-14 ✅ (WorkflowTimeline), PR-15 ✅ (모션 7종)
> ※ **다음 블로킹 해소**: PR-13 (YourTurnBadge + 그룹 카드) — PR-12 완료로 진행 가능.
> ※ PR-21 Phase D 조건 충족 (PR-12 완료).
> ※ PR-22는 즉시 진행 가능 (frontend와 독립).
> ※ PR-23은 트리거 조건(E2E 2세션 안정) 충족 전 대기 필수.

---

