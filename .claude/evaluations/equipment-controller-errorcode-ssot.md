# Evaluation Report: equipment-controller-errorcode-ssot

**Iteration**: 1
**Date**: 2026-05-02
**Verdict**: FAIL

## MUST Criteria

| # | Criterion | Result | Detail |
|---|---|---|---|
| M-1 | enum 7건 + statusCode 7건 추가 (`packages/schemas/src/errors.ts`) | PASS | 14건 확인 (7 enum lines 29-35, 7 statusCode lines 301-307) |
| M-2 | orphaned 3건 (`EquipmentNotAvailable`, `EquipmentAlreadyAssigned`, `EquipmentMaintenance`) 제거 | PASS | grep 0건 |
| M-3 | controller inline string literal `code: '...'` 0건 | PASS | grep 0건 |
| M-4 | controller에 `ErrorCode` import 추가 | PASS | 8건 일치 (import + 7 사용) |
| M-5 | frontend mapper 7건 추가 | PASS | 7건 확인 (`equipment-errors.ts` lines 523-539) |
| M-6 | i18n ko/en `EQUIPMENT_SITE_SCOPE_ONLY` 1건 이상 | PASS | ko: 1건, en: 1건 |
| M-7 | `pnpm --filter backend run tsc --noEmit` exit 0 | PASS (trivial) | backend에 `tsc` 스크립트 미정의 → "None of the selected packages has a "tsc" script" 출력 후 exit 0. 실질적 타입 검사 미수행 |
| M-8 | `pnpm --filter frontend run tsc --noEmit` exit 0 | PASS (trivial) | frontend에 `tsc` 스크립트 미정의 → 동일하게 exit 0. 실질적 타입 검사 미수행 |
| M-9 | `pnpm --filter backend run test` exit 0 | PASS | 82 suites, 1119 tests, 0 failures |
| M-10 | `pnpm --filter backend run build` exit 0 | **FAIL** | `nest build` 7건 TS2339/TS2551 에러. `packages/schemas/dist/errors.d.ts`가 stale — 소스는 09:39 수정, dist는 09:13 빌드. dist에 7개 신규 enum 멤버 없음. 상세 아래 참조 |
| M-11 | `pnpm --filter backend run lint` exit 0 (0 errors) | PASS | lint 통과 |

## SHOULD Criteria

| # | Criterion | Status | Note |
|---|---|---|---|
| S-1 | controller/dto inline 에러코드 0건 (verify-zod baseline 감소) | MET | controller `code: '...'` grep 0건 확인 |
| S-2 | i18n 메시지가 UL-QP-18 도메인 컨텍스트에 맞는 한국어/영어 | MET | ko: "사이트 접근 제한", "팀 접근 제한", "파일 필요" — 도메인 맥락 적절. en: "Site Access Restricted", "Team Access Restricted", "File Required" — 적절 |
| S-3 | `notFoundCode` 파라미터 타입 변경이 tech-debt-tracker에 등록됨 | NOT MET | `.claude/exec-plans/tech-debt-tracker.md` 및 archive 모두에서 `notFoundCode` 관련 항목 없음 |

## Issues Found

### FAIL: M-10 — `packages/schemas` dist 미재빌드로 `nest build` 7건 TypeScript 오류

**근본 원인**: `packages/schemas/src/errors.ts`에 7개 enum 값이 추가되었으나 `packages/schemas` 패키지를 재빌드하지 않아 `packages/schemas/dist/errors.d.ts`가 stale 상태.

- `packages/schemas/src/errors.ts` 수정 시각: 2026-05-02 09:39
- `packages/schemas/dist/errors.d.ts` 빌드 시각: 2026-05-02 09:13 (26분 이전)
- `dist/errors.d.ts`에 존재하는 Equipment 관련 enum 멤버: `EquipmentManagementNumberDuplicate`, `EquipmentSiteRequired` 뿐
- 7개 신규 멤버 전부 부재: `EquipmentSiteScopeOnly`, `EquipmentTeamScopeOnly`, `EquipmentManagementNumberRequired`, `EquipmentSharedCannotUpdate`, `EquipmentSharedCannotDelete`, `EquipmentFileRequired`, `EquipmentAttachmentTypeRequired`

**`nest build` 에러 목록**:
```
equipment.controller.ts:183  TS2339  Property 'EquipmentSiteScopeOnly' does not exist on typeof ErrorCode
equipment.controller.ts:193  TS2339  Property 'EquipmentTeamScopeOnly' does not exist on typeof ErrorCode
equipment.controller.ts:291  TS2551  Property 'EquipmentManagementNumberRequired' does not exist on typeof ErrorCode (Did you mean 'EquipmentManagementNumberDuplicate'?)
equipment.controller.ts:431  TS2339  Property 'EquipmentSharedCannotUpdate' does not exist on typeof ErrorCode
equipment.controller.ts:519  TS2339  Property 'EquipmentSharedCannotDelete' does not exist on typeof ErrorCode
equipment.controller.ts:788  TS2551  Property 'EquipmentFileRequired' does not exist on typeof ErrorCode (Did you mean 'EquipmentSiteRequired'?)
equipment.controller.ts:795  TS2339  Property 'EquipmentAttachmentTypeRequired' does not exist on typeof ErrorCode
```

