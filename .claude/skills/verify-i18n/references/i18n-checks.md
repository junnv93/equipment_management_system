# i18n 검증 상세 체크리스트

## Step 1: en/ko 파일 쌍 존재 확인

두 언어 디렉토리에 동일한 파일이 모두 존재하는지 확인합니다.

```bash
# en에 있지만 ko에 없는 파일
comm -23 <(ls apps/frontend/messages/en/ | sort) <(ls apps/frontend/messages/ko/ | sort)
```

```bash
# ko에 있지만 en에 없는 파일
comm -13 <(ls apps/frontend/messages/en/ | sort) <(ls apps/frontend/messages/ko/ | sort)
```

**PASS 기준:** 두 명령어 모두 출력이 없어야 함 (en/ko 파일 목록 완전 일치).

**FAIL 기준:** 어느 한쪽에만 파일이 있으면 누락된 쪽에 파일 추가 필요.

## Step 2: 도메인별 en/ko 키 쌍 일치 확인

각 도메인 파일의 JSON 키 구조가 en/ko 간에 완전히 일치하는지 확인합니다.

```bash
# 모든 도메인 파일의 en/ko 키 불일치 탐지 (Node.js 사용 — jq 미설치 환경 호환)
node -e "
const fs = require('fs');
const path = require('path');
function getKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? prefix + '.' + k : k;
    keys.push(full);
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys = keys.concat(getKeys(v, full));
    }
  }
  return keys.sort();
}
const enDir = 'apps/frontend/messages/en';
const koDir = 'apps/frontend/messages/ko';
const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));
let allPass = true;
for (const f of files) {
  const en = JSON.parse(fs.readFileSync(path.join(enDir, f), 'utf8'));
  const ko = JSON.parse(fs.readFileSync(path.join(koDir, f), 'utf8'));
  const enKeys = getKeys(en);
  const koKeys = getKeys(ko);
  const enOnly = enKeys.filter(k => !koKeys.includes(k));
  const koOnly = koKeys.filter(k => !enKeys.includes(k));
  if (enOnly.length || koOnly.length) {
    allPass = false;
    console.log('MISMATCH: ' + f);
    enOnly.forEach(k => console.log('  en only: ' + k));
    koOnly.forEach(k => console.log('  ko only: ' + k));
  }
}
if (allPass) console.log('모든 도메인 키 일치 — PASS');
"
```

**PASS 기준:** 모든 도메인에서 "MISMATCH" 출력 없음.

**FAIL 기준:** 특정 도메인에서 키 불일치가 발견되면:

- `< key` (en에만 있음) -> ko 파일에도 해당 키 추가 필요
- `> key` (ko에만 있음) -> en 파일에도 해당 키 추가 필요

**권장 패턴:**

```json
// en/equipment.json
{ "title": "Equipment", "list": { "createButton": "Add Equipment" } }
// ko/equipment.json
{ "title": "장비", "list": { "createButton": "장비 추가" } }

// ❌ 구조 불일치
// en/equipment.json
{ "title": "Equipment", "list": { "createButton": "Add Equipment", "createSharedButton": "Add Shared" } }
// ko/equipment.json — createSharedButton 누락
{ "title": "장비", "list": { "createButton": "장비 추가" } }
```

## Step 3: 빈 번역 값 탐지

비어 있는 번역 문자열("")을 탐지합니다.

```bash
# 빈 번역 값 탐지 (en)
grep -rn '": ""' apps/frontend/messages/en/ | grep -v "node_modules\|// " | head -20
```

```bash
# 빈 번역 값 탐지 (ko)
grep -rn '": ""' apps/frontend/messages/ko/ | grep -v "node_modules\|// " | head -20
```

**PASS 기준:** 0개 결과 (빈 번역 없음).

**FAIL 기준:** 빈 문자열 발견 시 실제 번역 추가 필요.

**참고:** `{count}`, `{name}` 같은 ICU 메시지 변수가 포함된 값은 허용:

```json
{ "totalItems": "총 {count}개" }  // ✅ 변수 포함 — 허용
{ "title": "" }                    // ❌ 빈 문자열 — 위반
```

## Step 4: useTranslations 네임스페이스 참조 확인

컴포넌트에서 사용하는 번역 네임스페이스가 실제 메시지 파일과 일치하는지 확인합니다.

