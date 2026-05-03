# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-05-03 (calibration-scope-guards 4 iters PASS + 아카이브. production env/API SSOT, scan/handover error.tsx, checkout PR-16/PR-23, 장비 생성 교정 이력 저장, schema generator stub 완료 후 아카이브. sticky-header는 trigger condition unmet 유지.)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.
> **v2 설계 SSOT**: `.claude/plans/zany-swimming-feigenbaum.md` (Section 0 UX Philosophy + 시각 재구성 A~T + 신규 흡수 P~T)

---

## 🆕 88차 (2026-04-24) — Checkouts V3 통합 로드맵 (5-Sprint)

> **플랜 본문**: `.claude/exec-plans/active/2026-04-24-checkouts-v3-roadmap.md` (44.8KB · 637줄)
> **메모리**: `project_88_checkouts_v3_roadmap_20260424.md`
> **배경**: 외부 아키텍처 리뷰 V2(18 findings) 전수 대응. 사용자 결정: 5-Sprint 전체·BFF 포함·Phase-based '1/3 phase'·편의성 U-01~U-12 전량.

### Sprint 1 · Authority 수술 (Contract 5종 작성 완료 — 1.1 완료·1.2 스키마 선착수)
1. ~~`.claude/contracts/checkout-fsm-resolve-action.md` (P0 F-1·F-2 · 280 조합 table test)~~ ✅ [96차 완료: findCheckoutEntity 분리, findOne always-meta, FSM drift safeParse, descriptor-table 동적 fixture]
2. `.claude/contracts/checkout-descriptor-phase-fields.md` (P1 F-3 · RentalPhase + nextStepIndex 필드) — ⚠️ 스키마 4필드 선착수 (phase/nextStepIndex/phaseIndex/totalPhases checkout-fsm.ts 추가). rental-phase.ts SSOT (getRentalPhase·RENTAL_STATUS_TO_PHASE satisfies) M3·M4 미완 → 96차 Sprint 1.2 잔여분
3. `.claude/contracts/checkout-meta-fail-closed.md` (P0 F-2 · `?? false` 전환 + E2E 12)
4. `.claude/contracts/legacy-actions-block-removal.md` (P0 F-1·C-1 · LegacyActionsBlock 완전 삭제)
5. `.claude/contracts/checkout-fsm-exhaustive-satisfies.md` (§5 · satisfies 전수 전환)

### ~~Sprint 2 · Tokens 봉합~~ ✅ 전체 완료 (2026-04-27)
6. ~~`.claude/contracts/checkout-row-token-consolidation.md` (L-1·L-2)~~ ✅ purposeBar SSOT + satisfies + getPurposeBarClass export
7. ~~`.claude/contracts/checkout-i18n-tab-badge-tokens.md` (L-3·L-4)~~ ✅ CHECKOUT_TAB_BADGE_TOKENS.alert + overdueClear i18n
8. ~~`.claude/contracts/checkout-rhythm-focus-inbound-tokens.md` (L-5·L-6·L-7)~~ ✅ FOCUS_TOKENS.ringCurrent + CHECKOUT_INBOUND_SECTION_TOKENS
9. ~~`.claude/contracts/checkout-deprecated-token-removal.md` (L-8 · eslint-plugin-deprecation)~~ ✅ @typescript-eslint/no-deprecated eslint guard 적용

### Sprint 3 · Perf & Cache (Contract 3종 작성 완료 — 실행 대기)
10. `.claude/contracts/checkout-inbound-bff-overview.md` (P-1 · BFF 신설 + canary)
11. `.claude/contracts/checkout-query-keys-view-resource-refactor.md` (§3 · view.*/resource.*)
12. `.claude/contracts/checkout-memo-boundary-optimization.md` (P-2·P-3·P-4)

### 🔶 다음 세션 작업 — Sprint 4·5 Contract 작성 (미착수)
- **Sprint 4 (UX Flow)** — 15개 내외 contract 예상:
  - 4.1 NextStepPanel 단일 렌더(compact+hero+actor variant)
  - 4.2 Row 3-zone grid (`grid-cols-[3px_72px_1fr_auto]`)
  - 4.3 상세 D-day 배지 (C-3)
  - 4.4 Rental Phase-based UI (`CheckoutPhaseIndicator` 신규 + WorkflowTimeline 접힘)
  - 4.5.1 ~ 4.5.12 편의성 **U-01 ~ U-12 전체 12건**
- **Sprint 5 (Visual Polish)** — 5~7개 contract:
  - 5.1 Empty state 3색 / 5.2 Typography 6단계 / 5.3 Color semantic 5축 / 5.4 Density & rhythm / 5.5 Icon & motion

