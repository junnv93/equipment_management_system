---
slug: tech-debt-0420-b
date: 2026-04-20
iteration: 1
---

# Contract: tech-debt-0420-b

## Scope
5개 tech-debt: Listener 이중갱신 + 이벤트 미발행 + ValidationDetailContent + VersionHistory + E2E 실패

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | backend tsc exit 0 | `pnpm --filter backend run tsc --noEmit` |
| M2 | frontend tsc exit 0 | `pnpm --filter frontend run tsc --noEmit` |
| M3 | backend unit tests PASS | `pnpm --filter backend run test` |
| M4 | Listener: linkedPlanItemId early-return | `grep -n "linkedPlanItemId" apps/backend/src/modules/calibration-plans/listeners/calibration-plan-sync.listener.ts` → 1+ hits |
| M5 | Service: CALIBRATION_UPDATED emitAsync | `grep -n "CALIBRATION_UPDATED" apps/backend/src/modules/calibration/calibration.service.ts` → 1+ hits |
| M6 | Service: recordCertificateDocuments 존재 | `grep -n "recordCertificateDocuments" apps/backend/src/modules/calibration/calibration.service.ts` → 1+ hits |
| M7 | Controller: recordCertificateDocuments 호출 | `grep -n "recordCertificateDocuments" apps/backend/src/modules/calibration/calibration.controller.ts` → 1+ hits |
| M8 | ValidationDetailContent: useCasGuardedMutation | `grep -n "useCasGuardedMutation" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/\[validationId\]/ValidationDetailContent.tsx` → 1+ hits |
| M9 | ValidationDetailContent: isConflictError 제거 | `grep -n "isConflictError" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/\[validationId\]/ValidationDetailContent.tsx` → 0 hits |
| M10 | VersionHistory: REFETCH_STRATEGIES | `grep -n "REFETCH_STRATEGIES" apps/frontend/components/calibration-plans/VersionHistory.tsx` → 1+ hits |
| M11 | auth.service: canonical emails | `grep -n "lab.manager@example.com" apps/backend/src/modules/auth/auth.service.ts` → 1+ hits |
| M12 | auth.e2e: canonical emails 사용 | login 테스트에서 canonical email 사용 |
| M13 | checkouts.e2e: version 필드 | approve/reject body에 version 포함 |
| M14 | 신규 any 타입 없음 | `git diff HEAD | grep "^\+.*: any"` → 0 hits |
| M15 | 신규 eslint-disable 없음 | `git diff HEAD | grep "^\+.*eslint-disable"` → 0 hits |

## SHOULD Criteria (non-blocking)
- S1: Listener debug 로그 구조화 JSON
- S2: recordCertificateDocuments 단위 테스트
