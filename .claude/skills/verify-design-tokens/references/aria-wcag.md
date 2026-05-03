# ARIA / WCAG / focus / roles — verify-design-tokens references

> 2026-05-03 verify-design-tokens 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> focus-visible / Collapsible / rAF guard / role=alert 금지 / WAI-ARIA grid / AlertBanner severity / tablist / Button outline / Dialog ARIA / nav list.

---

## Step 2: focus-visible 우선

shadcn/ui와 SkipLink 제외 모든 컴포넌트에서 `focus-visible:` 사용 확인.

```bash
grep -rn "focus:ring\|focus:outline\|focus:bg\|focus:text" \
  apps/frontend/components apps/frontend/app --include="*.tsx" \
  | grep -v "apps/frontend/components/ui/\|SkipLink"
```

```tsx
// ❌ WRONG
className="focus:ring-2 focus:ring-primary"

// ✅ CORRECT
className="focus-visible:ring-2 focus-visible:ring-primary"

// ✅ CORRECT - Design Token 사용
className={FOCUS_TOKENS.classes.default}
```

**PASS:** `focus:ring`/`focus:outline`/`focus:bg`/`focus:text` 0개.
**FAIL:** `focus-visible:` 변경.

> `focus:text-destructive` (DropdownMenuItem destructive 아이템)도 탐지 대상 — Step 32의 MENU_ITEM_TOKENS 처방과 함께 적용.

---

## Step 14: Collapsible/Disclosure button WCAG 2.1 패턴

`button[aria-expanded]`는 WCAG 2.1 Disclosure 패턴 상 반드시 `aria-controls`와 쌍을 이루어야 한다.
`aria-controls` 값은 열고/닫는 콘텐츠 영역의 `id`와 일치해야 한다.

이번 세션(78차2)에서 `NCDetailClient.tsx`의 `CollapsibleSection`에 `contentId` prop + `aria-controls={contentId}` + `id={contentId}` 패턴이 도입됨.
2026-04-27 세션: `DashboardShell.tsx` 사이드바 토글 `<Button>`에 `aria-controls="desktop-sidebar"` + `<aside id="desktop-sidebar">` 패턴 추가.

```bash
# aria-expanded는 있지만 aria-controls가 없는 button/Button 탐지
grep -rn "aria-expanded" apps/frontend/components apps/frontend/app \
  --include="*.tsx" -l | while read f; do
  node -e "
    const fs = require('fs');
    const content = fs.readFileSync('$f', 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('aria-expanded') && !line.includes('aria-controls')) {
        const ctx = lines.slice(Math.max(0,i-4), i+5).join(' ');
        const hasButton = ctx.includes('<button') || ctx.includes('<Button');
        if (hasButton && !ctx.includes('aria-controls')) {
          console.log('$f:' + (i+1) + ': aria-expanded without aria-controls');
        }
      }
    });
  " 2>/dev/null
done
```

```bash
# aria-controls 값과 id 일치 확인
grep -rn "aria-controls" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" \
  | grep -v "shadcn\|node_modules\|/ui/" \
  | grep -oP 'aria-controls=["\x27]\K[^"\']+' \
  | sort -u
# 주요 검사: "desktop-sidebar" → DashboardShell.tsx <aside id="desktop-sidebar">
grep -rn 'id="desktop-sidebar"' apps/frontend/components/ --include="*.tsx"
# → 1건 (PASS)
```

**PASS:** `aria-expanded`가 있는 모든 button/Button에 `aria-controls` 존재. 값이 같은 파일 내 `id` 속성과 일치.
**FAIL:** `aria-expanded` 단독 사용 → `contentId` prop 또는 인라인 `aria-controls` 추가.

**올바른 패턴:**
```tsx
// ✅ shadcn/ui <Button> 컴포넌트 — aria-controls 명시
<Button
  aria-expanded={!isCollapsed}
  aria-controls="desktop-sidebar"
  onClick={toggleSidebar}
/>
<aside id="desktop-sidebar" ...>
  ...
</aside>

// ✅ CollapsibleSection prop 패턴
<CollapsibleSection
  contentId="nc-findings"
>
  <div id="nc-findings">...</div>
</CollapsibleSection>
```

**예외:** `aria-expanded`가 외부 라이브러리(shadcn/ui Accordion, Collapsible)에서 관리되는 경우 — 라이브러리가 `aria-controls`를 자동 주입하므로 제외.

---

## Step 14b: `requestAnimationFrame` + ref focus transfer null guard

배너/모달 닫기 후 WCAG 2.1 SC 2.4.3 포커스 이전 패턴에서 null guard 누락 시 런타임 에러.

