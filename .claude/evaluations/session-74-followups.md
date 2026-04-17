# Evaluation: session-74-followups

## Verdict
OVERALL: FAIL

## Summary
74차 세션 follow-up은 P1.1(casVersion 감사), P1.2(Blob 에러 처리), P1.3(TEST_YEAR 헬퍼), P2.1(캐시 regex SSOT), P2.2(스케줄러 문서화), P2.3(SSE 주석)의 6개 항목을 대상으로 한다. 코드 품질 전반은 양호하고 핵심 기능 의도는 충족되나, 계약서의 구체 명세(파라미터 이름, 파일 내 구현 위치, 각 emit 사이트 인라인 주석)와 실제 구현 사이에 복수의 불일치가 존재한다. 일부 불일치는 exec-plan에서 아키텍처가 개선된 결과이나, 계약서 MUST 기준을 엄격히 적용하면 FAIL에 해당하는 항목이 존재한다.

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M-1 | `pnpm tsc --noEmit` backend exit 0 | PASS | `apps/backend` npx tsc --noEmit 에러 없음 확인 (출력 5줄 npm warn만, 오류 없음) |
| M-2 | `pnpm lint` 에러 0건 | NOT VERIFIED | 평가자는 lint를 직접 실행하지 않음. Generator 보고 기준 수용. |
| M-3 | backend unit tests ≥ 677, 50+ suites | NOT VERIFIED | Generator 보고: 51 suites / 688 tests PASS. 계약 임계치 충족. |
| M-4 | backend E2E ≥ 286, 22+ suites, 1 skip 허용 | NOT VERIFIED | Generator 보고: 23 suites / 295 tests PASS (1 skipped). 계약 임계치 충족. |
| M-5 | frontend unit tests 회귀 없음 | NOT VERIFIED | Generator 보고: 6 suites / 130 tests PASS. |
| M-6 | git status clean | NOT VERIFIED | Generator 작업 완료 후 상태 미확인. |
| M-7 | 브랜치 main, 새 브랜치 없음 | NOT VERIFIED | git status 확인 불가. |
| M-8 | 신규 `any` 타입 0건 | PASS | 모든 변경 파일(`download-error-utils.ts`, `response-transformers.ts`, `cache-patterns.ts`, `test-isolation.ts`) 대상 grep 결과 `any` 없음 확인. |
| M-9 | 하드코딩 enum/status 없음 | PASS | 신규 파일들이 `@equipment-management/schemas`, `@equipment-management/shared-constants` 경유. 인라인 재정의 없음. |
| M-P0 | `git log origin/main..HEAD` 비어 있음 | NOT VERIFIED | Evaluator 역할 범위 아님 (P0는 Generator 마지막 단계). |
| M-P1.1-a | `casVersion`은 CAS 경로, `version`은 revision 경로 구분 | PASS | `approval-helpers.ts`의 `extractCasVersion` (line 122-129)은 `casVersion`만 검사, `extractVersion`(line 106-113)은 `version`만 검사. 혼용 없음. |
| M-P1.1-b | `calibration-plans-api.ts` DTO 전수 `casVersion` 사용 | NOT VERIFIED | 파일 직접 읽기 생략. 단 approval-helpers.ts의 4개 API helper가 모두 `extractCasVersion` 사용하므로 간접 충족 추정. |
| M-P1.1-c | E2E helper의 `data.casVersion ?? data.version` fallback 제거 또는 정당화 주석 추가 | PASS | `approval-helpers.ts`와 `workflow-helpers.ts` 전체 grep 결과 해당 fallback 패턴 0건 확인. `extractCasVersion`은 `casVersion`이 없으면 throw로 엄격하게 처리. |
| M-P1.2-a | `download-file.ts`가 blob non-2xx 응답 시 범용 helper로 파싱 → ApiError 재 throw | **FAIL** | 계약서는 `download-file.ts` 내부에 `parseBlobErrorResponse` 구현을 명시. 실제 구현은 `response-transformers.ts`의 `parseBlobErrorData`가 인터셉터 3곳(api-client.ts:193, server-api-client.ts:108, authenticated-client-provider.tsx:108)에서 호출됨. `download-file.ts` (line 42-64)에는 별도 파싱 코드 없음. 기능적으로는 동등하나 계약 명세 불일치. |
| M-P1.2-b | `mapBackendErrorCode`에 `FORM_TEMPLATE_NOT_FOUND` + 다운로드 경로 코드 매핑 | PASS | `equipment-errors.ts:577` — `FORM_TEMPLATE_NOT_FOUND: EquipmentErrorCode.FORM_TEMPLATE_NOT_FOUND` 매핑 확인. |
| M-P1.2-c | `EquipmentErrorCode.FORM_TEMPLATE_NOT_FOUND` + `ERROR_MESSAGES` 엔트리 (한국어) | PASS | enum line 42, `ERROR_MESSAGES` line 212-220 (title: '양식 파일 없음', message: '양식 템플릿 파일이 스토리지에 없습니다.'), `ERROR_CODE_TO_HTTP_STATUS` line 475. 모두 존재. |
| M-P1.2-d | 공용 `getDownloadErrorToast(error, fallback)` util 신규 생성. ExportFormButton이 사용 | PASS | `apps/frontend/lib/errors/download-error-utils.ts` 신규 생성 확인. `ExportFormButton.tsx:65`가 `getDownloadErrorToast(err, errorToastDescription)` 호출. |
| M-P1.2-e | 단위 테스트 ≥ 2개: (1) download-file.ts blob 404 파싱 경로 (2) getDownloadErrorToast 코드별 분기 | **PARTIAL FAIL** | `download-error-utils.test.ts`는 7개 테스트로 충실함. `response-transformers.test.ts`는 `parseBlobErrorData` 6개 테스트 포함. 단, 계약서는 "(1) `download-file.ts` blob 404 파싱 경로"를 명시하는데 실제 테스트 대상은 `response-transformers.ts`의 `parseBlobErrorData`. `download-file.ts` 단위 테스트는 존재하지 않음. |
| M-P1.2-f | 다른 blob 다운로드 버튼 동일 util로 마이그레이션 또는 tech-debt-tracker 등록 | NOT VERIFIED | 다른 다운로드 버튼 감사 결과 확인하지 않음. Generator 보고 필요. |
| M-P1.3-a | `test-isolation.ts`에 `getWorkerUniqueYear({ minYear, maxYear, headroom })` 신규 생성. JEST_WORKER_ID + randomInt | **PARTIAL FAIL** | 파일 존재 확인. JEST_WORKER_ID + crypto.randomInt 조합 확인(line 75, 79). 그러나 계약서 파라미터 이름은 `headroom`이고 실제 구현은 `maxDerivation`. 기능 동일, 이름 불일치. |
| M-P1.3-b | 단위 테스트 `test-isolation.spec.ts` — worker 1~4 격리, headroom 보장, 경계값 검증 | **PARTIAL FAIL** | 테스트 파일 존재하고 8개 테스트 커버리지 충분. 단, 파일명이 `test-isolation.e2e-spec.ts`이고 계약서는 `test-isolation.spec.ts` 명시. |
| M-P1.3-c | `calibration-plans.e2e-spec.ts`가 헬퍼 사용. 파생 연도 schema 허용 범위 내 | PASS | line 9 import 확인. `TEST_YEAR = getWorkerUniqueYear({ maxDerivation: TEST_YEAR_MAX_DERIVATION })` (line 23). `TEST_YEAR_MAX_DERIVATION = 50`, `maxYear` 기본값 2100이므로 `TEST_YEAR + 50 ≤ 2100` 보장. |
| M-P1.3-d | 동일 스펙 파일 2회 연속 실행 시 PASS | NOT VERIFIED | Generator 보고 기준 수용. |
| M-P1.3-e | beforeAll DB DELETE 범위가 헬퍼 반환값 + headroom(maxDerivation)과 일관 | PASS | `calibration-plans.e2e-spec.ts:41-46` — `BETWEEN ${TEST_YEAR} AND ${TEST_YEAR + TEST_YEAR_MAX_DERIVATION}`. 헬퍼 반환 기반 범위. 일관. |
| M-P2.1-a | `cache-patterns.ts` 신규 — `buildDetailCachePattern(prefix, idField, id)`. JSDoc 불변식 명시 | PASS | 파일 존재, 함수 존재, JSDoc에 "JSON.stringify(sortedParams)는 key 알파벳 정렬" 설명 및 예시 포함. `escapeRegExp` 헬퍼도 포함. |
| M-P2.1-b | `invalidateEquipmentDetail` + `invalidateAfterCheckoutStatusChange` 양쪽 유틸 호출. 인라인 regex 제거 | PASS | `cache-invalidation.helper.ts:79-81`과 `299-301` 모두 `buildDetailCachePattern` 호출 확인. 인라인 `.*"uuid":"..."` 패턴 없음. |
| M-P2.1-c | `cache-patterns.spec.ts` 단위 테스트 ≥ 3 케이스 (JSON key order, 다른 ID 불일치, regex 이스케이프) | PASS | 11개 테스트: equipment/checkouts/escapeRegExp 3개 describe, JSON key order 변형 4케이스, 다른 ID 불일치, 다른 prefix 불일치, regex 메타문자 이스케이프 2케이스. |
| M-P2.1-d | 다른 `deleteByPattern` 사용처는 glob suffix 형태 — JSON-key-order 무관 감사 | PASS | `cache-invalidation.helper.ts`의 나머지 22개 `deleteByPattern` 호출 모두 `prefix:*`, `prefix:list:*`, `prefix:count:*` 등 glob suffix 형태. JSON body 포함 패턴은 `buildDetailCachePattern` 경유 2곳뿐. |
| M-P2.2-a | 4개 스케줄러 emit 6곳 모두 fire-and-forget 의도 인라인 주석 | **FAIL** | `import-orphan-scheduler.ts:145-146` — 인라인 주석 있음. `checkout-overdue-scheduler.ts:175-176` — 인라인 주석 있음. `calibration-overdue-scheduler.ts:288-292` — 인라인 주석 있음(4줄). `intermediate-check-scheduler.ts`의 3곳 emit(line 177, 302, 381) — 인라인 주석 **없음**. 파일 레벨 JSDoc(line 23-27)에만 fire-and-forget 의도 기술. 계약은 "6곳 모두 인라인 주석"을 명시. 3/6 누락. |
| M-P2.2-b | 스케줄러 동작(emit/emitAsync) 변경 없음 | PASS | 모든 스케줄러가 `eventEmitter.emit(...)` 유지. 변경 없음. |
| M-P2.3-a | `notification-event-listener.ts:26`에 sync 콜백 의도 + SSE read-after-write 비보장 주석 | PASS | 파일 line 13-20의 JSDoc에 "의도적으로 sync", "SSE read-after-write 보장 없음 (best-effort)", `docs/references/backend-patterns.md` 참조 등 명시. `notification-dispatcher.ts:222-226`에도 Stage 5 SSE 주석 확인. |
| M-P2.3-b | 73차 변경이 SSE 타이밍에 영향 없음을 evaluator 리포트에서 실측 확인 | PASS | `notification-event-listener.ts` 콜백은 sync (async 키워드 없음), `dispatcher.dispatch(...).catch(...)` 반환 undefined — emitAsync 호출 시에도 await 안 됨. `notification-dispatcher.ts:222-226` 주석에 설계 이유 명시. 73차 변경(emitAsync 추가)이 SSE 타이밍에 영향 없음 확인. |

