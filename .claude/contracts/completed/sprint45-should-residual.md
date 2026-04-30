# Contract — sprint45-should-residual

**Slug**: `sprint45-should-residual`
**Date**: 2026-04-30
**Mode**: Mode 2 (Planner → Generator → Evaluator)
**Source plan**: `.claude/exec-plans/active/2026-04-30-sprint45-should-residual.md`

이 contract는 Evaluator가 그대로 실행할 수 있는 grep/test 명령 단위로 PASS/FAIL을 판정한다.

---

## MUST 기준 (loop 차단 — 미달 시 Evaluator 재실행)

### M1 — TypeScript 전체 검증

```bash
cd /home/kmjkds/equipment_management_system && pnpm tsc --noEmit
```

기대: exit 0, 출력 없음 (error 0건)

---

### M2 — Frontend tsc 단독

```bash
pnpm --filter frontend exec tsc --noEmit
```

기대: exit 0

---

### M3 — Frontend build 성공

```bash
pnpm --filter frontend run build
```

기대: exit 0, "Compiled successfully" 포함

---

### M4 — Frontend lint 0 error

```bash
pnpm --filter frontend run lint
```

기대: exit 0, error 0건 (warning은 허용 — 단, 신규 warning이 본 세션 변경 파일에서 발생한 경우 SHOULD로 기록)

---

### M5 — S3: CheckoutGroupCard 헤더 indeterminate prop API 등록

```bash
grep -E "selectedRowIds\?:|onToggleGroup\?:|onToggleRow\?:" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx | wc -l
```

기대: ≥3 (3개 prop 모두 등장)

---

### M6 — S3: 헤더 체크박스 Radix indeterminate 패턴

```bash
grep -E "data-state=\"indeterminate\"|checked=.*indeterminate|isIndeterminate" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx | wc -l
```

기대: ≥1

---

### M7 — S3: 단위 테스트 파일 신설 + 3-state 케이스 ≥3

```bash
ls apps/frontend/components/checkouts/__tests__/CheckoutGroupCard.test.tsx
grep -cE "^\s*it\(|^\s*test\(" \
  apps/frontend/components/checkouts/__tests__/CheckoutGroupCard.test.tsx
```

기대: 파일 존재 + ≥3 it/test (none / some(indeterminate) / all 케이스 + IME 가드 + 토글 콜백)

---

### M8 — S3: 단위 테스트 PASS

```bash
pnpm --filter frontend test CheckoutGroupCard.test --no-coverage
```

기대: exit 0, "X passed" 출력

---

### M9 — S3: use-bulk-selection 회귀 0건

```bash
pnpm --filter frontend test use-bulk-selection.test --no-coverage
```

기대: exit 0, "13 passed, 13 total" (기존 테스트 보존)

---

### M10 — S3: IME 가드 적용

```bash
grep "nativeEvent.isComposing" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx | wc -l
```

기대: ≥1 (헤더 체크박스 onKeyDown에 적용)

---

### M10a — S3: getGroupRowIds SSOT 헬퍼 + 1+ 호출처 (TR-5 v2)

```bash
# SSOT 헬퍼 위치 + 시그니처 검증
grep -E "export function getGroupRowIds|export const getGroupRowIds" \
  apps/frontend/lib/checkouts/group-selection.ts
# 호출처 ≥1 (fixture page)
grep -rn "getGroupRowIds" apps/frontend --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|__tests__\|group-selection.ts" | wc -l
```

기대: 헬퍼 export ≥1 + 호출처 ≥1

---

### M10b — S3: Visual fixture page 신설 + production 가드 (TR-5 v2)

```bash
ls apps/frontend/app/\(dashboard\)/__visual__/group-indeterminate/page.tsx
grep -E "process\.env\.NODE_ENV|notFound\(\)" \
  apps/frontend/app/\(dashboard\)/__visual__/group-indeterminate/page.tsx | wc -l
```

기대: 파일 존재 + 가드 ≥1 hit

---

### M10c — S3: e2e 시나리오 3건 PASS (TR-5 v2)

```bash
ls apps/frontend/tests/e2e/features/checkouts/group-indeterminate.spec.ts
# 3 시나리오 (test/it 카운트)
grep -cE "^\s*test\(|^\s*it\(" \
  apps/frontend/tests/e2e/features/checkouts/group-indeterminate.spec.ts
# 실행 (storageState 의존 — auth setup 필요)
pnpm --filter frontend exec playwright test group-indeterminate --project=chromium
```

기대: 파일 존재 + ≥3 test 블록 + Playwright exit 0

