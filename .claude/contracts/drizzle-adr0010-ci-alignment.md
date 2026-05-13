# Contract: drizzle-adr0010-ci-alignment

**생성일**: 2026-05-13  
**Mode**: 1 (Lightweight)  
**Slug**: `drizzle-adr0010-ci-alignment`

## 목표

ADR-0010 (Drizzle Manual SQL Policy) 이 CI workflow + pre-push hook 에서 직접 위반되는
3가지 갭을 closure:

| # | 위반 위치 | 현재 (ADR-0010 위반) | 교체 목표 |
|---|-----------|---------------------|-----------|
| A | CI L130-141 | `drizzle-kit generate --name __drift_check__` | `drizzle-kit check` (journal↔SQL 정합성) + generate 차단 grep |
| B | CI L303-304 | `drizzle-kit push --force` | `pnpm --filter backend run db:migrate` (journal-based) |
| C | package.json | `"db:generate": "npx drizzle-kit generate"` | 스크립트 제거 (ADR-0010 집행) |
| D | pre-push | snapshot guard 없음 | snapshot 파일 변경 차단 guard 추가 |

## 변경 파일

1. `apps/backend/package.json` — `db:generate` 스크립트 제거
2. `.github/workflows/main.yml` — L130-141 step 교체 + L303-304 교체
3. `.husky/pre-push` — snapshot guard 추가 (env-sync 직후 위치)
4. `docs/adr/0010-drizzle-manual-sql-policy.md` — SHOULD 완료 표시

## MUST 기준 (Pass/Fail)

| ID | 기준 | 검증 방법 |
|----|------|----------|
| M-1 | `.github/workflows/main.yml`에서 `drizzle-kit generate` 호출 0건 | `grep -c "drizzle-kit generate" .github/workflows/main.yml` == 0 |
| M-2 | `.github/workflows/main.yml`에서 `drizzle-kit push` 직접 호출 0건 | `grep -n "drizzle-kit push" .github/workflows/main.yml` == 0 |
| M-3 | CI L303 부근이 `db:migrate` 또는 `drizzle-kit migrate` 사용 | `grep -n "db:migrate\|drizzle-kit migrate" .github/workflows/main.yml` ≥ 1 |
| M-4 | CI에 ADR-0010 generate 차단 grep step 존재 | step name 또는 `drizzle-kit generate.*grep`이 workflow에 존재 |
| M-5 | `apps/backend/package.json`에 `db:generate` 스크립트 없음 | `grep -c '"db:generate"' apps/backend/package.json` == 0 |
| M-6 | `.husky/pre-push`에 snapshot 변경 차단 guard 존재 | `grep -c "snapshot\|_snapshot" .husky/pre-push` ≥ 1 |
| M-7 | `.husky/pre-push`에서 snapshot guard가 exit 1 포함 | guard 블록 안에 `exit 1` 있음 |
| M-8 | `docs/adr/0010-drizzle-manual-sql-policy.md` SHOULD 항목 완료 처리 | CI workflow 관련 SHOULD 항목이 완료 표시됨 |

## SHOULD 기준 (기록 후 tech-debt)

| ID | 기준 |
|----|------|
| S-1 | pre-push의 snapshot guard 메시지가 ADR-0010 문서 경로를 안내 |
| S-2 | CI step 주석이 ADR-0010 의도(snapshot desync intentional) 설명 포함 |
| S-3 | `db:push:force` 스크립트도 ADR-0010 집행 관점에서 평가 (M 기준 미포함 — scope 외) |
