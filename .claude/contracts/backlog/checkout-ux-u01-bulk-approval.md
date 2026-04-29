---
slug: checkout-ux-u01-bulk-approval
type: contract
date: 2026-04-24
depends: [checkout-next-step-panel-unified, checkout-row-3zone-grid]
sprint: 4
sprint_step: 4.5.U-01
---

# Contract: Sprint 4.5 · U-01 — 일괄 승인 + 단축키 A + `BulkActionBar` + `POST /checkouts/bulk-approve`

## Context

V2 §8 편의성 1순위: 승인자 역할의 반복 단일 승인 → "N건 골라서 한 번에 승인" 플로우.

- **기존 자산 재활용**: MEMORY.md `tech-debt-tracker Rev2` — `useRowSelection`·`BulkActionBar`이 이미 SSOT로 승격됨.
- **서버**: 단일 approve 엔드포인트 N회 호출 시 트랜잭션 경계 흩어짐 + CAS 버전 충돌 개별 발생. **트랜잭션 일괄 엔드포인트** `POST /checkouts/bulk-approve` 신설 필수.
- **보안**: `PermissionsGuard` + `Permission.APPROVE_CHECKOUT` 요구. MEMORY.md "보안 fail-close 순서: scope → FSM → domain validation" 준수 — bulk에서도 동일.
- **부분 실패 UX**: 일부 CAS 409 발생 시 성공 건만 반영, 실패 목록 토스트 표시.

---

## Scope

### 수정 대상
- **Frontend**
  - `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — 그룹 헤더에 체크박스 + 개별 row 체크박스 추가. `indeterminate` 상태 지원.
  - `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` / `InboundCheckoutsTab.tsx` — `useRowSelection` 적용, 선택 N건 시 `<BulkActionBar>` 스티키 하단 렌더.
  - `apps/frontend/hooks/use-keyboard-shortcuts.ts` (U-02와 공유, U-02가 선행) — `A` = 현재 그룹 전체 선택, `Shift+A` = 선택 해제.
  - `apps/frontend/components/shared/BulkActionBar.tsx` (이미 SSOT 존재) — `actions` prop에 "승인"/"반려" 2버튼 추가. 승인 모달 1회 (공통 이유 입력 옵션).
  - `apps/frontend/hooks/use-bulk-approve.ts` (신규) — `useMutation` wrap. 성공/실패 집계 + 토스트.
- **Backend**
  - `apps/backend/src/modules/checkouts/checkouts.controller.ts` + `checkouts.service.ts` — `POST /checkouts/bulk-approve` 신규 엔드포인트.
    - Body: `{ checkoutIds: string[]; reason?: string; versions: Record<string, number> }` (CAS)
    - 응답: `{ succeeded: string[]; failed: Array<{ id: string; code: 'VERSION_CONFLICT' | 'NOT_ALLOWED' | 'NOT_FOUND'; message: string }> }`
    - 트랜잭션: 각 건 개별 transaction (N건 중 1건 실패해도 다른 건 커밋). 대안: 전체 단일 tx + 실패 시 전부 롤백 — 논의 필요 (**MUST로 결정 사항 고정**: 건별 독립 tx, 부분 성공 허용).
  - `apps/backend/src/modules/checkouts/dto/bulk-approve.dto.ts` (신규) — Zod schema + class-validator.
  - `apps/backend/src/modules/audit/audit.service.ts` — bulk action 로그 1회 (ids 배열 포함).
  - `PermissionsGuard` + `@RequirePermissions(Permission.APPROVE_CHECKOUT)` 적용.
- **공용**
  - `packages/schemas/src/checkouts/bulk-approve.ts` (신규) — request/response Zod schema + TS type.
  - `packages/shared-constants/src/api-endpoints.ts` — `API_ENDPOINTS.CHECKOUTS.BULK_APPROVE` 추가.
- **i18n**
  - `apps/frontend/messages/ko.json` + `en.json`:
    - `checkouts.bulk.selectAll` / `unselectAll` / `selected` ("{n}건 선택")
    - `checkouts.bulk.approveBtn` / `rejectBtn`
    - `checkouts.bulk.modal.title` / `description` / `reasonPlaceholder` / `confirmBtn` / `cancelBtn`
    - `checkouts.bulk.result.success` ("{n}건 승인 완료") / `partial` ("{succeeded}건 성공, {failed}건 실패") / `failure` ("모두 실패")

### 수정 금지
- 단일 approve 엔드포인트 (기존 경로 유지).
- `useRowSelection` 훅 내부 (재사용만).
- 다른 역할(requester/receiver) UI.

### 신규 생성
- Frontend hook `use-bulk-approve.ts`
- Backend DTO + service method
- Schema `bulk-approve.ts`

---

## 참조 구현

```typescript
// packages/schemas/src/checkouts/bulk-approve.ts
export const BulkApproveRequestSchema = z.object({
  checkoutIds: z.array(z.string().uuid()).min(1).max(50), // 상한 50
  reason: z.string().max(500).optional(),
  versions: z.record(z.string().uuid(), z.number().int().min(0)), // CAS per id
});