> **fallback (시드/인증 의존)**: storageState 미가용 또는 dev 서버 미가동 시 spec 자체는 기록되어야 하나 실제 실행 PASS는 SHOULD로 강등 가능. 단위 테스트(M8)는 MUST 유지.

---

### M10d — S3: tech-debt-tracker 부모 통합 후속 항목 등록 (TR-5 v2)

```bash
grep -E "checkouts-tab-bulk-selection-integration" \
  .claude/exec-plans/tech-debt-tracker.md | wc -l
```

기대: ≥1 (Open 섹션에 신규 항목 — Outbound/Inbound 탭 부모 통합 sprint 등록)

---

### M11 — S4: D-day 6-level Playwright spec 신설

```bash
ls apps/frontend/tests/e2e/visual/dday-6level.spec.ts
```

기대: 파일 존재 — 6-level × light/dark 캡처 spec

---

### M12 — S4: D-day fixture page 신설 (dev-only 가드)

```bash
# fixture page 존재
ls apps/frontend/app/\(dashboard\)/__visual__/dday/page.tsx 2>&1
# production 가드 검증 — process.env.NODE_ENV 또는 notFound() 가드
grep -E "process\.env\.NODE_ENV|notFound\(\)" \
  apps/frontend/app/\(dashboard\)/__visual__/dday/page.tsx
```

기대: 파일 존재 + 가드 코드 ≥1 hit

---

### M13 — S4: D-day SSOT 직접 import (하드코딩 0)

```bash
grep -E "getCheckoutDdayVisualLevel|DDAY_VISUAL_LEVEL_CLASSES|CHECKOUT_DDAY_VISUAL_THRESHOLDS" \
  apps/frontend/app/\(dashboard\)/__visual__/dday/page.tsx \
  apps/frontend/tests/e2e/visual/dday-6level.spec.ts \
  | wc -l
```

기대: ≥2 (page.tsx에서 SSOT 직접 import — 임계값/클래스 하드코딩 0건)

---

### M14 — S4: baseline 갱신 명령 정의 (CI integration plan)

contract 또는 spec 파일 주석에 baseline 갱신 명령이 명시되어야 한다.

```bash
grep -E "update-snapshots|baseline" \
  apps/frontend/tests/e2e/visual/dday-6level.spec.ts | wc -l
```

기대: ≥1 (주석에 갱신 명령 포함)

---

### M15 — S6: FRONTEND_ROUTES.HELP SSOT 등록

```bash
grep -E "HELP:\s*\{|HELP:\s*['\"]/help" \
  packages/shared-constants/src/frontend-routes.ts | wc -l
```

기대: ≥1 (HELP 키 신설)

---

### M16 — S6: /help 라우트 페이지 신설

```bash
ls apps/frontend/app/\(dashboard\)/help/page.tsx
```

기대: 파일 존재

---

### M17 — S6: Help 페이지 Next.js 16 패턴 (proxy.ts / useActionState 우회 패턴 부재 검증)

```bash
# middleware.ts 신규 생성 0
git diff --name-only HEAD~5..HEAD 2>/dev/null | grep -E "middleware\.ts$" | wc -l
# useFormState 0 (Next.js 16 deprecated)
grep -rn "useFormState" apps/frontend/app/\(dashboard\)/help/ 2>/dev/null | wc -l
```

기대: middleware.ts 신규 0건 + useFormState 0건

---

### M18 — S6: i18n parity (ko + en help.json keys 동일)

```bash
test "$(jq 'paths(scalars) | length' apps/frontend/messages/ko/help.json | wc -l)" = \
     "$(jq 'paths(scalars) | length' apps/frontend/messages/en/help.json | wc -l)"
```

기대: exit 0 (양쪽 키 카운트 일치). 또는 jq 미설치 시 `node -e 'const a=require...'` 대체 명령.

대안:

```bash
node -e "
  const ko = require('./apps/frontend/messages/ko/help.json');
  const en = require('./apps/frontend/messages/en/help.json');
  const k = (o, p='') => Object.entries(o).flatMap(([k,v]) => typeof v === 'object' ? k(v, p+k+'.') : [p+k]);
  if (JSON.stringify(k(ko).sort()) !== JSON.stringify(k(en).sort())) process.exit(1);
"
```

---

### M19 — S6: EmptyState secondaryAction prop API

```bash
grep -E "secondaryAction\??:" \
  apps/frontend/components/dashboard/atoms/EmptyState.tsx | wc -l
```

기대: ≥1 (간소형 EmptyState에 secondaryAction prop 추가)

> 참고: `shared/EmptyState.tsx`, `checkouts/CheckoutEmptyState.tsx` 는 이미 secondaryAction 보유 — 변경 0건.

---

### M20 — S6: 도움말 라우트 a11y 라벨

