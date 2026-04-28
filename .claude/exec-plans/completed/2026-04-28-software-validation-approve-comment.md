# Software Validation Approve Comment Silent Loss — 진짜 Fix

## 컨텍스트

- **발견 commit**: `f981e0e9` — `_approvalComment?` underscore prefix 적용으로 lint 통과만 확보한 임시방편. 실제 silent loss는 미해결.
- **위치**: `apps/backend/src/modules/software-validations/software-validations.service.ts:384-440` `approve()`
- **증상**: DTO(`approve-validation.dto.ts:7-11`) → Controller(`software-validations.controller.ts:175`) → Service까지 `approvalComment`가 전달되지만 service 본문에서 **사용되지 않음**. 사용자가 입력한 기술책임자 승인 코멘트가 어디에도 저장되지 않음.
- **컴플라이언스 갭**: ISO/IEC 17025 §6.2.2 audit trail — 승인 시 검토 의견 기록 의무.
- **도메인 결정 (사용자 확정)**: **(c) 신규 컬럼 + audit_logs metadata 이중 안전망**
  - 컬럼: 도메인 객체 표시/리스팅·재조회 시 즉시 접근 (UI에 노출되는 single-source-of-truth)
  - audit_logs: 변경 이력·시계열 추적 (interceptor가 자동 기록 — 이미 동작 중)

## 기존 코드 실측 결과 (decision base)

1. **유사 도메인 패턴 — `disposal_requests.approval_comment`**: `packages/db/src/schema/disposal-requests.ts:57` `approvalComment: text('approval_comment')` 컬럼 존재. `disposal.service.ts:352` `approvalComment: approveDto.comment || null` 으로 persist. → **본 fix는 기존 SSOT 패턴을 그대로 답습**.
2. **유사 도메인 패턴 — `calibration_plans.review_comment`**: `text('review_comment')` 컬럼 존재. `calibration-plans.service.ts:593` `reviewComment: reviewComment || null`.
3. **DTO 이미 정상**: `approveValidationSchema` (`approve-validation.dto.ts:7-11`)이 `z.string().trim().max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH).optional()` 으로 정의됨 → **DTO/Validation 변경 불필요**.
4. **Controller 이미 정상**: `software-validations.controller.ts:175` `this.validationsService.approve(uuid, dto.version, approverId, dto.approvalComment)` → **Controller 변경 불필요**.
5. **Audit interceptor가 이미 metadata 기록 중**: `apps/backend/src/common/interceptors/audit.interceptor.ts:287-291` 가 `request.body` 전체를 sanitize/truncate 후 `details.additionalInfo.requestBody` 로 자동 저장. → **AuditService 호출 추가 불필요. 컨트롤러의 `@AuditLog({ action: 'approve', entityType: 'software_validation', entityIdPath: 'params.uuid' })` 데코레이터가 이미 모든 요청 본문(approvalComment 포함)을 audit_logs에 기록**.
6. **CAS 패턴**: `software_validations.version: integer` 존재 → `updateWithVersion` 호출 보존 필수.
7. **Migration 형식**: `apps/backend/drizzle/0029_add_equipment_approved_at.sql` 와 `0045_add_borrower_approval.sql` 모두 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 패턴 + 주석으로 컨텍스트 설명. drizzle-kit `db:generate`가 `_journal.json` 자동 갱신.

## 비하드코딩 / SSOT 원칙

