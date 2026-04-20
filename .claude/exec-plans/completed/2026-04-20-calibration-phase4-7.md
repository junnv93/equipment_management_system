# Exec Plan: calibration-phase4-7

**Date**: 2026-04-20
**Slug**: `calibration-phase4-7`
**Mode**: 2 (DB + backend + frontend + perf/a11y/i18n)
**Status**: active
**Depends on**: Phases 0-3 (commits 2e2215b4, b06dcb17, 4d3dab23) — already merged to main

## 0. Problem & Goal

### Problem
교정 도메인 아키텍처 오버홀의 잔여 4단계(4-7)를 마무리해야 한다:

- **Phase 4**: 레거시 `calibrations.certificate_path` 컬럼을 `documents` 테이블로 이관하고 컬럼을 제거한다 (4-stage rolling: backfill → hybrid read → write-stop → drop).
- **Phase 5**: `calibration_plan_items` → `calibrations` 연결이 현재 `actualCalibrationDate` 값 복사뿐이라 확인(confirm) 게이트가 불완전하다. `actualCalibrationId` FK를 추가하고, 교정 등록 시 자동 연결하며, confirm 전 실제 교정 완료 여부를 강제한다.
- **Phase 6**: Phase 1에서 도입한 원자 multipart API의 보안/감사/레이트 검증을 완결한다 (서버측 userId 추출, AuditLog 단일 흔적, 파일 제한/MIME magic bytes 재확인 + Multer limits 명시).
- **Phase 7**: 성능(refetchType/staleTime) · 접근성(aria-label, role=alert, 키보드) · i18n(하드코딩 0, 에러코드 매핑) 마감.

### Goal
교정 등록이 단일 원자 multipart 경로(Phase 1)와 단일 프론트엔드(CalibrationForm, Phase 3)만을 통해 이루어지고, 성적서 파일은 `documents` 테이블이 유일한 저장소이며, 교정계획서 확인은 실제 교정 완료 이력과 일치할 때만 가능한 상태.

### Non-goals
- 교정 폼 UX 재설계 (mode='page'/'dialog' prop 유지)
- 교정 승인 워크플로우 변경 (기존 approve/reject 경로 보존)
- `calibration_plan_items.actualCalibrationDate` 제거 — Phase 5에서 `actualCalibrationId` 추가만 (date 컬럼 병존 유지)
- 새로운 역할/권한 추가 (Permission.CREATE_CALIBRATION 등 기존 유지)
- Redis/SSE 전환
- 문서 revision(버전 관리) 워크플로우 구현 — 4a 백필에서 isLatest=true, parentDocumentId=null만 설정

---

## 1. Pre-read Verification (완료)

| 항목 | 파일:라인 | 결과 |
|------|-----------|------|
| `calibrations.certificate_path` 컬럼 존재 | `packages/db/src/schema/calibrations.ts:56` | ✅ (nullable varchar(500)) |
| `calibration_plan_items.actualCalibrationId` **없음** | `packages/db/src/schema/calibration-plans.ts:117-169` | ✅ (`actualCalibrationDate`만 존재) |
| `transformDbToRecord` — `row.certificatePath` 직접 read | `calibration.service.ts:220` | ✅ |
| `transformDtoToInsert` — `certificatePath` write | `calibration.service.ts:267` | ✅ |
| POST `/:uuid/certificate` deprecated 엔드포인트 | `calibration.controller.ts:542-633` | ✅ |
| `@AuditLog entityIdPath: 'response.calibration.id'` | `calibration.controller.ts:122-126` | ✅ |
| `FilesInterceptor('files', 10)` | `calibration.controller.ts:121` | ✅ |
| 10MB limit + MAGIC_BYTES | `file-upload.service.ts:28,41-52,110-125` | ✅ |
| `refetchType: 'active'` | `cache-invalidation.ts:533` | ✅ |
| `CALIBRATION_LIST` staleTime = LONG(5분) | `query-config.ts:170-175` | ⚠️ 2분으로 조정 필요 |
| CalibrationForm FormData — no registeredBy 등 | `CalibrationForm.tsx:57-78` | ✅ |
| `calibration-errors.ts` SSOT 존재 | `lib/errors/calibration-errors.ts` | ✅ (ENDPOINT_DEPRECATED 추가 필요) |
| 최신 마이그레이션 번호 | `apps/backend/drizzle/meta/_journal.json` | 실행 시 확인 |
| `documents` fileHash/parentDocumentId/isLatest nullability | `packages/db/src/schema/documents.ts` | 실행 시 확인 |
| `confirmItem` 위치 | `calibration-plans.service.ts:735-782` | ✅ |

