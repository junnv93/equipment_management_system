# Exec Plan: backend-zod-error-i18n-ssot

## 메타
- 생성: 2026-05-08T09:00:00+09:00
- 모드: Mode 2 (Full)
- Slug: backend-zod-error-i18n-ssot
- 예상 변경: 백엔드 3 + frontend 4 + packages 1 + i18n 2 + ADR 1 + SKILL 1 + spec 4 = 약 16개 (VM 호출자 106 파일은 자동 마이그레이션 — 본 sprint 직접 수정 0건)

## Summary

backend Zod 검증 실패 응답이 한국어 string literal로 frontend에 전달되어, frontend `locale=en` 환경에서도 한국어 메시지가 노출되는 구조적 결함을 5-layer SSOT 정합 수준에서 영구 closure.

**핵심 결정**: 옵션 (b) — Backend는 **machine-readable Zod issues array** 반환 + Frontend가 path/code → i18n key routing. VM SSOT는 **backend log/test fallback 전용**으로 격하 (production 응답 message는 더 이상 VM 본문 의존 안 함).

## 설계 철학

본 sprint는 **5-layer defense-in-depth** + **SSOT 정합** + **단방향 wire** 3-axis closure.

1. **Layer 1 (packages/schemas)**: Zod issue shape SSOT — `BackendValidationIssue` 타입(`path`, `code`, `params`) 신설. ZodIssueCode 16개 union을 그대로 재노출. **Frontend i18n에는 절대 의존 안 함** (단방향 wire — schemas → backend/frontend 둘 다 import 가능, frontend i18n → schemas 금지).
2. **Layer 2 (backend pipe)**: `ZodValidationPipe` fail 시 한국어 `message` 대신 `BackendValidationError` (NestJS HttpException 서브클래스) throw. payload는 `{ code: ErrorCode.ValidationError, issues: [{ path, code, params }] }`.
3. **Layer 3 (backend filter)**: `GlobalExceptionFilter`는 `BackendValidationError` 우선 분기 — `ZodError` 직접 catch 분기 + `handleZodError` 헬퍼는 동일한 issues 추출 정책으로 통일. PII 누설 방지 — `received` 키는 `production` 환경에서 redact, `development` 환경 + non-`invalid_type` 코드는 그대로 노출.
4. **Layer 4 (frontend mapper)**: `lib/errors/zod-issue-mapper.ts` 신설 — `BackendValidationIssue[]` → `{ key, params }[]` 변환. path → field i18n key, code → `errors.validation.<code>` namespace, params → `{ min, max, expected, received }` 추출.
5. **Layer 5 (i18n errors namespace)**: `errors.validation.{zodIssueCode}` 16개 키 + `errors.fields.{fieldName}` 동적 namespace ko/en parity. 미존재 field는 `errors.fields.unknown` fallback.

