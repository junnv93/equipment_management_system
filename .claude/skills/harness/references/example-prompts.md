# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-05-10** — sticky-header-css-var-ssot 완료(34차 후속 → archive-infra.md). approval-row-memo-i18n-ci-cache 3건(ApprovalRow memo·dep-audit cache·HeroKPI i18n) archive 이동 완료 → 해당 항목 제거. verify-route-metadata Phase3 승격 완료, Checkouts V3 Sprint 1(Authority 4종) + Sprint 3(Perf&Cache 3종) 전부 completed/ 이동 → 해당 항목 제거.
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.
> **v2 설계 SSOT**: `.claude/plans/zany-swimming-feigenbaum.md` (Section 0 UX Philosophy + 시각 재구성 A~T + 신규 흡수 P~T)

---

## 🟡 다음 세션 — sub-route e2e 커버리지

> **ADR-0009 Option C 채택 완료 (2026-05-09)**: Tab vs Sub-route 혼합 패턴 + URL SSOT 명시. `verify-route-metadata` Phase3 승격 완료(pre-push hook 통합 + spec).

### 🟢 LOW (Mode 1) — `sub-route-navigation-e2e-coverage`

**상태**: sub-route(`/equipment/[id]/calibration-history`)에 Playwright e2e spec 0건. RTL spec(jsdom)이 chip/dialog 회귀 보호하지만 *URL deep-link → server prefetch → Client → Tab 통합* 전체 flow 미검증. ADR-0009 Option C 채택 기준: sub-route 직접 spec + Tab 연동 redirect spec 양쪽 필요.

---

## 🆕 88차 (2026-04-24) — Checkouts V3 통합 로드맵 (5-Sprint)

> **플랜 본문**: `.claude/exec-plans/active/2026-04-24-checkouts-v3-roadmap.md` (44.8KB · 637줄)
> **메모리**: `project_88_checkouts_v3_roadmap_20260424.md`
> **배경**: 외부 아키텍처 리뷰 V2(18 findings) 전수 대응. 사용자 결정: 5-Sprint 전체·BFF 포함·Phase-based '1/3 phase'·편의성 U-01~U-12 전량.

### 🔶 다음 세션 작업 — Sprint 4·5 Contract 작성 (미착수)

> Sprint 1 (Authority 4종) + Sprint 3 (Perf&Cache 3종) 전부 **completed/** 이동 완료 (2026-05-10).
- **Sprint 4 (UX Flow)** — 15개 내외 contract 예상:
  - 4.1 NextStepPanel 단일 렌더(compact+hero+actor variant)
  - 4.2 Row 3-zone grid (`grid-cols-[3px_72px_1fr_auto]`)
  - 4.3 상세 D-day 배지 (C-3)
  - 4.4 Rental Phase-based UI (`CheckoutPhaseIndicator` 신규 + WorkflowTimeline 접힘)
  - 4.5.1 ~ 4.5.12 편의성 **U-01 ~ U-12 전체 12건**
- **Sprint 5 (Visual Polish)** — 5~7개 contract:
  - 5.1 Empty state 3색 / 5.2 Typography 6단계 / 5.3 Color semantic 5축 / 5.4 Density & rhythm / 5.5 Icon & motion

### 실행 순서 (Sprint 1~3 완료 기준)
~~Sprint 1~3 완료~~ → Sprint 4 Contract 작성(4.1~4.5.12) → Sprint 5 Contract 작성(5.1~5.5) → 각 contract harness 루프 순차 구현. FE analytics instrumentation은 §10 metrics 수집 기반으로 선행.

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


<!-- 34차 후속 (sticky-header CSS 변수명 SSOT) — 2026-05-10 sprint `sticky-header-css-var-ssot` 로 closure.
     archive: archive-infra.md 참조 (CSS_VAR_NAMES SSOT + cssVar() helper + verify-hardcoding Step 36 + globals.css :root fallback). -->
