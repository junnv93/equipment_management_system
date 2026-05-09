# Exec Plan: terror-s1-hook-spec

## 메타
- 생성: 2026-05-09T10:00:00+09:00
- 모드: Mode 2 (Full)
- Slug: terror-s1-hook-spec
- 예상 변경: i18n JSON 8 + 신규 hook spec 1 = 9 파일

## Summary

`tech-debt-tracker.md` 의 두 미해결 항목을 단일 harness 로 closure:

1. **Item 1 (MEDIUM) — `errors.genericError` baseline 누락 8 파일** — `messages/{ko,en}/{disposal,notifications,teams,users}.json` 4 도메인 × 2 locale 에 `errors.genericError` 키 누락. verify-i18n Step 20 FAIL gate 대상. mapper(`disposal-errors.ts`/`notification-errors.ts`/`team-errors.ts`/`user-errors.ts`) 4 종이 모두 `t('errors.title')` 호출 → Step 20 검증 스크립트가 자동 FAIL.
2. **Item 2 (LOW) — `use-equipment-calibrations.test.ts` 미존재** — `apps/frontend/hooks/use-equipment-calibrations.ts` 가 노출하는 두 variant (`useEquipmentCalibrations` / `useEquipmentCalibrationHistory`) export 시그니처와 queryKey SSOT 사용을 회귀 차단할 spec 부재. `apps/frontend/hooks/__tests__/` 디렉토리에 동일 파일 없음 확인 완료.

**핵심 결정**: 두 항목 모두 *추가형* surgical patch — 기존 코드 수정 0건. genericError 값은 도메인별 *기존 errors.title 톤* 에 정렬해 SSOT 인용 (equipment 톤 vs checkouts 톤). spec 은 `use-checkout-card-mutations.test.ts` 패턴 1:1 답습 (renderHook + QueryClientProvider wrapper + jest.mock SSOT).

## 설계 철학

### Item 1 — i18n SSOT *값 인용* (재정의 금지)

`apps/frontend/messages/{ko,en}/equipment.json` 과 `apps/frontend/messages/{ko,en}/checkouts.json` 가 두 톤의 SSOT 후보:

| Tone | ko / en | 사용 도메인 |
|------|---------|--------------|
| equipment 톤 | `처리 중 오류가 발생했습니다. 다시 시도하세요.` / `An error occurred. Please try again.` | equipment / calibration |
| checkouts 톤 | `요청을 처리하는 중 오류가 발생했습니다.` / `An error occurred while processing the request.` | checkouts / cables / software / non-conformances |

본 sprint 4 도메인 모두 `errors.title` 가 *checkouts 톤* 과 일치(`'오류'` / `'Error'` 또는 `'처리 실패'` / `'Action Failed'`):
- `disposal.json` — title `'처리 실패'` / `'Action Failed'` → **equipment 톤** 정렬 (재시도 권장 톤)
- `notifications.json` — title `'오류'` / `'Error'` → **checkouts 톤** 정렬
- `teams.json` — title `'오류'` / `'Error'` → **checkouts 톤** 정렬
- `users.json` — title `'오류'` / `'Error'` → **checkouts 톤** 정렬

이 결정은 자체 문구 신규 생성 0건 — 모두 기존 도메인의 SSOT 값 인용. (메모리 `feedback_no_fabricate_domain_data.md` 정합 — 절차서 데이터 추측 금지 원칙)

### Item 2 — hook 회귀 차단 spec 의 검증 표면

본 hook 의 회귀 위험 표면:

1. **export 시그니처** — `useEquipmentCalibrations(equipmentId)` 와 `useEquipmentCalibrationHistory(equipmentId, options?)` 두 함수가 named export 로 노출.
2. **queryKey SSOT 인용** — 각각 `queryKeys.calibrations.byEquipment(id)` / `queryKeys.calibrations.historyList({...})` 를 사용. SSOT 우회 (인라인 array 정의) 시 cache invalidation 회귀.
3. **queryFn 결빙** — `calibrationApi.getEquipmentCalibrations(id)` / `calibrationApi.getCalibrationHistory(filters)` 호출.
4. **enabled 가드** — `equipmentId` 빈 문자열 시 `enabled: false` (불필요 fetch 차단).
5. **filters memoization** — `useEquipmentCalibrationHistory` 의 `filters` 객체가 useMemo 결과 (queryKey stable reference 보장).

