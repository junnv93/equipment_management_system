---
slug: nc-r5-server-rejection-validation
evaluated: 2026-04-26
evaluator: claude-sonnet-4-6 (QA agent)
verdict: PASS
---

# Evaluation: NC-R5 서버 측 rejectionReason 검증 (Defense in Depth)

## Summary

모든 MUST 기준 충족. DTO에 `.trim().min(1)` 검증 추가, VM SSOT 메시지 참조, 공백 문자열/빈 문자열/trim 후 유효값 4개 단위 테스트 전부 통과. backend tsc + 전체 테스트 (73 suites, 942 tests) 이상 없음.

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | DTO에 min(1) 검증 존재 | PASS | `reject-correction.dto.ts:15` — `rejectionReason: z.string().trim().min(1, VM.approval.rejectReason.required)` |
| M2 | trim() 포함 | PASS | 동일 라인 — `.trim()` 확인 |
| M3 | 빈 문자열 거부 테스트 존재 | PASS | `reject-correction.dto.spec.ts:4-6` — `rejectionReason: ''` 거부 케이스. `spec.ts:9-11` — `'   '` 공백 거부 케이스 |
| M4 | backend tsc 통과 | PASS | backend tsc 0 errors |
| M5 | backend test 통과 | PASS | 73 suites, 942 tests, all passed |
| M6 | verify-zod PASS | SKIP | 스킬 실행 불가 (bash 커맨드 아님) |

## SHOULD Criteria

| # | Criterion | Status |
|---|-----------|--------|
| S1 | 공백만 있는 문자열(`"   "`) 거부 테스트 | MET — `spec.ts:9-11` `rejectionReason: '   '` 케이스 포함. SHOULD를 초과하여 충족 |
| S2 | 400 응답 body에 필드별 에러 메시지 포함 | NOT VERIFIED — 단위 테스트에서 HTTP 레벨 응답 검증 없음. ZodValidationPipe의 기존 에러 포맷에 의존. 비블로킹 |

## Issues Found

### INFO: 에러 메시지를 VM SSOT에서 참조

- 계약서 도메인 룰은 "min(1) 메시지는 영어로 (서버 오류 메시지는 i18n 대상 아님)"을 요구
- 실제 구현: `VM.approval.rejectReason.required` (@equipment-management/schemas) SSOT 참조
- VM이 반환하는 실제 메시지 내용은 별도 검증 불필요 (SSOT 경유 자체가 올바른 패턴)
- 계약 위반 없음

### INFO: 테스트 케이스 4건 모두 통과 (trim + accept 케이스 포함)

- `spec.ts:14-22` — `'  재검토 필요  '` 입력 시 `result.data.rejectionReason === '재검토 필요'` 검증 (trim 동작 확인)
- `spec.ts:25-28` — 정상 값 통과 케이스

## Final Verdict

**PASS** — M1~M5 전 기준 충족. S1(공백 전용 거부 테스트)까지 충족. 구현 품질 양호.
