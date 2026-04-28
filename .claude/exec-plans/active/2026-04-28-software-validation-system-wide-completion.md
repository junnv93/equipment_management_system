# Software Validation 시스템 전반 완성 — 5 갭 closure

> 직전 세션(`software-validation-approve-comment`)이 backend 코드 fix만 완료한 상태에서, 시니어 표준 미달 5가지 갭(A1·A2·A3·B1·B2·C1)을 모두 closure한다. "정적+런타임+CI 3중 검증" 표준을 본 sprint에서 처음 일관 적용한다.

## 컨텍스트

### 직전 세션 상태 (이미 완료 — 변경 금지)

`software-validation-approve-comment` Mode 2 harness 결과:
- `packages/db/src/schema/software-validations.ts` 에 `approvalComment: text('approval_comment')` 컬럼 추가됨 (line 74)
- `apps/backend/drizzle/0048_add_software_validation_approval_comment.sql` hand-written 작성됨
- `apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql` 작성됨
- `software-validations.service.ts:approve()` underscore prefix 제거 + `approvalComment: approvalComment || null` persist
- spec 4 케이스 추가 (persist / undefined→null / empty→null / regression guard)
- tech-debt-tracker.md `software-validation-approve-comment-silent-loss` `[x]` 처리
- 모두 미커밋 상태 (`git status` 기준 staged/unstaged 혼재)

### 본 sprint 5 갭 (closure 대상)

| 갭 | 심각도 | 설명 |
|----|---------|------|
| **A1** | 🔴 CRITICAL | DB에 ALTER TABLE 미적용 — frontend가 이미 `approvalComment` 전송 중인데 컬럼 부재 시 500 |
| **A2** | 🔴 CRITICAL | Integration test 부재 — mock UPDATE.set 호출만 검증, 실제 PostgreSQL UPDATE 미실측 |
| **A3** | 🔴 CRITICAL | Frontend UI audit 미완 — `SoftwareValidationContent.tsx` (도메인 직접 페이지) `approvalComment` 입력 UI 부재 확인됨 |
| **B1** | 🟡 MEDIUM | 도메인 전반 audit 부재 — `qualityApprove`/`reject`/`revise`/`submit`/`update` silent loss 갭 매트릭스 미작성 |
| **B2** | 🟡 MEDIUM | 정적 회귀 게이트 미신설 — verify-* 스킬에 underscore prefix silent loss 패턴 없음 |
| **C1** | 🟢 LOW | pre-push hook lint 미포함 — `main-residual-lint-errors` 회귀 원인 잔존 |

### 코드베이스 탐색 결과 (계획 근거)

**A1 — Drizzle 마이그레이션 적용 패턴**
- Hand-written SQL 패턴 정착됨: `0026~0047`까지 모두 hand-written이고 `_journal.json`에 수동 entry 추가 (snapshot은 0025 이후 미생성). 직전 commit `e2553623` (0046)이 동일 패턴.
- `apps/backend/drizzle/meta/_journal.json` `entries` 배열 마지막 항목 `idx: 47, tag: "0047_add_rejection_presets"` — 0048 entry **수동 추가** 필요.
- `db:reset` (apps/backend/scripts/db-reset.sh) = DROP + CREATE + drizzle-kit migrate + seed. 모든 데이터 손실. 본 sprint는 schema-only 변경이라 reset OK이지만 운영자(=사용자) 관점에서 신중.
- `db:push` = drizzle-kit push (CLAUDE.md "dev prototyping only" 명시). journal/snapshot 우회 — 향후 마이그레이션 자동 생성 로직 깨질 위험.
- Alternative: `docker compose exec -T postgres psql ... < 0048_*.sql` 직접 실행 + journal 수동 entry 추가 → drizzle journal 최신성 보존.

**A2 — Integration test 인프라**
- `apps/backend/test/jest-e2e.json` (NestJS e2e 인프라): `globalSetup`이 팀+사용자 시드, `maxWorkers: 1`, `testTimeout: 60000`. 실제 PostgreSQL + supertest 사용.
- `apps/backend/test/helpers/test-app.ts` (`createTestApp` / `closeTestApp`), `helpers/test-auth.ts` (`loginAs(app, 'admin'|'manager'|'user')` + `TEST_USER_IDS`), `helpers/test-fixtures.ts` (`createTestEquipment`).
- `apps/backend/test/calibration-factors.e2e-spec.ts` 패턴: `beforeAll → createTestApp + loginAs + createTestEquipment` → `afterAll cleanup + closeTestApp`. 신규 spec도 동일 답습.
- `apps/backend/src/modules/test-software/__tests__/` 에는 unit spec만 존재. integration spec 부재 → 본 sprint가 software-validations e2e 첫 도입.
- `package.json`: `test:integration: "jest --testRegex='\\.integration\\.spec\\.ts$'"` 스크립트 이미 존재. 단위/통합 명확히 분리됨.

**A3 — Frontend UI 매트릭스 (audit 결과)**

