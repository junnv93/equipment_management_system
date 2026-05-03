# Scope & Identity — verify-checkout-fsm references

> 2026-05-03 verify-checkout-fsm 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> 대상: checkout-scope, identity-rule, items[0] 패턴, lenderTeam/borrower, CheckoutErrorCode SSOT, outbound predicate

## Step 16: CheckoutErrorCode SSOT — 인라인 에러 코드 문자열 금지 (2026-04-22 이후)

`checkouts.service.ts`와 `checkouts.controller.ts`에서 `code: 'CHECKOUT_*'` 인라인 문자열을 사용하지 않고 `CheckoutErrorCode` 상수를 경유하는지 확인.

```bash
# service.ts 인라인 에러 코드 문자열 탐지
grep -c "code: 'CHECKOUT_" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0 (PASS)

# controller.ts 인라인 에러 코드 문자열 탐지
grep -c "code: 'CHECKOUT_" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts
# 결과: 0 (PASS)

# CheckoutErrorCode import 확인
grep "from './checkout-error-codes'" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: import 라인 1건 (PASS)
```

**PASS:** service.ts + controller.ts 모두 인라인 `'CHECKOUT_*'` 문자열 0건, `CheckoutErrorCode` import 존재.
**FAIL:** 인라인 문자열 1건 이상 → `checkout-error-codes.ts`에 해당 키 추가 후 참조 전환.

## Step 17: Controller 레이어 경계 — 서비스 중복 검증 금지 (2026-04-22 이후)

컨트롤러가 서비스 레이어의 비즈니스 검증을 복제하지 않는지 확인. reject 반려 사유 검증이 컨트롤러에서 다시 수행되면 에러 메시지가 달라지는 드리프트가 발생한다.

```bash
# controller에서 reason 빈 문자열 직접 검증 탐지
grep -n "reason.*trim\|reason.*length.*0" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts
# 결과: 0건 (PASS) — 서비스 단일 경로

# controller의 BadRequestException 사용이 서비스 로직 복제가 아닌지 확인
grep -n "BadRequestException" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts
# 허용: handover token 상태 검증 등 컨트롤러 전용 흐름
# 금지: 서비스와 동일한 code/message로 throw
```

**PASS:** controller에 `reason.*trim` 패턴 0건. 서비스가 비즈니스 검증 단일 경로.
**FAIL:** controller에서 서비스와 동일한 코드/메시지로 BadRequestException throw → 컨트롤러 블록 제거.

## Step 18: lenderTeam identity-rule 강제 패턴 — approverTeamId 바이패스 금지 (2026-04-22 이후)

RENTAL + lenderTeamId 조건 성립 시 `approverTeamId`의 존재 유무와 **무관하게** identity 검증이 실행되어야 한다.
`&& approverTeamId` 조건이 외부 if에 포함되면 팀 미소속 사용자가 바이패스 가능.

`approve`만 RENTAL identity-rule 대상 (rejectReturn의 identity-rule은 `approve`와 동일 진입점에서 처리).

```bash
# approve: 올바른 패턴 — 외부 조건에 approverTeamId 없어야 함
grep -A3 "purpose.*RENTAL.*lenderTeamId\|lenderTeamId.*purpose.*RENTAL" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -v "approverTeamId" | head -5
# 기대: 'if (checkout.purpose === CPVal.RENTAL && checkout.lenderTeamId)' 형태 존재

# 구버전 바이패스 패턴 탐지 (금지)
grep -n "RENTAL.*lenderTeamId.*approverTeamId\|lenderTeamId.*approverTeamId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "if ("
# 결과: 0건 (PASS) — && approverTeamId 외부 조건 잔존 금지

# approve 내부에 !approverTeamId 분기 존재 확인 (1건)
grep -n "!approverTeamId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 1건 이상 (approve identity-rule 분기, PASS)
```

**PASS:** 외부 조건에 `&& approverTeamId` 0건 + `!approverTeamId` 분기 ≥ 1건.
**FAIL:** `if (... && lenderTeamId && approverTeamId)` 형태 잔존 → approverTeamId 조건 제거 후 내부 `!approverTeamId` 분기 추가.

> **Note (2026-04-22):** `rejectReturn`의 `approverTeamId`는 더 이상 DTO 경유가 아닌 `req.user?.teamId` 직접 참조 (Rule 2 패턴 통일). `rejectReturnDto.approverTeamId` 참조는 더 이상 존재하지 않으므로 grep 패턴에서 제거.