---

## 2. Changed Files

| Phase | 파일 | 성격 |
|-------|------|------|
| 4a | `apps/backend/drizzle/0032_calibration_certificate_path_backfill.sql` | 신규 (수동 SQL) |
| 4a | `apps/backend/drizzle/meta/_journal.json` | entry 추가 |
| 4b | `apps/backend/src/modules/calibration/calibration.service.ts` | `transformDbToRecord` + query LEFT JOIN |
| 4c | `apps/backend/src/modules/calibration/calibration.service.ts` | `transformDtoToInsert` + `update` — certificatePath 라인 제거 |
| 4c | `apps/backend/src/modules/calibration/calibration.controller.ts` | POST `/:uuid/certificate` → 410 Gone |
| 4c | `apps/backend/src/modules/calibration/dto/update-calibration.dto.ts` | `certificatePath` 필드 제거 |
| 4d | `packages/db/src/schema/calibrations.ts` | L56 컬럼 정의 삭제 |
| 4d | `apps/backend/drizzle/0033_calibration_drop_certificate_path.sql` | 신규 (db:generate 산출) |
| 4d | `apps/backend/drizzle/meta/_journal.json` | entry 추가 |
| 4d | `apps/backend/src/modules/calibration/calibration.service.ts` | `CalibrationRecord`에서 certificatePath 제거, fallback 제거 |
| 5a | `packages/db/src/schema/calibration-plans.ts` | `actualCalibrationId` 필드 + 인덱스 |
| 5a | `apps/backend/drizzle/0034_calibration_plan_items_actual_calibration_fk.sql` | 신규 (db:generate 산출) |
| 5a | `apps/backend/drizzle/meta/_journal.json` | entry 추가 |
| 5b | `packages/schemas/src/calibration.ts` | `createCalibrationSchema`에 optional `planItemId` 추가 |
| 5b | `apps/backend/src/modules/calibration/calibration.service.ts` | `createWithDocuments` tx 후 `linkActualCalibrationToPlanItem` 호출 + 신규 private 메서드 |
| 5b | `apps/frontend/lib/api/cache-invalidation.ts` | `calibrationPlans.all` 무효화 추가 |
| 5c | `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` | `confirmItem` — actualCalibrationId null 게이트 |
| 6 | `apps/backend/src/modules/calibration/calibration.controller.ts` | Multer limits 명시 추가 |
| 7a | `apps/frontend/lib/api/query-config.ts` | `CALIBRATION_LIST.staleTime` 조정 + `CALIBRATION_DETAIL` 신규 키 |
| 7b | `apps/frontend/components/calibration/CalibrationForm.tsx` | aria-label 확인/추가 |
| 7c | `apps/frontend/lib/errors/calibration-errors.ts` | `ENDPOINT_DEPRECATED` + i18n 키 |
| 7c | `apps/frontend/messages/ko/calibration.json` | 누락 키 추가 (`form.aria.label`, `errors.endpointDeprecated`) |

---

## 3. Phase-Based Execution

### Phase 4a — Backfill migration

**목표**: 기존 `calibrations.certificate_path IS NOT NULL`인 행을 `documents` 테이블에 중복 없이 복제.

1. `packages/db/src/schema/documents.ts` 읽어 `fileSize`, `mimeType`, `uploadedBy` nullable 여부 확인
2. 다음 수동 SQL 파일 작성: `apps/backend/drizzle/0032_calibration_certificate_path_backfill.sql`
   ```sql
   INSERT INTO documents (
     calibration_id, document_type, description,
     file_path, file_name, original_file_name,
     file_size, mime_type, file_hash,
     uploaded_by, is_latest, parent_document_id,
     created_at, updated_at
   )
   SELECT
     c.id,
     'calibration_certificate',
     '[migrated from calibrations.certificate_path]',
     c.certificate_path,
     regexp_replace(c.certificate_path, '^.*/', ''),
     regexp_replace(c.certificate_path, '^.*/', ''),
     0,
     'application/octet-stream',
     NULL,
     NULL,
     true,
     NULL,
     c.created_at,
     NOW()
   FROM calibrations c
   WHERE c.certificate_path IS NOT NULL
     AND c.certificate_path <> ''
     AND NOT EXISTS (
       SELECT 1 FROM documents d
       WHERE d.calibration_id = c.id
         AND d.document_type = 'calibration_certificate'
     );
   ```
   - NOT NULL 제약이 있는 컬럼(file_size, mime_type)은 기본값 사용; uploaded_by nullable 미확인 시 schema 먼저 확인
