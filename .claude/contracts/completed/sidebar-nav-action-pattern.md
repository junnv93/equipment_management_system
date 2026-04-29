# 스프린트 계약: Sidebar Nav Action Pattern

## 생성 시점

2026-04-28

## 슬러그

`sidebar-nav-action-pattern`

## 연결

- 실행 계획: `.claude/exec-plans/active/2026-04-28-sidebar-nav-action-pattern.md`
- 결과 보고서(생성 예정): `.claude/evaluations/sidebar-nav-action-pattern.md`

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### M1 — TypeScript 컴파일 PASS

- **명령:** `pnpm tsc --noEmit`
- **PASS 조건:** exit 0, "error TS" 0건
- **근거:** discriminated union 도입과 prop 시그니처 변경이 모든 caller에 일관 적용됐는지 검증

#### M2 — 프론트엔드 프로덕션 빌드 PASS

- **명령:** `pnpm --filter frontend run build`
- **PASS 조건:** exit 0, `Failed to compile` 0건
- **근거:** 타입 변경 + JSX 구조 변경이 빌드 단계에서 깨지지 않음을 확인

#### M3 — 사이드바 nested anchor 정적 검출 0건

- **명령:**
  ```bash
  # NavRowWithSecondaryAction과 NavBadge에서 Link/anchor 중첩 패턴 검출
  grep -rEn "<Link[^>]*>\s*<Link|<a[^>]*>\s*<a" apps/frontend/components/layout/
  ```
- **PASS 조건:** 0 hit
- **근거:** Phase 2/3 후 sibling 구조로 평탄화됐음을 정적 보장

#### M4 — Playwright e2e: 사이드바 hydration/console error 0건

- **명령:** `pnpm --filter frontend run test:e2e -- tests/e2e/features/layout/sidebar-nav-action.spec.ts`
- **PASS 조건:** 모든 테스트 PASS, 콘솔에서 다음 패턴 0건:
  - `In HTML, <a> cannot be a descendant of <a>`
  - `Hydration failed`
  - `text content does not match`
- **검증 방법:** 테스트가 `page.on('console')` 으로 메시지 수집 → 위 패턴 매치 시 fail
- **근거:** 표면 버그가 실제 라우트에서 사라졌는지 동적 검증

#### M5 — WCAG 2.4.3 Focus Order: Tab 순서 검증

- **검증 방법:** 같은 e2e 스펙 안에서:
  ```ts
  await page.locator('a[href="/checkouts"]').first().focus();
  await page.keyboard.press('Tab');
  const activeHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.getAttribute('href'));
  expect(activeHref).toMatch(/\/checkouts\?view=yourTurn/);
  ```
- **PASS 조건:** 메인 → 보조 → 다음 nav item 순으로 focus 이동
- **근거:** WCAG 2.4.3 Focus Order — DOM 순서 = Tab 순서 자연 일관

#### M6 — SSOT 준수: 새 컴포넌트는 디자인 토큰 경유, 하드코딩 0

- **명령:**
  ```bash
  # NavRowWithSecondaryAction에서 색상/spacing inline 클래스 도입 0건
  grep -E "(bg-|text-|border-|p-|m-|gap-|rounded-)" apps/frontend/components/layout/NavRowWithSecondaryAction.tsx | \
    grep -vE "import|cn\(|getSidebar|SIDEBAR_|FOCUS_TOKENS|TRANSITION_PRESETS"
  ```
- **PASS 조건:** 출력 0줄 (모든 시각 클래스가 토큰 함수 또는 토큰 상수 경유)
- **근거:** Layer 3 컴포넌트는 Layer 2 토큰만 참조 (CLAUDE.md 디자인 토큰 3-Layer)

#### M7 — i18n ko/en parity 유지

- **명령:**
  ```bash
  node scripts/check-i18n-call-sites.mjs --all
  ```
- **PASS 조건:** exit 0, stderr 누락 0건
- **부가 검증:** `navigation.layout.checkoutOpenList` (또는 동등 신규 키)가 ko/en 양쪽 동시 존재
- **근거:** i18n-parity-hardening 게이트와 동시 통과

#### M8 — `any` 도입 0건 (변경분 한정)

- **명령:**
  ```bash
  git diff origin/main...HEAD -- 'apps/frontend/**/*.{ts,tsx}' | \
    grep -E '^\+' | \
    grep -E ':\s*any\b|<any>|as\s+any\b' | \
    grep -vE '^\+//|^\+\s*\*'
  ```
