# 74차 세션 follow-up 구현 계획

## 메타
- 생성: 2026-04-17T00:00:00+09:00
- 모드: Mode 2 (Harness)
- Slug: session-74-followups
- 예상 변경: 약 12~15개 파일 (프로덕션 코드 5~7 + 문서/주석 4~6 + 테스트 2~3)
- 차기 이후: 74차 완료 시 `active/` → `completed/` 이동

## 설계 철학
73차 근본 수정(이벤트/캐시 일관성)의 파생 확인 + 미처리 기술부채 정리.
새 기능 없음. 수술적 변경 원칙: **발견된 실제 결함만 수정**, 문서화/주석은 별도 phase.

## 아키텍처 결정 (개정 v2 — 타협 제거)

| 결정 | 선택 | 근거 |
|------|------|------|
| calibration-plans version 혼재 | **수정 불필요** (검증만 수행) | 실측 결과 backend/frontend 모두 casVersion과 version을 올바르게 분리 사용. SSOT 변경 시 break하는 latent 버그 아님. |
| **blob 다운로드 에러 처리** | **범용 `parseBlobErrorResponse` 유틸 + 기존 `download-file.ts` 내부 통합** — FORM_TEMPLATE_NOT_FOUND만이 아닌 **모든 blob 다운로드**가 백엔드 에러 코드/메시지를 받도록 일반화 | 근본 원인: `responseType: 'blob'`이면 axios가 에러 응답도 Blob으로 래핑 → error code 유실. 특정 코드만 고치는 건 임시방편. |
| 에러 코드 매핑 | `FORM_TEMPLATE_NOT_FOUND`와 **다운로드 경로에 나타날 수 있는 모든 backend error code** enum에 추가 + `ERROR_MESSAGES` 엔트리 보강 | SSOT: `packages/schemas/src/errors.ts`에 이미 정의된 코드 중 frontend mapping에 누락된 것 전수 감사. |
| 토스트 분기 | `ExportFormButton` + `ExportDocumentButton` 등 **모든 다운로드 버튼 공통 util** (`getDownloadErrorToast(error)`) | 특정 버튼별 분기는 drift 발생 필연. 공용 util로 단일화. |
| **TEST_YEAR 충돌** | `apps/backend/test/helpers/test-isolation.ts`에 `getWorkerUniqueYear(range, derivationCount)` 헬퍼 **추출** | worker 격리 연도 생성은 재사용 가능한 인프라 패턴. 단일 파일 인라인 수식은 향후 복붙 유발. JEST_WORKER_ID + crypto.randomInt. |
| **공용 캐시 헬퍼 추출** | **즉시 추출** (`buildDetailCachePattern(prefix, idField, id)` in `apps/backend/src/common/cache/`) | SSOT 원칙: 동일 패턴 2곳 + 1곳 잠재 버그. "≥3 임계치"는 업계 표준 아닌 임의 기준. 향후 3번째 사용처가 broken 형태 복사할 위험 제거. |
| 캐시 regex 회귀 방지 | 단위 테스트 추가: JSON key order가 바뀌어도 매칭되는지 property-based 검증 | SSOT 강제: 테스트가 불변식을 박제. |
| 스케줄러 emit 정책 | **기존 `emit` 유지 + 문서화만** | 현재 NotificationEventListener 콜백이 sync라 `emitAsync`로 바꿔도 동작 동일. 스케줄러는 의도적 fire-and-forget. |
| SSE 리프레시 | **코드 변경 없음, 인라인 주석만 추가** | 실측 결과 73차 변경이 SSE 타이밍에 영향 없음. 단 "SSE는 read-after-write 보장 안 됨" 명시 필요. |

## 정찰 결과 요약

### P1.1 — calibration-plans version/casVersion
- Backend SSOT OK: service.ts가 CAS에 `casVersion`, 개정번호에 `version` 정확 구분 (service.ts:74-77 주석 참고, service.ts:448-702 CAS 경로, service.ts:959 `version + 1` 개정).
- Frontend SSOT OK: `lib/api/calibration-plans-api.ts:92,96,172,184,190,196,201,207` 모두 casVersion 요구.
- E2E 헬퍼 fallback (`data.casVersion ?? data.version`): `tests/e2e/shared/helpers/approval-helpers.ts:104,238,265,287,313`, `tests/e2e/workflows/helpers/workflow-helpers.ts:63,474`. 현재 무해하지만 의도 불명확.