| 항목 | SSOT 위치 | 본 fix에서의 사용 |
|------|----------|------------------|
| audit action `'approve'` | `packages/schemas/src/enums/audit.ts` `AUDIT_ACTION_VALUES` | 컨트롤러 `@AuditLog({ action: 'approve' })` 이미 SSOT 사용 (변경 없음) |
| audit entity type `'software_validation'` | 동일 enum 파일 `AUDIT_ENTITY_TYPE_VALUES:106` | 컨트롤러 데코레이터 이미 SSOT 사용 (변경 없음) |
| approval comment max length | `packages/shared-constants/src/validation-rules.ts:27` `LONG_TEXT_MAX_LENGTH = 500` | DTO 이미 사용 (변경 없음). 컬럼은 `text` (PG 무제한) — DTO max로 입력 시점 차단. disposal/calibration-plans도 동일 컬럼 타입 |
| Validation status / 워크플로우 | `packages/schemas` `ValidationStatusValues` | 기존 사용 보존 |
| Trim/null 정책 | DTO `.trim()` + `comment || null` (disposal.service.ts:352 패턴) | service에서 동일 적용 |

## Phase 1 — DB Schema + Migration

### 변경 파일

- **`packages/db/src/schema/software-validations.ts`** — `approval_comment text` 컬럼 추가
  - 위치: `// ── 승인 프로세스 ──` 블록 `technicalApprovedAt` 직후
  - 코드: `approvalComment: text('approval_comment'),`
  - **nullable** (default NULL) — 기존 행 영향 없음, backfill 불요
  - 인덱스 신설 안 함 — WHERE 조건 사용처 없음 (UI 표시·이력 조회용)

- **`apps/backend/drizzle/0048_add_software_validation_approval_comment.sql`** (신규)
  ```sql
  -- Migration: 0048_add_software_validation_approval_comment
  -- Purpose: ISO/IEC 17025 §6.2.2 audit trail — 기술책임자 승인 시 검토 의견 영속화.
  --   사용자가 입력한 approvalComment가 silent loss되던 production bug 진짜 fix.
  -- Decision: column + audit_logs metadata 이중 안전망 (사용자 확정).
  --   - 컬럼: 도메인 객체 조회/리스팅 시 즉시 접근 (UI 표시 SSOT).
  --   - audit_logs: 변경 이력 시계열 추적 (interceptor 자동 기록).
  -- Affected table: software_validations
  -- Backfill: 불필요 — 기존 행은 NULL 유지. 새 승인부터 컬럼에 기록.
  -- Pattern: disposal_requests.approval_comment, calibration_plans.review_comment 동일 SSOT.

  ALTER TABLE "software_validations"
    ADD COLUMN IF NOT EXISTS "approval_comment" text;
  ```

- **`apps/backend/drizzle/meta/_journal.json`** + **`apps/backend/drizzle/meta/0048_snapshot.json`** — drizzle-kit이 `db:generate` 실행 시 자동 생성
  - **TTY 제약 (tech-debt 메모)**: harness 환경이 non-TTY인 경우 `pnpm --filter backend run db:generate`가 prompt에서 멈출 수 있음. 우선 `db:generate` 시도 → 실패 시 SQL은 위 hand-written 본문으로 진행하고 `_journal.json` 항목과 `0048_snapshot.json`은 **사용자 환경(TTY)** 에서 별도 갱신 필요.
  - 폴백 절차: TTY에서 `pnpm --filter backend run db:generate --name add_software_validation_approval_comment` 실행 시 schema diff 기반으로 위 SQL과 동등한 파일이 생성되며 journal/snapshot도 함께 추가됨 → 그 결과로 hand-written SQL을 교체.

### 검증

- `psql equipment_management -c "\d software_validations"` 출력에 `approval_comment | text` 행 포함
- `pnpm --filter backend run build` PASS (Drizzle 타입 추론 OK)

## Phase 2 — Service Layer Fix

### 변경 파일

- **`apps/backend/src/modules/software-validations/software-validations.service.ts:384-440`**

