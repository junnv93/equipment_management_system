# Primitives / 3-way 동기화 / Brand Color — verify-design-tokens references

> 2026-05-03 verify-design-tokens 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> EASING_CSS_VARS 3자 동기화 / globals.css @theme 3-way / hex 하드코딩 / BRAND_CLASS_MATRIX 3곳 / dark prefix 금지 / 동적 보간 금지 / FOCUS_TOKENS.ringCurrent.

---

## Step 9: EASING_CSS_VARS 3자 동기화

globals.css / primitives.ts / motion.ts 3곳의 easing 수가 동일한지 (현재 7개) 확인.

```bash
GLOBALS_COUNT=$(grep -c "^\s*--ease-" apps/frontend/styles/globals.css)
PRIMITIVES_COUNT=$(grep -c "cubic-bezier(" apps/frontend/lib/design-tokens/primitives.ts)
MOTION_COUNT=$(grep -c "'var(--ease-" apps/frontend/lib/design-tokens/motion.ts)

echo "globals.css: $GLOBALS_COUNT, primitives.ts: $PRIMITIVES_COUNT, motion.ts: $MOTION_COUNT"

if [ "$GLOBALS_COUNT" -eq "$PRIMITIVES_COUNT" ] && [ "$PRIMITIVES_COUNT" -eq "$MOTION_COUNT" ]; then
  echo "PASS: 3자 동기화 일치 ($GLOBALS_COUNT개)"
else
  echo "FAIL: 수 불일치 — drift 발생"
fi
```

SSOT 체인: `primitives.ts` → `globals.css` → `motion.ts` (현재 7개).

**PASS:** 3개 수 동일. **FAIL:** drift → 누락된 곳에 easing 추가.

---

## Step 12: globals.css @theme ↔ primitives.ts 3-way 동기화

Tailwind v4 CSS-first 아키텍처에서 `globals.css @theme` 블록의 CSS 변수 값이
`primitives.ts` 숫자 상수와 일치해야 한다.
불일치 시 `MICRO_TYPO.badge = 'text-2xs'` 같은 named utility가 primitives 값과 **조용히 어긋난다**.

**검사 대상 (78-1 추가, 2026-04-21 / 78-7 stepDot / 78-8 xs-tight+sm-tight / 79차 sm-wide 추가):**

| CSS 변수 | globals.css 기대값 | primitives.ts SSOT |
|---|---|---|
| `--text-2xs` | `0.625rem` (10px) | `TYPOGRAPHY_PRIMITIVES['2xs'].mobile === 10` |
| `--text-xs-tight` | `0.6875rem` (11px) | `TYPOGRAPHY_PRIMITIVES['xs-tight'].mobile === 11` |
| `--text-sm-tight` | `0.8125rem` (13px) | `TYPOGRAPHY_PRIMITIVES['sm-tight'].mobile === 13` |
| `--text-sm-wide` | `0.9375rem` (15px) | `TYPOGRAPHY_PRIMITIVES['sm-wide'].mobile === 15` |
| `--spacing-hairline` | `3px` | `WIDTH_PRIMITIVES.hairline === 3` |
| `--spacing-pagination` | `30px` | `SIZE_PRIMITIVES.pagination === 30` |
| `--spacing-step-dot` | `14px` | `WIDTH_PRIMITIVES.stepDot === 14` |

```bash
# globals.css에서 7개 변수 값 추출
grep -E "(--text-2xs|--text-xs-tight|--text-sm-tight|--text-sm-wide|--spacing-hairline|--spacing-pagination|--spacing-step-dot)" \
  apps/frontend/styles/globals.css

# primitives.ts에서 대응 상수 값 확인
grep -E "('2xs'|'xs-tight'|'sm-tight'|'sm-wide'|hairline|pagination|stepDot)" \
  apps/frontend/lib/design-tokens/primitives.ts
```

**PASS:** 각 CSS 변수 값이 primitives.ts 숫자와 단위 변환 후 일치.
**FAIL:** 불일치 시 primitives.ts를 SSOT로 간주하고 globals.css 값을 수정.

**MICRO_TYPO ↔ @theme 변수명 일치 검사 (3-way 마지막 단계):**

```bash
# MICRO_TYPO 토큰 값 확인 (text-2xs, text-xs-tight, text-sm-tight, text-sm-wide 등)
grep -A 15 "^export const MICRO_TYPO" apps/frontend/lib/design-tokens/semantic.ts

# @theme에 해당 변수들이 등록되어 있는지 확인
grep -E "(--text-2xs|--text-xs-tight|--text-sm-tight|--text-sm-wide)" apps/frontend/styles/globals.css
```