spec 은 위 5 표면을 **모듈 외부에서 관찰 가능한 행동** 으로만 검증:
- export 존재 (named export 두 개)
- `mock api` 호출 args (equipmentId / filters object)
- enabled 가드 (`enabled: false` 시 fetch 미발생)
- queryKey 가 SSOT 함수 호출 결과와 일치 (queryClient.getQueryData(SSOT) 로 데이터 도달 확인)

내부 구현(`useMemo` / `QUERY_CONFIG` spread) 은 의도적으로 검증 스킵 — 구현 detail 변경 시 spec false-FAIL 회피.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| genericError 값 도메인별 정렬 기준 | **errors.title 의 ko/en 페어 톤 매칭** | disposal title `처리 실패` 는 equipment 톤(retry 권장), 나머지 3 도메인 title `오류` 는 checkouts 톤. 이 휴리스틱 단일 기준으로 SSOT 인용 분기 결정 |
| 신규 i18n 문구 작성 vs 기존 인용 | **기존 인용 only (신규 0건)** | feedback_no_fabricate_domain_data 정합 — 도메인 데이터 추측 금지. 도메인별 톤 분기는 errors.title 과 정렬한 결정론적 매핑 |
| spec 위치 | `apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts` | 기존 hook spec 7 개와 동일 디렉토리. 디렉토리 1:1 매칭 (`hooks/<name>.ts` → `hooks/__tests__/<name>.test.ts`) |
| spec 기반 패턴 | **`use-checkout-card-mutations.test.ts` 답습** | renderHook + QueryClientProvider wrapper + jest.mock SSOT. 본 프로젝트 hook spec canonical 패턴 |
| queryKey 검증 방식 | **`queryKeys.calibrations.byEquipment(...)` 결과로 setQueryData → renderHook → cache hit 확인** | SSOT 함수 호출 결과를 spec 에서 그대로 인용. 인라인 array 정의 0건 — SSOT 우회 회귀 시 spec 자동 FAIL |
| `calibrationApi` mock 범위 | **`__esModule: true, default: { ... }`** | hook 이 default import 사용 (`import calibrationApi from '@/lib/api/calibration-api'`) — use-checkout-card-mutations.test.ts 패턴 답습 |
| `enabled: false` 검증 | **빈 문자열 equipmentId 입력 시 mock api 0 호출 확인** | `enabled: !!equipmentId` 가드 회귀 차단. waitFor + expect(mock).not.toHaveBeenCalled() |
| filters memoization 검증 | **out of scope** | useMemo 는 implementation detail. 외부 관찰 가능한 효과(queryKey stable reference)는 React Query 자체 검증 책임 |
| `UseQueryResult` 반환 타입 검증 | **TypeScript level 만 — 런타임 spec 불필요** | tsc --noEmit 으로 시그니처 회귀 차단. 런타임 spec 은 행동 검증에 집중 |

## 구현 Phase

### Phase 1: i18n `errors.genericError` 8 파일 추가 (MEDIUM)

각 파일의 `errors` 블록에 `genericError` 키를 추가. *기존 다른 도메인 SSOT 값 그대로 인용* — 신규 문구 작성 금지.

**값 매핑 SSOT 인용표:**

| 파일 | 인용 출처 | ko 값 | en 값 |
|------|----------|-------|-------|
| `messages/ko/disposal.json`, `messages/en/disposal.json` | `equipment.json` | `처리 중 오류가 발생했습니다. 다시 시도하세요.` | `An error occurred. Please try again.` |
| `messages/ko/notifications.json`, `messages/en/notifications.json` | `checkouts.json` | `요청을 처리하는 중 오류가 발생했습니다.` | `An error occurred while processing the request.` |
| `messages/ko/teams.json`, `messages/en/teams.json` | `checkouts.json` | `요청을 처리하는 중 오류가 발생했습니다.` | `An error occurred while processing the request.` |
| `messages/ko/users.json`, `messages/en/users.json` | `checkouts.json` | `요청을 처리하는 중 오류가 발생했습니다.` | `An error occurred while processing the request.` |

