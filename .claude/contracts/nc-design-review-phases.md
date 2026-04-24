# NC 디자인 리뷰 아키텍처 반영 플랜 (2026-04-24, rev-2)

---

## 🚦 Session Resume Guide (다음 세션 진입점)

### 현재 진행 상태

| Phase | 상태 | Commit | 비고 |
|-------|------|--------|------|
| **1 · Foundation Tokens** | ✅ **완료** | `7a851f78` | UI 무영향, tsc 통과 |
| **1.1 · 자체 감사 후 follow-up** | ✅ **완료** | (pending commit) | CSS 충돌 / SSOT / 성능 / 타입 4건 수정 |
| 2 · i18n Parity | ⏸ 대기 | — | **다음 세션 재개점** |
| 3 · Callout hero + Timeline compact | ⏸ 대기 | — | Phase 2 후 진행 |
| 4 · Banner/Docs/Dialog CAS/List | ⏸ 대기 | — | Phase 3 후 진행 |

### Phase 1.1 follow-up 상세 (자체 감사 결과)

Phase 1 완료 후 사용자 "누락·타협 없이 아키텍처 수준인가?" 재검토 요청 → 다음 4건 수정:

1. **CSS 충돌**: `CONFIRM_PREVIEW_TOKENS.card`가 `getSemanticContainerClasses`를 썼는데 `rounded-md border p-4`가 앞의 `p-3.5`를 덮어씀. → `getSemanticContainerColorClasses`(색상만)로 교체 + 3 tone 사전 생성(`CONFIRM_PREVIEW_CARD_CLASSES`).
2. **SSOT**: `REQUIRED_FIELD_TOKENS.asterisk` / `inputBorder`에 `text-brand-critical` / `border-l-brand-critical` 리터럴 직접 사용 → `getSemanticContainerTextClasses('critical')` / `getSemanticLeftBorderClasses('critical')` brand.ts 헬퍼 경유로 교체.
3. **성능**: `NC_GUIDANCE_CTA_TOKENS.primarySolid`와 `getRoleChipClasses`가 함수 호출마다 string concat. → 5 × n 조합 사전 생성 (`NC_GUIDANCE_CTA_PRIMARY_SOLID`, `ROLE_CHIP_CLASSES`) + O(1) 룩업으로 변환.
4. **타입**: `CALLOUT_TOKENS.emphasis`의 leftBorder만 size-aware였고 `getCalloutClasses`에서 `as typeof ...` 캐스팅 escape hatch 사용. → 모든 emphasis 함수를 `(v: CalloutVariant, size: CalloutSize) => string` 통일 시그니처 + 개별 `satisfies CalloutEmphasisFn` 가드.

### 기록만 된 tech-debt (Phase 1 범위 밖)

- [`tech-debt-nc-banner-dark-prefix-0424.md`](./tech-debt-nc-banner-dark-prefix-0424.md) — `NC_BANNER_TOKENS.statusAlert`에 `dark:` prefix 사용 (memory `Brand Color Migration` 위반). 별도 세션에서 전체 `dark:.*-brand-*` 스캔 + 수정.

### Phase 1 완료 시 추가된 토큰 (다음 Phase가 참조할 SSOT)

모두 `apps/frontend/lib/design-tokens/` 하위:

```ts
// semantic.ts
CALLOUT_TOKENS.size.hero                             // px-5 py-4 + 6px leftBorder + shadow
ROLE_CHIP_TOKENS + getRoleChipClasses(key)           // my-turn/waiting/approval/blocked/done
CONFIRM_PREVIEW_TOKENS.card(tone)                    // 'ok' | 'info' | 'neutral'
CONFIRM_PREVIEW_TOKENS.hint

// form-field-tokens.ts (신규 파일)
REQUIRED_FIELD_TOKENS                                // labelWrapper/asterisk/srOnlyLabel/inputBorder/charCount/optionalHint
REQUIRED_FIELD_A11Y                                  // { required: true, 'aria-required': 'true' }

// brand.ts
BRAND_CLASS_MATRIX.borderOpacity30                   // 10 semantic color
getSemanticBorderOpacity30Classes(color)

// components/non-conformance.ts
NC_BANNER_TOKENS.alertCompact/iconCompact/titleCompact/compactCta
NC_WORKFLOW_TOKENS.containerCompact
NC_WORKFLOW_GUIDANCE_TOKENS[<key>].roleChip          // 11 entry 전부 (satisfies 타입 가드)
NC_GUIDANCE_CTA_TOKENS.primarySolid(variant) / secondaryOutlined

// components/checkout.ts
CHECKOUT_ALERT_TOKENS                                // @deprecated JSDoc (기존 기능 유지)
```

### 다음 세션 재개 체크리스트 (Phase 2 진입 전)

1. **현재 브랜치/상태 확인**
   ```bash
   git log --oneline -3                              # 7a851f78 commit 확인
   git status --short                                # clean 또는 의도적 미커밋만
   ```

2. **토큰 import 경로 (Phase 2/3/4에서 사용 전 재검증)**:
   - `import { ROLE_CHIP_TOKENS, getRoleChipClasses, CONFIRM_PREVIEW_TOKENS } from '@/lib/design-tokens/semantic'`
   - `import { REQUIRED_FIELD_TOKENS, REQUIRED_FIELD_A11Y } from '@/lib/design-tokens/form-field-tokens'`
   - `import { NC_GUIDANCE_CTA_TOKENS } from '@/lib/design-tokens/components/non-conformance'`

3. **Phase 2 첫 작업 (i18n parity)**:
   - `apps/frontend/messages/ko/non-conformances.json` → 신규 키 블록 추가 (본 contract "Phase 2" 섹션의 JSON 블록 그대로 복사 가능).
   - `apps/frontend/messages/en/non-conformances.json` → **파일 전체 신규 생성** (기존 ko 378라인 전체 번역 + 신규 46키 포함 1:1 mirror).
   - `scripts/i18n-parity.mjs`는 선택적 생성.

4. **주의 사항**:
   - `causePlaceholder` 등 도메인 문구는 일반 가이드 문구로 유지 ("부적합의 원인을 구체적으로 기재해 주세요" — 사용자 확정).
   - 기존 ko 파일 중 en 미번역 키 누락 없는지 diff로 검증.
   - **commitlint 기준**: header ≤ 100자, body lines ≤ 100자, subject는 소문자 (또는 backtick wrap). UPPER_CASE 단어 그대로 쓰면 `subject-case` rule 위반.

5. **Phase 3 진입 조건**:
   - Phase 2 커밋 완료 + `messages/en/non-conformances.json` 존재 확인.
   - 로컬 `?locale=en`으로 `t('detail.guidance.roleChip.*')`가 영문 반환하는지 확인.

6. **Phase 4 진입 조건**:
   - Phase 3 커밋 완료.
   - `useCasGuardedMutation` 시그니처 재확인: `hooks/use-cas-guarded-mutation.ts` — `mutationFn: (vars, casVersion) => Promise<TData>` 형태.
   - E2E 수리 등록 플로우 2-step으로 갱신 (기존 1-click → "다음 → 수리 등록").

### 세션 간 컨텍스트 휘발 방지

- 본 contract 파일(`.claude/contracts/nc-design-review-phases.md`)이 **진실의 소스**.
- 다음 세션 시작 시 본 파일을 먼저 읽어서 진행 상태 재구성.
- Phase 완료 시마다 이 Guide 상단 테이블의 해당 Phase ⏸ → ✅ 로 업데이트 + commit hash 기록.
- `~/.claude/plans/c-users-kmjkd-downloads-nc-design-revie-wise-rocket.md`는 session-scoped plan 사본으로 **무시**.

---

## Context

`c:/Users/kmjkd/Downloads/NC Design Review.html` 디자인 리뷰 6개 finding (P1×2, P2×3, P3×1)을 **UI 수정으로 한정하지 않고** 현재 NC 도메인 프론트엔드의 아키텍처 빈틈을 동시 해소하는 것이 목표.

