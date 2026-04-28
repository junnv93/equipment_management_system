# 다음 세션 핸드오프 — 2026-04-28 i18n-parity-hardening 완료

## 본 세션 요약

**Commit:** `9e2ec057` (main, 30 files, +1939/-78)

**Verdict:** PASS (no compromise) — 11/11 MUST + 6/6 SHOULD, 0 deferral

### 본질적 성과

| 영역 | 결과 |
|------|------|
| 회귀 청소 | 호출지 67건 → 0건. NC 페이지 38건 + 산재 9건 + qr 1건 ko/en 동시 복원 |
| 검증 인프라 | `scripts/check-i18n-call-sites.mjs` 신규 (호출지 ↔ JSON parity + common.json 구조 이중 검증, 0.23s) |
| 회귀 차단 게이트 | 5중 (TS required prop / 정적 검증 / 구조 검증 / pre-push hook / e2e smoke) |
| 정책 SSOT | frontend-patterns.md 3섹션 + verify-i18n Step 16 + manage-skills 갱신 |
| Dead code 정리 | `lib/i18n/client.ts` 삭제 (orphan 단수형 wrapper, 0 callers, 미래 silent-swallow vector 제거) |
| 시니어 검증 | verify-implementation 4 스킬 PASS / review-architecture 10 영역 (Critical 0, Warning 2 → tech-debt) |

### 회귀의 5중 차단 메커니즘

| 게이트 | 차단 클래스 |
|-------|------------|
| (1) TS required `loadingLabel: string` | atom 호출자 누락 → 컴파일 실패 |
| (2) `check-i18n-call-sites.mjs` 정적 | 호출지 키 ↔ messages JSON parity |
| (3) common.json 구조 검증 | flat top-level key 추가 시도 → 빌드 실패 |
| (4) `.husky/pre-push --all` + pre-commit `--changed` | push 직전 자동 차단 |
| (5) `tests/e2e/features/i18n/no-missing-message.spec.ts` | 런타임 라우트 단위 console MISSING_MESSAGE 0건 |

---

## 다음 세션 트리거 가능 작업 (우선순위순)

### A. 🔴 IMMEDIATE — 본 세션 외 발견된 즉시 처리 사항

**A1. CreateCheckoutContent.tsx tsc 에러 2건** — pre-existing dirty
- 다른 세션(commit `eec968ca refactor(design): 목록/상세 페이지 너비 아키텍처 통일`) in-progress 작업
- `apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx:462,699`
- `CheckoutPurpose | null` → 타입 처리 미완료
- **해당 세션 재개 시 처리 필요. 본 세션 commit은 영향 없음**

**A2. deps-supply-chain follow-up 8건** (다른 세션 작업)
- tech-debt-tracker.md `2026-04-30 deps-supply-chain` 섹션
- A3 (CI supply-chain gate), A1 (mock helpers), A5 (identifier-policy docs), A6 (ESLint no-restricted-imports), A4 (dependabot.yml policy) 등

### B. 🟡 MEDIUM — i18n parity 후속 (본 세션 영역)

**B1. cross-cutting ns structural check 정책 결정** (tech-debt: `cross-cutting-ns-structural-check`)
- `navigation.json` (60+ flat key 추정), `notifications.json` (3 flat key), `errors.json`, `auth.json`은 `check-i18n-call-sites.mjs` structural check 대상 외
- 옵션 (a): common.json만 sub-namespace 강제, 다른 cross-cutting은 flat 허용 (현 묵시 정책) 명문화
- 옵션 (b): 모든 cross-cutting ns에 동일 정책 확장 (broader 회귀 방지)
- 트리거: 다른 cross-cutting ns 회귀 발생 시 또는 i18n 정책 통일 sprint

**B2. 다른 세션 dirty 파일 정리**
- `apps/frontend/messages/{ko,en}/checkouts.json` — 다른 세션 변경. 본 세션 commit 후에도 modified 상태
- `apps/frontend/eslint.config.mjs`, design-tokens 등 — 다른 세션의 in-progress

### C. 🟢 LOW — 본 세션 후속

**C1. frontend-patterns.md 예외 텍스트 정밀화** (tech-debt: `frontend-patterns-shared-exception-text-precision`)
- `frontend-patterns.md:228` "shared에 있을 때는 props으로 끌어올리는 것이 일관적"이 실제 정책(직접 호출 허용 예외)과 텍스트 모순
- 정책 결정 필요: "허용하되 가능하면 이동" vs "이동 권장"

**C2. i18n.ts namespaces 주석 lag** (tech-debt: `i18n-namespaces-array-comment-lag`)
- 주석이 namespaces 배열 실측과 lag — 다음 i18n 변경 시 자연 처리