**삽입 위치 규칙** — 각 파일 `errors` 블록에서 `title` 키 *직후* `genericError` 추가. 다른 도메인별 키(`notFound` / `nameAlreadyExists` 등) 는 기존 순서 보존.

**삽입 후 JSON 구조 예시 (notifications.json ko):**
```json
{
  ...
  "errors": {
    "title": "오류",
    "genericError": "요청을 처리하는 중 오류가 발생했습니다.",
    "notFound": "..."
  }
}
```

**완료 기준:**
```bash
node -e "
const files = [
  ['ko','disposal','처리 중 오류가 발생했습니다. 다시 시도하세요.'],
  ['en','disposal','An error occurred. Please try again.'],
  ['ko','notifications','요청을 처리하는 중 오류가 발생했습니다.'],
  ['en','notifications','An error occurred while processing the request.'],
  ['ko','teams','요청을 처리하는 중 오류가 발생했습니다.'],
  ['en','teams','An error occurred while processing the request.'],
  ['ko','users','요청을 처리하는 중 오류가 발생했습니다.'],
  ['en','users','An error occurred while processing the request.'],
];
let pass = true;
for (const [loc, ns, expected] of files) {
  const j = require(\`./apps/frontend/messages/\${loc}/\${ns}.json\`);
  if (j.errors?.genericError !== expected) { console.log('FAIL', loc, ns, JSON.stringify(j.errors?.genericError)); pass = false; }
}
if (pass) console.log('PASS: 8 files genericError SSOT 정렬');
"
```

### Phase 2: `use-equipment-calibrations.test.ts` spec 신설 (LOW)

**파일**: `apps/frontend/hooks/__tests__/use-equipment-calibrations.test.ts` (신규)

**검증 표면 (5개)**:

1. **Export 시그니처 존재**
   - `useEquipmentCalibrations` named export 존재 (function)
   - `useEquipmentCalibrationHistory` named export 존재 (function)

2. **`useEquipmentCalibrations` 행동**
   - equipmentId 인자로 `calibrationApi.getEquipmentCalibrations(equipmentId)` 호출
   - queryKey 가 `queryKeys.calibrations.byEquipment(equipmentId)` 와 일치 (queryClient cache 도달 확인)
   - `equipmentId === ''` 시 `enabled: false` — api 호출 0 회

3. **`useEquipmentCalibrationHistory` 행동**
   - equipmentId 인자로 `calibrationApi.getCalibrationHistory({ equipmentId, pageSize: undefined })` 호출 (옵션 미지정 시)
   - `pageSize` 옵션 전달 시 `calibrationApi.getCalibrationHistory({ equipmentId, pageSize: <num> })` 호출
   - queryKey 가 `queryKeys.calibrations.historyList({ equipmentId, pageSize })` 와 일치
   - `equipmentId === ''` 시 `enabled: false` — api 호출 0 회

**Mock 전략 (`use-checkout-card-mutations.test.ts` 패턴 답습)**:
- `jest.mock('@/lib/api/calibration-api', ...)` — `__esModule: true, default: { getEquipmentCalibrations, getCalibrationHistory }` mock
- `QueryClientProvider` wrapper (mutation retry 0 / queries retry 0)
- `next-intl` mock 불필요 (hook 은 t 함수 미사용)
- `@/components/ui/use-toast` mock 불필요 (hook 은 toast 미사용)

**SSOT 인용**:
- `import { queryKeys } from '@/lib/api/query-config'` — 인라인 queryKey 정의 0건
- spec 안에서 `queryKeys.calibrations.byEquipment('eq-1')` 결과를 직접 호출하여 cache key 일치 검증

**완료 기준**:
```bash
pnpm --filter frontend run test -- "use-equipment-calibrations"
# 기대: PASS, 신규 spec 5+ cases (export 2 + useEquipmentCalibrations 3 + useEquipmentCalibrationHistory 3 = 8 cases)
```

