# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-05-05 (query-dto-validation-ssot Mode 2 harness PASS — 14/14 MUST + 10/10 SHOULD. Query DTO trim/max + sort enum SSOT 13 도메인 + verify-zod Step 20 + 185 spec cases. archive 이동 완료.)**
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

## 🆕 2026-05-05 — generate-prompts 스캔 신규 발견 (8건 confirmed · 9 false positive · 5 사용자 결정)

> **발견 배경**: scan-backend·scan-frontend·scan-infra 3 parallel Explore agent + Read/Grep 직접 verify.
> **Verify 결과**:
> - **False positive 9건**: `.env` git 추적(미추적·.env.example만 tracked), PaginationPrevious "Previous"(dead export·0 callers), TeamListContent searchInput(debounce-then-sync 표준), loading.tsx 누락 5경로((auth)/error 자체가 error route·login fast form·help 정적·visual-fixtures group·handover error.tsx 있음), Drizzle relations() 5건 미정의(approvalDelegations·rejection-presets·csp-reports·system-settings·inspection-result-sections — `db.query.<table>` 사용처 0건, leaf entity)
> - **사용자 결정 5건**: Backend Query DTO trim/max 11건(verify-zod Step 12는 .min(N) required만 강제·c82ae0ef는 Create/Update DTO만 처리·Query optional은 정책 미정), use-inspection-template.ts TODO(Phase 1B-E 호출자 등장으로 outdated — 코멘트만 update or 제거)

### 🟠 HIGH — ApprovalRow React.memo 누락 (Mode 0)

```
배경: 승인 목록 행 렌더링 ApprovalRow가 React.memo 없이 export — list re-render 시 모든 행 재렌더.
ApprovalList.tsx:100에서 map으로 다수 렌더링됨. 동일 도메인 row 컴포넌트(YourTurnBadge·NextStepPanel·ProgressFlowSection)는 모두 memo 적용됨.

위치:
- apps/frontend/components/approvals/ApprovalRow.tsx:53 (export function ApprovalRow)
- 호출자: apps/frontend/components/approvals/ApprovalList.tsx:100 (<ApprovalRow ...>)

작업:
1. ApprovalRow를 React.memo로 wrap:
   const ApprovalRowComponent = (props: ApprovalRowProps) => { ... }
   export const ApprovalRow = React.memo(ApprovalRowComponent);
2. props에 함수형 콜백(onApprove/onReject/onToggleSelect/onViewDetail)이 매 렌더 새로 생성되지 않도록
   ApprovalList에서 useCallback으로 안정화 검토.

검증:
- pnpm tsc --noEmit exit 0
- grep "React.memo\|memo(" ApprovalRow.tsx → 1건 hit
- 기존 e2e/spec PASS
```

### 🟠 HIGH — GitHub Actions setup-node v4 → v6 일관성 (Mode 0)

```
배경: bundle-size·accessibility-audit·performance-audit 3개 워크플로가 setup-node@v4 사용 중인 반면,
main·codeql·supply-chain-gate·e2e-nightly·copilot-setup-steps는 모두 v6 (SHA pinned). 버전 드리프트.

위치:
- .github/workflows/bundle-size.yml:36
- .github/workflows/accessibility-audit.yml:37
- .github/workflows/performance-audit.yml:37

작업:
1. 3개 파일 모두 main.yml 패턴 차용:
   uses: actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6
2. cache 옵션도 main.yml과 동일하게 추가 (cache: pnpm or 별도 actions/cache 패턴 일관)

검증:
- grep "setup-node@v4" .github/workflows/ → 0건
- 3 workflow 로컬 푸시 또는 PR로 green 확인
```

### 🟠 HIGH — main.yml dep-audit job pnpm cache 누락 (Mode 0)

```
배경: main.yml dep-audit job(.github/workflows/main.yml:389)가 setup-node에 cache: pnpm 옵션 없이
node_modules만 actions/cache. pnpm metadata fetch가 매 런마다 발생 → CI 시간 낭비.
다른 job들은 setup-node cache: pnpm 또는 동등 패턴 사용.

위치:
- .github/workflows/main.yml:389-401 (dep-audit job)

작업:
1. setup-node에 cache: pnpm 추가 (다른 job 패턴 참고):
   uses: actions/setup-node@... # v6
   with:
     node-version: ${{ env.NODE_VERSION }}
     cache: pnpm
2. 기존 actions/cache(node_modules)와 충돌 시, 한쪽 선택 (대부분 pnpm cache가 더 효율).

검증:
- main.yml dep-audit job push → cache hit log 확인 (Cache Restored)
- CI 전체 시간 측정 (before/after)
```