### P1.2 — FORM_TEMPLATE_NOT_FOUND UX
- Backend throw: `apps/backend/src/modules/reports/form-template.service.ts:111,128,184,203` (404 + 한국어 메시지 포함).
- Frontend blob 에러 핸들링 공백:
  - `apps/frontend/lib/api/utils/download-file.ts:45` — `responseType: 'blob'` → 404 body가 Blob으로 도착
  - `apps/frontend/lib/errors/equipment-errors.ts:487-529` — `mapBackendErrorCode`에 `FORM_TEMPLATE_NOT_FOUND` 엔트리 없음
  - `apps/frontend/components/shared/ExportFormButton.tsx:62-64` — 모든 에러를 동일한 generic toast로 처리

### P1.3 — TEST_YEAR
- `apps/backend/test/calibration-plans.e2e-spec.ts:18` — 약 11.57일 주기. 단일 파일 내 +1/+10/+11/+20/+30/+100 파생 사용.
- 동일 범위 DB DELETE가 beforeAll에 존재 (line 37-41) → 방어 정상 작동 중.

### P2.1 — deleteByPattern regex 감사
- JSON-order-agnostic 정규식 사용처: 2곳
  1. `cache-invalidation.helper.ts:82` — 73차 수정 완료 (equipment detail)
  2. `cache-invalidation.helper.ts:298-299` — checkouts detail. 현재 `{"uuid":"..."}` 단일 키라 우연히 동작. **잠재 버그**.
- 나머지 24개 `deleteByPattern`은 glob suffix(`prefix:*`)라 JSON key order 무관.

### P2.2 — Scheduler emit
- 4개 스케줄러, 총 6개 `emit` 호출:
  - `import-orphan-scheduler.ts:145`
  - `intermediate-check-scheduler.ts:171, 296, 375`
  - `checkout-overdue-scheduler.ts:175`
  - `calibration-overdue-scheduler.ts:290`
- `NotificationEventListener.onModuleInit` 콜백이 sync (listeners/notification-event-listener.ts:26) → `emitAsync` 로 전환해도 await 안 됨. 의도적 선택.

### P2.3 — SSE
- `notification-dispatcher.ts:227-249` Stage 5에서 `sseService.pushToUser` 호출.
- `notification-sse.service.ts:119` pushToUser는 RxJS `Subject.next()` (sync).
- `notification-event-listener.ts:26` 콜백은 sync → emitAsync upstream은 dispatcher 완료 대기 안 함.
- 73차 변경이 SSE 타이밍에 영향 **없음**.

## 구현 Phase

### Phase A: P1.1 calibration-plans version 감사 (검증-only)
**목표:** 실제 결함이 없음을 확정하고 E2E 헬퍼 fallback을 정리.
**변경 파일:**
1. `apps/frontend/tests/e2e/shared/helpers/approval-helpers.ts` — 수정: `data.casVersion ?? data.version` fallback 제거, calibration-plans 전용 helper는 `casVersion`만 기대하도록 단순화. (의도 명확화)
2. `apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts` — 수정: line 63의 `getVersion` 헬퍼는 양쪽 모두 수용 유지 (범용), 단 line 474 `extractCasVersion`은 `casVersion`만 기대.

**검증:** `pnpm --filter frontend run tsc --noEmit`, 교정계획서 E2E suite 재실행.

### Phase B: Blob 다운로드 에러 아키텍처 일반화 (P1.2 + 파생)
**목표 (개정):** 특정 에러 코드만이 아닌 **모든 blob 다운로드 엔드포인트**가 백엔드 에러 코드/메시지를 정상 표면화하는 범용 인프라 구축.

**정찰:**
- `responseType: 'blob'` 사용처 전수 감사: `download-file.ts`가 유일한 다운로드 유틸이라면 단일 지점 수정으로 완료. 다른 곳에 있으면 모두 포함.
- `ErrorCode` enum (packages/schemas) vs frontend `EquipmentErrorCode` 갭 감사: backend가 다운로드 경로에서 throw 가능한 코드 전수 파악.

**변경 파일 (개정):**
1. `apps/frontend/lib/api/utils/download-file.ts` — **수정**:
   - 내부 helper `parseBlobErrorResponse(blob: Blob): Promise<{ code?: string; message?: string } | null>` 추가 (JSON 파싱 실패 시 null 반환, 타입 안전).
   - catch 블록에서 `axios.isAxiosError(err) && err.response?.data instanceof Blob`인 경우 blob body를 text로 읽어 JSON parse → `ApiError` 생성해 재 throw.
   - 실패 시 원본 에러 throw (graceful degradation).
