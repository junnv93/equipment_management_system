# 스프린트 계약: backend-errorcode-full-closure

## 생성 시점
2026-05-02T16:00:00+09:00

## 배경
직전 sprint(`rejection-reason-notfound-systemic-closure`)는 `versioned-base.service.ts`의 `notFoundCode: ErrorCode` 타입을 강제하여 CAS 진입 경로의 SSOT를 닫았다. 그러나 (1) 직접 `throw new XException({ code: 'STRING' })` 형태로 작성된 ~148건의 inline string literal이 backend 18 디렉토리에 잔존하고, (2) NC 도메인에서 `'NON_CONFORMANCE_NOT_FOUND'`(string) ↔ `ErrorCode.NonConformanceNotFound = 'NC_NOT_FOUND'`(enum) 불일치 critical bug가 확인되었으며, (3) 7개 신규 NotFound 코드가 frontend mapper에 반영되지 않아 generic fallback으로 처리되고 있다.

본 sprint는 backend 전체 SSOT 종결 + critical bug fix + frontend 5-layer defense-in-depth 완성을 목표로 한다.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### M1: NC NotFound 불일치 버그 수정 (Phase 1, critical bug)
```bash
# 잘못된 string literal 0건
grep -c "'NON_CONFORMANCE_NOT_FOUND'" apps/backend/src/modules/non-conformances/non-conformances.service.ts
# → 0
# 올바른 enum 사용 1건 이상
grep -c "ErrorCode.NonConformanceNotFound" apps/backend/src/modules/non-conformances/non-conformances.service.ts
# → >= 1
```

#### M2: ErrorCode enum 신규 코드 통합 (Phase 2-3)
```bash
# auth 도메인 신규 enum (alias 제외 ≥ 17건)
grep -cE "Auth(SseTokenRequired|AccessTokenOnly|TokenBlacklisted|InvalidToken|UserIdMissing|InvalidSession|ProductionAzureOnly|AccountLocked|AzureAdFailed|UserNotFound|InvalidRefreshToken|RefreshNoUser|RefreshExpired|PermissionsNotConfigured|Required|InsufficientPermissions|UserInactive|UserInfoMissing) =" packages/schemas/src/errors.ts
# → >= 17

# domain 신규 enum 핵심 키워드
grep -c "CheckoutNotFound\|DocumentNotFound\|TeamNameAlreadyExists\|UserEmailAlreadyExists\|InspectionTemplateNotFound\|NotificationNotFound\|CableLossMeasurementNotFound\|TestSoftwareEquipmentAlreadyLinked" packages/schemas/src/errors.ts
# → >= 8 (각 신규 enum 1건 이상)

# errorCodeToStatusCode Record completeness — Record<ErrorCode, number> 컴파일 강제로 자동 보장
pnpm --filter schemas run build
# → exit 0
```

#### M3: backend 전체 inline string literal 0건 (Phase 4-6)
```bash
# code: 'STRING_LITERAL' 패턴 backend 전체 0건 (test 디렉토리 제외)
grep -rn "code: '[A-Z_]\+'" apps/backend/src --include="*.ts" \
  | grep -v "__tests__\|\.spec\.\|\.test\." \
  | wc -l
# → 0
```

#### M4: 디렉토리별 0 inline 검증
```bash
# common/ + auth/
grep -rn "code: '[A-Z_]\+'" apps/backend/src/common apps/backend/src/modules/auth apps/backend/src/modules/approvals --include="*.ts" \
  | grep -v "__tests__\|\.spec\." | wc -l
# → 0

# user-facing 도메인 (Phase 5)
grep -rn "code: '[A-Z_]\+'" \
  apps/backend/src/modules/users \
  apps/backend/src/modules/teams \
  apps/backend/src/modules/documents \
  apps/backend/src/modules/calibration \
  --include="*.ts" | grep -v "__tests__\|\.spec\." | wc -l
# → 0

# 나머지 도메인 (Phase 6)
grep -rn "code: '[A-Z_]\+'" \
  apps/backend/src/modules/non-conformances \
  apps/backend/src/modules/intermediate-inspections \
  apps/backend/src/modules/self-inspections \
  apps/backend/src/modules/checkouts \
  apps/backend/src/modules/inspection-form-templates \
  apps/backend/src/modules/notifications \
  apps/backend/src/modules/reports \
  apps/backend/src/modules/equipment-imports \
  apps/backend/src/modules/software-validations \
  apps/backend/src/modules/test-software \
  apps/backend/src/modules/cables \
  --include="*.ts" | grep -v "__tests__\|\.spec\." | wc -l
# → 0
```

