# Evaluation Report: NC Permission Gate + async onSuccessCallback + NC 첨부 캐시 무효화 정리

## 반복 #1 (2026-04-18)

## 계약 기준 대조

### 공통 MUST

| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter backend run tsc --noEmit` 에러 0 | PASS | exit 0, 출력 없음 |
| `pnpm --filter frontend run tsc --noEmit` 에러 0 | PASS | exit 0, 출력 없음 |
| `any` 타입 신규 도입 0건 | PASS | 변경된 모든 파일에서 `: any` / `as any` 없음 확인 |
| SSOT 유지 — enums: schemas, permissions: shared-constants | PASS | NC controller: `@equipment-management/schemas` + `@equipment-management/shared-constants` 임포트 확인. notification-events.ts: `@equipment-management/schemas` 경유. notification.ts enum: packages/schemas SSOT에 추가됨. |
| 런타임 회귀 없음 — 기존 mutation/캐시/권한 경계 동작 유지 | PASS | 기존 동기 onSuccessCallback 사용처 26건 타입 호환 유지 (컴파일 에러 0). 캐시 리스너 11개 테스트 전체 통과. |

### Issue #1 (NCDocumentsSection Permission Gate)

| 기준 | 판정 | 상세 |
|------|------|------|
| `import { Permission } from '@equipment-management/shared-constants'` + `useAuth().can(...)` 호출 존재 | PASS | `NCDocumentsSection.tsx:8` — `import { Permission }`, `line 9` — `useAuth`, `line 44` — `const { can } = useAuth()` |
| `canUpload` 변수 선언 + `{canUpload && ...Button}` 렌더 분기 존재 | PASS | `line 47` — `const canUpload = can(Permission.UPLOAD_NON_CONFORMANCE_ATTACHMENT)`, `line 124` — `{canUpload && (` |
| `canDelete` 변수 선언 + `{canDelete && ...Button}` 렌더 분기 존재 | PASS | `line 48` — `const canDelete = can(Permission.DELETE_NON_CONFORMANCE_ATTACHMENT)`, `line 168` — `{canDelete && (` |
| tech-debt-tracker에서 "B2 NCDocumentsSection permission gate 재적용" 항목이 `[x]`로 갱신됨 (발견 경위 + 현 HEAD 검증 결과 명시) | PASS | `tech-debt-tracker.md:28` — `[x]` 완료 표식. commit `50eae20e` 명시. useAuth().can(Permission.UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT) 적용됨 확인 기재. |

### Issue #2 (async onSuccessCallback await)

| 기준 | 판정 | 상세 |
|------|------|------|
| `OptimisticMutationOptions.onSuccessCallback` 반환 타입 `void \| Promise<void>` 확장 | PASS | `use-optimistic-mutation.ts:156` — `onSuccessCallback?: (data: TData, variables: TVariables) => void \| Promise<void>` |
| 훅 내부 `onSuccess`에서 `await onSuccessCallback?.(data, variables)` 호출 | PASS | `use-optimistic-mutation.ts:302` — `await onSuccessCallback?.(data, variables)` |
| 기존 동기 `onSuccessCallback` 사용처 컴파일/동작 변경 없음 | PASS | tsc exit 0. 26건의 동기 onSuccessCallback 사용처 모두 `void | Promise<void>` 타입에 호환 |
| `CreateNonConformanceForm.tsx`의 `onSuccessCallback`이 async 유지하며 documents invalidate → `onSuccess?.()` 순서 직렬 보장 | PASS | `CreateNonConformanceForm.tsx:129` — async 콜백. `line 156` — `await queryClient.invalidateQueries(...)`. `line 165` — `await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(...)`. `line 169` — `onSuccess?.()` 순서 직렬 확인 |
| `onSuccess` 본문에 `setQueryData(queryKey, data)` 신규 도입 0건 | PASS | `use-optimistic-mutation.ts`의 onSuccess (line 290-303)에 `setQueryData` 없음. 기존 `setQueryData`는 optimisticUpdate용(onMutate 내 line 230)으로 유지됨 |
| async onSuccessCallback 대기 회귀 테스트 1건 이상 추가 및 PASS | PASS | `hooks/__tests__/use-optimistic-mutation.test.ts` — 2개 테스트 모두 PASS. "async onSuccessCallback이 완료될 때까지 훅이 대기한다" 포함 |

### Issue #3 (NC 첨부 캐시 이벤트)

| 기준 | 판정 | 상세 |
|------|------|------|
| `NOTIFICATION_EVENTS.NC_ATTACHMENT_UPLOADED` / `NC_ATTACHMENT_DELETED` 상수 SSOT 파일에 추가됨 | PASS | `notification-events.ts:43-44` — 두 상수 정의됨 |
| `CACHE_INVALIDATION_REGISTRY`에 위 2개 이벤트가 `invalidateAfterNonConformanceStatusChange`로 매핑됨 | PASS | `cache-event.registry.ts:232-249` — 두 이벤트 모두 `invalidateAfterNonConformanceStatusChange` 액션으로 매핑됨 |
| `uploadAttachment` / `deleteAttachment`가 성공 경로에서 `eventEmitter.emitAsync(<event>, { ncId, equipmentId, documentId, actorId })` 호출 | PASS | `non-conformances.controller.ts:391,429` — 두 메서드 모두 emitAsync + NCAttachmentCacheEvent 페이로드 |
| `equipmentId`는 서버에서 `findOneBasic` 결과에서 추출 (클라이언트 body 신뢰 금지) | PASS | `non-conformances.controller.ts:375,387` (upload) 및 `line 410,425` (delete) — `const basic = await this.nonConformancesService.findOneBasic(uuid)` 후 `basic.equipmentId` 사용 |
| attachments 컨트롤러 스펙에 `emitAsync` 호출 검증 추가 및 PASS | PASS | `non-conformances-attachments.controller.spec.ts` — "업로드 성공 후 NC_ATTACHMENT_UPLOADED 이벤트를 emitAsync한다" + "삭제 성공 후 NC_ATTACHMENT_DELETED 이벤트를 emitAsync한다" 2건. 9/9 PASS |
| `cache-event-listener.spec.ts`가 기존/신규 이벤트 모두 PASS (회귀 없음) | **FAIL** | 11개 기존 테스트 모두 PASS이나, **NC_ATTACHMENT_UPLOADED / NC_ATTACHMENT_DELETED 이벤트를 명시적으로 발화하는 테스트 케이스가 없음**. `onModuleInit` 테스트가 CACHE_INVALIDATION_REGISTRY 키 전체를 순회하며 리스너 등록 여부만 검증. 핸들러가 올바른 `invalidateAfterNonConformanceStatusChange` 메서드를 호출하는지 행동 검증 없음. 계약 문구 "신규 이벤트 모두 PASS" 미충족. |
| NC `detail` 캐시의 불필요한 pattern 삭제 추가 없음 | PASS | registry 매핑은 `invalidateAfterNonConformanceStatusChange` 사용. NC detail cache pattern 별도 추가 없음 확인 |

### Issue #4 (tech-debt 3건 평가)

| 기준 | 판정 | 상세 |
|------|------|------|
| `tech-debt-tracker.md`의 phase2 scanner 500 관련 기재가 "완료 (commit 172c5df2)"로 갱신됨 | PASS | `tech-debt-tracker.md:24` — `[x]` 완료, `172c5df2` 명시, "verify 500 수정(ZodSerializerInterceptor 제거)" 기재 |
| drizzle snapshot 재생성 항목에 **"OUT OF SCOPE — TTY required"** 표식 명시됨 | PASS | `tech-debt-tracker.md:34` — `**OUT OF SCOPE (TTY required)**` 명시 및 이유 기재 |
| bulk PDF UI 항목 — 실행 시 Phase 4.1 완료 표식, 미실행 시 타임박스 사유 기재 | PASS | `tech-debt-tracker.md:24` — "Phase 2 벌크 PDF는 EquipmentList UI 사전 selection 필요(별도 UI 작업으로 이연)" 사유 기재됨. 미실행 타임박스 사유 충족 판단 |

## SHOULD 기준 대조 (루프 차단 없음)

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| `review-architecture` Critical 이슈 0 (변경 범위 기준) | SKIP | 변경 파일 수 적고 패턴 일관. 별도 실행 없음 |
| `verify-cache-events` 레지스트리/리스너 커버리지 | WARN | NC_ATTACHMENT 이벤트 explicit 테스트 미추가로 커버리지 부분 미충족. tech-debt 등록 필요 |
| `verify-security` — JWT 추출/permission 경계 회귀 0 | PASS | equipmentId = findOneBasic 서버 추출, userId = extractUserId(req) 패턴 유지 |
| `verify-frontend-state` — useOptimisticMutation 패턴 위반 0 | PASS | setQueryData(queryKey, data) 신규 도입 0건, optimisticUpdate 패턴 유지 |
| `verify-hardcoding` — 신규 이벤트 상수가 SSOT 경유 | PASS | NOTIFICATION_EVENTS.NC_ATTACHMENT_UPLOADED/DELETED가 notification-events.ts SSOT 경유 |

## 전체 판정: FAIL (MUST 1개 미달)

**실패한 MUST 기준:**

### 이슈 1: cache-event-listener.spec.ts 신규 이벤트 명시적 행동 테스트 누락

- **파일**: `apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts`
- **문제**: 계약 "cache-event-listener.spec.ts 가 기존/신규 이벤트 모두 PASS (회귀 없음)" 기준에서 NC_ATTACHMENT_UPLOADED / NC_ATTACHMENT_DELETED 이벤트를 emit했을 때 `invalidateAfterNonConformanceStatusChange`가 올바른 equipmentId로 호출되는지 검증하는 테스트 케이스가 없음. `onModuleInit` 테스트는 리스너 등록 여부만 확인하고 실제 핸들러 동작을 검증하지 않음.
- **수정**: `describe('non-conformance 첨부 이벤트', ...)` 블록 추가:
  ```typescript
  it('nonConformance.attachmentUploaded → NC 캐시 무효화', async () => {
    eventEmitter.emit(NOTIFICATION_EVENTS.NC_ATTACHMENT_UPLOADED, {
      ncId: 'nc-1',
      equipmentId: 'eq-5',
      documentId: 'doc-1',
      actorId: 'user-1',
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(mockHelper.invalidateAfterNonConformanceStatusChange).toHaveBeenCalledWith('eq-5', false);
  });

  it('nonConformance.attachmentDeleted → NC 캐시 무효화', async () => {
    eventEmitter.emit(NOTIFICATION_EVENTS.NC_ATTACHMENT_DELETED, {
      ncId: 'nc-1',
      equipmentId: 'eq-5',
      documentId: 'doc-1',
      actorId: 'user-1',
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(mockHelper.invalidateAfterNonConformanceStatusChange).toHaveBeenCalledWith('eq-5', false);
  });
  ```
- **검증**: `pnpm --filter backend exec jest "__tests__/cache-event-listener.spec.ts"` — 13개 테스트 PASS
