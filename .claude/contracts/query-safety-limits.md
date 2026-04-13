# Contract: query-safety-limits

**Slug**: query-safety-limits  
**Mode**: 1 (Lightweight)  
**Date**: 2026-04-13  
**Source**: example-prompts.md — 46차 🟠 HIGH — QUERY_SAFETY_LIMITS SSOT 상수 도입 + limit 없는 findMany 전수 조사

---

## Deliverables

1. `packages/shared-constants/src/business-rules.ts` — `QUERY_SAFETY_LIMITS` 상수 추가
2. `packages/shared-constants/src/index.ts` — export 추가
3. `apps/backend/src/modules/audit/audit.service.ts` — `findByEntity()` .limit() 추가
4. `apps/backend/src/modules/equipment/services/equipment-attachment.service.ts` — `findByEquipmentId` / `findByRequestId` limit 추가
5. `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts` — `getRegistry()` limit 추가
6. `apps/backend/src/modules/checkouts/checkouts.service.ts` — `getConditionChecks()` limit 추가
7. 전수 조사: 추가 limit 누락 서비스 발견 시 동일 상수 적용

---

## MUST Criteria (루프 차단)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter backend run tsc --noEmit` exit 0 | CLI |
| M2 | `pnpm --filter shared-constants run tsc --noEmit` exit 0 | CLI |
| M3 | `pnpm --filter backend run test` 전체 PASS | CLI |
| M4 | `QUERY_SAFETY_LIMITS` 정의 shared-constants에 1 hit | `grep 'QUERY_SAFETY_LIMITS' packages/shared-constants/src/business-rules.ts` |
| M5 | `QUERY_SAFETY_LIMITS` 사용처 4+ hit (backend) | `grep -r 'QUERY_SAFETY_LIMITS' apps/backend/src/modules --include='*.ts'` |
| M6 | audit.service.ts findByEntity에 .limit() 적용 | `grep -A5 'findByEntity' apps/backend/src/modules/audit/audit.service.ts \| grep 'limit'` |
| M7 | 전수 조사 후 limit 누락 0건 (페이지네이션 미적용 findMany) | `grep -rn 'findMany\|\.select()\.from(' apps/backend/src/modules --include='*.service.ts' \| grep -v '\.limit\|spec\.ts\|BATCH_QUERY_LIMITS\|REPORT_EXPORT_ROW_LIMIT\|QUERY_SAFETY_LIMITS'` |

---

## SHOULD Criteria (tech-debt, 루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | findByEntity limit 이후 UI 페이지네이션 필요 여부 도메인 검토 주석 추가 |
| S2 | getRegistry cold cache 보호 목적 인라인 주석 |

---

## Out of Scope

- checkouts 프론트엔드 변경 (다른 세션 작업 중)
- 페이지네이션 이미 적용된 메서드 (cursor/offset 방식)
- 리포트 export 메서드 (REPORT_EXPORT_ROW_LIMIT 별도 관리)
