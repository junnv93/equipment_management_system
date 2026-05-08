# 스프린트 계약: backend-zod-error-i18n-ssot

## 생성 시점
2026-05-08T09:00:00+09:00

## Slug
backend-zod-error-i18n-ssot

## 모드
Mode 2 (Full) — backend Zod 응답 한국어 하드코딩 5-layer SSOT closure (옵션 b: Error code + FE i18n) + ADR-0008 + verify-zod Step 22 SKILL 등록

## 변경 범위
- packages: 4 파일 (`packages/schemas/src/validation/zod-issue.ts` 신규 + `index.ts` + `errors.ts` + `validation/messages.ts` JSDoc)
- backend: 2 파일 (`apps/backend/src/common/pipes/zod-validation.pipe.ts` + `apps/backend/src/common/filters/error.filter.ts`)
- frontend: 4 파일 (`apps/frontend/lib/errors/zod-issue-mapper.ts` + `extract-error.ts` 신규 + `disposal-errors.ts` 분리 + `messages/{ko,en}/errors.json` validation/fields namespace)
- spec: 6 파일 신규 (3 backend + 3 frontend + 2 packages)
- 문서: 3 파일 (`docs/adr/0008-backend-zod-error-i18n.md` + `docs/references/backend-patterns.md` + `.claude/skills/verify-zod/SKILL.md` Step 22)

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 라운드 #1 (표면 결함) — grep 정확도 + 빌드 게이트

- [ ] **M-1** `pnpm tsc --noEmit` (full repo) 에러 0
  - 검증: `pnpm tsc --noEmit 2>&1 | grep -c "error TS"` = 0

- [ ] **M-2** `pnpm --filter backend run test` PASS — 본 sprint 신규 spec 포함 회귀 0
  - 검증: backend 전체 test suite exit 0
  - 신규 spec: `zod-validation-pipe-i18n.spec.ts` + `error-filter-zod.spec.ts` PASS

- [ ] **M-3** Backend production code (response path 한정) 한국어 인라인 0건
  - 검증 1 (pipe): `grep -nE "을\\(를\\)|입니다|입력해주세요" apps/backend/src/common/pipes/zod-validation.pipe.ts` 결과에 `message: '입력 데이터 검증 실패'` 1건만 (backend log fallback)
  - 검증 2 (filter): `grep -nE "을\\(를\\)|입니다|입력해주세요" apps/backend/src/common/filters/error.filter.ts` 결과에 사용자 응답 path 한국어 0건
  - 주의: VM 본문 (`packages/schemas/src/validation/messages.ts`) + dataMigration 도메인 로직 메시지 + audit log 한국어 메시지는 본 sprint scope 외

- [ ] **M-4** VM 호출자 106 파일 *0건 수정* (blast radius minimal 보장)
  - 검증: `git diff --name-only main...HEAD | grep -E "modules/.*/dto/.*\\.dto\\.ts" | wc -l` = 0
  - 정당화: VM 함수 본문은 backend log/test/swagger fallback role로 격하

- [ ] **M-5** `errors.validation.{zodIssueCode}` ko/en parity 11 키 정합 (zod v4 사실)
  - **iter 2 정정**: zod v4 는 11 ZodIssueCode (ZOD_ISSUE_CODE_VALUES SSOT). JSON Prettier 포맷이 `": "` (colon-space) 라 기존 grep `'":"'` (no-space) 미스매치 → 정규식 grep 사용.
  - 검증 1 (ko): `awk '/"validation": \\{/,/^  \\}/' apps/frontend/messages/ko/errors.json | grep -cE '^\\s+"[a-z_]+":'` ≥ 11
  - 검증 2 (en): `awk '/"validation": \\{/,/^  \\}/' apps/frontend/messages/en/errors.json | grep -cE '^\\s+"[a-z_]+":'` ≥ 11
  - 검증 3 (parity spec): `pnpm --filter frontend run test -- i18n-errors-validation-parity` PASS (3-way set equality 자동 결빙)

#### 라운드 #2 (architecture 갭) — 단방향 wire + SSOT 정합

