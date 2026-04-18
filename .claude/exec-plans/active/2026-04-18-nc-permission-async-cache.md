# NC Permission Guard + async onSuccessCallback + NC 첨부 캐시 무효화 정리

## 메타
- 생성: 2026-04-18T00:00:00+09:00
- 모드: Mode 2 (Planner → Generator → Evaluator)
- Slug: `nc-permission-async-cache`
- 예상 변경: 5~8개 파일 (프로덕션 3~5 + 테스트 1~2 + tech-debt-tracker 1)
- 사전 조건: main 브랜치, pre-push hook 정상, commit `106b13c0` (session 75 수정) 기반

## 설계 철학
73/74/75차 세션에서 누적된 **NC 첨부 UX/아키텍처 잔무 3건**을 단일 세션에서 정리한다.
- (1) 렌더 가드가 실제 커밋에 남아있는지 수술적으로 재확인하고,
- (2) `useOptimisticMutation` 의 async 콜백 시맨틱을 명확히 규정하여 모달 조기 닫힘으로 인한 업로드 중단 리스크를 제거하며,
- (3) NC 첨부 삭제 경로에서 이벤트/캐시 레지스트리 일관성을 확보한다.
"최소 코드·수술적 변경" 원칙에 따라 기존 패턴(emit+registry, onSettledCallback) 재사용을 우선하고, 신규 엔티티는 만들지 않는다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| 2번 Issue 전파 범위 | **옵션 A: 훅에서 `await onSuccessCallback?.()`** | `onSuccessCallback` 동기 사용처(≈8개)는 await에 영향받지 않음. 유일 async 사용처(`CreateNonConformanceForm`)가 올바르게 직렬 실행되어 모달 조기 닫힘 제거. 옵션 B(onSettledCallback 이동)는 `createdNc` 타입이 void로 내려와 호출부 대폭 재구성 필요 — 수술 범위 초과. |
| 1번 Issue 접근 | **현 상태 검증 + 회귀 가드 추가** | `git log` 상 `NCDocumentsSection.tsx` 는 커밋 `106b13c0` 에 정상 반영됨(`canUpload`/`canDelete`). tracker 추정은 stale. Generator 는 "변경 없음 + tech-debt 체크 off" 만 수행. |
| 3번 Issue 대응 | **SSOT: `NC_ATTACHMENT_UPLOADED` / `NC_ATTACHMENT_DELETED` 이벤트 신설 + registry 연결** | 73차 결정(emitAsync + cache-event.registry SSOT)과 일관. deleteAttachment/uploadAttachment 컨트롤러에서 이벤트 1건 emit → registry 가 `invalidateAfterNonConformanceStatusChange(eq, false)` 호출. NC 로컬 `detail` 캐시는 첨부 미포함이므로 pattern 삭제는 불필요. 장비 상세/목록 갱신(다른 진입점)만 보장. |
| 4번 Issue 범위 분리 | **bulk PDF UI = IN, drizzle snapshot = OUT** | bulk PDF 는 row-level checkbox + BulkActionBar 패턴 도입으로 실행 가능. drizzle snapshot 재생성은 TTY 필수 `pnpm db:generate` 호출이며 harness/Generator 환경은 non-TTY → **OUT OF SCOPE**, tech-debt-tracker 유지 + 명시적 "TTY required" 표식 재확인만 수행. 과거 언급된 phase2 scanner 500 은 커밋 `172c5df2` 에서 이미 해소 → 대상 제외. |
| 테스트 전략 | 백엔드 유닛 스펙 1건(event emit) + 기존 controller spec 확장 | E2E 신규 작성은 수술 범위 초과. emitAsync 단위 테스트로 회귀 감지. |

## 구현 Phase

### Phase 1: Issue #1 — NCDocumentsSection Permission Gate 확정 검증
**목표:** 현 HEAD 에 `canUpload`/`canDelete` 가드가 살아있음을 기계적으로 검증하고, 이후 세션에서 유사 탈락이 재발하지 않도록 정적 가드를 한 곳에 집중한다.