**VM SSOT 처리**: VM 본문은 **유지** (backend log JSON, test assertion, swagger documentation에서 활용 — 한국어 `message` 필드는 backend log/audit에서 인간 가독성 확보). 단, **production frontend 응답 path는 VM message에 의존 안 함** — `BackendValidationError` payload에 issues array가 별도 캐리. 이로써 frontend는 backend message 텍스트를 *무시*하고 issues로만 i18n 라우팅.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 옵션 비교 (a/b/c) | (b) Error code + FE i18n | 기존 ErrorCode 5-layer 패턴 정합 + FE i18n 캐시 활용 + Accept-Language 헤더 injection 표면 0 + ko/en parity 운영 사실 보존. (a)는 backend 다국어 cascade 안티패턴, (c)는 ko/en parity 운영 사실 무효화. |
| Zod issues 응답 위치 | `BadRequestException` payload `issues: BackendValidationIssue[]` | 기존 `errors: [{ path, message, code }]` 형식과 호환 (확장만) — frontend mapper 1줄 추가로 deploy 가능. backend HTTP 200 success path 영향 0. |
| VM SSOT 운명 | **유지 (격하: log/test/swagger fallback only)** | VM 폐기는 (1) 106 호출 파일 일괄 변경 → blast radius 과대 (2) backend log/audit JSON 한국어 message 유실 → 운영자 가독성 저하 (3) test snapshot 광범위 깨짐. 응답 path만 issues array로 분리하면 VM 호출자 0 변경으로 결합도 최소. |
| Field i18n key 동적 생성 | `errors.fields.<fieldName>` namespace | path 첫 segment를 fieldName으로 사용 — 도메인 무관 SSOT. 미존재 시 `errors.fields.unknown` fallback. JIT-unsafe 보간(`text-brand-${key}`)은 *Tailwind class*에만 위험 — 본 케이스는 next-intl key lookup이라 안전. |
| ZodIssueCode → i18n key 매핑 | 1:1 namespace `errors.validation.<code>` | 16개 ZodIssueCode 모두 ko/en parity 등록. union literal types는 컴파일타임 exhaustive (`Record<ZodIssueCode, string>` 강제). 신규 ZodIssueCode 도입 시 `tsc` FAIL — silent miss 차단. |
| PII 누설 방지 | filter 출력 단계에서 `received` 키 selective redact | `invalid_type` issue의 `received`는 type 이름(`'string'`/`'number'`)이라 PII 아님 — 그대로 노출. `invalid_string` regex pattern fail 등은 입력 텍스트 재현 가능 — production redact. development는 디버깅 위해 노출. |
| 에러 코드 운명 | `ErrorCode.ValidationError = 'VALIDATION_ERROR'` 그대로 사용 | 이미 `errorCodeToStatusCode` 등록됨 (400). frontend `EquipmentErrorCode.VALIDATION_ERROR` 매핑도 `mapBackendErrorCode` 에 등록되어 있음. **신규 ErrorCode 추가 불필요**. |
| Layer 위반 검증 | `packages/schemas` → `apps/frontend/messages/*` import 0건 자동 spec | schemas는 UI i18n 무지 — Zod issue shape (`code`, `path`, `params`)만 노출. routing은 frontend 책임. 단방향 wire 자동 검증. |
| 적용 범위 | **전체 production code** — backend Zod fail handler가 단일 진입점이라 자동 적용. VM 호출자 DTO 수정 0건. | ZodValidationPipe + GlobalExceptionFilter는 모든 controller fail path가 통과하는 funnel. 신규 DTO도 자동 흡수. |

## 구현 Phase

### Phase 1: SSOT 신설 — packages/schemas issue shape 타입 + helpers

**목표:** Backend ↔ Frontend 공유 Zod issue contract를 schemas package에 SSOT로 결빙. ZodIssueCode 16개 enum + serialize helper + frontend i18n 의존 0건.

**변경 파일:**
1. `packages/schemas/src/validation/zod-issue.ts` — 신규
   - `BackendValidationIssue` type 정의: `{ path: (string | number)[]; code: ZodIssueCode; params?: Record<string, unknown>; }`
   - `ZodIssueCode` re-export from `zod` (16개 literal union)
   - `serializeZodIssue(issue: ZodIssue): BackendValidationIssue` 함수
     - `path` 그대로 복사
     - `code` 그대로 복사
     - `params`: code별 분기로 추출
       - `too_small` / `too_big`: `{ minimum, maximum, type, inclusive }`
       - `invalid_type`: `{ expected, received }` — `received`는 type 이름이라 PII 아님 그대로
       - `invalid_string`: `{ validation }`
       - `invalid_enum_value`: `{ options, received }`
       - `invalid_literal`: `{ expected }` (`received` redact in production — 별도 helper)
       - `not_multiple_of`: `{ multipleOf }`
       - `invalid_union` / `invalid_union_discriminator` / `invalid_arguments` / `invalid_return_type` / `invalid_intersection_types`: `params` undefined (subtree errors는 path로 충분)
       - 기타: `params` undefined
   - `redactIssueReceived(issue: BackendValidationIssue, isProduction: boolean): BackendValidationIssue` 함수 — production 환경에서 `params.received` 가 type 이름 외에는 redact