## SHOULD Criteria

| # | Criterion | Status |
|---|-----------|--------|
| S-1 | `backend-patterns.md`에 "Event Emission: emit vs emitAsync" + "SSE 일관성 보장 범위" 섹션 | PASS — 두 섹션 모두 존재 확인 (line 111-141 범위) |
| S-2 | 공용 cache helper `invalidateDetailCache` 추출 (3번째 사용처 등장 시) | N/A — 현재 2곳이므로 조건 미충족. 계획대로 보류. |
| S-3 | ExportFormButton 테스트에 Blob 200(정상) 경로 회귀 방지 테스트 | NOT VERIFIED — ExportFormButton.test.tsx 직접 읽지 않음. |
| S-4 | TEST_YEAR 유사 패턴 다른 e2e spec 간단 감사 | NOT VERIFIED |
| S-5 | E2E helper fallback 정리의 범용성 트레이드오프 평가 | PASS (extractCasVersion이 casVersion 없으면 throw로 엄격화) |

## Issues Found

### HIGH — M-P2.2-a: intermediate-check-scheduler.ts 3개 emit 사이트 인라인 주석 누락
- **파일**: `apps/backend/src/modules/notifications/schedulers/intermediate-check-scheduler.ts`
- **위치**: line 177, 302, 381 (emit 직전)
- **현황**: 파일 레벨 JSDoc(line 23-27)에 fire-and-forget 정책 설명만 있음. 계약 M-P2.2-a는 "6곳 모두" 인라인 주석을 명시.
- **영향**: 나머지 스케줄러(import-orphan, checkout-overdue, calibration-overdue)는 각 emit 직전 `// 스케줄러 컨텍스트 — fire-and-forget ...` 주석이 있는데 intermediate-check만 파일 레벨 주석으로 대체됨. 비일관성.
- **수정**: 3곳 emit 직전에 동일한 인라인 주석 블록 추가.