- [ ] **M-6** `BackendValidationIssue` 단방향 wire — schemas는 frontend i18n에 의존 0건
  - **iter 2 정정**: JSDoc `@see apps/frontend/...` 주석은 의존이 아닌 *문서화 reference*. import 라인만 좁혀서 검증.
  - 검증 1: `grep -rE "^import .* from '(@equipment-management/schemas|.+/schemas/)" apps/frontend/lib/errors/zod-issue-mapper.ts` ≥ 1 (FE → schemas OK)
  - 검증 2: `grep -rE "^import .* from '(next-intl|.*messages/(ko|en)|.*apps/frontend)" packages/schemas/src/validation/zod-issue.ts` = 0 (schemas → FE 금지)
  - 검증 3: `grep -rE "^import .* from '.+/(frontend|messages/(ko|en))" packages/schemas/src/` = 0

- [ ] **M-7** ZodIssueCode union ↔ `errors.validation` 키 ↔ Record exhaustive 3-way set equality
  - **iter 2 정정**: zod v4 는 11 ZodIssueCode. spec PASS 가 3-way 모두 결빙 (ZOD_ISSUE_CODE_VALUES SSOT ↔ ko ↔ en).
  - 검증 1: `pnpm --filter @equipment-management/schemas run test -- zod-issue-3way-equality` PASS
  - 검증 2: `pnpm --filter frontend run test -- i18n-errors-validation-parity` PASS (ko 11 키 ↔ en 11 키 ↔ ZOD_ISSUE_CODE_VALUES 11 codes 1:1)
  - 검증 3: 신규 ZodIssueCode 도입 시 spec FAIL 자동 — `serializeZodIssue` 가 알 수 없는 코드를 `custom` 으로 normalize (silent miss 차단)

- [ ] **M-8** `ErrorCode.ValidationError` ↔ `errorCodeToStatusCode` mapper 정합
  - 검증: `grep -c "\\[ErrorCode.ValidationError\\]: 400" packages/schemas/src/errors.ts` ≥ 1
  - 검증: 본 sprint 후 `errorCodeToStatusCode[ErrorCode.ValidationError]` 변경 0건 (response status 400 결빙)

- [ ] **M-9** Frontend Zod issue mapper 단위 spec ≥ 16 cases (각 ZodIssueCode 별)
  - 검증: `pnpm --filter frontend run test -- zod-issue-mapper` 결과에 16+ cases PASS
  - 검증: 16 ZodIssueCode 별 `mapZodIssueToI18nKey` 결과 `key` 가 `errors.validation.<code>` 형식 정합

- [ ] **M-10** Backend Zod 응답 shape 신규 spec — `issues: BackendValidationIssue[]` 포함 검증
  - 검증: `pnpm --filter backend run test -- zod-validation-pipe-i18n` PASS (응답 payload 에 `code/message/issues/errors` 4개 필드 포함)
  - 검증: `pnpm --filter backend run test -- error-filter-zod` PASS

- [ ] **M-11** Hub 통합 — `extractErrorCodeOrIssues` / `mapZodIssuesToToast` SSOT 진입점 단일
  - **iter 2 정정**: 도메인 mapper 통합 패턴은 `mapZodIssuesToToast` fallback 호출 (extractValidationIssues 가 그 안에 wrap). grep 패턴에 `mapZodIssuesToToast` 도 포함.
  - 검증 1: `grep -c "export function extractErrorCodeOrIssues" apps/frontend/lib/errors/extract-error.ts` = 1
  - 검증 2: `extract-error.ts` 의 `extractErrorCode` 는 `disposal-errors.ts` 가 re-export — `grep -rl "export function extractErrorCode\\b" apps/frontend/lib/errors/` = 1 (extract-error.ts 만 정의)
  - 검증 3: 도메인 mapper에서 hub helper 호출 — `grep -rl "extractValidationIssues\\b\\|extractErrorCodeOrIssues\\b\\|mapZodIssuesToToast\\b" apps/frontend/lib/errors/*-errors.ts | wc -l` ≥ 5

#### 라운드 #3 (edge case + 운영) — PII redact + observability + 문서화

