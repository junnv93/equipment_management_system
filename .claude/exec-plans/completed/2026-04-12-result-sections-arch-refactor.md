---
slug: result-sections-arch-refactor
mode: 2
created: 2026-04-12
status: active
---

# Exec Plan: ResultSectionsPanel 아키텍처 재정비 (Batch A)

## 목차
1. 배경
2. 설계 철학
3. 아키텍처 결정
4. Phase A1 — calibration-api.ts SSOT 타입 강화
5. Phase A2 — handleMove 레이스 근본 해결 + 캐시/에러 처리 강화
6. Phase A3 — N+1 쿼리 최적화 (BE + FE) + CSV 크기 제한
7. 회귀 검증
8. 의사결정 로그

## 1. 배경

UL-QP-18 중간점검(IntermediateInspection) / 자체점검(SelfInspection) 결과 섹션을 관리하는
`ResultSectionsPanel` 과 관련 백엔드(`ResultSectionsService`, `renderResultSections`)에 다음 결함이 누적됨:

- **Rule 0 위반**: `calibration-api.ts:221` 과 `ResultSectionsPanel.tsx:37` 에 `inspectionType: 'intermediate' | 'self'` 리터럴 유니온 재정의
- **handleMove 레이스**: `ResultSectionsPanel.tsx:111-126` 가 두 번의 순차 PATCH 로 sortOrder swap
- **캐시 stale**: `ResultSectionsService` 에 cache 주입 없음 → 섹션 CRUD 후 부모 inspection detail 캐시 stale
- **409 처리 부재**: 세 mutation 모두 제네릭 toast 만 표시
- **staleTime 부재**: `useQuery` 에 `QUERY_CONFIG` 미참조
- **N+1 (FE)**: `SelfInspectionTab.tsx` 가 점검 카드 map 내부에서 `ResultSectionsPanel` 무조건 렌더
- **N+1 (BE)**: `form-template-export.service.ts` 의 `renderResultSections` 가 photo 섹션 순차 다운로드
- **CSV fileSize 제한 없음**: `FileInterceptor('file')` 에 `limits` 옵션 미지정

## 2. 설계 철학

**SSOT 먼저**, **단일 트랜잭션으로 원자성 확보**, **기존 캐시/에러 인프라 재사용**, **수술적 변경**.

## 3. 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| reorder API 형태 | `PATCH /result-sections/reorder` with `{ sectionIds: string[] }` | pairwise swap 보다 확장성 우수. tx 안에 0..N-1 재할당 = 단일 원자 연산 |
| CAS scope | parent version 체크 **안 함** | 기존 create/update/delete 도 parent version 무체크. 비대칭 회피 |
| 캐시 invalidation | `SimpleCacheService` + `CACHE_KEY_PREFIXES.CALIBRATION` 재사용 | 기존 패턴 답습 |
| FE 지연 마운트 | `SelfInspectionTab` 에 `expandedId` state 추가 | IntermediateInspectionList 와 동일 패턴 |
| CSV 크기 제한 | `FILE_UPLOAD_LIMITS.CSV_MAX_FILE_SIZE = 1MB` | 하드코딩 금지 |

## 4. Phase A1 — calibration-api.ts SSOT 타입 강화 (선행)

**목표:** `'intermediate' | 'self'` 리터럴 유니온을 SSOT `InspectionType` 로 교체.

**변경 파일:**
1. `apps/frontend/lib/api/calibration-api.ts` — ResultSection.inspectionType → InspectionType
2. `apps/frontend/components/inspections/result-sections/ResultSectionsPanel.tsx` — ResultSectionsPanelProps.inspectionType → InspectionType
3. 기타 소비자 (grep 으로 확인)

**검증:** `pnpm --filter frontend exec tsc --noEmit`

## 5. Phase A2 — handleMove 레이스 근본 해결 + 캐시/에러 처리 강화

### A2-BE-1. Reorder DTO + Zod
- `apps/backend/src/modules/intermediate-inspections/dto/result-section.dto.ts`
- Zod 스키마 `reorderResultSectionsSchema = z.object({ sectionIds: z.array(uuidString()).min(1).max(200) })`

### A2-BE-2. ResultSectionsService 재정비
- `apps/backend/src/modules/intermediate-inspections/result-sections.service.ts`
- 생성자에 `SimpleCacheService` 주입
- 새 메서드 `reorder(inspectionId, inspectionType, sectionIds, actor)`: 단일 `db.transaction()` 안에서 0..N-1 재할당
- create/update/delete/reorder 각 경로 후 parent cache invalidate

### A2-BE-3. Controller — reorder 엔드포인트 2개
- `intermediate-inspections.controller.ts` 와 `self-inspections.controller.ts` 각각 `PATCH :uuid/result-sections/reorder`

### A2-BE-4. API_ENDPOINTS 확장
- `packages/shared-constants/src/api-endpoints.ts` 에 REORDER 엔트리 2개

### A2-FE-1. API 클라이언트 reorder
- `apps/frontend/lib/api/calibration-api.ts` + `self-inspection-api.ts`

### A2-FE-2. query-config.ts
- `QUERY_CONFIG.RESULT_SECTIONS` 추가

### A2-FE-3. ResultSectionsPanel 재정비
- useQuery 에 QUERY_CONFIG.RESULT_SECTIONS spread
- handleMove → reorderMutation 단일 호출
- mutation onError 에 isConflictError 분기
- invalidate 시 parent queryKey 포함

### A2-i18n
- ko/en `calibration.json` 에 `resultSections.toasts.conflict` 키 추가

**검증:** tsc (양쪽) + backend test + frontend build

## 6. Phase A3 — N+1 쿼리 최적화 + CSV 크기 제한

### A3-FE-1. SelfInspectionTab 지연 마운트
- `expandedId` state + 카드 헤더에 토글 버튼
- `ResultSectionsPanel` 은 `expandedId === inspection.id` 일 때만 렌더

### A3-BE-1. renderResultSections batch 로딩
- `apps/backend/src/modules/reports/form-template-export.service.ts`
- documentId 선수집 → batch WHERE IN → `Promise.allSettled(storage.download)` → `Map<documentId, buffer>`

### A3-BE-2. CSV fileSize 제한 1MB
- `packages/shared-constants/src/file-types.ts`: `FILE_UPLOAD_LIMITS.CSV_MAX_FILE_SIZE = 1 * 1024 * 1024`
- 두 컨트롤러의 `FileInterceptor('file', { limits: { fileSize: ... } })`

**검증:** tsc + build + backend test

## 7. 회귀 검증

```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
pnpm --filter backend run build
pnpm --filter frontend run build
pnpm --filter backend run test
```

## 8. 의사결정 로그

- **2026-04-12**: reorder API 를 full-order 배열로 결정 (swap 대신)
- **2026-04-12**: parent CAS 미적용 결정 — 기존 CRUD 와 정합
- **2026-04-12**: 공용 "지연 마운트" 컴포넌트 신설 금지 — SelfInspectionTab 수술적 적용
- **2026-04-12**: CSV 1MB 제한을 FILE_UPLOAD_LIMITS.CSV_MAX_FILE_SIZE 상수화