### 리뷰 핵심 (UX 관점)
- NC는 "문제 해결" mental model → Callout(지시)이 Timeline(기록)보다 시각적으로 커야 함.
- 장비 상세 Banner ↔ NC 상세 Callout의 위계 반전 (클릭 한 번에 위급도 반감).
- 역할(operator/manager)이 variant 색에 흡수됨 → role chip 필요.
- 문서/Dialog/리스트 보조 UX 3건.

### 탐색 과정에서 드러난 아키텍처 빈틈 (기존 코드 감사)
1. **`messages/en/non-conformances.json` 자체가 존재하지 않음** — en locale 전체 누락. next-intl fallback은 빈 키로 보임(미확정) → 영문 사용자에게 UI 깨짐 위험.
2. **NCEditDialog / NCRepairDialog가 `useCasGuardedMutation` 미사용** — 기존 NC `useOptimisticMutation`은 nc.version을 참조만 함. **input→confirm 사이 stale 감지 불가**. Calibration Plan / Approval Timeline은 이미 cas-guarded로 전환돼 일관성 깨짐.
3. **`CHECKOUT_ALERT_TOKENS`가 `CALLOUT_TOKENS`를 재사용하지 않음** — 반출입 도메인은 독립 토큰. SSOT 분산. (이번 플랜에선 deprecation 예고만, 실제 통합은 별도 세션 — 사용자 결정.)
4. **`REQUIRED_FIELD_TOKENS` 부재** — 필수 필드 `*` 시각화가 프로젝트 전체에서 구현 안 됨. NCEditDialog만 고치면 재발.
5. **리스트 행 memoization 없음** — `getSemanticBadgeClasses` 등 헬퍼가 row 단위로 매 렌더 호출. `resolveNCGuidanceKey`를 리스트에 도입하면 성능 부담 증가.
6. **BRAND_CLASS_MATRIX에 role chip 변종 없음** — `border-brand-ok/30` 같은 opacity arbitrary는 JIT unsafe 리스크(memory `Design Token 3-Layer`).

### 결정된 범위 (사용자 확정)
- 6개 finding 전체 적용 (P1+P2+P3).
- 4회 분할 커밋 (rev-1에선 3회였으나 foundation + i18n 분리로 안전성 확보).
- NC 도메인 + **범용 SSOT 확장** (ROLE_CHIP / REQUIRED_FIELD / CONFIRM_PREVIEW).
- CHECKOUT_ALERT_TOKENS 통합 **보류** (deprecation 주석만). 별도 세션.
- en/non-conformances.json **신규 생성** 이번 플랜 포함.
- `causePlaceholder`는 일반 가이드 문구 ("부적합의 원인을 구체적으로 기재해 주세요").

---

## Architecture Principles (AP)

플랜 전체가 아래 10개 원칙을 준수. Phase별 실행 시 위반 여부를 커밋 직전 self-audit.

- **AP-1 Token SSOT**: UI 색/spacing/size는 `lib/design-tokens/`만 수정. 컴포넌트 파일에 Tailwind 색상 리터럴/픽셀 값 금지. 신규 재사용 가능 프리미티브는 `semantic.ts` 또는 신규 `form-field-tokens.ts`.
- **AP-2 CSS 변수 중립성**: 하드코딩된 variant 경로 금지. `--callout-hero-shadow`처럼 도메인-중립 CSS 변수로 주입. NC-only 변수명 금지.
- **AP-3 타입 가드**: 모든 토큰 맵은 `satisfies Record<Key, Value>`. 신규 키 추가 시 TS 컴파일 에러로 빈틈 노출.
- **AP-4 CAS 일관성**: NC Dialog submit은 `useCasGuardedMutation` 경유. Dialog input→confirm step 사이 stale 감지 위해 confirm 진입 시 `fetchCasVersion()` 재실행 — Calibration Plan 패턴과 동일.
- **AP-5 재사용 가능 프리미티브**: role chip, required indicator, confirm preview card는 범용 토큰. 반출입/교정에서도 opt-in 가능한 구조.
- **AP-6 a11y WCAG 2.2 AA**: 색 단독 정보 전달 금지 (role chip 텍스트 필수). Dialog 2-step은 `aria-live="polite"` region으로 step 전환 공지. focus trap 유지. `aria-required` + visual `*` + sr-only 텍스트.
- **AP-7 Performance**: 리스트 행 helper 호출은 `useMemo` 경유. N행 × 매 렌더 regression 방지. row virtualization은 제외(현재 데이터 크기 기준).
- **AP-8 i18n 완전성**: ko + en 양쪽 필수. `messages/en/non-conformances.json`은 이번 플랜에서 신규 생성. 누락 키는 tsc에서 잡을 수 없어 lint 스크립트로 보강 검토.
- **AP-9 Rollback-safe**: 각 커밋 단독 revert 가능. 커밋 1(토큰), 커밋 2(i18n)는 선언만 추가 → revert해도 unused. 커밋 3, 4는 finding 단위로 git cherry-pick으로 부분 revert.
- **AP-10 Bundle budget**: `scripts/measure-bundle.mjs` 재측정 후 `scripts/bundle-baseline.json` + 관련 baseline 파일 갱신. 토큰 추가로 인한 tree-shakeable 부분은 무변화 예상, 신규 컴포넌트 0개 원칙.

---

## Scope 매트릭스

| # | P | Finding | 변경 본질 | 아키텍처 레벨 |
|---|---|---------|----------|--------------|
| 1 | P1 | Callout이 Timeline에 묻힘 | UI + 토큰 확장 | CALLOUT_TOKENS.size.hero (범용) |
| 2 | P2 | 역할 색에 흡수됨 | UI + 신규 범용 토큰 | ROLE_CHIP_TOKENS (semantic.ts) + NC guidance에 roleChip 필드 |
| 3 | P1 | Banner↔Callout 위계 반전 | UI + NC 토큰 확장 | NC_BANNER_TOKENS.compact variant |
| 4 | P2 | 문서 5+ 그리드 비효율 | UI + 토큰 확장 | NCDocumentsSection view state + AttachmentThumbnail size prop |
| 5 | P2 | Dialog UX | UI + CAS 적용 + 신규 범용 토큰 | REQUIRED_FIELD_TOKENS, CONFIRM_PREVIEW_TOKENS, useCasGuardedMutation 전환 |
| 6 | P3 | 리스트 액션 힌트 | UI + 성능 보강 | resolveNCGuidanceKey 리스트 호출 + row memoization |

### 동시 해소 아키텍처 보강 (리뷰 외)
- **A1**: `messages/en/non-conformances.json` 신규 생성 (전체 키 번역 포함).
- **A2**: NC Dialog CAS 전환 (`useCasGuardedMutation`).
- **A3**: `REQUIRED_FIELD_TOKENS` 신규 SSOT (범용).
- **A4**: 리스트 row helper `useMemo` 도입.
- **A5**: `CHECKOUT_ALERT_TOKENS`에 **@deprecated** JSDoc 주석 + `CALLOUT_TOKENS` 마이그레이션 경로 문서화 (실제 통합은 별도 세션).

---

## 커밋 전략 (4회 분할, main 직접 push)

