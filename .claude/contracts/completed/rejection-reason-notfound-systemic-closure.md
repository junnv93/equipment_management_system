# 스프린트 계약: rejection-reason + NOT_FOUND ErrorCode systemic closure

## 생성 시점
2026-05-02T14:30:00+09:00

## 배경
equipment domain 3건 sprint에서 타입 타협(notFoundCode: string)과 checkout/multi-domain 동일 패턴 잔존이 확인됨.
systemic closure 목적: versioned-base type safety + checkout rejection defense-in-depth + 6개 도메인 NOT_FOUND SSOT.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### M1: ErrorCode enum 신규 6개 + 404 mapping
```bash
grep -c 'CableNotFound' packages/schemas/src/errors.ts           # >= 2 (enum + mapping)
grep -c 'CalibrationPlanNotFound' packages/schemas/src/errors.ts # >= 2
grep -c 'EquipmentImportNotFound' packages/schemas/src/errors.ts # >= 2
grep -c 'NonConformanceNotFound' packages/schemas/src/errors.ts  # >= 2
grep -c 'SoftwareValidationNotFound' packages/schemas/src/errors.ts # >= 2
grep -c 'TestSoftwareNotFound' packages/schemas/src/errors.ts    # >= 2
```

#### M2: versioned-base notFoundCode 타입 ErrorCode
```bash
grep 'notFoundCode: ErrorCode' apps/backend/src/common/base/versioned-base.service.ts
# → 1행 이상, "string" 키워드 부재
grep 'notFoundCode: string' apps/backend/src/common/base/versioned-base.service.ts
# → 0행
```

#### M3: updateWithVersion 호출자 string literal 0건
```bash
grep -rn "'CABLE_NOT_FOUND'\|'CALIBRATION_PLAN_NOT_FOUND'\|'IMPORT_NOT_FOUND'\|'EQUIPMENT_NOT_FOUND'\|'NC_NOT_FOUND'\|'SOFTWARE_VALIDATION_NOT_FOUND'\|'TEST_SOFTWARE_NOT_FOUND'" \
  apps/backend/src/modules/ --include="*.ts" | grep -v "__tests__\|spec"
# → 0행
```

#### M4: Checkout DTOs 3개 — .min(REJECTION_REASON_MIN_LENGTH)
```bash
grep -c 'REJECTION_REASON_MIN_LENGTH' apps/backend/src/modules/checkouts/dto/reject-checkout.dto.ts     # >= 1
grep -c 'REJECTION_REASON_MIN_LENGTH' apps/backend/src/modules/checkouts/dto/reject-return.dto.ts       # >= 1
grep -c 'REJECTION_REASON_MIN_LENGTH' apps/backend/src/modules/checkouts/dto/borrower-reject-checkout.dto.ts # >= 1
# min(1) 잔존 확인
grep 'min(1,' apps/backend/src/modules/checkouts/dto/reject-checkout.dto.ts      # → 0행
grep 'min(1,' apps/backend/src/modules/checkouts/dto/reject-return.dto.ts        # → 0행
grep 'min(1,' apps/backend/src/modules/checkouts/dto/borrower-reject-checkout.dto.ts # → 0행
```

#### M5: Checkout service fail-close 3곳 — < REJECTION_REASON_MIN_LENGTH
```bash
grep -c 'REJECTION_REASON_MIN_LENGTH' apps/backend/src/modules/checkouts/checkouts.service.ts # >= 3
grep -n 'trim().length === 0' apps/backend/src/modules/checkouts/checkouts.service.ts          # → 0행
```

#### M6: schemas build PASS
```bash
pnpm --filter schemas run build
```

#### M7: backend test PASS
```bash
pnpm --filter backend run test
```

#### M8: tsc PASS
```bash
pnpm --filter backend run tsc --noEmit
```

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] checkout 서비스 fail-close ErrorCode enum 사용 (inline string 0건)

### 적용 verify 스킬
- verify-zod (Zod 체인 검증)
- verify-ssot (SSOT 드리프트)
- verify-hardcoding (하드코딩 검증)

### 스코프 외 (이번 sprint 제외)
- revoke-approval.dto.ts `.min(1)` — 철회 사유 도메인 정책 확인 필요
- document/user 도메인 inline code 리터럴
- frontend error mapper 신규 ErrorCode 반영
