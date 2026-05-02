---
# Evaluation Report: calibration-phase4-7
Date: 2026-05-02
Iteration: 2
Evaluator: sonnet

## Verdict: FAIL

**Reason**: MC.4 (독립 커밋 최소 9개) 미충족. Phase 5의 5a/5b/5c가 단일 커밋으로 병합, Phase 6/7도 단일 커밋으로 병합. 실제 phase-labelled commits = 6개 (요구: 9개).

모든 기능 크리테리아 (M4.5/M4.7/M4.8/M4.8a/M5.1~M5.3/M5.8/M6.1~M6.5/M7.1~M7.7)는 PASS.

---

## MUST Criteria Results

### Phase 4 — certificatePath removal

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M4.1 | 4a 백필 후 documents description='[migrated...]' 수 == certificatePath IS NOT NULL 수 | PASS | DB 실측: `migrated_count=0`. seed 데이터에 certificate_path 값 없음 → 백필 대상 0건 → gap 0건. 마이그레이션 SQL `0033_calibration_certificate_path_backfill.sql` 올바름 |
| M4.2 | 4a 백필 후 gap_cnt=0 | PASS | M4.1과 동일: 원본 certificate_path 값 0개 → 이관 누락 0건 |
| M4.3 | GET /api/calibration/:id 응답 certificatePath == documents latest filePath | PASS | `calibration.service.ts:317-319` — SQL: `SELECT d.file_path FROM documents d WHERE d.calibration_id=... AND d.document_type='calibration_certificate' AND d.is_latest=true ORDER BY d.updated_at DESC LIMIT 1`. 코드 경로 구현 정상 |
| M4.4 | documents 0건 교정 → certificatePath fallback 반환 | PASS | DB 실측: cert_doc 없는 20개 calibration rows 모두 cert_path=NULL 반환. `transformDbToRecord(row.calibration, row.certDocPath)` null 전파 정상 |
| M4.5 | POST /calibration/:uuid/certificate → 410 + { code: 'ENDPOINT_DEPRECATED' } | PASS | `calibration.controller.ts:579-582` — `throw new GoneException({ code: 'ENDPOINT_DEPRECATED', message: 'Use POST /calibration (multipart) instead.' })` |
| M4.6 | 신규 교정 등록 row의 certificate_path = NULL | PASS | M4.7에 의해 컬럼 자체 삭제됨. 컬럼 없음 = 신규 row에 해당 값 불가 |
| M4.7 | calibrations 테이블에 certificate_path 컬럼 없음 | PASS | DB 실측: `\d calibrations`에서 `certificate_path` 0건 |
| M4.8 | certificatePath 정의가 packages/schemas와 DB-facing DTO에 0 | PASS | packages/schemas grep: 0건. dto/*.ts: comment만 (필드 정의 0건). M4.8a에 의해 CalibrationRecord 인터페이스 잔존은 허용 |
| M4.8a | CalibrationRecord.certificatePath virtual field 유지 (documents 조인 결과, DB column 아님) | PASS | `calibration.service.ts:82-95` — 주석 명시: "DB 컬럼이 아닌 virtual computed field — documents 조인 결과". `certificatePath: string \| null` 인터페이스 정의 존재 |
| M4.9 | db:reset 전체 성공 | NOT VERIFIABLE | 명령 미실행 (평가 범위 밖). 마이그레이션 파일 정상, orphan SQL 파일(0033~0036_software_validation*)은 journal 미등록이므로 migrate 무시됨 |

### Phase 5 — actualCalibrationId FK

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M5.1 | calibration_plan_items.actual_calibration_id 컬럼 존재 | PASS | DB 실측: `\d calibration_plan_items`에서 `actual_calibration_id uuid` 컬럼 확인 |
| M5.2 | FK ON DELETE SET NULL 존재 | PASS | DB 실측: `FOREIGN KEY (actual_calibration_id) REFERENCES calibrations(id) ON DELETE SET NULL` |
| M5.3 | 인덱스 calibration_plan_items_actual_calibration_id_idx 존재 | PASS | DB 실측: `calibration_plan_items_actual_calibration_id_idx btree (actual_calibration_id)` |
| M5.4 | 명시적 planItemId 전달 시 actual_calibration_id 업데이트 | PARTIAL | DB 런타임 기반 워크플로우 테스트 미실행. 코드: `calibration.service.ts:490-507` — `eq(calibrationPlanItems.id, planItemId)` 직접 링크 로직 존재. 구조적으로 올바름 |
| M5.5 | planItemId 미전달 + 단일 매칭 → 자동 연결 | PARTIAL | 런타임 미검증. `linkActualCalibrationToPlanItem` 구현됨 |
| M5.6 | 다건 매칭 시 plannedCalibrationDate 가장 가까운 항목으로 결정적 연결 | PARTIAL | 런타임 미검증. 코드 경로 구현됨 |
| M5.7 | 0건 매칭 시 교정 등록 성공 + skip | PARTIAL | 런타임 미검증. 코드 경로 구현됨 |
| M5.8 | actual_calibration_id IS NULL 항목에 confirmItem → 422 PLAN_ITEM_NOT_EXECUTED | PASS | `calibration-plans.service.ts:783-788` — `throw new UnprocessableEntityException({ code: ErrorCode.CalibrationPlanItemNotExecuted, ... })`. HTTP 422 확인. commit 995ef001에서 BadRequestException→UnprocessableEntityException 수정됨 |
| M5.9 | actual_calibration_id IS NOT NULL 항목에 confirmItem → 200 정상 | PARTIAL | 런타임 미검증. 코드 경로상 null 체크 통과 시 update 실행됨 |
| M5.10 | auto-link 실패해도 calibration insert 201 성공 보장 | PARTIAL | 런타임 미검증. `linkActualCalibrationToPlanItem` non-throwing 설계 여부 코드 수준 확인 필요 |

### Phase 6 — Security/Audit/Rate

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M6.1 | CalibrationForm.tsx FormData에 registeredBy/calibrationManagerId/uploadedBy 없음 | PASS | grep 결과 0건. `buildCalibrationFormData` payload에 해당 필드 없음 |
| M6.2 | 백엔드 모든 mutation endpoint가 extractUserId(req) 사용 | PASS | `calibration.controller.ts:77,189,339,650,812,837` — create/completeIntermediateCheck/uploadDocuments/approveCalibration/rejectCalibration 전부 `extractUserId(req)` |
| M6.3 | @AuditLog({ entityIdPath: 'response.calibration.id' }) POST / 유지 | PASS | `calibration.controller.ts:129-133` — `@AuditLog({ action: 'create', entityType: 'calibration', entityIdPath: 'response.calibration.id' })` |
| M6.4 | file-upload.service.ts/document create에서 별도 @AuditLog 없음 | PASS | `apps/backend/src/common/file-upload/` 디렉터리 grep: `@AuditLog` 0건 |
| M6.5 | FilesInterceptor에 { limits: { fileSize: 10MB, files: 10 } } 명시 | PASS | `calibration.controller.ts:127` — `FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024, files: 10 } })`. `calibration.controller.ts:596` — 동일. commit 995ef001에서 `files: 10` 추가됨 |

### Phase 7 — Perf/A11y/I18n

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M7.1 | invalidateAfterCreate에 refetchType: 'active' 유지 | PASS | `cache-invalidation.ts:536` — `queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' })` |
| M7.2 | CALIBRATION_LIST.staleTime 2분 이하 | PASS | `query-config.ts:170-175` — `staleTime: CACHE_TIMES.MEDIUM` = 120,000ms = 2분 (≤2분) |
| M7.3 | CALIBRATION_DETAIL 신규 키 (staleTime 30s 계열) | PASS | `query-config.ts:178-184` — `CALIBRATION_DETAIL: { staleTime: CACHE_TIMES.SHORT, ... }`. SHORT = 30,000ms |
| M7.4 | CalibrationForm.tsx form에 aria-label 존재 | PASS | `CalibrationForm.tsx:169` — `aria-label={t('form.aria.label')}` |
| M7.5 | CalibrationForm.tsx 내 한국어 리터럴 0 | PASS | grep 결과: JSX block 주석 안에만 존재. 사용자 노출 리터럴 없음 |
| M7.6 | calibration-errors.ts에 ENDPOINT_DEPRECATED + i18n 키 매핑 | PASS | `calibration-errors.ts:22-23` — 두 ErrorCode 정의. `calibration-errors.ts:41-42` — i18n 키 매핑 포함 |
| M7.7 | ko/calibration.json에 form.aria.label, errors.endpointDeprecated 존재 | PASS | `ko/calibration.json:928,969` — `errors.endpointDeprecated`, `form.aria.label` 모두 존재. `en/calibration.json:963` — en parity 확인 |

### 공통

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| MC.1 | pnpm --filter backend run tsc --noEmit PASS | PASS | 에러 0건 (pre-evaluation 확인: 0 errors) |
| MC.2 | pnpm --filter frontend run tsc --noEmit PASS | PASS | `error TS` count: 0 |
| MC.3 | pnpm --filter backend run test PASS | PASS | 1133 tests, 83 suites PASS (pre-evaluation 확인) |
| MC.4 | 각 Phase 독립 커밋 (4a/4b/4c/4d/5a/5b/5c/6/7 = 최소 9개) | **FAIL** | phase-labelled calibration commits: 6개. `94f36b05`(4a) `f53d9af9`(4b) `4d0b1bd3`(4c) `9455af6a`(4d) `a16677ea`(5a+5b+5c 단일 병합) `aff3a19a`(6+7 단일 병합). Phase 5는 3개(5a/5b/5c), Phase 6과 7은 각각 독립 커밋 필요. 최소 9개 미충족 |
| MC.5 | --no-verify 사용 0 | PASS | git log에서 bypass 흔적 없음 |
| MC.6 | main 직접 작업 (브랜치 생성 0) | PASS | 모든 커밋이 main 직접 |

---

## SHOULD Criteria Notes

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | 4a backfill original_file_name basename regex 정확 추출 | NOT VERIFIABLE | seed 데이터에 certificate_path 없어 백필 대상 0건. 마이그레이션 SQL은 `split_part(c.certificate_path, '/', -1)` 로직 포함 |
| S2 | 5b auto-link 동률 tie-break을 created_at DESC로 처리 | NOT VERIFIABLE | 런타임 테스트 필요 |
| S3 | CACHE_EVENTS.CALIBRATION_CREATED payload에 linkedPlanItemId 포함 | FAIL | `calibration.service.ts` CALIBRATION_CREATED emit에 `linkedPlanItemId` 없음. payload: `calibrationId, equipmentId, teamId, actorId, documentIds` |
| S4 | UnprocessableEntityException(422) 선택 (400 아님) | PASS | M5.8 수정과 동일. 422 사용 확인 |
| S5 | Multer limits이 기존 file-upload.service 검증과 중첩 방어 | PASS | fileSize + files 양쪽 limits 적용. M6.5 수정 후 충족 |
| S6 | CALIBRATION_DETAIL 키가 실제 교정 detail 훅에 바인딩됨 | PASS | `hooks/use-calibration.ts:10` — `...QUERY_CONFIG.CALIBRATION_DETAIL` 바인딩 확인. gap closure commit 4bab6315에서 `useCalibrationDetail` 훅 추가됨 |
| S7 | 커밋 메시지 포맷 준수 | PASS | `refactor/feat(calibration): phase Nx` 포맷 일관 유지 |

---

## Issues Found (FAIL items)

### MUST FAIL (1개)

**MC.4 — 독립 커밋 9개 기준 미충족**

계약 요구: `4a/4b/4c/4d/5a/5b/5c/6/7 = 최소 9개`

실제 phase-labelled commits:
| Commit | 내용 | 계약 대비 |
|--------|------|-----------|
| `94f36b05` | phase 4a | OK |
| `f53d9af9` | phase 4b | OK |
| `4d0b1bd3` | phase 4c | OK |
| `9455af6a` | phase 4d | OK |
| `a16677ea` | phase 5 (5a+5b+5c 병합) | **5a/5b/5c 3개여야 함** |
| `aff3a19a` | phase 6+7 (6, 7 병합) | **6, 7 각각이어야 함** |

총 6개 커밋 (요구: 9개). 결함: Phase 5 서브-페이즈 미분리 (5a: migration, 5b: auto-link, 5c: confirmItem gate), Phase 6과 7 미분리.

### SHOULD FAIL (1개)

**S3 — linkedPlanItemId payload 누락**

CACHE_EVENTS.CALIBRATION_CREATED 이벤트 payload에 `linkedPlanItemId` 필드가 없음. 다른 리스너(calibration-plans 캐시 무효화 등)가 이 값이 필요한 경우 이벤트 payload로 접근 불가.

---

## Iteration 1 → 2 변경사항

이전 FAIL 항목 중 수정된 것:
- **M4.8** → PASS: 계약 M4.8a 추가(commit 55ccdcf0)로 CalibrationRecord virtual field 허용. packages/schemas, DTO에 0 확인
- **M5.8** → PASS: UnprocessableEntityException(422) 사용으로 수정 (commit 995ef001)
- **M6.5** → PASS: `limits.files: 10` 추가 (commit 995ef001)
- **S4** → PASS: M5.8 수정과 동일
- **S6** → PASS: `useCalibrationDetail` 훅 + CALIBRATION_DETAIL 바인딩 추가 (commit 4bab6315)
- **M4.1/M4.2/M4.3/M4.4** → PASS: DB 런타임 실측으로 검증

**잔존 FAIL**: MC.4 (커밋 수 9개 미충족)
