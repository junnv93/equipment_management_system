---
slug: checkouts-fk-index-sweep
mode: 1
scope: DB schema — packages/db/src/schema/checkouts.ts + drizzle migration
created: 2026-04-12
---

# 스프린트 계약: checkouts FK 인덱스 스위프

## 생성 시점
2026-04-12T00:00:00+09:00

## 배경

`packages/db/src/schema/checkouts.ts` 에 정의된 6개 FK 컬럼 중 4개가 인덱스 없이 WHERE 필터로 사용되고 있음:

| FK 컬럼 | 참조 | 사용처 | 현재 인덱스 |
|---------|------|--------|-------------|
| `approverId` | users | `checkouts.service.ts:332` `eq(checkouts.approverId, ...)` | ❌ 없음 |
| `returnerId` | users | 반입 처리자 join (상세 조회) | ❌ 없음 |
| `returnApprovedBy` | users | 반입 최종 승인 조회 (approveReturn/rejectReturn) | ❌ 없음 |
| `lenderConfirmedBy` | users | 시험소간 대여 확인 조회 | ❌ 없음 |
| `requesterId` | users | 신청자 목록 | ✅ `checkouts_requester_id_idx` |
| `lenderTeamId` | teams | 빌려주는 팀 조회 | ✅ `checkouts_lender_team_id_idx` |

Postgres는 FK 생성 시 인덱스를 자동 생성하지 않음 → 현재 위 4개 FK 필터는 seq scan.

**불변식**: "쿼리에 사용되는 FK 컬럼은 인덱스를 가진다". 다른 schema 파일 대부분은 이 규칙을 따르고 있음 (requesterId, lenderTeamId 포함). checkouts.ts 만 drift.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **MUST1**: `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] **MUST2**: `pnpm --filter backend run test` exit 0 (기존 테스트 회귀 없음)
- [ ] **MUST3**: `pnpm --filter backend run build` exit 0
- [ ] **MUST4**: `packages/db/src/schema/checkouts.ts` 에 4개 인덱스 정의 추가:
  - `checkouts_approver_id_idx` on `table.approverId`
  - `checkouts_returner_id_idx` on `table.returnerId`
  - `checkouts_return_approved_by_idx` on `table.returnApprovedBy`
  - `checkouts_lender_confirmed_by_idx` on `table.lenderConfirmedBy`
- [ ] **MUST5**: `apps/backend/drizzle/` 디렉토리에 신규 `.sql` 마이그레이션 파일 1개 추가 (`0015_*.sql` 또는 drizzle-kit 자동 명명). 해당 파일에 `CREATE INDEX` 4개 포함 (`approver_id`, `returner_id`, `return_approved_by`, `lender_confirmed_by`).
- [ ] **MUST6**: `apps/backend/drizzle/meta/_journal.json` 에 신규 마이그레이션 entry 1개 추가 (자동 생성).
- [ ] **MUST7**: `apps/backend/drizzle/meta/0015_snapshot.json` (또는 drizzle-kit 이 매기는 번호) 존재.
- [ ] **MUST8**: 기존 인덱스(`idVersionIdx`, `requesterIdx`, `statusIdx`, `statusCreatedIdx`, `statusExpectedReturnIdx`, `lenderTeamIdIdx`) 변경 없음 — 수술적 추가만.
- [ ] **MUST9**: 블랙리스트 파일 변경 없음 (다른 세션 작업 영역): `intermediate-inspections/**`, `self-inspections/**`, `form-template-export.service.ts`, `calibration-api.ts`, `self-inspection-api.ts`, `query-config.ts`, `shared-constants/api-endpoints.ts`, `shared-constants/file-types.ts`, `messages/{ko,en}/{calibration,equipment}.json`, `components/inspections/result-sections/**`, `components/equipment/SelfInspectionTab.tsx`.
- [ ] **MUST10**: `checkouts.service.ts` 및 기타 서비스 레이어 코드 **변경 없음** (쿼리 형태 불변, 인덱스만 추가).

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 등재, 루프 차단 없음

- [ ] **SHOULD1**: `pnpm --filter backend run db:migrate` 를 dev DB에서 dry-run 시 에러 없음 (수동 검증, optional).
- [ ] **SHOULD2**: verify-implementation PASS (백엔드 변경 영역 기반 자동 선택 스킬).
- [ ] **SHOULD3**: review-architecture Critical 이슈 0개 (변경 영역).

### 적용 verify 스킬
- `verify-implementation` (자동 라우팅)
- 선택적: `verify-sql-safety` (DDL-only라 회귀 없음이 기대)

## 종료 조건
- 필수 기준 전체 PASS → 성공 → /git-commit + main 직접 push (solo trunk-based, 1인 프로젝트 기본)
- 동일 이슈 2회 연속 FAIL → 수동 개입
- 3회 반복 초과 → 수동 개입
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

## 비고
- **Mode 1**: lightweight — 단일 도메인(DB 스키마), 3 파일 이하, 기존 패턴 재사용.
- **수정 방식**: main 브랜치 직접 작업 (사용자 요청 + CLAUDE.md 기본 원칙).
- **마이그레이션 명명**: drizzle-kit 자동 (`0015_<random>.sql`) 수용.
- **성능 영향**: 승인 대기 목록 / 반입 승인 / 시험소간 대여 확인 쿼리의 seq scan 제거. 반출 건수 선형 증가에 따른 열화 방지.
