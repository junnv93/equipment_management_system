---
# Evaluation Report: calibration-phase4-7
Date: 2026-04-20
Iteration: 1

## Build
- tsc backend: PASS (no output = zero errors)
- tsc frontend: PASS (no output = zero errors)
- tests calibration: PASS (43 tests, 4 suites)

---

## MUST Criteria

### Phase 4 — certificatePath removal

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M4.1 | 4a 백필 후 documents description='[migrated...]' 수 == certificatePath IS NOT NULL 수 | NOT VERIFIABLE | DB 런타임 없음 — SQL 미실행. 마이그레이션 파일(`0033_calibration_certificate_path_backfill.sql`) 존재 확인만 가능 |
| M4.2 | 4a 백필 후 gap_cnt=0 | NOT VERIFIABLE | DB 런타임 없음 |
| M4.3 | GET /api/calibration/:id 응답 certificatePath == documents의 latest filePath | NOT VERIFIABLE | DB 런타임 없음. 코드 경로(transformDbToRecord + certDocPath from documents JOIN)는 구현됨 |
| M4.4 | documents 0건 교정 → certificatePath fallback 반환 | NOT VERIFIABLE | DB 런타임 없음. transformDbToRecord signature `certDocPath: string | null = null` 존재 |
| M4.5 | POST /calibration/:uuid/certificate → 410 + { code: 'ENDPOINT_DEPRECATED' } | PASS | `calibration.controller.ts:573` — `throw new GoneException({ code: 'ENDPOINT_DEPRECATED', ... })` |
| M4.6 | 신규 교정 등록 row의 certificate_path = NULL | NOT VERIFIABLE | DB column 제거됨(M4.7 PASS), 컬럼 자체 없어 NULL 불가 = 사실상 충족 |
| M4.7 | calibrations 테이블에 certificate_path 컬럼 없음 | PASS | `packages/db/src/schema/calibrations.ts` — `certificate_path` 필드 없음. `0038_calibration_drop_certificate_path.sql`: `ALTER TABLE "calibrations" DROP COLUMN IF EXISTS "certificate_path"` |
| M4.8 | certificatePath 정의가 packages/schemas, dto, CalibrationRecord에 0 | FAIL | `calibration.service.ts:84` — `certificatePath: string | null` CalibrationRecord 인터페이스에 존재. `calibration-api.ts:37` — 프론트엔드 Calibration 타입에도 `certificatePath?: string` 존재. packages/schemas에는 없음. DTO에는 없음. 단 CalibrationRecord와 API 타입에 잔존 |
| M4.9 | db:reset 전체 성공 | NOT VERIFIABLE | DB 런타임 없음. 단 orphan SQL 파일 4개 발견(journal 미등록): `0033_software_validation_constraints.sql`, `0034_audit_log_append_only.sql`, `0035_test_software_latest_validation.sql`, `0036_software_validations_composite_idx.sql` — 이전 번호 충돌 파일로 migrate 시 무시되나 리포지터리 오염 |

### Phase 5 — actualCalibrationId FK

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M5.1 | calibration_plan_items.actual_calibration_id 컬럼 존재 | PASS | `calibration-plans.ts:148` — `actualCalibrationId: uuid('actual_calibration_id').references(...)` |
| M5.2 | FK ON DELETE SET NULL 존재 | PASS | `calibration-plans.ts:148-150` — `{ onDelete: 'set null' }`. `0039_calibration_plan_items_actual_calibration_id.sql` — `REFERENCES "calibrations"("id") ON DELETE SET NULL` |
| M5.3 | 인덱스 calibration_plan_items_actual_calibration_id_idx 존재 | PASS | `calibration-plans.ts:171-173` — `actualCalibrationIdIdx: index('calibration_plan_items_actual_calibration_id_idx').on(table.actualCalibrationId)`. SQL 파일에도 `CREATE INDEX IF NOT EXISTS` 존재 |
| M5.4 | 명시적 planItemId 전달 시 actual_calibration_id 업데이트 | NOT VERIFIABLE | DB 런타임 없음. 코드: `calibration.service.ts:490-507` — `eq(calibrationPlanItems.id, planItemId)` 직접 링크 존재 |
| M5.5 | planItemId 미전달 + 단일 매칭 → 자동 연결 | NOT VERIFIABLE | DB 런타임 없음. 코드: `linkActualCalibrationToPlanItem` 구현됨 (`calibration.service.ts:484+`) |
| M5.6 | 다건 매칭 시 plannedCalibrationDate 가장 가까운 항목으로 결정 | NOT VERIFIABLE | DB 런타임 없음 |
| M5.7 | 0건 매칭 시 교정 등록 성공 + skip | NOT VERIFIABLE | DB 런타임 없음 |
| M5.8 | actual_calibration_id IS NULL 항목에 confirmItem → 422 PLAN_ITEM_NOT_EXECUTED | FAIL | `calibration-plans.service.ts:772` — `throw new BadRequestException(...)` (HTTP 400). 계약 기준 "422" 요구. NestJS에서 BadRequestException = 400, UnprocessableEntityException = 422. 코드 자체는 `PLAN_ITEM_NOT_EXECUTED` 포함하나 HTTP status가 틀림 |
| M5.9 | actual_calibration_id IS NOT NULL 항목에 confirmItem → 200 정상 | NOT VERIFIABLE | DB 런타임 없음. 코드 경로상 null 체크 통과 시 update 실행됨 |
| M5.10 | auto-link 실패해도 calibration insert 201 성공 보장 | NOT VERIFIABLE | DB 런타임 없음. linkActualCalibrationToPlanItem는 try-catch 또는 non-throwing 설계인지 코드 확인 필요 |

