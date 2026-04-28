# 다음 세션 핸드오프 — Click-Feedback 5-Layer 아키텍처 (Phase 3 part 2 ~ Phase 5)

> 본 세션 종료: 2026-04-29
> 본 세션 commit: 5건 (click-feedback Phase 0/0.5/1/2/3-part-1)
> 잔여: Phase 3 part 2 + Phase 4 (9 sub-phases) + Phase 5 (검증·관측성·문서)
> Plan 파일: `/home/kmjkds/.claude/plans/dynamic-squishing-pnueli.md` (672줄, rev-2 시니어급)

---

## 본 세션 시작 멘트 (사용자 복붙용)

> Click-feedback 5-Layer 아키텍처 잔여 작업을 계속 진행해줘. 본 세션 핸드오프 노트는
> `.claude/evaluations/next-session-handoff-2026-04-29-click-feedback.md` 에 있고,
> 플랜은 `/home/kmjkds/.claude/plans/dynamic-squishing-pnueli.md` 에 있다.
> Phase 3 part 2(39개 loading.tsx 점진 마이그레이션 + PPR 분리 4라우트) → Phase 4(L4·L4ext 9 sub-phases) → Phase 5(검증/관측성/문서/스킬) 순서로 단편적이지 않게 시니어 표준으로 진행해줘.

---

## 본 세션 완료 — 5 commits (BC 100%, 모두 main 직접)

| # | Commit | Phase | 산출물 핵심 |
|---|---|---|---|
| 1 | `475e4a50` | **Phase 0 Foundation** | `feedback-pending.ts` 토큰 SSOT (visual-feedback와 scope 분리), `FEEDBACK_KEYS` i18n SSOT, `messages/{ko,en}/feedback.json` + namespace 등록, `Spinner` 컴포넌트 (SVG inline, Loader2 의존성 제거 base), `Button` `loading`/`loadingLabel`/`loadingPosition`/`spinnerSize`/`pendingDelayMs` props (BC 100%), `Skeleton` 부품집(Text/Card/TableRow/Hero/Form), `progress-pulse` keyframe |
| 2 | `f9ee310d` | **Phase 1 L3 Global Transition** | `useNavigationPending` Context+counter, `useNavigateWithPending` (router.push wrapper + useTransition + 1.5s 안전망), `GlobalProgressBar` (motion-safe / motion-reduce), `RouteLoading` SSOT (variant: list/detail/form/dashboard/scan, async server component + getTranslations), `app/layout.tsx` 마운트 |
| 3 | `e33bc66e` | **Phase 2 L1 Per-Link** | `NavLink` SSOT (next/link useLinkStatus wrapper), `PendingIndicator` (dot/border/opacity variant), 사이드바·모바일 드로어·브레드크럼 모두 NavLink로 교체 |
| 4 | `47393ed6` | **Phase 0.5 L0 Connection** | `useSwUpdate` (SW updatefound + statechange + skipWaiting), `ConnectionBanner` (offline assertive + SW update polite + Reload action), `app/layout.tsx` 마운트 |
| 5 | `0b93503e` | **Phase 3 part 1** | 누락 `scan/loading.tsx` 보충, 기존 `ListPageSkeleton`/`TablePageSkeleton`/`RouteLoading` 모두 async server component + role=status + aria-busy + sr-only i18n key — 11개 호출 페이지 자동 a11y 충족 |

### 사용자 즉시 체감 가능한 변화 (이미 main 적용)

- 사이드바 메뉴 클릭 → 텍스트 우측 4px dot (motion-safe pulse / motion-reduce 정적)
- 모바일 드로어 항목 탭 → 좌측 2px border-l 강조
- 브레드크럼 클릭 → opacity 0.7 fade
- 어떤 라우트 전환이든 → 화면 최상단 fixed 2px progressbar 200ms minimum visible
- offline 상태 → fixed top banner (assertive announce)
- SW 새 버전 → fixed top banner (polite + Reload 버튼)
- 모든 페이지 loading.tsx → role=status + aria-busy + sr-only feedback.loadingList 등 i18n

---

## 잔여 작업 — Phase 3 part 2 + Phase 4 + Phase 5

### Phase 3 part 2 (1~2일)

**점진 마이그레이션** (39개 loading.tsx → RouteLoading SSOT 흡수, 또는 ListPageSkeleton 그대로 유지하고 a11y만 보존):

