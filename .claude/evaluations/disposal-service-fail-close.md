# Evaluation Report: disposal-service-fail-close

## 반복 #1 (2026-05-01T)

### 계약 기준 대조 표

| 기준 | 검증 명령 / 방법 | 결과 | 판정 |
|------|------------------|------|------|
| **M1.1** `pnpm tsc --noEmit` exit 0 | `pnpm tsc --noEmit; echo "EXIT:$?"` | `EXIT:0`, 에러 없음 | **PASS** |
| **M2.1** reject 분기 BadRequestException throw 존재 | `grep -A 5 "decision === 'reject'" \| grep -c "BadRequestException\|throw"` | `1` (≥1 충족) | **PASS** |
| **M2.2** `'승인 단계에서 반려'` fallback 제거 | `grep -c "승인 단계에서 반려" disposal.service.ts` | `0` | **PASS** |
| **M2.3** `REJECTION_REASON_MIN_LENGTH` import+사용 ≥ 2 | `grep -c "REJECTION_REASON_MIN_LENGTH" disposal.service.ts` | `4` (≥2 충족) | **PASS** |
| **M3.1** spec 파일 존재 + 모든 케이스 PASS | `pnpm --filter backend run test --testPathPattern='disposal.service.spec'` | 31 tests, 1 suite — 전체 PASS | **PASS** |
| **M3.2** reject edge case ≥ 6건 | spec 코드 직접 카운트: `it.each` 5항목 + `fail-close code` 단일 `it` = 서비스 reject 경로 총 9건 | 9건 (≥6 충족) | **PASS** |
| **M3.3** approve edge case ≥ 3건 | spec `approveDisposal approve branch` `it.each` 5항목 | 5건 (≥3 충족) | **PASS** |
| **M3.4** Zod pipeline 통합 case ≥ 5건 | `requestDisposalSchema` 6건 + `reviewDisposalSchema` 6건 + `approveDisposalSchema` 4건 = 16건 | 16건 (≥5 충족) | **PASS** |
| **M3.5** `DISPOSAL_REJECT_COMMENT_REQUIRED` spec 참조 | `grep -c "DISPOSAL_REJECT_COMMENT_REQUIRED" spec.ts` | `2` (≥1 충족) | **PASS** |
| **M4.1** 기존 disposal+equipment+calibration-plan 회귀 0 | `pnpm --filter backend run test --testPathPattern='(disposal\|equipment.service\|equipment.controller\|calibration-plan)'` | 7 suites, 112 tests, 0 failures | **PASS** |
| **M5** 다른 세션 도메인 침범 0 | `git diff --name-only HEAD` + `git status --short` | 판단 필요 (아래 별도 기술) | **조건부 PASS** |

---

### M5 다른 세션 침범 상세 판단

변경된 파일 목록 (unstaged, commit 전 상태):

```
 M .claude/contracts/REGISTRY.md
 M .claude/settings.local.json
 M apps/backend/src/modules/equipment/services/disposal.service.ts   ← sprint 파일
 M apps/frontend/lib/utils/calibration-status.ts                     ← 다른 세션 기존 미커밋
 M apps/frontend/next-env.d.ts                                        ← Next.js 자동 생성
?? .claude/contracts/disposal-service-fail-close.md                  ← sprint 계약 (OK)
?? .claude/contracts/inspection-template-build-once.md               ← 다른 세션 계약
?? apps/backend/src/modules/equipment/__tests__/disposal.service.spec.ts  ← sprint 파일
```

- `calibration-status.ts`: 다른 세션 **기존 미커밋** — diff 확인 결과 `type EquipmentStatus` import 추가. **본 sprint에서 변경한 것이 아닌 기존 git status에서 이미 M 상태**였음 (초기 git status에도 명시됨). 본 sprint는 건드리지 않았으므로 도메인 침범 아님.
- `next-env.d.ts`: Next.js 자동 생성 파일 — `import "./.next/dev/types/routes.d.ts"` 경로 변경. 역시 다른 세션 기존 미커밋. 본 sprint 범위 외.
- `.claude/settings.local.json`: `mv` 권한 항목 추가 — harness 자동 hook 등록. sprint 작업 중 허용된 허가 목록 갱신. 침범 아님.
- `.claude/contracts/REGISTRY.md`: 활성 계약 2건 추가 — `senior-permission-ssot` + `inspection-template-build-once`. 다른 세션이 등록한 항목이며 본 sprint가 수정하지 않음.
- `.claude/contracts/inspection-template-build-once.md`: 다른 세션 계약 파일 (untracked). 본 sprint 생성 아님.

**결론**: 본 sprint가 직접 변경한 파일은 `disposal.service.ts` + `disposal.service.spec.ts` + `disposal-service-fail-close.md` 3종. 나머지는 다른 세션 기존 미커밋이거나 harness 자동 갱신으로 범위 침범 없음. **M5 PASS**.

---

### 시나리오 1~3 정성적 판단 — Defense-in-depth 의미적 완결성

#### 시나리오 1: `POST /equipment/:id/disposal/approve` with `{"version": 1, "decision": "reject"}` (comment 없음)

**Zod 단계 (DTO)**:
`approveDisposalSchema`에서 `comment`는 optional (`z.string().trim().max(MAX).optional()`). comment 미포함 → Zod 통과.