```bash
# 컴포넌트에서 사용 중인 네임스페이스 목록 (최상위 네임스페이스만)
grep -rn "useTranslations\|getTranslations" apps/frontend --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|// " \
  | grep -oP "(?<=useTranslations\(')[^'\.]+|(?<=getTranslations\(')[^'\.]+" \
  | sort | uniq
```

```bash
# 실제 메시지 파일 도메인 목록
ls apps/frontend/messages/en/*.json | xargs -I{} basename {} .json | sort
```

**PASS 기준:** 컴포넌트에서 참조하는 모든 최상위 네임스페이스가 `messages/en/`에 파일로 존재.

**FAIL 기준:** 존재하지 않는 네임스페이스 참조 시 해당 JSON 파일 생성 필요.

**참고:** `useTranslations('common.actions')`처럼 점(.)으로 구분된 중첩 네임스페이스는 `common.json` 내 `actions` 키를 참조 — 파일 존재 여부가 아닌 키 존재 여부 확인 필요.

## Step 5: ICU 메시지 변수 쌍 일치 확인

en/ko에서 `{variable}` 플레이스홀더가 동일하게 사용되는지 확인합니다.

```bash
# en 파일의 ICU 변수 추출 후 ko와 비교 (Node.js 사용 — jq 미설치 환경 호환)
node -e "
const fs = require('fs');
const path = require('path');
const enDir = 'apps/frontend/messages/en';
const koDir = 'apps/frontend/messages/ko';
function extractVars(obj) {
  const vars = new Set();
  function walk(v) {
    if (typeof v === 'string') {
      const matches = v.match(/\{[^}]+\}/g);
      if (matches) matches.forEach(m => vars.add(m));
    } else if (typeof v === 'object' && v !== null) {
      Object.values(v).forEach(walk);
    }
  }
  walk(obj);
  return [...vars].sort();
}
const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));
for (const f of files) {
  const en = JSON.parse(fs.readFileSync(path.join(enDir, f), 'utf8'));
  const ko = JSON.parse(fs.readFileSync(path.join(koDir, f), 'utf8'));
  const enVars = extractVars(en);
  const koVars = extractVars(ko);
  const match = JSON.stringify(enVars) === JSON.stringify(koVars);
  const domain = f.replace('.json','');
  console.log(domain.padEnd(20) + (match ? 'OK' : 'DIFF'));
}
"
```

**참고:** 이 검사는 전체 파일 수준의 변수 집합을 비교합니다. 개별 키 수준의 변수 불일치는 Step 2 키 구조 검사와 함께 수동 확인 필요. 새로운 ICU 변수 사용 도메인이 추가되면 `for domain in ...` 목록에 포함시켜야 합니다.

**PASS 기준:** 차이 없음 (동일한 ICU 변수 집합).

## Step 6: 프론트엔드 Zod 스키마 하드코딩 한국어 검증 메시지 탐지

컴포넌트 내 Zod 스키마에서 `z.string().min(N, '한국어메시지')` 패턴으로 하드코딩된 검증 메시지를 탐지합니다.

```bash
# Zod 스키마에서 한국어 하드코딩 검증 메시지 탐지
grep -rn "z\.string()\.min([0-9]*, *'" apps/frontend/components --include="*.tsx" --include="*.ts" | head -30
grep -rn "z\.string()\.max([0-9]*, *'" apps/frontend/components --include="*.tsx" --include="*.ts" | head -30
```

**PASS 기준:** 0개 결과 (Zod 검증 메시지가 모두 `t()` 함수를 통해 i18n 처리됨).

**FAIL 기준:** 하드코딩된 한국어/영어 검증 메시지 발견 시, `createSchema(t)` 팩토리 패턴으로 전환 필요.

**권장 패턴 (검증됨):**

```typescript
// ❌ WRONG — 하드코딩 한국어
const schema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
});

// ✅ CORRECT — i18n 팩토리 패턴
function createSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t('validation.nameRequired')),
  });
}
type FormData = z.infer<ReturnType<typeof createSchema>>;

// 컴포넌트 내부에서:
const schema = useMemo(() => createSchema(t), [t]);
```

**참고 구현:** `RepairHistoryClient.tsx:78`, `CheckoutHistoryTab.tsx:63`