```bash
# requestAnimationFrame 내 focus 호출 위치 확인
grep -n "requestAnimationFrame" apps/frontend/components/**/*.tsx apps/frontend/app/**/*.tsx 2>/dev/null
```

각 결과에서 내부 `.focus()` 호출 앞에 `?.` optional chaining 또는 `if (el)` null guard 존재 여부 확인.

**PASS:** 모든 `rAF` 내 focus 호출에 null guard 존재. **FAIL:** `el.focus()` bare 호출 → `el?.focus()` 또는 `if (el) el.focus()` 교체.

---

## Step 31: callout/aside 요소 `role="alert"` 금지 — `role="status"` 강제

**원칙:** `role="alert"`는 스크린리더가 포커스 위치를 무시하고 즉시 읽음 (assertive). 상태 변경 안내용 callout에 이를 사용하면 페이지 포커스 이동 + 라이브 리전 이중 읽기가 발생한다.

**규칙:**
- 상태 안내 callout/banner(`<aside>`, 안내 패널): `role="status"` + `aria-live="polite"` 필수
- `role="alert"`: AlertDialog 파괴적 작업 확인(삭제 confirm) 전용

```bash
# callout/aside 컴포넌트에 role="alert" 직접 사용 탐지
grep -rn 'role="alert"' \
  apps/frontend/components/non-conformances \
  apps/frontend/components/checkouts \
  apps/frontend/components/approvals \
  --include="*.tsx" \
  | grep -v "AlertDialog\|AlertDialogContent\|// \|node_modules"
```

**PASS:** 0건 (callout은 모두 `role="status"` 사용). **FAIL:** callout/안내 패널에서 `role="alert"` 발견 시 `role="status"` + `aria-live="polite"` 로 교체.

**예외:**
- `<AlertDialog>`, `<AlertDialogContent>` 컴포넌트 내부 — Radix UI 구조상 허용
- 즉각적 에러 알림(form 제출 실패, 네트워크 오류 등) — `role="alert"` 허용
- `AlertBanner.tsx` — severity-conditional role 패턴 (Step 38): `critical/warning → role="alert"`, `info/none → role="status"`.

**배경:** `GuidanceCallout`이 조건부 `role="alert"/"status"` → 항상 `role="status"` 로 통일. 페이지 진입 시 h2 포커스 + aria-live 이중 읽기 제거.

---

## Step 34: WAI-ARIA grid 패턴 — `role="grid" > role="row" > role="gridcell"` 3단계 일관성

`CheckoutGroupCard`처럼 비표준 div 기반 그리드(`display: grid`)를 테이블처럼 탐색해야 하는 컴포넌트는
WAI-ARIA 명세의 `grid → row → gridcell` 3단계 역할 계층을 반드시 준수해야 한다.

```bash
# role="grid"가 있는 컴포넌트에서 role="row" 미사용 탐지
grep -rln "role=\"grid\"" apps/frontend/components/ --include="*.tsx" \
  | grep -v "ui/" \
  | while read f; do
      if ! grep -q 'role="row"' "$f"; then
        echo "MISSING role=row in: $f"
      fi
    done

# role="grid"가 있는 컴포넌트에서 role="gridcell" 미사용 탐지
grep -rln "role=\"grid\"" apps/frontend/components/ --include="*.tsx" \
  | grep -v "ui/" \
  | while read f; do
      if ! grep -q 'role="gridcell"' "$f"; then
        echo "MISSING role=gridcell in: $f"
      fi
    done
```

**PASS:** `role="grid"` 선언 컴포넌트 모두 `role="row"` + `role="gridcell"` 동시 존재.
**FAIL:** 3단계 중 하나라도 누락 → 부모부터 순서대로 `role="grid" > role="row" > role="gridcell"` 추가.

**예외:**
- shadcn/ui의 `<Table>` 컴포넌트 — HTML 네이티브 `<table>/<tr>/<td>` 사용, 별도 `role` 불필요
- `EquipmentTable.tsx` — HTML `<Table>` 내부에 `role="grid"` 추가 + `role="row"/"gridcell"` 명시 패턴

**관련 파일:**
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — Sprint 4.2 도입, div-based grid + ARIA 3단계
- `apps/frontend/components/equipment/EquipmentTable.tsx` — 기존 참고 구현

---

## Step 38: AlertBanner severity → ARIA role 분기 패턴 준수

`AlertBanner.tsx`는 severity에 따라 `role="alert"` (assertive) 또는 `role="status"` (polite)를 동적으로 선택한다.
WCAG SC 4.1.3 Status Messages: 긴급 상태(critical/warning)는 assertive, 정보성(info/none)은 polite.