```
커밋 1 · Foundation Tokens (UI 무영향)
  ├─ CALLOUT_TOKENS.size.hero + --callout-hero-shadow CSS 변수
  ├─ ROLE_CHIP_TOKENS 신규 (semantic.ts, 범용)
  ├─ REQUIRED_FIELD_TOKENS 신규 (form-field-tokens.ts 신규 파일, 범용)
  ├─ CONFIRM_PREVIEW_TOKENS 신규 (semantic.ts, 범용)
  ├─ NC_BANNER_TOKENS.compact variant 추가
  ├─ NC_WORKFLOW_TOKENS.containerCompact 추가
  ├─ NC_WORKFLOW_GUIDANCE_TOKENS 11개 entry에 roleChip 필드 (타입 에러로 강제)
  ├─ NC_GUIDANCE_CTA_TOKENS 신규 (variant별 solid/outlined button 클래스)
  ├─ CHECKOUT_ALERT_TOKENS @deprecated JSDoc
  └─ 테스트: pnpm tsc --noEmit (신규 satisfies 타입 가드)

커밋 2 · i18n Parity (ko 보강 + en 신규 전체)
  ├─ messages/ko/non-conformances.json: roleChip, banner.compact*, dialog 신규 키, list.action.*
  ├─ messages/en/non-conformances.json: 전체 파일 신규 생성 (기존 ko 전체 번역 + 신규 키 포함)
  ├─ next-intl fallback 설정 확인 — 부재 시 `messages/en/index.ts`에 fallback 명시
  └─ 테스트: 두 파일 key set 동일 보장 스크립트 (옵션)

커밋 3 · GuidanceCallout hero + Timeline compact + Role chip (Finding #1, #2)
  ├─ GuidanceCallout.tsx: size 동적 'hero' + role chip + solid CTA (NC_GUIDANCE_CTA_TOKENS 경유)
  ├─ NCDetailClient.tsx: closed_all일 때 Timeline-hero 유지, 그 외 Callout→Timeline 순서
  ├─ WorkflowTimeline sub-component: compact prop 지원
  ├─ NC_SPACING_TOKENS: calloutAfterTimeline → calloutPlacement로 rename + deprecated alias
  └─ 테스트: operator/manager, 11개 guidanceKey 시나리오 E2E, a11y tab 순서

커밋 4 · Banner compact + Docs list + Dialog CAS 2-step + List chip (Finding #3–#6)
  ├─ NonConformanceBanner.tsx: variant='compact' prop + 장비 상세 호출부 전환
  ├─ NCDocumentsSection.tsx: view state + 자동 5+ 전환 + list markup + AttachmentThumbnail size='xs'
  ├─ NCEditDialog.tsx: REQUIRED_FIELD_TOKENS 적용 + char count + 변경 요약 card (CONFIRM_PREVIEW_TOKENS 재사용) + useCasGuardedMutation 전환
  ├─ NCRepairDialog.tsx: 2-step (input → confirm, confirm 진입 시 version refetch) + useCasGuardedMutation 전환
  ├─ NonConformancesContent.tsx: row 단위 getActionChip(useMemo) + resolveNCGuidanceKey 리스트 호출
  ├─ apps/frontend/tests/e2e/non-conformances.spec.ts: 수리 등록 2-step 플로우 갱신
  ├─ apps/frontend/tests/e2e/equipment-detail.spec.ts: banner compact selector 갱신
  └─ scripts/bundle-baseline.json 갱신 (measure-bundle.mjs 재측정 후)
```

각 커밋은 `pre-push` (tsc + backend/frontend test + bundle-gate) 통과 후 push. 커밋 1, 2는 런타임 영향 0 → 안전지대. 커밋 3, 4는 E2E 필수.

---

## Phase 상세

### Phase 1 · Foundation Tokens (커밋 1)

#### 파일 1-1: `apps/frontend/lib/design-tokens/semantic.ts`

**(1.1.a) `CALLOUT_TOKENS.size.hero` 추가** (L518 size 블록 내):
```ts
size: {
  compact:  'px-3 py-2.5 min-h-[3rem]',
  default:  'px-4 py-3.5 min-h-[3.5rem]',
  spacious: 'px-5 py-4 min-h-[4rem]',
  hero:     'px-5 py-4 gap-3.5 min-h-[5rem] rounded-lg shadow-[0_4px_14px_-6px_var(--callout-hero-shadow,transparent)]',
}
```
- CSS 변수 `--callout-hero-shadow`는 **도메인-중립** 이름 (AP-2). 반출입에서도 opt-in 가능.
- `border-l-[6px]`는 emphasis=leftBorder에서만 의미 있음 → 기존 `leftBorder(v)` 함수가 size=hero일 때 두꺼운 border 반환하도록 확장. 다음 항목 참조.

**(1.1.b) `CALLOUT_TOKENS.emphasis.leftBorder` 시그니처 확장**:
```ts
leftBorder: (v: CalloutVariant, size: CalloutSize = 'default') => {
  const borderWidth = size === 'hero' ? 'border-l-[6px]' : 'border-l-4';
  return `${borderWidth} ${getSemanticLeftBorderClasses(v)} ${getSemanticContainerColorClasses(v)}`;
}
```
- 시그니처 변경이라 `getCalloutClasses` 구현도 업데이트: `CALLOUT_TOKENS.emphasis[emphasis](variant, size)`.
- 기본값 처리로 **기존 호출부 비파괴** (기존 호출은 size 인자 없이 호출 → default로 동작).

**(1.1.c) `ROLE_CHIP_TOKENS` 신규** (범용, L580 뒤):
```ts
export type RoleChipKey = 'my-turn' | 'waiting' | 'approval' | 'blocked' | 'done';

const ROLE_CHIP_VARIANT_MAP: Record<RoleChipKey, { color: SemanticColorKey }> = {
  'my-turn':  { color: 'warning'  },
  'waiting':  { color: 'info'     },
  'approval': { color: 'warning'  },
  'blocked':  { color: 'critical' },
  'done':     { color: 'ok'       },
} as const satisfies Record<RoleChipKey, { color: SemanticColorKey }>;

export const ROLE_CHIP_TOKENS = {
  base: 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-card border',
  dot:  'w-2 h-2 rounded-full shrink-0',
} as const;

export function getRoleChipClasses(key: RoleChipKey): { chip: string; dot: string } {
  const { color } = ROLE_CHIP_VARIANT_MAP[key];
  return {
    chip: `${ROLE_CHIP_TOKENS.base} ${getSemanticBorderOpacityClasses(color, 30)}`,
    dot: `${ROLE_CHIP_TOKENS.dot} ${getSemanticSolidBgClasses(color)}`,
  };
}
```
- `getSemanticBorderOpacityClasses(color, 30)`는 `border-brand-${color}/30`을 정적 매트릭스에서 반환 (AP-1). BRAND_CLASS_MATRIX에 `borderOpacity30` 키 추가 필요 — 다음 항목.

**(1.1.d) `BRAND_CLASS_MATRIX`에 opacity 키 추가** (brand.ts L150–251):
```ts
ok: {
  ...existing,
  borderOpacity30: 'border-brand-ok/30',
},
// 5개 semantic color 전부 (ok, warning, critical, info, neutral)
```
- `satisfies` 타입 가드가 누락 시 컴파일 에러로 잡음 (AP-3).
- 신규 tint가 아니라 기존 색의 opacity variant 추가이므로 :root/.dark CSS 변수 변경 불필요.

**(1.1.e) `CONFIRM_PREVIEW_TOKENS` 신규** (범용, L620 뒤):
```ts
export const CONFIRM_PREVIEW_TOKENS = {
  card: (tone: 'ok' | 'info' | 'neutral' = 'ok') => ({
    container: `rounded-md border p-3.5 text-sm space-y-2 ${getSemanticContainerColorClasses(tone)} ${getSemanticContainerBgOpacityClasses(tone, 4)}`,
    row: 'grid grid-cols-[90px_1fr] gap-2',
    rowLabel: 'text-muted-foreground text-xs',
    rowValue: '',
  }),
  hint: 'mt-4 flex items-start gap-2 text-xs text-muted-foreground rounded-md border px-3 py-2',
} as const;
```
- NCEditDialog 변경 요약 card, NCRepairDialog step2 요약 card에 공통 사용.

#### 파일 1-2: `apps/frontend/lib/design-tokens/form-field-tokens.ts` (신규)