- 도메인별 1 PR 단위로 5~10개씩
- 마이그레이션 우선순위: equipment·checkouts·non-conformances·calibration·calibration-plans (자주 들어가는 페이지부터)
- ListPageSkeleton 유지하면서 a11y 강제 (이미 part 1에서 완료) — 사실상 추가 작업 X
- **PPR 분리 라우트 4개**: `equipment/page.tsx`, `equipment/[id]/page.tsx`, `intermediate-inspections/page.tsx`(존재 시), `self-inspections/page.tsx`(존재 시) — sync Page + `*Async.tsx` 분리
- `scripts/generate-loading.ts` (loading.tsx 누락 검출 generator)

### Phase 4 — L4·L4ext (5~7일, 9 sub-phases)

- **4a**: `scripts/codemods/button-loading.ts` (ts-morph) — 50+ 호출자 자동 변환
  - `<Button disabled={isPending}>` → `<Button loading={isPending}>`
  - `<Loader2/>` children 제거
  - 모호 패턴은 `// TODO(button-loading-migration)` 주석
- **4b**: `hooks/use-debounced-search.ts` (use-debounced-value 활용) + SearchInput pending prop
- **4c**: `hooks/use-form-action.ts` (useActionState wrapper + sonner + i18n) + 폼 점진 마이그레이션
- **4d**: i18n 토스트 sweep — `grep -rEn "toast\.(success|error)\(['\"][^'\"]*[가-힣]"` 0이 될 때까지
- **4e**: `use-optimistic-mutation`/`use-cas-guarded-mutation` 409 UX (`feedback.staleConflict` + retry 액션 토스트)
- **4f**: Dialog/AlertDialog/Sheet/Drawer trigger lazy Suspense
- **4g**: Tab/Accordion `useTransition` 래핑 + lazy 콘텐츠 Suspense
- **4h**: File upload `<Progress>` (Radix) + Export(PDF/Excel) 트리거 toast + Bulk action progress banner
- **4i**: Auto-save 4-state SSOT (`use-auto-save.ts` + `auto-save-status.tsx`)

### Phase 5 — 검증·관측성·문서·스킬 (2일)

- `.claude/skills/verify-click-feedback/SKILL.md` 신규 — 10 step (Button disabled+pending 패턴 0, Loader2 children 0, raw Link allowlist, loading.tsx 누락 0, role=status+aria-busy 보유, raw 한글 토스트 0, RouteLoading 외 fallback marker, feedback.* ko/en parity, design token 우회 0, dark: prefix 0)
- `.claude/skills/verify-frontend-state/SKILL.md` UPDATE — Button migration step 흡수
- `.claude/skills/dev-doctor/` UPDATE — page.tsx 형제 loading.tsx 누락 검출 + PPR dynamic API 분리 검증
- **Web Vitals SLO**:
  - `app/layout.tsx`에 `useReportWebVitals` (next/web-vitals)
  - `use-navigation-pending` 내부에서 `performance.measure('nav-pending')`
  - backend `monitoring` 모듈에 `/api/metrics/web-vitals` + `/api/metrics/nav-pending` endpoint
  - Drizzle 신규 테이블 `web_vitals_logs(metric, value, route, user_id, created_at)`
  - dashboard 모듈에 SLO 카드 (admin 전용)
- **문서**:
  - `docs/architecture/click-feedback.md`
  - `docs/architecture/navigation-feedback.md` (router.push 래핑 룰)
  - `docs/architecture/skeleton-cls-rulebook.md`
  - `docs/architecture/click-feedback-slo.md`
- **Storybook stories**: Button loading variants, Spinner sizes, RouteLoading variants, GlobalProgressBar

---

## Critical Files (다음 세션이 가장 먼저 알아야 할 SSOT 5개)

1. **`apps/frontend/lib/i18n/feedback-keys.ts`** — `FEEDBACK_KEYS` 상수 (호출자 raw 키 입력 금지)
2. **`apps/frontend/lib/design-tokens/feedback-pending.ts`** — `PENDING_DIMENSIONS`/`SPINNER_SIZES`/`PENDING_COLORS`/`PENDING_Z_INDEX`/`PENDING_ANIMATIONS` (visual-feedback.ts와 scope 분리)
3. **`apps/frontend/components/ui/button.tsx`** — `loading`/`loadingLabel`/`loadingPosition`/`spinnerSize`/`pendingDelayMs` (BC 100%)
4. **`apps/frontend/hooks/use-navigation-pending.tsx`** — Context + counter 기반 글로벌 pending 카운터
5. **`apps/frontend/components/loading/route-loading.tsx`** — variant SSOT (async server component)

추가:
- `apps/frontend/components/navigation/nav-link.tsx` — `next/link` + `useLinkStatus` wrapper
- `apps/frontend/components/layout/global-progress-bar.tsx` — L3 fixed top bar
- `apps/frontend/components/layout/connection-banner.tsx` — L0 시스템 신호

---