**Service 단계 (fail-close)**:
`disposal.service.ts:333-341` (코드 인용):
```typescript
if (approveDto.decision === 'reject') {
  const trimmed = approveDto.comment?.trim() ?? '';
  if (trimmed.length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH) {
    throw new BadRequestException({
      code: 'DISPOSAL_REJECT_COMMENT_REQUIRED',
      message: `반려 코멘트는 ${VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH}자 이상 입력해주세요.`,
    });
  }
}
```
comment가 `undefined`이면 `trimmed = ''`, `''.length (0) < 10` → **BadRequestException** throw.

**Spec 검증**:
`spec.ts:204-226` — `it.each` 첫 번째 항목 `['undefined comment', undefined]`:
```
fail-close undefined comment — throws BadRequestException with code DISPOSAL_REJECT_COMMENT_REQUIRED
```
`mockDb.transaction` 호출 안 됨, `updateWithVersionSpy` 호출 안 됨 — **transaction 진입 전 차단** 명시적으로 검증.

**판정: 닫혀있음**. comment 없이 reject → DB 변경 없이 400 BadRequestException.

---

#### 시나리오 2: `{"comment": "          "}` (공백 10자) 전송

**Zod 단계 (DTO)**:
`z.string().trim().max(MAX).optional()` — trim 후 빈 문자열 `''`, max(500) 통과. Zod는 min 강제 안 함 → **Zod 통과**.

**Service 단계 (fail-close)**:
```typescript
const trimmed = approveDto.comment?.trim() ?? '';  // '' (공백 10자 trim)
if (trimmed.length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH) {  // 0 < 10
  throw new BadRequestException({ code: 'DISPOSAL_REJECT_COMMENT_REQUIRED', ... });
}
```
trim 후 0자 → `0 < 10` → **BadRequestException** throw.

**Spec 검증**:
`spec.ts:207` — `it.each` 세 번째 항목:
```typescript
[`whitespace only ${MIN} chars`, ' '.repeat(MIN)],
```
이 케이스도 `fail-close — throws BadRequestException with code DISPOSAL_REJECT_COMMENT_REQUIRED` 검증 + transaction 미진입 확인.

**판정: 닫혀있음**. 공백 10자도 trim 후 0자로 처리되어 BadRequestException.

---

#### 시나리오 3: `{"comment": "사용자가 입력한 의미있는 사유 텍스트"}` (≥10자) 전송

**Zod 단계**: trim 후 ≥10자 → max(500) 이내 → Zod 통과.

**Service 단계**:
`trimmed.length >= 10` → fail-close 미발동. DB 진입.

`disposal.service.ts:399`:
```typescript
rejectionReason: approveDto.comment!.trim(),
```
`!` 단언 — fail-close 통과 시점에 comment 존재 보장. `trim()` 적용된 값이 `rejectionReason` (audit log)에 저장됨. 구 fallback `'승인 단계에서 반려'` 완전 제거됨 (M2.2 grep 확인).

**Spec 검증**:
`spec.ts:240-258`:
```typescript
it.each([
  [`${MIN} chars (boundary)`, 'a'.repeat(MIN)],
  [`${MAX} chars (boundary)`, 'a'.repeat(MAX)],
  [`${MIN} chars + 양 끝 공백 trim 후 ${MIN}`, ` ${'a'.repeat(MIN)} `],
])(
  'reject 통과 %s — transaction 진입 + audit log에 trim된 comment 사용',
  async (_label, comment) => {
    ...
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    const updatePayload = callArgs[3];
    expect(updatePayload.rejectionReason).toBe(comment.trim());
    expect(updatePayload.rejectionReason).not.toBe('승인 단계에서 반려');
  }
);
```
`rejectionReason === comment.trim()` 직접 검증. 양 끝 공백 케이스도 trim 확인. fallback 미사용 명시적 assertion.

**판정: 닫혀있음**. 유효한 comment → DB에 trim된 실제 사유 저장, fallback 없음.

---

### SHOULD 기준

| 기준 | 확인 결과 |
|------|----------|
| S1 fail-close error code SSOT 등록 | `DISPOSAL_REJECT_COMMENT_REQUIRED`가 service 파일 내 인라인 — 별도 registry 등록 미완. 계약에서 "disposal.types.ts 또는 shared error code" 권장이나 필수 아님 |
| S2 frontend error code → i18n 매핑 | 별도 sprint OK (계약 Out of Scope) |
| S3 review-architecture 검토 | 미실행 — SHOULD |
| S4 commit 메시지 "🔴 자기검토 갭 1번 closure" | commit 전 상태라 미확인 — SHOULD |

---

## 전체 판정

**PASS**

### 근거 요약

1. **M1~M4 전항목 PASS** — tsc 에러 0, grep 기준 모두 충족, 31 테스트 전체 통과, 기존 112 테스트 회귀 0.
2. **M5 PASS** — 본 sprint 직접 변경 파일은 disposal.service.ts + disposal.service.spec.ts + 계약 파일. 나머지 변경은 다른 세션 기존 미커밋이며 본 sprint에서 건드리지 않음.
3. **시나리오 1~3 전부 닫혀있음** — Service fail-close가 transaction 진입 전 `if (decision === 'reject')` 분기에서 comment trim 후 MIN 미만을 차단. 공백 전용(시나리오 2) 포함. 정상 케이스(시나리오 3)는 trim된 실제 comment가 audit log에 저장되고 fallback 메시지 완전 제거됨. 코드와 spec에서 동일 invariant가 2-layer로 증명됨.

### 다른 세션 침범 여부

없음. (기존 미커밋 파일은 본 sprint 시작 전부터 수정된 상태였으며 본 sprint가 추가 변경하지 않음)
