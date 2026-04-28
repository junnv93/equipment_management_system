# 다음 세션 핸드오프 (2026-04-30 예정) — Dashboard LOW Residual + UL Logo Footer 후속

## 본 세션(2026-04-28 dashboard-low-residual + ul-logo) 종합 결과

### 컨텍스트

이전 세션(2026-04-28 dashboard-redesign)에서 deferred된 LOW SHOULD 4건 + 명세서 §A.3.1 위반 1건을 본 세션에서 처리. 그 후 사용자 요청으로 사이드바 footer "EQ 빨간 박스" → 회사 UL 로고 SVG 적용. verify-implementation 발견 P1×2 + P2×1까지 즉시 fix.

### 완료된 작업 (4 phase, 5 commits)

**Phase A: utilization-state SSOT drift fix**
- `0edf8522` test(dashboard): utilization-state 임계값 SSOT 추종
- 본 세션 commit `6ddff791b`이 SSOT 70→60 변경했으나 테스트는 hardcoded 70 유지 → frontend test 6 fail
- Fix: 테스트가 `UTILIZATION_THRESHOLDS` import해서 `HIGH/MEDIUM/HYSTERESIS` 동적 boundary 계산 (미래 SSOT 변경 자동 추종)

**Phase B: LOW residual cleanup**
- `23bb5570` chore(dashboard): low residual cleanup
- LOW #5 dashboard.service.spec — `getSystemHealth` 단위 테스트 8 케이스 (storagePct, overallStatus 분기, 매핑)
- LOW #6 dashboard-api — `DashboardCheckoutScope` deprecated alias 제거 (외부 소비처 0건 grep 후)
- LOW #7 eslint.config — DDAY_TONE_RULE 주석 정확도 보강
- §A.3.1 MiniCalendar — hardcoded "1" 제거 → `bg-brand-neutral` 도트 + `holidayMap.size` 동적 카운트

**Phase C: 사이드바 footer UL 로고 (사용자 요청)**
- `27f6fad9` feat(layout): 사이드바 brand mark — wrench 아이콘 → ul 회사 로고 svg 교체
  (이후 사용자 의견 변경으로 brand mark는 Wrench 원복)
- `f34c6d92` fix(layout): 사이드바 footer ul 로고 크기 확대 + eslint config 정합
- 사이드바 footer "EQ 빨간 박스" → UL Solutions 회사 SVG 로고 (h-10, ariaHidden)
- `lib/brand-assets/ul-logo.tsx` 신설 — public/images/ul-logo.svg 단순 `<img>` 래퍼 (path 임의 수정 0)
- ESLint config: `lib/brand-assets/**`에 `@next/next/no-img-element: 'off'` 룰 추가

**Phase D: verify-implementation P1/P2 fix**
- `9b9fe944` fix(dashboard): minicalendar 공휴일 카운트 + ullogo aria-hidden
- P1-1 MiniCalendar 도트 색상 — `bg-brand-neutral` → `bg-brand-critical` (cell number 색상과 시각 일관성)
- P1-2 MiniCalendar 카운트 — `holidayMap.size`(연도 16개) → `currentMonthHolidayCount` (월 단위 prefix 필터)
- P2-1 UlLogo — footer 두 곳 `ariaHidden=true` (시스템명 텍스트가 SR 가이드 중복 회피)

### 검증 결과 요약

| 영역 | 결과 |
|------|------|
| `pnpm tsc --noEmit` | ✅ exit 0 (모든 변경 후) |
| `pnpm --filter frontend test` | ✅ 256/256 PASS (utilization-state 19/19) |
| `pnpm --filter backend test -- dashboard.service.spec` | ✅ 23/23 PASS (15 + 신규 8) |
| Playwright dashboard-screenshots | ✅ 5 roles × ~10 PNG + 5 axe scan PASS (52 PNG, 2.5분) |
| pre-push hook 게이트 | ✅ 모든 push 통과 (env-sync, tsc, backend test, frontend test) |
| 본 세션 push | ✅ 5 commits 모두 origin/main 동기 (0/0) |