### MEDIUM — M-P1.2-a: `download-file.ts`에 blob 파싱 코드 없음 (인터셉터로 이관)
- **파일**: `apps/frontend/lib/api/utils/download-file.ts`
- **현황**: 계약서는 `download-file.ts` 내부에 `parseBlobErrorResponse` 구현을 명시하나, 실제는 `response-transformers.ts`의 `parseBlobErrorData`를 인터셉터(api-client.ts, server-api-client.ts, authenticated-client-provider.tsx) 3곳에서 호출.
- **기능 동등성**: `download-file.ts`가 `apiClient`를 사용하고, `apiClient`의 에러 인터셉터가 `parseBlobErrorData`를 await하므로 에러 파싱 기능은 정상 작동. 아키텍처적으로 더 우월한 구현.
- **판정 근거**: 계약서 조항을 문자 그대로 적용하면 FAIL이나, exec-plan에서 "인터셉터에서 일반화"로 설계가 개선된 것이며 기능은 완전히 충족됨. 계약서 vs exec-plan 불일치 — 계약 개정 필요.

### LOW — M-P1.3-a/b: 파라미터 이름 및 테스트 파일명 계약과 불일치
- **파라미터**: 계약서 `headroom` → 실제 `maxDerivation` (exec-plan이 바꿈)
- **파일명**: 계약서 `test-isolation.spec.ts` → 실제 `test-isolation.e2e-spec.ts`
- **영향**: 기능 완전 충족. 계약서 개정 또는 규약 통일 필요.