---

## 본 세션 산출물 위치

| 파일 | 경로 |
|------|------|
| Plan | `.claude/exec-plans/completed/2026-04-28-i18n-parity-hardening.md` |
| Contract | `.claude/contracts/i18n-parity-hardening.md` (M10/S2/S3 정밀화) |
| Evaluation | `.claude/evaluations/i18n-parity-hardening.md` (3 iter history) |
| Verify report | `.claude/evaluations/i18n-parity-hardening-verify.md` (4 스킬 PASS) |
| Review report | `.claude/evaluations/i18n-parity-hardening-review.md` (Critical 0, Warning 2) |
| Validator | `scripts/check-i18n-call-sites.mjs` (호출지 + 구조 이중 검증) |
| E2E spec | `apps/frontend/tests/e2e/features/i18n/no-missing-message.spec.ts` |
| Hooks | `.husky/{pre-push,pre-commit}` (i18n 게이트 추가) |
| Policy SSOT | `docs/references/frontend-patterns.md` (3섹션 추가, atom-owned sub-namespace 정밀화) |
| Skill SSOT | `.claude/skills/verify-i18n/SKILL.md` Step 16, `.claude/skills/manage-skills/SKILL.md` 테이블 |
| Removed | `apps/frontend/lib/i18n/client.ts` (orphan wrapper) |

---

## 주의사항 (다음 세션 작업 시)

### Pre-existing dirty 25 파일
본 세션 commit 후에도 다음 파일은 modified로 남음 — 다른 세션의 in-progress 작업:
- `apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx` (CheckoutPurpose nullable 미처리, tsc 에러 2)
- `apps/frontend/components/equipment/EquipmentFilters.tsx`
- `apps/frontend/hooks/useEquipmentFilters.ts`
- `apps/frontend/messages/{ko,en}/checkouts.json` (부분 변경)
- `apps/frontend/components/layout/{DashboardShell,MobileNav,NavBadge}.tsx`
- `apps/frontend/lib/design-tokens/{components/sidebar,index}.ts`
- `apps/frontend/lib/navigation/nav-config.ts`
- `apps/frontend/eslint.config.mjs`
- `apps/frontend/components/ui/calendar.tsx`
- `apps/backend/src/modules/non-conformances/non-conformances.controller.ts`
- `packages/shared-constants/src/{checkout-selectability,index}.ts`
- `apps/frontend/next-env.d.ts` (autogen)

신규 untracked:
- `.claude/contracts/sidebar-nav-action-pattern.md`
- `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx`
- `apps/frontend/tests/e2e/features/layout/`
- `.claude/exec-plans/active/` (다른 세션 plan)

→ **다음 세션은 이들이 어느 세션 작업인지 식별 후 진행. 본 세션 i18n 영역과 무관**

### 본 세션 후 commit hook이 reformat한 파일
일부 파일이 prettier hooks에 의해 commit 후 다시 modified 상태 — 다음 commit으로 정리 필요:
- `apps/frontend/components/equipment/{CalibrationFactorsClient,CheckoutHistoryTab,NonConformanceBanner,RepairHistoryClient,StatusLocationSection}.tsx`
- `apps/frontend/components/equipment-imports/ReceiveEquipmentImportForm.tsx`
- `apps/frontend/components/teams/TeamEquipmentList.tsx`

→ 다음 세션 시작 시 `git diff`로 이 파일들의 변경이 본 세션 commit 누락분인지 / 다른 세션 변경인지 / pure prettier 포맷인지 판단 후 처리

### push 권장
본 세션 commit은 main 직접 작업으로 commit만 완료 (push는 별도). 다음 push 시 pre-push hook이 자동 실행:
- tsc → 본 세션 파일 0 errors. CreateCheckoutContent.tsx 2 errors가 push 차단할 수 있음 → 그 세션 작업 완료 후 push

---

## 트리거 멘트 예시 (다음 세션 시작 시)

```
세션 시작. 본 세션 핸드오프 확인 후 작업 우선순위 정해줘:
.claude/evaluations/next-session-handoff-2026-04-28-i18n-parity-complete.md

특히 (1) pre-existing dirty 25 파일을 어느 세션 작업인지 분류 (2) CreateCheckoutContent.tsx tsc 에러 2건 처리 (3) tech-debt-tracker.md에서 가장 ROI 높은 항목 식별
```

또는 본 세션 영역 후속:

```
i18n-parity-hardening 후속 진행. cross-cutting ns structural check 정책 결정 필요 — common.json 외 navigation/notifications/errors/auth ns의 root level 정책. tech-debt-tracker에서 cross-cutting-ns-structural-check 항목 참조.
```