2. `apps/frontend/lib/errors/equipment-errors.ts` — **수정 (범위 확장)**:
   - `EquipmentErrorCode` enum에 `FORM_TEMPLATE_NOT_FOUND` 추가 + 다운로드 경로에 등장 가능한 다른 코드 감사 후 누락분 추가 (예: `DOCUMENT_NOT_FOUND`, `EXPORT_FAILED` 등 backend `ErrorCode` 대조).
   - `ERROR_MESSAGES[FORM_TEMPLATE_NOT_FOUND]` 등 엔트리 추가 (title 한국어).
   - `mapBackendErrorCode` mappings 확장.
3. `apps/frontend/lib/errors/download-error-utils.ts` — **신규**: `getDownloadErrorToast(error: unknown, fallback: string): { title: string; description: string }` 공용 util. 모든 다운로드 버튼이 catch 블록에서 이 함수를 호출하여 일관된 토스트 생성.
4. `apps/frontend/components/shared/ExportFormButton.tsx` — **수정**: catch 블록에서 `getDownloadErrorToast(err, fallbackMessage)` 호출로 교체.
5. **다른 다운로드 버튼 감사/수정**: `ExportDocumentButton`, `ReportExportButton`, equipment export 등 동일 패턴 적용 (존재 시).
6. `apps/frontend/lib/api/utils/__tests__/download-file.test.ts` — **신규 or 확장**: Blob 404 JSON {code, message} → ApiError로 변환 경로 테스트 + Blob이 JSON 아닌 경우 graceful degradation 테스트.
7. `apps/frontend/lib/errors/__tests__/download-error-utils.test.ts` — **신규**: `FORM_TEMPLATE_NOT_FOUND` → 한국어 메시지, unknown code → fallback 분기 테스트.

**검증:** 
- `pnpm --filter frontend run tsc --noEmit`
- `pnpm --filter frontend run test` (download-file, download-error-utils, ExportFormButton 모두)
- 수동 확인: backend에서 `FORM_TEMPLATE_NOT_FOUND` 트리거 시 한국어 메시지 노출 확인.

### Phase C: TEST_YEAR 충돌 — 공용 테스트 격리 헬퍼 추출 (P1.3 + 인프라)
**목표 (개정):** 재사용 가능한 worker-격리 유니크 값 생성 헬퍼를 테스트 인프라로 추출.

**변경 파일:**
1. `apps/backend/test/helpers/test-isolation.ts` — **신규**:
   - `getWorkerUniqueYear(opts?: { minYear?: number; maxYear?: number; headroom?: number }): number` — JEST_WORKER_ID와 crypto.randomInt를 조합, `[minYear, maxYear - headroom]` 범위 내 고유 연도 생성. 기본값은 calibration-plans schema 허용 범위 [2020, 2100 - 100] = [2020, 2000]... 아, [2020, 2100]이고 derivation 100 필요하면 maxYear=2000... 실제로는 minYear 조정으로 해결.
   - 구현: `workerId = Number(process.env.JEST_WORKER_ID ?? '1'); workerSlot = 20 years per worker; baseYear = minYear + (workerId - 1) * 20 + randomInt(0, 15)`. 단 `baseYear + headroom <= maxYear` 보장.
   - `getWorkerUniqueNumber(prefix?: string): string` — 관리번호 등 문자열 유니크 값 생성용 (후속 테스트 재사용).
2. `apps/backend/test/helpers/__tests__/test-isolation.spec.ts` — **신규**: 단위 테스트 — worker 1~4가 서로 다른 범위 반환, headroom 준수, minYear/maxYear 경계값 검증.
3. `apps/backend/test/calibration-plans.e2e-spec.ts` — **수정**:
   - import `{ getWorkerUniqueYear } from './helpers/test-isolation'`.
   - `TEST_YEAR = getWorkerUniqueYear({ minYear: 2025, maxYear: 2098, headroom: 100 })` (headroom=100 = 가장 큰 파생).
   - beforeAll DELETE 범위: `BETWEEN TEST_YEAR AND TEST_YEAR + 100` 유지 (헬퍼가 maxYear - headroom까지만 반환하므로 안전).
   - 상단 주석: "worker별 격리 — test-isolation.ts 헬퍼 참고".