현재 `MICRO_TYPO` 멤버 (79차 기준):
- `badge`, `label` → `text-2xs` (--text-2xs, 10px)
- `caption` → `text-xs` (Tailwind 기본, 12px)
- `meta` → `text-xs-tight` (--text-xs-tight, 11px)
- `detail` → `text-sm-tight` (--text-sm-tight, 13px)
- `siteTitle` → `text-sm-wide` (--text-sm-wide, 15px) — **79차 신규**

**PASS:** 모든 변수 일치. **FAIL:** 불일치 → primitives.ts 숫자 또는 globals.css 값 수정.

---

## Step 17: hex 색상 직접 하드코딩 감지 (AP-01·AP-04)

**대상**: `apps/frontend/components/checkouts/**/*.{ts,tsx}`

```bash
node scripts/self-audit.mjs --all 2>&1 | grep "⑨ hex"
```

**PASS**: 출력 없음 (위반 0건)
**FAIL**: `[⑨ hex 색상]` 항목 출력 → `BRAND_CLASS_MATRIX` 또는 Tailwind semantic token으로 교체

**예외**: JSDoc `/* */` 주석, `:root{}` CSS 변수 정의 블록 내 hex는 자동 제외됨

---

## Step 20: BRAND_CLASS_MATRIX 신규 색상 추가 — 3곳 동시 갱신

`BRAND_COLORS_HEX`에 새 색상 키를 추가할 때 아래 3곳이 반드시 **동시에** 갱신되어야 한다.
하나라도 누락되면 Tailwind 클래스 미존재 또는 타입 에러(`satisfies` 위반)가 발생한다.

| 위치 | 추가 내용 | 위반 유형 |
|---|---|---|
| `brand.ts` `BRAND_COLORS_HEX` | `key: '#hexvalue'` | 기준점(SSOT 원본) |
| `brand.ts` `BRAND_CLASS_MATRIX` | 8개 변형 `BrandClassSet` 전체 | TypeScript `satisfies` 에러 |
| `globals.css` `:root` / `.dark` | `--brand-color-<key>` HSL 채널값 (2곳) | Tailwind 클래스 런타임 오작동 |

**탐지:**
```bash
# BRAND_COLORS_HEX 키 목록 추출
grep -oP "^\s+\K\w+(?=: '#)" apps/frontend/lib/design-tokens/brand.ts | head -20

# BRAND_CLASS_MATRIX satisfies 제약 존재 확인
grep -c "satisfies Record<SemanticColorKey, BrandClassSet>" \
  apps/frontend/lib/design-tokens/brand.ts
# → 1건 (satisfies 제약 존재)

# globals.css :root와 .dark 양쪽에 --brand-color-<key> 존재 확인
# 현재 BRAND_COLORS_HEX 키: ok/warning/critical/info/neutral/purple/repair/temporary/progress/archive
for key in ok warning critical info neutral purple repair temporary progress archive; do
  count=$(grep -c "\-\-brand-color-${key}" apps/frontend/styles/globals.css)
  [ "$count" -lt 2 ] && echo "MISSING or single-occurrence: --brand-color-${key} (found: ${count})"
done
```

**PASS:** `BRAND_CLASS_MATRIX`에 `satisfies Record<SemanticColorKey, BrandClassSet>` 존재 + 모든 `BRAND_COLORS_HEX` 키가 `globals.css` `:root`/`.dark` 양쪽에 정의됨.
**FAIL:** `satisfies` 미존재 또는 CSS 변수 누락 → 3곳 동시 갱신.

**예외:** `BRAND_COLORS_HEX` 자체가 hex 참조값이므로 CSS 변수와 hex 값이 동일 색상을 표현해야 함. 다크모드 밝기 보정은 `.dark` 블록에서만 허용.

---

## Step 21: design-token 파일 내 dark: prefix in brand token 금지

`apps/frontend/lib/design-tokens/components/*.ts` 파일 내 brand 토큰 정의에서
`dark:bg-brand-*`, `dark:text-brand-*`, `dark:border-brand-*` 패턴 사용 금지.

**근거:** brand CSS 변수(예: `--color-brand-ok`)는 `globals.css`의 `:root`와 `.dark` 블록에서
각각 다른 HSL 값으로 정의된다. Tailwind `bg-brand-ok` 클래스는 이 CSS 변수를 참조하므로
다크모드에서 자동으로 전환된다. `dark:bg-brand-ok`를 중복 선언하면 의도치 않게 고정 색상이
적용되어 정상 전환이 방해된다.

```bash
# design-token components 파일 내 dark:bg-brand-*, dark:text-brand-*, dark:border-brand-* 탐지
grep -rn "dark:bg-brand-\|dark:text-brand-\|dark:border-brand-" \
  apps/frontend/lib/design-tokens/components/ \
  --include="*.ts"
# → 0건 (단, 예외 파일 제외)
```

**PASS:** 0건. **FAIL:** `dark:bg-brand-*` 등 발견 → `dark:` prefix 제거 (CSS 변수가 자동 전환).

