# Layer 3 컴포넌트 토큰 + satisfies 가드 — verify-design-tokens references

> 2026-05-03 verify-design-tokens 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> Layer 3 import 경로 / 마이그레이션 / 아키텍처 / visual feedback / 헤더 SSOT / Tailwind v4 / Enum↔Token / dead token / SPACING_RHYTHM / satisfies / ring-dashed / checkout-toast / loading-skeleton / CSS 변수 fallback / 사전생성 룩업 / NC compact dot / JSX 인라인 brand / cross-domain / compact 컨테이너 / workflow 토큰.

---

## Step 3: Layer 3 함수 import 경로 + barrel 직접 서브패스 금지

컴포넌트가 design-tokens 내부 파일을 직접 서브패스로 import하지 않는지 확인.

**금지 패턴:**
- `@/lib/design-tokens/form-field-tokens` 등 서브패스 직접 import
- `@/lib/design-tokens/components/<name>` 직접 import
- `@/lib/design-tokens/semantic`, `@/lib/design-tokens/brand` 등 직접 import

모든 소비처는 반드시 `@/lib/design-tokens` barrel(index.ts) 경유.

```bash
# 서브패스 직접 import 탐지 (0건 기대)
grep -rn "from '@/lib/design-tokens/[^']*'" \
  apps/frontend/components/ apps/frontend/hooks/ apps/frontend/app/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "__tests__\|\.spec\."
# 결과: 0건 (PASS)
```

```tsx
// ❌ WRONG - 내부 파일 직접 import
import { SIZE_PRIMITIVES } from '@/lib/design-tokens/primitives';

// ✅ CORRECT - Public API 사용
import { getHeaderButtonClasses, getHeaderSizeClasses } from '@/lib/design-tokens';
```

**PASS:** 0건. **FAIL:** 서브패스 직접 import 존재 → barrel 경유로 수정 + index.ts에 re-export 추가.

---

## Step 4: 마이그레이션된 컴포넌트 토큰 사용

60개 마이그레이션 컴포넌트에서 design-tokens import 존재 확인.

```bash
bash .claude/skills/verify-design-tokens/scripts/check-migrated.sh
```

전체 목록: [migrated-components.md](migrated-components.md) 참조.

**PASS:** 모든 컴포넌트에 import. **FAIL:** 토큰 미사용 → 재마이그레이션.

---

## Step 5: Layer 3 컴포넌트 토큰 아키텍처 + barrel export

Layer 3 파일이 Layer 2만 참조하는지 + index.ts barrel export 확인.

```bash
grep -rn "from '../primitives'" apps/frontend/lib/design-tokens/components/ --include="*.ts"
```

```typescript
// ❌ WRONG - Layer 3에서 Layer 1 직접 참조
import { SIZE_PRIMITIVES } from '../primitives';

// ✅ CORRECT - Layer 3에서 Layer 2만 참조
import { INTERACTIVE_TOKENS } from '../semantic';
```

면제: `toTailwindSize`, `toTailwindGap` 유틸리티 함수는 Layer 3에서 `../utils` (Layer 1.5) 경유 import 허용. `../primitives` 직접 import는 불허 (2026-04-26 utils.ts 분리 이후).

### Step 5b: Layer 3 컴포넌트 토큰 barrel export 확인

```bash
for f in apps/frontend/lib/design-tokens/components/*.ts; do
  basename=$(basename "$f" .ts)
  if ! grep -q "from './components/$basename'" apps/frontend/lib/design-tokens/index.ts; then
    echo "NOT EXPORTED: $f"
  fi
done
```

**PASS:** primitives 직접 참조 0개. barrel export 누락 0개. **FAIL:** semantic 경유로 변경 또는 primitives 직접 import 잔존.

---

## Step 7: Architecture v3 Visual Feedback + 한국어 label 잔존

### 7a: Architecture v3 배지 패턴

```bash
# getNotificationBadgeClasses 사용 확인
grep -rn "getNotificationBadgeClasses\|getCountBasedUrgency" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|// "
```

```tsx
// ❌ WRONG - urgency 클래스 인라인 직접 조합
<Badge className="bg-red-500 text-white font-bold">{count}</Badge>

// ✅ CORRECT - Architecture v3 위임 패턴
<Badge className={getNotificationBadgeClasses(count)}>{count}</Badge>
```

> `NOTIFICATION_BADGE_VARIANTS` / `getNotificationBadgeVariant`는 2026-04-26에 완전 삭제됨. tsc 컴파일 오류가 재도입 방지 회귀 보호 역할.

### 7b: Urgency 함수 사용

3가지 Urgency 계산 함수:
- `getCountBasedUrgency(count)` — 알림/승인 개수 기반
- `getTimeBasedUrgency(daysUntilDue)` — 기한 기반
- `getStatusBasedUrgency(status)` — 시스템 상태 기반

### 7c: Design Token 한국어 label 필드 잔존

```bash
grep -rn "label: '" apps/frontend/lib/design-tokens/components/ --include="*.ts" \
  | grep -E "[가-힣]"
```

면제: CSS 클래스 문자열인 `label` 필드 (예: `label: 'text-xs text-muted-foreground'`).

---

## Step 8: 페이지 헤더 타이포그래피 SSOT

### 8a: h1 하드코딩

```bash
grep -rn '<h1 className="text-' apps/frontend/app --include="*.tsx" \
  | grep -v "not-found\|error\|components/ui/"
```

### 8b: 부제목 하드코딩

```bash
grep -rn 'className="text-muted-foreground' apps/frontend/app --include="*.tsx" \
  | grep -v "not-found\|error\|components/ui/"
```

### 8c: 페이지 제목 아이콘 일관성

```bash
grep -B2 -A2 'className={.*HEADER_TOKENS.title}' apps/frontend/app --include="*.tsx" -rn \
  | grep -E "Icon|Shield|Bell|Clipboard|Calendar|AlertTriangle" \
  | grep -v "settings\|titleIcon"
```

### 8d: Layer 3 헤더 토큰 SSOT 참조