**예외:**

- 백엔드 DTO의 Zod 스키마 (`apps/backend/`) — 서버 사이드 검증 메시지는 프론트엔드 i18n 대상 아님
- 로그 전용 메시지 (`console.error`, `console.warn`) — 개발자용이므로 면제

## Step 7: 동적 i18n 키 커버리지 확인

컴포넌트에서 `t('key.${dynamicValue}')` 패턴으로 동적 키를 사용하는 경우, 해당 enum의 모든 값이 i18n JSON에 키로 존재하는지 확인합니다.

**주요 동적 키 패턴:**

| 컴포넌트/파일 | 패턴 | 필요한 JSON 키 |
|---|---|---|
| `EquipmentTable/CardGrid/StickyHeader/StatusLocation` | `t('status.${displayStatus}')` | `equipment.json: status.*` |
| `CheckoutStatusBadge` | `t('status.${status}')` | `checkouts.json: status.*` |
| `CheckoutStatusBadge` | `tEquipment('importStatus.${status}')` | `equipment.json: importStatus.*` |
| `CheckoutGroupCard/Content` | `t('purpose.${purpose}')` | `checkouts.json: purpose.*` |
| `CalibrationResultBadge` | `t('result.${value}')` | `calibration.json: result.*` |
| `CalibrationResultBadge` | `t('status.${value}')` | `calibration.json: status.*` |
| `EquipmentImportDetail` | `t('importSource.${sourceType}')` | `equipment.json: importSource.*` |
| `EquipmentImportDetail` | `t('classification.${classification}')` | `equipment.json: classification.*` |
| `ApprovalRow/DetailModal/DetailPanel` | `t('unifiedStatus.${status}')` | `approvals.json: unifiedStatus.*` |
| `CalibrationPlansContent/VersionHistory` | `t('planStatus.${value}')` | `calibration.json: planStatus.*` |
| `CalibrationContent` | `t('calibrationDueStatusOptions.${status}')` | `calibration.json: content.filters.calibrationDueStatusOptions.*` |
| `DisposalReasonSelector` | `t('reason.${reasonValue}')` | `disposal.json: reason.*` |
| `getLocalizedSummary()` | `t('summaryTemplates.*')` | `approvals.json: summaryTemplates.*` |
| `useSiteLabels()` | `t('siteLabel.${site}')` | `equipment.json: siteLabel.*` |
| `useClassificationLabels()` | `t('classification.${cls}')` | `equipment.json: classification.*` |
| `useCalibrationMethodLabels()` | `t('filters.calibrationMethodLabel.${method}')` | `equipment.json: filters.calibrationMethodLabel.*` |

```bash
# 동적 키 패턴 탐지 — t(`xxx.${...}`) 형태
grep -rn 't(`[a-zA-Z]*\.\${' apps/frontend/components apps/frontend/lib/utils --include="*.tsx" --include="*.ts" | grep -v "node_modules\|// \|test\|spec" | head -30
```

**검사 방법:** 각 동적 키 패턴에서 사용하는 enum 값 배열(SSOT)을 확인하고, 해당 en/ko JSON에 모든 값이 키로 존재하는지 대조합니다.

**PASS 기준:** 모든 동적 키 패턴의 enum 값이 en/ko JSON에 키로 존재.

**FAIL 기준:** enum 값 중 JSON에 누락된 키가 있으면 런타임 시 raw 키 문자열이 표시됨.

```typescript
// ❌ WRONG — purpose enum에 'return_to_vendor'가 있지만 JSON에 없음
// checkouts.json: { "purpose": { "calibration": "교정", "repair": "수리", "rental": "렌탈" } }
// -> t('purpose.return_to_vendor') -> "purpose.return_to_vendor" (raw 키 표시)

// ✅ CORRECT — 모든 enum 값에 대응하는 키 존재
// checkouts.json: { "purpose": { "calibration": "교정", "repair": "수리", "rental": "렌탈", "return_to_vendor": "업체 반환" } }
```

**예외:** 새 enum 값이 추가되었지만 아직 UI에서 사용되지 않는 경우 (코드에 동적 키 패턴이 없으면 누락이 아님)

## Step 8: routeMap labelKey ↔ navigation.json 교차 검증

`route-metadata.ts`의 모든 `labelKey`가 `navigation.json`에 실제로 존재하는지 확인합니다.
또한, `app/(dashboard)/**/page.tsx`에 대응하는 routeMap 항목이 있는지 역방향 검증합니다.

### 8a: labelKey → navigation.json 정방향 검증

```bash
# routeMap의 모든 labelKey 추출 후 navigation.json에 존재하는지 확인
node -e "
const fs = require('fs');
const routeFile = fs.readFileSync('apps/frontend/lib/navigation/route-metadata.ts', 'utf8');
const navEn = JSON.parse(fs.readFileSync('apps/frontend/messages/en/navigation.json', 'utf8'));

// routeMap에서 labelKey 추출 (navigation. 접두어 제거)
const labelKeys = [...routeFile.matchAll(/labelKey:\s*'navigation\.([^']+)'/g)].map(m => m[1]);

// navigation.json의 최상위 키 (중첩 제외)
const flatKeys = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatKeys(v, prefix + k + '.') : [prefix + k]
  );