- [ ] **M-12** PII 누설 방지 — production 환경에서 issue `params.received` redact 검증
  - 검증 1 (pipe spec): production NODE_ENV에서 `invalid_string` issue의 `params.received` redact 결과 검증
  - 검증 2 (filter spec): production NODE_ENV에서 `ZodError` 직접 catch 분기도 동일 redact
  - 검증 3 (development): development NODE_ENV에서 `params.received` 노출 (디버깅 필요)
  - 검증 4 (PII allow-list): `invalid_type` 의 `received` (type 이름) 는 그대로 — 비-PII 명시
  - awk 추출: `awk '/redactIssueReceived/,/^}$/' packages/schemas/src/validation/zod-issue.ts | grep -c "production\\|isProduction"` ≥ 1

- [ ] **M-13** ADR-0008 작성 + Trigger Conditions for Reconsideration 4 조건
  - **iter 2 정정**: ADR template 의 `### Trigger Conditions for Reconsideration` (h3) 사용. heading level grep 정정.
  - 검증 1: `ls docs/adr/0008-backend-zod-error-i18n.md` 존재
  - 검증 2: `grep -cE "^### Trigger Conditions" docs/adr/0008-backend-zod-error-i18n.md` ≥ 1
  - 검증 3: Trigger Conditions 섹션 본문 4 조건 enumeration — `awk '/^### Trigger Conditions/,/^## /' docs/adr/0008-backend-zod-error-i18n.md | grep -cE "^[0-9]+\\."` ≥ 4
  - 검증 4: ADR `Status` PASS — `grep -c "상태.*Accepted\\|Status.*Accepted" docs/adr/0008-backend-zod-error-i18n.md` ≥ 1

- [ ] **M-14** verify-zod SKILL Step 22 등록 + grep invariant 본문 명시
  - **iter 2 정정**: Step 22 가 SKILL.md 마지막 step 일 때 awk range pattern (`/^### Step 22/,/^### Step/`) opening line 즉시 종료 → `sed` range 사용 ($EOF 까지).
  - 검증 1: `grep -c "^### Step 22" .claude/skills/verify-zod/SKILL.md` ≥ 1
  - 검증 2: Step 22 섹션 본문 — `sed -n '/^### Step 22/,/^## Exceptions/p' .claude/skills/verify-zod/SKILL.md | grep -c "errors\\.validation\\|BackendValidationIssue\\|zod-issue-mapper"` ≥ 3
  - 검증 3: date suffix `(2026-05-08 추가)` 명시 — `grep -c "Step 22.*2026-05-08\\|2026-05-08.*Step 22" .claude/skills/verify-zod/SKILL.md` ≥ 1

- [ ] **M-15** backend-patterns.md "Zod Error Response Shape" 섹션 신설
  - 검증 1: `grep -c "Zod Error Response Shape" docs/references/backend-patterns.md` ≥ 1
  - 검증 2: 섹션 본문 (awk 추출) 응답 payload 예시 + frontend routing 흐름 명시 — `awk '/Zod Error Response Shape/,/^## /' docs/references/backend-patterns.md | grep -c "issues\\|BackendValidationIssue\\|errors.validation"` ≥ 2

- [ ] **M-16** VM SSOT JSDoc 정책 주석 명시 (격하 결정)
  - 검증: `awk 'NR<=30' packages/schemas/src/validation/messages.ts | grep -c "Backend Fallback Layer\\|frontend.*issues\\|응답 path\\|production 사용자"` ≥ 1
  - 검증: VM 본문 함수 시그니처 변경 0 — `git diff packages/schemas/src/validation/messages.ts | grep -E "^[-+]" | grep -vE "^[-+][-+]+|^[-+]\\s*\\*|^[-+]\\s*\\/\\*\\*|^[-+]\\s*\\*\\/" | grep -c "^[-+][^-+]"` 가 본문 변경 무 (주석만)

#### 빌드/테스트/린트 게이트 (전 라운드 공통)