## Step 19: NO_EQUIPMENT 가드 배치 — enforceScopeFromData 이전 위치 확인 (2026-04-22 이후)

`approve`, `approveReturn`, `rejectReturn`에서 items가 빈 경우 `enforceScopeFromData`가 묵시적으로 통과되지 않도록
`NO_EQUIPMENT` 가드가 scope 검증 **이전**에 위치해야 한다.

```bash
# NO_EQUIPMENT 가드 존재 확인 (approve + approveReturn + rejectReturn + 기타 포함 4건 이상)
grep -c "NO_EQUIPMENT" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 4 이상 (PASS)

# 가드 패턴: !firstEquip → throw BadRequestException(NO_EQUIPMENT)
grep -n "!firstEquip\|!firstEquipment" apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: approve + approveReturn + rejectReturn 각 1건 이상 (PASS)

# 구버전 묵시적 통과 패턴 탐지 (금지): if (firstEquip) { enforceScopeFromData ...}
grep -n "if (firstEquip)" apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS) — 조건부 scope 검증 금지
```

**PASS:** `NO_EQUIPMENT` 가드 ≥ 4건 + `if (firstEquip)` 패턴 0건.
**FAIL:** `if (firstEquip) { this.enforceScopeFromData(...) }` 잔존 → `!firstEquip` throw 패턴으로 변환.

## Step 20: rejectReturn checkTeamPermission unconditional 패턴 (checkout-lender-guard-p1p3 세션 이후)

`rejectReturn`에서 `checkTeamPermission`이 `approverTeamId` 유무와 무관하게 for 루프 내에서 **무조건** 호출되어야 한다.
`approverTeamId`가 없으면 `approverClassification`이 `undefined`이 되고, `checkTeamPermission`은 `undefined`를 허용해야 한다.
이전 패턴: `if (equip && approverTeamId)` → 승인자 팀 미제공 시 장비 분류 검증 바이패스 가능.

> **2026-04-22 업데이트:** `approverTeamId`는 더 이상 DTO에서 전달받지 않고 `req.user?.teamId` 직접 참조 (Rule 2 통일).
> `if (rejectReturnDto.approverTeamId)` 패턴은 더 이상 존재하지 않으며, `const approverTeamId = req.user?.teamId` + `if (approverTeamId)` 패턴을 사용.

```bash
# rejectReturn 내부에서 approverTeamId = req.user?.teamId 직접 참조 확인 (Rule 2)
grep -A5 "async rejectReturn" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "req.user"
# 기대: req.user?.teamId 참조 라인 존재

# for 루프가 if (approverTeamId) 블록 밖에 위치하는지 확인
grep -A 30 "let approverClassification" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -B5 "checkTeamPermission" | head -15
# 기대: for (const item of items) 루프가 if (approverTeamId) 블록 밖에 위치

# 금지 패턴: rejectReturnDto.approverTeamId DTO 필드 참조 잔존 (Rule 2 위반)
grep -n "rejectReturnDto\.approverTeamId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS) — DTO 필드 경유 금지, req.user?.teamId 직접 참조 필수
```

**PASS:** `rejectReturnDto.approverTeamId` 참조 0건 + `req.user?.teamId` 직접 참조 존재 + `for (const item of items)` 루프가 `if (approverTeamId)` 블록 외부에 위치 + 루프 내 `this.checkTeamPermission(equip, approverClassification)` 호출.
**FAIL:** `rejectReturnDto.approverTeamId` 참조 잔존(Rule 2 위반) 또는 `checkTeamPermission`이 `if (approverTeamId)` 블록 내부에 포함되어 미소속 사용자 장비 분류 검증 바이패스됨.

## Step 21: checkTeamPermission ClassificationEnum SSOT — 하드코딩 금지 (2026-04-22 이후)

`checkTeamPermission`에서 팀 분류 비교 시 `'general_emc'`, `'general_rf'` 문자열 리터럴을 하드코딩하면 안 됩니다.
`ClassificationEnum.enum.general_emc` / `ClassificationEnum.enum.general_rf` SSOT 참조를 사용해야 합니다.