### 본 세션 변경 파일 (코드 7개 + 문서 5개)

**코드:**
1. `apps/frontend/lib/utils/__tests__/utilization-state.test.ts` (SSOT 추종)
2. `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts` (getSystemHealth 8 케이스)
3. `apps/frontend/components/dashboard/MiniCalendar.tsx` (§A.3.1 fix + P1 fix)
4. `apps/frontend/eslint.config.mjs` (DDAY 주석 + brand-assets img off)
5. `apps/frontend/lib/api/dashboard-api.ts` (alias 제거)
6. `apps/frontend/lib/brand-assets/ul-logo.tsx` (신규)
7. `apps/frontend/components/layout/DashboardShell.tsx` (footer 로고 + Wrench revert)

**문서:**
- `.claude/contracts/dashboard-low-residual-2026-04-29.md`
- `.claude/evaluations/dashboard-low-residual-2026-04-29.md`
- `.claude/evaluations/session-final-verify-implementation-2026-04-28.md`
- `.claude/evaluations/session-final-manage-skills-2026-04-28.md`
- `.claude/exec-plans/tech-debt-tracker.md` (5 항목 추가)

---

## 다음 세션 시작 시 체크리스트

```bash
# 1. PC 동기화
git fetch origin
git status  # 본 세션 commits push 후 origin과 동기 확인

# 2. DB 리셋 (PC 이동 후 메모리 룰)
pnpm --filter backend run db:reset

# 3. 개발 서버
pnpm dev

# 4. 평가 리포트 확인
ls -la .claude/evaluations/session-final-*-2026-04-28.md
ls -la .claude/evaluations/dashboard-low-residual-2026-04-29.md
```

---

## 다음 세션 작업 후보

### 🟡 P2 (MEDIUM — 회귀 자동 방지 가치)

1. **verify-ssot Step 40 신규 — 테스트 파일 hardcoded threshold vs SSOT import**
   - 근거: 본 세션 1차 push fail (utilization SSOT drift) 실측 사례
   - 파일: `apps/frontend/**/__tests__/**`, `apps/backend/**/__tests__/**`
   - 패턴: 테스트가 `toBe(N)`/`toEqual(N)` 매직넘버 사용 시 SSOT 토큰 import 부재 탐지
   - 효과: SSOT 변경 시 테스트 자동 추종, drift 자동 차단

### 🟢 P3 (LOW — 다음 cleanup sprint)

2. **verify-ssot Step 41 신규 — @deprecated export alias 외부 소비처 0건 정리**
   - 근거: `DashboardCheckoutScope` 즉시 제거 사례
   - 파일: `apps/frontend/lib/api/**`, `apps/backend/src/**/dto/**`, `packages/**`
   - 패턴: `@deprecated` 주석 + `export type` alias grep → 외부 소비처 grep 0건이면 제거 권고

### 🟢 LOW (인프라/외부 의존 — 본 세션 OOS)

3. **standalone-html 1:1 픽셀 매칭** — 사용자 제공 외부 명세서/HTML로 명세서↔코드 5/5 검증 완료. 실제 standalone HTML 픽셀 매칭은 (a) Playwright file:// 로드 + DOM 캡처 또는 (b) bundle JS unzip 분석. 트리거: 디자인 QA sprint.
4. **§3.1 EQ 마크 디자인 결정** — 사이드바 상단 brand mark는 Wrench로 원복. 자체 로고 SVG 공급 시 EQ 모노그램 또는 자체 로고로 교체.
5. **§A.3.1 typography 토큰 vs 명세** — `MICRO_TYPO.badge=text-2xs`(10px) vs 명세 12px. 디자인 시스템 typography 검토 sprint.
6. **§A.9.1 second skip link** — `<a href="#dashboard-row1">사이드바 탐색 건너뛰기</a>` 두 번째 skip link 미구현. 접근성 sprint.
7. **simulate-role-audit-log-observability** — 이전 세션 OOS, SYSTEM_ADMIN simulateRole audit_logs entry 미발행. 보안/관측 sprint.
8. **Dependabot 4 moderate** — push 시 GitHub 알림 4건. 메모리 룰 [Dependabot 알림은 lockfile 실체부터] 따라 lockfile 검증 후 패치.