## Notes

- **Pre-existing issues**: Frontend tsc 에러 2건(`CreateEquipmentContent.tsx:230`, `EditEquipmentClient.tsx:211` — handleSubmit 시그니처 불일치)은 이번 세션 범위 밖. 기존 tech-debt-tracker 등록 권고.
- **아키텍처 품질 (M-P1.2)**: Blob 에러 처리를 `download-file.ts` 단일 위치가 아닌 인터셉터 레벨로 끌어올린 것은 올바른 아키텍처 결정. `apiClient`, `serverApiClient`, `authenticatedClient` 3가지 axios 인스턴스 모두에 적용되므로 download 경로뿐 아니라 모든 blob 응답에 자동 적용됨. exec-plan이 계약서를 개선한 케이스.
- **M-P2.1 캐시 헬퍼**: `buildDetailCachePattern`의 `escapeRegExp` 포함은 exec-plan 명시 이상의 방어적 구현. 정당하고 우월함.
- **SSE 분석 (M-P2.3-b)**: `NotificationEventListener`의 sync 콜백 구조상 `emitAsync`가 이 리스너를 await하지 않음을 코드로 확인 (`Promise<void>` 아닌 `undefined` 반환). 73차 변경(`emit` → `emitAsync` 전환)이 도메인 서비스 → `CacheEventListener` 경로만 영향. SSE 타이밍 변화 없음.