**(1.2.a) `REQUIRED_FIELD_TOKENS` 신규** (범용):
```ts
export const REQUIRED_FIELD_TOKENS = {
  labelWrapper: 'flex items-center gap-1',
  asterisk:     'text-brand-critical',
  srOnlyLabel:  'sr-only', // "required" 번역키 경유
  inputBorder:  'border-l-[3px] border-l-brand-critical',
  charCount:    'text-[11px] font-mono text-muted-foreground text-right',
  optionalHint: 'text-[10.5px] font-mono text-muted-foreground',
} as const;

export interface RequiredFieldA11y {
  required: true;
  ariaRequired: 'true';
}

export const REQUIRED_FIELD_A11Y: RequiredFieldA11y = {
  required: true,
  ariaRequired: 'true',
} as const;
```
- 반출입/교정/부적합 모든 form에서 재사용. 별도 파일로 분리해 semantic.ts가 비대해지지 않게.

#### 파일 1-3: `apps/frontend/lib/design-tokens/components/non-conformance.ts`

**(1.3.a) `NC_BANNER_TOKENS.compact` variant 추가** (L84–95):
```ts
export const NC_BANNER_TOKENS = {
  alert: 'border-brand-critical bg-brand-critical/5 flex gap-3',
  alertCompact: 'border-brand-critical bg-brand-critical/5 flex items-center gap-3 py-2.5 px-3.5',
  icon: 'h-5 w-5 text-brand-critical',
  iconCompact: 'h-4 w-4 text-brand-critical shrink-0',
  title: 'text-brand-critical font-semibold text-lg',
  titleCompact: 'text-sm font-semibold text-brand-critical',
  desc: 'text-brand-critical/80',
  detailCard: 'bg-card p-3 rounded-lg border border-brand-critical/20',
  statusAlert: 'border-brand-critical/20 bg-brand-critical/5 ...',
  compactCta: 'text-sm font-semibold text-brand-critical underline underline-offset-[3px]',
} as const;
```

**(1.3.b) `NC_WORKFLOW_TOKENS.containerCompact` 추가** (L407–453):
```ts
container: 'rounded-lg border bg-card p-6 sm:p-7 shadow-sm',
containerCompact: 'rounded-lg border bg-card px-3.5 py-3 flex items-center gap-3',
```

**(1.3.c) `NC_WORKFLOW_GUIDANCE_TOKENS`에 `roleChip` 필드** (L822–913):
- `NCGuidanceEntry` 인터페이스에 `roleChip: RoleChipKey` 추가.
- `satisfies Record<NCGuidanceKey, NCGuidanceEntry>` 가드로 11개 누락 시 컴파일 에러 (AP-3).
- 매핑:
  ```
  open_operator                     → 'my-turn'
  open_manager                      → 'waiting'
  openBlockedRepair_operator        → 'blocked'
  openBlockedRepair_manager         → 'blocked'
  openBlockedRecalibration_operator → 'blocked'
  openBlockedRecalibration_manager  → 'blocked'
  openRejected_operator             → 'my-turn'
  openRejected_manager              → 'waiting'
  corrected_operator                → 'waiting'
  corrected_manager                 → 'approval'
  closed_all                        → 'done'
  ```

**(1.3.d) `NC_GUIDANCE_CTA_TOKENS` 신규**:
```ts
import type { CalloutVariant } from '@/lib/design-tokens/semantic';

export const NC_GUIDANCE_CTA_TOKENS = {
  primarySolid: (v: CalloutVariant) =>
    `text-[13px] font-semibold px-3 py-1.5 rounded-md text-white hover:brightness-110 inline-flex items-center gap-1.5 ${getSemanticSolidBgClasses(v)}`,
  secondaryOutlined:
    'text-[13px] px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 inline-flex items-center gap-1.5',
} as const;
```
- ctaKind='primary' 시 solid, 'repairLink'/'calibrationLink' 시 outlined (기존 동작 유지).

#### 파일 1-4: `apps/frontend/lib/design-tokens/components/checkout.ts`

**(1.4.a) `CHECKOUT_ALERT_TOKENS` deprecation JSDoc**:
```ts
/**
 * @deprecated 향후 CALLOUT_TOKENS(semantic.ts)로 통합 예정.
 * 새 변경은 CALLOUT_TOKENS + getCalloutClasses 사용 권장.
 * 마이그레이션 가이드: [별도 세션에서 문서화 예정]
 */
export const CHECKOUT_ALERT_TOKENS = { ... }; // 기존 유지
```
- **코드 변경 없음**, 주석만. 반출입 개발자에게 방향 고지.

### Phase 1 검증
- `pnpm tsc --noEmit` — 새 `satisfies` 타입 가드가 잡히는지.
- grep `CHECKOUT_ALERT_TOKENS` 사용처 변경 없음 확인.
- 런타임 영향 0 (선언만 추가). 브라우저 확인 불필요.

---

### Phase 2 · i18n Parity (커밋 2)

#### 파일 2-1: `apps/frontend/messages/ko/non-conformances.json`

신규 키 블록 (기존 `detail.guidance` 블록 내 추가):
```json
{
  "detail": {
    "guidance": {
      "roleChip": {
        "my-turn":  "처리자 작업",
        "waiting":  "처리자 대기",
        "approval": "관리자 승인 필요",
        "blocked":  "선행 작업 필요",
        "done":     "완료"
      }
    },
    "editDialog": {
      "causePlaceholder": "부적합의 원인을 구체적으로 기재해 주세요",
      "actionPlanPlaceholder": "예: 렌즈 교체 후 재교정 예정",
      "required": "필수",
      "optional": "선택",
      "changeSummary": {
        "title": "변경 요약",
        "modified": "수정됨",
        "unchanged": "변경 없음"
      },
      "save": {
        "default": "저장",
        "withCount": "저장 (변경 {count}건)"
      }
    },
    "repairDialog": {
      "stepLabel": "STEP {current}/{total}",
      "next": "다음",
      "edit": "수정",
      "register": "수리 등록",
      "cancel": "취소",
      "confirm": {
        "title": "수리 등록 확인",
        "subtitle": "아래 내용으로 수리 이력을 등록합니다. 이 작업은 되돌릴 수 없습니다.",
        "hint": "등록 즉시 이 부적합에 연결되어 종결이 가능해집니다. 이전 단계로 돌아가 수정할 수 있습니다."
      }
    },
    "documents": {
      "view": { "grid": "그리드", "list": "리스트" }
    }
  },
  "banner": {
    "compactTitle": "부적합 {count}건 미조치",
    "compactOverdue": "최장 {days}일 경과",
    "compactCta": "상세 보기"
  },
  "list": {
    "action": {
      "act": "조치",
      "approve": "승인",
      "blocked": "선행 필요",
      "blockedTooltip": {
        "repair": "수리 이력 등록 필요",
        "recalibration": "재교정 필요"
      },
      "done": "완료"
    }
  }
}
```

#### 파일 2-2: `apps/frontend/messages/en/non-conformances.json` (**신규 생성**)

**전체 구조는 ko 파일과 1:1 mirror**. 누락 시 런타임 fallback 미보장이므로 **모든 키** 번역. 신규 키:
```json
{
  "detail": {
    "guidance": {
      "roleChip": {
        "my-turn":  "Your action",
        "waiting":  "Awaiting operator",
        "approval": "Approval needed",
        "blocked":  "Prerequisite required",
        "done":     "Done"
      }
    },
    "editDialog": {
      "causePlaceholder": "Describe the non-conformance cause in detail",
      "actionPlanPlaceholder": "e.g., Replace lens and recalibrate",
      "required": "required",
      "optional": "optional",
      "changeSummary": { "title": "Change summary", "modified": "Modified", "unchanged": "Unchanged" },
      "save": { "default": "Save", "withCount": "Save ({count} changes)" }
    },
    "repairDialog": {
      "stepLabel": "STEP {current}/{total}",
      "next": "Next", "edit": "Edit", "register": "Register", "cancel": "Cancel",
      "confirm": {
        "title": "Confirm repair registration",
        "subtitle": "Registering repair history with the content below. This action cannot be undone.",
        "hint": "Once registered, this NC will be linked and eligible for closure. Go back to edit."
      }
    },
    "documents": { "view": { "grid": "Grid", "list": "List" } }
  },
  "banner": {
    "compactTitle": "{count} NC pending",
    "compactOverdue": "Longest {days}d overdue",
    "compactCta": "View details"
  },
  "list": {
    "action": {
      "act": "Act", "approve": "Approve", "blocked": "Blocked",
      "blockedTooltip": { "repair": "Repair history required", "recalibration": "Recalibration required" },
      "done": "Done"
    }
  }
}
```
기존 ko 전체(`title`, `status.*`, `toasts.*`, `fields.*`, `list.*`, `detail.*` 등)도 **모두 영문 번역**해 mirror. 번역 누락 시 키 그대로 노출돼 UI 깨짐.