2. `packages/schemas/src/index.ts` — 수정
   - `export type { BackendValidationIssue } from './validation/zod-issue';`
   - `export { ZodIssueCode, serializeZodIssue, redactIssueReceived } from './validation/zod-issue';`

3. `packages/schemas/src/__tests__/zod-issue-serialize.test.ts` — 신규
   - 16개 ZodIssueCode 별 1 case → `serializeZodIssue` shape 정합 검증
   - `redactIssueReceived` production / development 분기 spec
   - `BackendValidationIssue` ↔ `ZodIssueCode` 컴파일타임 exhaustive (`satisfies Record<ZodIssueCode, ...>` 자동)

**완료 기준:**
- `pnpm tsc --noEmit` PASS
- `pnpm --filter @equipment-management/schemas run test` PASS (신규 spec 16+ cases)
- `grep -c "from '@equipment-management/schemas/.*messages\|frontend\|next-intl'" packages/schemas/src/validation/zod-issue.ts` = 0 (단방향 wire)

**검증:** `pnpm --filter @equipment-management/schemas run test && pnpm tsc --noEmit`

---

### Phase 2: Backend — ZodValidationPipe + GlobalExceptionFilter 응답 shape 통일

**목표:** Zod fail path가 *모두* `{ code: 'VALIDATION_ERROR', issues: BackendValidationIssue[] }` 응답을 보장. message는 backend log/swagger용 fallback 텍스트만 유지.

**변경 파일:**
1. `apps/backend/src/common/pipes/zod-validation.pipe.ts` — 수정
   - `BadRequestException` throw payload 변경:
     ```typescript
     throw new BadRequestException({
       code: ErrorCode.ValidationError,
       message: '입력 데이터 검증 실패', // backend log fallback (frontend는 issues로 라우팅)
       issues: error.issues.map(serializeZodIssue),
     });
     ```
   - `errors: [{ path, message, code }]` 필드도 **유지** (backend log + 기존 e2e/spec 호환). 새 필드 `issues`는 frontend가 우선 read.
   - `redactSensitiveFields` 로직은 *log path*만 적용 (현재도 그러함) — response payload는 변경 없음 (issues는 path/code/params만 — body 값 미포함).
   - PII 방지: production 환경에서 `serializeZodIssue` 결과를 `redactIssueReceived(issue, NODE_ENV==='production')` 로 한 번 더 통과.

2. `apps/backend/src/common/filters/error.filter.ts` — 수정
   - `ZodError` 직접 throw 분기도 동일하게 `issues` 필드 포함
   - `HttpException` 분기에서 `exceptionResponse`에 `issues` 필드가 있으면 top-level `issues`로 transparent passthrough
   - **`handleZodError` schemas 헬퍼 영향 0** — 본 sprint는 *top-level `issues` 필드*를 추가하므로 충돌 없음

3. `packages/schemas/src/errors.ts` — 수정 (S-1)
   - `ErrorResponseSchema`에 optional `issues: z.array(BackendValidationIssueSchema).optional()` 추가
   - `BackendValidationIssueSchema = z.object({ path: z.array(z.union([z.string(), z.number()])), code: z.nativeEnum(ZodIssueCode), params: z.record(z.unknown()).optional() })`

**완료 기준:**
- `pnpm --filter backend run tsc --noEmit` PASS
- `pnpm --filter backend run test` PASS (기존 spec — `errors` 필드 유지로 회귀 0)
- 신규 spec: ZodValidationPipe fail 응답에 `issues: BackendValidationIssue[]` 포함 검증 (Phase 6에서 통합)

**검증:** `pnpm --filter backend run tsc --noEmit && pnpm --filter backend run test`

---

### Phase 3: VM SSOT 정책 결정 — Fallback 유지 + 정책 주석 명시

**목표:** VM SSOT를 폐기하지 않고 *역할 격하*로 SSOT 정합 유지. VM 본문 = backend log/test/swagger documentation fallback. Production response message는 frontend 무시.

