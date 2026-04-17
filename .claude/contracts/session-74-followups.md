# 스프린트 계약: 74차 세션 follow-up

## 생성 시점
2026-04-17T00:00:00+09:00

## Slug
session-74-followups

## 범위
73차 핸드오프 `2026-04-17-next-session-handoff.md`의 P0/P1/P2 7개 항목:
- P0: 73차 3건 + 74차 5건 unpushed 커밋 push
- P1.1: calibration-plans casVersion/version 감사
- P1.2: FORM_TEMPLATE_NOT_FOUND 프론트엔드 UX
- P1.3: TEST_YEAR collision 장기 해결
- P2.1: 캐시 정규식 감사 + (선택적) 공용 헬퍼 추출
- P2.2: 스케줄러 emit 정책 문서화
- P2.3: SSE 리프레시 코드 레벨 검증

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

**전체 품질 게이트:**
- [ ] M-1: `pnpm tsc --noEmit` 전체 exit 0 (backend + frontend + packages)
- [ ] M-2: `pnpm lint` 에러 0건
- [ ] M-3: `pnpm --filter backend run test` 전체 PASS (≥ 677 tests, 50+ suites)
- [ ] M-4: `pnpm --filter backend run test:e2e` 전체 PASS (≥ 286 tests, 22 suites, 1 skipped 허용)
- [ ] M-5: `pnpm --filter frontend run test` 회귀 없음
- [ ] M-6: `git status` clean (모든 변경 커밋됨)
- [ ] M-7: 브랜치는 main, 새 브랜치 생성 없음
- [ ] M-8: 코드 전체에 신규 `any` 타입 0건 (기존 any 증가 금지)
- [ ] M-9: 하드코딩된 enum/status/permission 없음 (packages/schemas, shared-constants 경유)

**P0 — Push:**
- [ ] M-P0: `git log origin/main..HEAD` 비어 있음 (모든 커밋 push 완료)

**P1.1 — calibration-plans 감사:**
- [ ] M-P1.1-a: 모듈 내 `casVersion` 사용처가 CAS 경로에만 등장, `version`은 revision 경로에만 등장.
- [ ] M-P1.1-b: 프론트엔드 `apps/frontend/lib/api/calibration-plans-api.ts` DTO 전수 `casVersion` 사용 (version 혼용 없음).
- [ ] M-P1.1-c: E2E helper의 `data.casVersion ?? data.version` fallback 제거 또는 정당화 주석 추가.

**P1.2 — Blob 다운로드 에러 범용 처리 (개정 v2: 아키텍처 레벨 인터셉터):**
- [ ] M-P1.2-a: 3개 axios 클라이언트(`api-client.ts`, `server-api-client.ts`, `authenticated-client-provider.tsx`) 인터셉터가 **`parseBlobErrorData` 공용 유틸**(`lib/api/utils/response-transformers.ts`)로 Blob responseType의 non-2xx 응답 본문을 `createApiError` 호출 직전 JSON 객체로 치환. 실패 시 graceful degradation. — download-file.ts 내부 파싱보다 상위 계층이라 **모든** blob 다운로드 엔드포인트를 자동 커버.
- [ ] M-P1.2-b: `mapBackendErrorCode`에 `FORM_TEMPLATE_NOT_FOUND` + 다운로드 경로에 등장 가능한 다른 backend error codes 매핑 존재.
- [ ] M-P1.2-c: `EquipmentErrorCode.FORM_TEMPLATE_NOT_FOUND` 추가 + `ERROR_MESSAGES` 엔트리 (한국어).
- [ ] M-P1.2-d: **공용 `getDownloadErrorToast(error, fallback)` util** 신규 생성. `ExportFormButton` 및 다른 다운로드 버튼이 이 util을 통해 일관된 토스트 생성.
- [ ] M-P1.2-e: 단위 테스트 ≥ 2개: (1) `download-file.ts` blob 404 파싱 경로, (2) `getDownloadErrorToast` 코드별 분기.
- [ ] M-P1.2-f: 다른 blob 다운로드 버튼 존재 시 동일 util로 마이그레이션 (혹은 tech-debt-tracker 등록).

**P1.3 — TEST_YEAR (개정: 공용 헬퍼 추출):**
- [ ] M-P1.3-a: `apps/backend/test/helpers/test-isolation.ts`에 `getWorkerUniqueYear({ minYear, maxYear, headroom })` 공용 헬퍼 신규 생성. JEST_WORKER_ID + crypto.randomInt 조합.
- [ ] M-P1.3-b: 헬퍼 단위 테스트 존재 (`test-isolation.spec.ts`): worker 1~4 격리, headroom 보장, 경계값 검증.
- [ ] M-P1.3-c: `calibration-plans.e2e-spec.ts`가 헬퍼 사용. 모든 파생 연도가 schema 허용 범위 내.
- [ ] M-P1.3-d: 동일 스펙 파일을 2회 연속 실행 시 PASS.
- [ ] M-P1.3-e: beforeAll DB DELETE 범위는 헬퍼 반환값 + headroom과 일관.