3. `_journal.json`에 0032 entry 수동 추가
4. `pnpm --filter backend run db:migrate` 적용

**검증**:
```bash
pnpm --filter backend run db:migrate
docker compose exec postgres psql -U postgres -d equipment_management -c "
  SELECT
    (SELECT COUNT(*) FROM calibrations WHERE certificate_path IS NOT NULL) AS source_cnt,
    (SELECT COUNT(*) FROM documents WHERE document_type='calibration_certificate'
       AND description='[migrated from calibrations.certificate_path]') AS migrated_cnt,
    (SELECT COUNT(*) FROM calibrations c
       WHERE c.certificate_path IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM documents d
                       WHERE d.calibration_id=c.id
                         AND d.document_type='calibration_certificate')) AS gap_cnt;"
# → source_cnt == migrated_cnt, gap_cnt == 0
```

**커밋**: `refactor(calibration): phase 4a — backfill certificatePath to documents`

---

### Phase 4b — Hybrid read

**목표**: 응답 경로에서 documents 테이블 우선 읽기, 없으면 calibrations.certificate_path fallback.

1. `calibration.service.ts`의 단건/목록 query를 확장:
   - `findOne`에서 calibration id로 documents의 `calibration_certificate + is_latest=true`를 correlated subquery로 읽음 (Drizzle sql template)
   - 예: `certDocPath: sql<string | null>\`(SELECT d.file_path FROM documents d WHERE d.calibration_id=${schema.calibrations.id} AND d.document_type='calibration_certificate' AND d.is_latest=true ORDER BY d.updated_at DESC LIMIT 1)\``
2. `transformDbToRecord(row, certDocPath?)` 시그니처 확장:
   - `certificatePath: certDocPath ?? row.certificatePath`
3. 목록 조회 전부 동일 패턴 적용 (findAll, findPendingApprovals, findAllIntermediateChecks, findUpcomingIntermediateChecks)

**검증**:
- `pnpm --filter backend run tsc --noEmit`
- `pnpm --filter backend run test`
- 수동: `GET /api/calibration/:id` 응답 `certificatePath`가 백필된 문서 filePath와 일치

**커밋**: `refactor(calibration): phase 4b — hybrid read certificatePath from documents`

---

### Phase 4c — Write stop + deprecated endpoint 410

**목표**: 신규 기록은 `certificate_path`에 쓰지 않음. 레거시 엔드포인트 410.

1. `calibration.service.ts`:
   - `transformDtoToInsert`의 `certificatePath:` 라인 삭제
   - `update()` 내 `certificatePath` 분기 삭제
2. `dto/update-calibration.dto.ts`: `certificatePath` 필드/Zod 제거
3. `calibration.controller.ts` POST `/:uuid/certificate` handler 교체:
   ```ts
   this.logger.warn(`Deprecated endpoint called: POST /calibration/${uuid}/certificate`);
   throw new GoneException({
     code: 'ENDPOINT_DEPRECATED',
     message: 'Use POST /calibration (multipart) instead.',
   });
   ```
   - 기존 FileInterceptor/UploadedFile/saveFile 호출 모두 제거

**검증**:
- `pnpm tsc --noEmit` (backend + frontend + packages)
- `curl -X POST /api/calibration/:uuid/certificate` → 410
- 신규 교정 등록 후 `SELECT certificate_path FROM calibrations WHERE id=<new>` → NULL

**커밋**: `refactor(calibration): phase 4c — write-stop certificatePath + deprecated POST /certificate returns 410`

---

### Phase 4d — Column drop

**목표**: `calibrations.certificate_path` 컬럼 및 코드 흔적 완전 제거.

1. `packages/db/src/schema/calibrations.ts` L56 컬럼 정의 삭제
2. `pnpm --filter backend run db:generate` → 0033_.sql 생성, rename → `0033_calibration_drop_certificate_path.sql`
3. `CalibrationRecord` 인터페이스에서 `certificatePath` 제거
4. `transformDbToRecord`에서 `row.certificatePath` 제거 → `certDocPath ?? null` (fallback 제거)
5. 전체 grep 확인:
   ```bash
   grep -rn "certificatePath\|certificate_path" apps/backend/src apps/frontend/lib packages/schemas
   # → 0 결과 기대 (documents 경로는 OK)
   ```