## 본 세션 검증된 의존성 (실측 명령 결과)

```
Next.js 16.2.3                                    ✅
next-intl 4.9.1 (path-less locale + proxy.ts)     ✅
React 19.2.4 (useActionState 사용 가능)            ✅
useLinkStatus from 'next/link': () => { pending: boolean }  ✅
sonner 4.x — toast.success/error/action 사용 가능   ✅
@radix-ui/react-progress 1.1.8 (Phase 4h용)        ✅
```

---

## 본 세션 시니어 자기검토 결과 (7대 영역)

| # | 영역 | 본 세션 | 잔여 |
|---|---|---|---|
| 1 | **L0 Connection** | ✅ Phase 0.5 (offline + SW update banner) | SSE/토큰 만료 hook은 notifications 모듈 연동 필요 — Phase 4 후속 |
| 2 | **L4ext UI Affordance 9가지** | ❌ | Phase 4f~4i (Dialog/Sheet/Tab/Upload/Export/Bulk/Auto-save) |
| 3 | **관측성 / Web Vitals SLO** | ❌ | Phase 5 (Web Vitals + nav-pending metric + monitoring backend + dashboard 카드) |
| 4 | **테스트 매트릭스** | ❌ | Phase 5 (unit/integration/visual/a11y 4-axis) |
| 5 | **CAS / 캐시 영향** | ⚠️ I12 명시 + Button BC 100% 보장 | use-optimistic-mutation 409 retry UX는 Phase 4e |
| 6 | **의존성 검증 명령** | ✅ 위 §검증된 의존성 | — |
| 7 | **WCAG SC + Pre-commit audit** | ✅ 모든 commit message에 7대 audit 명시, WCAG 4.1.3/1.3.1/4.1.2/1.4.13/2.3.3 매핑 | — |

---

## 본 세션 미해결 위험 / 주의사항

1. **사전 존재 tsc 에러**: `app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx:202` — 다른 세션 작업의 영향. 내 click-feedback 작업과 무관하지만 push 시 pre-push hook 막힐 수 있음. push 결정 전 별도 세션에서 해결 필요.
2. **64 dirty files**: 본 세션 시작 시점 이미 다른 세션 작업이 working tree에 있음 — backend/checkouts/software-validations 등. 내 click-feedback 작업과 분리됨. 메모리 룰 [lint-staged 다른 세션 파일 revert 금지] 준수.
3. **ahead 3 commits**: 마지막 3 click-feedback commit (47393ed6, e33bc66e ... 또는 그 이후 세트)이 origin/main 미반영. push는 사용자 결정 시 수행 — pre-push hook이 게이트.
4. **Phase 4a Button codemod**: 50+ 호출자 일괄 변환 — 시니어 표준상 `feat/click-feedback-phase-4a` 브랜치 + dry-run + e2e visual snapshot 필수. main 직접 작업 금지.

---

## 다음 세션 첫 액션 권장 순서

1. `git pull` (origin/main 동기화) + `git status` 확인 (다른 세션 작업 분리)
2. Plan 파일 (`/home/kmjkds/.claude/plans/dynamic-squishing-pnueli.md`) 머리부터 끝까지 1회 통독
3. Phase 3 part 2 — 마이그레이션 우선순위 페이지 5개부터 (equipment/checkouts/non-conformances/calibration/calibration-plans)
4. Phase 4a — `scripts/codemods/button-loading.ts` 작성 → `feat/click-feedback-phase-4a` 브랜치 + dry-run PR
5. Phase 4d — i18n 토스트 sweep (가장 단순한 sub-phase, 워밍업 좋음)
6. Phase 4b/c/e — hooks 신규 + 점진 마이그레이션
7. Phase 4f/g/h/i — UI Affordance (Dialog/Sheet/Tab/Upload/Export/Bulk/Auto-save)
8. Phase 5 — verify-click-feedback 스킬 + Web Vitals SLO + 문서

---

## 컨텍스트 보존 (메모리)

본 세션 동안 새로 저장한 메모리:
- `feedback_exit_plan_senior_audit_checklist.md` — ExitPlanMode 직전 시니어 자기검토 7대 영역

기존 메모리 활용:
- `feedback_main_only_no_branches.md` — main 직접 작업 (위험 작업만 브랜치)
- `feedback_session_wrapup_autocommit.md` — 세션 정리 시 자동 커밋
- `feedback_lintstaged_other_session_files.md` — 다른 세션 파일 staged 금지
- `feedback_evaluator_pass_senior_self_audit.md` — Evaluator 통과 ≠ 시니어 표준
- `feedback_comprehensive_architectural_plan.md` — AP 전체 + 전 영역 명시 (400+ 줄)
