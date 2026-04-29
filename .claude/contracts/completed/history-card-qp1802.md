# 스프린트 계약: UL-QP-18-02 시험설비 이력카드 아키텍처 전면 개선

## 생성 시점
2026-04-17T00:00:00+09:00

## Slug
history-card-qp1802

## 범위
exec-plan `2026-04-17-history-card-qp1802.md` Phase 1~8 전체.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

**전체 품질 게이트:**
- [ ] M-1: `pnpm tsc --noEmit` 전체 exit 0 (backend + frontend + packages)
- [ ] M-2: `pnpm lint` 에러 0건
- [ ] M-3: `pnpm --filter backend run build` 성공
- [ ] M-4: `pnpm --filter backend run test` 기존 테스트 회귀 0건
- [ ] M-5: `pnpm --filter backend run test:e2e -- history-card-export` 전체 PASS (기존 + 신규 검증)
- [ ] M-6: `git status` clean, `git log origin/main..HEAD`에 Phase 단위 커밋 ≥ 6개
- [ ] M-7: 브랜치는 main, 새 브랜치 없음 (35차 결정)
- [ ] M-8: 신규 `any` 타입 0건
- [ ] M-9: 하드코딩된 라벨/섹션명/빈행수 0건 (전부 `history-card.layout.ts` 또는 schemas 경유)

**Phase 1 — DB 마이그레이션:**
- [ ] M-P1-a: `packages/db/src/schema/equipment.ts`에 `approvedAt` nullable 컬럼 추가됨.
- [ ] M-P1-b: `apps/backend/drizzle/` 폴더에 마이그레이션 SQL 1건 신규 생성됨.
- [ ] M-P1-c: `db:reset` 이후 schema 반영 확인 (`\d equipment`에 `approved_at` 존재).
- [ ] M-P1-d: `equipment-approval.service.ts` 승인 경로(create/update approve 모두)에서 `equipment.approvedAt` 세팅.

**Phase 2 — SSOT:**
- [ ] M-P2-a: `history-card.layout.ts` 신규 파일 존재, 모든 셀 라벨/섹션 제목/빈 행 수/체크박스 패턴이 이 파일에서만 정의됨.
- [ ] M-P2-b: `history-card.service.ts` 파일에서 인라인 라벨 맵 4개 제거 — `@equipment-management/schemas` 경유 (Rule 0).
- [ ] M-P2-c: `TimelineEntryType` + `TIMELINE_ENTRY_TYPE_LABELS` schemas 패키지에 존재.
- [ ] M-P2-d: 각 layout 상수에 양식 원본 docx 텍스트 추적 주석 존재.

**Phase 3 — 통합 이력:**
- [ ] M-P3-a: `equipment-timeline.service.ts` 신규 파일 존재. Promise.all 3 쿼리 (incident, repair, nonConformances).
- [ ] M-P3-b: 유닛 테스트 ≥ 4개 (DESC 정렬, incident→NC 중복 제거, repair→NC 중복 제거, type 라벨 변환).
- [ ] M-P3-c: `HISTORY_CARD_QUERY_LIMIT` 상수 사용 (하드코딩 없음).

**Phase 4 — Data Service:**
- [ ] M-P4-a: `history-card-data.service.ts` 신규 파일 존재.
- [ ] M-P4-b: **checkouts 쿼리 제거** (양식에 반출 섹션 없음).
- [ ] M-P4-c: `equipment_test_software` 조인 쿼리 추가 (S/W 정보).
- [ ] M-P4-d: approvalDate = `approvedAt ?? updatedAt` fallback.
- [ ] M-P4-e: "부속품 & 주요기능" = `accessories` + `description` 병합.
- [ ] M-P4-f: HistoryCardData에 `timeline: TimelineEntry[]` 단일 필드 (기존 repairs/nonConformances/incidentHistory 배열 제거).

**Phase 5 — Renderer/XmlHelper:**
- [ ] M-P5-a: `apps/backend/src/modules/reports/docx-xml-helper.ts` 신규 존재. 최소 5개 함수 export.
- [ ] M-P5-b: `history-card-renderer.service.ts` 신규 존재. `layout.ts` 상수만 사용 (매직 문자열 없음).
- [ ] M-P5-c: `history-card.service.ts` 길이 ≤ 60줄 (orchestrator 역할).
- [ ] M-P5-d: 서명 이미지 다운로드 실패 시 텍스트 fallback 유지 (graceful degradation).
- [ ] M-P5-e: 템플릿 매칭 실패 시 구조화된 `FormRenderError` throw (기존 `InternalServerErrorException` 유지 또는 개선).

**Phase 6 — 캐시 일관성:**
- [ ] M-P6-a: `repair-history.service.ts`의 create/update/delete 경로에 `invalidateAfterEquipmentUpdate(equipmentId, false, false)` 호출 추가.
- [ ] M-P6-b: 기존 `equipment-history.service.ts`의 incident/location/maintenance 무효화 회귀 없음.