**규칙:**
```
severity === 'critical' | 'warning' → role="alert"   (스크린리더 즉시 읽기, assertive)
severity === 'info'     | 'none'    → role="status"   (스크린리더 순서 읽기, polite)
```

```bash
# AlertBanner에 정적 role="status" 고정(severity 분기 미적용) 탐지
grep -n 'role="status"' apps/frontend/components/dashboard/AlertBanner.tsx \
  | grep -v "ariaRole\|severity"
# 결과: 0건 → 조건부 분기 사용 중 (PASS)

# 분기 로직 존재 여부 확인
grep -n "ariaRole\|severity.*alert\|alert.*severity" \
  apps/frontend/components/dashboard/AlertBanner.tsx | head -5
```

**PASS:** `const ariaRole = severity === 'info' || severity === 'none' ? 'status' : 'alert'` 형태의 분기 존재.
**FAIL:** 정적 `role="status"` 또는 `role="alert"` 하드코딩 → severity 기반 조건부 분기로 교체.

**예외:**
- Step 31의 GuidanceCallout 등 정적 안내 패널 — 항상 `role="status"` 유지 (이 Step 대상 아님).

**배경:** 대시보드 AlertBanner가 `role="status"` 고정 → critical 경보도 스크린리더가 순서 읽기로 처리하는 접근성 버그 발견. 2026-04-27.

**Related Files:**
- `apps/frontend/components/dashboard/AlertBanner.tsx` — severity-conditional ariaRole 소비처

---

## Step 41: 단일 `role="tablist"` + `className="contents"` ARIA tablist 패턴

여러 섹션으로 나뉜 탭 목록을 렌더링할 때, `role="tablist"`는 **반드시 단일 wrapper에만** 적용해야 한다.
`map()` 내부에서 각 섹션마다 `role="tablist"`를 생성하면 ARIA 트리에 N개의 독립 tablist가 생겨 스크린리더가 탭 관계를 파악하지 못한다.

**올바른 패턴: CSS `display: contents` + `role="presentation"` 분리자/라벨**

```tsx
// ❌ N개 tablist — 스크린리더 탭 관계 파악 불가
{sections.map(section => (
  <div key={section} role="tablist">
    {tabs.map(tab => <button role="tab">)}
  </div>
))}

// ✅ 단일 tablist — contents wrapper로 시각/ARIA 분리
<div role="tablist" aria-orientation="vertical">
  {sections.map((section, i) => (
    <div key={section} className="contents">           {/* CSS display:contents — ARIA 투명 */}
      {i > 0 && <div className={tokens.divider} role="presentation" />}
      <div className={tokens.sectionLabel} role="presentation">
        {sectionName}
      </div>
      {tabs.map(tab => <button role="tab" aria-selected={isActive}>)}
    </div>
  ))}
</div>
```

```bash
# 복수 tablist 탐지 (map 내부 role="tablist")
grep -n 'role="tablist"' apps/frontend/components/**/*.tsx 2>/dev/null \
  | awk -F: '{file=$1; line=$2} {print file}' | sort | uniq -d
# → 동일 파일에 2+ tablist가 있으면 map 내부 중복 의심

# className="contents" 없이 tablist 하위 래퍼 탐지
grep -n 'role="tablist"' apps/frontend/components/**/*.tsx 2>/dev/null
```

**PASS:** 컴포넌트 당 `role="tablist"` 1건. **FAIL:** 같은 파일 2+ tablist → 단일 wrapper로 통합.

**배경:** `ApprovalCategorySidebar.tsx` AP-04에서 `className="contents"` + `role="presentation"` 패턴으로 WAI-ARIA Tabs 패턴 준수. 2026-04-27.

**예외:**
- 완전히 독립된 별개의 tab UI가 한 컴포넌트에 존재하는 경우 — 의도적 복수 tablist 허용. 주석 필수.

---

## Step 46: Button base cva `focus-visible:outline-*` 패턴 — ring-offset 회귀 방지

`apps/frontend/components/ui/button.tsx`의 base cva는 shadcn/ui 기본 패턴(`focus-visible:ring-2 ring-offset-2`)에서
outline 기반(`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`)으로 전환됨.

이 파일은 `components/ui/` 예외로 Step 2 탐지에서 제외되므로, 별도 게이트로 보호.

**왜 보호가 필요한가**:
- shadcn/ui CLI 업데이트 또는 다른 세션에서 button.tsx를 덮어쓰면 base cva가 shadcn 기본 패턴으로 원복.
- `SURFACE_INLINE_ACTION_TOKENS.base`도 `focus-visible:outline-*` 통일 — 두 곳이 동일 패턴이어야 inline action button과 일반 button의 focus 링이 일치.