### 인프라 의존 (deferred)

- BullMQ queueSize 실측 연결
- error_logs / Sentry 통합
- DASHBOARD_STORAGE_CAPACITY_BYTES 운영 환경별 capacity 설정 (배포 체크리스트)

---

## 권장 다음 세션 시작 멘트

> 이번 세션은 본 세션(2026-04-28) 후속이다. 우선순위는: (1) **verify-ssot Step 40** 신설 — 테스트 파일이 SSOT 토큰을 import해서 boundary case를 동적 계산하는 패턴 강제 (utilization-state drift 회귀 방지). (2) **verify-ssot Step 41** 신설 — `@deprecated` export alias 외부 소비처 0건 정리 룰. (3) Dependabot 4 moderate 알림 lockfile 실체 검증 + 필요 시 패치. 디자인 결정 영역(EQ 마크, typography 12px, second skip link)은 디자이너/사용자 결정 후 sprint로 처리. 시작 시 `.claude/evaluations/session-final-{verify-implementation,manage-skills}-2026-04-28.md` + `next-session-handoff-2026-04-30.md` 3개 보고서 먼저 확인.

---

## 핵심 SSOT 위치 (다음 세션 자주 참조)

- 가동률 임계값: `packages/shared-constants/src/dashboard-thresholds.ts` (`UTILIZATION_GAUGE_THRESHOLDS.ok=60, .warn=40`)
- 가동률 hysteresis: `apps/frontend/lib/config/dashboard-config.ts` (`UTILIZATION_THRESHOLDS.HIGH/MEDIUM/HYSTERESIS=2`)
- D-day 4-tier SSOT: `packages/shared-constants/src/checkout-thresholds.ts`
- Dashboard 임계값: `packages/shared-constants/src/dashboard-thresholds.ts`
- Dashboard scope: `packages/shared-constants/src/dashboard-scope.ts` (`DASHBOARD_SCOPES`, `DashboardScope`)
- Dashboard scope context: `apps/frontend/lib/utils/dashboard-scope.ts`
- ESLint config (3 신규 룰 + brand-assets img off): `apps/frontend/eslint.config.mjs`
- Brand assets: `apps/frontend/lib/brand-assets/` (microsoft-logo.tsx, ul-logo.tsx)
- 회사 로고 SVG: `apps/frontend/public/images/ul-logo.svg` (350×144 viewBox, 임의 수정 금지)
- Auth tokens: `apps/frontend/lib/design-tokens/components/auth.ts`

## 평가 리포트 (다음 세션 시 참고)

- `.claude/evaluations/session-final-verify-implementation-2026-04-28.md` — 13 verify-* 결과 (P0×0 + P1×2 + P2×1 모두 fix됨, 빌드 4/4 PASS)
- `.claude/evaluations/session-final-manage-skills-2026-04-28.md` — verify-ssot Step 40, 41 신규 권고
- `.claude/evaluations/dashboard-low-residual-2026-04-29.md` — Mode 1 contract + iteration 결과 (PASS, 2 iterations)
- `.claude/contracts/dashboard-low-residual-2026-04-29.md` — 본 세션 contract MUST/SHOULD

## 병렬 세션 drift 알림

본 세션과 동시에 다른 Claude 세션이 `checkouts-phase4-kpi-hierarchy` 작업 중. 다음 commits이 다른 세션 작업으로 main에 들어감:
- `4a788493` feat(checkouts): phase 4 KPI hierarchy
- `71fc8e27` fix(ui): button focus glow 제거
- `d1e6a513` fix(checkouts): next-step compact glow 제거

본 세션 파일은 명시적 `git add` 패턴으로 격리. 메모리 룰 [lint-staged 다른 세션 파일 revert 금지] + [병렬 세션 브랜치 드리프트] 참고. 다음 세션 시작 시 `git log --oneline d5f7bfde..HEAD`로 본 세션 5 commits + 병렬 3 commits 의도대로 들어갔는지 확인 권장.