**변경 파일:**
1. `apps/frontend/components/non-conformances/NCDocumentsSection.tsx` — **변경 없음** (검증만). `Permission.UPLOAD_NON_CONFORMANCE_ATTACHMENT` / `Permission.DELETE_NON_CONFORMANCE_ATTACHMENT` import + `useAuth().can(...)` 분기 + `{canUpload && <Button/>}` / `{canDelete && <Button/>}` 가드가 그대로 유지되는지 확인.
2. `.claude/exec-plans/tech-debt-tracker.md` — 해당 B2 항목 `[x]` 로 체크 이동 (발견 경위 1줄 + 현재 HEAD 에서 가드 유지 확인).

**검증:**
```
grep -n "canUpload\|canDelete" apps/frontend/components/non-conformances/NCDocumentsSection.tsx
# canUpload + canDelete 각 1회 이상 노출되는지 확인 (선언 + 사용 = 최소 4 라인)
pnpm --filter frontend run tsc --noEmit
```

**Out-of-scope:**
- 별도 가드 유틸리티 추출 금지 (최소 코드).
- NCDocumentsSection 내부 리팩토링 금지.

---

### Phase 2: Issue #2 — `useOptimisticMutation` async onSuccessCallback await
**목표:** `onSuccessCallback` 이 Promise 반환 시 onSuccess 단계에서 직렬로 대기하여 업로드/캐시 무효화 완료 전에 모달이 닫히는 Navigate/Close-Before-Settled 안티패턴을 제거한다.

**변경 파일:**
1. `apps/frontend/hooks/use-optimistic-mutation.ts` — 수정.
   - `OptimisticMutationOptions.onSuccessCallback` 반환 타입을 `void | Promise<void>` 로 확장.
   - `onSuccess` 콜백을 `async` 로 변경, `await onSuccessCallback?.(data, variables)` 로 호출.
   - JSDoc 업데이트: "Promise 반환 시 onSettled 시작 전까지 대기. 여전히 네비게이션은 onSettledCallback 권장" 1문단 추가.
2. `apps/frontend/components/non-conformances/CreateNonConformanceForm.tsx` — 수정.
   - 기존 async 콜백 내부 로직 유지(Promise.allSettled + invalidate + `onSuccess?.()`).
   - `queryClient.invalidateQueries({ queryKey: queryKeys.documents.byNonConformance(...) })` 호출에 `await` 추가 (이미 async 컨텍스트). 호출부 onSuccess 가 closedialog 를 실행하는 부모에서도 업로드 완료 후 닫히도록 전파.
3. `apps/frontend/hooks/__tests__/use-optimistic-mutation.test.ts` — 신규 또는 기존 확장.
   - "async onSuccessCallback 이 완료되기 전까지 onSettled 이 호출되지 않는다" 1개 케이스 추가.
   - 파일이 존재하지 않으면 **Phase 2 생성**; 존재하면 확장.

**Out-of-scope:**
- 8개 동기 사용처 수정 금지 (`void` 반환만 지원하는 기존 호출부는 변경 없음).
- `onSettledCallback` 시맨틱 변경 금지.
- `setQueryData` 금지 원칙 재확인 — onSuccess 본문에 setQueryData 추가 금지.

**검증:**
```
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- use-optimistic-mutation
# 모든 기존 onSuccessCallback 사용처가 여전히 컴파일되는지 확인
grep -rn "onSuccessCallback" apps/frontend --include="*.ts" --include="*.tsx" | wc -l
```

---

### Phase 3: Issue #3 — NC 첨부 이벤트 + 캐시 registry 연결
**목표:** NC 첨부 업로드/삭제가 NC 장비의 cross-entity 캐시(dashboard, equipment detail, equipment lists)를 일관 경로로 무효화한다.