- [ ] **M-17** Frontend tsc — 본 sprint 변경 파일 에러 0
  - **iter 2 정정**: 외부 sprint 잔재(commit `39543592` `acdf8cfb`) tsc 에러는 본 sprint scope 외. 본 sprint 변경 파일 (`git diff --name-only` 결과) 만 verify.
  - 검증: `pnpm exec tsc --project apps/frontend/tsconfig.json --noEmit 2>&1 | grep -E "$(git diff --name-only HEAD | grep '\\.tsx?$' | tr '\\n' '|')dummy"` 빈 결과 (본 sprint 변경 파일 0 에러)
  - 외부 잔재는 evaluation 보고서에 별도 분리 명시 — 후속 sprint 책임
- [ ] **M-18** `pnpm --filter frontend run test` 본 sprint 신규 spec PASS + 회귀 0
  - 신규 spec: `zod-issue-mapper.test.ts` + `zod-issue-i18n-integration.test.ts` + `i18n-errors-validation-parity.test.ts` PASS
- [ ] **M-19** `pnpm --filter @equipment-management/schemas run test` PASS
  - 신규 spec `zod-issue-serialize.test.ts` + `zod-issue-3way-equality.test.ts` PASS
- [ ] **M-20** `pnpm --filter frontend run lint` 에러 0
- [ ] **M-21** `pnpm --filter backend run lint` 에러 0

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] **S-1** `packages/schemas/src/errors.ts` `ErrorResponseSchema` 에 `issues` optional 필드 등록
  - 검증: `grep -c "issues.*z\\.array\\|issues.*BackendValidationIssue" packages/schemas/src/errors.ts` ≥ 1

- [ ] **S-2** `handleZodError` schemas 헬퍼도 신 shape (issues array) 으로 정렬
  - 검증: `awk '/handleZodError/,/^}$/' packages/schemas/src/errors.ts | grep -c "issues\\|serializeZodIssue"` ≥ 1

- [ ] **S-3** 도메인 mapper 21곳 hub wrapper 통합 (모든 도메인 — 후속 sprint trigger)
  - **iter 2 정정**: 본 sprint 는 5곳 통합 (M-11 MUST). 잔여 13+곳은 trigger 발생 시 후속 sprint — tech-debt 등록.
  - 검증: `grep -rl "extractValidationIssues\\b\\|extractErrorCodeOrIssues\\b\\|mapZodIssuesToToast\\b" apps/frontend/lib/errors/*-errors.ts | wc -l` ≥ 15
  - SHOULD FAIL 시 `tech-debt-tracker.md` `domain-mapper-hub-integration-followup` 등록

- [ ] **S-4** Observability — `system_error_events` 5xx 캡처 정책에 ValidationError 포함 여부 검토
  - 검증: 4xx ValidationError 는 운영 노이즈 + 클라이언트 책임이라 *캡처 제외* (현재 `error.filter.ts` `if (statusCode < 500) return;` 로직 유지)

- [ ] **S-5** Cluster mode 영향 — Zod fail handler stateless, 영향 0 명시 (ADR §Consequences)
  - **iter 2 정정**: awk range 가 opening line 자체에 매칭되어 즉시 종료. `## Trigger Conditions` 까지 범위 확장.
  - 검증: `awk '/^## Consequences/,/^## (Trigger Conditions|Scope|References)/' docs/adr/0008-backend-zod-error-i18n.md | grep -c "stateless\\|cluster"` ≥ 1

- [ ] **S-6** ZodIssueCode 신규 도입 시 회귀 자동 차단 — exhaustive guard
  - **iter 2 정정**: exhaustive guard 는 `packages/schemas/src/validation/zod-issue.ts` 의 `KNOWN_PARAM_KEYS_BY_CODE: Readonly<Record<ZodIssueCode, ...>>` 에 위치 — 검증 파일 위치 정정.
  - 검증: `grep -c "Record<ZodIssueCode" packages/schemas/src/validation/zod-issue.ts` ≥ 1

- [ ] **S-7** Backend i18n `apps/backend/src/common/i18n/messages/{ko,en}.json` 영향 검토 — 본 sprint scope 외 명시
  - 검증: ADR-0008 §Scope 에 backend i18n 별도 system 명시

- [ ] **S-8** Tech-debt tracker [x] 처리 + archive batch row + MEMORY.md 한 줄 인덱스 업데이트
  - 검증: archive batch row 추가 확인
  - 검증: MEMORY.md 신규 라인 ≤ 200자 + slug 포함