```bash
# ClassificationEnum import 확인
grep -n "ClassificationEnum" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | head -5
# 기대: ClassificationEnum import 라인 존재

# SSOT 참조 확인
grep -n "ClassificationEnum\.enum\." \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: general_emc, general_rf 각 1건 이상

# 하드코딩 잔존 탐지 (금지)
grep -n "'general_emc'\|'general_rf'\|\"general_emc\"\|\"general_rf\"" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS) — 하드코딩 금지
```

**PASS:** `ClassificationEnum` import 존재 + `ClassificationEnum.enum.general_emc/general_rf` 참조 + 하드코딩 0건.
**FAIL:** `'general_emc'` / `'general_rf'` 문자열 리터럴 잔존 → `ClassificationEnum.enum.*` SSOT 참조로 교체.

## Step 22: firstEquip 취득 패턴 — items 배열 순서 기준 (2026-04-24 이후)

`approve`, `approveReturn`, `rejectReturn` 세 메서드에서 `firstEquip`을 취득할 때
`equipmentMap.values().next().value` 패턴은 캐시 혼합 시 `items[0]`과 다른 장비를 반환할 수 있다.
`findByIds`는 캐시 히트 항목을 먼저 Map에 삽입하므로 `values()` 순서가 비결정적이다.
반드시 `equipmentMap.get(items[0].equipmentId)` 패턴을 사용해야 한다.

```bash
# 금지 패턴: values().next().value 취득 (캐시 혼합 시 Map 삽입 순서 비결정성)
grep -n "equipmentMap\.values()\.next()\.value" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS)

# 올바른 패턴 확인: items 배열 순서 기준 취득 (3건 이상)
grep -c "equipmentMap\.get(items\[0\]\.equipmentId)" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 3 이상 (approve + approveReturn + rejectReturn, PASS)
```

**PASS:** `values().next().value` 패턴 0건 + `get(items[0].equipmentId)` 패턴 ≥ 3건.
**FAIL:** `values().next().value` 잔존 → `items.length > 0 ? equipmentMap.get(items[0].equipmentId) : undefined` 패턴으로 교체.

## Step 23: rejectReturn reason 검증 순서 — scope/FSM 이후 위치 (2026-04-24 이후)

`rejectReturn`에서 `reason` 빈값 검증이 `enforceScopeFromData` + `assertFsmAction` 이전에 위치하면,
스코프 외 사용자가 `REJECTION_REASON_REQUIRED` 오류를 수신하여 checkout 상태를 역추론할 수 있다.
`reason` 검증은 scope/FSM 검증 이후에 위치해야 한다.

```bash
# REJECTION_REASON_REQUIRED가 enforceScopeFromData보다 이전에 위치하는지 탐지
# (라인 번호 비교: REJECTION_REASON_REQUIRED 라인 > enforceScopeFromData rejectReturn 라인)
python3 - <<'EOF'
import subprocess, re

content = open('apps/backend/src/modules/checkouts/checkouts.service.ts').read()
lines = content.split('\n')

reject_return_start = next(
  i for i, l in enumerate(lines) if 'async rejectReturn(' in l
)
scope_line = next(
  (i for i, l in enumerate(lines[reject_return_start:], reject_return_start)
   if 'enforceScopeFromData(' in l), None
)
reason_line = next(
  (i for i, l in enumerate(lines[reject_return_start:], reject_return_start)
   if 'REJECTION_REASON_REQUIRED' in l), None
)

if scope_line and reason_line:
  if reason_line > scope_line:
    print(f"PASS: reason check (L{reason_line+1}) after scope check (L{scope_line+1})")
  else:
    print(f"FAIL: reason check (L{reason_line+1}) BEFORE scope check (L{scope_line+1})")
else:
  print("WARN: could not locate both lines")
EOF
# 기대: PASS: reason check (L...) after scope check (L...)
```

**PASS:** `REJECTION_REASON_REQUIRED` 라인 번호 > `enforceScopeFromData` 라인 번호 (rejectReturn 메서드 내).
**FAIL:** reason 검증이 scope 검증보다 앞에 위치 → reason 검증 블록을 `assertFsmAction` 이후로 이동.

## Step 25: borrower 액터 identity-rule 강제 (2026-04-24 구현 완료, 상시 검사)

rental 2-step 승인 워크플로우의 `borrowerApprove`/`borrowerReject` 메서드:

- `req.user.teamId === checkout.requester.teamId` 강제 (차용 팀 TM만 승인 가능)
- scope 검증 호출이 `assertFsmAction`보다 먼저 실행 — scope-먼저 원칙 준수
- emitAsync payload에 `lenderTeamId` 포함 — composite 알림 전략(`CHECKOUT_BORROWER_APPROVED`) 전제 조건

> **Sprint 1.4 업데이트 (2026-04-24):** 프론트엔드 `canBorrowerApprove`/`canBorrowerReject` const 검사 제거.
> FSM descriptor 기반 패러다임으로 전환 — 백엔드 `resolveNextAction`이 권한 필터링을 담당하므로
> `CheckoutDetailClient.tsx`의 클라이언트 측 permission guard는 LegacyActionsBlock과 함께 삭제됨.
> 프론트엔드 검증 기준은 Step 26 (`handleNextStepAction` 완전 매핑)으로 이관.

```bash
# borrowerApprove 메서드 구현 확인
grep -c "async borrowerApprove" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 1 이상 (PASS) — 0이면 Phase 구현 누락
```

```bash
# scope-먼저 원칙: scope 검증이 assertFsmAction보다 앞에 위치하는지 확인
python3 - <<'EOF'
content = open('apps/backend/src/modules/checkouts/checkouts.service.ts').read()
lines = content.split('\n')
ba_start = next((i for i, l in enumerate(lines) if 'async borrowerApprove(' in l), None)
if ba_start is None:
    print("FAIL: borrowerApprove 미구현")
else:
    fsm_line = next((i for i, l in enumerate(lines[ba_start:], ba_start) if 'assertFsmAction' in l), None)
    scope_line = next((i for i, l in enumerate(lines[ba_start:], ba_start)
                       if 'enforceScopeFromData' in l or 'enforceScopeForBorrower' in l), None)
    if scope_line and fsm_line and scope_line < fsm_line:
        print(f"PASS: scope 검증(L{scope_line+1}) -> assertFsmAction(L{fsm_line+1}) 순서 정상")
    elif scope_line and fsm_line:
        print(f"FAIL: scope 검증(L{scope_line+1})이 assertFsmAction(L{fsm_line+1}) 이후 -- 순서 위반")
    else:
        print(f"WARN: scope_line={scope_line}, fsm_line={fsm_line} -- 수동 확인 필요")
EOF
```

```bash
# borrowerApprove emitAsync payload에 lenderTeamId 포함 확인 (composite 알림 전략 전제 조건)
grep -A20 "emitAsync(NOTIFICATION_EVENTS.CHECKOUT_BORROWER_APPROVED" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "lenderTeamId"
# 결과: lenderTeamId 포함 라인 1건 (PASS)
```

**PASS:**

1. `borrowerApprove` 메서드 ≥ 1건 (구현됨)
2. scope 검증 라인 번호 < `assertFsmAction` 라인 번호 (scope-먼저)
3. `emitAsync` payload에 `lenderTeamId` 포함

**FAIL:**

- borrowerApprove 미구현 → Phase 3+4 구현 체크
- scope 검증이 assertFsmAction 이후 → 순서 교정 (보안 fail-close 규칙)
- payload에 `lenderTeamId` 누락 → composite 알림 전략 silent drop

## Step 47: checkout-scope.util.ts outbound predicate 불변성 — case 1+3만 (2026-04-29 추가)

rental borrower(requester) 팀은 status와 무관하게 항상 inbound로만 분류된다는 도메인 결정. direction='outbound'에 `requesterIn`이 포함되면(이전 case 4) pending 상태 rental 건이 반출 탭에도 노출되어 UX 이중 분류 회귀가 발생.

```bash
# 1. outbound 분기에 requesterIn 사용 없음 확인
grep -A5 "direction === 'outbound'" \
  apps/backend/src/modules/checkouts/checkout-scope.util.ts
# 기대: requesterIn이 outbound 분기 OR 표현식에 미포함

# 2. outbound = case 1+3 (isNonRental+equip, isRental+lenderEq) 확인
grep -A3 "direction === 'outbound'" \
  apps/backend/src/modules/checkouts/checkout-scope.util.ts | grep "lenderEq\|inEquip"
# 기대: lenderEq, inEquipTeam/inEquipSite만 등장

# 3. isPending 변수가 checkout-scope.util.ts에서 선언되지 않음 (case 4 제거 후 불필요)
grep -n "isPending" apps/backend/src/modules/checkouts/checkout-scope.util.ts
# 기대: 0건 (case 4 재도입 시 1건 이상 나타남 → FAIL)

# 4. SSOT 주석 3-case 정의 존재
grep -n "SSOT 정의 (3-case)" apps/backend/src/modules/checkouts/checkout-scope.util.ts
# 기대: 1건
```

