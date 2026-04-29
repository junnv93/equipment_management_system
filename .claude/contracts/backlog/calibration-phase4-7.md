# Contract: calibration-phase4-7

**Mode**: 2
**Slug**: `calibration-phase4-7`
**Date**: 2026-04-20
**Related exec-plan**: `.claude/exec-plans/active/2026-04-20-calibration-phase4-7.md`
**Depends on**: Phases 0-3 merged on main (commits 2e2215b4, b06dcb17, 4d3dab23)

## Scope

Phase 4 (certificatePath 컬럼 제거 4단계), Phase 5 (actualCalibrationId FK + auto-link + confirm gate), Phase 6 (보안/감사/레이트 검증 + Multer limits 명시), Phase 7 (staleTime/aria-label/i18n 마감).

---

## MUST Criteria (모두 PASS여야 Evaluator PASS 판정)

### Phase 4 — certificatePath removal

| # | Criterion | How to verify |
|---|-----------|---------------|
| M4.1 | 4a 백필 후 `documents`의 `description='[migrated...]'` 수 == `calibrations.certificate_path IS NOT NULL` 수 | psql count 쿼리 |
| M4.2 | 4a 백필 후 미이관 row 0개 (gap_cnt=0) | psql count 쿼리 |
| M4.3 | 4b 이후 `GET /api/calibration/:id` 응답 `certificatePath`가 해당 documents의 latest calibration_certificate filePath와 일치 | curl + psql |
| M4.4 | 4b 이후 documents가 0건인 교정은 calibrations.certificate_path fallback 반환 | curl + psql |
| M4.5 | 4c 이후 `POST /api/calibration/:uuid/certificate` → 410 + `{ code: 'ENDPOINT_DEPRECATED' }` | curl |
| M4.6 | 4c 이후 신규 교정 등록 row의 `certificate_path = NULL` | psql |
| M4.7 | 4d 이후 `calibrations` 테이블에 `certificate_path` 컬럼 없음 | `\d calibrations` |
| M4.8 | 4d 이후 `certificatePath` 정의가 packages/schemas와 DB-facing DTO(Nest DTO 클래스)에 0 | grep |
| M4.8a | `CalibrationRecord.certificatePath`는 documents 조인 virtual field로 유지 — M4.3(API 응답 호환성) 전제. DB column 아님. | grep + service.ts 주석 |
| M4.9 | `pnpm --filter backend run db:reset` 전체 성공 (Phase 4d 후) | 명령 실행 |

### Phase 5 — actualCalibrationId FK

| # | Criterion | How to verify |
|---|-----------|---------------|
| M5.1 | `calibration_plan_items.actual_calibration_id` 컬럼 존재 (uuid, nullable) | `\d calibration_plan_items` |
| M5.2 | FK ON DELETE SET NULL 존재 | 동일 |
| M5.3 | 인덱스 `calibration_plan_items_actual_calibration_id_idx` 존재 | `\di` |
| M5.4 | 명시적 `planItemId` 전달 시 해당 항목 `actual_calibration_id` 업데이트 | 수동 시나리오 |
| M5.5 | `planItemId` 미전달 + 단일 매칭 plan_item → 자동 연결 | 수동 시나리오 |
| M5.6 | 다건 매칭 시 `plannedCalibrationDate` 가장 가까운 항목으로 결정적 연결 | 수동 시나리오 |
| M5.7 | 0건 매칭 시 교정 등록 성공 + skip (info 로그) | 수동 시나리오 |
| M5.8 | `actual_calibration_id IS NULL` 항목에 confirmItem → 422 `PLAN_ITEM_NOT_EXECUTED` | curl |
| M5.9 | `actual_calibration_id IS NOT NULL` 항목에 confirmItem → 200 정상 | curl |
| M5.10 | auto-link 실패해도 calibration insert 201 성공 보장 | 의도적 잘못된 planItemId로 테스트 |

### Phase 6 — Security/Audit/Rate

| # | Criterion | How to verify |
|---|-----------|---------------|
| M6.1 | `CalibrationForm.tsx` FormData에 `registeredBy`/`calibrationManagerId`/`uploadedBy` 필드 없음 | grep |
| M6.2 | 백엔드 모든 mutation endpoint가 `extractUserId(req)` 사용 | Read + grep |
| M6.3 | `@AuditLog({ entityIdPath: 'response.calibration.id' })` POST `/` 유지 | Read controller |
| M6.4 | `file-upload.service.ts`/document create에서 별도 @AuditLog 없음 (create 경로 이중 trail 금지) | grep `@AuditLog` in file-upload |
| M6.5 | `FilesInterceptor`에 `{ limits: { fileSize: 10MB, files: 10 } }` 명시됨 | Read controller |

