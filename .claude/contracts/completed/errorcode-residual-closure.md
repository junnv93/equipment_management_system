---
slug: errorcode-residual-closure
date: 2026-05-03
mode: 1
title: ErrorCode 잔여 품질 클로저 (revoke SSOT + equipment-imports semantic + mapper 정합성)
status: active
---

# Contract: errorcode-residual-closure

## 목적

backend-errorcode-full-closure sprint 이후 남은 품질 이슈 3+1개를 일괄 종결.
- revoke-approval DTO `.min(1)` → `REVOCATION_REASON_MIN_LENGTH` SSOT 격상 + service fail-close
- equipment-imports BadRequestException 의미론 불일치 수정
- security-auditable-codes.ts 주석 오기재 수정
- frontend mapper 정합성 (non-conformance mapBackendErrorCode 누락, cable-errors 잘못된 alias)

## 변경 파일 (11)

| # | 파일 | 변경 유형 |
|---|------|----------|
| 1 | `packages/shared-constants/src/validation-rules.ts` | REVOCATION_REASON_MIN_LENGTH 추가 |
| 2 | `packages/schemas/src/errors.ts` | RevocationReasonRequired ErrorCode + 400 매핑 |
| 3 | `apps/backend/src/modules/checkouts/dto/revoke-approval.dto.ts` | .min(1) → .min(REVOCATION_REASON_MIN_LENGTH) |
| 4 | `apps/backend/src/modules/checkouts/checkouts.service.ts` | revokeApproval fail-close 추가 |
| 5 | `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` | BadRequestException → ForbiddenException (line 753) |
| 6 | `apps/backend/src/common/constants/security-auditable-codes.ts` | 주석 수정 + RevocationReasonRequired 추가 |
| 7 | `apps/frontend/lib/errors/checkout-errors.ts` | RevocationReasonRequired + RevocationWindowExpired I18N 추가 |
| 8 | `apps/frontend/lib/errors/non-conformance-errors.ts` | mapBackendErrorCode export 추가 |
| 9 | `apps/frontend/lib/errors/cable-errors.ts` | 잘못된 alias 제거 |
| 10 | `apps/frontend/messages/ko/checkouts.json` | errors.revocationReasonRequired + errors.revocationWindowExpired |
| 11 | `apps/frontend/messages/en/checkouts.json` | 동일 영어 키 추가 |

## MUST 기준

| ID | 기준 | 검증 명령 |
|----|------|----------|
| M1 | backend tsc 0 errors | `pnpm --filter backend run tsc --noEmit 2>&1 \| tail -5` |
| M2 | frontend tsc 0 errors | `pnpm --filter frontend run tsc --noEmit 2>&1 \| tail -5` |
| M3 | backend tests ≥ 1133 | `pnpm --filter backend run test 2>&1 \| tail -5` |
| M4 | REVOCATION_REASON_MIN_LENGTH 상수 존재 | `grep -c "REVOCATION_REASON_MIN_LENGTH" packages/shared-constants/src/validation-rules.ts` ≥ 1 |
| M5 | RevocationReasonRequired ErrorCode 존재 | `grep -c "RevocationReasonRequired" packages/schemas/src/errors.ts` ≥ 1 |
| M6 | DTO가 상수 참조 | `grep -c "REVOCATION_REASON_MIN_LENGTH" apps/backend/src/modules/checkouts/dto/revoke-approval.dto.ts` ≥ 1 |
| M7 | service fail-close 존재 | `grep -c "RevocationReasonRequired" apps/backend/src/modules/checkouts/checkouts.service.ts` ≥ 1 |
| M8 | equipment-imports line 753 ForbiddenException | `sed -n '750,760p' apps/backend/src/modules/equipment-imports/equipment-imports.service.ts \| grep "ForbiddenException"` |
| M9 | non-conformance-errors mapBackendErrorCode 존재 | `grep -c "mapBackendErrorCode" apps/frontend/lib/errors/non-conformance-errors.ts` ≥ 1 |
| M10 | cable-errors 잘못된 alias 제거 | `grep "mapCableErrorToToast as mapBackendErrorCode" apps/frontend/lib/errors/cable-errors.ts` → 빈 결과 |
| M11 | verify-zod inline 0건 유지 | `grep -rn 'code: '"'"'[A-Z_]\+'"'"'' apps/backend/src/modules/ --include="*.ts" \| grep -v "spec\|test\|node_modules"` → 0건 |

## SHOULD 기준 (이연 허용)

| ID | 기준 |
|----|------|
| S1 | RevocationReasonRequired가 SECURITY_AUDITABLE_CODES에 포함 |
| S2 | 철회 관련 에러 2건 ko/en i18n parity 확인 |
| S3 | security-auditable-codes.ts 주석 "GlobalExceptionFilter만 참조"로 수정 |

## 성공 정의

M1~M11 전체 PASS + backend 1133 tests 유지 = 이 sprint 완료.