| 호출 경로 | 파일 | 코멘트 UI 상태 |
|----------|------|----------------|
| 통합 승인 페이지 (`/admin/approvals?tab=software`) | `components/approvals/ApprovalsClient.tsx` (lines 77, 528-559, 592-621) | ✅ 완전 구현. `TAB_META.software_validation.commentRequired = true` (approvals-api.ts:323) → 다이얼로그 자동 표시 → `approvals.api.approve(category, id, comment)` → `softwareValidationApi.approve(id, version, comment \|\| undefined)` (approvals-api.ts:906). |
| 도메인 직접 페이지 (`/software/[id]/validation`) | `app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx:173` | ❌ **미구현**. `approveMutation.mutate({ id, version })` — 코멘트 미전달. UI에 `approveDialog` 없음 (rejectDialog만 i18n에 존재). |
| 도메인 직접 — Actions Bar | `app/(dashboard)/software/[id]/validation/_components/ValidationActionsBar.tsx:82` | ❌ approve 버튼 클릭 → `approveMutation.mutate({ id, version })` 직접 호출. 코멘트 입력 UI 부재. |
| `lib/api/software-api.ts:235-247` | API 시그니처 `approve(id, version, approvalComment?)` 이미 OK | (변경 불필요) |
| i18n `messages/{ko,en}/software.json` | `validation.rejectDialog.*` 존재, `validation.approveDialog.*` **부재** | ❌ 신설 필요 |

→ 결정: **도메인 직접 페이지에도 `approveDialog` 신설**. 패턴은 `rejectDialog`(lines 371-410, SoftwareValidationContent.tsx) 1:1 답습. 통합 승인의 `commentRequired`와 시맨틱 정합 (선택 입력, optional). 

**B1 — 도메인 전반 audit 매트릭스 (사전 결과)**

| 메서드 | DTO | Service 시그니처 | DB 컬럼 | 갭 | 처리 |
|--------|-----|-------------------|---------|----|------|
| `approve` | `approveValidationSchema` (`approvalComment?: string`) | `approve(id, version, approverId, approvalComment?)` | `approval_comment` (✅ 0048) | ✅ resolved (직전 세션) | 무변경 |
| `qualityApprove` | `approveValidationSchema` 재사용 (`approvalComment?` 포함) | `qualityApprove(id, version, approverId)` — **코멘트 파라미터 없음** | 컬럼 부재 (`quality_approval_comment`) | 🔴 **silent loss + DTO drift**: pipe가 코멘트 받지만 service는 폐기 | **본 sprint Phase B1 대상** — controller→service 시그니처 + DTO 분리 또는 컬럼 신설 결정 |
| `reject` | `rejectValidationSchema` (`rejectionReason: string`) | `reject(id, version, rejectedById, reason)` | `rejection_reason` (✅) | ✅ OK | 무변경 (validation 통과) |
| `revise` | `submitValidationSchema` (`version` only — pipe 재사용) | `revise(id, version)` | N/A | ✅ OK (의도적으로 코멘트 없음 — 재작업이라서) | 무변경 |
| `submit` | `submitValidationSchema` | `submit(id, version, submitterId)` | `submitted_by` (✅) | ✅ OK | 무변경 |
| `update` | `updateValidationSchema` | `update(id, dto)` (도메인 필드 전부) | (각 컬럼) | ✅ OK | 무변경 |
| `create` | `createValidationSchema` | `create(testSoftwareId, dto, createdBy)` | (각 컬럼) | ✅ OK | 무변경 |

→ **B1 핵심 발견**: `qualityApprove`도 silent loss. controller(line 178-188)가 `ApproveValidationPipe` 사용 → DTO에 `approvalComment` 파라미터가 통과하지만 service `qualityApprove(id, version, approverId)`는 코멘트 인자 자체 없음. ISO/IEC 17025 §6.2.2 동일 audit trail 요구.

**B2 — 정적 회귀 게이트 위치 결정**
- `verify-ssot/SKILL.md`: 44 step. SSOT 임포트 / config / 매핑 / 패턴 검증 도메인.
- `verify-implementation/SKILL.md`: 순수 실행기. 자체 룰 없음 → 신규 룰 추가 부적합.
- `verify-zod/SKILL.md`: DTO ↔ controller pipe ↔ service 인자 정합 검증 도메인. **silent loss = pipe 통과 필드가 service 시그니처에 없음** → verify-zod의 자연 영역.
- `verify-cas/SKILL.md`: `updateWithVersion` 호출 + casVersion 일관성. 본 패턴과 무관.
- `scripts/self-audit.mjs`: pre-commit gate. 7대 룰. underscore prefix silent loss는 룰 1개 추가 가능 (런타임 grep).

→ **결정**: 정적 회귀를 **2중 배치**로 fail-closed.
  1. `verify-zod` Step N (신설): "controller pipe DTO 필드와 service 호출 인자 mapping 정합" — pipe 통과 필드 모두 service.method에 전달 검증.
  2. `scripts/self-audit.mjs` 룰 신설: backend `*.service.ts` 메서드 파라미터에 `_[a-zA-Z]\w+:` 패턴 (underscore prefix lint-바이패스) 탐지 → fail.

**C1 — pre-push hook lint 추가 위치**
- 현재: `pnpm tsc --noEmit && backend test && frontend test`. lint는 `lint-staged`(pre-commit)만.
- 회귀: PC 이동/cherry-pick/rebase 후 lint 미실행으로 main에 lint error 침투 (직전 세션 식별).
- 결정: `pnpm --filter backend run lint:ci && pnpm --filter frontend run lint`을 backend/frontend 테스트 직전에 직렬 실행. 시간 부담은 lint-staged와 중복이지만 안전 ≫ 시간.
- frontend lint는 `next lint`라 느림(20-40초). backend lint:ci는 ESLint 직접(10-20초). 직렬 OK.