```bash
for f in apps/frontend/lib/design-tokens/components/{audit,non-conformance,calibration-plans,equipment,notification,reports,software,calibration-factors,document}.ts; do
  if grep -q "HEADER_TOKENS" "$f"; then
    if grep -q "\.\.\.PAGE_HEADER_TOKENS" "$f"; then
      echo "OK: $f"
    else
      echo "MISSING SPREAD: $f (PAGE_HEADER_TOKENS spread 없음)"
    fi
  fi
done
```

**PASS:** h1 하드코딩 0개, 부제목 하드코딩 0개, 아이콘 일관성 통과, spread 누락 0개.

---

## Step 10: Tailwind v4 호환성

v3 → v4 마이그레이션(2026-04, PR #180) 이후 v3 잔재 재도입 방지.

### 10a: v4에서 제거된 opacity/decoration 유틸리티

```bash
rg -n '\b(bg-opacity-|text-opacity-|ring-opacity-|border-opacity-|decoration-slice|decoration-clone)\b' \
  apps/frontend --type-add 'tsx:*.tsx' --type ts --type tsx --type css
```

**PASS:** 0 hits. **FAIL:** 슬래시 표기법(`bg-foo/50`)으로 마이그레이션.

### 10b: 레거시 v3 파일/디렉티브 재도입 금지

```bash
ls apps/frontend/tailwind.config.* 2>/dev/null && echo "FAIL" || echo "PASS"
rg -n '^@tailwind\s+(base|components|utilities)' apps/frontend/styles
```

**PASS:** 두 명령 모두 0 hits.

### 10c: tailwindcss-animate 재도입 금지

```bash
grep -n tailwindcss-animate apps/frontend/package.json && echo "FAIL" || echo "PASS"
```

**PASS:** 0 hits. **FAIL:** `tw-animate-css`로 교체.

### 10d: PostCSS 플러그인 단일성

```bash
grep -nE "(^|[^@])tailwindcss['\"]?\s*:|autoprefixer" apps/frontend/postcss.config.js && echo "FAIL" || echo "PASS"
grep -n '@tailwindcss/postcss' apps/frontend/postcss.config.js || echo "FAIL: missing v4 plugin"
```

**PASS:** 첫 명령 0 hits + 두 번째 명령 매치. **FAIL:** `{ plugins: { '@tailwindcss/postcss': {} } }`로 교체.

---

## Step 11: Enum ↔ Token Record N-way 동기화

`@equipment-management/schemas` 의 status/role/action enum 값이 추가/제거되면
`Record<Enum, string>` 형태의 모든 토큰 맵에 동시 반영되어야 한다. 누락 시
TypeScript 가 잡지만(필수 속성 에러), `Record<string, ...>` 로 약타입화된 보조 맵은 silent drift 발생.

**대상 패턴:**
- `AUDIT_ACTION_*`: enum `AuditAction` ↔ `AUDIT_ACTION_BADGE_TOKENS` (strict) + `AUDIT_TIMELINE_DOT_COLORS` (loose) + i18n
- `EquipmentStatus` ↔ `EQUIPMENT_STATUS_BADGE_TOKENS` + i18n
- `CheckoutStatus` ↔ `CHECKOUT_STATUS_BADGE_TOKENS` (loose) — TypeScript 미탐지, grep 필수
- `CalibrationStatus`, `NCStatus` 등 동일 패턴
- `SOFTWARE_AVAILABILITY_VALUES` ↔ `SOFTWARE_AVAILABILITY_BADGE_TOKENS` (loose)

**탐지 (예시 — audit):**
```bash
# enum 키 목록
node -e "console.log(Object.keys(require('@equipment-management/schemas').AuditAction || {}).join('\n'))" \
  | sort > /tmp/enum.txt
# loose record 키 추출
rg -oP "^\s+([a-z_]+):" apps/frontend/lib/design-tokens/components/audit.ts \
  | sed 's/[: ]//g' | sort -u > /tmp/tokens.txt
diff /tmp/enum.txt /tmp/tokens.txt
```

**탐지 — CHECKOUT_STATUS_BADGE_TOKENS 완전성 (15개 상태):**
```bash
grep -oP "'[a-z_]+'" packages/schemas/src/enums/checkout.ts \
  | head -15 | tr -d "'" | sort > /tmp/checkout_enum.txt

awk '/^export const CHECKOUT_STATUS_BADGE_TOKENS/,/^} as const/' \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  | grep -oP '^\s+([a-z_]+):' | tr -d ': ' | sort > /tmp/checkout_tokens.txt

diff /tmp/checkout_enum.txt /tmp/checkout_tokens.txt
```

**PASS:** diff 출력 없음. **FAIL:** 누락된 상태 키 → 모든 loose record + i18n 양 언어에 동시 추가. 의미상 색상/라벨 대응 검토 필수.

---

## Step 12: 워크플로우 상태 인덱스 하드코딩 금지

도메인 워크플로우 상태 인덱스가 배열에서 파생(SSOT)되지 않고 직접 숫자로 하드코딩되면,
스텝 추가/제거 시 인덱스 불일치 버그 발생.

**올바른 패턴 (non-conformance.ts 기준):**
```typescript
// ✅ SSOT — 배열에서 파생
export const NC_STATUS_STEP_INDEX = Object.fromEntries(
  NC_WORKFLOW_STEPS.map((status, index) => [status, index])
) as Record<NonConformanceStatus, number>;
export const NC_OPEN_STEP_INDEX = NC_STATUS_STEP_INDEX['open'];
export const NC_CORRECTED_STEP_INDEX = NC_STATUS_STEP_INDEX['corrected'];
export const NC_TERMINAL_STEP_INDEX = NC_WORKFLOW_STEPS.length - 1;

// ❌ WRONG — 하드코딩
const NC_STATUS_STEP_INDEX = { open: 0, corrected: 1, closed: 2 };
if (currentStepIndex === 1) ...  // magic number
```

**탐지:**
```bash
grep -n "open: 0\|corrected: 1\|closed: 2\|in_use: 0\|returned: 1" \
  apps/frontend/lib/design-tokens/components/*.ts
grep -n "currentStepIndex === [0-9]" apps/frontend/lib/design-tokens/components/*.ts
```

**PASS:** 0 hits. **FAIL:** 해당 도메인 `*_STATUS_STEP_INDEX` 상수를 `Object.fromEntries(STEPS.map(...))` 파생으로 교체.

---

## Step 13: Dead Token 탐지

`components/*.ts`에 `export const *_TOKENS`로 정의되었지만 컴포넌트/페이지에서 **0회** 사용되는 dead token.

**탐지:**
```bash
for token in $(grep -rh "^export const [A-Z_]*TOKENS\b" \
  apps/frontend/lib/design-tokens/components/ | \
  sed -E 's/.*export const ([A-Z_]+TOKENS).*/\1/'); do
  count=$(grep -rl "\b${token}\b" apps/frontend --include="*.tsx" --include="*.ts" \
    | grep -v "lib/design-tokens\|node_modules" | wc -l)
  [ "$count" -eq 0 ] && echo "DEAD: $token"
done
```

**PASS (INFO):** dead token 0개. **INFO:** dead token 목록 출력 후 삭제 또는 사용처 추가 검토.

**예외:**
- `CHECKOUT_HEADER_TOKENS`, `CHECKOUT_SUB_HEADER_TOKENS` — spread 위임 패턴으로 실제 사용됨

**FAIL 기준:** dead token ≥ 5개 시 FAIL (0~4개는 INFO 레벨). tech-debt-tracker 등록 권고.

---

## Step 16: SPACING_RHYTHM_TOKENS 축 분리 필드 + Record 타입 narrowing

### 16a: SPACING_RHYTHM_TOKENS 축 분리 필드 — `.replace()` 안티패턴 금지

```bash
# .replace('p', 'px') 패턴 탐지 (Tailwind padding 조작)
grep -rn "\.replace('p',\s*'px')\|\.replace(\"p\",\s*\"px\")" \
  apps/frontend --include="*.ts" --include="*.tsx"
# → 0건

# SPACING_RHYTHM_TOKENS paddingX/paddingY 필드 존재 확인
grep -n "paddingX\|paddingY" apps/frontend/lib/design-tokens/semantic.ts
```

**PASS:** `.replace('p', 'px')` 0건, semantic.ts에 paddingX/paddingY 필드 존재.
**FAIL:** 문자열 조작 발견 → `SPACING_RHYTHM_TOKENS.<density>.paddingX` 직접 참조로 교체.

### 16b: N×M 조합 타입을 실제 도달 가능 키로 좁히는 패턴 (NCGuidanceKeyReachable)

```bash
# NCGuidanceKeyReachable 타입이 non-conformance.ts에 정의되어 있는지 확인
grep -n "NCGuidanceKeyReachable" \
  apps/frontend/lib/design-tokens/components/non-conformance.ts

# NC_WORKFLOW_GUIDANCE_TOKENS가 NCGuidanceKeyReachable로 좁혀져 있는지 확인
grep -n "Record<NCGuidanceKey" \
  apps/frontend/lib/design-tokens/components/non-conformance.ts
# → 0건 (NCGuidanceKeyReachable로 교체됨)
```

**PASS:** `Record<NCGuidanceKey, ...>` 0건, `resolveNCGuidanceKey`/`GuidanceCallout` props가 `NCGuidanceKeyReachable` 사용.
**FAIL:** 도달 불가 조합에 dead entry 존재 → `NCGuidanceKeyReachable` 타입 도입 + `Record` 좁힘.

---

## Step 18: UI 파생 상태 값 객체 `satisfies` 제약 + barrel export

DB에 저장되지 않는 UI 전용 상태(`IntermediateCheckStatusKey` 등)를 dot-notation으로 접근하는
`*StatusValues` 상수는 반드시 `as const satisfies Record<string, *Key>` 제약을 사용해야 한다.

**올바른 패턴 (ISVal 기준):**
```typescript
// ✅ SSOT — satisfies로 양방향 동기화 강제
export type IntermediateCheckStatusKey = keyof typeof INTERMEDIATE_CHECK_STATUS_TOKENS;
export const IntermediateCheckStatusValues = {
  OVERDUE: 'overdue',
  TODAY: 'today',
  UPCOMING: 'upcoming',
  FUTURE: 'future',
} as const satisfies Record<string, IntermediateCheckStatusKey>;

// 컴포넌트에서 ISVal 별칭 사용
import { IntermediateCheckStatusValues as ISVal } from '@/lib/design-tokens';
if (status === ISVal.OVERDUE) { ... }
```

**탐지:**
```bash
# satisfies 제약 없는 *StatusValues 탐지
grep -rn "export const.*StatusValues" \
  apps/frontend/lib/design-tokens/components/ \
  --include="*.ts" \
  | grep -v "satisfies"

# index.ts barrel에 누락된 StatusValues export 탐지
grep -oP "export const \K\w+StatusValues" \
  apps/frontend/lib/design-tokens/components/*.ts 2>/dev/null \
  | while read name; do
    grep -q "$name" apps/frontend/lib/design-tokens/index.ts \
      || echo "MISSING barrel: $name"
  done
```

**PASS:** 모든 `*StatusValues`에 `satisfies` 제약 존재 + 모두 `index.ts` barrel export.
**FAIL:** `satisfies` 미사용 → `as const satisfies Record<string, *Key>` 추가. barrel 누락 → `index.ts`에 export 추가.

---

## Step 19: ring-dashed + ring-1 조합 안티패턴

`ring-dashed` 커스텀 유틸리티와 `ring-1`을 같이 쓸 때 solid `box-shadow`가 outline 위에 겹쳐
점선 링이 무효화된다. `globals.css`의 `@layer utilities > .ring-dashed` 정의 내에서만 처리.

**올바른 패턴:**
```css
/* globals.css @layer utilities */
.ring-dashed {
  --tw-ring-shadow: 0 0 #0000;  /* solid ring 무효화 */
  outline: calc(var(--tw-ring-width, 1px)) dashed var(--tw-ring-color, currentColor);
  outline-offset: calc(var(--tw-ring-offset-width, 0px) + 1px);
}
```

```bash
# 컴포넌트에서 --tw-ring-shadow 인라인 override 탐지 (globals.css 외)
grep -rn "\-\-tw-ring-shadow" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" --include="*.css"
# → 0건 (globals.css @layer utilities 전용)

# ring-dashed가 globals.css @layer utilities 내에서만 정의되는지 확인
grep -n "ring-dashed" apps/frontend/styles/globals.css
# → @layer utilities 블록 내 1건만 존재
```

**PASS:** 컴포넌트에서 `--tw-ring-shadow` 인라인 재정의 0건.
**FAIL:** 컴포넌트/page에서 `--tw-ring-shadow` 직접 override → `globals.css @layer utilities .ring-dashed` 정의로 이전.

---

## Step 23: checkout-toast.ts / checkout-your-turn.ts 신규 컴포넌트 토큰 커버리지

**탐지 — checkout-toast.ts:**
```bash
grep -n "checkout-toast\|CHECKOUT_TOAST_TOKENS\|CheckoutToastSeverity" \
  apps/frontend/lib/design-tokens/index.ts

# duration 값 인라인 하드코딩 탐지
grep -rn "duration: 4000\|duration: 6000\|duration: 8000" \
  apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts"
```

**탐지 — checkout-your-turn.ts:**
```bash
grep -n "checkout-your-turn\|CHECKOUT_YOUR_TURN_BADGE_TOKENS\|YourTurnBadgeUrgency" \
  apps/frontend/lib/design-tokens/index.ts

grep -n "design-tokens" apps/frontend/components/checkouts/YourTurnBadge.tsx
```

**PASS 기준:**
- `lib/design-tokens/index.ts`에서 두 토큰 파일 모두 re-export 확인
- `notifyCheckoutAction` 호출처에서 duration 숫자 인라인 하드코딩 0건
- `YourTurnBadge.tsx`에서 `@/lib/design-tokens` index 경유 import 확인

**FAIL 기준:**
- index.ts re-export 누락 → 추가 필요
- `duration: 4000` 등 숫자 인라인 → `CHECKOUT_TOAST_TOKENS.duration.success` 경유로 전환
- 컴포넌트에서 토큰 파일 직접 경로 import → index 경유로 수정

---

## Step 24: checkout-loading-skeleton.ts 로딩 스켈레톤 토큰 커버리지

```bash
# index.ts에서 checkout-loading-skeleton 재export 확인
grep -n "checkout-loading-skeleton\|CHECKOUT_LOADING_SKELETON_TOKENS" \
  apps/frontend/lib/design-tokens/index.ts

# 스켈레톤 컴포넌트의 SSOT 경유 여부
grep -rn "CHECKOUT_LOADING_SKELETON_TOKENS" \
  apps/frontend/components/checkouts/ apps/frontend/app/ --include="*.tsx"

# animate-pulse 인라인 탐지
grep -rn "animate-pulse" apps/frontend/components/checkouts/ --include="*.tsx" \
  | grep -v "CHECKOUT_LOADING_SKELETON_TOKENS"

# motion-reduce:animate-none 접근성 패턴 확인
grep -n "motion-reduce" apps/frontend/lib/design-tokens/components/checkout-loading-skeleton.ts

# Spinner 직접 사용 탐지
grep -rn "animate-spin" apps/frontend/components/checkouts/ --include="*.tsx"
```

**PASS 기준:**
- `lib/design-tokens/index.ts`에서 `CHECKOUT_LOADING_SKELETON_TOKENS` re-export 확인
- `HeroKPISkeleton`, `NextStepPanelSkeleton`, `CheckoutGroupCardSkeleton` 3개 모두 토큰 SSOT 경유
- `CHECKOUT_LOADING_SKELETON_TOKENS.base`에 `motion-reduce:animate-none` 접근성 클래스 포함
- 스켈레톤 컴포넌트에서 `animate-spin` (spinner) 미사용

**INFO 기준:** `CheckoutListSkeleton`이 shadcn `<Skeleton>` 직접 사용 — tech-debt으로 관리 중.

---

## Step 25: CSS 변수 주입 토큰 fallback 필수

디자인 토큰이 `shadow-[...var(--custom-var)]` / `bg-[var(--custom-bg)]` 같이 컴포넌트-런타임에서 주입받는 CSS 변수를 포함할 때, **fallback 값 필수** (`,transparent` / `,initial` 등).

**FAIL 조건:**
- `lib/design-tokens/**`에서 `var(--[a-z-]+)` 패턴이 있지만 `var(--name, <fallback>)` 형태가 아닌 경우.

**탐지 명령어:**
```bash
grep -rn 'var(--[a-z-]\+\s*)' apps/frontend/lib/design-tokens/ | grep -v 'var(--[a-z-]\+\s*,'
```

결과가 0건이어야 PASS. `:root` / `.dark` / `@theme` 등 변수 **선언** 위치는 예외.

**Exceptions:**
- `--tw-*` 유틸리티 변수 (Tailwind 내부 변수)
- `:root`, `.dark`, `@theme` 블록 내 **선언** 위치

---

## Step 26: 사전 생성 룩업 토큰 + `satisfies Record<K, string>` 가드

variant별 클래스 문자열이 유한 집합(CalloutVariant / NCGuidanceKey 등)이면 **모듈 초기화 시 사전 생성**된 `Record<K, string>`으로 선언. 함수 호출마다 `string concat`하는 패턴 금지.

**FAIL 조건:**
- `lib/design-tokens/**/*.ts`에서 variant 인자를 받는 함수가 매 호출 생성하면서 인자가 유한 closed-set일 때.
- 사전 생성 Record에 `as const satisfies Record<Key, Value>` 가드 누락.

**탐지 명령어:**
```bash
# variant 인자를 받는 함수가 유한 집합일 때 사전 생성 없는지 확인
grep -rn 'Variant\|CalloutVariant\|RoleChipKey\|ConfirmPreviewTone' apps/frontend/lib/design-tokens/ | \
  grep -v 'satisfies Record\|type\|interface\|import\|export type' | head -20

# satisfies 가드 누락 확인 — Record<...>만 있고 satisfies 없는 정의
grep -rn 'Record<.*>\s*=' apps/frontend/lib/design-tokens/ | grep -v 'satisfies\|interface\|type '
```

**권장 패턴:**
```ts
// ❌ 매 호출 concat
primarySolid: (v: CalloutVariant): string =>
  [`base-classes`, getSemanticSolidBgClasses(v)].join(' '),

// ✅ 사전 생성 O(1) 룩업
const PRIMARY_SOLID_CLASSES = {
  info: `base-classes ${getSemanticSolidBgClasses('info')}`,
  warning: `base-classes ${getSemanticSolidBgClasses('warning')}`,
  // ... 5 variant 전부
} as const satisfies Record<CalloutVariant, string>;

primarySolid: (v: CalloutVariant): string => PRIMARY_SOLID_CLASSES[v],
```

---

## Step 27: NC compact dot 클래스 — `getNCWorkflowCompactDotClasses` SSOT 경유 필수

NC 워크플로우 compact 모드의 dot 상태 클래스는 `NC_WORKFLOW_TOKENS.compactDot.*` 직접 접근 금지.
`getNCWorkflowCompactDotClasses(stepIdx, currentIdx, isLongOverdue)` 유틸 함수만 허용.

```bash
# 컴포넌트 파일에서 compactDot 직접 접근 탐지
grep -rn "NC_WORKFLOW_TOKENS\.compactDot\." \
  apps/frontend/components/ --include="*.tsx" --include="*.ts"
# 기대: 0건 (PASS)

# index.ts re-export 확인
grep -n "getNCWorkflowCompactDotClasses" apps/frontend/lib/design-tokens/index.ts
# 기대: 1건 (PASS)
```

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/non-conformance.ts` — `NC_WORKFLOW_TOKENS.compactDot.*` + `getNCWorkflowCompactDotClasses` 정의
- `apps/frontend/components/non-conformances/NCDetailClient.tsx` — 유일한 compact dot 사용처

---

## Step 28: 컴포넌트 JSX 인라인 brand 리터럴 탐지

컴포넌트 JSX `className`에서 `bg-brand-*`/`text-brand-*`/`border-brand-*` 색상 클래스를 design-token 경유 없이 직접 문자열 리터럴로 사용 금지.

```bash
# 컴포넌트 파일에서 className 내 brand 색상 직접 사용 탐지
grep -rn 'className="[^"]*\(bg-brand-\|text-brand-\|border-brand-\)' \
  apps/frontend/components/ --include="*.tsx" | \
  grep -v "design-tokens\|// " | head -20
# 기대: 0건 (PASS)

# 템플릿 리터럴 형식도 탐지
grep -rn 'className={`[^`]*\(bg-brand-\|text-brand-\|border-brand-\)' \
  apps/frontend/components/ --include="*.tsx" | \
  grep -v "design-tokens\|// " | head -20
```

**PASS:** 0건. **FAIL:** 직접 리터럴 발견 → 해당 token을 Layer 3 파일에 추가 후 경유.

---

## Step 29: 크로스 도메인 공유 색상 SSOT + tabBadge satisfies 강제

**원칙 1 — 크로스 도메인 공유 색상은 `semantic.ts` 배치 필수:**
`checkout.ts` ↔ `notification.ts` 등 서로 다른 도메인 컴포넌트 토큰 파일 간 직접 import 금지.

**원칙 2 — `tabBadge` alert 상태는 `ALERT_TAB_BADGE_COLOR` SSOT 경유:**
`bg-destructive text-destructive-foreground` raw 리터럴 직접 인라인 금지.

**원칙 3 — `CHECKOUT_TAB_BADGE_TOKENS`의 `as const satisfies` 강제.**

```bash
# 도메인 간 직접 import 탐지
grep -n "from.*notification\|from.*checkout" \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  apps/frontend/lib/design-tokens/components/notification.ts
# → 0건

# raw bg-destructive text-destructive-foreground 조합 탐지 (tabBadge 패턴)
grep -rn "bg-destructive text-destructive-foreground\|bg-destructive.*text-destructive-foreground" \
  apps/frontend/lib/design-tokens/components/ --include="*.ts" \
  | grep -v "ALERT_TAB_BADGE_COLOR"
# → 0건

# CHECKOUT_TAB_BADGE_TOKENS satisfies 제약 확인
grep -A 6 "^export const CHECKOUT_TAB_BADGE_TOKENS" \
  apps/frontend/lib/design-tokens/components/checkout.ts

# ALERT_TAB_BADGE_COLOR가 semantic.ts에 정의되고 index.ts에서 re-export되는지 확인
grep -n "ALERT_TAB_BADGE_COLOR" \
  apps/frontend/lib/design-tokens/semantic.ts \
  apps/frontend/lib/design-tokens/index.ts
```

**예외:**
- `components/ui/` (shadcn/ui) 내 destructive variant
- `bg-destructive/5`, `bg-destructive/10`, `border-destructive` 등 투명도 변형
- `VisualTableEditor.tsx:242` — 점검 결과 편집기 고정 위치 에러 indicator

---

## Step 32: MENU_ITEM_TOKENS.destructive SSOT — DropdownMenuItem 파괴적 액션 하드코딩 금지

```bash
# DropdownMenuItem destructive 리터럴 하드코딩 탐지
grep -rn "\"text-destructive focus[^\"]*text-destructive\"\|'text-destructive focus[^']*text-destructive'" \
  apps/frontend/components/ \
  --include="*.tsx" \
  | grep -v "components/ui/\|node_modules"

# MENU_ITEM_TOKENS 로컬 재정의 탐지 (semantic.ts 이외 정의 금지)
grep -rn "MENU_ITEM_TOKENS\s*=" \
  apps/frontend/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "semantic\.ts\|node_modules"
```

```tsx
// ❌ WRONG — 리터럴 직접 사용
className="text-destructive focus:text-destructive"
className="text-destructive focus-visible:text-destructive"

// ✅ CORRECT — SSOT 토큰 경유
import { MENU_ITEM_TOKENS } from '@/lib/design-tokens';
className={MENU_ITEM_TOKENS.destructive}
```

**PASS:** 두 명령어 모두 0 hit.
**FAIL:** 리터럴 직접 사용 또는 로컬 재정의 발견 → `MENU_ITEM_TOKENS.destructive` import + 교체.

**예외:**
- `components/ui/` (shadcn/ui) — 서드파티 생성 코드
- `toast.tsx`의 `group-[.destructive]:focus:ring-destructive` — Tailwind group modifier 패턴

---

## Step 35: `CHECKOUT_ITEM_ROW_TOKENS` zone key `satisfies { ... [key: string]: unknown }` 강제

```bash
# satisfies 제약 존재 확인
grep -A 8 "^} as const satisfies" \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  | grep -B1 "zoneStatus\|zoneIdentity\|zoneAction\|miniProgressTooltipButton"

# [key: string]: unknown 인덱스 시그니처 존재 확인
grep -A 10 "CHECKOUT_ITEM_ROW_TOKENS" \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  | grep "\[key: string\]: unknown"
# 기대: 1건 (PASS)
```

**PASS:** `satisfies { grid: string; zoneStatus: string; zoneIdentity: string; zoneAction: string; miniProgressTooltipButton: string; [key: string]: unknown }` 제약 존재.
**FAIL:** `satisfies` 없음 → zone key 삭제/오타 시 컴파일 에러 미발생 → 런타임 undefined 접근 위험.

---

## Step 36: `WORKFLOW_PANEL_TOKENS.variant` + `.actor` `satisfies Record` 완전성

Sprint 4.1에서 `WORKFLOW_PANEL_TOKENS`에 `variant` / `actor` 두 서브트리가 추가됨.

```bash
# variant satisfies 확인 (2-way)
grep -A 4 "} satisfies Record<" apps/frontend/lib/design-tokens/components/workflow-panel.ts \
  | grep "'compact' | 'hero'"
# 기대: 1건

# actor satisfies 확인 — ActorVariant SSOT 경유 (schemas import)
grep "satisfies Record<ActorVariant" apps/frontend/lib/design-tokens/components/workflow-panel.ts
# 기대: 1건

# WorkflowPanelActorVariant 타입 export 확인
grep -n "WorkflowPanelActorVariant" \
  apps/frontend/lib/design-tokens/components/workflow-panel.ts

# index.ts barrel re-export 확인
grep -n "workflow-panel\|WorkflowPanelActorVariant" \
  apps/frontend/lib/design-tokens/index.ts
```

**PASS:** variant satisfies 1건 + `satisfies Record<ActorVariant>` 1건 + `WorkflowPanelActorVariant` export + barrel re-export.
**FAIL:**
- `satisfies` 누락 → 새 variant/actor 추가 시 TypeScript 미탐지
- `ActorVariant` 대신 inline 리터럴 사용 → schemas SSOT 연결 끊김
- `WorkflowPanelActorVariant` 미export → 소비처가 직접 union 리터럴 재정의 (SSOT 위반)

---

## Step 39: `getPageContainerClasses()` variant 필수 인수 — 빈 호출 금지

```bash
# 실제 빈 호출 탐지 (variant 인수 없이 ')' 로 닫히는 패턴)
grep -rn "getPageContainerClasses()" \
  apps/frontend \
  --include="*.tsx" --include="*.ts"
```

**PageContainerVariant 선택 규칙:**

| variant | max-width | 사용 도메인 |
|---|---|---|
| `list` | container 1400px | 목록/검색 페이지 |
| `detail` | max-w-4xl (896px) | 단일 엔티티 집중 상세 |
| `wide` | max-w-5xl (1024px) | 다단계 폼 / 복합 상세 |
| `dashboard` | max-w-7xl (1280px) | KPI+탭 포함 대시보드형 상세 |
| `form` | max-w-2xl (672px) | 단순 입력 폼 |
| `centered` | container 1400px | 중앙정렬 전체폭 |

```tsx
// ❌ variant 미지정 — 너비 결정 불가
<div className={getPageContainerClasses()}>

// ✅ variant 명시 — SSOT 너비 보장
<div className={getPageContainerClasses('wide')}>
<div className={getPageContainerClasses('detail', 'space-y-6')}>
```

**PASS:** 0건. **FAIL:** 빈 호출 → variant 명시.

---

## Step 40: hover-inline 버튼 — `APPROVAL_ACTION_BUTTON_TOKENS.approveIcon/rejectIcon` 토큰 경유 필수

```bash
# hover-inline 버튼에서 토큰 미경유 raw color class 탐지
grep -n "group-hover:inline-flex\|group-hover:flex" \
  apps/frontend/components/**/*.tsx 2>/dev/null \
  | grep -v "APPROVAL_ACTION_BUTTON_TOKENS\|approveIcon\|rejectIcon\|MENU_ITEM_TOKENS"

# raw color class 직접 사용 탐지
grep -n "text-green-\|text-emerald-\|hover:bg-green-\|hover:bg-emerald-" \
  apps/frontend/components/**/*.tsx 2>/dev/null \
  | grep -v "//\|design-tokens"
```

```tsx
// ❌ 하드코딩 color
<Button className="hidden group-hover:inline-flex text-green-600 hover:bg-green-100">

// ✅ 토큰 경유
<Button className={cn(
  'hidden group-hover:inline-flex',
  APPROVAL_ACTION_BUTTON_TOKENS.approveIcon  // 'text-brand-ok hover:bg-brand-ok/10'
)}>
```

**PASS:** 0건. **FAIL:** raw color class → 해당 토큰으로 교체.

---

## Step 42: NEXT_STEP_PANEL_TOKENS 토큰 체인 — workflow-panel.ts → index re-export → NextStepPanel.tsx 소비

```bash
# index.ts에서 re-export 확인
grep -n "NEXT_STEP_PANEL_TOKENS\|NextStepPanelUrgency\|NextStepPanelContainer\|workflow-panel" \
  apps/frontend/lib/design-tokens/index.ts

# NextStepPanel.tsx에서 design-tokens index 경유 import 확인
grep -n "design-tokens\|NEXT_STEP_PANEL_TOKENS" \
  apps/frontend/components/shared/NextStepPanel.tsx

# NextStepPanel.tsx에서 container variant 인라인 클래스 하드코딩 탐지
grep -n "rounded-\|border-\|bg-\|p-[0-9]" \
  apps/frontend/components/shared/NextStepPanel.tsx | grep -v "NEXT_STEP_PANEL_TOKENS\|//\|/\*"

# NEXT_STEP_PANEL_TOKENS 정의에 satisfies 강제 확인
grep -n "satisfies Record\|export type NextStepPanel\|NEXT_STEP_PANEL_TOKENS = {" \
  apps/frontend/lib/design-tokens/components/workflow-panel.ts
```

**PASS 기준:**
- `lib/design-tokens/index.ts`에서 `NEXT_STEP_PANEL_TOKENS`, `NextStepPanelUrgency`, `NextStepPanelContainer` 모두 re-export
- `NextStepPanel.tsx`가 `@/lib/design-tokens` index 경유 import
- `NextStepPanel.tsx`에서 variant별 container 클래스 인라인 하드코딩 0건
- `workflow-panel.ts`에서 `satisfies` 가드 존재

---

## Step 44: SURFACE_INLINE_ACTION_TOKENS 4-way 동기화 + label-ko/label-mono utility

`SURFACE_INLINE_ACTION_TOKENS` 4-way sync (info/ok/warning/danger × bg/bg-hover/border/fg = 16 토큰):
1. `globals.css :root` 16개 CSS 변수 — Light alpha 고정.
2. `globals.css .dark` 16개 동일 변수 — Dark도 같은 alpha.
3. `globals.css @theme inline` 16개 utility bridge.
4. `lib/design-tokens/semantic.ts SURFACE_INLINE_ACTION_TOKENS` — className SSOT.

```bash
# :root 16 변수 존재 (Light + Dark 합 ≥ 32)
grep -c "^\s*--surface-inline-action-" apps/frontend/styles/globals.css
# 기대: ≥ 32

# @theme inline bridge 16 변수
grep -c "^\s*--color-surface-inline-action-" apps/frontend/styles/globals.css
# 기대: 16

# semantic.ts SURFACE_INLINE_ACTION_TOKENS 정의
grep -n "SURFACE_INLINE_ACTION_TOKENS" apps/frontend/lib/design-tokens/semantic.ts

# barrel re-export
grep -n "SURFACE_INLINE_ACTION_TOKENS\|getSurfaceInlineActionClasses" apps/frontend/lib/design-tokens/index.ts

# label-ko / label-mono 정의
grep -n "@utility label-ko\|@utility label-mono" apps/frontend/styles/globals.css

# Phase 3 — atom 외부 직접 사용 0건 검증
grep -rn --include="*.tsx" --include="*.ts" \
  "\(bg\|text\|border\)-surface-inline-action-" \
  apps/frontend/components apps/frontend/app \
  | grep -v "components/ui/inline-action-button.tsx" \
  | grep -v "__tests__/"
# 기대: 0 hits

# resolveInlineActionVariant SSOT 사용 확인
grep -rn "resolveInlineActionVariant" apps/frontend/components apps/frontend/app
```

**PASS:**
1. 16개 `--surface-inline-action-*` 변수 :root + .dark + @theme inline 3곳 동기화
2. semantic 토큰 export + barrel re-export
3. `label-ko` (한국어 줄바꿈), `label-mono` (영문 truncate) utility 양쪽 정의
4. atom 외부 raw `bg/text/border-surface-inline-action-*` 직접 사용 0건

---

## Step 45a: KPI grid + hero `containerInGrid` + `alertRing` 토큰 적용 강제

```bash
# checkouts KPI 영역에서 raw grid/col-span 잔존 (FAIL 패턴)
grep -nE '\b(col-span|grid-cols)-\d' \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx' \
  apps/frontend/components/checkouts/HeroKPISkeleton.tsx
# 기대: 0 hits

# hero alertRing 토큰 미사용 (dead token)
grep -rn "CHECKOUT_STATS_VARIANTS\.hero\.alertRing\|heroTokens\.alertRing" \
  apps/frontend/app apps/frontend/components
# 기대: ≥ 1 hit

# Phase 4.5 신규 hero 토큰 — surfaceVariant / labelVariant / priorityBadge dead-token 검사
for token in "surfaceVariant" "labelVariant" "priorityBadge"; do
  hits=$(grep -rn "tokens\.${token}\|hero\.${token}\|heroTokens\.${token}" \
    apps/frontend/app apps/frontend/components | wc -l)
  echo "${token}: ${hits} hits (expected ≥ 1)"
done

# host와 skeleton이 동일 grid 토큰 import 확인
grep -n "getStatsGridClass\|CHECKOUT_STATS_GRID_TOKENS" \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx' \
  apps/frontend/components/checkouts/HeroKPISkeleton.tsx
```

---

## Step 45b: SIDEBAR_ROW_TOKENS Layer 3 — sibling-anchor 컴포넌트 토큰 우회 금지

```bash
# SIDEBAR_ROW_TOKENS 정의 + 5개 키
grep -nE "SIDEBAR_ROW_TOKENS\s*=|container:|secondaryHitArea:|collapsedDot:" \
  apps/frontend/lib/design-tokens/components/sidebar.ts
# 기대: ≥ 4 hits

# NavRowWithSecondaryAction 인라인 className 도입 0건
grep -E "(bg-|text-|border-|p-|m-|gap-|rounded-)" \
  apps/frontend/components/layout/NavRowWithSecondaryAction.tsx | \
  grep -vE "import|cn\(|getSidebar|SIDEBAR_|FOCUS_TOKENS|TRANSITION_PRESETS"
# 기대: 0 lines

# index.ts barrel export 정합
grep -cE "SIDEBAR_ROW_TOKENS|getSidebarRowPrimaryClasses|getSidebarRowSecondaryClasses" \
  apps/frontend/lib/design-tokens/index.ts
# 기대: ≥ 3
```

**PASS:** SIDEBAR_ROW_TOKENS 5+ key 정의 + NavRowWithSecondaryAction 인라인 0건 + barrel export 3건.
**FAIL:** 컴포넌트 내 raw `'absolute top-0.5 right-0.5 w-2 h-2 rounded-full'` 같은 위치/크기 인라인.

---

## Step 47: `compact` 컨테이너 토큰 — elevation/shadow/rounded/padding 0 원칙

`variant="compact"` (행 Zone 4 등 행 평면 통합) 컨테이너 토큰에는
`ELEVATION_TOKENS.*`, `shadow-*`, `rounded-*`, `p-N` (layout spacing이 아닌 surface padding) 이 포함되어서는 안 됨.

```bash
# workflow-panel.ts container.compact 라인 추출 후 금지 클래스 검색
grep -nE "compact:\s*['\"\`]" apps/frontend/lib/design-tokens/components/workflow-panel.ts \
  | grep -E "\brounded-[a-z]|\bshadow-[a-z]|\bp-[0-9]|ELEVATION_TOKENS"
# 기대: 0 hits

# 다른 Layer 3 파일에도 compact 키 확인 (일반화 대비)
grep -rnE "compact:.*ELEVATION_TOKENS|compact:.*\brounded-[a-z]|compact:.*\bshadow-[a-z]|compact:.*\bp-[0-9]" \
  apps/frontend/lib/design-tokens/components/ --include="*.ts"
# 기대: 0 hits

# container.compact 정의 라인의 실제 값 확인 (PASS 양성 검증)
grep -nE "compact:\s*['\"\`].*inline-flex|compact:\s*['\"\`].*flex-col" apps/frontend/lib/design-tokens/components/workflow-panel.ts
# 기대: 1 hit
```

**PASS:**
- `container.compact` 토큰 값에 elevation/shadow/rounded/surface-padding 클래스 0건
- layout 전용 클래스(`inline-flex`, `flex-col`, `flex`, `items-*`, `gap-*`)만 포함

**FAIL:**
- `container.compact`에 `ELEVATION_TOKENS.surface.*` 추가 → 행 평면 이탈
- `rounded-*` 추가 → host row와 중첩 radius
- `shadow-*` 직접 추가 → 행 안에서 부유 효과
- `p-N` (surface padding) 추가 → Zone 4 내부 공간 충돌

**발생 이력 (2026-04-28)**: NextStepPanel compact가 padding/shadow를 가진 채 행 안에 들어가 "외곽 사각형 glow"로 표면화 → `inline-flex flex-col gap-0.5` layout-only 토큰으로 교체.

---

## Step 51: `text-[10px]` arbitrary size → `MICRO_TYPO.badge` 토큰 경유 필수

```bash
# lib/design-tokens/ 내 text-[10px] arbitrary size 탐지
grep -rn "text-\[10px\]" apps/frontend/lib/design-tokens/ apps/frontend/components/
# 0건이어야 PASS
```

```typescript
// ❌ WRONG — arbitrary font size in design token file
completed: 'text-brand-ok text-[10px]',

// ✅ CORRECT — MICRO_TYPO.badge 토큰 보간
completed: `text-brand-ok ${MICRO_TYPO.badge}`,
```

**PASS:** `text-[10px]` 0건. **FAIL:** 1건 이상 → `${MICRO_TYPO.badge}` 보간으로 교체.

**예외:**
- `text-[56px]`, `text-[32px]` 등 MICRO_TYPO에 없는 display 전용 크기 — arbitrary 허용 (주석으로 이유 명시)
- `components/ui/` (shadcn) — 라이브러리 컴포넌트

---

## Step 52: charCount 표시 패턴 — `<CharsCounter>` 호출자 강제

폼 textarea의 character counter UI는 `<CharsCounter>` SSOT 컴포넌트(`components/common/CharsCounter.tsx`)를 통해서만 렌더해야 한다.

```tsx
// ❌ WRONG — 인라인 매직 넘버 + 인라인 색상 분기
<p className={value.length >= MAX * 0.8 ? 'text-warning' : 'text-muted-foreground'}>
  {value.length} / {MAX}
</p>

// ✅ CORRECT — CharsCounter 위임
<CharsCounter count={value.length} max={MAX} />

// ✅ CORRECT — 사용자 정의 텍스트 (children override)
<CharsCounter count={value.length} max={MAX}>
  {t('rejectModal.charsRemaining', { remaining: MAX - value.length })}
</CharsCounter>
```

**탐지 (3가지 위반 시그니처):**

```bash
# 1. textarea + length 인라인 표시 (CharsCounter 미사용)
grep -rnE "\{[a-zA-Z_]+\.length\}\s*/\s*[0-9]+" \
  apps/frontend/components --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules\|__tests__\|CharsCounter"
# 기대: 0건

# 2. charCount 컨텍스트의 인라인 text-warning/text-destructive 분기
grep -rnE "(text-warning|text-destructive).*length\s*[<>=]" \
  apps/frontend/components --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules\|__tests__\|CharsCounter\|RejectModal\|Disposal"
# 기대: 0건

# 3. 매직 임계값 계산 — Math.floor(MAX * 0.8) 류 인라인 계산
grep -rnE "Math\.floor\([A-Z_]*\.?[A-Z_]+_LENGTH\s*\*\s*0\." \
  apps/frontend/components --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules\|__tests__\|CharsCounter"
# 기대: 0건
```

**PASS:** 위 3개 grep 모두 0건 + `<CharsCounter>` 호출처 ≥1건.
**FAIL:** 1건 이상 → `<CharsCounter count={...} max={...} />` 로 교체.

**예외:**
- `CharsCounter.tsx` 자체 — 컴포넌트 정의이므로 인라인 색상 분기 OK
- `__tests__/` — 테스트 파일은 매직 넘버 허용
- "min-required hint" 시맨틱(Disposal `charCountMin`) — `{count} / {min}자 이상` 형식은 별도 표시 컴포넌트 OK

**관련 파일:**
- `apps/frontend/components/common/CharsCounter.tsx` — SSOT 컴포넌트
- `apps/frontend/lib/design-tokens/form-field-tokens.ts` — `CHAR_COUNTER_TOKENS`
- `apps/frontend/components/common/__tests__/CharsCounter.test.tsx` — 11 case 임계값 회귀 방어