```typescript
// Before (현재):
async approve(
  id: string,
  version: number,
  approverId: string,
  // TODO(tech-debt 2026-04-28): silent loss — DTO/controller 전달 OK, audit metadata 또는
  // software_validations.approval_comment 컬럼 신설 후 저장 필요. 임시로 underscore prefix.
  _approvalComment?: string
): Promise<SoftwareValidation> {
  // ...
  const updated = await this.updateWithVersion<SoftwareValidation>(
    softwareValidations,
    id,
    version,
    {
      status: ValidationStatusValues.APPROVED,
      technicalApproverId: approverId,
      technicalApprovedAt: new Date(),
    },
    // ...
  );
  // ...
}

// After:
async approve(
  id: string,
  version: number,
  approverId: string,
  approvalComment?: string
): Promise<SoftwareValidation> {
  // ...
  const updated = await this.updateWithVersion<SoftwareValidation>(
    softwareValidations,
    id,
    version,
    {
      status: ValidationStatusValues.APPROVED,
      technicalApproverId: approverId,
      technicalApprovedAt: new Date(),
      approvalComment: approvalComment || null,  // disposal.service.ts:352 동일 패턴
    },
    // ...
  );
  // ...
}
```

### 변경 의도

- underscore prefix 제거 → 본문에서 사용 명시
- TODO 주석 제거 (해결 완료)
- `approvalComment: approvalComment || null` — empty string도 null로 정규화 (disposal 패턴 답습). DTO `.trim()`이 이미 whitespace-only 입력을 빈 문자열로 만들어 둠.
- `updateWithVersion` 그대로 사용 — CAS 보존, 기존 status/technicalApproverId/technicalApprovedAt persist 보존
- 트랜잭션 추가 안 함 — 단일 테이블 단일 UPDATE 이며 audit interceptor는 인터셉터 콜백에서 비동기 실행되므로 분리 보존 (disposal은 두 테이블 변경이라 tx 사용)

### 검증

- `pnpm --filter backend exec tsc --noEmit` PASS
- `grep -n "_approvalComment" apps/backend/src/modules/software-validations/software-validations.service.ts` 0 hits
- `grep -n "approvalComment" apps/backend/src/modules/software-validations/software-validations.service.ts` ≥ 2 hits (파라미터 + UPDATE 필드)

## Phase 3 — Audit Log 통합 (no-op verification)

### 결정: 신규 호출 없음, 기존 인터셉터 의존

`apps/backend/src/common/interceptors/audit.interceptor.ts:287-291` 가 모든 `@AuditLog` 데코레이터 적용 핸들러의 `request.body`를 자동으로 `details.additionalInfo.requestBody`에 저장. 컨트롤러 `@Patch(':uuid/approve')` 핸들러 (`software-validations.controller.ts:161-176`) 가 이미 `@AuditLog({ action: 'approve', entityType: 'software_validation', entityIdPath: 'params.uuid' })` 데코레이터 적용 중 → **`approvalComment`는 이미 audit_logs에 기록 중**.

**왜 service 레이어에서 별도 `AuditService.create()` 호출 안 하는가**:
- 중복 감사 로그 발생 (같은 트랜잭션에 2개 행) → 분석 노이즈
- audit interceptor의 sanitize / truncate / circular-ref 보호 / oversized summary 로직이 이미 검증된 SSOT 경로
- service에서 추가 호출 시 cross-cutting concern을 도메인 코드로 끌어들임 → SRP 위반

### Phase 3 검증

- 기존 audit interceptor 동작 PASS (회귀 없음): `pnpm --filter backend test audit.interceptor` 그린 유지
- 통합 흐름 검증은 Phase 4 spec에서 서비스 레이어가 본문에 approvalComment를 사용하는지로 충족 (인터셉터 자체 동작은 별도 spec이 보장)

## Phase 4 — Spec 보강

### 변경 파일

- **`apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts`** — `describe('approve()', () => { ... })` 블록에 4 케이스 추가

### 추가 케이스