**P2.1 — 캐시 정규식 SSOT 추출 (개정):**
- [ ] M-P2.1-a: `apps/backend/src/common/cache/cache-patterns.ts` 신규 — `buildDetailCachePattern(prefix, idField, id)` 유틸 제공. JSDoc에 불변식 명시.
- [ ] M-P2.1-b: `invalidateEquipmentDetail` + `invalidateAfterCheckoutStatusChange` 양쪽이 이 유틸을 호출 (인라인 regex 제거).
- [ ] M-P2.1-c: `cache-patterns.spec.ts` 단위 테스트 — JSON key order 바뀌어도 매칭, 다른 ID 매칭 안됨, regex meta character 이스케이프 검증 ≥ 3 케이스.
- [ ] M-P2.1-d: 다른 `deleteByPattern` 사용처는 모두 glob suffix 형태(`prefix:*`)로 JSON-key-order 무관임을 evaluator 리포트에 감사 결과로 명시.

**P2.2 — 스케줄러 문서화:**
- [ ] M-P2.2-a: 4개 스케줄러의 `emit` 호출 6곳 모두 fire-and-forget 의도를 설명하는 인라인 주석 존재.
- [ ] M-P2.2-b: 스케줄러 동작(emit/emitAsync) 자체는 변경 없음.

**P2.3 — SSE 검증:**
- [ ] M-P2.3-a: `notification-event-listener.ts:26`에 sync 콜백 의도 + SSE read-after-write 비보장 주석 추가.
- [ ] M-P2.3-b: 73차 변경이 SSE 타이밍에 영향 없음을 evaluator 리포트에서 실측 확인.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록

- [ ] S-1: `docs/references/backend-patterns.md`에 "Event Emission: emit vs emitAsync" 및 "SSE 일관성 보장 범위" 섹션 추가.
- [ ] S-2: 공용 cache helper(`invalidateDetailCache(prefix, idField, id)`) 추출 — 3번째 사용처 등장 시.
- [ ] S-3: ExportFormButton 테스트에 Blob 200(정상) 경로도 회귀 방지 테스트.
- [ ] S-4: TEST_YEAR 유사 패턴이 다른 e2e spec에 있는지 간단 감사.
- [ ] S-5: E2E helper fallback 정리의 범용성 트레이드오프 평가.

### 커밋 규율

- [ ] C-1: 커밋 메시지 한국어 + `fix|feat|refactor|test|docs(scope): N차 — 내용` 형식.
- [ ] C-2: Phase별 커밋 분리 (최소 4개 커밋 권장).
- [ ] C-3: 모든 커밋이 pre-commit(gitleaks) 통과.
- [ ] C-4: 마지막 단계에서 `git push origin main`이 pre-push hook(tsc + test) 통과.

### 적용 verify 스킬

- `verify-cas` (calibration-plans audit)
- `verify-frontend-state` (ExportFormButton + error mapping)
- `verify-ssot` (error code enum / i18n)
- `verify-e2e` (TEST_YEAR 격리)
- `verify-workflows` (schedulers)

## 종료 조건

- 필수 기준 전체 PASS → Evaluator PASS 보고 → 완료.
- 동일 이슈 2회 연속 FAIL → 설계 재검토 (Planner 재진입).
- 3회 반복 초과 → 수동 개입 요청.
- P0(push) 실패는 pre-push hook 실패 원인 분석 후 재시도.

## 참고 파일

### 프로덕션 코드
- `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts`
- `apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts`
- `apps/backend/src/modules/calibration-plans/dto/update-calibration-plan.dto.ts`
- `apps/backend/src/modules/reports/form-template.service.ts`
- `apps/backend/src/common/cache/cache-invalidation.helper.ts`
- `apps/backend/src/modules/notifications/listeners/notification-event-listener.ts`
- `apps/backend/src/modules/notifications/services/notification-dispatcher.ts`
- `apps/backend/src/modules/notifications/schedulers/import-orphan-scheduler.ts`
- `apps/backend/src/modules/notifications/schedulers/intermediate-check-scheduler.ts`
- `apps/backend/src/modules/notifications/schedulers/checkout-overdue-scheduler.ts`
- `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts`
- `apps/frontend/lib/api/utils/download-file.ts`
- `apps/frontend/lib/errors/equipment-errors.ts`
- `apps/frontend/lib/api/calibration-plans-api.ts`
- `apps/frontend/components/shared/ExportFormButton.tsx`

### 테스트
- `apps/backend/test/calibration-plans.e2e-spec.ts`
- `apps/frontend/tests/e2e/shared/helpers/approval-helpers.ts`
- `apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts`

### 스키마
- `packages/db/src/schema/calibration-plans.ts` (SSOT: casVersion + version)
- `packages/schemas/src/errors.ts` (FormTemplateNotFound)

### 문서
- `docs/references/backend-patterns.md`
- `docs/references/cas-patterns.md`