### 🟡 MEDIUM — HeroKPI sr-only 한국어 하드코딩 (Mode 0)

```
배경: 트렌드 아이콘(TrendingUp/Down/Minus)의 sr-only 텍스트가 한국어 하드코딩.
i18n SSOT(messages/{ko,en}/checkouts.json) 우회.

위치:
- apps/frontend/components/checkouts/HeroKPI.tsx:51 ("증가 추세")
- apps/frontend/components/checkouts/HeroKPI.tsx:57 ("감소 추세")
- apps/frontend/components/checkouts/HeroKPI.tsx:63 ("변동 없음")

작업:
1. messages/ko/checkouts.json + messages/en/checkouts.json에 키 추가:
   "heroKpi": { "trendUp": "증가 추세", "trendDown": "감소 추세", "trendFlat": "변동 없음" }
   en: "Trend Up" / "Trend Down" / "No Change"
2. HeroKPI에 useTranslations('checkouts') hook 추가 + t('heroKpi.trendUp/Down/Flat') 사용
3. 기존 sr-only 클래스 유지

검증:
- grep -E "(증가|감소|변동) 추세|변동 없음" HeroKPI.tsx → 0건
- pnpm tsc --noEmit exit 0
- ko/en parity: grep -c "trendUp\|trendDown\|trendFlat" messages/{ko,en}/checkouts.json → 양쪽 동일
```

### 🟡 MEDIUM — CalibrationValidityChecker 한국어 Alert 하드코딩 (Mode 0)

```
배경: 교정 유효기간 검증 Alert의 title/description이 한국어 하드코딩. 영문 환경에서 Korean 노출.

위치:
- apps/frontend/components/equipment/CalibrationValidityChecker.tsx:51,53-55 ("교정 유효기간 부족", "차기교정일...")
- apps/frontend/components/equipment/CalibrationValidityChecker.tsx:63,65 ("교정 유효기간 확인됨", "차기교정일까지 N일...")

작업:
1. messages/ko/equipment.json + messages/en/equipment.json에 키 추가:
   "calibrationValidity": {
     "insufficient": { "title": "교정 유효기간 부족", "description": "..." },
     "verified": { "title": "교정 유효기간 확인됨", "description": "차기교정일까지 {days}일..." }
   }
2. useTranslations('equipment') hook 적용, fmtDate/daysBuffer는 ICU 변수로 전달
3. invalid → t('calibrationValidity.insufficient.description', { nextCalDate, endDate })

검증:
- grep "교정 유효기간\|차기교정일" CalibrationValidityChecker.tsx → 0건
- en/ko 동일 키 셋
- e2e: 장비 폼에서 Alert 노출 시 i18n locale 따라 변경
```

### 🟡 MEDIUM — Large Component Refactor (3 components · Mode 2)

```
배경: 1000줄 초과 컴포넌트 3건. 단일 파일에 form/dialog/section 로직 응집 → 가독성·테스트성 저하.
- apps/frontend/components/equipment/EquipmentForm.tsx (1414 lines)
- apps/frontend/components/inspections/InspectionFormDialog.tsx (1362 lines)
- apps/frontend/components/non-conformances/NCDetailClient.tsx (1103 lines)

작업 (각 컴포넌트별 별도 PR로 분할 권장):
1. EquipmentForm.tsx → 섹션별 sub-component 추출:
   - BasicInfoSection / CalibrationSection / DepreciationSection / DocumentsSection
   - 각 section은 독립 props 인터페이스, parent는 form orchestrator
2. InspectionFormDialog.tsx → dialog/form 분리:
   - InspectionFormDialog (wrapper) + InspectionForm (실제 form 로직)
   - SoftFork/Gallery 핸들러는 별도 hook (use-inspection-fork.ts)
3. NCDetailClient.tsx → 상세 섹션 분리:
   - NCDocumentsSection / NCApprovalFlowSection / NCActionPanel

검증:
- pnpm tsc --noEmit exit 0
- 각 컴포넌트 ≤ 700 lines (목표)
- 기존 RTL/e2e spec 회귀 0건
- React.memo 적용 가능 sub-component는 적용
- 사용자 결정: 3개 동시 vs 1개씩 sprint 분할 (권장: 1개씩)

⚠️ Mode 2 작업. 사용자 우선순위 결정 필요.
```

### 🟢 LOW — use-inspection-template.ts TODO 코멘트 정리 (Mode 0)