- **PASS 조건:** 출력 0줄
- **근거:** CLAUDE.md Rule 3 — TypeScript Strict

#### M9 — Discriminated union 데이터 모델 정착

- **명령:**
  ```bash
  grep -nE "type\s+NavItemBadgeConfig\s*=" apps/frontend/lib/navigation/nav-config.ts
  grep -nE "kind:\s*'count'|kind:\s*'count-with-action'" apps/frontend/lib/navigation/nav-config.ts
  ```
- **PASS 조건:**
  - `NavItemBadgeConfig` 타입 정의 1 hit 이상
  - 두 개 union 멤버 (`count`, `count-with-action`) 모두 hit
- **부가 검증:** `badgeLinkHref` prop이 어떤 컴포넌트에도 남아있지 않음
  ```bash
  grep -rn "badgeLinkHref" apps/frontend
  # → 0 hit
  ```
- **근거:** Phase 1 — optional prop 분기 silent break를 명시적 union으로 교체

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

#### S1 — ESLint nested interactive rule 활성화

- **명령:** `pnpm --filter frontend run lint`
- **또는 (custom rule):** `scripts/eslint-rules/no-link-in-link.cjs` 존재 + 활성화
- **PASS 조건:** lint exit 0, 본 rule 위반 0건
- **실패 시 조치:** tech-debt-tracker.md에 "Polymorphic Link 인식 자동화 검증 필요" 항목 추가

#### S2 — verify 스킬 갱신

- **명령:** `grep -nE "no-link-in-link|nested.*interactive|sibling anchor" .claude/skills/verify-frontend-state/SKILL.md .claude/skills/verify-nav-patterns/SKILL.md 2>/dev/null`
- **PASS 조건:** 1 hit 이상
- **근거:** 향후 같은 패턴 작업 시 자동 검증 트리거

#### S3 — frontend-patterns.md 섹션 추가

- **명령:** `grep -nE "^### Row with Secondary Action" docs/references/frontend-patterns.md`
- **PASS 조건:** 1 hit 이상
- **근거:** 패턴 SSOT 문서화

#### S4 — collapsed 모드 시각 회귀 부재 (스크린샷 비교)

- **검증 방법:** Playwright `toHaveScreenshot` 비교 또는 수동 확인
- **PASS 조건:** sidebar collapsed 시 dot indicator 위치/색상 변경 없음
- **실패 시 조치:** 디자인 토큰 회귀로 분류, tech-debt 등록

---

## 적용 verify 스킬

- **의무:** `verify-design-tokens` (디자인 토큰 SSOT 경유 확인)
- **의무:** `verify-ssot` (discriminated union + nav-config SSOT)
- **의무:** `verify-i18n` (M7과 보완)
- **의무:** `verify-frontend-state` 또는 신규 `verify-nav-patterns` (interactive nesting 검사)
- **권장:** `review-architecture` (Phase 1/2 컴포넌트 추출 결정 검토)
- **권장:** `verify-implementation` (Phase 2의 caller 정합 확인)

---

## 종료 조건

- **MUST 9개 전체 PASS** → 성공 (loop 종료)
- **동일 MUST 항목 2회 연속 FAIL** → 설계 문제, 수동 개입 요청
- **3회 반복 초과** → 수동 개입 요청
- **SHOULD 실패** → 종료 조건에 영향 없음, tech-debt-tracker.md 기록

## 위험 / 차단 요인

- **Polymorphic Link 인식**: jsx-a11y `no-nested-interactive`가 next/link Link 컴포넌트를 anchor로 자동 인식하지 못할 가능성 → S1 fallback 필요. Phase 4에서 실측 후 결정 (tech-debt 등록 가능)
- **모바일 보조 동선 부재**: 본 작업에서 모바일은 단순 count 배지만 유지. yourTurn 진입을 모바일에서도 원하면 별 PR (long-press 메뉴 또는 추가 라우트). UX 결정 필요
- **collapsed 모드 보조 액션**: 시각 공간 부족으로 미제공 — 사용자 동선상 collapsed 사용자는 expanded로 토글 후 yourTurn 클릭 (수용 가능 UX)

## 변경 대상 외 영역 (out of scope)

- 모바일 보조 동선 추가 (별도 PR)
- collapsed 모드 보조 액션 (디자인 결정상 미적용)
- NavBadge critical variant 재설계 (현재 사용처 없음)
- 다른 list/table row의 보조 액션 패턴 마이그레이션 (기회는 있으나 본 작업 범위 외)
- ESLint custom rule 외 규칙 도입