6. `pnpm --filter backend run db:migrate` + `pnpm --filter backend run db:reset`

**검증**:
```bash
pnpm --filter backend run db:reset
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
docker compose exec postgres psql -U postgres -d equipment_management -c "\d calibrations" | grep -c certificate_path
# → 0
```

**커밋**: `refactor(calibration): phase 4d — drop certificatePath column (documents is SSOT)`

---

### Phase 5a — Schema: actualCalibrationId FK

**목표**: `calibration_plan_items`에 실제 교정 기록 FK 추가.

1. `packages/db/src/schema/calibration-plans.ts`:
   - `calibrations` import 추가 (circular dependency 여부 확인)
   - `calibrationPlanItems` 테이블에 필드 추가:
     ```ts
     actualCalibrationId: uuid('actual_calibration_id').references(() => calibrations.id, {
       onDelete: 'set null',
     }),
     ```
   - 인덱스 추가:
     ```ts
     actualCalibrationIdIdx: index('calibration_plan_items_actual_calibration_id_idx').on(
       table.actualCalibrationId
     ),
     ```
2. `pnpm --filter backend run db:generate` → 0034_.sql 생성, rename → `0034_calibration_plan_items_actual_calibration_fk.sql`
3. `pnpm --filter backend run db:migrate`

**검증**:
```bash
pnpm --filter backend run db:migrate
docker compose exec postgres psql -U postgres -d equipment_management -c "\d calibration_plan_items" | grep -E "actual_calibration_id"
pnpm --filter backend run tsc --noEmit
```

**커밋**: `feat(calibration-plans): phase 5a — add actualCalibrationId FK to plan_items`

---

### Phase 5b — Auto-link on calibration creation

**목표**: 교정 등록 완료 시 해당하는 plan_item의 `actualCalibrationId` 자동 연결.

1. `packages/schemas/src/calibration.ts`의 `createCalibrationSchema`에 optional 추가:
   ```ts
   planItemId: z.string().uuid().optional(),
   ```
2. `calibration.service.ts` `createWithDocuments`: tx 블록 성공 이후(`result` 반환 후)에 try-catch로 감싸서:
   ```ts
   try {
     await this.linkActualCalibrationToPlanItem(result.calibration, dto.planItemId, actorId);
   } catch (e) {
     this.logger.warn('[createWithDocuments] auto-link failed — calibration preserved', e);
   }
   ```
3. 신규 private 메서드 `linkActualCalibrationToPlanItem`:
   - **명시적 planItemId**: `UPDATE calibration_plan_items SET actual_calibration_id=:id WHERE id=:planItemId AND actual_calibration_id IS NULL`
   - **자동 탐색**: `equipmentId + YEAR(calibrationDate) + status='approved' + actualCalibrationId IS NULL` 조건으로 항목 검색
     - 0건: info 로그 후 return
     - 1건: UPDATE
     - 다건: `ABS(plannedCalibrationDate - calibrationDate)` 최소 → UPDATE (동률 시 `created_at DESC`)
4. `apps/frontend/lib/api/cache-invalidation.ts` `invalidateAfterCreate`에 `queryClient.invalidateQueries({ queryKey: queryKeys.calibrationPlans.all, refetchType: 'active' })` 추가

**검증**:
- `pnpm --filter backend run tsc --noEmit`, `pnpm --filter backend run test`
- 수동 시나리오 3종 (exec-plan Phase 5b 참조)

**커밋**: `feat(calibration): phase 5b — auto-link actualCalibrationId on calibration creation`

---

### Phase 5c — confirmItem gate

**목표**: actualCalibrationId 없는 항목 confirm 차단.

1. `calibration-plans.service.ts` `confirmItem` 내부, 항목 fetch(L758-768) 직후 추가:
   ```ts
   if (item.actualCalibrationId === null || item.actualCalibrationId === undefined) {
     throw new UnprocessableEntityException({
       code: 'PLAN_ITEM_NOT_EXECUTED',
       message: '실제 교정이 등록되지 않은 항목은 확인할 수 없습니다.',
     });
   }
   ```

**검증**:
- actualCalibrationId IS NULL 항목에 confirmItem → 422 + PLAN_ITEM_NOT_EXECUTED
- 연결된 항목에 confirmItem → 200

