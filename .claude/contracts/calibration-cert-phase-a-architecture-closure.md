# Contract: Calibration Certificate Phase A — Architecture Closure

> Slug: `calibration-cert-phase-a-architecture-closure` · Mode: 2 · Generated: 2026-05-07
> Plan: `.claude/exec-plans/active/2026-05-07-calibration-cert-phase-a-architecture-closure.md`
> Source: 2026-05-06 `calibration-cert-phase-a-closure` (commit 80e77488) 후속 시니어 자기 감사 6갭 atomic closure

## MUST (loop-blocking — 1건 FAIL = Generator iteration)

### M-1: Schemas + shared-constants build PASS
```bash
pnpm --filter @equipment-management/schemas run build
pnpm --filter @equipment-management/shared-constants run build
# expected: exit=0 양쪽 (변경 없지만 baseline 회귀 확인)
```

### M-2: Backend tsc + lint PASS
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run lint
# expected: exit=0
```

### M-3: Frontend tsc + lint PASS
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
# expected: exit=0
```

### M-4: Backend test 회귀 0건 (calibration module 포함)
```bash
pnpm --filter backend exec jest --testPathPattern="modules/calibration/" --silent
# expected: 모든 suites PASS, 0 failures
```

### M-5: Frontend test 회귀 + RTL spec PASS (옵션 C 적용)
```bash
# 본 sprint commit에 포함된 RTL spec — CalibrationRegisterDialog 단독
pnpm --filter frontend exec jest --testPathPattern="CalibrationRegisterDialog\.test" --silent
# expected: ≥ 4 tests PASS

# spec 파일 자체 존재 확인
test -f "apps/frontend/components/equipment/__tests__/CalibrationRegisterDialog.test.tsx"

# test count
grep -cE "^\s*(it|test)\(" "apps/frontend/components/equipment/__tests__/CalibrationRegisterDialog.test.tsx"
# expected: ≥ 4

# 전체 회귀 0
pnpm --filter frontend exec jest --silent
# expected: 모든 suites PASS (CalibrationContent.test.tsx는 untracked로 남기고 jest --silent 가 picked up 시 통과 또는 본 sprint 외 처리)
```

### M-5b: 옵션 C 분리 — CalibrationContent.test.tsx 후속 sprint
- 본 sprint scope: CalibrationContent.tsx 미수정 (Gap 2/4 보류)
- CalibrationContent.test.tsx는 Gap 2/4 적용 가정 spec — 후속 sprint와 함께 commit
- 본 sprint git add에서 **명시적 제외**

### M-6: Sub-route 파일 존재 + Next.js 16 PageProps 패턴 준수
```bash
test -f "apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx"
test -f "apps/frontend/components/equipment/CalibrationHistoryClient.tsx"

# Next.js 16: params Promise + await
grep -cE "await props\.params|paramsPromise: Promise<" \
  "apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx"
# expected: ≥ 1

# sync Page → Suspense → async ContentAsync 패턴
grep -cE "Suspense fallback" "apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx"
# expected: ≥ 1
```

### M-7: FilterChip 신설 + 시그니처 + a11y
```bash
test -f "apps/frontend/components/shared/FilterChip.tsx"

# props 시그니처 검증 (label/value/onClear 필수, clearAriaLabel 필수)
grep -c "label:" apps/frontend/components/shared/FilterChip.tsx          # ≥ 1
grep -c "value:" apps/frontend/components/shared/FilterChip.tsx          # ≥ 1
grep -c "onClear:" apps/frontend/components/shared/FilterChip.tsx        # ≥ 1
grep -c "clearAriaLabel" apps/frontend/components/shared/FilterChip.tsx  # ≥ 1

# aria-label prop 실제 button에 적용
grep -E "aria-label=\{(props\.)?clearAriaLabel" apps/frontend/components/shared/FilterChip.tsx | wc -l
# expected: ≥ 1
```