```bash
# button base cva에 ring-2 ring-offset-2 패턴 잔존 탐지 (FAIL 패턴)
grep -n "focus-visible:ring-2\|ring-offset-2\|focus-visible:ring-offset" \
  apps/frontend/components/ui/button.tsx
# 기대: 0 hits

# 현재 button base cva에 outline 패턴 존재 확인 (PASS 양성 검증)
grep -n "focus-visible:outline-2.*outline-offset-2.*outline-ring" \
  apps/frontend/components/ui/button.tsx
# 기대: 1 hit
```

**PASS:**
- `focus-visible:ring-2` / `ring-offset-2` / `focus-visible:ring-offset` 0건
- `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` 1건 이상

**FAIL:**
- `focus-visible:ring-2 ring-offset-2` 재도입 → outline 패턴으로 교체.

**예외:**
- `buttonVariants`의 개별 `variant` 문자열 — base cva가 아닌 variant별 추가 스타일. base만 검사.
- `ring-offset-ul-midnight` 등 특수 목적 offset override — button.tsx 자체만 대상.

**관련 파일:**
- `apps/frontend/components/ui/button.tsx` — base cva (outline focus 전환 파일)
- `apps/frontend/lib/design-tokens/semantic.ts` — `SURFACE_INLINE_ACTION_TOKENS.base` (동일 패턴 SSOT)

**발생 이력 (2026-04-28)**: NextStepPanel compact 영역에서 button focus 링이 행 외곽으로 새는 glow를 만들었던 사건의 근본 수정.

---

## Step 48: ConnectionBanner kind→role 동적 분기 — kind별 role/ariaLive 일관성

**원칙:** `ConnectionBanner`는 `BannerSpec.role` 필드로 동적 ARIA role을 결정.
`offline`(critical) → `role="alert"` + `aria-live="assertive"`,
`sw-update`(informational) → `role="status"` + `aria-live="polite"`.
role을 렌더 시 정적으로 하드코딩하면 의미 불일치 발생. (WCAG 4.1.3)

```bash
# BannerSpec interface에 role 필드 존재 확인
grep -n "role:" \
  apps/frontend/components/layout/connection-banner.tsx

# offline BannerSpec에 role: 'alert' 할당 확인
grep -A 5 "kind: 'offline'" \
  apps/frontend/components/layout/connection-banner.tsx

# sw-update BannerSpec에 role: 'status' 할당 확인
grep -A 5 "kind: 'sw-update'" \
  apps/frontend/components/layout/connection-banner.tsx

# 렌더에서 정적 role="status" 하드코딩 0건 확인 (동적 banner.role 사용)
grep -n 'role="status"\|role="alert"' \
  apps/frontend/components/layout/connection-banner.tsx
```

**PASS:**
- `BannerSpec` interface에 `role: 'alert' | 'status'` 필드 존재
- offline → `role: 'alert'`, sw-update → `role: 'status'`
- 렌더에서 `role={banner.role}` 동적 참조 (정적 문자열 하드코딩 0건)

**FAIL:**
- `role="status"` 정적 하드코딩 + `aria-live="assertive"` 조합 (의미 불일치)
- `BannerSpec`에 role 필드 없이 렌더 단에서 조건 분기

**예외:** Step 31의 `role="alert"` 금지 범위는 callout/aside 정적 컴포넌트. ConnectionBanner는 시스템 신호 기반 동적 배너이므로 offline=alert 패턴 허용.

**관련 파일:**
- `apps/frontend/components/layout/connection-banner.tsx` — BannerSpec interface + 렌더

---

## Step 49: Dialog 내 필수 입력 검증 ARIA 패턴

**원칙:** 다이얼로그 내 필수 `<Textarea>` / `<Input>`에는 4가지 ARIA 속성이 함께 구현되어야 한다.

| 속성 | 값 | 목적 |
|------|-----|------|
| `aria-required="true"` | 고정 | 필수 필드 표시 |
| `aria-invalid={isInvalid}` | 동적 | 검증 실패 상태 알림 |
| `aria-describedby` | 동적 (errorId \| hintId) | 에러/힌트 연결 |
| 에러 `<p>` | `role="alert" aria-live="assertive"` | 에러 즉시 인터럽트 |