**커밋**: `feat(calibration-plans): phase 5c — gate confirmItem with actualCalibrationId presence`

---

### Phase 6 — Security/Audit/Rate 검증 + Multer limits 명시

1. `calibration.controller.ts` POST `/` `FilesInterceptor`에 limits 추가:
   ```ts
   FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024, files: 10 } })
   ```
2. `packages/schemas/src/calibration.ts` `createCalibrationSchema`의 `registeredBy`/`registeredByRole`/`calibrationManagerId` 필드에 JSDoc 주석:
   `/** 서버가 JWT에서 override. 클라이언트 값 무시. */`
3. grep 검증:
   ```bash
   grep -n "registeredBy\|calibrationManagerId\|uploadedBy" apps/frontend/components/calibration/CalibrationForm.tsx
   # → 0 (또는 type 정의만)
   grep -rn "@AuditLog" apps/backend/src/common/file-upload/
   # → 0 (파일 저장에 별도 audit trail 없음)
   ```

**커밋**: `chore(calibration): phase 6 — explicit multer limits + document server-side userId SSOT`

---

### Phase 7 — Performance / Accessibility / I18n

#### 7a. staleTime 정비
- `apps/frontend/lib/api/query-config.ts`에서 `CACHE_TIMES.*` / `REFETCH_INTERVALS.*` 실제 값 확인 후:
  - `CALIBRATION_LIST.staleTime`: LONG(5분) → 2분 계열 (CACHE_TIMES.SHORT가 2분이면 사용, 아니면 `2 * 60 * 1000`)
  - `CALIBRATION_DETAIL` 신규 키 추가 (staleTime: 30s = `REFETCH_INTERVALS.REALTIME` 또는 `30 * 1000`)
- 교정 detail 훅(`useCalibration`/`useCalibrationById`)에 `QUERY_CONFIG.CALIBRATION_DETAIL` 바인딩 확인

#### 7b. Accessibility
- `CalibrationForm.tsx` `<form>` 요소에 `aria-label={t('form.aria.label')}` 확인/추가
- shadcn `FormMessage` — `role="alert"` 있으면 OK, 없으면 주석만

#### 7c. I18n
- `grep -E "[가-힣]" apps/frontend/components/calibration/CalibrationForm.tsx` → 0 목표
- `calibration-errors.ts`: `ENDPOINT_DEPRECATED`/`PLAN_ITEM_NOT_EXECUTED` 에러 코드 + i18n 키 매핑 추가
- `messages/ko/calibration.json`: `form.aria.label`, `errors.endpointDeprecated`, `errors.planItemNotExecuted` 키 추가

**커밋**: `polish(calibration): phase 7 — tune staleTime, aria-label, i18n error codes`

---

## 4. Verification Gate (각 Phase 커밋 직전)

```bash
# 공통
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm lint

# DB 변경 Phase (4a, 4d, 5a)
pnpm --filter backend run db:migrate
pnpm --filter backend run db:reset

# 최종 (Phase 7 후)
pnpm --filter backend run build
pnpm --filter frontend run build
```

---

## 5. Risk & Rollback

| 위험 | 완화 |
|------|------|
| 4a 백필 SQL이 NOT NULL 컬럼에 부적합 기본값 | 사전에 documents 스키마 nullability 확인 |
| 4d DROP COLUMN이 캐시된 응답에서 오류 | 4b→4c→4d 순서 엄수. 각 phase 사이 캐시 prefix 무효화 권장 |
| 5b auto-link이 잘못된 plan_item 선택 | 1건만 확실 연결, 다건은 결정적 tie-break, 0건은 skip. throw 금지 |
| 5c 게이트가 기존 confirmed 항목에 영향 | 이미 confirmed는 re-confirm 경로 없음 — 신규 confirm만 영향 |

---

## 6. Self-audit (commit 직전)
- [ ] SSOT 경유 — 로컬 타입 재정의 0
- [ ] 하드코딩 0 — DocumentType/QueryKey/ErrorCode 상수 경유
- [ ] eslint-disable 0
- [ ] Server-side userId — body의 registeredBy/uploadedBy 무시 확인
- [ ] 접근성 — aria-label/role="alert" 확인
- [ ] 워크플로우 — 기존 approve/reject/intermediateCheck 경로 건드리지 않음
- [ ] 감사 — AuditLog 단일 trail, 이중 로깅 0