### M-8: Design token 신설 + JIT-safe + index.ts re-export
```bash
test -f "apps/frontend/lib/design-tokens/components/filter-chip.ts"

# 토큰 객체 export
grep -c "export const FILTER_CHIP_TOKENS" apps/frontend/lib/design-tokens/components/filter-chip.ts
# expected: ≥ 1

# `as const` 강제
grep -c "as const" apps/frontend/lib/design-tokens/components/filter-chip.ts
# expected: ≥ 1

# JIT-safe — 동적 보간 0건 (text-brand-${...} / bg-${...} 등)
grep -E "text-(brand|muted)-\\\$\\{|bg-\\\$\\{" apps/frontend/lib/design-tokens/components/filter-chip.ts | wc -l
# expected: 0

# index.ts re-export
grep -c "FILTER_CHIP_TOKENS\|filter-chip" apps/frontend/lib/design-tokens/index.ts
# expected: ≥ 1
```

### M-9: CalibrationContent inline chip → FilterChip 마이그레이션 — N/A (옵션 C)
- **사용자 결정**: 옵션 C — CalibrationContent.tsx에 다른 세션 staged 변경(methods toggle UI, query-r3-closure)이 있어 본 sprint commit이 흡수 위험. 옵션 C 합의로 본 sprint scope에서 제외
- **후속 sprint**: 다른 세션 query-r3-closure commit 후 chip 마이그레이션 + Gap 4 chip data sourcing 통합 sprint로 분리
- **본 sprint 검증**: `git diff --cached -- apps/frontend/app/\(dashboard\)/calibration/CalibrationContent.tsx | wc -l` = 0

### M-10: Chip data sourcing — useEquipment — N/A (옵션 C)
- M-9와 동일 사유 — CalibrationContent.tsx 수정 보류
- **후속 sprint**: Gap 2 (FilterChip 적용) + Gap 4 (useEquipment) 통합 closure

### M-11: Backend AuditLog entityIdPath
```bash
ctrl="apps/backend/src/modules/calibration/calibration-certificate.controller.ts"

# entityIdPath 추가
grep -E "entityIdPath" "$ctrl" | wc -l
# expected: ≥ 1

# response.certificateNumber 경로 (옵션 A)
grep -c "response.certificateNumber" "$ctrl"
# expected: ≥ 1

# 기존 @AuditLog action+entityType 보존
grep -E "action:\s*'extract'" "$ctrl" | wc -l                       # ≥ 1
grep -E "entityType:\s*'calibration_certificate'" "$ctrl" | wc -l   # ≥ 1
```

### M-12: Cross-domain diff 0줄 (격리)
```bash
# query-r3-closure 진행 도메인(lib/api/*) 0건
git diff --cached --name-only | grep -E "^apps/frontend/lib/api/" | wc -l
# expected: 0

# 다른 세션 도메인 0건
git diff --cached --name-only | grep -E "(dashboard/|approvals/|checkouts/|commit-pipeline|\.husky/|commitlint)" | wc -l
# expected: 0

# packages/schemas, packages/shared-constants 0건 (신규 enum/i18n 0)
git diff --cached --name-only | grep -E "^packages/(schemas|shared-constants)/" | wc -l
# expected: 0

# calibration.json (ko/en) 다른 세션 영역 — 본 sprint 추가 0줄
git diff --cached apps/frontend/messages/ko/calibration.json apps/frontend/messages/en/calibration.json \
  | grep -cE "^\+[^+]"
# expected: 0

# equipment.json (ko/en) — 본 sprint calibrationHistoryClient namespace 추가 허용 (다른 세션 backAriaLabel 보존)
git diff --cached apps/frontend/messages/ko/equipment.json apps/frontend/messages/en/equipment.json \
  | grep -E "calibrationHistoryClient" | wc -l
# expected: ≥ 1 (다른 세션 작성 backAriaLabel 흡수 보존)
```

### M-13: 하드코딩 0 + SSOT 준수 — verify gates
```bash
# verify-hardcoding 또는 동등 lint
pnpm --filter frontend run lint
# expected: exit=0

# inline tailwind chip 패턴 0건 (sub-route Client 포함)
grep -rE "bg-muted/50 border border-border text-sm" \
  apps/frontend/app/\(dashboard\)/calibration/ \
  apps/frontend/components/equipment/CalibrationHistoryClient.tsx 2>/dev/null | wc -l
# expected: 0

# 신규 i18n key는 calibrationHistoryClient namespace 한정 (다른 세션 작성 흡수)
git diff --cached apps/frontend/messages/ | grep -E "^\+\s*\"[a-zA-Z]+\":" | grep -vE "calibrationHistoryClient|backAriaLabel" | wc -l
# expected: 0
```