#### (옵션) 파일 2-3: i18n key parity 검증 스크립트
`scripts/i18n-parity.mjs` 신규 — ko/en 두 파일의 key set diff 계산, 불일치 시 exit 1. pre-push에 선택적 통합. **이번 플랜에선 생성만, hook 통합은 별도 결정**.

### Phase 2 검증
- 두 파일 diff로 key set 동일 확인.
- `pnpm tsc --noEmit` — next-intl 타입 생성 확인.
- 로컬에서 `?locale=en` 쿼리 또는 브라우저 언어 설정으로 NC 페이지 진입 — 모든 문자열 영문 노출 확인.

---

### Phase 3 · GuidanceCallout hero + Timeline compact + Role chip (커밋 3)

#### 파일 3-1: `apps/frontend/components/non-conformances/GuidanceCallout.tsx`

**(3.1.a) size 동적 선택 + CSS 변수 주입** (L51–70):
```tsx
const isHero = entry.ctaKind !== 'none';
const size: CalloutSize = isHero ? 'hero' : 'default';
const heroShadowStyle = isHero
  ? ({ ['--callout-hero-shadow' as string]: `color-mix(in oklch, var(--brand-${entry.variant}) 30%, transparent)` } as React.CSSProperties)
  : undefined;

return (
  <aside
    role="alert"
    aria-live={isHero ? 'polite' : undefined}
    aria-labelledby={`nc-guidance-title-${guidanceKey}`}
    className={getCalloutClasses(entry.variant, entry.emphasis, size)}
    style={heroShadowStyle}
  >
    ...
  </aside>
);
```
- `aria-live="polite"`는 hero에만 (default는 스크롤 시 읽히지 않도록). 처음 마운트 시 공지.
- `aria-labelledby`로 title과 관계 명시.

**(3.1.b) role chip 렌더**:
```tsx
import { getRoleChipClasses, ROLE_CHIP_TOKENS } from '@/lib/design-tokens/semantic';
// ...
const roleChipClasses = getRoleChipClasses(entry.roleChip);

<div className="flex items-center gap-2 mb-1 flex-wrap">
  <StepBadge stepKey={entry.stepBadgeKey} />
  <span
    className={roleChipClasses.chip}
    aria-label={t(`detail.guidance.roleChip.${entry.roleChip}`)}
  >
    <span aria-hidden="true" className={roleChipClasses.dot} />
    {t(`detail.guidance.roleChip.${entry.roleChip}`)}
  </span>
</div>
```

**(3.1.c) CTA — solid button for primary, outlined for repairLink/calibrationLink** (L90–135):
```tsx
import { NC_GUIDANCE_CTA_TOKENS } from '@/lib/design-tokens/components/non-conformance';
// ctaKind === 'primary'
<button className={NC_GUIDANCE_CTA_TOKENS.primarySolid(entry.variant)} onClick={onScrollToAction}>
  {ctaLabel}
  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
</button>

// ctaKind === 'repairLink' | 'calibrationLink'
<Link className={NC_GUIDANCE_CTA_TOKENS.secondaryOutlined} href={...}>
  {ctaLabel}
</Link>
```

#### 파일 3-2: `apps/frontend/components/non-conformances/NCDetailClient.tsx`

**(3.2.a) 상태 그룹 배치** (L320–416, 특히 L397/L404):
```tsx
const isClosed = guidanceKey === 'closed_all';

return (
  <div className={NC_SPACING_TOKENS.statusGroup}>
    <Header ... />
    {hasRejection && <RejectionAlert ... />}
    {isClosed ? (
      // 종결: Timeline이 hero (기록 중심)
      <WorkflowTimeline nc={nc} currentStepIndex={currentStep} isLongOverdue={false} compact={false} />
    ) : (
      <>
        <GuidanceCallout
          guidanceKey={guidanceKey}
          onScrollToAction={scrollToAction}
          onRepairRegister={openRepairDialog}
          onCalibrationNav={navToCalibration}
        />
        <WorkflowTimeline nc={nc} currentStepIndex={currentStep} isLongOverdue={isLongOverdue} compact />
      </>
    )}
    <InfoCards ... />
    ...
  </div>
);
```

**(3.2.b) `NC_SPACING_TOKENS.calloutAfterTimeline` rename**:
- `calloutAfterTimeline` → `calloutTimelineGap` (의미 중립).
- 기존 이름은 `/** @deprecated use calloutTimelineGap */` JSDoc + 값 재export (비파괴).

#### 파일 3-3: WorkflowTimeline sub-component (NCDetailClient.tsx L666–722)

**(3.3.a) compact prop**:
```tsx
function WorkflowTimeline({
  nc,
  currentStepIndex,
  isLongOverdue,
  compact = false,
}: {
  nc: NonConformance;
  currentStepIndex: number;
  isLongOverdue: boolean;
  compact?: boolean;
}) {
  const containerClass = compact ? NC_WORKFLOW_TOKENS.containerCompact : NC_WORKFLOW_TOKENS.container;

  if (compact) {
    return (
      <div className={containerClass} role="group" aria-label={t('detail.timeline.label')}>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
          {t('detail.timeline.progressLabel')}
        </span>
        <div className="flex items-center gap-0 flex-1">
          {/* dots + connectors */}
        </div>
        <div className="flex gap-4 text-[11.5px] text-muted-foreground shrink-0">
          {/* 현재 단계 · 날짜 */}
        </div>
      </div>
    );
  }
  // full markup 유지
}
```

### Phase 3 검증
- 유닛: GuidanceCallout 스냅샷 (operator/manager × 11 guidanceKey).
- E2E: NC 상세 진입 → hero callout aria-live 읽힘, Timeline compact 확인.
- a11y: Tab 순서 CTA → outlined Link → Timeline → InfoCards → Action bar.
- 수동 확인: closed_all 시 Callout 없고 Timeline full 렌더.

---

### Phase 4 · 보조 변경 + CAS 전환 (커밋 4)

#### 파일 4-1: `apps/frontend/components/equipment/NonConformanceBanner.tsx`

**(4.1.a) variant prop 추가**:
```tsx
interface NonConformanceBannerProps {
  nonConformances: NonConformance[];
  variant?: 'full' | 'compact';
  showDetails?: boolean;
}

export function NonConformanceBanner({ nonConformances, variant = 'full', showDetails }: Props) {
  if (variant === 'compact') return <CompactBanner ncs={nonConformances} />;
  return <FullBanner ncs={nonConformances} showDetails={showDetails} />;
}
```

**(4.1.b) CompactBanner**:
```tsx
const longestOverdueDays = useMemo(
  () => Math.max(0, ...nonConformances.map(nc => daysSince(nc.discoveryDate))),
  [nonConformances]
);

return (
  <Alert variant="destructive" className={NC_BANNER_TOKENS.alertCompact}>
    <AlertTriangle className={NC_BANNER_TOKENS.iconCompact} aria-hidden="true" />
    <div className="text-sm flex-1">
      <strong className={NC_BANNER_TOKENS.titleCompact}>
        {t('banner.compactTitle', { count: nonConformances.length })}
      </strong>
      {longestOverdueDays > 0 && (
        <span className="text-brand-critical/80 ml-2">
          · {t('banner.compactOverdue', { days: longestOverdueDays })}
        </span>
      )}
    </div>
    <Link href="#non-conformances" className={NC_BANNER_TOKENS.compactCta}>
      {t('banner.compactCta')} →
    </Link>
  </Alert>
);
```

