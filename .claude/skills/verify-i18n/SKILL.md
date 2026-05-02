---
name: verify-i18n
description: Verifies i18n translation consistency — en/ko key pair matching, no empty translations, namespace references, Zod schema hardcoded message detection, dynamic i18n key coverage, routeMap↔navigation.json sync. Run after adding/modifying messages/{en,ko}/*.json or route-metadata.ts.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 도메인명 (equipment, dashboard, audit 등)]'
---

# i18n 번역 일관성 검증

## Purpose

`apps/frontend/messages/` 디렉토리의 번역 파일이 다음 규칙을 준수하는지 검증합니다:

1. **en/ko 키 쌍 일치** — 모든 번역 도메인에서 영어/한국어 파일이 동일한 키 구조를 가져야 함
2. **빈 번역 없음** — 빈 문자열("")로 남겨진 번역 없음
3. **네임스페이스 참조 일관성** — `useTranslations('namespace')` 호출과 실제 메시지 파일이 일치
4. **누락된 도메인 파일** — en/에 있는 파일이 ko/에도 존재하고 그 반대도 성립

## When to Run

- `apps/frontend/messages/{en,ko}/*.json`을 추가/수정한 후
- 새 컴포넌트에서 `useTranslations()` 또는 `getTranslations()`를 사용한 후
- 번역 키를 추가하거나 삭제한 후
- `lib/navigation/route-metadata.ts`에 라우트를 추가/수정한 후

## Related Files

| File | Purpose |
|---|---|
| `apps/frontend/messages/en/*.json` | 영어 번역 파일 (도메인별) |
| `apps/frontend/messages/ko/*.json` | 한국어 번역 파일 (도메인별) |
| `apps/frontend/lib/i18n/request.ts` | next-intl 설정 |
| `apps/frontend/lib/i18n/use-enum-labels.ts` | i18n 기반 Enum Label Hooks |
| `apps/frontend/lib/navigation/route-metadata.ts` | routeMap — 브레드크럼 labelKey SSOT |
| `apps/frontend/lib/navigation/use-breadcrumb-metadata.ts` | 동적 브레드크럼 라벨 훅 |

## Workflow

### Step 1: en/ko 파일 쌍 존재 확인

두 언어 디렉토리에 동일한 파일이 모두 존재하는지 확인합니다.
**PASS:** 두 디렉토리의 파일 목록이 완전 일치. **FAIL:** 한쪽에만 파일이 있으면 누락.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 1

### Step 2: 도메인별 en/ko 키 쌍 일치 확인

각 도메인 파일의 JSON 키 구조가 en/ko 간에 완전히 일치하는지 확인합니다.
**PASS:** 모든 도메인에서 키 불일치 없음. **FAIL:** 키 불일치 발견 시 누락 쪽에 추가.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 2

### Step 3: 빈 번역 값 탐지

비어 있는 번역 문자열("")을 탐지합니다.
**PASS:** 0개 결과. **FAIL:** 빈 문자열 발견 시 실제 번역 추가.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 3

### Step 4: useTranslations 네임스페이스 참조 확인

컴포넌트에서 사용하는 번역 네임스페이스가 실제 메시지 파일과 일치하는지 확인합니다.
**PASS:** 모든 최상위 네임스페이스에 대응 파일 존재. **FAIL:** 미존재 네임스페이스 참조.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 4

### Step 5: ICU 메시지 변수 쌍 일치 확인

en/ko에서 `{variable}` 플레이스홀더가 동일하게 사용되는지 확인합니다.
**PASS:** 차이 없음. **INFO:** 불일치 시 수동 확인 권장.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 5

### Step 6: 프론트엔드 Zod 스키마 하드코딩 메시지 탐지

컴포넌트 내 Zod 스키마에서 하드코딩된 검증 메시지를 탐지합니다.
**PASS:** 0개 결과. **FAIL:** 하드코딩 발견 시 `createSchema(t)` 팩토리 패턴으로 전환.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 6

### Step 7: 동적 i18n 키 커버리지 확인

`t('key.${dynamicValue}')` 패턴의 동적 키가 en/ko JSON에 모두 존재하는지 확인합니다.
**PASS:** 모든 enum 값에 대응 키 존재. **FAIL:** 누락 시 런타임 raw 키 표시.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 7

### Step 8: routeMap labelKey ↔ navigation.json 교차 검증

`route-metadata.ts`의 모든 `labelKey`가 `navigation.json`에 실제로 존재하는지 확인합니다.
또한, 실제 존재하는 `app/(dashboard)/**/page.tsx`에 대응하는 routeMap 항목이 있는지 역방향 검증합니다.
**PASS:** 모든 labelKey가 navigation.json에 존재하고, 모든 페이지가 routeMap에 등록됨. **FAIL:** 누락 발견.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 8

### Step 9: fieldLabels cross-namespace 중복 탐지

`audit.fieldLabels`가 전체 엔티티 필드 라벨의 SSOT입니다. 다른 namespace(approvals, checkouts 등)에 동일한 `fieldLabels` 블록이 중복 정의되어 있으면 audit.json과 드리프트가 발생합니다.
**PASS:** `audit.json` 외 파일에 `fieldLabels` 최상위 키 없음. **FAIL:** 중복 발견 시 해당 블록 제거, audit.json으로 통합.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 9

### Step 10: audit SSOT enum ↔ i18n 동기화 검증

`packages/schemas/src/enums/audit.ts`의 `AUDIT_ENTITY_TYPE_VALUES`와 `AUDIT_ACTION_VALUES`가 `audit.json`의 `entityTypes`/`actions`/`fieldLabels` 키와 동기화되는지 확인합니다.
**PASS:** SSOT enum의 모든 값이 i18n에 존재. **FAIL:** 누락 발견 시 audit.json에 키 추가 필요.

상세: [references/i18n-checks.md](references/i18n-checks.md) Step 10

### Step 11: getSamplerPresetOrder() ↔ qr.json 키 동기화 (2026-04-19 추가)

`getSamplerPresetOrder()`가 반환하는 7개 preset 배열(`xl, large, medium, small, xs, xxs, micro`)이
`apps/frontend/messages/*/qr.json`의 `qrDisplay.sampler.header.*` 키 및 `qrDisplay.size.*` 키와
완전히 동기화되어야 한다.

Worker는 i18n-free이므로 메인 스레드(`EquipmentQRButton.tsx`)가 `getSamplerPresetOrder()`를 순회하며
`t('sampler.header.{preset}', ...)` / `t('size.{preset}')` 형태로 동적 키를 생성한다.
preset이 추가/삭제될 때 i18n 키 누락이 런타임 raw 키 표시 버그를 유발한다.

```bash
node -e "
const en = require('./apps/frontend/messages/en/qr.json');
const ko = require('./apps/frontend/messages/ko/qr.json');
// getSamplerPresetOrder() 와 동일한 배열
const order = ['xl','large','medium','small','xs','xxs','micro'];
const sections = [
  { name: 'sampler.header', enKeys: Object.keys(en.qrDisplay?.sampler?.header ?? {}), koKeys: Object.keys(ko.qrDisplay?.sampler?.header ?? {}) },
  { name: 'size',           enKeys: Object.keys(en.qrDisplay?.size ?? {}),            koKeys: Object.keys(ko.qrDisplay?.size ?? {}) },
];
sections.forEach(({ name, enKeys, koKeys }) => {
  const missing = order.filter(p => !enKeys.includes(p) || !koKeys.includes(p));
  const extra   = [...new Set([...enKeys, ...koKeys])].filter(k => !order.includes(k));
  if (missing.length === 0 && extra.length === 0) console.log('PASS: qrDisplay.' + name + ' 7개 키 완전 동기화');
  else { if (missing.length) console.log('FAIL: qrDisplay.' + name + ' 누락=' + missing.join(',')); if (extra.length) console.log('WARN: qrDisplay.' + name + ' 초과=' + extra.join(',')); }
});
" 2>/dev/null
```

**PASS:** 두 섹션 모두 7개 키 완전 동기화 (누락/초과 없음).
**FAIL:** `getSamplerPresetOrder()` 반환값에 있는 preset이 en/ko qr.json 키에 없거나, 그 반대.

> **연동 검증**: `EquipmentQRButton.tsx`에서 `getSamplerPresetOrder().map((preset) => t(\`size.${preset}\`))` 패턴으로 동적 키를 생성하므로, i18n 키가 누락되면 런타임에서 raw 키(`size.xl` 등)가 그대로 노출된다.

### Step 12: NCGuidanceKey ↔ non-conformances.json 가이던스 키 동기화 (2026-04-22 추가)

`NC_WORKFLOW_GUIDANCE_TOKENS`의 키(`NCGuidanceKey` union)와 `non-conformances.json`의
`detail.guidance.*` 서브 키가 완전히 동기화되어야 한다.

`GuidanceCallout.tsx`는 `t(\`detail.guidance.${guidanceKey}.title\`)`, `.body`, `.ctaHint` 등
동적 키를 생성하므로, guidance 토큰 키 추가 시 i18n 누락이 런타임 raw 키 표시 버그를 유발한다.

**검사 대상 키 (현재 11개):**
`open_operator`, `open_manager`, `openRejected_operator`, `openRejected_manager`,
`openBlockedRepair_operator`, `openBlockedRepair_manager`,
`openBlockedRecalibration_operator`, `openBlockedRecalibration_manager`,
`corrected_operator`, `corrected_manager`, `closed_all`

```bash
node -e "
const en = require('./apps/frontend/messages/en/non-conformances.json');
const ko = require('./apps/frontend/messages/ko/non-conformances.json');

// NC_WORKFLOW_GUIDANCE_TOKENS의 키 집합 (하드코딩 없이 i18n 키로 검증)
// 제외 목록: NCGuidanceKey가 아닌 detail.guidance 하위 네임스페이스
//   stepBadge   — STEP N/3 배지 텍스트 서브 네임스페이스
//   scrollToAction — 스크롤 CTA 단일 키
//   roleChip    — 역할 chip 레이블 서브 네임스페이스 (2026-04-24 Phase 2 추가)
const GUIDANCE_NON_KEY_NS = new Set(['stepBadge', 'scrollToAction', 'roleChip']);
const enKeys = Object.keys(en.detail?.guidance ?? {}).filter(k => !GUIDANCE_NON_KEY_NS.has(k));
const koKeys = Object.keys(ko.detail?.guidance ?? {}).filter(k => !GUIDANCE_NON_KEY_NS.has(k));

const missing_en = koKeys.filter(k => !enKeys.includes(k));
const missing_ko = enKeys.filter(k => !koKeys.includes(k));

if (missing_en.length === 0 && missing_ko.length === 0) {
  console.log('PASS: NCGuidanceKey i18n 키 완전 동기화 (' + enKeys.length + '개)');
} else {
  if (missing_en.length) console.log('FAIL: en/non-conformances.json 누락 키: ' + missing_en.join(', '));
  if (missing_ko.length) console.log('FAIL: ko/non-conformances.json 누락 키: ' + missing_ko.join(', '));
}

// ctaHint는 ctaKind !== 'none' 인 키에만 존재해야 함 — 불필요한 ctaHint 잔재 탐지
const ctaKindNoneKeys = ['open_manager', 'openRejected_manager', 'openBlockedRepair_manager', 'openBlockedRecalibration_manager', 'corrected_operator', 'closed_all'];
ctaKindNoneKeys.forEach(k => {
  if (en.detail?.guidance?.[k]?.ctaHint) console.log('WARN: en.' + k + '.ctaHint 불필요 (ctaKind=none)');
  if (ko.detail?.guidance?.[k]?.ctaHint) console.log('WARN: ko.' + k + '.ctaHint 불필요 (ctaKind=none)');
});
" 2>/dev/null
```

**PASS:** en/ko 가이던스 키 완전 동기화, ctaHint 잔재 0건.
**FAIL:** 한쪽에만 guidance 키 존재 → 누락된 언어에 추가. `'link'` ctaKind를 사용했던 구 버전 구조 잔재 탐지.

> **연동 검증:** `deriveGuidance()` (`lib/non-conformances/guidance.ts`)가 반환하는 `NCGuidanceKey`가
> `NC_WORKFLOW_GUIDANCE_TOKENS` 에 있고 → i18n에도 존재해야 런타임 에러 없음.
> 3곳 (토큰 정의 / i18n / `resolveNCGuidanceKey` 반환값)이 항상 동기화되어야 함.

### Step 13: checkouts v2 네임스페이스 103개 필수 키 존재 확인

**배경**: `check-i18n-keys.mjs`는 FSM 38개 + v2 65개 = 103개 필수 키를 게이트로 검증.
v2 네임스페이스: `guidance.*`, `list.subtab.*`, `list.count.*`, `timeline.*`,
`emptyState.*`, `yourTurn.*`, `toast.transition.*`, `help.status.*`

```bash
node scripts/check-i18n-keys.mjs --all
```

**PASS**: `ko/en checkouts.json — fsm 38개 + v2 65개 = 103개 키 모두 존재`
**FAIL**: stderr에 누락 키 경로 출력 → JSON 파일 해당 경로에 값 추가

**소유권 규칙**:
- `guidance.*` → 신규 GuidanceCallout / NextStepPanel v2 전용
- `fsm.*` → 기존 NextStepPanel / FSMStepDisplay 전용 (레거시)
- 두 네임스페이스를 동시에 사용하는 컴포넌트 금지

**pre-commit 연동**: `.husky/pre-commit`에서 `check-i18n-keys.mjs --changed` 실행
staged에 checkouts.json 없어도 LOCALES 전체 폴백 검사 (false negative 방지)

### Step 14: checkouts.emptyState.*.description 마침표 없음 규칙 (2026-04-26 추가)

**배경**: `checkouts.json`의 `emptyState` 하위 description 값은 마침표 없이 끝나는 것이 프로젝트 컨벤션.
Sprint 2.3에서 `overdueClear.description`에 마침표가 추가되어 일관성이 깨졌다가 post-verify에서 발견됨.

```bash
node -e "
const ko = require('./apps/frontend/messages/ko/checkouts.json');
const en = require('./apps/frontend/messages/en/checkouts.json');
const emptyStateKo = ko.emptyState || {};
const emptyStateEn = en.emptyState || {};
const badKo = Object.keys(emptyStateKo).filter(k => emptyStateKo[k].description?.endsWith('.'));
const badEn = Object.keys(emptyStateEn).filter(k => emptyStateEn[k].description?.endsWith('.'));
if (badKo.length === 0 && badEn.length === 0) {
  console.log('PASS: emptyState.*.description 마침표 없음 (' + Object.keys(emptyStateKo).length + '개 키 검사)');
} else {
  if (badKo.length) console.log('FAIL ko: ' + badKo.join(', '));
  if (badEn.length) console.log('FAIL en: ' + badEn.join(', '));
}
" 2>/dev/null
```

**PASS**: `emptyState.*.description` 마침표 없음 (ko/en 모두).
**FAIL**: `overdueClear`, `filtered` 등 특정 키의 description이 `.`으로 끝남 → 마침표 제거.

> **범위**: `checkouts.emptyState.*`에만 적용. `onboarding.description` 등 상위 레벨 description은 별도 컨벤션.

### Step 15: TAB_META commentRequired=true ↔ commentDialogTitleKey/commentPlaceholderKey i18n 존재 (2026-04-27 추가)

**배경**: `approvals-api.ts` TAB_META에 `commentRequired: true`인 카테고리는 `commentDialogTitleKey`와 `commentPlaceholderKey`가 정의되어 있고, 이 키 값이 ko/en approvals.json에 **실제 존재해야** 런타임 번역 누락이 없다.
반대로 `commentRequired: false` 카테고리의 `commentDialogTitleKey` 키는 사전 정의(pre-defined)만 되고 런타임 미사용 — 이는 허용된 패턴 (AR-14 롤백으로 확립).

```bash
# commentRequired: true 카테고리의 commentDialogTitleKey 값 추출
node -e "
const fs = require('fs');
const content = fs.readFileSync('apps/frontend/lib/api/approvals-api.ts', 'utf8');

// commentRequired: true 블록에서 commentDialogTitleKey 값 파싱
const blocks = content.match(/commentRequired:\s*true[\s\S]*?(?=\n  [a-z_]+:|$)/g) || [];
const keys = [];
blocks.forEach(b => {
  const m = b.match(/commentDialogTitleKey:\s*'([^']+)'/);
  if (m) keys.push(m[1]);
  const p = b.match(/commentPlaceholderKey:\s*'([^']+)'/);
  if (p) keys.push(p[1]);
});

const ko = JSON.parse(fs.readFileSync('apps/frontend/messages/ko/approvals.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('apps/frontend/messages/en/approvals.json', 'utf8'));

function getNestedKey(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

let allPass = true;
keys.forEach(k => {
  // TAB_META key format: 'tabMeta.software_validation.commentDialogTitle'
  // JSON 구조: ko.tabMeta.software_validation.commentDialogTitle → getNestedKey(ko, k) 전체 경로 사용
  const koVal = getNestedKey(ko, k);
  const enVal = getNestedKey(en, k);
  if (!koVal) { console.log('FAIL: ko/approvals.json 누락 키:', k); allPass = false; }
  if (!enVal) { console.log('FAIL: en/approvals.json 누락 키:', k); allPass = false; }
});
if (allPass) console.log('PASS: commentRequired=true 카테고리 i18n 키 모두 존재 (' + keys.length + '개 확인)');
" 2>/dev/null
```

**PASS:** `commentRequired: true` 카테고리의 모든 i18n 키가 ko/en approvals.json에 존재.
**FAIL:** 누락 키 → ko/en approvals.json에 해당 번역값 추가. (반대로 `commentRequired: false` 카테고리의 키가 pre-defined된 것은 허용 — 단순 미사용 키, 런타임 에러 없음)

**관련 파일:**
- `apps/frontend/lib/api/approvals-api.ts` — TAB_META commentRequired + commentDialogTitleKey SSOT
- `apps/frontend/messages/ko/approvals.json` — tabMeta 섹션 번역
- `apps/frontend/messages/en/approvals.json` — tabMeta 섹션 번역

### Step 16: 호출지 ↔ messages JSON parity 정적 검증 (2026-04-28 추가)

**왜:** Step 1~3은 messages 파일 간(en↔ko) 정합을 검증하지만, "호출지에서 사용한 키가 messages에 존재하는가"는 검증하지 않는다. 2026-04-21 회귀(`management.*` 70+ 키가 "레거시"로 오판되어 삭제, 활성 라우트 38건 폭주)는 이 비대칭이 원인이다. Step 16은 호출지 → messages 방향으로 unidirectional 검증을 추가한다.

**스크립트 실행:**

```bash
node scripts/check-i18n-call-sites.mjs --all
```

**스크립트가 검증하는 것 (이중 검증):**

**(1) 호출지 ↔ messages JSON parity:**
- `useTranslations('<ns>')` / `getTranslations('<ns>')` 바인딩 추출
- 같은 함수 스코프 내 `<binding>('<key>')` 호출 추출
- 각 호출에 대해 `messages/{ko,en}/<topNs>.json`에서 키 존재 여부 확인
- 누락 시 파일/라인/ns/key + locales 출력

**(2) common.json 구조 검증 (atom 회귀 메커니즘 차단):**
- `messages/{ko,en}/common.json`의 root level은 sub-namespace(object) 만 허용
- flat string/array가 root level에 추가되면 exit 1
- 정책 근거 (`docs/references/frontend-patterns.md` "Atom-level i18n 금지"):
  atom의 cross-cutting flat top-level key 의존이 회귀 메커니즘 → 키 자체가 생성될 수 없도록 *구조적*으로 차단
- 정밀 분석: 9건의 기존 atom-owned sub-namespace 사용(예: `common.fileUpload.*`)은 안전한 캡슐화로 허용
- positive control: flat key 인공 삽입 시 빌드 실패 검증 완료

**SKIP 대상 (검증 한계 — 의도적):**

- shadowed binding (같은 함수에 `const t = useTranslations(...)` 다중 선언, 다른 ns) — WARN 출력 + 검증 스킵
- 동적 키 (template literal interpolation, `t(\`${prefix}.${var}\`)`) — Step 7(enum 기반 동적 키 커버리지)이 보완
- 주석/문자열 리터럴 안 t-호출 — 스크립트가 자동 인식
- `common.json` 외 다른 cross-cutting ns(`navigation`, `notifications`, `errors`, `auth`)의 root level structural — 현재 정책 미정의 (tech-debt: `cross-cutting-ns-structural-check`)

**PASS:** stdout `✅ i18n call-sites: ... 누락 0건`, exit 0
**FAIL:** stderr — 다음 두 형태 중 하나
- `❌ i18n call-sites: 누락 키 N건` + 파일/라인/키 목록
- `❌ common.json 구조 위반 N건 (atom 회귀 차단 정책)` + locale/key/valueType

**Pre-push 게이트:** `.husky/pre-push`에서 자동 실행. push 직전에 회귀 차단.
**Pre-commit 게이트:** `.husky/pre-commit`에서 staged 변경분만 빠르게 검증.

**관련 파일:**

- `scripts/check-i18n-call-sites.mjs` — 정적 검증 스크립트 (scope-aware regex, 0.2~0.5s 실행)
- `.husky/pre-push` — 전체 검사 (`--all --quiet`)
- `.husky/pre-commit` — staged 검사 (`--changed --quiet`)
- `docs/references/frontend-patterns.md` — Atom-level i18n 금지 원칙 / namespace SSOT 원칙

### Step 17: `check-i18n-call-sites.mjs` 구조 검증 — `CROSS_CUTTING_NAMESPACES` + `checkStructuralNamespaces` 존재 확인 (2026-04-30 추가, tech-debt-batch-0430 Phase B)

**배경**: `check-i18n-call-sites.mjs`는 (1) 호출지↔JSON parity와 (2) `common.json` 구조 검증 두 기능을 담당한다. Phase B에서 `CROSS_CUTTING_NAMESPACES = ['common', 'errors']` 상수와 `checkStructuralNamespaces()` 함수가 추가되어 `navigation`, `auth`, `notifications`, `errors`를 flat-by-design 네임스페이스로 명시적 구분하고, `common`/`errors`만 구조 검증 대상으로 분리했다.

**규칙**:
- `CROSS_CUTTING_NAMESPACES` 배열에 `common`과 `errors`가 포함되어야 한다.
- `checkStructuralNamespaces()` 함수가 스크립트 내에 존재하여 cross-cutting ns의 root level 구조를 검증해야 한다.
- `navigation`, `auth`, `notifications`는 flat-by-design으로 구조 검증 제외가 의도적이어야 한다.

**왜 이 검증이 필요한가**:
- `CROSS_CUTTING_NAMESPACES` 상수가 없으면 어떤 ns가 구조 검증 대상인지 코드에서 명확히 드러나지 않아, 미래 네임스페이스 추가 시 구조 정책 누락 가능.
- `checkStructuralNamespaces()` 함수가 없으면 `common.json` 구조 위반(flat root-level key)을 스크립트가 탐지하지 못해 atom 회귀 메커니즘 차단이 무효화됨.

**검증 명령**:
```bash
# 1) CROSS_CUTTING_NAMESPACES 상수 존재 + common/errors 포함 확인
grep -n "CROSS_CUTTING_NAMESPACES" scripts/check-i18n-call-sites.mjs
# 기대: const CROSS_CUTTING_NAMESPACES = ['common', 'errors'] 정의 1건 이상

# 2) checkStructuralNamespaces 함수 존재 확인
grep -n "function checkStructuralNamespaces\|checkStructuralNamespaces()" \
  scripts/check-i18n-call-sites.mjs
# 기대: 함수 정의 1건 + 호출 1건 이상

# 3) CROSS_CUTTING_NAMESPACES에 common/errors 실제 포함 확인
node -e "
const fs = require('fs');
const src = fs.readFileSync('scripts/check-i18n-call-sites.mjs', 'utf8');
const m = src.match(/CROSS_CUTTING_NAMESPACES\s*=\s*\[([^\]]+)\]/);
if (!m) { console.log('FAIL: CROSS_CUTTING_NAMESPACES 상수 없음'); process.exit(1); }
const values = m[1].replace(/['\"\s]/g, '').split(',');
const required = ['common', 'errors'];
const missing = required.filter(r => !values.includes(r));
if (missing.length) { console.log('FAIL: CROSS_CUTTING_NAMESPACES에서 누락:', missing.join(', ')); process.exit(1); }
console.log('PASS: CROSS_CUTTING_NAMESPACES =', values.join(', '));
" 2>/dev/null

# 4) flat-by-design 네임스페이스 주석 또는 문서 존재 확인 (navigation/auth/notifications)
grep -n "flat-by-design\|navigation.*flat\|auth.*flat" \
  scripts/check-i18n-call-sites.mjs docs/references/frontend-patterns.md 2>/dev/null
# 기대: 1건 이상 (flat-by-design 의도가 코드 또는 문서에 명시)
```

**PASS**:
- `CROSS_CUTTING_NAMESPACES` 상수가 스크립트에 존재하며 `common`과 `errors`를 포함
- `checkStructuralNamespaces()` 함수 정의 + 호출 양쪽 존재
- `navigation`, `auth`, `notifications`는 구조 검증에서 의도적으로 제외 (flat-by-design)

**FAIL**:
- `CROSS_CUTTING_NAMESPACES` 상수 없음 → 어떤 ns가 구조 검증 대상인지 불명확
- `checkStructuralNamespaces()` 함수 없음 → common.json flat key 회귀 탐지 불가
- `common` 또는 `errors`가 배열에서 누락 → 구조 정책 미적용

**예외**:
- `check-i18n-call-sites.mjs` 자체 수정 시 이 Step을 먼저 실행하여 기존 구조 검증이 유지되는지 확인할 것

**관련 파일**:
- `scripts/check-i18n-call-sites.mjs` — `CROSS_CUTTING_NAMESPACES` 상수 + `checkStructuralNamespaces()` 함수 정의 위치 (2026-04-30)
- `docs/references/frontend-patterns.md` — Atom-level i18n 금지 원칙 / namespace SSOT 원칙 (flat-by-design 기술)

**발생 이력 (2026-04-30 신설)**: tech-debt-batch-0430 Phase B — `check-i18n-call-sites.mjs`에 `CROSS_CUTTING_NAMESPACES = ['common', 'errors']` 상수와 `checkStructuralNamespaces()` 함수가 추가됨. `navigation`/`auth`/`notifications`는 flat-by-design으로 명시적 구분. 이전에는 common.json 구조 검증 로직이 스크립트 내 산재하여 어떤 ns가 구조 검증 대상인지 추적하기 어려웠음.

### Step 18: `components/shared/` 도메인 namespace 결합 차단 — `SHARED_COMPONENT_DOMAIN_NS_RULE` ESLint 게이트 존재 확인 (2026-04-30 추가, tech-debt-batch-0430 Phase C)

**배경**: `apps/frontend/eslint.config.mjs`에 `SHARED_COMPONENT_DOMAIN_NS_RULE`이 추가되었다. `components/shared/**` 파일에서 `useTranslations(ns)` 호출 시 `ns`가 cross-cutting namespace (`common`, `navigation`, `notifications`, `errors`, `auth`)가 아닌 도메인 namespace(`checkouts.*`, `equipment.*` 등)이면 ESLint 오류를 발생시킨다. 이 규칙이 `eslint.config.mjs`에서 제거되거나 selector가 변경되면 shared/ 컴포넌트가 특정 도메인에 결합되어도 정적 탐지가 불가해진다.

**규칙**:
- `SHARED_COMPONENT_DOMAIN_NS_RULE` 상수가 `eslint.config.mjs`에 정의되어야 한다.
- selector에 negative lookahead regex `^(?!(common|navigation|notifications|errors|auth)(\.|$))` 패턴이 포함되어야 한다.
- `components/shared/**` glob에 대한 ESLint 설정에 `SHARED_COMPONENT_DOMAIN_NS_RULE`이 실제 적용되어야 한다.
- `**/*.stories.{ts,tsx}` global ignore가 존재해야 한다 (Storybook 파일은 검사 대상 제외).

**왜 이 검증이 필요한가**:
- `SHARED_COMPONENT_DOMAIN_NS_RULE`이 제거되면 `components/shared/` 파일이 `useTranslations('checkouts.fsm')` 같은 도메인 호출을 해도 빌드/lint 단계에서 탐지되지 않는다.
- selector의 negative lookahead 패턴이 바뀌면 허용/금지 namespace 목록이 조용히 변경되어 실제 도메인 결합을 통과시킬 수 있다.
- `components/shared/`는 여러 도메인에서 재사용되는 컴포넌트가 위치하므로 도메인 namespace 결합 시 재사용성이 깨진다.

**검증 명령**:
```bash
# 1) SHARED_COMPONENT_DOMAIN_NS_RULE 상수 존재 확인
grep -n "SHARED_COMPONENT_DOMAIN_NS_RULE" apps/frontend/eslint.config.mjs
# 기대: const 정의 1건 + 설정 적용 1건 이상 (총 2건 이상)