4. 다른 E2E 파일 감사 (정찰) — 유사 문제 있으면 **동일 헬퍼로 마이그레이션 가능함을 주석으로 표시** (즉시 변경은 범위 초과, tech-debt-tracker에 기록).

**검증:**
- `pnpm --filter backend run test -- test-isolation` (신규 단위 테스트 PASS)
- `pnpm --filter backend run test:e2e -- calibration-plans` 2회 연속 PASS

### Phase D: 캐시 JSON-key-order-agnostic 패턴 SSOT 추출 (P2.1)
**목표 (개정):** 2곳 사용 + 1곳 잠재 버그를 즉시 공용 유틸로 SSOT화. 회귀 방지 테스트로 불변식 박제.

**변경 파일:**
1. `apps/backend/src/common/cache/cache-patterns.ts` — **신규**:
   - `buildDetailCachePattern(prefix: string, idField: string, id: string): string` — JSON-key-order-agnostic 정규식 문자열 생성.
   - 반환 형태: `${prefix}:detail:.*"${idField}":"${escapeRegex(id)}"`.
   - 내부 `escapeRegex(str)` 유틸 포함 (id가 regex meta character 포함 가능성 방어 — UUID는 안전하지만 일반화 위해).
   - 파일 상단 JSDoc: "JSON.stringify(sortedParams)는 key 알파벳 정렬 → key 순서 의존 regex는 파라미터 추가 시 silent break. 이 헬퍼는 key 순서 무관 매칭 보장."
2. `apps/backend/src/common/cache/__tests__/cache-patterns.spec.ts` — **신규**:
   - Property-based 스타일: 같은 {uuid, teamId} 객체에 대해 sortedParams 순서 2가지 모두 매칭 검증.
   - 다른 ID 매칭 안됨 검증.
   - regex meta character 이스케이프 검증.
3. `apps/backend/src/common/cache/cache-invalidation.helper.ts` — **수정**:
   - `invalidateEquipmentDetail` (line 82): 인라인 regex → `buildDetailCachePattern('equipment', 'uuid', uuid)` 호출로 교체.
   - `invalidateAfterCheckoutStatusChange` (line 298-299): 동일하게 교체 (잠재 버그 제거).
   - 두 함수 주석에서 "JSON-key-order" 설명 제거 (유틸로 이관되었으므로), 대신 "사용 이유" 간결 주석만 남김.
4. `apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts` (기존) — 필요 시 integration 레벨 검증 추가.

**검증:**
- `pnpm --filter backend run test -- cache-patterns` (신규 PASS)
- `pnpm --filter backend run test -- cache-event-listener` (기존 회귀 없음)
- grep: `deleteByPattern.*detail` 결과가 공용 유틸만 경유하는지 확인

### Phase E: P2.2 스케줄러 문서화
**목표:** 6개 emit 호출 인라인 주석 + 중앙 문서화.

**변경 파일:**
1. `apps/backend/src/modules/notifications/schedulers/import-orphan-scheduler.ts` — 수정: line 145 `emit` 위에 주석 추가.
2. `apps/backend/src/modules/notifications/schedulers/intermediate-check-scheduler.ts` — 수정: line 171, 296, 375 위에 동일 주석 (반복 3회).
3. `apps/backend/src/modules/notifications/schedulers/checkout-overdue-scheduler.ts` — 수정: line 175 위에 주석.
4. `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts` — 수정: line 290 위에 주석.
5. `docs/references/backend-patterns.md` — 수정: 새 섹션 "Event Emission: `emit` vs `emitAsync`" 추가.

주석 템플릿 (공통):
```
// 스케줄러 컨텍스트 — fire-and-forget 의도:
// HTTP response 경로 아님, 알림 실패가 배치 로직을 차단하지 않음.
// NotificationEventListener 콜백은 sync이므로 emitAsync로 바꿔도 동작 동일.
// 자세한 정책: docs/references/backend-patterns.md "Event Emission"
```

**검증:** `pnpm tsc --noEmit`, 스케줄러 동작 변경 없으므로 실측 실행 불필요.

### Phase F: P2.3 SSE 코드 주석 (리포트 + 최소 변경)
**목표:** 73차 변경의 SSE 영향 없음을 코드에 박제.

**변경 파일:**
1. `apps/backend/src/modules/notifications/listeners/notification-event-listener.ts` — 수정: line 26 콜백 위에 주석 추가.
2. `apps/backend/src/modules/notifications/services/notification-dispatcher.ts` — 수정: Stage 5 직전(line 222) 주석 확장.
3. `docs/references/backend-patterns.md` — Phase E 같은 섹션 내 subsection "SSE 일관성 보장 범위" 추가.