**(4.1.c) 호출부**: 장비 상세 페이지에서 `<NonConformanceBanner variant="compact" ... />` 전달. grep으로 모든 호출부 확인 — 리스트형 full은 유지, 장비 상세만 compact.

#### 파일 4-2: `apps/frontend/components/non-conformances/NCDocumentsSection.tsx`

**(4.2.a) view state (lazy init, auto-switch 없음)**:
```tsx
const [view, setView] = useState<'grid' | 'list'>(() =>
  docs.length >= 5 ? 'list' : 'grid'
);
// docs.length가 나중에 바뀌어도 사용자 선택 유지 (useEffect로 덮어쓰지 않음)
```

**(4.2.b) toggle UI**:
```tsx
<div className="inline-flex border rounded-md overflow-hidden text-xs" role="group" aria-label={t('detail.documents.view.label')}>
  <button aria-pressed={view === 'grid'} onClick={() => setView('grid')} className={cn('px-2 py-1 inline-flex items-center gap-1', view === 'grid' && 'bg-muted font-semibold')}>
    <LayoutGrid className="h-3.5 w-3.5" /> {t('detail.documents.view.grid')}
  </button>
  <button aria-pressed={view === 'list'} onClick={() => setView('list')} className={cn('px-2 py-1 inline-flex items-center gap-1', view === 'list' && 'bg-muted font-semibold')}>
    <List className="h-3.5 w-3.5" /> {t('detail.documents.view.list')}
  </button>
</div>
```

**(4.2.c) list markup**:
```tsx
{view === 'list' && (
  <ul className="rounded-lg border divide-y divide-border/60 overflow-hidden">
    {docs.map(d => (
      <li key={d.id} className="grid grid-cols-[40px_1fr_90px_110px_32px] gap-3 items-center px-3 py-2.5 hover:bg-muted/30">
        <AttachmentThumbnail doc={d} size="xs" />
        <div className="min-w-0">
          <div className="text-sm truncate">{d.originalFileName}</div>
          <div className="text-[11.5px] text-muted-foreground font-mono">
            {d.uploader?.name ?? '-'} · {d.mimeType}
          </div>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{formatSize(d.size)}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{formatDateTime(d.createdAt)}</span>
        {canDelete && <ActionMenu doc={d} />}
      </li>
    ))}
  </ul>
)}
```

**(4.2.d) `AttachmentThumbnail` size prop 확장** (`apps/frontend/components/non-conformances/NCDocumentsSection.tsx:216`):
```tsx
function AttachmentThumbnail({ doc, size = 'default' }: { doc: NCDocument; size?: 'xs' | 'default' }) {
  const sizeClass = size === 'xs'
    ? 'w-10 h-10 rounded-md'
    : 'aspect-square rounded-lg';
  return <div className={cn(sizeClass, ...)}>...</div>;
}
```

#### 파일 4-3: `apps/frontend/components/non-conformances/NCEditDialog.tsx`

**(4.3.a) REQUIRED_FIELD_TOKENS 적용**:
```tsx
import { REQUIRED_FIELD_TOKENS, REQUIRED_FIELD_A11Y } from '@/lib/design-tokens/form-field-tokens';
// ...
<Label htmlFor="nc-cause" className={REQUIRED_FIELD_TOKENS.labelWrapper}>
  {t('fields.cause')}
  <span className={REQUIRED_FIELD_TOKENS.asterisk} aria-hidden="true">*</span>
  <span className={REQUIRED_FIELD_TOKENS.srOnlyLabel}>{t('detail.editDialog.required')}</span>
</Label>
<Textarea
  id="nc-cause"
  value={cause}
  onChange={(e) => setCause(e.target.value.slice(0, 500))}
  maxLength={500}
  placeholder={t('detail.editDialog.causePlaceholder')}
  required={REQUIRED_FIELD_A11Y.required}
  aria-required={REQUIRED_FIELD_A11Y.ariaRequired}
  className={REQUIRED_FIELD_TOKENS.inputBorder}
/>
<div className={REQUIRED_FIELD_TOKENS.charCount}>{cause.length} / 500</div>
```

**(4.3.b) 변경 요약 card (CONFIRM_PREVIEW_TOKENS 재사용)**:
```tsx
const changed = {
  cause: cause !== initial.cause,
  actionPlan: actionPlan !== (initial.actionPlan ?? ''),
};
const changeCount = Object.values(changed).filter(Boolean).length;
const previewTokens = CONFIRM_PREVIEW_TOKENS.card('neutral');

<div className={previewTokens.container}>
  <div className="font-mono text-[10.5px] text-muted-foreground">{t('detail.editDialog.changeSummary.title')}</div>
  <div className={previewTokens.row}>
    <span className={previewTokens.rowLabel}>{t('fields.cause')}</span>
    <span>{changed.cause ? <strong className="text-brand-ok">{t('detail.editDialog.changeSummary.modified')}</strong> : t('detail.editDialog.changeSummary.unchanged')}</span>
  </div>
  {/* actionPlan 동일 */}
</div>
```

**(4.3.c) useCasGuardedMutation 전환**:
```tsx
import { useCasGuardedMutation } from '@/hooks/use-cas-guarded-mutation';

const editMutation = useCasGuardedMutation({
  fetchCasVersion: async () => (await fetchNC(nc.id)).version,
  mutationFn: (vars, casVersion) => updateNC(nc.id, { ...vars, casVersion }),
  onSuccess: () => { ... },
  onError: (err) => {
    if (err.code === 'VERSION_CONFLICT') {
      toast({ title: t('toasts.versionConflict'), variant: 'destructive' });
      queryClient.invalidateQueries(queryKeys.nc.detail(nc.id));
    }
    // ...
  },
});
```
- 기존 useOptimisticMutation 호출부 제거. CAS 409 시 backend detail 캐시 반드시 삭제 (memory `CAS 409 발생 시 backend detail 캐시 반드시 삭제`).

**(4.3.d) submit 버튼**:
```tsx
<Button
  disabled={editMutation.isPending || !cause.trim() || changeCount === 0}
  onClick={() => editMutation.mutate({ cause, actionPlan })}
>
  {changeCount > 0
    ? t('detail.editDialog.save.withCount', { count: changeCount })
    : t('detail.editDialog.save.default')}
</Button>
```

#### 파일 4-4: `apps/frontend/components/non-conformances/NCRepairDialog.tsx`

**(4.4.a) 2-step state + step 공지**:
```tsx
const [step, setStep] = useState<'input' | 'confirm'>('input');
const liveRegionRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!open) setStep('input');
}, [open]);

// step 전환 시 aria-live 공지
useEffect(() => {
  if (liveRegionRef.current) {
    liveRegionRef.current.textContent = t('detail.repairDialog.stepLabel', {
      current: step === 'input' ? 1 : 2,
      total: 2,
    });
  }
}, [step, t]);
```

**(4.4.b) confirm step 진입 시 CAS version refetch** (AP-4):
```tsx
const handleNext = form.handleSubmit(async () => {
  // confirm 진입 직전 최신 version 확보 (stale 감지)
  try {
    const latest = await fetchNC(nc.id);
    if (latest.version !== nc.version) {
      toast({ title: t('toasts.versionMismatch'), variant: 'destructive' });
      queryClient.invalidateQueries(queryKeys.nc.detail(nc.id));
      onClose();
      return;
    }
    setStep('confirm');
  } catch (err) {
    toast({ title: t('toasts.fetchFailed'), variant: 'destructive' });
  }
});
```