```typescript
describe('approve()', () => {
  // 기존 3 케이스 (state transition / event emit / forbidden self-approval) 보존

  // (T1) approvalComment를 DB UPDATE에 persist
  it('approvalComment가 제공되면 UPDATE SET approval_comment 에 포함된다', async () => {
    const submitted = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED, submittedBy: 'submitter-uuid' };
    mockDb.select.mockReturnValueOnce(createSelectChain([submitted]));
    const updateChain = mockUpdateChain({ ...submitted, status: ValidationStatusValues.APPROVED, approvalComment: '검토 완료 — 모든 항목 통과' });
    mockDb.update.mockReturnValueOnce(updateChain);
    mockDb.select.mockReturnValueOnce(createSelectChain([{ name: '소프트웨어 A' }]));

    await service.approve('val-uuid-1', 1, 'approver-uuid-1', '검토 완료 — 모든 항목 통과');

    // updateChain.set 호출 인자에 approvalComment 포함 검증
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ approvalComment: '검토 완료 — 모든 항목 통과' })
    );
  });

  // (T2) approvalComment === undefined → null persist
  it('approvalComment가 undefined이면 NULL로 persist된다', async () => {
    const submitted = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED, submittedBy: 'submitter-uuid' };
    mockDb.select.mockReturnValueOnce(createSelectChain([submitted]));
    const updateChain = mockUpdateChain({ ...submitted, status: ValidationStatusValues.APPROVED });
    mockDb.update.mockReturnValueOnce(updateChain);
    mockDb.select.mockReturnValueOnce(createSelectChain([{ name: '소프트웨어 A' }]));

    await service.approve('val-uuid-1', 1, 'approver-uuid-1');

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ approvalComment: null })
    );
  });

  // (T3) approvalComment === '' → null persist (DTO trim 후 empty string 케이스)
  it('approvalComment가 빈 문자열이면 NULL로 persist된다', async () => {
    const submitted = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED, submittedBy: 'submitter-uuid' };
    mockDb.select.mockReturnValueOnce(createSelectChain([submitted]));
    const updateChain = mockUpdateChain({ ...submitted, status: ValidationStatusValues.APPROVED });
    mockDb.update.mockReturnValueOnce(updateChain);
    mockDb.select.mockReturnValueOnce(createSelectChain([{ name: '소프트웨어 A' }]));

    await service.approve('val-uuid-1', 1, 'approver-uuid-1', '');

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ approvalComment: null })
    );
  });

  // (T4) 기존 status / technicalApproverId / technicalApprovedAt persist 보존 (regression guard)
  it('status / technicalApproverId / technicalApprovedAt 기존 필드가 보존된다', async () => {
    const submitted = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED, submittedBy: 'submitter-uuid' };
    mockDb.select.mockReturnValueOnce(createSelectChain([submitted]));
    const updateChain = mockUpdateChain({ ...submitted, status: ValidationStatusValues.APPROVED });
    mockDb.update.mockReturnValueOnce(updateChain);
    mockDb.select.mockReturnValueOnce(createSelectChain([{ name: '소프트웨어 A' }]));

    await service.approve('val-uuid-1', 1, 'approver-uuid-1', '코멘트');

    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ValidationStatusValues.APPROVED,
        technicalApproverId: 'approver-uuid-1',
        technicalApprovedAt: expect.any(Date),
        approvalComment: '코멘트',
      })
    );
  });
});
```

### Mock 시그니처 호환성

기존 spec의 `mockUpdateChain` 헬퍼는 `set` 을 jest.fn으로 노출하므로 `expect(updateChain.set).toHaveBeenCalledWith(...)` 검증 가능 (`software-validations.service.spec.ts:79-86`).

`updateWithVersion` 의 `set()` 호출은 베이스 클래스에서 `{ ...updateData, version: sql\`...\`, updatedAt: ... }` 형태로 합성되므로 `expect.objectContaining` 사용 — 추가 컬럼 무관.

### 검증

- `pnpm --filter backend test software-validations` 4 신규 테스트 PASS + 기존 테스트 회귀 0건

## Phase 5 — 회귀 게이트 검토

### Trade-off 분석