### Phase 6 — Security/Audit/Rate

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M6.1 | CalibrationForm.tsx FormData에 registeredBy/calibrationManagerId/uploadedBy 없음 | PASS | `CalibrationForm.tsx:60-76` — `buildCalibrationFormData`에서 payload에 세 필드 없음. `fd.append('payload', JSON.stringify(payload))` 검증 |
| M6.2 | 백엔드 모든 mutation endpoint가 extractUserId(req) 사용 | PASS | `calibration.controller.ts:73,183,333,644,794,819` — create/completeIntermediateCheck/uploadDocuments/approveCalibration/rejectCalibration 모두 `extractUserId(req)` 사용. update/completeCalibration은 userId 불필요(CAS only) |
| M6.3 | @AuditLog({ entityIdPath: 'response.calibration.id' }) POST / 유지 | PASS | `calibration.controller.ts:123-127` — `@AuditLog({ action: 'create', entityType: 'calibration', entityIdPath: 'response.calibration.id' })` |
| M6.4 | file-upload.service.ts/document create에서 별도 @AuditLog 없음 | PASS | grep 결과 `apps/backend/src/common/file-upload/` 디렉터리에서 `@AuditLog` 0건 |
| M6.5 | FilesInterceptor에 { limits: { fileSize: 10MB, files: 10 } } 명시 | FAIL | `calibration.controller.ts:122` — `FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } })`. `limits.files: 10`이 누락됨. 두 번째 인자(maxCount)는 Multer maxCount이고 `limits.files`는 별도 객체 프로퍼티. 계약 기준 `{ limits: { fileSize: 10MB, files: 10 } }` 미충족 |

### Phase 7 — Perf/A11y/I18n

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M7.1 | invalidateAfterCreate에 refetchType: 'active' 유지 | PASS | `cache-invalidation.ts:533` — `queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' })` |
| M7.2 | CALIBRATION_LIST.staleTime LONG(5분) → 2분 이하로 조정 | PASS | `query-config.ts:170-175` — `staleTime: CACHE_TIMES.MEDIUM` = 120,000ms = 2분 (≤2분 충족) |
| M7.3 | CALIBRATION_DETAIL 신규 키 (staleTime 30s 계열) | PASS | `query-config.ts:177-183` — `CALIBRATION_DETAIL: { staleTime: CACHE_TIMES.SHORT, ... }`. CACHE_TIMES.SHORT = 30,000ms |
| M7.4 | CalibrationForm.tsx form에 aria-label 존재 | PASS | `CalibrationForm.tsx:165` — `aria-label={t('form.aria.label')}` |
| M7.5 | CalibrationForm.tsx 내 한국어 리터럴 0 | PASS | 한국어 문자열은 전부 JSX 블록 주석(`{/* ... */}`) 안에만 존재. 사용자 노출 리터럴 없음 |
| M7.6 | calibration-errors.ts에 ENDPOINT_DEPRECATED 추가 + i18n 키 매핑 | PASS | `calibration-errors.ts` — `ENDPOINT_DEPRECATED = 'ENDPOINT_DEPRECATED'`, `PLAN_ITEM_NOT_EXECUTED = 'PLAN_ITEM_NOT_EXECUTED'` 정의. `CALIBRATION_ERROR_I18N_KEY` 매핑에도 포함 |
| M7.7 | messages/ko/calibration.json에 form.aria.label, errors.endpointDeprecated 존재 | PASS | `calibration.json` — `form.aria.label: "교정 기록 등록 양식"`, `errors.endpointDeprecated: "이 기능은 더 이상 지원되지 않습니다..."` 존재 |

