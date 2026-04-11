# 스프린트 계약: ResultSectionsPanel 아키텍처 재정비

## 생성 시점
2026-04-12T00:00:00+09:00

## Slug
`result-sections-arch-refactor`

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **MUST1**: `pnpm --filter frontend exec tsc --noEmit` exit 0
- [ ] **MUST2**: `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] **MUST3**: `pnpm --filter backend run test` exit 0 (특히 result-sections 관련 spec)
- [ ] **MUST4**: `pnpm --filter frontend run build` exit 0
- [ ] **MUST5**: `pnpm --filter backend run build` exit 0
- [ ] **MUST6**: Rule 0 위반 0건 — `grep -rn "'intermediate' *| *'self'" apps/frontend apps/backend` 결과 0. calibration-api.ts / ResultSectionsPanel.tsx 에서 `InspectionType` import 확인
- [ ] **MUST7**: handleMove 함수 본문 내 `mutateAsync` 호출 ≤ 1회 (reorder 1회)
- [ ] **MUST8**: ResultSectionsPanel 에 QUERY_CONFIG.RESULT_SECTIONS 또는 staleTime 참조 존재
- [ ] **MUST9**: SelfInspectionTab 에 `expandedId` state + 조건부 렌더 패턴 존재
- [ ] **MUST10**: ResultSectionsPanel 에 `isConflictError` 참조 최소 1회
- [ ] **MUST11**: 백엔드 reorder 엔드포인트 존재 — 두 controller 모두 `result-sections/reorder` 매치
- [ ] **MUST12**: `ResultSectionsService` 가 `SimpleCacheService` 주입
- [ ] **MUST13**: `api-endpoints.ts` 에 `REORDER:` 키가 intermediate/self 양쪽에 존재
- [ ] **MUST14**: FileInterceptor 에 `limits.fileSize` 적용 — 두 controller 모두
- [ ] **MUST15**: `FILE_UPLOAD_LIMITS.CSV_MAX_FILE_SIZE` 상수 존재
- [ ] **MUST16**: `form-template-export.service.ts` 가 batch 방식 (`inArray(documents.id` 또는 `Promise.allSettled`)
- [ ] **MUST17**: `query-config.ts` 에 `RESULT_SECTIONS` 엔트리

### 권장 (SHOULD) — 실패 시 tech-debt 기록

- [ ] **SHOULD1**: review-architecture Critical 이슈 0개 (변경 영역)
- [ ] **SHOULD2**: E2E wf-19c 회귀 없음
- [ ] **SHOULD3**: ko/en i18n 두 파일 모두 conflict 메시지 추가
- [ ] **SHOULD4**: self-inspections 캐시 무효화가 SelfInspectionsService 패턴과 정합

### 적용 verify 스킬

- `verify-ssot` (Rule 0)
- `verify-implementation` (CAS/Zod/Auth/Cache)
- `verify-hardcoding` (URL / 에러 메시지)
- `verify-frontend-state` (TanStack Query)
- `review-architecture` (SHOULD)

## 종료 조건

- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 수동 개입
- 3회 반복 초과 → 수동 개입
- SHOULD 실패는 tech-debt-tracker 기록