```
배경: use-inspection-template.ts:75 "Phase 1B-E TODO" 코멘트가 stale.
1B-D 시점 "호출자 0건" 가정으로 작성됐으나, 현재 InspectionFormDialog.tsx:198·716에서
실제로 useUpsertTemplate.mutate() 호출 중 (CAS handler까지 구현됨).

위치:
- apps/frontend/hooks/use-inspection-template.ts:75-79

작업 옵션 (사용자 결정):
A. TODO 제거 + 현재 구조(호출자가 직접 fetch-before-mutate) 정착으로 코멘트 update
B. 정말로 useCasGuardedMutation으로 wrap 진행 (memory: useCasGuardedMutation SSOT)
   → 호출자(InspectionFormDialog)의 latestTemplate.version+1 로직을 hook으로 흡수

권장: 옵션 A — useCasGuardedMutation 패턴이 다른 도메인(checkouts/calibration-plans)에서
이미 안정화됐고, template 영역은 SoftForkDialog 흐름 통합 후에도 호출자가 명시적 version 결정해야
하는 도메인 특성 (inline diff 계산 후 mutate). hook wrap의 추가 가치 낮음.

검증:
- TODO 제거 후 grep "Phase 1B-E TODO" → 0건
- 코멘트가 실제 코드 흐름과 일치
```

### ✅ 완료 (2026-05-05) — Backend Query DTO trim/max 정책 신설 (Mode 1 or 2)

> **결과**: 옵션 A (전면 적용) — 13 도메인 sort enum SSOT + optionalTrimmedString helper + verify-zod Step 20 + 12 spec/185 cases. PASS. 상세 메모리: `project_query_dto_validation_ssot_20260505.md`. archive-domain.md 후속 등재 권장.

<details>
<summary>원본 프롬프트 (이력 보존)</summary>


```
배경 (정책 결정): Backend Query DTO 11건의 search/sort/manufacturer 등 optional string 필드에
.trim()/.max() 미적용. verify-zod Step 12는 `.min(N)` required 필드만 .trim() 강제.
c82ae0ef 커밋(zod-trim-max sprint)도 Create/Update DTO만 처리하고 Query DTO 명시적 제외.

위치 (11 DTO):
- apps/backend/src/modules/test-software/dto/test-software-query.dto.ts:20,21,26 (search, manufacturer, sort)
- apps/backend/src/modules/calibration/dto/calibration-query.dto.ts:34,35,36,42,47 (statuses, methods, calibrationAgency, search, sort)
- apps/backend/src/modules/checkouts/dto/checkout-query.dto.ts:33,34-38,39,40 (statuses, destination, checkout/return From/To, search, sort)
- apps/backend/src/modules/non-conformances/dto/non-conformance-query.dto.ts:40,41 (search, sort)
- apps/backend/src/modules/notifications/dto/notification-query.dto.ts:42,50,58 (recipientSite, search, sort)
- apps/backend/src/modules/calibration-factors/dto/calibration-factor-query.dto.ts:35,40 (search, sort)
- apps/backend/src/modules/teams/dto/team-query.dto.ts:21,24 (search, sort)
- apps/backend/src/modules/users/dto/user-query.dto.ts:21,22 (search, sort)
- apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts:24 (search)
- apps/backend/src/modules/cables/dto/cable-query.dto.ts:7,11 (search, sort)
- apps/backend/src/modules/software-validations/dto/validation-query.dto.ts:19 (sort)

리스크:
- search/manufacturer 자유 텍스트 → DoS 페이로드(50KB+ 단일 query) 가능
- sort 필드 → injection 표면 (서비스 레이어 enum 검증 안 하면 SQL 오류·정보 노출)

옵션 결정:
A. 정책 신설: 모든 Query DTO optional 자유 텍스트에 .trim().max(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH) 강제
   → verify-zod 신규 Step + 11 DTO 수정 + spec 추가 (Mode 2)
B. sort 필드만 enum 검증 (가장 위험한 표면): 11 DTO sort → z.enum([...]) 또는 별도 sortable-fields SSOT
   → 도메인별 enum 정의 + 서비스 검증 (Mode 1)
C. 현 상태 유지 (서비스 레이어에서 sort field whitelist 가정 — 검증 필요)

권장: 옵션 B (sort injection이 더 큰 위험·작업량 작음). 옵션 A는 후속 sprint.
사용자 결정 후 진행.

⚠️ Mode 1 or 2. 정책 결정 사용자 위임.
```

</details>

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