**변경 파일:**
1. `apps/backend/src/modules/notifications/events/notification-events.ts` — 수정.
   - `NC_ATTACHMENT_UPLOADED: 'nonConformance.attachmentUploaded'`, `NC_ATTACHMENT_DELETED: 'nonConformance.attachmentDeleted'` 상수 추가.
   - payload 타입 1개: `NCAttachmentPayload = { ncId: string; equipmentId: string; documentId: string; actorId: string | null }`.
2. `apps/backend/src/common/cache/cache-event.registry.ts` — 수정.
   - NC 섹션에 두 신규 이벤트 등록. `actions: [{ method: 'invalidateAfterNonConformanceStatusChange', equipmentIdField: 'equipmentId', equipmentStatusChanged: false }]`.
3. `apps/backend/src/modules/non-conformances/non-conformances.controller.ts` — 수정.
   - `EventEmitter2` 주입 (기존 `findOneBasic` 으로 `equipmentId` 이미 조회 가능).
   - `uploadAttachment` 성공 후 `this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.NC_ATTACHMENT_UPLOADED, payload)`.
   - `deleteAttachment` 성공 후 `this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.NC_ATTACHMENT_DELETED, payload)`.
4. `apps/backend/src/modules/non-conformances/__tests__/non-conformances-attachments.controller.spec.ts` — 수정.
   - upload/delete 성공 케이스에 `eventEmitter.emitAsync` 호출 검증(Jest mock) 1건씩 추가.

**Out-of-scope:**
- NC `detail` 캐시 pattern 삭제 금지 — 현 스키마상 attachment 가 NC detail 에 조인되지 않음.
- `invalidateAfterNonConformanceStatusChange` 로직 수정 금지.
- 프론트엔드 query key 변경 금지 — `queryKeys.documents.byNonConformance` 만으로 UX 정합성 이미 확보됨.

**검증:**
```
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- non-conformances-attachments
pnpm --filter backend run test -- cache-event-listener
# registry에 두 신규 이벤트 등록 + listener dispatch 확인
```

---

### Phase 4: Issue #4 — Tech-Debt 잔여 3건 평가 및 가능한 항목 실행
**목표:** 잔여 항목 3건(phase2 scanner 500, bulk PDF UI, drizzle snapshot)의 실행 가능성을 판정하고, 실행 가능한 항목만 처리하여 tech-debt-tracker 를 최신화한다.

**변경 파일:**
1. `.claude/exec-plans/tech-debt-tracker.md` — 수정.
   - **phase2 scanner 500**: `[x]` 체크. 근거: 커밋 `172c5df2` 에서 ZodSerializerInterceptor 제거로 verify 500 해소 + 10/10 E2E PASS. 현 항목에 "완료 2026-04-18 — commit 172c5df2, QR Phase 3 항목 참조" 1줄.
   - **drizzle snapshot 복원**: 현 `🟢 LOW Drizzle snapshot 재생성` 항목에 "**OUT OF SCOPE — TTY required** (`pnpm db:generate` 는 Drizzle prompt 입력 필요)" 접미사 추가. 체크는 하지 않고 unblocked 표식 유지.
   - **bulk PDF UI (Per-row 체크박스)**: Phase 4.1 실행 후 `[x]` 체크 또는 진행 상태 업데이트.

#### Phase 4.1: Bulk PDF 다운로드 UI — Per-row 체크박스 (선택적)
**실행 조건:** Phase 1~3 모두 PASS + 예산 여유 (2시간 이내).
**목표:** `EquipmentListContent` row-level 체크박스 + `BulkActionBar` 훅 이용. 사전 selection → 선택된 행만 `BulkLabelPrintButton` 에 전달.

**변경 파일:**
1. `apps/frontend/hooks/use-bulk-selection.ts` — **기존 훅 재사용** (이미 완성된 상태, tech-debt-tracker 명시).
2. `apps/frontend/components/equipment/EquipmentListContent.tsx` — 수정. row `<td>` 선두에 `<Checkbox>` 추가, `useBulkSelection(items)` 연동. `BulkLabelPrintButton selectedItems={selectedIds.length ? items.filter(i=>selectedIds.has(i.id)) : items}` 로 조건부 전달.
3. `apps/frontend/tests/e2e/features/equipment/qr/phase2-scanner-ncr.spec.ts` — **변경 없음**. 기존 스킵 가드(`if count===0` → skip) 유지. 실측 dataset 부족 시 여전히 skip.