**변경 파일:**
1. `packages/schemas/src/validation/messages.ts` — 수정 (주석만)
   - 파일 상단 JSDoc에 정책 명시 (Backend Fallback Layer 명시 + frontend 응답 path는 issues 사용)
   - **본문 함수 시그니처 변경 0** — 호출자 106 파일 회귀 0건.

**완료 기준:**
- VM 호출자 106 파일 *0건 수정* (blast radius minimal)
- `awk '/\/\*\*/,/\*\//' packages/schemas/src/validation/messages.ts | grep -c "Backend Fallback Layer\|frontend.*issues"` ≥ 1

**검증:** grep 검증으로 정책 주석 명시 확인.

---

### Phase 4: Frontend — Zod issue mapper SSOT 신설

**목표:** Backend `BackendValidationIssue[]` 응답을 i18n 메시지로 변환하는 단일 SSOT 진입점 신설. 모든 도메인 mapper(equipment/checkout/...)가 본 SSOT를 호출하도록 통합.

**변경 파일:**
1. `apps/frontend/lib/errors/zod-issue-mapper.ts` — 신규
   - `extractValidationIssues(error: unknown): BackendValidationIssue[] | null` — `error.response.data.issues` 또는 `error.issues` 추출 helper. 미존재 시 null.
   - `mapZodIssueToI18nKey(issue: BackendValidationIssue): { key: string; params: Record<string, string | number> }` — 단일 issue → key + params 변환:
     - `key = 'errors.validation.' + issue.code`
     - `params.field = 'errors.fields.' + (issue.path[0] ?? 'unknown')` — fallback 'unknown'
     - `params.min`, `params.max`, `params.expected`, `params.received` 등 issue.params 필드 1:1 forward
   - `mapZodIssuesToToast(error: unknown, t: TranslationFunction): ErrorToast | null`
   - **JIT-unsafe 보간 회피**: 본 함수의 `'errors.validation.' + code` 보간은 next-intl key lookup이라 안전 (Tailwind JIT 와 무관).

2. `apps/frontend/lib/errors/extract-error.ts` — 신규 (Hub 통합)
   - `extractErrorCode` 헬퍼를 `disposal-errors.ts`에서 분리하여 신설 + 공통 wrapper `extractErrorCodeOrIssues(error)` 제공.

3. `apps/frontend/lib/errors/__tests__/zod-issue-mapper.test.ts` — 신규
   - 16 ZodIssueCode 별 1 case → key/params 정합 spec
   - `extractValidationIssues` 다양한 error shape (Axios / plain / null) spec
   - `mapZodIssuesToToast` 다중 issue join + 단일 issue spec

**완료 기준:**
- `pnpm --filter frontend run tsc --noEmit` PASS
- `pnpm --filter frontend run test -- zod-issue-mapper` PASS (16+ cases)

**검증:** `pnpm --filter frontend run test -- zod-issue-mapper && pnpm --filter frontend run tsc --noEmit`

---

### Phase 5: i18n errors namespace ko/en parity — `validation` + `fields` 신설

**목표:** `errors.validation.<zodIssueCode>` 16 키 + `errors.fields.<fieldName>` 동적 namespace ko/en parity 신설.

**변경 파일:**
1. `apps/frontend/messages/ko/errors.json` — 수정 (top-level `validation` + `fields` 키 추가, 16 ZodIssueCode 모두)
2. `apps/frontend/messages/en/errors.json` — 수정 (parity 1:1)
3. `apps/frontend/__tests__/i18n-errors-validation-parity.test.ts` — 신규
   - ko↔en parity: `errors.validation` 키 set equality (16개)
   - ko↔en parity: `errors.fields` 키 set equality
   - ZodIssueCode union ↔ `errors.validation` 키 set equality (3-way)

**완료 기준:**
- `pnpm --filter frontend run test -- i18n-errors-validation-parity` PASS

**검증:** `pnpm --filter frontend run test -- i18n-errors-validation-parity`

---

### Phase 6: 회귀 spec — 한국어 인라인 0건 + Zod issue routing 통합

**목표:** 시니어 자기검토 3 라운드 모두 자동 회귀 spec으로 결빙.