# 2) negative lookahead regex 패턴 확인 (cross-cutting namespace 목록)
grep -n "common|navigation|notifications|errors|auth" apps/frontend/eslint.config.mjs \
  | grep -i "lookahead\|\\?!\|negative" 2>/dev/null || \
  grep -n "(?!" apps/frontend/eslint.config.mjs | head -5
# 기대: common/navigation/notifications/errors/auth 5개 namespace가 패턴에 포함

# 3) components/shared/** glob에 SHARED_COMPONENT_DOMAIN_NS_RULE 적용 확인
node -e "
const fs = require('fs');
const src = fs.readFileSync('apps/frontend/eslint.config.mjs', 'utf8');
const hasRule = src.includes('SHARED_COMPONENT_DOMAIN_NS_RULE');
const hasSharedGlob = /components.*shared.*\*\*/.test(src);
const hasNegLookahead = src.includes('(?!');
if (!hasRule) { console.log('FAIL: SHARED_COMPONENT_DOMAIN_NS_RULE 상수 없음'); process.exit(1); }
if (!hasSharedGlob) { console.log('FAIL: components/shared/** glob 설정 없음'); process.exit(1); }
if (!hasNegLookahead) { console.log('FAIL: negative lookahead regex 없음'); process.exit(1); }
console.log('PASS: SHARED_COMPONENT_DOMAIN_NS_RULE + shared glob + negative lookahead 모두 존재');
" 2>/dev/null