**검증:** `pnpm tsc --noEmit`. 별도 E2E 불필요 (주석 변경만).

### Phase G: 최종 통합 검증 + 커밋 + push
**목표:** 전체 품질 게이트 통과 + 커밋 분리 + main push (P0).

**명령 시퀀스:**
```
pnpm tsc --noEmit
pnpm lint
pnpm --filter backend run test
pnpm --filter backend run test:e2e
pnpm --filter frontend run test
```

**커밋 전략:** phase별 분리
- commit 1: `fix(frontend): 74차 — FORM_TEMPLATE_NOT_FOUND blob 에러 파싱 + 에러 코드 매핑 + 토스트 분기` (Phase B)
- commit 2: `test(backend): 74차 — calibration-plans e2e TEST_YEAR worker 격리` (Phase C)
- commit 3: `refactor(backend): 74차 — checkouts detail cache regex JSON-order 무관 통일` (Phase D)
- commit 4: `docs(backend): 74차 — 스케줄러 emit 정책 + SSE 일관성 범위 문서화` (Phase E + F)
- commit 5: `refactor(frontend): 74차 — calibration-plans E2E helper casVersion fallback 제거` (Phase A)

**Push (P0):** `git push origin main` (pre-push hook 자동 검증).

## 전체 변경 파일 요약

### 수정
| 파일 | 변경 의도 | Phase |
|------|----------|-------|
| `apps/frontend/lib/api/utils/download-file.ts` | Blob 에러 본문 JSON 파싱 추가 | B |
| `apps/frontend/lib/errors/equipment-errors.ts` | FORM_TEMPLATE_NOT_FOUND 코드/메시지/매핑 추가 | B |
| `apps/frontend/components/shared/ExportFormButton.tsx` | 코드별 토스트 분기 | B |
| `apps/frontend/components/shared/__tests__/ExportFormButton.test.tsx` | Blob 404 분기 테스트 | B |
| `apps/frontend/tests/e2e/shared/helpers/approval-helpers.ts` | casVersion-only helper로 단순화 | A |
| `apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts` | extractCasVersion 단순화 | A |
| `apps/backend/test/calibration-plans.e2e-spec.ts` | JEST_WORKER_ID + randomInt 기반 TEST_YEAR | C |
| `apps/backend/src/common/cache/cache-invalidation.helper.ts` | checkouts detail regex 통일 + 주석 | D |
| `apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts` | regex JSON-order 보증 테스트 (optional) | D |
| `apps/backend/src/modules/notifications/schedulers/import-orphan-scheduler.ts` | fire-and-forget 주석 | E |
| `apps/backend/src/modules/notifications/schedulers/intermediate-check-scheduler.ts` | fire-and-forget 주석 (3곳) | E |
| `apps/backend/src/modules/notifications/schedulers/checkout-overdue-scheduler.ts` | fire-and-forget 주석 | E |
| `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts` | fire-and-forget 주석 | E |
| `apps/backend/src/modules/notifications/listeners/notification-event-listener.ts` | sync 콜백 의도 주석 | F |
| `apps/backend/src/modules/notifications/services/notification-dispatcher.ts` | SSE 보장 범위 주석 | F |
| `docs/references/backend-patterns.md` | Event Emission + SSE 정책 섹션 | E, F |

## 의사결정 로그

1. **casVersion 감사 결과 "수정 불필요" 판정 (Phase A 축소)** — 정찰 결과 SSOT 엄격 준수. 과도한 리팩토링 회피.
2. **FORM_TEMPLATE_NOT_FOUND UX는 3단 계층 수정 필요** — Blob responseType + 누락된 매핑 + generic toast의 3중 실패.
3. **TEST_YEAR: process.pid보다 JEST_WORKER_ID + randomInt 선호** — JEST_WORKER_ID 공식 + randomInt 추가 격리.
4. **공용 cache helper 추출 보류** — 임계치 "≥3" 미충족, 과도한 추상화 회피.
5. **스케줄러 `emit` 그대로 유지 + 문서화만** — NotificationEventListener sync 콜백, 동작 무변화.
6. **SSE는 코드 변경 0, 주석만** — 73차 변경 영향 없음을 실측 확인.
7. **커밋 분리 전략** — Phase별 5개 커밋, Push는 phase G 마지막에 1회.