**변경 파일:**
1. `apps/backend/src/common/pipes/__tests__/zod-validation-pipe-i18n.spec.ts` — 신규
   - **Round 1**: ZodValidationPipe fail 시 응답 payload에 `issues: BackendValidationIssue[]` 포함 (4 cases)
   - **Round 3**: production NODE_ENV에서 `invalid_string` issue의 `params.received` redact 검증
   - **Round 3**: development NODE_ENV에서 `params.received` 노출 검증

2. `apps/backend/src/common/filters/__tests__/error-filter-zod.spec.ts` — 신규
   - `ZodError` 직접 throw 시 응답 shape 검증
   - `BadRequestException({ issues })` passthrough 검증
   - `errorCodeToStatusCode[ErrorCode.ValidationError] === 400` 정합

3. `apps/frontend/__tests__/zod-issue-i18n-integration.test.ts` — 신규
   - **Round 2**: Backend mock 응답 16 ZodIssueCode → `mapZodIssuesToToast` 라우팅 → `errors.validation.<code>` i18n key 호출 검증
   - **Round 2**: ko / en locale 양쪽 모두 사람 가독 텍스트 반환 (한국어/영어 mix 0건)

4. `packages/schemas/src/__tests__/zod-issue-3way-equality.test.ts` — 신규 (Round 2 architecture spec)
   - ZodIssueCode union ↔ ko `errors.validation` keys ↔ en `errors.validation` keys 3-way set equality

**완료 기준:** 4 spec 파일 모두 PASS, 16 ZodIssueCode 모두 routing 검증, ko↔en set equality 자동 spec PASS

**검증:**
```bash
pnpm --filter backend run test -- zod-validation-pipe-i18n
pnpm --filter backend run test -- error-filter-zod
pnpm --filter frontend run test -- zod-issue-i18n-integration
pnpm --filter @equipment-management/schemas run test -- zod-issue-3way-equality
```

---

### Phase 7: 문서화 — ADR-0008 + backend-patterns + verify-zod Step 22

**목표:** 결정 근거 + Trigger Conditions for Reconsideration + 회귀 차단 SKILL 등록.

**변경 파일:**
1. `docs/adr/0008-backend-zod-error-i18n.md` — 신규
   - **Status**: Accepted (2026-05-08)
   - Context / Decision / Considered Options (3개 비교) / Consequences / Trigger Conditions for Reconsideration (4 조건) / Scope / References

2. `docs/references/backend-patterns.md` — 수정
   - "Zod Error Response Shape" 섹션 신규 추가

3. `.claude/skills/verify-zod/SKILL.md` — 수정
   - Step 22 신규 추가 (date suffix `(2026-05-08 추가)` 명시)
   - 검증 1: production code의 한국어 string literal 회귀
   - 검증 2: `errors.validation` ko/en 키 16개 정합
   - 검증 3: `BackendValidationIssue` import 단방향 (frontend ← schemas, schemas ← frontend 0건)
   - 검증 4: `mapZodIssuesToToast` 호출자 hub 통합 검증

**완료 기준:**
- ADR-0008 파일 존재 + Trigger Conditions 4건 명시
- backend-patterns.md "Zod Error Response Shape" 섹션 신설
- verify-zod SKILL Step 22 등록

---

### Phase 8: tracker closure + archive batch row + memory 업데이트

**목표:** 본 sprint를 tech-debt-tracker [x] + archive batch row + MEMORY.md 한 줄 인덱스로 영구 기록.

**변경 파일:**
1. `.claude/exec-plans/tech-debt-tracker.md` — 수정 (해당 issue [x] 처리 + line 57 항목 closure)
2. `.claude/exec-plans/tech-debt-tracker-archive.md` — append 본 sprint batch row + 다른 세션 [x] 2건 흡수
3. `/home/kmjkds/.claude/projects/-home-kmjkds-equipment-management-system/memory/MEMORY.md` — append 한 줄 인덱스 (200자 이내)

**완료 기준:**
- tracker [x] 표시
- archive batch row 추가
- MEMORY.md 한 줄 추가 (≤ 200자)

---