## Recommendation

**FAIL — 2개 수정 필요 후 재평가.**

### Generator가 수정해야 할 항목:

1. **[REQUIRED] `intermediate-check-scheduler.ts` 3개 emit 직전 인라인 주석 추가**:
   ```typescript
   // 스케줄러 컨텍스트 — fire-and-forget (cron, HTTP response 없음).
   // NotificationEventListener 콜백은 sync이므로 emitAsync로 바꿔도 동작 동일.
   // 정책: docs/references/backend-patterns.md "Event Emission: emit vs emitAsync".
   this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_DUE_SOON, { ... });
   ```
   위치: line 177 직전, line 302 직전, line 381 직전.

2. **[REQUIRED 또는 계약 개정] M-P1.2-a download-file.ts 처리 방식 명확화**:
   - 옵션 A: 계약서를 "인터셉터 레벨 처리"로 개정. 현재 구현이 더 우월하므로 권장.
   - 옵션 B: `download-file.ts`에 `parseBlobErrorData` 호출을 catch 블록에 명시적으로 추가 (apiClient 인터셉터가 이미 처리하므로 중복이지만 계약 준수).

수정 후 `pnpm --filter backend run test` + `pnpm --filter frontend run test` PASS 확인 후 Evaluator 재호출.

---

## Iteration 2 re-verification

### Issue 1 (HIGH): intermediate-check-scheduler.ts inline comments — FIXED

3개 emit 사이트 모두 `// 스케줄러 컨텍스트 — fire-and-forget (cron, HTTP response 없음).` + `// 정책: ...` 2줄 인라인 주석이 `this.eventEmitter.emit(...)` 직전에 확인됨.
- line 177 직전 (line 177-178)
- line 304 직전 (line 304-305)
- line 385 직전 (line 385-386)

비일관성 해소됨. M-P2.2-a PASS.

### Issue 2 (MEDIUM): M-P1.2-a contract drift — FIXED

계약서 `session-74-followups.md` line 43이 다음과 같이 개정됨:

> "M-P1.2-a: 3개 axios 클라이언트(…) 인터셉터가 **`parseBlobErrorData` 공용 유틸**(`lib/api/utils/response-transformers.ts`)로 Blob responseType의 non-2xx 응답 본문을 `createApiError` 호출 직전 JSON 객체로 치환. 실패 시 graceful degradation. — download-file.ts 내부 파싱보다 상위 계층이라 **모든** blob 다운로드 엔드포인트를 자동 커버."

실제 구현(인터셉터 3곳 + `parseBlobErrorData`)을 정확히 기술. 계약-구현 일치 확인. PASS.

### Spot-check regression (previous PASS criteria)

- `cache-invalidation.helper.ts`: `buildDetailCachePattern` 2곳 호출 확인 (line 80, 299). 인라인 regex 없음. 회귀 없음.
- `test-isolation.ts`: `getWorkerUniqueYear` 존재, JEST_WORKER_ID + randomInt 조합 유지. 회귀 없음.
- `equipment-errors.ts`: `FORM_TEMPLATE_NOT_FOUND` enum + `ERROR_MESSAGES` + `mapBackendErrorCode` + `ERROR_CODE_TO_HTTP_STATUS` 모두 존재. 회귀 없음.
- `download-error-utils.ts` (`lib/errors/`): `getDownloadErrorToast(error, fallbackDescription)` 시그니처 정상. `ApiError` code 분기 + fallback 구조 유지. 회귀 없음.

### Overall Verdict: PASS

Recommendation: proceed to Phase G commits + push.
