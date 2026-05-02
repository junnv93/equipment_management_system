# Contract: equipment-domain-errorcode-closure

**Slug**: `equipment-domain-errorcode-closure`
**Mode**: 1 (Lightweight)
**Date**: 2026-05-02
**Scope**: equipment 도메인 inline 에러코드 완전 종결 + CalibrationFactorsClient runtime 버그 수정

---

## Background

이전 sprint(01bca2d1)에서 controller 7건 격상 완료.
본 sprint는 잔여 3건 격상 + runtime 버그(approverComment) 수정으로 equipment 도메인 실제 종결.

## Scope

### 신규 격상 (3건)
| string literal | ErrorCode enum | HTTP status | 위치 |
|---|---|---|---|
| `'FORM_DATA_PARSE_FAILED'` | `EquipmentFormDataParseFailed` | 400 | form-data-parser.interceptor.ts |
| `'INVALID_MANAGEMENT_NUMBER'` | `EquipmentInvalidManagementNumber` | 400 | management-number-param.pipe.ts (2건) |

### runtime 버그 수정
- `approve-calibration-factor.dto.ts`: `approverComment: z.string().min(1)` → `z.string().optional()` (UL-QP-18: 코멘트 선택)
- backend DTO 클래스: `approverComment: string` → `approverComment?: string`
- (frontend DTO는 이미 optional)

### 문서 업데이트
- `verify-zod/SKILL.md` Step 16 명령 #1 주석: "10건 → 3건 → 0건" 반영

---

## Files Changed

1. `packages/schemas/src/errors.ts` — enum 2건 추가, statusCode 2건 추가
2. `apps/backend/src/modules/equipment/interceptors/form-data-parser.interceptor.ts` — ErrorCode import + 교체
3. `apps/backend/src/modules/equipment/dto/management-number-param.pipe.ts` — ErrorCode import + 교체 2건
4. `apps/backend/src/modules/calibration-factors/dto/approve-calibration-factor.dto.ts` — Zod optional + DTO optional
5. `apps/frontend/lib/errors/equipment-errors.ts` — mapper 2건 추가
6. `apps/frontend/messages/ko/errors.json` — 2건 추가
7. `apps/frontend/messages/en/errors.json` — 2건 추가
8. `.claude/skills/verify-zod/SKILL.md` — Step 16 주석 업데이트

---

## MUST Criteria

| # | Criterion | Verification |
|---|---|---|
| M-1 | schemas 2건 enum 추가 | `grep -c 'EquipmentFormDataParseFailed\|EquipmentInvalidManagementNumber' packages/schemas/src/errors.ts` ≥ 4 (enum + statusCode) |
| M-2 | equipment 도메인 inline 에러코드 완전 0건 | `grep -rn "code: '" apps/backend/src/modules/equipment/ --include="*.ts" \| grep -v spec` → 0건 |
| M-3 | approverComment Zod optional | `grep "approverComment.*optional\|z\.string.*optional" apps/backend/src/modules/calibration-factors/dto/approve-calibration-factor.dto.ts` ≥ 1 |
| M-4 | frontend mapper 2건 추가 | `grep -c 'FORM_DATA_PARSE_FAILED\|INVALID_MANAGEMENT_NUMBER' apps/frontend/lib/errors/equipment-errors.ts` ≥ 2 |
| M-5 | i18n ko/en 2건 추가 | `grep -c 'FORM_DATA_PARSE_FAILED' apps/frontend/messages/ko/errors.json` ≥ 1 AND en ≥ 1 |
| M-6 | backend tsc PASS | `pnpm -C apps/backend exec tsc --noEmit` exit 0 |
| M-7 | frontend tsc PASS | `pnpm -C apps/frontend exec tsc --noEmit` exit 0 |
| M-8 | backend test PASS | `pnpm --filter backend run test` exit 0 |
| M-9 | backend build PASS | `pnpm --filter backend run build` exit 0 |
| M-10 | backend lint PASS | `pnpm --filter backend run lint` 0 errors |

## SHOULD Criteria

| # | Criterion |
|---|---|
| S-1 | verify-zod Step 16 명령 #1 주석이 "0건" 반영됨 |
| S-2 | E2E/integration spec에서 approveCalibrationFactor 호출이 approverComment 없이도 성공하는지 확인 |