export const BulkApproveResponseSchema = z.object({
  succeeded: z.array(z.string().uuid()),
  failed: z.array(z.object({
    id: z.string().uuid(),
    code: z.enum(['VERSION_CONFLICT', 'NOT_ALLOWED', 'NOT_FOUND', 'INVALID_STATE']),
    message: z.string(),
  })),
});
```

```typescript
// apps/backend/src/modules/checkouts/checkouts.service.ts (bulkApprove)
async bulkApprove(
  dto: BulkApproveDto,
  approverId: string, // 서버 JWT 추출, 클라 신뢰 금지 (CLAUDE.md Rule 2)
): Promise<BulkApproveResponse> {
  const succeeded: string[] = [];
  const failed: BulkApproveFailure[] = [];
  for (const id of dto.checkoutIds) {
    try {
      await this.db.transaction(async (tx) => {
        // scope 검증 → FSM 검증 → domain 검증 순 (MEMORY.md "보안 fail-close 순서")
        await this.verifyScope(tx, id, approverId);
        await this.verifyCanApprove(tx, id, dto.versions[id]);
        await this.performApprove(tx, id, approverId, dto.reason);
      });
      succeeded.push(id);
    } catch (err) {
      failed.push(mapBulkFailure(id, err));
    }
  }
  await this.auditLog.emitBulkAction({
    action: 'CHECKOUT_BULK_APPROVE',
    actorId: approverId,
    successIds: succeeded,
    failedIds: failed.map(f => f.id),
  });
  return { succeeded, failed };
}
```

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + `pnpm --filter backend run lint` + `pnpm --filter frontend exec eslint` 통과 | 빌드/린트 |
| M2 | `POST /checkouts/bulk-approve` 엔드포인트 존재 + `PermissionsGuard` + `@RequirePermissions(Permission.APPROVE_CHECKOUT)` | grep + 단위 테스트 |
| M3 | `approverId`는 **서버 JWT에서 추출** (`req.user.userId`), body로부터 신뢰 0 | grep (CLAUDE.md Rule 2) |
| M4 | body `versions: Record<id, number>` CAS 버전 필수 — 미전송 시 400 | Zod + E2E |
| M5 | CAS 409 발생 시 해당 id만 `failed`에 수록, 성공 건은 commit 완료 | integration test |
| M6 | `auditLog` 1회 (bulk 단위) + 성공/실패 ids 포함 | audit 검증 |
| M7 | Frontend: 그룹 헤더 + row 체크박스 + indeterminate 상태 지원 | Playwright + DOM |
| M8 | `BulkActionBar`가 선택 0건이면 숨김, 1+건이면 스티키 렌더 | E2E |
| M9 | 단축키 `A` = 현재 그룹 전체 선택, `Shift+A` = 해제 (U-02와 통합) | keyboard E2E |
| M10 | 승인 모달 1회: 공통 사유 입력(선택) + confirm 시 bulk API 호출 | E2E |
| M11 | 부분 실패 토스트: "{succeeded}건 성공, {failed}건 실패 + 상세 보기" 링크 | E2E |
| M12 | 성공 건은 optimistic UI로 즉시 status 전환, 실패 건은 원복 | E2E + CAS cache invalidate (MEMORY.md) |
| M13 | CAS 409 발생 시 해당 row 캐시 삭제 (MEMORY.md "CAS 409 발생 시 backend detail 캐시 반드시 삭제") | cache event |
| M14 | i18n: 11개 키 양 로케일 (`ko`/`en`) 완전 | `jq` |
| M15 | `BulkApproveRequestSchema`의 `checkoutIds`는 max 50 상한 (DoS 가드) | Zod |
| M16 | 권한 우회 시도(requester role)에 대해 403 반환 — `PermissionsGuard` 통과 전 `availableActions` fail-closed | E2E |
| M17 | E2E: 10건 bulk 승인 (전부 성공) / 5건 중 2건 CAS 실패 / 권한 없음(role) 3가지 시나리오 통과 | Playwright |
| M18 | `api-endpoints.ts`에 `BULK_APPROVE` 상수 등록 (하드코딩 URL 0) | grep |
| M19 | 변경 파일 수 ≤ **12** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `POST /checkouts/bulk-reject` (반려 bulk) 동시 구현 | `bulk-reject-endpoint` |
| S2 | Bulk 진행률 인디케이터 (50건 중 32건 완료...) — SSE 또는 long-poll | `bulk-progress-indicator` |
| S3 | 승인 사유 프리셋(U-04 연계) chip을 bulk 모달에서도 사용 | `bulk-reason-presets-u04` |
| S4 | Bulk undo (U-05 연계) — 5초 내 취소 가능 | `bulk-undo-toast` |
| S5 | AuditLog에 ip/useragent 포함 | `bulk-audit-context` |
| S6 | Rate limit: user/IP당 bulk 호출 1분 10회 상한 (NestJS throttler) | `bulk-rate-limit` |

---

## Verification Commands

```bash
# 1. 빌드
pnpm tsc --noEmit
pnpm --filter backend run lint
pnpm --filter frontend exec eslint