const navKeys = new Set(flatKeys(navEn));

const missing = labelKeys.filter(k => !navKeys.has(k));
if (missing.length) {
  console.log('FAIL: routeMap labelKey가 navigation.json에 없음:');
  missing.forEach(k => console.log('  - navigation.' + k));
} else {
  console.log('PASS: 모든 routeMap labelKey가 navigation.json에 존재 (' + labelKeys.length + '개)');
}
"
```

**PASS 기준:** 누락된 labelKey 0개.
**FAIL 기준:** routeMap에 등록된 labelKey가 navigation.json에 없으면 브레드크럼이 raw 키로 표시됨.

### 8b: page.tsx → routeMap 역방향 검증

```bash
# 실제 존재하는 페이지와 routeMap 비교
node -e "
const { execSync } = require('child_process');
const fs = require('fs');

// 실제 page.tsx 경로를 라우트 형태로 변환
const pages = execSync('find apps/frontend/app/\\(dashboard\\) -name page.tsx -type f')
  .toString().trim().split('\n')
  .map(p => p
    .replace('apps/frontend/app/(dashboard)', '')
    .replace('/page.tsx', '') || '/')
  .sort();

// routeMap 경로 추출
const routeFile = fs.readFileSync('apps/frontend/lib/navigation/route-metadata.ts', 'utf8');
const routePaths = new Set([...routeFile.matchAll(/'([^']+)':\s*\{/g)].map(m => m[1]));

// redirect-only 페이지 제외 (파일 내용에 redirect만 있는 경우)
const missing = pages.filter(p => {
  // routeMap에 이미 있으면 OK
  if (routePaths.has(p)) return false;
  // [param] 치환하여 동적 라우트 매칭
  const normalized = p.replace(/\/[0-9a-f-]+/g, '/[id]');
  if (routePaths.has(normalized)) return false;

  // redirect-only 페이지인지 확인
  const filePath = 'apps/frontend/app/(dashboard)' + p + '/page.tsx';
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (/^\s*import.*redirect/m.test(content) && /redirect\(/m.test(content)) return false;
  } catch {}
  return true;
});

if (missing.length) {
  console.log('INFO: routeMap에 미등록된 페이지 (' + missing.length + '개):');
  missing.forEach(p => console.log('  - ' + p));
} else {
  console.log('PASS: 모든 비-redirect 페이지가 routeMap에 등록됨 (' + pages.length + '개)');
}
"
```

**PASS 기준:** 미등록 페이지 0개.
**INFO 기준:** redirect-only가 아닌 페이지가 routeMap에 없으면 브레드크럼이 해당 페이지에서 미표시.

### 8c: 하드코딩된 한국어 폴백 탐지

```bash
# 네비게이션/브레드크럼 유틸리티에서 하드코딩된 한국어 문자열 탐지
grep -rn "'[가-힣]" apps/frontend/lib/navigation/ --include="*.ts" --include="*.tsx" | grep -v "node_modules\|// \|test\|spec\|\*.md"
```

**PASS 기준:** 0개 결과 (네비게이션 유틸리티에 하드코딩된 한국어 없음).
**FAIL 기준:** 발견 시 `undefined` 반환으로 대체하여 i18n 시스템에 폴백 위임.