# 4) *.stories.{ts,tsx} global ignore 존재 확인
grep -n "stories" apps/frontend/eslint.config.mjs
# 기대: **/*.stories.{ts,tsx} ignores 항목 1건 이상
```

**PASS**:
- `SHARED_COMPONENT_DOMAIN_NS_RULE` 상수 정의 + `components/shared/**` 설정에 적용
- selector에 `(?!(common|navigation|notifications|errors|auth)` negative lookahead 포함
- `**/*.stories.{ts,tsx}` global ignore 존재

**FAIL**:
- `SHARED_COMPONENT_DOMAIN_NS_RULE` 상수 없음 → `eslint.config.mjs`에 도메인 namespace 차단 게이트 부재
- `components/shared/**` glob 설정에서 규칙이 제거됨 → shared/ 컴포넌트 도메인 결합 탐지 불가
- negative lookahead regex가 cross-cutting namespace 5개(`common`, `navigation`, `notifications`, `errors`, `auth`)를 누락 → 허용 범위 축소 또는 확대

**예외**:
- `*.stories.{ts,tsx}` 파일은 Storybook 전용이므로 도메인 namespace 사용 허용 (global ignore 적용)
- `eslint-disable-next-line no-restricted-syntax -- <사유>` 주석이 있는 경우 팀 리뷰 후 예외 허용

**관련 파일**:
- `apps/frontend/eslint.config.mjs` — `SHARED_COMPONENT_DOMAIN_NS_RULE` 상수 정의 + `components/shared/**` 설정 적용 위치 (2026-04-30)
- `docs/references/frontend-patterns.md` — shared/ namespace coupling 정책 (props 주입 패턴)

**발생 이력 (2026-04-30 신설)**: tech-debt-batch-0430 Phase C — `NextStepPanel.tsx`가 `components/shared/`에서 `components/checkouts/`로 이동하면서 shared/ 디렉터리의 namespace coupling 정책을 정적으로 강제하기 위해 `SHARED_COMPONENT_DOMAIN_NS_RULE` ESLint 규칙이 추가됨. 이전에는 shared/ 컴포넌트가 도메인 namespace를 직접 호출해도 빌드 단계에서 탐지되지 않았음.

### Step 19: ESLint typed linting 블록 inner ignores — `**/*.stories.{ts,tsx}` 포함 확인 (2026-04-30 추가)

**배경**: ESLint flat config에서 `project: true`를 사용하는 typed linting 블록은 global ignores와 독립 동작한다. Storybook stories 파일(`*.stories.{ts,tsx}`)이 tsconfig의 exclude에 있으면 typed linting 블록이 `parserOptions.project has been provided but file not found` 파싱 오류를 일으킨다. 최상위 `ignores` 배열에 stories 패턴이 있어도 typed linting 블록의 inner `ignores`에 별도로 명시하지 않으면 파싱 오류가 발생한다.

**규칙**:
- `eslint.config.mjs`의 typed linting 블록(`project: true` 포함 블록)의 `ignores` 배열에 `**/*.stories.{ts,tsx}` 패턴이 포함되어야 한다.
- Global ignores와 중복이더라도 typed linting 블록 내부에 명시적으로 추가해야 한다 (ESLint flat config 설계 특성).

**검증 명령**:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('apps/frontend/eslint.config.mjs', 'utf8');
const projectTrueIdx = src.indexOf('project: true');
if (projectTrueIdx === -1) { console.log('INFO: typed linting block 없음 (검사 스킵)'); process.exit(0); }
const blockStr = src.slice(projectTrueIdx, projectTrueIdx + 2000);
if (blockStr.includes('stories')) {
  console.log('PASS: typed linting block ignores에 stories 패턴 포함');
} else {
  console.log('FAIL: typed linting block ignores에 stories 패턴 없음 — parserOptions.project 파싱 오류 위험');
  process.exit(1);
}
" 2>/dev/null
```

**PASS**: typed linting block의 `ignores` 배열에 `**/*.stories.{ts,tsx}` 포함.
**FAIL**: stories 패턴 누락 → typed linting block ignores에 `'**/*.stories.{ts,tsx}'` 추가.

**예외**: typed linting block(`project: true`) 자체가 없는 프로젝트는 INFO로 처리(스킵).

**관련 파일**:
- `apps/frontend/eslint.config.mjs` — typed linting 블록 inner ignores (line 291)

**발생 이력 (2026-04-30 신설)**: sv-system-wide-completion harness — `NextStepPanel.stories.tsx`의 `parserOptions.project` 파싱 오류. ESLint flat config에서 inner ignores는 global ignores와 독립 동작함을 확인. Typed linting 블록 ignores에 `'**/*.stories.{ts,tsx}'`를 별도 추가하여 해결.

### Step 20: 도메인 mapper `errors.title/errors.genericError` baseline 키 존재 확인 (2026-05-03 추가)

**배경**: `lib/errors/<domain>-errors.ts` mapper 파일은 fallback 경로에서 `t('errors.title')`과 `t('errors.genericError')`를 호출한다. 이 baseline 키가 해당 namespace i18n 파일에 존재하지 않으면 모든 에러 상황에서 raw key(`errors.title`)가 노출된다. 이번 세션(2026-05-03)에서 `non-conformances.json`과 `software.json`이 이 키를 누락한 채 mapper가 이미 호출하고 있었던 pre-existing gap을 수정하면서 탐지 규칙으로 등록.

**검증 명령**:

```bash
node -e "
const fs = require('fs');
// mapper 파일 → 사용 namespace 매핑 (useTranslations 네임스페이스 기준)
const MAPPER_NS = [
  ['apps/frontend/lib/errors/disposal-errors.ts',                  'disposal'],
  ['apps/frontend/lib/errors/calibration-plan-errors.ts',          'calibration-plans'],
  ['apps/frontend/lib/errors/non-conformance-errors.ts',           'non-conformances'],
  ['apps/frontend/lib/errors/cables-errors.ts',                    'cables'],
  ['apps/frontend/lib/errors/test-software-errors.ts',             'software'],
  ['apps/frontend/lib/errors/software-validation-errors.ts',       'software'],
  ['apps/frontend/lib/errors/self-inspection-errors.ts',           'equipment'],
  ['apps/frontend/lib/errors/intermediate-inspection-errors.ts',   'calibration'],
  ['apps/frontend/lib/errors/checkout-errors.ts',                  'checkouts'],
  ['apps/frontend/lib/errors/notification-errors.ts',              'notifications'],
  ['apps/frontend/lib/errors/team-errors.ts',                      'teams'],
  ['apps/frontend/lib/errors/user-errors.ts',                      'users'],
];
const BASELINE_KEYS = ['errors.title', 'errors.genericError'];
const locales = ['ko', 'en'];

