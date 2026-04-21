---
slug: tech-debt-batch-0421b
date: 2026-04-21
mode: 2
related_exec_plan: .claude/exec-plans/active/2026-04-21-tech-debt-batch-0421b.md
---

# Contract: tech-debt-batch-0421b

## Task

tech-debt-tracker.md Open 항목 중 실행 가능한 5종을 5개 Phase로 묶어 처리:
- Phase A: UL-QP-18-06/07/08/10 양식을 Data/Renderer/Layout 3-way 패턴으로 분리
- Phase B: UL-QP-18-02 이력카드 §5 섹션 라벨 E2E 검증 추가
- Phase C: EXPORT_QUERY_LIMITS.FULL_EXPORT 스트리밍 Go/No-Go 결정 + 문서화
- Phase D: 보안·정책 감사 (equipment.controller.ts:472 + EXPORT_REPORTS×test_engineer), **분석만**
- Phase E: 양식 교체 운영 runbook 작성

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | Backend tsc | `pnpm --filter backend run tsc --noEmit` exit 0 |
| M2 | Frontend tsc | `pnpm --filter frontend run tsc --noEmit` exit 0 |
| M3 | Backend build | `pnpm --filter backend run build` exit 0 |
| M4 | Backend unit tests | `pnpm --filter backend run test` exit 0 (신규 회귀 0건) |
| M5 | Backend E2E tests | `pnpm --filter backend run test:e2e` exit 0 |
| M6 | Phase A — UL-QP-18-07 분리 | `apps/backend/src/modules/test-software/services/test-software-registry-{export-data,renderer}.service.ts` + `test-software-registry.layout.ts` 3개 파일 존재 |
| M7 | Phase A — UL-QP-18-06 분리 | `apps/backend/src/modules/checkouts/services/checkout-form-{export-data,renderer}.service.ts` + `checkout-form.layout.ts` 3개 파일 존재 |
| M8 | Phase A — UL-QP-18-08 분리 | `apps/backend/src/modules/cables/services/cable-path-loss-{export-data,renderer}.service.ts` + `cable-path-loss.layout.ts` 3개 파일 존재 |
| M9 | Phase A — UL-QP-18-10 분리 | `apps/backend/src/modules/equipment-imports/services/equipment-import-form-{export-data,renderer}.service.ts` + `equipment-import-form.layout.ts` 3개 파일 존재 |
| M10 | Phase A — dispatcher slim화 | `form-template-export.service.ts`의 각 export 함수 body ≤ 15줄 (DB 쿼리/ExcelJS/DocxTemplate 호출 0건) |
| M11 | Phase A — 도메인 모듈 등록 | 각 도메인 `*.module.ts` providers에 신규 서비스 등록 + `reports.module.ts`가 도메인 모듈 import |
| M12 | Phase B — E2E test 추가 | `wf-history-card-export.spec.ts`에 §5 섹션 라벨 검증 test block 신규 추가 + PASS |
| M13 | Phase B — E2E 라벨 비하드코딩 | 신규 test에 `@equipment-management/schemas` import 존재 (라벨 SSOT 경유) |
| M14 | Phase C — 결정 문서 | `docs/references/export-streaming-decision.md` 파일 존재, 실측 수치(RSS/duration) 포함, 명시적 Go/No-Go 판정 |
| M15 | Phase D — 분석 기재 | exec-plan Phase D 섹션에 D.1/D.2 각각 findings 3항목 기재 |
| M16 | Phase D — 코드 무변경 | `equipment.controller.ts` / `role-permissions.ts` 변경 0건 |
| M17 | Phase E — runbook 존재 | `docs/operations/form-template-replacement.md` 파일 존재, 6개 필수 섹션 포함 |
| M18 | SSOT 준수 | 신규 코드에 role/permission/status/URL 하드코딩 리터럴 0건 |
| M19 | no-any | 신규 `: any` 사용 0건 |
| M20 | no-eslint-disable | 신규 `eslint-disable` 0건 (테스트 제외) |
| M21 | 기능 회귀 0건 | 분리 전후 동일 파라미터 export 결과 동일 |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | Phase A — 각 양식별 `__tests__/*-renderer.service.spec.ts` 신설 |
| S2 | Phase A — 공유 헬퍼를 `docx-xml-helper.ts`로 이관 |
| S3 | Phase B — 섹션 내부 엔트리 데이터 존재 여부도 검증 |
| S4 | Phase C — 5,000행 시뮬레이션 스크립트 커밋 |
| S5 | Phase D — 별도 exec-plan slug 제안 (정책 이슈 발견 시) |
| S6 | Phase E — staging 리허설 기록 추가 |
| S7 | `form-template-export.service.ts` 전체 라인 수 ≤ 250 |

## OUT-OF-SCOPE

- Phase K — 백업·DR
- Drizzle snapshot 재생성 (TTY 요구)
- QR/NC 브라우저 수동 검증
- 커밋 귀속 복구 (사용자 결정 대기)
- CSP report 영속화
- k6 부하 테스트
- ZodSerializerInterceptor 글로벌 승격 (2026-05-01 재평가)
- class-DTO 마이그레이션 14개 (트리거 미검출)
- Phase D 정책 변경 구현 (분석만)
- Phase C Go 판정 시 스트리밍 구현 (별도 exec-plan)

## Verification Commands

```bash
# 게이트
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run build
pnpm --filter backend run test
pnpm --filter backend run test:e2e

# Phase A 구조 검증
test -f apps/backend/src/modules/test-software/services/test-software-registry-renderer.service.ts
test -f apps/backend/src/modules/checkouts/services/checkout-form-renderer.service.ts
test -f apps/backend/src/modules/cables/services/cable-path-loss-renderer.service.ts
test -f apps/backend/src/modules/equipment-imports/services/equipment-import-form-renderer.service.ts

# Phase B E2E
pnpm --filter frontend run test:e2e -- wf-history-card-export

# Phase C/E 문서
test -f docs/references/export-streaming-decision.md
test -f docs/operations/form-template-replacement.md

# Phase D 코드 무변경
git diff --stat apps/backend/src/modules/equipment/equipment.controller.ts
git diff --stat packages/shared-constants/src/role-permissions.ts

# SSOT/품질
! git diff HEAD -- apps/backend/src apps/frontend | grep -E "^\+.*: any\b"
! git diff HEAD -- apps/backend/src apps/frontend | grep -E "^\+.*eslint-disable"
```