# 2. 엔드포인트
grep -rn "@Post.*bulk-approve\|bulkApprove" apps/backend/src/modules/checkouts/
# 기대: controller + service 각 1+ hit

grep -n "PermissionsGuard\|@RequirePermissions" apps/backend/src/modules/checkouts/checkouts.controller.ts | grep -i bulk
# 기대: 1+ hit

# 3. userId 추출
grep -n "req.user.userId\|req\.user\?\.userId" apps/backend/src/modules/checkouts/checkouts.controller.ts | grep -iA2 bulk
# 기대: 1+ hit (bulk method 내부)

# 4. i18n
jq '.checkouts.bulk' apps/frontend/messages/ko.json apps/frontend/messages/en.json
# 기대: 11개 키 모두 non-null

# 5. E2E
pnpm --filter backend run test:e2e -- checkouts/bulk-approve
pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u01-bulk

# 6. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 12
```

---

## Acceptance

루프 완료 조건 = MUST 19개 모두 PASS + 3가지 E2E 시나리오 통과 + audit log 검증.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록.

---

## 연계 contracts

- Sprint 4.5 U-02 · `checkout-ux-u02-keyboard-shortcuts.md` — `A`/`Shift+A` 단축키 핸들러 공급.
- Sprint 4.5 U-04 · `checkout-ux-u04-inline-reject-presets.md` — 프리셋 chip 공유.
- Sprint 4.5 U-05 · `checkout-ux-u05-undo-toast.md` — bulk 완료 후 undo 토스트.
- Sprint 4.5 U-10 · `checkout-ux-u10-optimistic-skeleton.md` — 성공 건 즉시 status 전환.
- Sprint 1.3 · `checkout-meta-fail-closed.md` — `meta.availableActions.canApprove` 검증 근거.
- MEMORY.md `tech-debt-tracker Rev2` — `useRowSelection`/`BulkActionBar` SSOT 승격 기반.