**(4.4.c) confirm step markup**:
```tsx
const previewTokens = CONFIRM_PREVIEW_TOKENS.card('ok');
const values = form.getValues();

<div
  ref={liveRegionRef}
  aria-live="polite"
  className="sr-only"
/>
{step === 'confirm' && (
  <>
    <DialogHeader>
      <DialogTitle>{t('detail.repairDialog.confirm.title')}</DialogTitle>
      <DialogDescription>{t('detail.repairDialog.confirm.subtitle')}</DialogDescription>
    </DialogHeader>
    <div className={previewTokens.container}>
      <div className={previewTokens.row}>
        <span className={previewTokens.rowLabel}>{t('fields.repairDate')}</span>
        <span className="font-mono">{values.repairDate}</span>
      </div>
      <div className={previewTokens.row}>
        <span className={previewTokens.rowLabel}>{t('fields.repairResult')}</span>
        <Badge variant={values.repairResult === 'COMPLETED' ? 'default' : 'secondary'}>
          {t(`repairResult.${values.repairResult}`)}
        </Badge>
      </div>
      <div className={previewTokens.row}>
        <span className={previewTokens.rowLabel}>{t('fields.description')}</span>
        <span>{values.repairDescription}</span>
      </div>
      {values.notes && (
        <div className={previewTokens.row}>
          <span className={previewTokens.rowLabel}>{t('fields.notes')}</span>
          <span className="text-muted-foreground">{values.notes}</span>
        </div>
      )}
    </div>
    <Alert className={CONFIRM_PREVIEW_TOKENS.hint}>
      <Info className="h-3.5 w-3.5" aria-hidden="true" />
      <AlertDescription>{t('detail.repairDialog.confirm.hint')}</AlertDescription>
    </Alert>
    <DialogFooter className="justify-between">
      <Button variant="outline" onClick={() => setStep('input')}>
        ← {t('detail.repairDialog.edit')}
      </Button>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose}>{t('detail.repairDialog.cancel')}</Button>
        <Button
          onClick={() => createRepairMutation.mutate(values)}
          disabled={createRepairMutation.isPending}
          className="bg-brand-ok text-white hover:brightness-110"
        >
          {t('detail.repairDialog.register')}
        </Button>
      </div>
    </DialogFooter>
  </>
)}
```

**(4.4.d) useCasGuardedMutation 전환** (기존 createRepairMutation 교체):
```tsx
const createRepairMutation = useCasGuardedMutation({
  fetchCasVersion: async () => (await fetchNC(nc.id)).version,
  mutationFn: (vars, casVersion) => createRepairForNC(nc.id, { ...vars, casVersion }),
  onSuccess: () => { ... onClose(); },
  onError: handleVersionConflict,
});
```

#### 파일 4-5: `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx`

**(4.5.a) row 단위 memoized helper**:
```tsx
import { resolveNCGuidanceKey, NC_WORKFLOW_GUIDANCE_TOKENS } from '@/lib/design-tokens/components/non-conformance';

const { can } = usePermissions();
const canCloseNC = can(Permission.CLOSE_NON_CONFORMANCE);

// 리스트 상단에서 한 번 계산 (role은 페이지 단위)
// 각 row는 useMemo 경유 — N행 × 매 렌더 함수 호출 방지

function NCListRow({ nc, canCloseNC }: { nc: NonConformance; canCloseNC: boolean }) {
  const t = useTranslations('non-conformances');
  const chip = useMemo(() => {
    const key = resolveNCGuidanceKey(nc, { canCloseNC });
    const entry = NC_WORKFLOW_GUIDANCE_TOKENS[key];
    switch (entry.roleChip) {
      case 'my-turn':  return { label: t('list.action.act'),      variant: 'warning' as const, tooltip: undefined };
      case 'approval': return { label: t('list.action.approve'),  variant: 'warning' as const, tooltip: undefined };
      case 'blocked':  return {
        label: t('list.action.blocked'),
        variant: 'critical' as const,
        tooltip: key.startsWith('openBlockedRepair')
          ? t('list.action.blockedTooltip.repair')
          : t('list.action.blockedTooltip.recalibration'),
      };
      case 'done':     return { label: t('list.action.done'),     variant: 'neutral' as const, tooltip: undefined };
      case 'waiting':  return null;
    }
  }, [nc, canCloseNC, t]);
  // ...
}
```
- **AP-7**: 행 컴포넌트 분리 + `useMemo`로 resolveNCGuidanceKey 호출 캐싱. N행 × 매 렌더 regression 방지.

**(4.5.b) 액션 컬럼 markup** (L487–491, L516–518):
```tsx
<div className="flex justify-end gap-1 items-center" aria-label={t('list.action.label')}>
  {chip && (
    <span
      className={cn('text-[10px] font-semibold px-1.5 py-0 rounded-full', getActionChipClasses(chip.variant))}
      title={chip.tooltip}
      aria-label={chip.tooltip ?? chip.label}
    >
      {chip.label} →
    </span>
  )}
  <span className={NC_LIST_TOKENS.actionButton}>
    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
  </span>
</div>
```
- `getActionChipClasses(variant)`는 `NC_LIST_TOKENS`에 추가 (하드코딩 방지).

#### 파일 4-6: E2E 스펙 갱신

- `apps/frontend/tests/e2e/non-conformances.spec.ts`:
  - 수리 등록 플로우: `click('수리 등록')` → `click('다음')` + `click('수리 등록')` 2-step으로.
  - NC 상세 hero callout selector (`[role="alert"][aria-live="polite"]`).
  - 리스트 chip assertion (operator가 OPEN NC 보면 "조치" chip).
- `apps/frontend/tests/e2e/equipment-detail.spec.ts`:
  - compact banner selector 업데이트 (full→compact).

#### 파일 4-7: Bundle baseline 갱신

```bash
pnpm --filter frontend run build
node scripts/measure-bundle.mjs   # baseline 자동 측정
node scripts/check-bundle-size.mjs # 허용 범위 내 확인
```
`scripts/bundle-baseline.json` 및 관련 baseline 파일(`baseline-non-conformances.json` 등 domain별 분리가 존재하면 해당 파일) 갱신. tolerance 5% 내 기대.

### Phase 4 검증
- `pnpm tsc --noEmit`.
- `pnpm --filter frontend run test`.
- `pnpm --filter frontend run test:e2e non-conformances equipment-detail`.
- 수동 브라우저 (operator + manager 계정 각각):
  - 장비 상세 → NC 2건 있는 장비 → compact banner 한 줄.
  - compact banner 링크 클릭 → NC 상세 → hero callout, role chip 노출.
  - NCEditDialog: `*` + placeholder + char count + 변경 없으면 save disabled.
  - NCEditDialog: 다른 탭에서 NC 수정 후 현재 탭 save → version conflict toast.
  - NCRepairDialog: 입력 → "다음 →" → confirm card → "← 수정"으로 돌아가기 → "수리 등록".
  - NC 문서 6개 업로드 → list view 자동, toggle 가능.
  - 리스트: OPEN/corrected/closed 각각 chip 다르게, blocked는 tooltip.
  - closed NC 상세 → Timeline full (Callout 없음).
  - `?locale=en` → 모든 UI 문구 영문.

---

## Cross-Cutting Concerns (체크리스트)

### SSOT 감사 테이블
| 변경 요소 | 위치 | 재사용 범위 | 하드코딩 검사 |
|----------|------|------------|--------------|
| `CALLOUT_TOKENS.size.hero` | semantic.ts | NC + 미래 반출입 | CSS 변수 경유 ✓ |
| `ROLE_CHIP_TOKENS` | semantic.ts | NC + 반출입/교정 opt-in | BRAND_CLASS_MATRIX 경유 ✓ |
| `REQUIRED_FIELD_TOKENS` | form-field-tokens.ts | 전 도메인 form | 상수 토큰 ✓ |
| `CONFIRM_PREVIEW_TOKENS` | semantic.ts | NC + 미래 confirm dialog | 헬퍼 함수 ✓ |
| `NC_BANNER_TOKENS.alertCompact` | non-conformance.ts | NC-specific (의도적) | ✓ |
| `NC_WORKFLOW_TOKENS.containerCompact` | non-conformance.ts | NC-specific | ✓ |
| `NC_GUIDANCE_CTA_TOKENS` | non-conformance.ts | NC guidance 전용 | ✓ |
| `roleChip` 필드 (NC Guidance) | non-conformance.ts | NC-specific | satisfies 가드 ✓ |
| `BRAND_CLASS_MATRIX.borderOpacity30` | brand.ts | 전 도메인 | ✓ |