function getNestedValue(obj, dotPath) {
  return dotPath.split('.').reduce((o, k) => o?.[k], obj);
}

let allPass = true;
for (const [mapperFile, ns] of MAPPER_NS) {
  if (!fs.existsSync(mapperFile)) continue;
  const mapperSrc = fs.readFileSync(mapperFile, 'utf8');
  const callsErrorsTitle = mapperSrc.includes(\"t('errors.title')\");
  if (!callsErrorsTitle) continue; // mapper가 errors.title을 호출하지 않으면 스킵
  for (const locale of locales) {
    const jsonFile = \`apps/frontend/messages/\${locale}/\${ns}.json\`;
    if (!fs.existsSync(jsonFile)) { console.log('WARN: ' + jsonFile + ' 없음 (namespace 미확정)'); continue; }
    const json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    for (const key of BASELINE_KEYS) {
      if (!getNestedValue(json, key)) {
        console.log('FAIL: ' + locale + '/' + ns + '.json 에 ' + key + ' 누락 — mapper: ' + mapperFile);
        allPass = false;
      }
    }
  }
}
if (allPass) console.log('PASS: 모든 active mapper namespace에 errors.title/errors.genericError 존재');
" 2>/dev/null
```

**PASS**: 모든 active mapper 파일이 참조하는 namespace i18n 파일에 `errors.title`과 `errors.genericError` 키 존재.
**FAIL**: 누락 locale/namespace/key → 해당 JSON 파일에 `errors.title` + `errors.genericError` 추가.

**MAPPER_NS 업데이트 규칙**:
- 새 domain mapper 파일(`lib/errors/<domain>-errors.ts`)이 생성될 때 MAPPER_NS 배열에 추가.
- mapper의 `useTranslations` 호출 namespace를 컴포넌트 호출처 grep으로 확인 후 등재.

**예외**:
- mapper 파일이 `t('errors.title')` 대신 fallback을 `error.message`로만 처리하면 baseline 키 불필요 — 스킵.
- `checkout-errors.ts`, `team-errors.ts`, `user-errors.ts`, `notification-errors.ts`는 tech-debt 파일로 파일 미존재 시 자동 스킵.

**발생 이력 (2026-05-03 신설)**: `notfound-direct-throw-closure` Phase C — `non-conformances.json`과 `software.json`에서 mapper가 이미 `t('errors.title')` + `t('errors.genericError')`를 호출하고 있었으나 키 미존재 상태였던 pre-existing gap 발견. 해당 세션에서 수정하면서 이 검증 step 등록.

## Output Format

```markdown
| #   | 검사                            | 상태      | 상세                     |
| --- | ------------------------------- | --------- | ------------------------ |
| 1   | en/ko 파일 쌍 존재              | PASS/FAIL | 누락 파일 목록           |
| 2   | 도메인별 키 쌍 일치             | PASS/FAIL | 불일치 도메인 + 키 목록  |
| 3   | 빈 번역 값                      | PASS/FAIL | 빈 값 위치 목록          |
| 4   | 네임스페이스 참조 일관성        | PASS/INFO | 미존재 네임스페이스 목록 |
| 5   | ICU 변수 쌍 일치                | PASS/INFO | 변수 불일치 도메인 목록  |
| 6   | Zod 스키마 하드코딩 메시지      | PASS/FAIL | 하드코딩 파일:라인 목록  |
| 7   | 동적 i18n 키 커버리지           | PASS/FAIL | 누락된 동적 키 목록      |
| 8   | routeMap↔navigation.json 동기화 | PASS/FAIL | 누락 키/미등록 라우트    |
| 9   | fieldLabels cross-namespace 중복 | PASS/FAIL | 중복 정의 파일 목록      |
| 10  | audit SSOT enum ↔ i18n 동기화   | PASS/FAIL | 누락 entityType/action 목록 |
| 11  | getSamplerPresetOrder ↔ qr.json | PASS/FAIL | sampler.header/size 누락·초과 preset 목록 |
| 12  | NCGuidanceKey ↔ non-conformances.json 동기화 | PASS/FAIL | en/ko 누락 guidance 키, ctaHint 잔재 목록 |
| 13  | checkouts v2 네임스페이스 103개 필수 키 존재 | PASS/FAIL | 누락 키 경로 목록 |
| 14  | checkouts.emptyState.*.description 마침표 없음 | PASS/FAIL | 마침표 잔존 키 목록 |
| 15  | commentRequired=true ↔ commentDialogTitleKey/commentPlaceholderKey i18n 존재 | PASS/FAIL | ko/en approvals.json 누락 키 목록 |
| 16  | 호출지 ↔ messages JSON parity + common.json 구조 (정적 + 회귀 차단) | PASS/FAIL | 누락 키 file:line + ns + locales 목록, 또는 common.json flat root key 위반 |
| 17  | check-i18n-call-sites.mjs 구조 — CROSS_CUTTING_NAMESPACES + checkStructuralNamespaces | PASS/FAIL | 상수 누락, common/errors 미포함, 함수 정의 부재 위치 |
| 18  | components/shared/ 도메인 namespace 결합 차단 — SHARED_COMPONENT_DOMAIN_NS_RULE ESLint 게이트 | PASS/FAIL | 상수 없음, shared glob 미적용, negative lookahead 누락 namespace 목록 |
| 19  | ESLint typed linting 블록 inner ignores — `**/*.stories.{ts,tsx}` 포함 확인 | PASS/FAIL/INFO | stories 패턴 누락 시 파싱 오류 경로, typed linting block 없으면 INFO |
| 20  | 도메인 mapper `errors.title/errors.genericError` baseline 키 존재 확인 | PASS/FAIL/WARN | 누락 locale/namespace/key 목록, mapper 파일 미존재 시 자동 스킵 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **`reservations.json`** — 예약 기능이 미구현이므로 일부 키가 플레이스홀더로 남아있을 수 있음
2. **중첩 네임스페이스 `useTranslations('common.actions')`** — `common.json` 파일이 존재하면 파일 누락이 아님
3. **Step 4의 동적 네임스페이스** — `useTranslations(dynamicNs)` 같은 동적 참조는 탐지 불가, 수동 확인 필요
4. **ICU 복수형(plural) 문법** — 언어마다 다를 수 있으므로 Step 5에서 INFO로 보고
5. **Step 5의 INFO 등급** — ICU 변수 불일치는 자동 수정 불가한 경우가 있으므로 FAIL이 아닌 INFO
6. **Step 16의 shadowed binding 검증 스킵** — 같은 함수에 `const t = useTranslations(...)`가 다른 ns로 다중 선언된 경우 정확 검증 불가, WARN으로 가시화 후 tech-debt 등록
