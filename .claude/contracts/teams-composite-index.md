---
slug: teams-composite-index
date: 2026-04-14
task: teams 테이블 (site, classification) 복합 인덱스 추가, classificationIdx 제거
mode: 1
---

# Contract: teams-composite-index

## MUST Criteria (루프 차단)

- [ ] `pnpm --filter backend exec tsc --noEmit` → exit 0
- [ ] `pnpm --filter backend run db:generate` → 새 migration SQL 파일 생성됨
- [ ] 생성된 migration에 `DROP INDEX teams_classification_idx` 포함
- [ ] 생성된 migration에 `CREATE INDEX teams_site_classification_idx` 포함
- [ ] `pnpm --filter backend run db:migrate` → exit 0
- [ ] `pnpm --filter backend run test` → exit 0
- [ ] `packages/db/src/schema/teams.ts`에 `siteClassificationIdx` 존재
- [ ] `packages/db/src/schema/teams.ts`에 `classificationIdx` 미존재 (제거됨)

## SHOULD Criteria (루프 비차단)

- [ ] 기존 `siteIdx` (단일 site 인덱스) 유지됨 — site 단독 필터에도 활용
- [ ] 인덱스명이 컨벤션(`{table}_{col}_idx`) 준수
