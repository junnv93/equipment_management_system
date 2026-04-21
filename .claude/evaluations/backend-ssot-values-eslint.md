---
slug: backend-ssot-values-eslint
iteration: 1
verdict: PASS
---

# Evaluation Report: backend-ssot-values-eslint

## MUST Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| M1: 5종 Values 객체 export | PASS | `CalibrationStatusValues`(SCHEDULED/IN_PROGRESS/COMPLETED/FAILED/CANCELLED), `AttachmentTypeValues`(INSPECTION_REPORT/HISTORY_CARD/OTHER), `TimelineEntryTypeValues`(DAMAGE/MALFUNCTION/CHANGE/REPAIR/CALIBRATION_OVERDUE/REPAIR_RECORD/NON_CONFORMANCE), `RequestTypeValues`(CREATE/UPDATE/DELETE), `SelfInspectionStatusValues`(DRAFT/SUBMITTED/APPROVED/REJECTED) — 모두 `packages/schemas/src/enums/values.ts`에서 확인 |
| M2: `as const satisfies Record<string, T>` 적용 | PASS | 5종 신규 Values 객체 전부 `as const satisfies Record<string, <Type>>` 적용 확인 (L421, L431, L445, L455, L466) |
| M3: `no-restricted-syntax` 룰 + `.status`/`.approvalStatus`/`.returnApprovalStatus` 타깃 | PASS | `.eslintrc.js` L70-78에서 BinaryExpression selector가 세 property name 모두 `/^(status|approvalStatus|returnApprovalStatus)$/` 패턴으로 포함 |
| M4: `pnpm --filter backend run lint` → 0 errors | PASS | 0 errors — lint 완료 출력만 있음 |
| M5: `pnpm tsc --noEmit` → 0 errors | PASS | 출력 없음(0 errors) |
| M6: `pnpm --filter backend run test` → PASS | PASS | Tests: 911 passed, 911 total / Test Suites: 69 passed, 69 total |
| M7: `document.service.ts` L660 주변 `'draft'` 리터럴 없음 | PASS | L661: `validation.status !== ValidationStatusValues.DRAFT` 사용, 리터럴 없음 |
| M8: `verification.ts` L144/L176 `'pending_approval'`/`'pending'` 리터럴 없음 | PASS | L148: `c.approvalStatus === CalibrationApprovalStatusValues.PENDING_APPROVAL`, L180: `c.status === CheckoutStatusValues.PENDING` — Values 상수 사용. raw SQL `whereClause` 파라미터의 문자열은 계약 Non-Goal(raw SQL 문자열)에 해당 |
| M9: controller override에 emitAsync selector + domain literal selector 둘 다 존재 | PASS | `.eslintrc.js` L87-101: `files: ['**/*.controller.ts']` override에 emitAsync 차단 selector(L89-92)와 domain literal 차단 selector(L93-100) 배열로 공존 |
| M10: `pnpm --filter frontend run lint` → 0 errors | PASS | 0 errors — lint 완료 출력만 있음 |

## SHOULD Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| S1: 백엔드 서비스 코드 잔존 domain literal 비교 0건 | WARN | `calibration.service.ts:475`에서 `r.status === 'rejected'` 1건 감지. 단, S2에서 확인된 대로 eslint-disable 주석이 L474에 명시되어 있고 Promise.allSettled 결과 status이므로 ESLint 위반 아님. 순수 S1 grep 기준에서는 잔존 |
| S2: Promise.allSettled 사용처 3곳 eslint-disable 주석 | PASS | `calibration.service.ts:474`, `dashboard.service.ts:650`, `docx-xml-helper.ts:512` — 3곳 모두 `-- Promise.allSettled` 이유 주석 포함 |
| S3: overrides에 seed-data + __tests__ 대상 `no-restricted-syntax: off` | PASS | `.eslintrc.js` L104-110: `src/database/seed-data/**/*.ts` + `**/__tests__/**/*.spec.ts` 대상 `no-restricted-syntax: 'off'` 확인 |

## Summary

**MUST 기준 10/10 PASS, SHOULD 기준 2/3 충족 (S1 WARN).**

전체 verdict: **PASS**

S1 WARN 상세: `calibration.service.ts:475`의 `r.status === 'rejected'`는 Promise.allSettled 결과 status 비교이며, S2 기준(eslint-disable 주석 존재)으로 커버됨. ESLint 0 errors로 실제 위반 아님. S1 grep 기준 자체가 `eslint-disable` 행을 제외하지 않아 결과에 포함되었으나, 해당 라인 위의 `eslint-disable-next-line` 주석은 grep 필터에 걸리지 않는 구조적 한계. 실질적 SSOT 위반 없음.

검증 일시: 2026-04-21
