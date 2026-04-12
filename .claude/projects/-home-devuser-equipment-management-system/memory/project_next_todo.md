---
name: 다음 세션 TODO
description: 42차 세션 완료 + 후속 작업 우선순위
type: project
originSessionId: ed411413-c8e7-4f9c-b01e-7360d276e36b
---
2026-04-12 42차 세션 완료. harness 기반 Batch A/B/C/D + updatedBy + wf-19d E2E + audit timeline 개선 진행.

## 이번 세션(42차) 주요 성과

### 1. ResultSectionsPanel 아키텍처 재정비 (Batch A, Mode 2 harness)
- SSOT 타입 강화 (`InspectionType` — `'intermediate' | 'self'` 리터럴 유니온 제거)
- **백엔드 `PATCH /result-sections/reorder`** 신설 — full-order 배열, 단일 tx 안에서 0..N-1 재할당. 기존 2-PATCH pairwise swap 제거 (race condition 근본 해결)
- `SimpleCacheService` 주입 + 부모 inspection 캐시 무효화 (self 는 cache 인프라 부재 → early return + 주석)
- `QUERY_CONFIG.RESULT_SECTIONS` staleTime + `isConflictError` 409 분기
- `SelfInspectionTab` expandedId 지연 마운트 (N+1 제거)
- `form-template-export.renderResultSections` batch `inArray(documents.id)` + `Promise.allSettled` (N+1 제거)
- CSV 업로드 1MB 제한 (`FILE_UPLOAD_LIMITS.CSV_MAX_FILE_SIZE`)
- **교훈**: 1차 FAIL 사유 = NestJS 라우트 선언 순서 역전 (`/reorder` 가 `/:sectionId` 뒤에) — `feedback_nest_route_order.md` 로 영구화

### 2. 직전 승인된 중간점검 prefill (Batch D)
- `InspectionFormDialog` 신규 생성 시 동일 장비의 **가장 최근 approved** 점검 items/resultSections 자동 복사
- 사용자 요구: "승인된 중간점검중에 가장 직전 중간점검을 prefill" (draft/pending/rejected 스킵)
- `previousInspections.find(i => i.approvalStatus === 'approved')` — DESC createdAt 정렬 + `.find()` 로 가장 최근 approved
- 체크박스 토글 (기본 on), off 시 복사분 초기화
- ko/en i18n

### 3. rich_table 이미지 썸네일 렌더링 (Batch B1)
- `DocumentImage` 공용 컴포넌트 신규 (`getPreviewUrl` presigned/blob 통합 + blob revoke cleanup)
- VisualTableEditor / ResultSectionPreview 의 기존 `[photo: id...]` placeholder 를 실제 썸네일로 교체

### 4. 1-step Export E2E + updatedBy 감사 컬럼
- `wf-19c-one-step-export.spec.ts` — POST 단일 호출로 inspection + items + resultSections 생성 → Export DOCX 회귀
- `inspection_result_sections.updated_by` uuid FK 추가 (drizzle 0016) + service/controller 전파 + Rule 2 준수
- `update()` 타입 강화: `Record<string, unknown>` → `Partial<NewInspectionResultSection>`

### 5. wf-19d 브라우저 E2E (4/4 PASS)
- 직전 승인된 prefill 기능 4개 시나리오 (auto prefill / toggle off / UI hidden / draft 스킵 회귀)
- **교훈**: Playwright `fullyParallel: true` 는 같은 파일 describe 들도 병렬 실행 — 파일 최상단 `test.describe.configure({ mode: 'serial' })` 필수. LEARNINGS 반영

### 6. AuditTimelineFeed 스태거 애니메이션 jitter 제거 (독립 harness)
- 가상화 후 row 재마운트 시 fadeIn 반복 재생 → `shouldAnimate = flatIdx < staggerCap` 조건부 적용
- `motion-safe:` prefix 는 이미 `ANIMATION_PRESETS.fadeIn` 에 포함됨
- tech-debt L18 + L15 (handleMove) 함께 완료 마킹

## 다음 세션 우선순위

### A. tech-debt 잔여 항목 (독립 영역)
1. **L24 (대형)**: s23/s24/s25/s26/s27 multi-suite 병렬 실행 오염 — 공용 장비 상태 충돌 해결. 장비 파티셔닝 설계 필요. Mode 2
2. **L37 (대형)**: `audit_logs` 장기 보관 파티셔닝 전략 — PostgreSQL declarative partitioning 또는 아카이빙 잡. 설계 결정 필요

### B. Batch C1 (선택적) 잔여
- `inspection_result_sections.updated_at` 에 auto-update trigger 추가 검토 (현재는 애플리케이션 레벨)
- `result-sections.service.spec.ts` 가 존재하지 않음 — unit test 추가 권장

### C. 수동 검증 권장
- dev 환경에서 실제 중간점검 생성 UI 플로우로 직전 prefill 체감 확인
- rich_table 셀 이미지 썸네일 실물 렌더링 육안 확인

## 세션 종료 시 상태
- Branch: main
- Unpushed commits: 0 (모두 push 완료)
- Dirty files: equipment-cache-key-builder / monitoring-type-ssot 관련 (다른 세션/에이전트 작업 — 내 범위 아님)
- 모든 harness 작업 main 직접 커밋 + push
- pre-push hook (frontend 118 tests + backend 559 tests) 8회 PASS
