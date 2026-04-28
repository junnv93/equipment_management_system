# Contract — Dashboard Redesign Phase E + Residual

> **Slug**: `dashboard-redesign-phase-e-residual`
> **Plan**: `/home/kmjkds/.claude/plans/enchanted-dreaming-blum.md`
> **Mode**: Mode 2 (Full)
> **Generated**: 2026-04-28

## Scope

AP-01..AP-10 covers:
- 4-tier dday migration (deprecated 6-tier 완전 제거)
- ESLint 3 custom rules (no-hardcoded-colors / dashboard-i18n-required / no-direct-dday-tone)
- Backend ConfigService + Zod scope DTO + shared-constants `DASHBOARD_SCOPES` SSOT
- SystemHealth React Query MONITORING (5min polling)
- Design tokens (CalibrationDdayList minH 토큰화, welcome.suffix en `_suffixNote`)
- Playwright a11y + dark mode helpers + spec 보강
- manage-skills SKILL.md 4건 갱신
- Bundle baseline 갱신
- Final verification gate
- 분리 commit (10단계)

## MUST Criteria (gate fails on any miss)

### Build/Type/Test
- [ ] `pnpm tsc --noEmit` exits 0
- [ ] `pnpm --filter frontend lint` exits 0 (3 신규 룰 포함)
- [ ] `pnpm --filter backend lint` exits 0
- [ ] `pnpm --filter backend test` exits 0
- [ ] `pnpm --filter frontend test` exits 0
- [ ] `pnpm --filter frontend build` exits 0
- [ ] `pnpm --filter backend build` exits 0

### AP-01: 4-tier dday migration
- [ ] `grep -rn "getDdayTier\|getDdayBadgeClasses\|getDdayIconKey\|getDdayClasses\|DDAY_TIERS\|DDAY_TIER_CLASSES\|DDAY_TIER_ICON_KEY" apps/frontend --include='*.ts' --include='*.tsx' | grep -v "getCheckoutDday4Tier\|DDAY_4TIER"` returns 0 lines

### AP-02: ESLint rules
- [ ] `grep -n "Literal\[value=/\^#" apps/frontend/eslint.config.mjs` finds entry
- [ ] `grep -n "JSXText\[value=/\[가-힣\]/\]" apps/frontend/eslint.config.mjs` finds entry
- [ ] `grep -n "(text|bg|border)-(overdue|urgent|soon|normal)" apps/frontend/eslint.config.mjs` finds entry
- [ ] `grep -rEn "(text|bg|border)-(overdue|urgent|soon|normal)\b" apps/frontend --include='*.ts' --include='*.tsx' | grep -v "lib/design-tokens/components/dday-tone.ts"` returns 0 lines
- [ ] `grep -rEn "\b(text|bg|border|ring|from|to|via)-purple-[0-9]+" apps/frontend/components/dashboard` returns 0 lines

### AP-03: Backend Config + Zod
- [ ] `grep -n "DASHBOARD_STORAGE_CAPACITY_BYTES" apps/backend/src/config/env.validation.ts` finds entry
- [ ] `grep -n "DASHBOARD_STORAGE_CAPACITY_BYTES" .env.example` finds entry
- [ ] `grep -rn "process\.env\.DASHBOARD_STORAGE" apps/backend/src` returns 0 lines
- [ ] `test -f apps/backend/src/modules/dashboard/dto/dashboard-scope.dto.ts` true
- [ ] `test -f packages/shared-constants/src/dashboard-scope.ts` true
- [ ] `grep -n "DASHBOARD_SCOPES\|DashboardScope" packages/shared-constants/src/index.ts` finds re-export
- [ ] `grep -n "DashboardScopeValidationPipe\|@UsePipes" apps/backend/src/modules/dashboard/dashboard.controller.ts` finds usage
- [ ] `grep -rn "'me' | 'team' | 'lab' | 'all'" apps/backend apps/frontend --include='*.ts' --include='*.tsx'` returns 0 lines

### AP-04: SystemHealth MONITORING
- [ ] `grep -n "QUERY_CONFIG\.MONITORING" apps/frontend/components/dashboard/DashboardClient.tsx` finds line near systemHealth useQuery

### AP-05: Design tokens
- [ ] `grep -n "DASHBOARD_DDAY_LIST_TOKENS" apps/frontend/lib/design-tokens/components/dashboard.ts apps/frontend/components/dashboard/CalibrationDdayList.tsx` finds 2+ entries
- [ ] `grep -n "minH = 280\|const minH" apps/frontend/components/dashboard/CalibrationDdayList.tsx` returns 0 lines
- [ ] `grep -n "_suffixNote" apps/frontend/messages/en/dashboard.json apps/frontend/messages/ko/dashboard.json` finds 2 entries

### AP-06: Playwright + a11y
- [ ] `test -f apps/frontend/tests/e2e/shared/utils/a11y-helper.ts` true
- [ ] `test -f apps/frontend/tests/e2e/shared/utils/theme-helper.ts` true
- [ ] `grep -n "/mnt/c/Users" apps/frontend/tests/e2e/dashboard-screenshots.spec.ts` returns 0 lines
- [ ] `grep -n "SCREENSHOT_OUTPUT_DIR\|__screenshots__" apps/frontend/tests/e2e/dashboard-screenshots.spec.ts` finds entry
- [ ] `grep -n "__screenshots__" .gitignore` finds entry

### AP-07: manage-skills
- [ ] `grep -n "Step 36" .claude/skills/verify-ssot/SKILL.md` finds entry
- [ ] `grep -n "Step 24" .claude/skills/verify-frontend-state/SKILL.md` finds entry
- [ ] `grep -n "Step 21" .claude/skills/verify-frontend-state/SKILL.md` finds entry (확장됨)
- [ ] `grep -n "Step 43" .claude/skills/verify-design-tokens/SKILL.md` finds entry (보강 — `getDerivedStateFromError` 패턴 포함)

### AP-08: Bundle baseline
- [ ] `node -e "const b=require('./scripts/bundle-baseline.json'); process.exit(Object.keys(b.routes).length>0?0:1)"` exits 0

### Optional (when run)
- [ ] Playwright a11y: 5 roles × 1 axe scan, 0 critical+serious violations
- [ ] Playwright screenshots: 30 PNG generated (5 roles × 6 light + 5 roles × 2 dark = 40 추정 with 4 viewports light, 결정에 따라 30)

## SHOULD Criteria (warn on miss, 루프 차단 없음)

- [ ] 6-tier vs 4-tier 시각 diff 문서화 (D-3..D-6 cohort, D+4+ pulse-removal) — commit message에 명시
- [ ] Bundle delta commit message에 명시 (예상 −1 ~ −2KB)
- [ ] tech-debt-tracker `?simulateRole` audit-log observability 항목 추가
- [ ] standalone HTML 5 역할과 ⚠️ 표시 항목들 1:1 매칭 확인 (§3.1 EQ / §3.7 items-stretch / §3.10 debug widget / §A.3.1 미니캘린더 / §A.9.1 skip nav)

## Out of Scope (deferred — tech-debt-tracker)

- BullMQ queueSize 실측 연결
- error_logs 테이블 / Sentry 통합
- DASHBOARD_STORAGE_CAPACITY_BYTES 운영 환경별 설정
- pre-existing dday deprecation outside `apps/frontend/components/checkouts/` (없음 확인됨)

## Failure Handling

- FAIL + iteration < 3 → fix loop
- FAIL + same issue 2x → manual intervention
- FAIL + iteration ≥ 3 → manual intervention

Save evaluation to `.claude/evaluations/dashboard-redesign-phase-e-residual.md`.