## 비하드코딩 / SSOT / 워크플로우 / 성능 / 보안 원칙

### 모든 Phase 공통 원칙

- **SSOT 경유**: comment max length는 `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` (DTO 변경 시), 마이그레이션 파일명은 `0049_xxx.sql` 컨벤션, audit_log entityType은 `'software_validation'` 변경 금지.
- **server-side userId**: `extractUserId(req)` SSOT (controller 변경 시 보존).
- **CAS 보존**: `updateWithVersion` 패턴 유지. 코멘트 추가가 version 무효화하지 않도록 동일 update payload에 포함.
- **i18n parity**: ko/en 동시 추가, `verify-i18n` Step 16 통과.
- **Audit trail**: ISO/IEC 17025 §6.2.2. 코멘트 = 승인자 검토 의견 audit 의무.
- **Hardcoded URL/queryKey 0건**: API 호출은 `API_ENDPOINTS.SOFTWARE_VALIDATIONS.*` 경유.
- **Disabled with reason** (메모리 교훈): UI에서 코멘트가 optional이므로 입력 없어도 enable. min length 강제 시 disabled + tooltip 사유 표시.
- **Server fail-close 순서**: scope → FSM → domain validation 순. 본 sprint는 컬럼 추가만 → 기존 가드 보존.

### 성능
- 컬럼 추가는 `text` 타입 nullable → 기존 행 NULL 채워짐. INDEX 불필요(쿼리 조건 부재).
- frontend approveDialog는 `useState` 1개만 추가. 기존 `rejectDialog` 패턴과 동일 메모리 footprint.
- Integration test 1건 추가 → e2e suite 시간 +5-10초 (수용).

### 보안
- `approvalComment`는 `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH = 500` Zod 검증 (DTO 변경 없음). XSS/SQL injection은 Drizzle parameterized query + frontend `Textarea` 단순 표시로 차단.
- audit_log는 controller `@AuditLog` 데코레이터가 `request.body` 자동 기록 (audit.interceptor.ts:287-291). 변경 없음.
- B1 qualityApprove 코멘트 추가 시 동일 audit trail 자동 적용.

---

## Phase A1 — DB 실제 적용

**결정**: **(c) `psql`로 직접 ALTER TABLE 실행 + journal 수동 entry 추가**.

근거:
- `db:reset`은 모든 데이터 손실 (지난 세션의 작업 데이터 보존 필요).
- `db:push`는 journal/snapshot 우회 → 향후 generate 시 drift 위험. CLAUDE.md "dev prototyping only" 명시.
- 직접 `psql` + journal entry는 0026~0047이 사용하는 검증된 패턴 (commit `e2553623` 등).

### 실행 단계

1. **Postgres 컨테이너 상태 확인** (predev guard):
   ```bash
   docker compose ps --status running postgres
   ```

2. **0048 SQL 적용**:
   ```bash
   docker compose exec -T postgres \
     psql -U postgres -d equipment_management -v ON_ERROR_STOP=1 \
     < apps/backend/drizzle/0048_add_software_validation_approval_comment.sql
   ```

3. **컬럼 검증**:
   ```bash
   docker compose exec -T postgres \
     psql -U postgres -d equipment_management \
     -c "\d software_validations" | grep approval_comment
   # expected: approval_comment | text |
   ```

4. **journal entry 수동 추가** (`apps/backend/drizzle/meta/_journal.json` `entries` 배열 끝):
   ```json
   {
     "idx": 48,
     "version": "7",
     "when": <epoch_millis_now>,
     "tag": "0048_add_software_validation_approval_comment",
     "breakpoints": true
   }
   ```
   `when`은 0047의 `1746057600000` 이후 monotonic 증가하는 epoch ms (예: `Date.now()`).

5. **drizzle-kit migrate dry-run** (실제 적용 안 됨 — 이미 적용된 상태에서 idempotent 확인):
   ```bash
   pnpm --filter backend exec drizzle-kit migrate
   # expected: "0048_add_software_validation_approval_comment" applied (or already applied)
   # 컬럼 IF NOT EXISTS이므로 재실행 안전
   ```

### 검증 명령
```bash
# A1.1 — 컨테이너 실행
docker compose ps --status running postgres | grep postgres

# A1.2 — 컬럼 존재
docker compose exec -T postgres psql -U postgres -d equipment_management \
  -tc "SELECT column_name FROM information_schema.columns WHERE table_name='software_validations' AND column_name='approval_comment';" \
  | grep approval_comment

# A1.3 — journal entry
node -e "const j=require('./apps/backend/drizzle/meta/_journal.json'); const last=j.entries.at(-1); if(last.tag!=='0048_add_software_validation_approval_comment') process.exit(1)"

# A1.4 — drizzle migrate idempotent
pnpm --filter backend exec drizzle-kit migrate
```

### 영향 범위
- `apps/backend/drizzle/meta/_journal.json` (entries 배열 1줄 추가 — 7줄 JSON object)
- 외부: PostgreSQL `software_validations` 테이블 (1 컬럼 추가, 무손실)

---

## Phase A2 — Integration test

**결정**: **`apps/backend/test/software-validations.e2e-spec.ts` 신설**. NestJS e2e 인프라 사용 (실제 PostgreSQL + supertest).