```bash
grep -E "aria-label|aria-labelledby|<h1" \
  apps/frontend/app/\(dashboard\)/help/page.tsx | wc -l
```

기대: ≥1 (h1 또는 aria-label)

---

### M21 — S6: 하드코딩 `/help` 0건 (FRONTEND_ROUTES.HELP 경유)

```bash
grep -rn "router\.push.*['\"]\/help['\"]\|href=['\"]\/help['\"]" \
  apps/frontend --include="*.tsx" --include="*.ts" \
  | grep -v "FRONTEND_ROUTES" \
  | grep -v "node_modules\|\.next\|__tests__\|__snapshots__" \
  | wc -l
```

기대: 0 (모든 `/help` 참조가 `FRONTEND_ROUTES.HELP` 경유)

---

### M22 — SSOT 준수: 신규 파일에서 임계값/클래스 하드코딩 0

```bash
# fixture page에 days 값 직접 하드코딩(예: "10"+ "day") 검출 — visual fixture는 의도적 입력값 노출이 SSOT가 아니므로 점검만
# spec에서 6-level boundary 입력값을 SSOT 임계값과 동기화하는 데 visual-thresholds 직접 import 권장
grep -E "CHECKOUT_DDAY_VISUAL_THRESHOLDS\." \
  apps/frontend/tests/e2e/visual/dday-6level.spec.ts \
  apps/frontend/app/\(dashboard\)/__visual__/dday/page.tsx 2>/dev/null | wc -l
```

기대: ≥1 (테스트/fixture 양쪽 중 ≥1에서 SSOT 임계값 직접 import)

---

### M23 — 옛날 API 부재 (Next.js 16 / React 19)

```bash
# useFormState 신규 도입 0 (전 코드베이스, 최근 5 commit 기준)
git diff HEAD~5..HEAD apps/frontend 2>/dev/null | grep "^+.*useFormState" | wc -l
# middleware 함수명 신규 0 (proxy.ts 외)
grep -rn "export async function middleware" apps/frontend --include="*.ts" 2>/dev/null | wc -l
```

기대: 모두 0건

---

### M24 — tech-debt-tracker 정리

```bash
# 본 세션 항목 strikethrough 또는 archive 이동 확인
grep -E "S3 그룹 헤더 indeterminate|S4 D-day 6-level storybook|S6 EmptyState in-app 도움말" \
  .claude/exec-plans/tech-debt-tracker.md | grep -E "~~|done|완료" | wc -l
# 또는 archive에 항목 등재
grep -E "S3 그룹 헤더 indeterminate|S4 D-day 6-level|S6 EmptyState in-app 도움말" \
  .claude/exec-plans/tech-debt-tracker-archive.md | wc -l
```

기대: 양쪽 합계 ≥3 (3건 모두 완료 표시 또는 archive)

---

### M25 — REGISTRY.md 갱신

```bash
grep -E "sprint45-should-residual" .claude/contracts/REGISTRY.md
```

기대: ≥1 hit (Active 또는 Completed 섹션에 등록)

---

## SHOULD 기준 (루프 차단 안 함, 발견 시 후속 등록)

### S1 — Dark mode 검증

```bash
# Phase 0 dark theme 캡처 baseline 존재
ls apps/frontend/tests/e2e/visual/dday-6level.spec.ts-snapshots/ 2>/dev/null | grep -i "dark" | wc -l
```

기대: ≥6 (level 1~6 dark variant)

미달 시: 후속 SHOULD로 dark baseline 추가 task 등록.

---

### S2 — Bundle size diff < 5KB gzip

```bash
# 본 세션 후 frontend build 결과 / FirstLoadJS 비교
pnpm --filter frontend run build 2>&1 | grep -E "First Load JS|/help|__visual__" | head -10
```

기대: `/help` 청크 First Load JS < 30KB. 메인 청크 변동 < 1KB.

미달 시: code-splitting 검토 후속 task.

---

### S3 — Playwright trace 캡처 (CI integration)

```bash
# spec 파일에 trace: 'on' 또는 video 설정 가능 여부 주석 명시
grep -E "trace:|video:" apps/frontend/tests/e2e/visual/dday-6level.spec.ts | wc -l
```

기대: ≥1 (주석 또는 use 옵션) — 실패 시 trace 보관 권장 명시

---

### S4 — verify-bulk-action-bar SKILL Step 8 추가

```bash
grep -cE "^### Step" .claude/skills/verify-bulk-action-bar/SKILL.md
```

기대: ≥8 (그룹 헤더 indeterminate 패턴 신설). 미달 시 후속 SKILL 갱신.

---

