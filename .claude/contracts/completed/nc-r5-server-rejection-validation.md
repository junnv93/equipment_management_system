---
slug: nc-r5-server-rejection-validation
created: 2026-04-26
mode: 1
follows: [nc-r4-detail-callout-timeline-merge]
round: 2
---

# Contract: NC-R5 서버 측 rejectionReason 검증 (Defense in Depth)

## Context

NC 코드 리뷰 Round-2 항목 #6.5 (defense in depth) 대응.

**실행 전제**: frontend 작업(R1a~R4)과 독립적. frontend 머지 완료 후 또는 병렬 실행 가능.

현재 `rejectionReason`:
- 클라이언트: `trim()` 가드 + 폼 validation — 빈 문자열 차단
- 서버: DTO 레벨 zod에서 `string` 타입만 검증, `min(1)` + `trim()` 없음

보안 fail-close 원칙상 서버도 독립적으로 검증해야 함. 클라이언트 bypass(직접 API 호출, devtools) 시 빈 `rejectionReason`으로 NC를 반려 가능 → 상태 기록 훼손.

**백엔드 파일 위치**: `apps/backend/src/modules/non-conformances/` 내 reject DTO, service.

## Scope

- MOD: `apps/backend/src/modules/non-conformances/dto/` 내 reject 관련 DTO 파일
  - `rejectionReason: z.string().trim().min(1, 'Rejection reason is required')`
- MOD or NO-CHANGE: `apps/backend/src/modules/non-conformances/non-conformances.service.ts`
  - service 레벨 추가 검증이 필요한 경우만 수정 (DTO zod로 충분하면 불필요)
- MOD: `apps/backend/test/` 또는 `apps/backend/src/modules/non-conformances/*.spec.ts`
  - 빈 문자열 / 공백만 있는 `rejectionReason` 거부 테스트 케이스 추가

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | DTO에 min(1) 검증 존재 | `grep -rn "rejectionReason.*min(1)\|rejectionReason.*trim" apps/backend/src/modules/non-conformances/dto/` → ≥ 1 |
| M2 | trim() 포함 | `grep -rn "\.trim()" apps/backend/src/modules/non-conformances/dto/ \| grep "rejection"` → ≥ 1 |
| M3 | 빈 문자열 거부 테스트 존재 | `grep -rn "rejectionReason.*''\|empty.*rejection\|rejection.*empty" apps/backend/src/ apps/backend/test/ 2>/dev/null` → ≥ 1 |
| M4 | backend tsc 통과 | `pnpm tsc --noEmit -p apps/backend/tsconfig.json 2>&1 \| grep -c "error"` → 0 |
| M5 | backend test 통과 | `pnpm --filter backend test --silent --passWithNoTests 2>&1 \| tail -5` → PASS |
| M6 | verify-zod PASS | `/verify-zod` 스킬 실행 — reject DTO zod 검증 PASS |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | 공백만 있는 문자열(`"   "`) 거부 테스트 케이스 추가 |
| S2 | 400 응답 body에 `rejectionReason` 필드별 에러 메시지 포함 (`errors.rejectionReason`) |

## Domain Rules

- DTO zod pipeline 패턴 준수 — `apps/backend/` behavioral-guidelines 참조
- `min(1)` 메시지는 영어로 (서버 오류 메시지는 i18n 대상 아님)
- 서버 검증 통과 후 DB 저장 전 service에서 추가 검증 금지 — DTO 단계에서 충분
- backend test DB는 단일 DB 정책 (separate test DB 금지) — CLAUDE.md Rule 1

## Non-Goals

- `rejectionReason` 최대 길이 제한 추가 (현재 미정의, tech-debt)
- 다른 reason 필드(`correctionContent` 등) 동시 수정 — NC 범위 외
- frontend 검증 로직 변경 (클라이언트 trim() 가드는 UX 목적으로 유지)