**`touched` 패턴** — blur 전에는 에러 미표시:
```typescript
// ✅ CORRECT
const [touched, setTouched] = useState(false);
const isInvalid = touched && value.trim().length === 0;

<Textarea
  aria-required="true"
  aria-invalid={isInvalid}
  aria-describedby={isInvalid ? errorId : hintId}
  onBlur={() => setTouched(true)}
/>
{isInvalid && (
  <p id={errorId} role="alert" aria-live="assertive">
    {t('reasonRequired')}
  </p>
)}
{!isInvalid && (
  <p id={hintId}>{t('reasonHint')}</p>
)}
```

**confirm 버튼 disabled** — touched 가드 없이 필드 비어있으면 항상 비활성화:
```typescript
// ✅ CORRECT — 초기 상태부터 비활성화
disabled={isPending || !value.trim()}

// ❌ WRONG — touched 가드로 초기 상태에서 버튼 활성화
disabled={isPending || (touched && !value.trim())}
```

```bash
# Dialog 내 required textarea에 aria-required 누락 탐지
grep -rn "aria-required\|aria-invalid\|role=\"alert\"" \
  apps/frontend/app apps/frontend/components \
  --include="*.tsx" | grep -i "dialog\|modal" | head -10

# required textarea에 disabled가 touched 가드로 오판되는지 확인
grep -rn "touched &&.*!.*trim\|touched && !value" \
  apps/frontend --include="*.tsx"
```

**PASS:**
- 필수 textarea: `aria-required="true"` + `aria-invalid` + `aria-describedby` 3종 세트
- 에러 `<p>`: `role="alert" aria-live="assertive"` (role="status" 아님)
- confirm disabled: `!value.trim()` (touched 가드 없음)

**FAIL:**
- `aria-required` 누락 → 스크린리더 필수 미표시
- 에러 `<p>` `role="status"` 사용 → polite 인터럽트로 에러 전달 지연
- `disabled={isPending || (touched && !value.trim())}` → 초기 상태 버튼 활성화

**예외:** optional 코멘트 필드(approve 다이얼로그 등)는 `aria-required` 불필요.

**관련 파일:**
- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationRejectDialog.tsx` — 참조 구현
- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationApproveDialog.tsx` — optional 코멘트 char count 패턴

---

## Step 50: 내비게이션 리스트 시맨틱 — `<ul role="list">` + `<li>` 패턴

Safari VoiceOver는 `list-style: none` (Tailwind `list-none`)이 적용된 `<ul>` 요소에서
**list semantics를 자동으로 제거**한다. 내비게이션 링크 목록을 `<div>` 컨테이너나 `list-none` `<ul>`로
렌더하면 스크린리더 사용자에게 "목록 내 N개 항목"으로 안내되지 않는다. WCAG 1.3.1 위반.

**올바른 패턴 (MobileNav.tsx 기준):**

```tsx
// ✅ CORRECT — list-none 에도 불구하고 role="list"로 VoiceOver 보존
<ul className="flex flex-col gap-1 list-none" role="list">
  {section.items.map(item => (
    <li key={item.href}>
      <NavLink href={item.href} icon={item.icon} label={item.label} />
    </li>
  ))}
</ul>

// ❌ WRONG — <div>는 list semantics 없음
<div className="flex flex-col gap-1">
  {section.items.map(item => (
    <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
  ))}
</div>

// ❌ WRONG — <ul>에 role="list" 없이 list-none
<ul className="flex flex-col gap-1 list-none">
  {section.items.map(item => (
    <NavLink key={item.href} ... />   {/* <li> 래핑 없음 */}
  ))}
</ul>
```

**탐지:**

```bash
# 내비게이션 컴포넌트에서 .items.map()을 가진 컨테이너가 <ul role="list">인지 확인
grep -rn "\.items\.map\|navItems\.map\|section\.items" \
  apps/frontend/components/layout --include="*.tsx" -B 3 \
  | grep -v "ul\|<li"
# 결과 존재 시 FAIL

# .map()으로 NavLink/아이템을 직접 렌더하는 <div> 탐지
grep -rn "className.*flex.*flex-col" \
  apps/frontend/components/layout --include="*.tsx" -A 2 \
  | grep -B 1 "\.map(" | grep "<div\b"
# → 0건이어야 PASS
```

**PASS:** 내비게이션 아이템 `.map()` 컨테이너가 `<ul role="list">` + `<li>` 구조.
**FAIL:** `<div>` 직접 렌더 또는 `<ul>` 에 `role="list"` 누락.

**예외:**
- 단일 링크 (반복 없음) — `role="list"` 불필요
- `shadcn/ui` 내부 컴포넌트 (`<NavigationMenuList>` 등) — 라이브러리가 ARIA 처리

**관련 파일:**
- `apps/frontend/components/layout/MobileNav.tsx` — 참조 구현
