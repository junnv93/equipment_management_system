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

### Step 13: checkouts v2 네임스페이스 107개 필수 키 존재 확인

**배경**: `check-i18n-keys.mjs`는 FSM 40개 + v2 67개 = 107개 필수 키를 게이트로 검증.
v2 네임스페이스: `guidance.*`, `list.subtab.*`, `list.count.*`, `timeline.*`,
`emptyState.*`, `yourTurn.*`, `toast.transition.*`, `help.status.*`

```bash
node scripts/check-i18n-keys.mjs --all
```

**PASS**: `ko/en checkouts.json — fsm 40개 + v2 67개 = 107개 키 모두 존재`
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
| 13  | checkouts v2 네임스페이스 107개 필수 키 존재 | PASS/FAIL | 누락 키 경로 목록 |
| 14  | checkouts.emptyState.*.description 마침표 없음 | PASS/FAIL | 마침표 잔존 키 목록 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **`reservations.json`** — 예약 기능이 미구현이므로 일부 키가 플레이스홀더로 남아있을 수 있음
2. **중첩 네임스페이스 `useTranslations('common.actions')`** — `common.json` 파일이 존재하면 파일 누락이 아님
3. **Step 4의 동적 네임스페이스** — `useTranslations(dynamicNs)` 같은 동적 참조는 탐지 불가, 수동 확인 필요
4. **ICU 복수형(plural) 문법** — 언어마다 다를 수 있으므로 Step 5에서 INFO로 보고
5. **Step 5의 INFO 등급** — ICU 변수 불일치는 자동 수정 불가한 경우가 있으므로 FAIL이 아닌 INFO
