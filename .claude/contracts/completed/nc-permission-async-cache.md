# 스프린트 계약: NC Permission Gate + async onSuccessCallback + NC 첨부 캐시 무효화 정리

## 생성 시점
2026-04-18T00:00:00+09:00

## Slug
`nc-permission-async-cache`

## 범위
4 Issue 통합 세션. 상세 Phase 는 exec-plan (`2026-04-18-nc-permission-async-cache.md`) 참조.
- Issue #1: NCDocumentsSection Permission guard 재확인
- Issue #2: `useOptimisticMutation` async onSuccessCallback await
- Issue #3: NC 첨부 업로드/삭제 시 cross-entity 캐시 이벤트 연결
- Issue #4: tech-debt-tracker 3건 평가 (bulk PDF UI 실행 가능, drizzle snapshot = TTY OUT, phase2 scanner = 해소 기록)

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 공통
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm --filter backend run lint` 에러 0
- [ ] `pnpm --filter frontend run lint` 에러 0
- [ ] `pnpm --filter backend run test` 기존 테스트 전체 통과
- [ ] `pnpm --filter frontend run test` 기존 테스트 전체 통과
- [ ] SSOT 유지 — 타입/enum 은 `@equipment-management/schemas`, permission 은 `@equipment-management/shared-constants` 에서만 import (verify-ssot PASS)
- [ ] `any` 타입 신규 도입 0건 (verify-implementation / verify-hardcoding PASS)
- [ ] 런타임 회귀 없음 — 기존 mutation/캐시/권한 경계 동작 유지

#### Issue #1 (NCDocumentsSection Permission Gate)
- [ ] `NCDocumentsSection.tsx` 에 `import { Permission } from '@equipment-management/shared-constants'` + `useAuth().can(...)` 호출이 존재 (HEAD 검증)
- [ ] `canUpload` 변수 선언 + `{canUpload && ...Button}` 렌더 분기가 존재
- [ ] `canDelete` 변수 선언 + `{canDelete && ...Button}` 렌더 분기가 존재
- [ ] tech-debt-tracker 에서 "B2 NCDocumentsSection permission gate 재적용" 항목이 `[x]` 로 갱신됨 (발견 경위 + 현 HEAD 검증 결과 명시)

#### Issue #2 (async onSuccessCallback await)
- [ ] `OptimisticMutationOptions.onSuccessCallback` 반환 타입이 `void | Promise<void>` (또는 동등 시그니처)로 확장됨
- [ ] 훅 내부 `onSuccess` 에서 `await onSuccessCallback?.(data, variables)` 로 호출됨
- [ ] 기존 8개 동기 `onSuccessCallback` 사용처가 컴파일/동작 변경 없음 (grep 카운트 유지)
- [ ] `CreateNonConformanceForm.tsx` 의 `onSuccessCallback` 이 async 를 유지하며 사진 업로드 → documents invalidate → `onSuccess?.()` 순서가 Promise chain 상 직렬로 보장됨
- [ ] `onSuccess` 본문에 `setQueryData(queryKey, data)` 신규 도입 0건 (TData/TCachedData 타입 오염 방지 규칙 재확인)
- [ ] (SHOULD 가 아니라 MUST) async onSuccessCallback 대기 회귀 테스트 1건 이상 추가 및 PASS

#### Issue #3 (NC 첨부 캐시 이벤트)
- [ ] `NOTIFICATION_EVENTS.NC_ATTACHMENT_UPLOADED` / `NC_ATTACHMENT_DELETED` 상수가 SSOT 파일에 추가됨
- [ ] `CACHE_INVALIDATION_REGISTRY` 에 위 2개 이벤트가 `invalidateAfterNonConformanceStatusChange` 로 매핑됨
- [ ] `non-conformances.controller.ts` 의 `uploadAttachment` / `deleteAttachment` 가 성공 경로에서 `eventEmitter.emitAsync(<event>, { ncId, equipmentId, documentId, actorId })` 를 호출함
- [ ] `equipmentId` 는 서버에서 `findOneBasic` 결과 또는 기존 조회에서 추출 (클라이언트 body 신뢰 금지 — Rule 2 재확인)
- [ ] attachments 컨트롤러 스펙에 `emitAsync` 호출 검증이 추가되어 PASS
- [ ] `cache-event-listener.spec.ts` 가 기존/신규 이벤트 모두 PASS (회귀 없음)
- [ ] NC `detail` 캐시의 불필요한 pattern 삭제 추가 없음 (attachment 가 NC detail 스키마에 포함되지 않음)

#### Issue #4 (tech-debt 3건 평가)
- [ ] `tech-debt-tracker.md` 의 phase2 scanner 500 관련 기재가 "완료 (commit 172c5df2)" 로 갱신됨
- [ ] drizzle snapshot 재생성 항목에 **"OUT OF SCOPE — TTY required"** 표식이 명시됨 (실행 시도 금지)
- [ ] bulk PDF UI 항목 — 실행 시 Phase 4.1 완료 표식, 미실행 시 타임박스 사유 기재

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 에 기록, 루프 차단 없음
- [ ] `review-architecture` Critical 이슈 0 (변경 범위 기준)
- [ ] `verify-cache-events` 레지스트리/리스너 커버리지 PASS
- [ ] `verify-security` — JWT 추출/permission 경계 회귀 0
- [ ] `verify-frontend-state` — useOptimisticMutation 패턴 위반 0
- [ ] `verify-hardcoding` — 신규 이벤트 상수가 SSOT 경유 (notification-events.ts)
- [ ] Playwright E2E — 기존 `phase2-scanner-ncr.spec.ts` 회귀 없음 (skip 허용)
- [ ] (Phase 4.1 수행 시) `review-design` 60+ for EquipmentListContent

### 적용 verify 스킬 (Evaluator 자동 선택 가이드)
- 프론트엔드 훅/mutation → `verify-frontend-state`
- NC permission 가드 → `verify-security`
- 백엔드 event/cache → `verify-cache-events`, `verify-implementation`
- SSOT 상수 → `verify-ssot`, `verify-hardcoding`
- i18n 신규 키 없음 — verify-i18n 스킵 가능

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md 에 기록

## 명시적 Non-Goals (수술 범위 초과 — 손대면 FAIL)
- NCDocumentsSection 리팩토링/UI 개선
- `onSettledCallback` 시맨틱 변경
- `setQueryData` 도입
- NC detail 캐시 구조 변경 또는 attachment 조인
- drizzle snapshot 재생성 (TTY)
- BulkActionBar 범용 프리미티브 추출 (별도 tech-debt)
- CardGrid / VirtualizedList 체크박스 확산 (별도 tech-debt)
- 8개 동기 onSuccessCallback 사용처 수정