### S5 — analytics 이벤트 등록 (optional)

```bash
grep -E "track\(['\"]checkout\.group\.toggleAll" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx | wc -l
```

기대: ≥1 (선택 행위 추적). 미달 시 후속 등록.

---

### S6 — i18n key 추가 검토 정책 명시

본 세션에서 신규 i18n 키 추가됨 (`groupCard.selectAll`, `help.*`). exec-plan에 "신규 키 허용 — placeholder 콘텐츠 사용자 confirm 후 채움" 명시 확인.

```bash
grep -E "i18n.*placeholder|콘텐츠.*confirm" .claude/exec-plans/active/2026-04-30-sprint45-should-residual.md | wc -l
```

기대: ≥1

---

### S7 — EmptyState dedup 결정 명문화

```bash
grep -E "EmptyState.*dedup|3종.*dedup" \
  .claude/exec-plans/active/2026-04-30-sprint45-should-residual.md | wc -l
```

기대: ≥1 (Out-of-Scope에 명시)

---

### S8 — Help 페이지 sitemap/SEO

본 세션은 정적 페이지만. `<title>`, meta description, sitemap.xml 등록 후속 sprint.

```bash
grep -E "title:|metadata" apps/frontend/app/\(dashboard\)/help/page.tsx | wc -l
```

기대: ≥1 (Next.js 16 metadata export 또는 generateMetadata)

---

## 평가 진행 순서

1. **MUST (M1~M25 + M10a~M10d = 29 항목)** 순차 실행. 첫 FAIL 시 즉시 Generator 재실행 사이클 진입.
2. 모든 MUST PASS 시 SHOULD (S1~S8) 실행 — FAIL은 tech-debt-tracker에 등록 후 PASS 판정.
3. 최종 OVERALL 판정:
   - **PASS**: MUST 29/29 + SHOULD 8건 평가 완료 (PASS/INFO 무관)
   - **FAIL**: MUST 1건이라도 FAIL — Generator 사이클로 복귀
4. **TR-5 v2 fallback**: M10c (e2e 실행)는 dev 서버/storageState 의존이라 환경 불가 시 SHOULD 강등 가능 — 단, spec 파일 자체 존재(grep)는 MUST 유지

---

## 예상 산출물 파일 목록 (Generator 작업 단위)

| 파일 | 종류 | Phase |
|------|------|-------|
| `apps/frontend/tests/e2e/visual/dday-6level.spec.ts` | 신규 | 0 |
| `apps/frontend/app/(dashboard)/__visual__/dday/page.tsx` | 신규 | 0 |
| `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` | 수정 | 1 |
| `apps/frontend/lib/checkouts/group-selection.ts` | **신규 (TR-5 v2)** | 1 |
| `apps/frontend/components/checkouts/__tests__/CheckoutGroupCard.test.tsx` | 신규 | 1 |
| `apps/frontend/messages/ko/checkouts.json` | 수정 | 1 |
| `apps/frontend/messages/en/checkouts.json` | 수정 | 1 |
| `apps/frontend/app/(dashboard)/__visual__/group-indeterminate/page.tsx` | **신규 (TR-5 v2)** | 1.5 |
| `apps/frontend/tests/e2e/features/checkouts/group-indeterminate.spec.ts` | **신규 (TR-5 v2)** | 1.5 |
| `.claude/skills/verify-bulk-action-bar/SKILL.md` | 수정 (선택, SHOULD) | 1 |
| `packages/shared-constants/src/frontend-routes.ts` | 수정 | 2 |
| `apps/frontend/app/(dashboard)/help/page.tsx` | 신규 | 2 |
| `apps/frontend/messages/ko/help.json` | 신규 | 2 |
| `apps/frontend/messages/en/help.json` | 신규 | 2 |
| `apps/frontend/components/dashboard/atoms/EmptyState.tsx` | 수정 | 2 |
| `.claude/exec-plans/tech-debt-tracker.md` | 수정 (S3/S4/S6 정리 + checkouts-tab-bulk-selection-integration 신규 등록) | 3 |
| `.claude/exec-plans/tech-debt-tracker-archive.md` | 수정 | 3 |
| `.claude/contracts/REGISTRY.md` | 수정 | 3 |

---

## CAS 영향 평가

본 세션 변경 사항은 모두 **client-state 또는 UI/라우팅** — backend mutation 0건. CAS / version conflict / cache invalidation 영향 없음.

확인:

- S3: `useRowSelection` client state — 서버 동기화 0
- S4: visual regression — 런타임 동작 무관
- S6: 정적 page + SSOT 라우트 — mutation 0

---

## Sign-off

Planner 작성 완료. 사용자 승인 대기 중.
