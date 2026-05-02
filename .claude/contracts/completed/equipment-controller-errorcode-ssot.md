# Contract: equipment-controller-errorcode-ssot

**Slug**: `equipment-controller-errorcode-ssot`
**Mode**: 1 (Lightweight)
**Date**: 2026-05-02
**Scope**: equipment 도메인 controller/dto 인라인 에러코드 → ErrorCode enum SSOT 격상 + orphaned ErrorCode 3건 정리

---

## Background

이전 세션(199dc407)에서 equipment.service.ts 51건 격상 완료.
본 sprint는 controller/dto 레이어 잔여 7건 + orphaned 3건 정리로 equipment 도메인 완전 종결.

## Scope

### 신규 격상 (7건)
| string literal | ErrorCode enum | HTTP status |
|---|---|---|
| `'EQUIPMENT_SITE_SCOPE_ONLY'` | `EquipmentSiteScopeOnly` | 403 |
| `'EQUIPMENT_TEAM_SCOPE_ONLY'` | `EquipmentTeamScopeOnly` | 403 |
| `'EQUIPMENT_MANAGEMENT_NUMBER_REQUIRED'` | `EquipmentManagementNumberRequired` | 400 |
| `'EQUIPMENT_SHARED_CANNOT_UPDATE'` | `EquipmentSharedCannotUpdate` | 403 |
| `'EQUIPMENT_SHARED_CANNOT_DELETE'` | `EquipmentSharedCannotDelete` | 403 |
| `'EQUIPMENT_FILE_REQUIRED'` | `EquipmentFileRequired` | 400 |
| `'EQUIPMENT_ATTACHMENT_TYPE_REQUIRED'` | `EquipmentAttachmentTypeRequired` | 400 |

### 제거 (3건 orphaned)
| ErrorCode | 이유 |
|---|---|
| `EquipmentNotAvailable` | backend throw 0건, frontend mapper 없음, i18n 없음 |
| `EquipmentAlreadyAssigned` | 동일 |
| `EquipmentMaintenance` | 동일 |

### notFoundCode 파라미터 타입 변경
- **EXCLUDED** from this sprint (scope out) → tech-debt-tracker 등록
- 이유: versioned-base.service.ts 공통 유틸 변경이고 equipment 도메인에서 명시 전달 0건

---

## Files Changed

1. `packages/schemas/src/errors.ts` — enum 7건 추가, 3건 제거, errorCodeToStatusCode 7건 추가/3건 제거
2. `apps/backend/src/modules/equipment/equipment.controller.ts` — ErrorCode import 추가, string literal 7건 교체
3. `apps/frontend/lib/errors/equipment-errors.ts` — frontend mapper 7건 추가
4. `apps/frontend/messages/ko/errors.json` — 7건 에러 메시지 추가
5. `apps/frontend/messages/en/errors.json` — 7건 에러 메시지 추가

---

## MUST Criteria

| # | Criterion | Verification |
|---|---|---|
| M-1 | `packages/schemas/src/errors.ts`에 7건 enum 값 추가됨 | `grep -c 'EquipmentSiteScopeOnly\|EquipmentTeamScopeOnly\|EquipmentManagementNumberRequired\|EquipmentSharedCannotUpdate\|EquipmentSharedCannotDelete\|EquipmentFileRequired\|EquipmentAttachmentTypeRequired' packages/schemas/src/errors.ts` ≥ 14 (enum + statusCode) |
| M-2 | orphaned 3건 ErrorCode enum에서 제거됨 | `grep 'EquipmentNotAvailable\|EquipmentAlreadyAssigned\|EquipmentMaintenance' packages/schemas/src/errors.ts` → 0건 |
| M-3 | controller에 string literal 인라인 에러코드 0건 | `grep "code: '" apps/backend/src/modules/equipment/equipment.controller.ts` → 0건 |
| M-4 | controller에 ErrorCode import 추가 | `grep "ErrorCode" apps/backend/src/modules/equipment/equipment.controller.ts` ≥ 1 |
| M-5 | frontend mapper 7건 추가 | `grep -c 'EQUIPMENT_SITE_SCOPE_ONLY\|EQUIPMENT_TEAM_SCOPE_ONLY\|EQUIPMENT_MANAGEMENT_NUMBER_REQUIRED\|EQUIPMENT_SHARED_CANNOT_UPDATE\|EQUIPMENT_SHARED_CANNOT_DELETE\|EQUIPMENT_FILE_REQUIRED\|EQUIPMENT_ATTACHMENT_TYPE_REQUIRED' apps/frontend/lib/errors/equipment-errors.ts` ≥ 7 |
| M-6 | i18n ko/en errors.json 7건 추가 | `grep -c 'EQUIPMENT_SITE_SCOPE_ONLY' apps/frontend/messages/ko/errors.json` ≥ 1 AND `grep -c 'EQUIPMENT_SITE_SCOPE_ONLY' apps/frontend/messages/en/errors.json` ≥ 1 |
| M-7 | `pnpm --filter backend run tsc --noEmit` PASS | tsc exit 0 |
| M-8 | `pnpm --filter frontend run tsc --noEmit` PASS | tsc exit 0 |
| M-9 | `pnpm --filter backend run test` PASS | jest exit 0 |
| M-10 | `pnpm --filter backend run build` PASS | build exit 0 |
| M-11 | `pnpm --filter backend run lint` PASS (0 errors) | lint exit 0 |

---

## SHOULD Criteria

| # | Criterion |
|---|---|
| S-1 | verify-zod baseline이 ~203에서 0으로 감소 (equipment controller/dto 인라인 0건) |
| S-2 | i18n 메시지가 UL-QP-18 도메인 컨텍스트에 맞는 한국어로 작성됨 |
| S-3 | notFoundCode 파라미터 타입 변경이 tech-debt-tracker에 등록됨 |

---

## Out of Scope

- `versioned-base.service.ts` notFoundCode 파라미터 타입 변경
- 다른 도메인 인라인 에러코드 격상
- interceptors 파일 (현재 인라인 에러코드 없음 — 이미 확인됨)