#### M5: 7 NotFound 코드 equipment mapper에 반영 (Phase 7.1)
```bash
# 7 NotFound + ENTITY_NOT_FOUND mapping 존재
grep -c "CABLE_NOT_FOUND:\s*EquipmentErrorCode" apps/frontend/lib/errors/equipment-errors.ts            # >= 1
grep -c "NC_NOT_FOUND:\s*EquipmentErrorCode" apps/frontend/lib/errors/equipment-errors.ts                # >= 1
grep -c "SOFTWARE_VALIDATION_NOT_FOUND:\s*EquipmentErrorCode" apps/frontend/lib/errors/equipment-errors.ts # >= 1
grep -c "TEST_SOFTWARE_NOT_FOUND:\s*EquipmentErrorCode" apps/frontend/lib/errors/equipment-errors.ts     # >= 1
grep -c "INTERMEDIATE_INSPECTION_NOT_FOUND:\s*EquipmentErrorCode" apps/frontend/lib/errors/equipment-errors.ts # >= 1
grep -c "SELF_INSPECTION_NOT_FOUND:\s*EquipmentErrorCode" apps/frontend/lib/errors/equipment-errors.ts   # >= 1
grep -c "TEST_PLAN_NOT_FOUND:\s*EquipmentErrorCode" apps/frontend/lib/errors/equipment-errors.ts         # >= 1
grep -c "ENTITY_NOT_FOUND:\s*EquipmentErrorCode" apps/frontend/lib/errors/equipment-errors.ts            # >= 1
```

#### M6: 신규 도메인 mapper 5건 (Phase 7.2)
```bash
ls apps/frontend/lib/errors/checkout-errors.ts        # exists
ls apps/frontend/lib/errors/cable-errors.ts            # exists
ls apps/frontend/lib/errors/notification-errors.ts     # exists
ls apps/frontend/lib/errors/team-errors.ts             # exists
ls apps/frontend/lib/errors/user-errors.ts             # exists

# 각 mapper에 mapBackendErrorCode 또는 mapXErrorToToast 함수 존재
grep -l "mapBackendErrorCode\|mapErrorToToast" \
  apps/frontend/lib/errors/checkout-errors.ts \
  apps/frontend/lib/errors/cable-errors.ts \
  apps/frontend/lib/errors/notification-errors.ts \
  apps/frontend/lib/errors/team-errors.ts \
  apps/frontend/lib/errors/user-errors.ts | wc -l
# → 5
```

#### M7: i18n ko/en parity (Phase 7.3)
```bash
# 각 신규/확장 namespace의 errors 섹션이 양 로케일에 존재
for f in non-conformances checkouts cables notifications teams auth; do
  ko=$(grep -c '"errors"' apps/frontend/messages/ko/$f.json)
  en=$(grep -c '"errors"' apps/frontend/messages/en/$f.json)
  echo "$f: ko=$ko en=$en (must each be >= 1)"
  test "$ko" -ge 1 && test "$en" -ge 1
done
```

#### M8: schemas build PASS
```bash
pnpm --filter schemas run build
```

#### M9: backend tsc + test PASS
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
```

#### M10: frontend tsc + test PASS
```bash
pnpm --filter frontend tsc --noEmit
pnpm --filter frontend run test
```

#### M11: NC mapper에 7 신규 NC 코드 반영 (시정 — direct bug fix)
```bash
# NonConformanceNotFound + 신규 NC ErrorCode가 NC mapper에 라우팅
grep -c "NonConformanceNotFound\|NcEquipmentAlreadyNonConforming\|NcRepairAlreadyLinked\|NcRepairRecordRequired\|NcRecalibrationRequired\|NcTypeRequired" apps/frontend/lib/errors/non-conformance-errors.ts
# → >= 5 (M1 critical bug 시정 — generic fallback이 아닌 specific 메시지 노출)
```

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] review-architecture Critical 이슈 0개
- [ ] backend e2e 회귀 0건 (`pnpm --filter frontend run test:e2e -- --workers=4`)
- [ ] AppError 팩토리 확장 (`AppError.scopeDenied()`, `AppError.fileRequired()`, `AppError.notFoundFor(domain)`) — 호출자 캡슐화로 차세대 회귀 차단
- [ ] auth 도메인 mapper(`auth-errors.ts`) 신설 + i18n auth.json errors namespace — 로그인 화면 사용자 메시지 정합
- [ ] verify-zod Step 17(전체 inline literal 0 invariant) 신설 + pre-push hook 통합 — 회귀 차단
- [ ] alias enum 결정 doc comment (`SessionExpired` ↔ `AuthSessionExpired`, `InvalidCredentials` ↔ `AuthInvalidCredentials`, `EmailAlreadyExists` ↔ `UserEmailAlreadyExists`, `ScopeAccessDenied` ↔ `ScopeDenied`)
- [ ] mapper 단위 테스트(`apps/frontend/lib/errors/__tests__/`) — 5 신규 mapper 각 1건 이상

### 적용 verify 스킬
- verify-zod (Zod 체인 + ErrorCode SSOT 검증)
- verify-ssot (SSOT 드리프트 — 본 sprint 핵심)
- verify-hardcoding (string literal 검증)
- review-architecture (전체 5-layer 의미적 완결성)

### 스코프 외 (이번 sprint 제외)
- `revoke-approval.dto.ts` `.min(1)` — 철회 사유 정책 미정 (직전 sprint 보류분 그대로 보류)
- `monitoring`, `dashboard`, `data-migration` admin-only mapper 신설 (사용자 노출 빈도 낮음)
- 도메인별 ErrorCode → MUST severity/actionLabel 정밀화 (현재는 NOT_FOUND 일괄 매핑)
- AppError 팩토리 호출자 전면 전환 (option SHOULD)
- 미사용 dual-naming string literal 정리 (`ENDPOINT_DEPRECATED`, `INVALID_DOCUMENT_TYPE` 등)
- e2e spec 신설 (5 신규 mapper toast 텍스트 단위 검증) — Phase 7.4 frontend test에 통합 가정