### Phase 7 — Perf/A11y/I18n

| # | Criterion | How to verify |
|---|-----------|---------------|
| M7.1 | `invalidateAfterCreate`에 `refetchType: 'active'` 유지 | Read cache-invalidation.ts |
| M7.2 | `CALIBRATION_LIST.staleTime` LONG(5분) → 2분 이하로 조정 | Read query-config.ts |
| M7.3 | `CALIBRATION_DETAIL` 신규 키 (staleTime 30s 계열) | 동일 |
| M7.4 | `CalibrationForm.tsx` form에 `aria-label` 존재 | Read + grep |
| M7.5 | `CalibrationForm.tsx` 내 한국어 리터럴 0 | `grep -E "[가-힣]" CalibrationForm.tsx` |
| M7.6 | `calibration-errors.ts`에 `ENDPOINT_DEPRECATED` 추가 + i18n 키 매핑 | Read file |
| M7.7 | `messages/ko/calibration.json`에 `form.aria.label`, `errors.endpointDeprecated` 존재 | grep |

### 공통

| # | Criterion | How to verify |
|---|-----------|---------------|
| MC.1 | `pnpm --filter backend run tsc --noEmit` PASS (모든 phase 후) | 명령 |
| MC.2 | `pnpm --filter frontend run tsc --noEmit` PASS (모든 phase 후) | 명령 |
| MC.3 | `pnpm --filter backend run test` PASS (모든 phase 후) | 명령 |
| MC.4 | 각 Phase는 독립 커밋 (4a/4b/4c/4d/5a/5b/5c/6/7 = 최소 9개) | `git log --oneline` |
| MC.5 | `--no-verify` 사용 0 | pre-push hook 통과 |
| MC.6 | main 직접 작업 (브랜치 생성 0) | git log |

---

## SHOULD Criteria (tracked, loop-blocking 아님)

| # | Criterion |
|---|-----------|
| S1 | 4a backfill `original_file_name`이 basename regex로 정확 추출 |
| S2 | 5b auto-link 동률 tie-break을 `created_at DESC`로 처리 (결정적) |
| S3 | 5b `CACHE_EVENTS.CALIBRATION_CREATED` payload에 `linkedPlanItemId` 포함 |
| S4 | 5c `UnprocessableEntityException`(422) 선택 (400 아님) |
| S5 | 6 Multer limits이 기존 file-upload.service 검증과 중첩 방어 구조 |
| S6 | 7a `CALIBRATION_DETAIL` 키가 실제 교정 detail 훅에 바인딩됨 |
| S7 | 커밋 메시지 `refactor/feat/chore/polish(calibration): phase Nx — <요약>` 포맷 |

---

## Out-of-scope (금지 — gold-plating 방지)

- ❌ 교정 문서 revision/parentDocument 흐름 구현
- ❌ `calibration_plan_items.actualCalibrationDate` 컬럼 제거
- ❌ 교정 폼 UX 변경, mode prop 변경
- ❌ 새로운 역할/권한 추가
- ❌ Redis/SSE 전환
- ❌ `approveCalibration`/`rejectCalibration`/`completeIntermediateCheck` 워크플로우 변경
- ❌ Phase 6에서 기능 추가 (검증/주석/방어막 한정)
- ❌ E2E 테스트 신규 작성 (기존 스펙 자동 통과가 목표)

---

## Validation Gate (각 phase 커밋 직전)

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm lint

# DB 변경 phase (4a, 4d, 5a)
pnpm --filter backend run db:migrate
pnpm --filter backend run db:reset

# 최종
pnpm --filter backend run build
pnpm --filter frontend run build
```

---

## Risk

- **단일 DB** — dev/prod 분리 언급 금지
- **pre-push hook** — `--no-verify` 금지
- **4a→4b→4c→4d 순서 엄수**
- **Phase 5b auto-link은 throw 금지** — 교정 등록 보호 최우선
- **Migration 번호**: `_journal.json` 실제 max+1 값 확인 후 결정