## 전체 변경 파일 요약

### 신규 생성 (11)
| 파일 | 용도 |
|------|------|
| `packages/schemas/src/validation/zod-issue.ts` | BackendValidationIssue + serialize/redact helpers SSOT |
| `packages/schemas/src/__tests__/zod-issue-serialize.test.ts` | 16 ZodIssueCode shape spec |
| `packages/schemas/src/__tests__/zod-issue-3way-equality.test.ts` | ZodIssueCode ↔ ko ↔ en set equality |
| `apps/frontend/lib/errors/zod-issue-mapper.ts` | Frontend issue → i18n key SSOT |
| `apps/frontend/lib/errors/extract-error.ts` | extractErrorCodeOrIssues wrapper hub |
| `apps/frontend/lib/errors/__tests__/zod-issue-mapper.test.ts` | 16+ cases mapper unit spec |
| `apps/frontend/__tests__/zod-issue-i18n-integration.test.ts` | 통합 라우팅 spec |
| `apps/frontend/__tests__/i18n-errors-validation-parity.test.ts` | ko↔en parity spec |
| `apps/backend/src/common/pipes/__tests__/zod-validation-pipe-i18n.spec.ts` | 응답 shape + PII redact spec |
| `apps/backend/src/common/filters/__tests__/error-filter-zod.spec.ts` | filter Zod 분기 spec |
| `docs/adr/0008-backend-zod-error-i18n.md` | ADR |

### 수정 (9)
| 파일 | 변경 의도 |
|------|----------|
| `packages/schemas/src/index.ts` | zod-issue.ts re-export |
| `packages/schemas/src/errors.ts` | ErrorResponseSchema에 issues 필드 추가 |
| `packages/schemas/src/validation/messages.ts` | JSDoc 정책 명시 (본문 0 변경) |
| `apps/backend/src/common/pipes/zod-validation.pipe.ts` | issues array payload + redact |
| `apps/backend/src/common/filters/error.filter.ts` | ZodError 분기 통일 + HttpException issues passthrough |
| `apps/frontend/messages/ko/errors.json` | validation + fields namespace 신설 |
| `apps/frontend/messages/en/errors.json` | parity |
| `apps/frontend/lib/errors/disposal-errors.ts` | extractErrorCode → extract-error.ts 분리 |
| `docs/references/backend-patterns.md` | "Zod Error Response Shape" 섹션 |
| `.claude/skills/verify-zod/SKILL.md` | Step 22 등록 |
| `.claude/exec-plans/tech-debt-tracker.md` | [x] |

---

## 의사결정 로그

- **2026-05-08 09:00 — 옵션 (b) Error code + FE i18n 채택**: Accept-Language backend i18n은 안티패턴(cascade + injection 표면), 한국어 단일 운영은 ko/en parity 사실 무효화. 옵션 (b)가 기존 ErrorCode 5-layer 정합 + FE 캐시 + 단방향 wire 모두 만족.
- **2026-05-08 09:00 — VM SSOT 폐기 보류 → 격하**: 폐기 시 호출자 106 파일 일괄 변경 + backend log 한국어 message 유실 → blast radius 과대. 응답 path만 issues array로 분리 = VM 호출자 0 수정으로 결합도 최소.
- **2026-05-08 09:00 — Frontend hub 통합 결정**: 도메인 mapper 21개 각각 수정 vs `extractErrorCodeOrIssues` wrapper 1줄 변경. wrapper 채택.
- **2026-05-08 09:00 — Field i18n key 동적 namespace**: `errors.fields.<fieldName>` namespace + missing 시 `unknown` fallback. JIT-unsafe 보간 회피(next-intl key lookup은 안전).
- **2026-05-08 09:00 — `params.received` PII redact 정책**: invalid_type의 `received`는 type 이름이라 PII 아님 그대로. invalid_string regex pattern fail 등 input text 재현 가능 케이스만 production redact.
- **2026-05-08 09:00 — VM 호출자 106 파일 무수정 결정**: 본 sprint 직접 변경 0건. 응답 path 분리로 자동 흡수.