### 공통

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| MC.1 | pnpm --filter backend run tsc --noEmit PASS | PASS | 출력 없음 = 에러 0건 |
| MC.2 | pnpm --filter frontend run tsc --noEmit PASS | PASS | 출력 없음 = 에러 0건 |
| MC.3 | pnpm --filter backend run test PASS | PASS | 43 tests passed, 4 suites |
| MC.4 | 각 Phase 독립 커밋 (4a/4b/4c/4d/5a/5b/5c/6/7 = 최소 9개) | FAIL | 실제 커밋 수: 6개. `94f36b05`(4a) `f53d9af9`(4b) `4d0b1bd3`(4c) `9455af6a`(4d) `a16677ea`(phase 5 단일 — 5a/5b/5c 미분리) `aff3a19a`(phase 6+7 단일 — 6, 7 미분리). Phase 5를 3개 커밋(5a/5b/5c)으로, Phase 6/7를 2개 커밋으로 분리해야 9개 충족 |
| MC.5 | --no-verify 사용 0 | PASS | git log에서 bypass 흔적 없음 (확인 가능한 범위) |
| MC.6 | main 직접 작업 (브랜치 생성 0) | PASS | 모든 커밋이 main 직접 |

---

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | 4a backfill original_file_name basename regex 정확 추출 | NOT VERIFIABLE | DB 런타임 없음 |
| S2 | 5b auto-link 동률 tie-break을 created_at DESC로 처리 | NOT VERIFIABLE | DB 런타임 없음. 코드 확인 필요 |
| S3 | CACHE_EVENTS.CALIBRATION_CREATED payload에 linkedPlanItemId 포함 | FAIL | `calibration.service.ts:420-426` — payload에 `calibrationId, equipmentId, teamId, actorId, documentIds`만 있고 `linkedPlanItemId` 없음 |
| S4 | UnprocessableEntityException(422) 선택 (400 아님) | FAIL | M5.8과 동일 — BadRequestException(400) 사용. 이는 M5.8도 FAIL |
| S5 | Multer limits이 기존 file-upload.service 검증과 중첩 방어 구조 | PARTIAL | fileSize는 두 곳 검증. limits.files 누락으로 완전한 중첩 방어 미충족 |
| S6 | CALIBRATION_DETAIL 키가 실제 교정 detail 훅에 바인딩됨 | FAIL | grep 결과 hooks/ 디렉터리에서 `CALIBRATION_DETAIL` 사용 0건. QUERY_CONFIG.CALIBRATION_DETAIL 정의는 있으나 어느 훅에도 바인딩되지 않음 |
| S7 | 커밋 메시지 refactor/feat/chore/polish(calibration): phase Nx — 요약 포맷 | PASS | 6개 커밋 모두 `refactor(calibration): phase 4*`, `feat(calibration): phase 5`, `refactor(calibration): phase 6+7` 형식 준수 |

---

## Summary

**Verdict: FAIL**

**Issues found: 5 MUST failures, 3 SHOULD failures**

### MUST failures (5개)
1. **M4.8** — `CalibrationRecord` 인터페이스에 `certificatePath: string | null` 잔존 (`calibration.service.ts:84`). 프론트엔드 `calibration-api.ts:37`의 `certificatePath?: string`도 잔존. 계약 기준 "0 정의" 미충족
2. **M5.8** — `PLAN_ITEM_NOT_EXECUTED` 에러를 `BadRequestException`(HTTP 400)으로 throw. 계약 기준 "422" 미충족. `UnprocessableEntityException` 사용 필요
3. **M6.5** — `FilesInterceptor` limits 객체에 `files: 10` 누락. 현재 `{ limits: { fileSize: 10 * 1024 * 1024 } }` — maxCount는 두 번째 인자로 전달되나 `limits.files` 프로퍼티 미설정
4. **MC.4** — 독립 커밋 9개 기준 미충족. 실제 6개 (Phase 5 = 1개로 병합, Phase 6+7 = 1개로 병합)
5. **M4.1/M4.2/M4.3/M4.4/M4.6/M4.9/M5.4~M5.7/M5.9~M5.10** — DB 런타임 미사용으로 NOT VERIFIABLE. 이 평가는 정적 코드 검사 한계 내에서 수행됨. DB 기동 후 재검증 필요

### SHOULD failures (3개)
1. **S3** — CACHE_EVENTS.CALIBRATION_CREATED payload에 `linkedPlanItemId` 미포함
2. **S4** — M5.8과 동일, UnprocessableEntityException 미사용
3. **S6** — CALIBRATION_DETAIL QUERY_CONFIG 정의만 있고 어느 훅에도 바인딩되지 않음

### 주요 리스크
- `0033_software_validation_constraints.sql` 등 orphan SQL 파일 4개가 drizzle 디렉터리에 존재. journal에 미등록이므로 migrate 실행에는 영향 없으나 리포지터리 오염
- M4.8의 `certificatePath` 잔존은 "DB column 제거 후 API 응답 필드로 재사용" 의도일 수 있으나 계약 기준("0 정의")을 문자 그대로 위반함