### Phase 3: verify-i18n Step 20 회귀 차단 검증 + tracker 정리

**Step 20 PASS 확인**:
```bash
node -e "
const fs = require('fs');
const MAPPER_NS = [
  ['apps/frontend/lib/errors/disposal-errors.ts', 'disposal'],
  ['apps/frontend/lib/errors/notification-errors.ts', 'notifications'],
  ['apps/frontend/lib/errors/team-errors.ts', 'teams'],
  ['apps/frontend/lib/errors/user-errors.ts', 'users'],
];
const BASELINE_KEYS = ['errors.title', 'errors.genericError'];
function getNestedValue(obj, p){return p.split('.').reduce((o,k)=>o?.[k], obj);}
let pass = true;
for (const [m, ns] of MAPPER_NS) {
  for (const loc of ['ko','en']) {
    const j = JSON.parse(fs.readFileSync(\`apps/frontend/messages/\${loc}/\${ns}.json\`, 'utf8'));
    for (const k of BASELINE_KEYS) {
      if (!getNestedValue(j, k)) { console.log('FAIL', loc, ns, k); pass = false; }
    }
  }
}
if (pass) console.log('PASS: Step 20 baseline keys 모두 존재 (4 도메인 × 2 locale × 2 키 = 16 검증)');
"
```

**tech-debt-tracker.md 정리**:
- Item 1 항목 ([2026-05-09 tErrors S-1] 🟡 MED errors.genericError baseline key 추가) — `[x]` 체크 + 본 sprint slug 인용
- Item 2 항목 ([2026-05-09 phase-c-r2 후속] 🟢 LOW use-equipment-calibrations-hook-spec) — `[x]` 체크 + 본 sprint slug 인용

## 검증 명령

### 정적 검증
- `pnpm tsc --noEmit` — TypeScript 에러 0
- `pnpm --filter frontend run lint` — ESLint exit 0
- 위 Phase 1 / Phase 3 검증 스크립트 PASS

### 런타임 검증
- `pnpm --filter frontend run test -- "use-equipment-calibrations"` — PASS, ≥ 8 cases
- `pnpm --filter frontend run test` — 기존 hook spec 7 개 회귀 0

### Step 20 자동 회귀 차단
- 위 Step 20 검증 스크립트 — PASS

## Out of Scope

- **mapper 구현 변경 0건** — 본 sprint 는 i18n JSON + spec 추가만. mapper 가 fallback 에서 `error.message` 대신 `t('errors.genericError')` 를 *호출* 하도록 변경하는 것은 별도 sprint (런타임 거동 변경 — blast radius 큼).
- **useEquipment hook spec / QUERY_CONFIG 검증 spec** — 본 hook 외 다른 hook 들의 spec 작성. tech-debt-tracker 다른 항목.
- **filters useMemo 검증** — 구현 detail. 외부 관찰 가능한 효과 외 검증 스킵.
- **`UseQueryResult<T>` 타입 런타임 검증** — tsc --noEmit 책임.
- **추가 도메인 (`approvals`, `audit`, `auth`) 의 errors.genericError 도입** — 본 sprint 는 verify-i18n Step 20 FAIL 4 도메인 만. 다른 도메인 mapper 가 fallback 추가 시 별도 sprint.

## 시니어 자기검토 체크리스트 (Phase 진입 전)

- [ ] **i18n SSOT 우회 검증** — 신규 문구 작성 0건, equipment.json / checkouts.json 인용만
- [ ] **JSON 키 순서 보존** — 기존 도메인별 키(`notFound`, `nameAlreadyExists`) 위치 변경 0건
- [ ] **mapper 코드 변경 0건** — 4 mapper 파일 modify 금지
- [ ] **spec mock 범위 정합** — `next-intl` / `useToast` mock 추가 0건 (hook 미사용)
- [ ] **queryKey SSOT 인용** — 인라인 array 정의 0건
- [ ] **enabled 가드 검증** — 빈 문자열 입력 케이스 명시
- [ ] **두 variant 분리 describe 블록** — 시그니처 명시적 가시화