근거:
- jest unit spec(`*.service.spec.ts`)은 mock Drizzle chain만 검증 → snake_case 변환·실제 SQL 발행 미실측.
- `apps/backend/test/jest-e2e.json` 인프라 (`globalSetup` + `loginAs` + `createTestApp`)는 24개 모듈 e2e가 검증된 표준.
- software-validations는 e2e spec 자체 부재 → 본 sprint가 첫 도입. 향후 reject/qualityApprove도 동일 spec에 추가 가능.

### 신규 파일

`apps/backend/test/software-validations.e2e-spec.ts`:

```typescript
/// <reference types="jest" />
import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs, TEST_USER_IDS } from './helpers/test-auth';
import { TEST_SOFTWARE_DAK_ID } from '../src/database/seed-data/software/test-software.seed';
// 또는 별도 testSoftware fixture를 spec 내에서 INSERT

describe('SoftwareValidations approve approvalComment persistence (e2e)', () => {
  let ctx: TestAppContext;
  let submitterToken: string;
  let approverToken: string;
  // beforeAll: createTestApp + loginAs (admin/manager) + 테스트용 software_validation row INSERT (status: 'submitted')
  // afterAll: row 정리 + closeTestApp

  it('approve(uuid, version, approvalComment) persists comment', async () => {
    // submitter !== approver (ISO 17025)
    const validationId = ...; // beforeAll에서 생성한 row id
    const res = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.APPROVE(validationId))
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ version: 1, approvalComment: 'E2E 검토 완료' });
    expect(res.status).toBe(200);
    expect(res.body.approvalComment).toBe('E2E 검토 완료');

    // DB direct verification (postgres client) — Drizzle ORM 패스스루 보장
    // 컬럼명 snake_case 변환 회귀 차단
  });

  it('approve(uuid, version) without approvalComment persists NULL', async () => {
    // 별도 row + 호출 후 SELECT approval_comment IS NULL 검증
  });
});
```

### 검증 명령
```bash
# A2.1 — spec 존재 + describe 라벨
test -f apps/backend/test/software-validations.e2e-spec.ts
grep -n "approvalComment persistence" apps/backend/test/software-validations.e2e-spec.ts

# A2.2 — 실제 e2e 실행 (실 DB 호출)
pnpm --filter backend run test:e2e -- software-validations

# A2.3 — DB 직접 SELECT 패턴 (mock 우회 검증)
grep -nE "approval_comment.*=|column.*approval_comment" apps/backend/test/software-validations.e2e-spec.ts
```

### 영향 범위
- `apps/backend/test/software-validations.e2e-spec.ts` (신규, ~150줄)

---

## Phase A3 — Frontend UI audit + 신설

**결정**: 도메인 직접 페이지 `SoftwareValidationContent.tsx`에 **`approveDialog` 신설** (rejectDialog 1:1 답습 패턴).

audit 결과 (위 코드베이스 탐색 결과 §A3 매트릭스 참조):
- 통합 승인 페이지: ✅ 완전 구현 (변경 0)
- 도메인 직접 페이지: ❌ approve UI 미구현. backend는 컬럼 + persist 완료, frontend API 시그니처도 OK, **UI만 갭**.

### 변경 파일

1. **`apps/frontend/messages/ko/software.json`**: `validation.approveDialog` 객체 추가.
   ```json
   "approveDialog": {
     "title": "기술책임자 승인",
     "commentLabel": "검토 의견",
     "commentPlaceholder": "검토 의견을 입력하세요 (선택)",
     "commentHelp": "ISO/IEC 17025 §6.2.2 — 승인 이력에 영구 기록됩니다",
     "cancel": "취소",
     "confirm": "승인",
     "submitting": "처리 중..."
   },
   "qualityApproveDialog": {
     "title": "품질책임자 승인",
     ...동일 구조
   }
   ```

2. **`apps/frontend/messages/en/software.json`**: 영문 키 동시 추가 (verify-i18n Step 16 parity).

3. **`SoftwareValidationContent.tsx`**:
   - `useState`: `isApproveOpen / approveTarget / approveComment` 3개 추가 (rejectDialog 패턴 답습).
   - `approveMutation.mutate({ id, version, approvalComment })` 시그니처 갱신 → API 호출 시 `softwareValidationApi.approve(id, version, approvalComment || undefined)` 전달.
   - 동일 다이얼로그 구조 (rejectDialog 371-410줄 1:1 답습): `Dialog` + `DialogTitle` + `Textarea` + `DialogFooter`. ARIA: `aria-describedby`로 commentHelp 연결.
   - max length: `maxLength={500}` (`VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` import).
   - qualityApprove도 동일 다이얼로그 (B1과 함께 — service 변경 후 활성화).

4. **`ValidationActionsBar.tsx`**: approve 버튼 onClick → `onApprove(v)` 콜백으로 위임 (현재 `approveMutation.mutate({ id, version })` 직접 → SoftwareValidationContent의 dialog open으로 변경). qualityApprove도 동일.

### useOptimisticMutation 시그니처 변경