### 실행 순서 (Contract 작성 이후)
Sprint 1.1 `resolveNextAction` → 1.2 → 1.3 → 1.4 → 1.5 → 2.1~2.8 (병행 가능) → 3.1+3.2(같은 PR) → 3.3 → 4.x → 5.x. 각 contract는 harness 오케스트레이터(Planner→Generator→Evaluator) 루프로 순차 구현. FE analytics instrumentation은 §10 metrics 수집 기반으로 선행.

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

## 🆕 2026-05-03 — generate-prompts + review-architecture 스캔 신규 발견

> **발견 배경**: scan-backend·scan-frontend·scan-infra 3 parallel 에이전트 + `/review-architecture` 수동 검증. 2차 검증 완료.
> **아카이브**: 2026-05-03 CRITICAL calibration-scope-guards, production env/API SSOT, scan/handover error.tsx, checkout PR-16/PR-23 — PASS → archive-domain.md.
> **false positive 5건**: REVOKE_APPROVAL 권한(의도적 설계·서비스 소유권 검증), auth.ts 한국어 레이블(dev-only), CLASSIFICATION_OPTIONS 한국어(CLAUDE.md 명시 허용), use-inspection-template.ts Phase 1B-E TODO(InspectionFormDialog.tsx:195 완전 구현), calibration DB site/team 인덱스(equipment FK 경유 스코핑·기존 인덱스 커버).

## 🆕 2026-04-27 — generate-prompts 스캔 신규 발견 (4건 → 2건 완료)

> **발견 배경**: 코드베이스 전수 스캔 (scan-backend·scan-frontend·scan-infra 3 parallel agent) + 2차 검증 완료.
> false positive 8건 아카이브 처리 (Drizzle relations 4건, error.tsx 5건, data-migration @AuditLog, template download, Sprint 3.2 queryKeys 완료).
> **documents-revision-permission·equipment-pwa-audit-i18n 2건 완료 (2026-04-27)** → archive-domain.md 참조.

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

## 반출입 관리 페이지 아키텍처 개선 — Phase 1~8 프롬프트 (active 0건)

> **발견 배경 (2026-04-21, /review-design 반출입 페이지 종합 68/100)**:
> AP-01~10 전 항목 개선 + FSM SSOT 도입 아키텍처 플랜 기반.
> 검증일: 2026-04-21. `packages/schemas/src/fsm/` 미존재, `NextStepPanel.tsx` 미존재,
> `ELEVATION_TOKENS.surface` 미존재, `TYPOGRAPHY_TOKENS` export 미존재,
> `CHECKOUT_STEPPER_TOKENS.status.next` 미존재, `checkouts.fsm` i18n 키 미존재 확인.
> AuditLogService는 `.log()` 아닌 `.create(dto: CreateAuditLogDto)` 사용.
> PR 순서: PR-1 → PR-2 → PR-3·PR-4 병렬 → PR-5 → PR-6 → PR-7 → PR-8·PR-9 병렬.

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
> **Phase 8 (완료)**: PR-12 ✅ + PR-14 ✅ 완료 → PR-16 ✅ (접근성)
>
> **Phase 9 (완료)**: PR-5 ✅ + PR-7 ✅ + PR-14 ✅ 완료 → PR-19 ✅ (Loading skeleton + Error)
>
> **Phase 10 (완료)**: PR-5 + PR-8 ✅ 완료 → PR-18 ✅ (Tooltip + Onboarding + Toast + Mobile)
>
> **Phase 11 (독립)**: PR-3 ✅ + NC e2e PASS → PR-10 (NC elevation 승격)
>
> **Phase 12 (독립)**: PR-2 이후 → PR-11 (Audit gate)
>
> **Phase 16 (완료)**: PR-3~PR-19 전부 완료 → PR-17 ✅ (최종 리뷰 + 번들 + Flag rollout)
>
> **Phase A (완료)**: PR-2 이후 → PR-20 (Backend 보안/SSOT) ✅
>
> **Phase B (독립 — 즉시 진행 가능)**: PR-2 이후 → PR-22 (API 정리 + Zod)
>
> **Phase C (완료)**: PR-2 이후 → PR-24 (FSM 리터럴 7건) ✅
>
> **Phase D**: PR-12 ✅(서브탭 완료) → PR-21 (WCAG + QUERY_CONFIG + URL SSOT) 진행 가능
>
> **Phase E (완료)**: PR-5 + E2E 2세션 안정 후 → PR-23 ✅ (플래그 상시화 + 마무리)
>
> ※ **현재 완료**: PR-12 ✅ (목록 IA), PR-13 ✅ (YourTurnBadge), PR-14 ✅ (WorkflowTimeline), PR-15 ✅ (모션 7종), PR-16 ✅ (접근성), PR-17 ✅ (최종 리뷰+번들), PR-18 ✅ (Toast/Mobile), PR-19 ✅ (Loading Skeleton + Error), PR-23 ✅ (플래그 상시화 마무리)
> ※ PR-21 Phase D 조건 충족 (PR-12 완료).
> ※ PR-22는 즉시 진행 가능 (frontend와 독립).

---
