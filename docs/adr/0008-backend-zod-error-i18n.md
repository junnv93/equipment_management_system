# ADR-0008: Backend Zod Error i18n SSOT (Error Code + Frontend i18n Routing)

- **상태**: Accepted
- **일시**: 2026-05-08
- **결정자**: maintainer (1인 개발)
- **맥락 범위**: backend, frontend, packages/schemas, i18n, error-handling, security

## Context

`packages/schemas/src/validation/messages.ts` (이하 VM SSOT) 의 한국어 string literal/함수가
backend Zod 검증 실패 응답에 그대로 직렬화되어 frontend 에 전달되고 있었다. 시스템은 이미
`next-intl` 기반 ko/en parity 운영 중이었으나, `locale=en` 환경 사용자에게도 한국어
검증 메시지가 노출되는 i18n 회귀 결함이 존재.

핵심 사실:

- VM 호출자: backend DTO 30+ 파일 (총 106 호출)
- 본 시스템은 이미 `ErrorCode enum` 5-layer defense-in-depth 패턴 운영 중 (ADR 별도 미존재 — `verify-zod` Step 16, MEMORY.md 학습 참조)
- 그러나 **Zod 검증 실패는 ErrorCode 5-layer 를 거치지 않고 한국어 message 로 직접 응답** — i18n 갭의 본질
- frontend `messages/{ko,en}/*.json` namespace 는 도메인별로 운영 — `errors.equipment.*`, `errors.calibration.*` 등

이 문제를 해결하지 않으면:

1. `locale=en` 사용자가 한국어 메시지를 만나는 i18n 회귀
2. 다국어 운영 의사결정마다 backend message 함수 cascade — 안티패턴
3. ko/en parity 자동 검증 spec 부재 → silent miss 위험

## Decision

**옵션 (b) 채택 — Backend 는 machine-readable Zod issues array 반환, Frontend 가 i18n routing.**

backend Zod fail handler (`ZodValidationPipe` + `GlobalExceptionFilter`) 는 응답 payload 에
`{ code: 'VALIDATION_ERROR', issues: BackendValidationIssue[] }` 를 포함시킨다. frontend 는
응답의 `issues` 배열을 `errors.validation.<zodIssueCode>` namespace 로 i18n routing.

VM SSOT 는 폐기하지 않고 **backend log/audit/swagger documentation fallback** 으로 격하.
production 사용자 노출 응답은 VM message 텍스트에 의존하지 않으므로 ko/en parity 회귀가
_frontend i18n key 누락에서만_ 발생한다.

### 검토한 대안 (Options)

1. **Option A — Accept-Language 헤더 기반 backend i18n**
   - 장점: backend 단독 운영 시 응답 텍스트 그대로 사용 가능
   - 단점: 모든 `VM.*` 함수에 `lang` 파라미터 cascade — 안티패턴. `Accept-Language` 헤더
     injection 표면 추가. backend message generation 비용 (i18n catalog lookup × N issue).
     frontend i18n 패턴과 분기 (ko/en parity 검증 로직 이중화).

2. **Option B — Error code + Frontend i18n routing (채택)**
   - 장점: 기존 ErrorCode 5-layer 패턴 정합. FE i18n 캐시 활용. backend 응답 path overhead 0.
     `Accept-Language` injection 표면 0. ko/en parity 자동 spec (3-way set equality).
   - 단점: VM SSOT 격하 (backend log/swagger fallback 으로 책임 변경). frontend hub
     통합 wrapper (`extractErrorCodeOrIssues`) 신설 필요.

3. **Option C — 한국어 단일 운영 확정**
   - 단점: 본 시스템은 이미 ko/en parity 운영 중 (`apps/frontend/messages/{ko,en}/*.json`,
     `next-intl` config). ko/en parity 사실 무효화 → 운영 실태와 부합하지 않음. **부적합**.

## Consequences

### 긍정

- backend 응답 path overhead 0 — i18n resolution 은 frontend side cache hit
- 기존 ErrorCode 5-layer SSOT 정합 — `ErrorCode.ValidationError` 신규 추가 0,
  `errorCodeToStatusCode[ValidationError]=400` 결빙
- ko/en parity 자동 spec — `i18n-errors-validation-parity.test.ts` 가 11 ZodIssueCode set
  equality 영구 결빙. 신규 ZodIssueCode 도입 시 컴파일 + spec 양쪽 FAIL (silent miss 차단)
- 단방향 wire — `packages/schemas` 는 frontend i18n 에 의존 0건. Layer 위반 자동 spec
- Cluster mode 영향 0 — Zod fail handler 는 stateless, in-memory state 미공유
- VM 호출자 106 파일 _0건 수정_ — blast radius minimal (응답 path 만 issues array 로 분리)
- PII 누설 자동 차단 — zod v4 가 issue 자체에 input value 미노출. `invalid_format.pattern`
  (정규식 정의) 은 production redact

### 부정

