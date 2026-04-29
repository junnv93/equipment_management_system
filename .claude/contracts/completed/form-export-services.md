---
slug: form-export-services
date: 2026-04-21
mode: 1
description: UL-QP-18-06/07/08/10 폼 내보내기 서비스 14개 파일 완성 + SSOT 마이그레이션
---

# Contract: form-export-services

## Scope

14 untracked 파일 (cables/services/*, checkouts/services/*, equipment-imports/services/*, test-software/services/*)
+ 4 modified module files
+ self-inspections.service.ts SSOT 마이그레이션

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `tsc --noEmit` 오류 없음 | `pnpm exec tsc --noEmit -p apps/backend/tsconfig.json` |
| M2 | 백엔드 단위 테스트 전체 PASS | `pnpm --filter backend run test` |
| M3 | SSOT 준수: 상태값 리터럴 금지 (SelfInspectionStatusValues 사용) | grep `'draft'\|'submitted'\|'approved'\|'rejected'` in self-inspections.service.ts |
| M4 | 각 도메인 모듈이 ExportDataService + RendererService 양쪽 모두 providers/exports 등록 | cables.module, checkouts.module, equipment-imports.module, test-software.module |
| M5 | ReportsModule이 4개 도메인 모듈 모두 imports 등록 | reports.module.ts |
| M6 | 스코프 강제 (EnforcedScope filter) 각 ExportDataService에 구현 | site/teamId 조건 분기 확인 |
| M7 | FORM_CATALOG에 UL-QP-18-06/07/08/10 `implemented: true` | packages/shared-constants/src/form-catalog.ts |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | Layout 파일이 모든 하드코딩 좌표/열 인덱스를 상수로 export (renderer 내 리터럴 0) |
| S2 | 각 서비스 파일에 JSDoc 주석 (양식 번호 + 역할) 포함 |

## Success Criteria

모든 MUST PASS → commit + push
SHOULD 실패 → tech-debt-tracker 기록 후 commit 진행
