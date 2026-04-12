# 스프린트 계약: inspection_result_sections updatedBy 감사 필드 추가

## 생성 시점
2026-04-12T00:00:00+09:00

## Slug
`result-sections-updated-by`

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **MUST1**: `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] **MUST2**: `pnpm --filter backend run test` exit 0 (559/559 회귀 유지)
- [ ] **MUST3**: `pnpm --filter backend run build` exit 0
- [ ] **MUST4**: drizzle 마이그레이션 SQL 파일 신규 생성 — `apps/backend/drizzle/NNNN_*.sql` 에 `ALTER TABLE inspection_result_sections ADD COLUMN updated_by` 구문 존재
- [ ] **MUST5**: `packages/db/src/schema/inspection-result-sections.ts` 에 `updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' })` 필드 존재 (nullable — NOT NULL 금지, 기존 row soft migration)
- [ ] **MUST6**: `result-sections.service.ts` 의 `update()` 가 `updatedBy: string` 매개변수를 수용하고 `updateData.updatedBy = updatedBy` 로 SET 에 포함
- [ ] **MUST7**: `result-sections.service.ts` 의 `reorder()` 가 `updatedBy: string` 매개변수를 수용하고 tx 내부 sortOrder UPDATE 쿼리의 SET 절에 `updatedBy` 포함
- [ ] **MUST8**: `intermediate-inspections.controller.ts` 의 `updateResultSection` / `reorderResultSections` 핸들러가 `extractUserId(req)` 호출 후 서비스에 전달
- [ ] **MUST9**: `self-inspections.controller.ts` 의 동일 두 핸들러도 `extractUserId(req)` 호출 후 서비스에 전달
- [ ] **MUST10**: 하드코딩 금지 — userId 를 body 에서 읽거나 문자열 리터럴로 전달하지 않을 것 (Rule 2 준수)

### 권장 (SHOULD)

- [ ] **SHOULD1**: result-sections.service.spec.ts (존재 시) 업데이트 — updatedBy 전달 검증
- [ ] **SHOULD2**: `@AuditLog` 데코레이터는 이미 붙어 있으므로 건드리지 않음 (scope creep 방지)

## 적용 verify 스킬

- `verify-implementation` (CAS/Zod/Auth/Cache)
- `verify-hardcoding` (하드코딩 금지)
- `verify-security` (Rule 2 — userId server-side extraction)

## 종료 조건

- 필수 전체 PASS → 성공 → main 커밋 + push
- 동일 이슈 2회 연속 FAIL → 수동 개입
- 3회 반복 초과 → 수동 개입