**예외 (허용):**
- CSS 변수가 아닌 **Tailwind 커스텀 색상**(`ul-midnight`, `ul-fog`, `ul-white` 등)과 brand CSS 변수의 조합 — 라이트/다크 모드에서 **완전히 다른 색상 계열**을 써야 하는 경우.
  예: `'text-ul-midnight dark:text-brand-info'`, `'data-[state=active]:bg-ul-midnight dark:data-[state=active]:bg-brand-info'`
  판별 기준: 라이트 모드 값이 `ul-*` 같은 non-CSS-var 커스텀 색상이고 다크 모드 값이 brand CSS 변수로 **대체**되는 경우.
- `dark:border-brand-*` — CSS 변수 기반이지만 투명도(opacity modifier) 없이 고정값으로 필요한 경우

---

## Step 22: CALLOUT_TOKENS text-brand-${} 동적 보간 금지

`design-tokens/components/*.ts` 파일 내에서 템플릿 리터럴로 brand 클래스를 동적 보간하는 패턴
(`text-brand-${key}`, `bg-brand-${key}`) 은 Tailwind의 JIT 퍼지(purge) 단계에서 클래스가
정적으로 감지되지 않아 빌드에서 제거될 수 있다. 반드시 `getSemanticContainerTextClasses(key)`
같은 헬퍼 함수를 경유해야 한다.

```typescript
// ❌ 금지 — 동적 보간 (Tailwind purge에서 삭제될 수 있음)
const textClass = `text-brand-${colorKey}`;

// ✅ 허용 — 헬퍼 경유 (brand.ts 함수가 static 클래스 반환)
const textClass = getSemanticContainerTextClasses(colorKey);
```

```bash
# design-token 파일 내 text-brand-${} / bg-brand-${} 동적 보간 탐지
grep -rn "text-brand-\${\|bg-brand-\${\|border-brand-\${" \
  apps/frontend/lib/design-tokens/ \
  --include="*.ts"
# → 0건

# 컴포넌트/훅 파일에서도 동일 패턴 탐지
grep -rn "text-brand-\${\|bg-brand-\${\|border-brand-\${" \
  apps/frontend/components apps/frontend/app apps/frontend/hooks \
  --include="*.tsx" --include="*.ts"
# → 0건
```

**PASS:** 동적 보간 0건. **FAIL:** 발견 시 `getSemanticContainerTextClasses(key)` 또는 정적 토큰 맵으로 교체.

**예외:** `globals.css`나 CSS 모듈 내 CSS 변수 참조 (`var(--brand-color-${...})`)는 CSS 빌드 단계에서 처리되므로 해당 없음.

**Related Files:**
- `apps/frontend/lib/design-tokens/brand.ts` — `getSemanticContainerTextClasses`, `getSemanticBadgeClasses` 등 헬퍼
- `apps/frontend/lib/design-tokens/components/checkout-icons.ts` — Lucide 아이콘 SSOT (brand 클래스 없음)

---

## Step 30: FOCUS_TOKENS.ringCurrent — 스테퍼 현재 단계 링 하드코딩 탐지

`semantic.ts`의 `FOCUS_TOKENS.ringCurrent`가 "현재 단계(current step)" 강조 링의 SSOT.
`ring-2 ring-brand-info ring-offset-2`를 컴포넌트에서 직접 조합하면 brand 색상 변경 시 drift 발생.

**탐지:**
```bash
# 현재 단계 링 클래스 인라인 직접 조합 탐지 — focus-visible: prefix 없는 패턴만 (의도적 키보드 포커스 링 제외)
grep -rn "ring-2.*ring-brand-info\|ring-brand-info.*ring-2" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "design-tokens\|focus-visible:\|// \|node_modules"
```

**PASS:** 0건 (`FOCUS_TOKENS.ringCurrent` 경유). **FAIL:** 인라인 ring 조합 발견 시 `FOCUS_TOKENS.ringCurrent`로 교체.

**예외:** `focus-visible:ring-2 focus-visible:ring-brand-info` — 키보드 포커스 링 (접근성 목적, `FOCUS_TOKENS.classes.*` 경유 권장이나 인라인 허용).

**배경:** Sprint 2.6(2026-04-26)에서 스테퍼 `current.node` 클래스가 `FOCUS_TOKENS.ringCurrent`로 통일.
`focus-visible:` prefix 없음 — `FOCUS_TOKENS.classes.*`와 혼용 주의.

**관련 파일:**
- `apps/frontend/lib/design-tokens/semantic.ts` — `FOCUS_TOKENS.ringCurrent` 정의 (최상위, `classes` 블록 외부)
- `apps/frontend/lib/design-tokens/components/checkout.ts` — `CHECKOUT_STEPPER_TOKENS` 소비처