**PASS:**
1. `direction === 'outbound'` 분기에 `requesterIn` 변수 미참조
2. outbound OR 구조: `(isNonRental, equip)` + `(isRental, lenderEq)` 2개 케이스만
3. `isPending` 변수 선언 0건
4. SSOT 주석 "3-case" 명시

**FAIL:**
- `requesterIn`이 outbound 분기에 재등장 → case 4 회귀
- `isPending` 변수 재선언 → case 4 재도입 신호
- outbound OR에 3개 이상 조건 → 도메인 의도 이탈

**관련 파일:**
- `apps/backend/src/modules/checkouts/checkout-scope.util.ts` — buildCheckoutSiteCondition, buildCheckoutTeamCondition

## Step 52: `revokeApproval` 5단계 fail-close 순서 검증 (2026-05-03 추가)

**규칙**: `revokeApproval` 메서드는 반드시 `scope → FSM(APPROVED) → reason → time-window → domain` 5단계 순서로 fail-close해야 한다. 보안 원칙: FSM 이전에 scope 체크를 완료해야 스코프 외 사용자가 FSM 오류 메시지로 승인 상태를 역추론하는 것을 차단한다. reason 검증은 FSM 이후 — 미승인 상태에서 reason 조건을 먼저 확인할 필요가 없고, fail-fast 원칙에 따라 FSM 체크가 더 값싼 연산이다.

**5단계 순서**:
1. `enforceScopeFromCheckout()` — site/team scope 위반 403 차단
2. FSM 상태 확인 (`status !== APPROVED`) — `RevocationWindowExpired` 또는 FSM 오류 400
3. `dto.reason` 최소 길이 확인 (`REVOCATION_REASON_MIN_LENGTH`) — `RevocationReasonRequired` 400
4. time-window 확인 (`approvedAt + APPROVAL_REVOCATION_WINDOW_MS`) — `RevocationWindowExpired` 403
5. domain 확인 (`checkout.approverId !== approverId`) — `Forbidden` 403

```bash
# revokeApproval 메서드 구조 — 단계 순서 확인
grep -n "enforceScopeFromCheckout\|RevocationReasonRequired\|RevocationWindowExpired\|REVOCATION_REASON_MIN_LENGTH\|APPROVAL_REVOCATION_WINDOW\|approverId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -A0 "" | head -20
# 기대: scope(enforceScopeFromCheckout) → FSM(ErrorCode.Invalid*) → reason(REVOCATION_REASON_MIN_LENGTH) → window(RevocationWindowExpired) → domain(approverId)

# reason 검증이 FSM 체크보다 먼저 나오는지 탐지 (역전 탐지)
python3 -c "
import re
with open('apps/backend/src/modules/checkouts/checkouts.service.ts') as f:
    src = f.read()
# revokeApproval 블록 추출
m = re.search(r'async revokeApproval\b[^{]*{(.+?)(?=\n  async |\nAsync |\Z)', src, re.DOTALL)
if not m: print('WARN: revokeApproval 메서드 미발견'); exit()
block = m.group(1)
reason_pos = block.find('RevocationReasonRequired')
fsm_pos = min(
    (block.find(x) for x in ['INVALID_TRANSITION','APPROVED','InvalidTransition'] if x in block),
    default=99999
)
if reason_pos < fsm_pos and reason_pos != -1:
    print('FAIL: reason 검증이 FSM 체크 이전 — scope/FSM 우선 원칙 위반')
else:
    print('PASS: scope → FSM → reason 순서 확인')
" 2>/dev/null
```

**PASS**: `revokeApproval` 메서드 내 5단계가 순서대로 존재.
**FAIL**: reason 검증이 FSM 체크보다 앞에 위치 → 스코프 외 사용자 상태 역추론 취약점.

**관련 파일**:
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `revokeApproval` 메서드
- `apps/backend/src/modules/checkouts/dto/revoke-approval.dto.ts` — `REVOCATION_REASON_MIN_LENGTH` Zod 스키마
- `packages/schemas/src/errors.ts` — `RevocationReasonRequired`(400), `RevocationWindowExpired`(403) 매핑