## SHOULD (not loop-blocking)

### S-1: Sub-route URL 패턴이 다른 도메인과 일관 (kebab-case)
```bash
ls apps/frontend/app/\(dashboard\)/equipment/\[id\]/ | grep -E "(repair-history|calibration-factors|non-conformance|calibration-history)" | wc -l
# expected: ≥ 4 (4 sub-routes 모두 kebab-case)
```

### S-2: Design token이 BADGE/SEMANTIC 시스템과 정합 (신 시스템 신설 회피)
```bash
# filter-chip.ts가 brand.ts의 semantic getter 또는 TRANSITION_PRESETS 등 기존 token 재참조
grep -cE "from '\.\./|from '\.\./\.\./brand|TRANSITION_PRESETS|getSemantic|FOCUS_TOKENS" \
  apps/frontend/lib/design-tokens/components/filter-chip.ts
# expected: ≥ 1 (기존 시스템 재참조 ≥ 1건) — 또는 token 자체가 이미 단일 string token로 응집되어 외부 의존 불필요할 수 있음
```

### S-3: tech-debt-tracker 6건 [x] mark
```bash
grep -E "phase-a-arch.*equipment-calibration-history-sub-route|phase-a-arch.*filter-chip-shared-component|phase-a-arch.*filter-chip-design-token|phase-a-arch.*equipment-detail-separate-fetch-for-chip|phase-a-arch.*calibration-certificate-extract-audit-entity-id|phase-a-arch.*calibration-content-dialog-rtl-specs" \
  .claude/exec-plans/tech-debt-tracker.md \
  | grep -cE "\[x\]|✅|completed|2026-05-07"
# expected: ≥ 6
```

### S-4: Final commit + push (pre-push hook PASS)
```bash
git log -1 --format="%s" | grep -iE "(calibration|architecture closure|phase a)"
git status -s | wc -l   # expected: 0 (clean — 본 sprint 파일만)
```

## Evaluator 실행 순서

1. **M-1 ~ M-3** — build + tsc + lint 3종 (양 패키지)
2. **M-4 ~ M-5** — backend + frontend test 회귀 + 신규 RTL spec
3. **M-6** — sub-route 파일 존재 + Next.js 16 패턴
4. **M-7 ~ M-8** — FilterChip + design token 신설
5. **M-9** — CalibrationContent inline chip → FilterChip 마이그레이션
6. **M-10** — Chip data sourcing (useEquipment)
7. **M-11** — Backend AuditLog entityIdPath
8. **M-12** — Cross-domain diff 0줄 (격리)
9. **M-13** — 하드코딩 0 + SSOT 준수
10. **S-1 ~ S-4** — note (FAIL 미차단)

전 MUST PASS 시 atomic single commit + push + tech-debt mark + REGISTRY Active→Completed.

## 시니어 자기검토 7대 영역 명시 매핑

| 영역 | 본 contract 검증 표면 |
|---|---|
| state 분산 | M-10 — list state와 chip data fetch 분리 (useEquipment 호출 추가) |
| prop drilling | M-6 — sub-route Client equipment 1단 drilling만 |
| destructive cancel | M-5 — RTL spec close→재open form reset 회귀 검증 |
| SSOT 우회 | M-7 / M-8 / M-13 — FilterChip + design token + i18n 추가 0건 |
| performance | useEquipment enabled 가드 (filters.equipmentId 없으면 skip) — 코드 review로 확인 |
| cross-domain | M-12 — lib/api/* / dashboard / approvals / checkouts / commit-pipeline 0줄 |
| mock-only | M-5 RTL spec은 mock 기반 (jsdom 한계). 정상 flow는 기존 backend e2e + Playwright가 cover — 본 sprint는 mock RTL만 추가 (별도 sprint에서 e2e 보강) |