### i18n Parity 테이블 (모두 커밋 2에 포함)
- 신규 키 23개 × ko + en = 46개 키.
- 기존 ko 파일의 미번역 키 (en 파일 부재로 발생한 gap) 전부 신규 en 파일에 포함.

### Dark Mode
- 신규 토큰 전부 `var(--brand-*)` 경유 → `:root` + `.dark` CSS 변수 자동 전환.
- `dark:` prefix 사용 금지 유지 (memory `Brand Color Migration`).
- `--callout-hero-shadow` CSS 변수는 변수 자체가 `color-mix(in oklch, var(--brand-*) 30%, transparent)`로 계산 → dark mode에서도 자동 동작.

### 접근성 (WCAG 2.2 AA)
- Color alone: role chip은 텍스트 라벨 + dot. ✓
- Focus indicator: `focus-visible` 유지. ✓
- Dialog 2-step: `aria-live="polite"` region으로 step 공지. focus trap. ESC로 닫기. ✓
- `role="alert"` + `aria-live` hero callout. ✓
- Required field: visual `*` + sr-only "required" + `aria-required="true"`. ✓
- Keyboard 순서: banner CTA → callout CTA → Timeline → InfoCards → 섹션 → Action bar. ✓

### 성능
- `useMemo` 적용: NCListRow(resolveNCGuidanceKey), CompactBanner(longestOverdueDays).
- lazy init: NCDocumentsSection view state.
- 신규 컴포넌트 0개 (기존 컴포넌트 확장만) → React reconciliation 변동 최소.
- 리스트 virtualization 미적용 (현재 데이터 볼륨 < 500건 가정, 필요 시 후속).

### 보안
- Server-side user extraction (Rule 2) 유지 — Dialog submit은 JWT `req.user.userId` 경유.
- CAS version lock으로 race condition 방지.
- 도메인 데이터 fabricate 없음 (placeholder는 일반 가이드 문구, 사용자 확정).

### Rollback 전략
| 커밋 | Rollback 영향 | 안전성 |
|------|-------------|-------|
| 1 (Foundation) | 선언만 추가. revert해도 unused. | 완전 안전 |
| 2 (i18n) | 번역 키 삭제. 후속 커밋에서 참조하면 빌드 깨짐 → 커밋 3,4와 같이 revert. | 안전 (순서 유지) |
| 3 (Callout 승격) | 기존 Timeline-hero 복귀. closed_all 동작 동일. | 안전 |
| 4 (보조) | finding별 cherry-pick reset 가능. CAS 전환은 되돌리면 stale 재발 — 주의. | 주의 필요 |

### Bundle Size
- 토큰 추가 (tree-shakeable) → 사용처 있어야만 포함.
- `LayoutGrid`, `List`, `Info`, `ArrowDown` (lucide-react) — 이미 번들에 존재 확인 후 추가.
- 예상 gzip 증가: ~1.5–2.5KB (i18n 46개 키 + 컴포넌트 로직).
- `scripts/measure-bundle.mjs` 재측정 → baseline 갱신 + pre-push gate 통과.

### Observability
- UI-only 변경. 백엔드 이벤트/API 없음.
- (미래) Callout CTA 클릭률 추적 필요 시 `onScrollToAction` 안에 analytics hook 자리만 열어둠 (계측 코드는 본 플랜 외).

---

## Critical Files (수정 대상)

```
apps/frontend/lib/design-tokens/semantic.ts                                    (커밋 1)
apps/frontend/lib/design-tokens/brand.ts                                        (커밋 1, borderOpacity30)
apps/frontend/lib/design-tokens/form-field-tokens.ts                            (커밋 1, 신규 파일)
apps/frontend/lib/design-tokens/components/non-conformance.ts                   (커밋 1)
apps/frontend/lib/design-tokens/components/checkout.ts                          (커밋 1, @deprecated 주석)
apps/frontend/messages/ko/non-conformances.json                                 (커밋 2)
apps/frontend/messages/en/non-conformances.json                                 (커밋 2, 신규 파일)
apps/frontend/components/non-conformances/GuidanceCallout.tsx                   (커밋 3)
apps/frontend/components/non-conformances/NCDetailClient.tsx                    (커밋 3, WorkflowTimeline 포함)
apps/frontend/components/equipment/NonConformanceBanner.tsx                     (커밋 4)
apps/frontend/app/(dashboard)/equipment/[id]/*                                  (커밋 4, NonConformanceBanner 호출부)
apps/frontend/components/non-conformances/NCDocumentsSection.tsx                (커밋 4)
apps/frontend/components/non-conformances/NCEditDialog.tsx                      (커밋 4, CAS 전환 포함)
apps/frontend/components/non-conformances/NCRepairDialog.tsx                    (커밋 4, 2-step + CAS)
apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx       (커밋 4, row memoization)
apps/frontend/tests/e2e/non-conformances.spec.ts                                (커밋 4, 2-step 갱신)
apps/frontend/tests/e2e/equipment-detail.spec.ts                                (커밋 4, compact selector)
scripts/bundle-baseline.json                                                    (커밋 4, bundle-gate 갱신)
scripts/i18n-parity.mjs                                                         (커밋 2, 선택)
```

## 재사용할 기존 유틸/패턴

- `getCalloutClasses(variant, emphasis, size)` — `lib/design-tokens/semantic.ts` — size='hero' 확장.
- `getSemanticBadgeClasses(semantic)` — 리스트 chip.
- `resolveNCGuidanceKey(nc, { canCloseNC })` — 리스트에서도 재호출 (데이터 충분).
- `useCasGuardedMutation` — `hooks/use-cas-guarded-mutation.ts` (memory 확인됨).
- `AttachmentThumbnail` — size prop 확장.
- `usePermissions().can(Permission.CLOSE_NON_CONFORMANCE)` — 페이지 레벨 role 결정.
- shadcn `Dialog`, `AlertDialog`, `Alert`, `Badge`, `Button`, `Textarea`, `Label` — 신규 의존성 없음.

## Deferred (의도적 제외, 별도 세션)

- **CHECKOUT_ALERT_TOKENS + CALLOUT_TOKENS 통합**: 범위 크고 반출입 레이아웃 재테스트 필수. 이번엔 @deprecated JSDoc만.
- **전체 locale `en` 추가**: 다른 도메인 파일(equipment, checkouts, calibration 등) en 번역은 별도 세션.
- **"내 차례만 보기" 리스트 필터**: URL param 추가, 별도 feature.
- **문서 sort (date/size)**: list view 확장. 별도 세션.
- **Row virtualization**: 현재 데이터 규모에선 과잉. 500+ 행 발생 시 재평가.
- **Callout CTA analytics**: 훅 자리만, 계측은 별도.
- **i18n-parity 스크립트의 pre-push 통합**: 파일은 생성하되 hook 연결은 별도 논의.

---

## 자체 감사 체크리스트 (각 커밋 push 전 실행)

memory `feedback_pre_commit_self_audit.md` 7개 항목:
- [ ] SSOT 경유 (디자인 토큰 레이어 외 색/spacing 하드코딩 0)
- [ ] eslint-disable 0
- [ ] any 0
- [ ] role 리터럴 0 (Permission enum 경유)
- [ ] setQueryData 0 (useCasGuardedMutation 또는 invalidateQueries)
- [ ] a11y (aria-*, focus-visible, sr-only)
- [ ] 하드코딩 URL 0

그리고 본 플랜 특화:
- [ ] `satisfies` 타입 가드 모든 토큰 맵에 적용됐는가
- [ ] 기본값 인자로 기존 호출부 비파괴 보장됐는가
- [ ] i18n ko/en 두 파일 key set 동일한가
- [ ] CAS 전환 컴포넌트에서 query invalidation 수행하는가
- [ ] E2E 스펙이 새 selector/flow 반영됐는가
- [ ] bundle baseline 재측정·갱신됐는가