```typescript
// before
const approveMutation = useOptimisticMutation<SoftwareValidation, { id: string; version: number }, ValidationCache>({
  mutationFn: ({ id, version }) => softwareValidationApi.approve(id, version),
  ...
});
// after
const approveMutation = useOptimisticMutation<SoftwareValidation, { id: string; version: number; approvalComment?: string }, ValidationCache>({
  mutationFn: ({ id, version, approvalComment }) =>
    softwareValidationApi.approve(id, version, approvalComment),
  ...
});
```

### 검증 명령
```bash
# A3.1 — i18n parity
node scripts/check-i18n-keys.mjs --changed
node scripts/check-i18n-call-sites.mjs --all --quiet

# A3.2 — 다이얼로그 구조
grep -n "approveDialog\|approvalComment" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx
grep -n "validation.approveDialog" apps/frontend/messages/ko/software.json apps/frontend/messages/en/software.json

# A3.3 — API 호출에 approvalComment 전달
grep -n "softwareValidationApi.approve(" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx
# expected: 'softwareValidationApi.approve(id, version, approvalComment || undefined)' 또는 등가 패턴

# A3.4 — VALIDATION_RULES SSOT
grep -n "VALIDATION_RULES.LONG_TEXT_MAX_LENGTH\|maxLength={500}" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx

# A3.5 — frontend tsc + lint + test
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend run test --silent
```

### 영향 범위
- `apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx` (수정 — useState + dialog + mutation type)
- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationActionsBar.tsx` (수정 — onApprove/onQualityApprove 콜백 prop 추가)
- `apps/frontend/messages/ko/software.json` (수정 — approveDialog/qualityApproveDialog 추가)
- `apps/frontend/messages/en/software.json` (수정 — 동일)

---

## Phase B1 — 도메인 전반 audit

**결정**: 사전 매트릭스 기반 — `qualityApprove` silent loss만 closure (다른 메서드는 OK 확인됨).

### qualityApprove silent loss closure

**갭 본질**: controller가 `ApproveValidationPipe` 재사용 → DTO `approvalComment` 통과하지만 service `qualityApprove(id, version, approverId)` 폐기. ISO/IEC 17025 §6.2.2 동일 audit trail 요구.

**옵션**:
- (a) **컬럼 분리**: `quality_approval_comment` 신설 → 기술/품질 코멘트 시계열 독립 보존. audit 명확.
- (b) **컬럼 공유**: `approval_comment` 단일 → 마지막 승인자 코멘트로 overwrite. audit_log 의존.
- (c) **DTO 분리**: `qualityApproveValidationSchema` 신설 + `qualityApprovalComment` 컬럼 신설.

**결정**: **(c) 분리**. 이유:
- `disposal_requests`/`calibration_plans` 패턴은 단일 승인자라 비교 불가.
- 기술/품질 승인은 책임 다르고 시점 다름. audit 명확성 ≫ 컬럼 1개 절약.
- `approveValidationSchema`는 `approve` 전용으로 해석 자연스러움.

### 변경 파일

1. **DB schema** (`packages/db/src/schema/software-validations.ts`): `qualityApprovalComment: text('quality_approval_comment')` 컬럼 추가 (74줄 `approvalComment` 직후).

2. **Migration** `apps/backend/drizzle/0049_add_software_validation_quality_approval_comment.sql`:
   ```sql
   ALTER TABLE "software_validations"
     ADD COLUMN IF NOT EXISTS "quality_approval_comment" text;
   ```
   + rollback `rollback_0049_*.sql`.

3. **DTO** (`apps/backend/src/modules/software-validations/dto/approve-validation.dto.ts`): `qualityApproveValidationSchema` 신설 (`approveValidationSchema`와 동일 구조이지만 명시적 분리). `index.ts` export.

4. **Service** (`software-validations.service.ts:qualityApprove`): 시그니처 `qualityApprove(id, version, approverId, qualityApprovalComment?: string)` + `qualityApprovalComment: qualityApprovalComment || null` persist.

5. **Controller** (`software-validations.controller.ts:181`): `QualityApproveValidationPipe` 사용 + `dto.qualityApprovalComment` 전달.

6. **Spec** (`__tests__/software-validations.service.spec.ts`): `qualityApprove` 4 케이스 추가 (approve와 동일 패턴 — persist / undefined→null / empty→null / regression guard).

7. **A1과 동일하게 0049 적용** (psql + journal entry).

8. **A3 Frontend `qualityApproveDialog`** 활성화 (i18n 키 이미 추가 — Phase A3에 포함).

### 검증 명령
```bash
# B1.1 — 컬럼 + DTO + service 시그니처 정합
grep -n "qualityApprovalComment\|quality_approval_comment" packages/db/src/schema/software-validations.ts apps/backend/drizzle/0049_*.sql apps/backend/src/modules/software-validations/dto/approve-validation.dto.ts apps/backend/src/modules/software-validations/software-validations.service.ts

# B1.2 — 0049 SQL 적용 (Phase A1과 동일 패턴)
docker compose exec -T postgres psql -U postgres -d equipment_management \
  -tc "SELECT column_name FROM information_schema.columns WHERE table_name='software_validations' AND column_name='quality_approval_comment';" \
  | grep quality_approval_comment

# B1.3 — service spec 4 케이스
grep -cE "qualityApprovalComment.*제공|qualityApprovalComment.*undefined|qualityApprovalComment.*빈 문자열|기존 필드가 보존" apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts

# B1.4 — 다른 메서드 매트릭스는 무변경 (revise/submit/update/create/reject)
git diff HEAD -- apps/backend/src/modules/software-validations/software-validations.service.ts \
  | grep -E "^[+-].*async (revise|submit|update|create|reject)\(" \
  | wc -l   # = 0
```

### 영향 범위
- `packages/db/src/schema/software-validations.ts` (수정)
- `apps/backend/drizzle/0049_add_software_validation_quality_approval_comment.sql` (신규)
- `apps/backend/drizzle/rollback_0049_*.sql` (신규)
- `apps/backend/drizzle/meta/_journal.json` (entries 1개 추가)
- `apps/backend/src/modules/software-validations/dto/approve-validation.dto.ts` (수정)
- `apps/backend/src/modules/software-validations/dto/index.ts` (수정)
- `apps/backend/src/modules/software-validations/software-validations.service.ts` (수정 — qualityApprove)
- `apps/backend/src/modules/software-validations/software-validations.controller.ts` (수정 — qualityApprove)
- `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` (수정 — 4 케이스)
- `apps/frontend/lib/api/software-api.ts` (수정 — `qualityApprove(id, version, qualityApprovalComment?)` 시그니처 + body field)

---

## Phase B2 — 정적 회귀 게이트

**결정**: 2중 배치 (정적+CI 모두).

### B2-1: `verify-zod` Step 14 신설 — DTO ↔ service 인자 정합

`/.claude/skills/verify-zod/SKILL.md`에 Step 14 추가:

```markdown
### Step 14: Pipe DTO 통과 필드 ↔ service 호출 인자 매핑 정합 (silent loss 차단, 2026-04-28 추가)

**탐지 대상**: controller에서 `@UsePipes(SomePipe)` 적용 후 `service.method(...)` 호출 시 DTO에 정의된 도메인 필드가 service 시그니처에서 누락되어 silent loss가 발생하는 케이스.

**원인**: 
- service 메서드 작성 시 DTO 필드 무시 → ESLint underscore prefix 우회
- DTO 필드 추가 시 service 시그니처 미동기화

**검증 명령**:
\`\`\`bash
# 1. service 메서드 파라미터에 underscore prefix (= 의도적 미사용 표시) 0건
grep -rnE "async\s+\w+\([^)]*_[a-zA-Z]\w+:" apps/backend/src/modules/**/*.service.ts | grep -v ".spec.ts"

# 2. DTO `approvalComment` 필드를 controller에서 전달하지 않는 호출 탐지 (예시 패턴 — 도메인별 확장)
\`\`\`

**예외**:
- spec 파일 내 mock 메서드는 underscore prefix 허용
- VersionedBaseService 같은 base class의 `_unused?` 호환 파라미터는 별도 정당화 주석 (`// allowed:` 추가)

**관련 사고**: `software-validation-approve-comment-silent-loss` (2026-04-28) — `_approvalComment` underscore prefix가 lint를 통과시켰지만 도메인 가치 0. 1주일간 silent loss.
```

### B2-2: `scripts/self-audit.mjs` 룰 신설 — backend service underscore prefix

```javascript
// SELF_AUDIT_RULES_NEW.mjs 패턴
function checkServiceParamUnderscore(file, lines) {
  if (!/apps\/backend\/src\/modules\/.*\.service\.ts$/.test(file)) return;
  if (isTestFile(file)) return;
  const re = /async\s+\w+\(\s*[^)]*_[a-zA-Z]\w*\s*:/;
  lines.forEach((line, i) => {
    if (re.test(line) && !line.includes('// allowed:')) {
      fail('service-param-underscore-prefix', file, i + 1,
        `Service method parameter has underscore prefix (silent loss risk). ` +
        `Either use the parameter or document with "// allowed: <reason>"`);
    }
  });
}
// 7대 룰 다음에 8번째로 추가
```

`docs/references/self-audit.md`에 8번째 룰 항목 추가.

### B2-3: skills-index.md 갱신 (verify-zod Step 14 신설 명시)

### 검증 명령
```bash
# B2.1 — verify-zod Step 14 등재
grep -n "Step 14:.*Pipe DTO\|silent loss" .claude/skills/verify-zod/SKILL.md

# B2.2 — self-audit 룰 추가
grep -n "service-param-underscore-prefix\|checkServiceParamUnderscore" scripts/self-audit.mjs

# B2.3 — self-audit 정상 작동 (직전 fix 코드 통과 확인)
node scripts/self-audit.mjs --all 2>&1 | grep -E "service-param-underscore-prefix" | head
# expected: 0건 (직전 세션이 underscore prefix 제거함)

# B2.4 — skills-index.md 갱신
grep -n "verify-zod Step 14" docs/references/skills-index.md
```

### 영향 범위
- `.claude/skills/verify-zod/SKILL.md` (수정 — Step 14 추가)
- `scripts/self-audit.mjs` (수정 — 8번째 룰 함수 + dispatcher)
- `docs/references/self-audit.md` (수정 — 8번째 룰 항목)
- `docs/references/skills-index.md` (수정 — verify-zod Step 14 표기)

---

## Phase C1 — pre-push hook lint

**결정**: `.husky/pre-push`에 backend + frontend lint:ci 직렬 추가 (tsc 다음, test 직전).

### 변경 diff

```diff
 echo "▶ pre-push: TypeScript check..."
 pnpm tsc --noEmit
 