**Out-of-scope:**
- CardGrid / VirtualizedList 쪽 체크박스 확산 금지 (tech-debt 분리 항목).
- BulkActionBar 범용 프리미티브 추출 금지 (별도 tech-debt 항목).

**검증:**
```
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend run test:e2e -- phase2-scanner-ncr
# skip 유지여도 PASS 인정 (dataset 의존)
```

**타임박스:** 이 Phase 4.1 이 2시간 초과 시 중단 + tech-debt-tracker 진행 상태 기록 후 다음 세션으로 이월.

## 전체 변경 파일 요약

### 신규 생성
| 파일 | 목적 |
|------|------|
| (선택) `apps/frontend/hooks/__tests__/use-optimistic-mutation.test.ts` | async onSuccessCallback await 회귀 테스트 |

### 수정
| 파일 | 변경 의도 |
|------|----------|
| `apps/frontend/hooks/use-optimistic-mutation.ts` | async onSuccessCallback await |
| `apps/frontend/components/non-conformances/CreateNonConformanceForm.tsx` | documents invalidate 에 await 명시 |
| `apps/backend/src/modules/notifications/events/notification-events.ts` | NC_ATTACHMENT_UPLOADED / DELETED 상수 |
| `apps/backend/src/common/cache/cache-event.registry.ts` | 신규 이벤트 → NC status change invalidation 매핑 |
| `apps/backend/src/modules/non-conformances/non-conformances.controller.ts` | upload/delete 성공 후 emitAsync |
| `apps/backend/src/modules/non-conformances/__tests__/non-conformances-attachments.controller.spec.ts` | emitAsync 호출 검증 |
| `.claude/exec-plans/tech-debt-tracker.md` | B2 체크 / phase2 500 체크 / drizzle snapshot TTY 표식 / bulk PDF 진행 |
| (Phase 4.1 수행 시) `apps/frontend/components/equipment/EquipmentListContent.tsx` | row checkbox + selection bridge |

### 변경 없음 (확인만)
| 파일 | 근거 |
|------|------|
| `apps/frontend/components/non-conformances/NCDocumentsSection.tsx` | HEAD 에서 이미 `canUpload`/`canDelete` 가드 적용됨 |

## 의사결정 로그
- **2026-04-18 00:00** Planner 시작. CLAUDE.md + tech-debt-tracker + NCDocumentsSection + use-optimistic-mutation + NC controller + cache registry 순차 확인.
- **2026-04-18 00:10** NCDocumentsSection 에 permission 가드가 HEAD 기준 이미 살아있음 확인 (`git diff` 비어있음, `git log` 으로 commit `106b13c0` 반영 확인). tech-debt tracker 의 "재적용 필요" 는 stale 추정 → Phase 1 은 "검증 + 체크"로 축소.
- **2026-04-18 00:15** async onSuccessCallback 사용처 전수 조사 → 유일 사용처 `CreateNonConformanceForm.tsx` 확인. 옵션 A 채택(전파 범위 최소). 8개 동기 사용처는 반환 타입 `void` 로 기존 동작 보존.
- **2026-04-18 00:20** NC 첨부 삭제 후 "다른 진입점 stale" 해석 — dashboard/equipment detail 의 NC 파생 지표. 73차 emit+registry SSOT 활용하여 이벤트 2개 신설로 해결.
- **2026-04-18 00:25** 4번 Issue 3건 중 drizzle snapshot 은 TTY 입력 필요 → OUT OF SCOPE. phase2 scanner 500 은 `172c5df2` 로 이미 해소. bulk PDF UI 만 선택적 실행 가능 (타임박스 2h).