| 옵션 | Pros | Cons | 결론 |
|------|------|------|------|
| ESLint 룰 | 정적 자동 차단 | service/* 디렉토리 전체에서 underscore prefix가 silent loss인지 의도된 unused인지 구분 어려움. false positive 다수 (e.g., 데코레이터 metadata-only 파라미터, 인터페이스 구현용 unused). 룰 작성/유지 비용 > 차단 가치 | **채택 안 함** |
| Spec 커버리지 (Phase 4) | T1 (persist) + T4 (regression guard)가 미래 fix 회귀 시 즉시 RED. 도메인 코드 직접 검증 | 신규 도메인 추가 시 수동 적용 필요 | **채택** — 1차 방어선 |
| verify-implementation 스킬 등재 | 체크리스트화 → 다른 도메인 PR에서도 자동 호출 | 개별 룰보다 범용 | **채택** — 2차 방어선 (verify-implementation Step 신설 권고) |

### tech-debt 등재 (잔존)

- `tech-debt-tracker.md` `software-validation-approve-comment-silent-loss` 항목 → ✅ Resolved 처리
- 신규 등재: **"Service 메서드 파라미터 underscore prefix 패턴 정적 검증 부재"** (LOW) — 향후 verify-implementation 스킬에 패턴 grep 룰 추가 검토 (`grep -rn "_[a-z][a-zA-Z]*\?:.*string\|number\|boolean.*\):" apps/backend/src/modules/*/services` 후 의도된 unused 인지 review 절차)

### 검증

- 본 phase는 결정 기록 + tech-debt 갱신만, 코드 변경 없음

## 영향 범위 / 무변경 파일

### 수정

| 파일 | 변경 |
|------|------|
| `packages/db/src/schema/software-validations.ts` | `approvalComment: text('approval_comment')` 컬럼 추가 |
| `apps/backend/drizzle/0048_add_software_validation_approval_comment.sql` | 신규 — ALTER TABLE ADD COLUMN |
| `apps/backend/drizzle/meta/_journal.json` + `0048_snapshot.json` | drizzle-kit 자동 생성 (TTY 환경 필요) |
| `apps/backend/src/modules/software-validations/software-validations.service.ts` | `approve()` 시그니처 + UPDATE persist (1메서드, ~3줄) |
| `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` | 4 케이스 추가 |
| `.claude/exec-plans/tech-debt-tracker.md` | 항목 ✅ resolved 처리 + 회귀 게이트 후속 항목 추가 |

### 무변경 (의도적)

| 파일 | 무변경 사유 |
|------|------------|
| `apps/backend/src/modules/software-validations/dto/approve-validation.dto.ts` | DTO 이미 정상 — `approvalComment?: string` 정의 + `LONG_TEXT_MAX_LENGTH` SSOT 사용 + `.trim()` |
| `apps/backend/src/modules/software-validations/software-validations.controller.ts` | Controller 이미 정상 — 라인 175 `dto.approvalComment` service에 전달 + `@AuditLog` 데코레이터로 audit interceptor 자동 기록 |
| `apps/backend/src/common/interceptors/audit.interceptor.ts` | Audit metadata는 인터셉터가 이미 `request.body`로 자동 기록 — 이중 안전망의 audit 측은 변경 없이 자동 작동 |
| `software-validations.service.ts` 의 `qualityApprove() / reject() / submit() / revise() / update() / create() / findOne() / findAll() / findPending() / findByTestSoftware()` | 본 fix 범위 외 (`approve()` 단일 메서드 silent loss) |
| `packages/schemas/src/enums/audit.ts` | audit action / entity type 변경 불필요 — 기존 `'approve'` + `'software_validation'` 사용 |
| `packages/shared-constants/src/validation-rules.ts` | `LONG_TEXT_MAX_LENGTH = 500` 재사용 |

## 검증 명령

```bash
# Phase 1 — 스키마 + 마이그레이션
pnpm --filter backend run db:generate  # TTY 필요. 실패 시 hand-written SQL로 진행
psql equipment_management -c "\d software_validations" | grep approval_comment
pnpm --filter backend run build