- VM SSOT 의 한국어 message 본문은 backend log/test/swagger fallback role 로 격하 (production
  사용자 노출 X). 운영자가 backend log 만 보고 사용자 경험을 추측할 때 격차 발생 가능
- frontend hub `extractErrorCodeOrIssues` wrapper 도입 — 기존 도메인 mapper 21곳 잠재
  마이그레이션 (현 sprint 에서 `disposal-errors.ts` 만 이전, 나머지는 후속 sprint)

### 완화 (Mitigations)

- VM SSOT 헤더 JSDoc 에 _Backend Fallback Layer_ 정책 명시 — 후속 개발자 혼동 차단
- 도메인 mapper 21곳 마이그레이션은 후속 sprint trigger (회귀 발견 시) — 신규 ErrorCode
  체이닝은 이미 도메인 mapper 에서 처리 중이라 hub wrapper 신설로 충분
- 모든 backend production code 한국어 인라인 회귀는 `verify-zod` Step 22 grep 으로 결빙

### Trigger Conditions for Reconsideration

이 결정을 재검토해야 할 조건:

1. **Backend 가 frontend 없이 직접 호출되는 흐름 도입** — e2e CLI 자동화, 외부 서비스
   webhook callback 등에서 사람 가독 메시지가 backend 응답에 필요해질 때 → VM SSOT 부분
   격상 검토 (Option A 부분 도입). 트리거: 첫 사례 발생 시 ADR-0008 supersede.
2. **ZodIssueCode union 이 zod major bump 로 11개 외 신규 추가** — 3-way set equality spec
   FAIL 발생 시 namespace 갱신 + 마이그레이션 spec 추가. 트리거: zod v5 등 major release
   pin update 시.
3. **Frontend 가 next-intl 외 i18n 라이브러리로 마이그레이션** — `zod-issue-mapper.ts`
   재구현 필요 (Phase 1-3 packages/schemas 영향 0). 트리거: i18n 마이그레이션 sprint.
4. **Backend 응답 payload size 가 issues array 로 인해 +30% 초과** — 다중 issue 압축
   (path 단축, common params dedup) 검토. 트리거: 평균 응답 크기 telemetry 도입 후 운영
   기준 초과 발견 시.
   **[2026-05-08 closure]** `MetricsService.zod_validation_issues_total` Counter +
   `domain_route` × `issue_count_bucket` (`1`/`2-5`/`6-10`/`11+`) 라벨로 Prometheus sink 완료
   (`zod-i18n-mapper-hub-closure` sprint). 신규 reconsideration 트리거: `issue_count_bucket="11+"`
   bucket rate p95 지속 발생 시.

## Scope

- **IN**:
  - backend Zod fail response path (`ZodValidationPipe` + `GlobalExceptionFilter`)
  - frontend error mapper hub (`extractErrorCodeOrIssues` wrapper, `zod-issue-mapper`)
  - i18n `errors.validation.<code>` + `errors.fields.<name>` namespace ko/en parity
  - PII redact 정책 (`invalid_format.pattern` production redact)
- **OUT**:
  - backend i18n catalog (`apps/backend/src/common/i18n/messages/*.json`) — 별도 system
    (backend 내부 message catalog 용, frontend 응답 path 와 분리)
  - 도메인 mapper 21곳 hub wrapper 통합 (현 sprint 는 `disposal-errors.ts` 1곳 + hub 신설;
    나머지 도메인은 후속 sprint trigger)
  - 운영 모니터링 dashboard ValidationError 카운터 (4xx 는 운영 노이즈 + 클라이언트 책임 —
    현 `error.filter.ts` `if (statusCode < 500) return;` 정책 유지)

## References

- `packages/schemas/src/validation/zod-issue.ts` — `BackendValidationIssue` SSOT
- `packages/schemas/src/errors.ts` — `ErrorResponseSchema` + `ErrorCode` enum + `errorCodeToStatusCode`
- `packages/schemas/src/validation/messages.ts` — VM SSOT (Backend Fallback Layer JSDoc 명시)
- `apps/backend/src/common/pipes/zod-validation.pipe.ts` — Zod fail → issues array
- `apps/backend/src/common/filters/error.filter.ts` — ZodError 직접 throw 분기 + HttpException issues passthrough
- `apps/frontend/lib/errors/extract-error.ts` — Hub wrapper (`extractErrorCodeOrIssues`)
- `apps/frontend/lib/errors/zod-issue-mapper.ts` — Frontend i18n routing SSOT
- `apps/frontend/messages/{ko,en}/errors.json` — `validation` + `fields` namespace
- `apps/frontend/lib/errors/__tests__/i18n-errors-validation-parity.test.ts` — 3-way set equality
- `.claude/skills/verify-zod/SKILL.md` Step 22 — 회귀 차단 grep invariants
- 관련 sprint: `backend-zod-error-i18n-ssot` (2026-05-08, Mode 2 Full harness)