**Phase 7 — 시드/E2E:**
- [ ] M-P7-a: SUW-E0001에 repair 1건 + NC 1건 시드 (NC가 repair를 FK로 참조).
- [ ] M-P7-b: `history-card-export.e2e-spec.ts`가 신규 검증 ≥ 5개 추가 (repair 텍스트, NC 중복 제거, 유형 라벨 prefix, description 병합, S/W 또는 승인일 분리).
- [ ] M-P7-c: **repair_history + non_conformances + equipment_incident_history 3개 모두 DOCX에 반영됨을 e2e가 확정 검증** (절차서 §9.9 + 개정 14 준수).
- [ ] M-P7-d: 기존 e2e 테스트 회귀 없음.

**Phase 8 — 문서:**
- [ ] M-P8-a: `docs/manual/report-export-mapping.md` §3.2가 신규 shape로 갱신.
- [ ] M-P8-b: `docs/references/backend-patterns.md`에 DOCX 분리 아키텍처 섹션 신설 (≥ 10줄).

**SSOT/하드코딩 검증:**
- [ ] M-V-a: verify-ssot PASS — 모든 enum/라벨 `@equipment-management/schemas` 경유.
- [ ] M-V-b: verify-hardcoding PASS — 유니코드 공백 포함 매직 문자열이 layout.ts 외 파일에 없음.
- [ ] M-V-c: verify-cache-events PASS — repair-history 신규 invalidate 호출 검증.
- [ ] M-V-d: verify-sql-safety PASS — parameterized queries only.

**보안·접근성:**
- [ ] M-Sec-a: `enforceSiteAccess` 유지 (controller L69).
- [ ] M-Sec-b: `RequirePermissions(VIEW_EQUIPMENT)` 유지.
- [ ] M-Sec-c: 서명 이미지 경로 조회 실패 시 PII 유출 없이 text fallback.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록

- [ ] S-1: review-architecture Critical 이슈 0개.
- [ ] S-2: `pnpm --filter frontend run test:e2e -- wf-history-card-export` PASS.
- [ ] S-3: DOCX 렌더링 벤치마크: 10회 평균 시간이 현재 대비 +10% 이내.
- [ ] S-4: `docx-xml-helper.ts`에 ≥ 3 유닛 테스트.
- [ ] S-5: verify-e2e PASS.

### 커밋 규율
- [ ] C-1: 커밋 메시지 한국어 + `fix|feat|refactor|test|docs(scope): 내용` 형식.
- [ ] C-2: Phase별 커밋 분리 (최소 6개).
- [ ] C-3: 모든 커밋 pre-commit(gitleaks) 통과.
- [ ] C-4: 마지막 `git push origin main`이 pre-push hook(tsc + test) 통과.

### 적용 verify 스킬
- `verify-ssot` (layout/labels/timeline type)
- `verify-hardcoding` (매직 문자열 제거)
- `verify-cache-events` (repair-history 무효화)
- `verify-cas` (equipment approval 경로)
- `verify-sql-safety` (timeline 쿼리)
- `verify-seed-integrity` (SUW-E0001 repair/NC 연결)
- `verify-e2e` (history-card-export 커버리지)
- `review-architecture` (3-way 분리 품질)

## 종료 조건
- 필수 기준 전체 PASS → Evaluator PASS → 완료.
- 동일 이슈 2회 연속 FAIL → Planner 재진입.
- 3회 반복 초과 → 수동 개입 요청.

## 참고 파일

### 프로덕션 코드 (수정)
- `packages/db/src/schema/equipment.ts`
- `packages/schemas/src/equipment-history.ts`
- `packages/schemas/src/enums/labels.ts`
- `apps/backend/src/modules/equipment/services/equipment-approval.service.ts`
- `apps/backend/src/modules/equipment/services/history-card.service.ts`
- `apps/backend/src/modules/equipment/services/repair-history.service.ts`
- `apps/backend/src/modules/equipment/equipment.module.ts`
- `apps/backend/src/modules/reports/reports.module.ts`

### 프로덕션 코드 (신규)
- `apps/backend/src/modules/equipment/services/history-card.layout.ts`
- `apps/backend/src/modules/equipment/services/equipment-timeline.types.ts`
- `apps/backend/src/modules/equipment/services/equipment-timeline.service.ts`
- `apps/backend/src/modules/equipment/services/history-card-data.service.ts`
- `apps/backend/src/modules/equipment/services/history-card-renderer.service.ts`
- `apps/backend/src/modules/reports/docx-xml-helper.ts`

### 테스트
- `apps/backend/src/modules/equipment/services/__tests__/equipment-timeline.service.spec.ts`
- `apps/backend/test/history-card-export.e2e-spec.ts`
- `apps/frontend/tests/e2e/workflows/wf-history-card-export.spec.ts`

### 시드
- `apps/backend/src/database/seed-data/history/repair-history.seed.ts`
- `apps/backend/src/database/seed-data/history/non-conformances.seed.ts`

### 문서
- `docs/procedure/절차서/장비관리절차서.md` (읽기 전용 — §7.7, §9.9 근거)
- `docs/procedure/양식/QP-18-02_시험설비이력카드.md` (읽기 전용 — 양식 원본 사양)
- `docs/manual/report-export-mapping.md`
- `docs/references/backend-patterns.md`

### SSOT
- `packages/shared-constants/src/form-catalog.ts` (변경 없음)
- `packages/schemas/src/enums/incident.ts`
- `packages/schemas/src/enums/non-conformance.ts`
- `packages/schemas/src/enums/labels.ts`