# Phase 2 — 서비스 fix
pnpm --filter backend exec tsc --noEmit
grep -n "_approvalComment" apps/backend/src/modules/software-validations/software-validations.service.ts  # 0 hits 기대
grep -n "approvalComment" apps/backend/src/modules/software-validations/software-validations.service.ts  # ≥ 2 hits

# Phase 4 — spec
pnpm --filter backend test software-validations

# 통합
pnpm --filter backend run build
pnpm --filter backend run lint
```

## 워크플로우 / 성능 / 보안 / 접근성

| 영역 | 영향 |
|------|------|
| **워크플로우** | UL-QP-18-09 워크플로우 (draft → submitted → approved → quality_approved) 변경 없음. 1-step 기술 승인의 코멘트 영속화만 추가. quality 승인 코멘트는 본 fix 범위 외 (별도 DTO 없음 — Out of scope) |
| **성능** | column 추가 nullable → backfill 0건. UPDATE row 크기 미세 증가만 (text 컬럼). 인덱스 신설 없음. audit_logs는 기존 인터셉터 동작 그대로 (추가 write 없음) |
| **보안** | `approverId`는 `req.user.userId` server-side extraction 보존 (controller line 174 `extractUserId(req)`). 클라이언트 body는 `version` + `approvalComment`만 신뢰. ISO/IEC 17025 §6.2.2 독립성 검증 (`assertIndependentApprover`) 보존. CAS guard 보존 (`updateWithVersion`) |
| **접근성** | 백엔드 only — 해당 없음. (Frontend ApprovalCommentField 컴포넌트가 이미 존재한다고 가정 — 기존 동작 그대로) |
| **i18n** | 백엔드 메시지 변경 없음 — 기존 에러 코드/메시지 유지 |

## 롤백 전략

### 코드 롤백
- service / spec / schema 변경은 git revert로 단일 커밋 되돌림 가능
- DTO/Controller 변경 없음 → 클라이언트 호환성 100% (롤백해도 클라이언트는 그대로 `approvalComment` 전송, 단지 silent loss로 회귀)

### DB 롤백
- `apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql` (신규):
  ```sql
  -- Rollback: 0048_add_software_validation_approval_comment
  -- Note: 컬럼 DROP은 데이터 손실. 운영 환경에서는 신중 검토 후 실행.
  ALTER TABLE "software_validations" DROP COLUMN IF EXISTS "approval_comment";
  ```
- 컬럼 제거 시 영속화된 코멘트 데이터 영구 손실 → 운영 적용 후엔 사실상 forward-only
- 임시 무력화가 필요한 경우: service 코드만 revert (`approvalComment: null`로 강제) → 컬럼은 남기되 신규 write 차단

### 무손실 회귀 안전망
- 기존 audit_logs metadata가 이중 기록 중이므로 컬럼이 NULL이어도 행위 자체는 audit_logs에서 복원 가능

## 외부 의존 / 미해결 위험

1. **TTY 제약**: `db:generate`가 non-TTY 환경에서 실패 시 `_journal.json` / `0048_snapshot.json`을 사용자 환경에서 별도 갱신 필요. 본 plan은 hand-written SQL을 1차로 진행하고 journal/snapshot은 사용자 환경에서 별도 단계로 분리.
2. **Frontend ApprovalCommentField 컴포넌트 존재 여부**: 본 plan은 Backend silent loss fix만 포함. UI에 `approvalComment` 입력 필드가 없다면 사용자가 코멘트 전송 자체를 못함 — 별도 frontend plan 필요. (현재 controller가 `dto.approvalComment` 받는 사실은 어떤 클라이언트 경로가 이미 전송 중임을 시사 → 분리 작업으로 확인)
3. **quality_approve 코멘트**: 본 fix는 1-step 기술 승인 코멘트만. 품질책임자 승인(`qualityApprove`) 시 코멘트 필드 없음 — 별도 도메인 결정 필요 시 후속 sprint.
