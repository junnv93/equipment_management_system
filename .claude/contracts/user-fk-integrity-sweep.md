# Contract: user-fk-integrity-sweep

## Context

3개 테이블(calibration_factors, non_conformances, repair_history)의 user-referencing uuid 컬럼 8개에
`.references(() => users.id)` FK 제약이 누락됨. Drizzle relations는 정의되어 있으나 DB 레벨 constraint 없음.
calibration_plans 패턴(`.references(() => users.id, { onDelete: 'restrict' })`)이 정답 모델.

## MUST (pass criteria)

- [ ] 8개 FK 제약이 스키마에 `.references(() => users.id, { onDelete: 'restrict' })` 또는 `{ onDelete: 'set null' }`로 추가됨
  - `calibration_factors`: requestedBy(restrict), approvedBy(set null)
  - `non_conformances`: discoveredBy(set null), correctedBy(set null), closedBy(set null), rejectedBy(set null)
  - `repair_history`: createdBy(restrict), deletedBy(set null)
- [ ] requestedBy/approvedBy/createdBy/deletedBy 등 쿼리에 사용되는 FK 컬럼에 인덱스 추가
- [ ] `pnpm --filter backend run db:generate` 로 단일 마이그레이션 생성 (ALTER TABLE ADD CONSTRAINT + CREATE INDEX)
- [ ] `pnpm --filter backend run db:migrate` 가 dev DB에서 에러 없이 적용
- [ ] `pnpm tsc --noEmit` exit 0 (backend + frontend)
- [ ] `pnpm --filter backend run test` exit 0
- [ ] Orphan 데이터 0건 사전 검증 완료 (SQL 쿼리로 확인)

## SHOULD (non-blocking)

- [ ] onDelete 정책이 calibration_plans 패턴과 일관됨 (notNull → restrict, nullable → set null)
- [ ] 마이그레이션 SQL이 순수 additive DDL (DROP/ALTER COLUMN 없음)

## Scope (touches only)

- `packages/db/src/schema/calibration-factors.ts` — requestedBy, approvedBy에 .references() + 인덱스
- `packages/db/src/schema/non-conformances.ts` — discoveredBy, correctedBy, closedBy, rejectedBy에 .references() + 인덱스
- `packages/db/src/schema/repair-history.ts` — createdBy, deletedBy에 .references() + 인덱스, users import 추가
- `apps/backend/drizzle/0017_*.sql` (new) — 마이그레이션 자동 생성

## MUST NOT

- No changes to relations() blocks (이미 올바르게 정의됨)
- No changes to service/controller/frontend files
- No `db:push` — must go through `db:generate` + `db:migrate`
- No modifications to existing indexes or constraints
- No "while I'm here" refactors