+echo "▶ pre-push: backend lint..."
+pnpm --filter backend run lint:ci
+
+echo "▶ pre-push: frontend lint..."
+pnpm --filter frontend run lint
+
 echo "▶ pre-push: i18n call-sites parity..."
 node scripts/check-i18n-call-sites.mjs --all --quiet
 
 echo "▶ pre-push: backend tests..."
```

### 검증 명령
```bash
# C1.1 — hook 변경 라인
grep -n "lint:ci\|filter frontend run lint" .husky/pre-push

# C1.2 — hook 실행 시간 측정 (선택 — 사용자 확인용)
time bash .husky/pre-push
# expected: 추가 시간 < 60초 (사용자 수용 기준)
```

### 영향 범위
- `.husky/pre-push` (수정 — 6줄 추가)

---

## 영향 범위 (전체)

```
apps/backend/drizzle/
  meta/_journal.json                        (수정 — 0048, 0049 entries)
  0049_add_software_validation_quality_approval_comment.sql  (신규)
  rollback_0049_*.sql                       (신규)
apps/backend/src/modules/software-validations/
  dto/approve-validation.dto.ts             (수정 — qualityApprove schema 분리)
  dto/index.ts                              (수정 — qualityApproveValidationPipe export)
  software-validations.service.ts           (수정 — qualityApprove)
  software-validations.controller.ts        (수정 — qualityApprove pipe + dto field)
  __tests__/software-validations.service.spec.ts  (수정 — qualityApprove 4 케이스)
apps/backend/test/
  software-validations.e2e-spec.ts          (신규)
packages/db/src/schema/software-validations.ts  (수정 — qualityApprovalComment)
apps/frontend/
  app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx  (수정 — approveDialog/qualityApproveDialog)
  app/(dashboard)/software/[id]/validation/_components/ValidationActionsBar.tsx  (수정 — onApprove/onQualityApprove)
  lib/api/software-api.ts                   (수정 — qualityApprove signature)
  messages/ko/software.json                 (수정 — approveDialog/qualityApproveDialog)
  messages/en/software.json                 (수정 — 동일)
.claude/skills/verify-zod/SKILL.md          (수정 — Step 14)
scripts/self-audit.mjs                      (수정 — 8번째 룰)
docs/references/self-audit.md               (수정 — 8번째 룰 문서)
docs/references/skills-index.md             (수정 — verify-zod Step 14)
.husky/pre-push                             (수정 — lint 추가)
```

PostgreSQL DB:
- `software_validations` 테이블 — `approval_comment text` (Phase A1) + `quality_approval_comment text` (Phase B1) 컬럼 추가.

---

## 검증 명령 (일괄)

```bash
# === A1 ===
docker compose ps --status running postgres | grep postgres
docker compose exec -T postgres psql -U postgres -d equipment_management \
  -tc "SELECT column_name FROM information_schema.columns WHERE table_name='software_validations' AND column_name IN ('approval_comment','quality_approval_comment');"
node -e "const j=require('./apps/backend/drizzle/meta/_journal.json'); const tags=j.entries.map(e=>e.tag); ['0048_add_software_validation_approval_comment','0049_add_software_validation_quality_approval_comment'].forEach(t=>{if(!tags.includes(t)) {console.error('missing:',t);process.exit(1)}})"

# === A2 ===
test -f apps/backend/test/software-validations.e2e-spec.ts
pnpm --filter backend run test:e2e -- software-validations

# === A3 ===
node scripts/check-i18n-keys.mjs --changed
node scripts/check-i18n-call-sites.mjs --all --quiet
grep -n "validation.approveDialog\|validation.qualityApproveDialog" apps/frontend/messages/ko/software.json apps/frontend/messages/en/software.json
grep -n "approvalComment\|qualityApprovalComment" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx

# === B1 ===
grep -n "qualityApprovalComment" packages/db/src/schema/software-validations.ts apps/backend/src/modules/software-validations/{dto,services}/*.ts apps/backend/src/modules/software-validations/software-validations.{service,controller}.ts apps/frontend/lib/api/software-api.ts

# === B2 ===
grep -n "Step 14:" .claude/skills/verify-zod/SKILL.md
grep -n "service-param-underscore-prefix" scripts/self-audit.mjs
node scripts/self-audit.mjs --all 2>&1 | grep -c "service-param-underscore-prefix"  # = 0

# === C1 ===
grep -n "filter backend run lint:ci\|filter frontend run lint" .husky/pre-push

# === 통합 ===
pnpm tsc --noEmit
pnpm --filter backend run lint:ci
pnpm --filter frontend run lint
pnpm --filter backend run test --silent
pnpm --filter frontend run test --silent
pnpm --filter backend run test:e2e -- software-validations

# === Final ===
bash .husky/pre-push   # full pre-push hook 실행 (lint + test 모두)
```

---

## 워크플로우 / 성능 / 보안

### 워크플로우
- 통합 승인 페이지(`/admin/approvals?tab=software`)는 변경 0 — `commentRequired=true` 패턴 그대로.
- 도메인 직접 페이지(`/software/[id]/validation`) approve/qualityApprove는 dialog UX 추가 → 기존 1-click 흐름이 2-click(승인 → 코멘트 → 확인)으로 변경. 코멘트는 optional이라 즉시 확인 가능.
- audit_log에는 `request.body.approvalComment` 자동 기록 (audit.interceptor.ts:287-291). 시계열 추적 SSOT는 audit_log + DB 컬럼 이중.

### 성능
- DB: 컬럼 2개 추가 (`text` nullable). 기존 행 NULL 채워짐. INDEX 미생성 (쿼리 조건 부재).
- Backend: service `update()` payload 크기 +500 bytes max. 무시 가능.
- Frontend: useState 6개 추가 (approve/quality 각 3). 메모리 footprint 무시 가능.
- e2e suite: software-validations spec 1개 추가 → 시간 +5-10초.
- pre-push: lint 추가로 총 +30-60초. 사용자 수용 한도 내 (기존 60-90초 → 90-150초).

### 보안
- 코멘트는 `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH = 500` Zod 검증 (DTO 변경 없음).
- XSS: frontend `Textarea` 단순 표시 (HTML 인터프리트 없음). React 자동 escape.
- SQL injection: Drizzle parameterized query.
- ISO/IEC 17025 §6.2.2 audit trail: DB 컬럼 + audit_log 이중. 컬럼 DROP 시 audit_log에서 복원 가능.
- self-approval/dual-approval 가드는 무변경 (`assertIndependentApprover`).

---

## 롤백 전략

### Phase A1 (DB 0048)
```bash
# Service 코드는 회귀 안전 (`approvalComment || null` 그대로 작동, 컬럼 없으면 500이지만 service에서 catch 권장)
# 컬럼만 DROP (audit_log에 코멘트 보존)
docker compose exec -T postgres psql -U postgres -d equipment_management \
  < apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql
# journal entry 0048 삭제 (수동)
```

### Phase A2 (e2e spec)
```bash
rm apps/backend/test/software-validations.e2e-spec.ts
```

### Phase A3 (frontend UI)
```bash
git checkout HEAD -- apps/frontend/app/\(dashboard\)/software/\[id\]/validation/ apps/frontend/messages/{ko,en}/software.json
```
→ 통합 승인 페이지는 영향 0이므로 사용자가 코멘트 입력 못 하는 경로만 복원.

### Phase B1 (qualityApprove)
```bash
docker compose exec -T postgres psql -U postgres -d equipment_management \
  < apps/backend/drizzle/rollback_0049_*.sql
git checkout HEAD~1 -- packages/db/src/schema/software-validations.ts \
  apps/backend/src/modules/software-validations/{dto,*.service.ts,*.controller.ts,__tests__}/* \
  apps/frontend/lib/api/software-api.ts
# journal entry 0049 삭제
```

### Phase B2 (정적 게이트)
```bash
git checkout HEAD~1 -- .claude/skills/verify-zod/SKILL.md scripts/self-audit.mjs docs/references/{self-audit,skills-index}.md
```
→ 게이트 비활성화, 미래 회귀 차단 손실. 코드 회귀 위험 0.

### Phase C1 (pre-push lint)
```bash
git checkout HEAD~1 -- .husky/pre-push
```
→ pre-push 시간 단축, 회귀 차단 손실.

---

## 외부 의존 / 미해결 위험

### TTY 제약
- `drizzle-kit generate` 실행 (snapshot 자동 생성)는 TTY 환경 필요. 본 sprint는 hand-written SQL + journal 수동 entry로 우회 (0026~0047 동일 패턴).
- 사용자가 추후 schema 변경 시 `pnpm --filter backend run db:generate`을 TTY에서 실행해야 snapshot 정합성 회복.

### Frontend 통합 승인 페이지 ApprovalsClient의 software 분기
- approvals-api.ts:906 `softwareValidationApi.approve(id, validation.version, comment || undefined)` — `comment`는 통합 승인 page에서 입력. 무변경 (이미 OK).

### 미해결 후속 (tech-debt 등재)
- B1: `quality_approval_comment` 컬럼 분리 결정에 대한 audit_log 메타데이터 정합성 (audit_log는 request.body 자동 기록 → `approvalComment` vs `qualityApprovalComment` 키 분리됨, OK).
- C1: pre-push lint 추가 후 사용자 push 시간 측정 → 60초 초과 시 frontend lint를 backend lint:ci 같은 ESLint 직접 실행으로 전환 검토.

### 도메인 데이터 임의 생성 금지 (메모리 교훈)
- approveDialog i18n 텍스트는 본 plan에 명시한 패턴(검토 의견/검토 의견을 입력하세요) 사용. **사용자 도메인 어휘 미확정 시 1차 plan 검토 후 사용자 확인 받음**.

### Git 전면 위임
- 모든 단계 완료 후 사용자 트리거에 따라 commit. 본 sprint plan/contract 자체는 commit 권장 (`docs:` scope).

---

## Phase 순서 의존성

```
A1 (DB)        → A2 (e2e)         → A3 (UI)        → B1 (qualityApprove)  → B2 (정적 gate) → C1 (pre-push)
컬럼 적용         실DB 검증           UI 신설           qualityApprove 동등        회귀 차단        시간 게이트
```

- A1 → A2: e2e가 컬럼 존재 의존.
- A1 → A3: A3 코드 빌드는 OK이지만 frontend e2e 테스트는 컬럼 의존.
- A1+A3 → B1: 동일 패턴 답습이라 A 시리즈 완료 후 B1 진행 권장.
- B2/C1: 독립. 병렬 OK.