---

## 적용 verify 스킬

자동 선택 기준:
- packages/schemas 변경 → verify-zod (Step 16, 22) + verify-implementation
- backend pipe/filter 변경 → verify-zod + verify-security (PII redact 검증)
- frontend lib/errors 변경 → verify-frontend-state + verify-i18n
- messages/{ko,en}/errors.json 변경 → verify-i18n (parity)
- ADR/SKILL 변경 → review-architecture (Layer 위반 + 단방향 wire 자동 검증)

---

## 시니어 자기검토 라운드 매핑

| 라운드 | 영역 | MUST 항목 | 발견 가능한 갭 |
|--------|------|-----------|----------------|
| #1 표면 결함 | grep 정확도 + 빌드 게이트 | M-1 ~ M-5, M-17 ~ M-21 | 한국어 인라인 회귀 / VM 호출자 미변경 / ko-en parity / tsc/test/lint |
| #2 architecture 갭 | 단방향 wire + SSOT 정합 | M-6 ~ M-11 | schemas → FE 의존 / 3-way set equality / ErrorCode mapper / hub 통합 / 신규 spec |
| #3 edge case + 운영 | PII + observability + 문서 | M-12 ~ M-16 | PII redact 정책 / ADR Trigger / SKILL Step / patterns.md / VM 정책 명시 |

---

## 종료 조건
- MUST 21개 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청

---

## ADR 명세 (Generator Phase 7에서 작성)

ADR-0008 본문 구조:

```
# ADR-0008: Backend Zod Error i18n SSOT

- **상태**: Accepted
- **일시**: 2026-05-08
- **결정자**: maintainer (1인 개발)
- **맥락 범위**: backend, frontend, packages/schemas, i18n, error-handling

## Context
[backend Zod 응답 한국어 하드코딩 → frontend en locale 회귀 + VM SSOT 호출자 106 파일 + ko/en parity 운영 사실]

## Decision
[옵션 (b) 채택 — Backend issues array machine-readable + Frontend i18n routing]

## Considered Options
1. Option A — Accept-Language backend i18n: 안티패턴 (cascade + injection 표면)
2. Option B — Error code + FE i18n: 채택
3. Option C — 한국어 단일 운영: ko/en parity 사실 무효화로 부적합

## Consequences
- + backend 응답 path overhead 0 (i18n resolution은 FE side)
- + ko/en parity 자동 spec으로 영구 결빙
- + 신규 ZodIssueCode 도입 시 컴파일타임 FAIL (silent miss 차단)
- + Cluster mode 영향 0 (Zod fail handler stateless)
- − VM 호출자 106 파일은 backend log/test fallback role로 격하 (일관성 trade-off)
- − Phase 4 hub 통합 시 `extractErrorCodeOrIssues` 단일 wrapper 신설

## Trigger Conditions for Reconsideration
1. Backend가 e2e/CLI 환경에서 frontend 없이 직접 호출되는 흐름이 도입되어 사람 가독 메시지가 backend 응답에서 필요해질 때 → VM SSOT 부분 격상 검토
2. ZodIssueCode union이 zod major bump로 16개 외 신규 추가될 때 → 3-way set equality spec 갱신만
3. Frontend가 next-intl 외 i18n 라이브러리로 마이그레이션할 때 → mapper Phase 4 재구현
4. Backend 응답 payload size 가 issues array로 인해 +30% 초과할 때 → 다중 issue 압축 검토

## Scope
- IN: backend Zod fail response path / frontend error mapper / errors.validation namespace
- OUT: backend i18n catalog (apps/backend/src/common/i18n/messages/) — 별도 system, 본 sprint scope 외

## References
- packages/schemas/src/validation/zod-issue.ts (BackendValidationIssue SSOT)
- packages/schemas/src/errors.ts (ErrorResponseSchema + ErrorCode)
- apps/frontend/lib/errors/zod-issue-mapper.ts (FE routing)
- apps/frontend/messages/{ko,en}/errors.json (validation/fields namespace)
- .claude/skills/verify-zod/SKILL.md Step 22
```