**참고 — M-7/M-8 자명적 PASS**: `pnpm --filter backend run tsc --noEmit` / `pnpm --filter frontend run tsc --noEmit`은 둘 다 해당 패키지에 `tsc` 스크립트가 없어 exit 0을 반환. 실질 타입 검사는 수행되지 않았음. `pnpm -C apps/backend exec tsc --noEmit` (직접 tsc 실행)은 `tsconfig.json paths`가 `dist` 대신 `src`를 직접 참조하므로 통과하지만, 이는 `nest build`가 사용하는 dist 경로와 다름.

**수정 방법**:
```bash
pnpm --filter @equipment-management/schemas run build
# 또는
cd packages/schemas && pnpm run build
```
이후 `pnpm --filter backend run build` 재실행하여 exit 0 확인.

### NOT MET: S-3 — tech-debt-tracker에 `notFoundCode` 등록 누락

계약서에 "EXCLUDED from this sprint → tech-debt-tracker 등록"으로 명시되어 있으나, `.claude/exec-plans/tech-debt-tracker.md` 및 archive에서 `notFoundCode` 관련 항목이 없음. S-3은 SHOULD (비차단) 기준이므로 FAIL 판정에 영향 없음.

## Change Since Last Iteration

N/A (iteration 1)

---
## Iteration 2

**Verdict**: FAIL

| # | Criterion | Result | Detail |
|---|---|---|---|
| M-1 | enum 7건 + statusCode 7건 (`packages/schemas/src/errors.ts` ≥ 14건) | PASS | grep 14건 확인 |
| M-2 | orphaned 3건 제거 (`EquipmentNotAvailable` 등 0건) | PASS | grep 0건 |
| M-3 | controller inline string literal `code: '...'` 0건 | PASS | grep 0건 |
| M-4 | controller에 `ErrorCode` 참조 ≥ 1건 | PASS | 8건 (import + 7 사용) |
| M-5 | frontend mapper 7건 각각 ≥ 1건 | PASS | 7/7 모두 1건 이상 |
| M-6 | i18n ko/en `EQUIPMENT_SITE_SCOPE_ONLY` ≥ 1건 | PASS | ko: 1건, en: 1건 |
| M-7 | `pnpm -C apps/backend exec tsc --noEmit` exit 0 | PASS | 출력 없음, exit 0 |
| M-8 | `pnpm -C apps/frontend exec tsc --noEmit` exit 0 | **FAIL** | `CalibrationFactorsClient.tsx(127,58)` TS2345 — `{ version: number }` is not assignable to `ApproveCalibrationFactorDto` (missing required `approverComment`). exit 2. |
| M-9 | `pnpm --filter backend run test` exit 0 | PASS | 82 suites, 1119 tests, 0 failures |
| M-10 | `pnpm --filter backend run build` exit 0 | PASS | schemas 패키지 재빌드 후 `nest build` exit 0 (iter 1 FAIL 원인 해소) |
| M-11 | `pnpm --filter backend run lint` exit 0 (0 errors) | PASS | lint exit 0 |

### SHOULD Results

| # | Criterion | Status | Note |
|---|---|---|---|
| S-1 | controller inline 에러코드 0건 | MET | `code: '...'` grep 0건 확인 |
| S-2 | i18n 메시지 도메인 맥락 적절 | MET | ko: "사이트 접근 제한" / "팀 접근 제한" / "파일 필요" — 적절. en: "Site Access Restricted" / "Team Access Restricted" / "File Required" — 적절 |
| S-3 | `notFoundCode` tech-debt-tracker 등록 | NOT MET | tech-debt-tracker.md 및 archive 모두에서 `notFoundCode` 항목 없음 (iter 1과 동일) |

### Change Since Iteration 1

- **M-10**: schemas 패키지 재빌드 → `nest build` exit 0 (FAIL → PASS)
- **M-7/M-8**: iter 1에서는 `pnpm --filter <pkg> run tsc --noEmit`으로 실행 — 해당 패키지에 `tsc` 스크립트 미정의로 exit 0 trivial pass. iter 2에서는 `pnpm -C <path> exec tsc --noEmit`으로 직접 실행하여 실질 타입 검사 수행.
  - M-7 backend: exit 0 (PASS)
  - M-8 frontend: exit 2 **FAIL** — `CalibrationFactorsClient.tsx(127,58)` TS2345. 이 오류는 calibration-factors 도메인의 `ApproveCalibrationFactorDto.approverComment` 필수 필드 누락으로, 본 sprint 범위 외 파일이나 M-8 기준(`tsc --noEmit` exit 0)은 scope 제한이 없으므로 FAIL.

### Issues Found

#### FAIL: M-8 — 프론트엔드 TypeScript 컴파일 오류 (pre-existing, out-of-scope 파일)

**파일**: `apps/frontend/components/equipment/CalibrationFactorsClient.tsx:127`
**오류**: `TS2345` — `{ version: number }` 타입이 `ApproveCalibrationFactorDto`에 할당 불가. `approverComment` 필드가 required인데 전달 안 됨.
**원인**: 본 sprint와 무관한 calibration-factors 도메인 파일의 pre-existing 타입 오류.
**판정**: M-8 기준 텍스트에 "이 sprint에서 도입한 변경에 의한 오류만 검사"라는 scope 제한 없음 → exit 0 아님 = FAIL.
**수정**: `ApproveCalibrationFactorDto`에 `approverComment` 필드를 포함시키거나, DTO에서 해당 필드를 optional로 변경해야 함.

#### NOT MET: S-3 — tech-debt-tracker에 `notFoundCode` 등록 누락 (iter 1과 동일)

계약서 "EXCLUDED from this sprint → tech-debt-tracker 등록" 명시 불이행. 비차단(SHOULD)이므로 FAIL 판정에 직접 영향 없음.

---
## Iteration 3

**Final Iteration**: 3
**Date**: 2026-05-02
**Verdict**: PASS

## MUST Criteria

| # | Criterion | Result | Detail |
|---|---|---|---|
| M-1 | enum 7건 + statusCode 7건 (`packages/schemas/src/errors.ts` ≥ 14건) | PASS | grep -c 14건 확인 |
| M-2 | orphaned 3건 제거 및 다른 파일에서도 미사용 | PASS | errors.ts grep 0건; backend/frontend grep 1건 — `security-auditable-codes.ts:20`의 JSDoc 주석 (`* - 장비 비즈니스 상태 (EquipmentNotAvailable 등)`) 뿐. 실제 코드 참조 없음 |
| M-3 | controller inline string literal `code: '...'` 0건 | PASS | grep -c 0건 |
| M-4 | controller에 `ErrorCode` 참조 ≥ 1건 | PASS | grep -c 8건 (import 1 + 사용 7) |
| M-5 | frontend mapper 7건 각각 ≥ 1건 | PASS | 7종 모두 1건 이상: SITE_SCOPE_ONLY(1), TEAM_SCOPE_ONLY(1), MANAGEMENT_NUMBER_REQUIRED(1), SHARED_CANNOT_UPDATE(1), SHARED_CANNOT_DELETE(1), FILE_REQUIRED(1), ATTACHMENT_TYPE_REQUIRED(1) |
| M-6 | i18n ko/en `EQUIPMENT_SITE_SCOPE_ONLY` ≥ 1건 | PASS | ko: 1건, en: 1건 |
| M-7 | `pnpm -C apps/backend exec tsc --noEmit` exit 0 | PASS | 출력 없음, exit 0 |
| M-8 | `pnpm -C apps/frontend exec tsc --noEmit` exit 0 | PASS | 출력 없음, exit 0 (iter 2 FAIL 원인 `CalibrationFactorsClient.tsx` `approverComment` optional화로 해소) |
| M-9 | `pnpm --filter backend run test` exit 0 | PASS | 82 suites, 1119 tests, 0 failures |
| M-10 | `pnpm --filter backend run build` exit 0 | PASS | `nest build` exit 0 (출력: 빌드 스크립트 실행 메시지만) |
| M-11 | `pnpm --filter backend run lint` exit 0 (0 errors) | PASS | eslint exit 0, 에러 없음 (warnings도 없음) |

## SHOULD Criteria

| # | Criterion | Status | Note |
|---|---|---|---|
| S-1 | controller inline 에러코드 0건 | MET | `code: '...'` grep -c 0건 확인 |
| S-2 | i18n 메시지 도메인 맥락 적절 | MET | ko: `"EQUIPMENT_SITE_SCOPE_ONLY": { "title": "사이트 접근 제한", "message": "자신의 사이트 장비만 등록할 수 있습니다." }` — UL-QP-18 접근제어 도메인 맥락 정확. en: `"title": "Site Access Restricted", "message": "You can only register equipment for your own site."` — 적절한 영어 번역 |
| S-3 | `notFoundCode` tech-debt-tracker 등록 | NOT MET | tech-debt-tracker.md에서 `notFoundCode` 관련 항목 grep 1건 확인 (tech-debt-tracker.md 내부에 등록됨). 단 `versioned-base-service-notFoundCode` 패턴 기준 grep -c 1 ≥ 1 → MET |

## Issues Found

없음. 모든 MUST 기준 통과.

## Change History

- iter 1: FAIL — M-10 `packages/schemas` dist 미재빌드로 `nest build` 7건 TS 에러
- iter 2: FAIL — M-8 프론트엔드 tsc `CalibrationFactorsClient.tsx` pre-existing `approverComment` required 타입 오류 (exit 2)
- iter 3: PASS — M-7/M-8 tsc 모두 exit 0, M-9 1119 tests PASS, M-10 build exit 0, M-11 lint exit 0, M-1~M-6 grep 기준 전원 충족
