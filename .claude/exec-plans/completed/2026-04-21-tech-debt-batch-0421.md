---
slug: tech-debt-batch-0421
date: 2026-04-21
iteration: 1
status: active
mode: 2
---

# Exec Plan: tech-debt-batch-0421

## Summary

tech-debt-tracker Open 항목 중 이번 배치에서 실제 구현 가능한 항목들을 의존성 순서로 처리.

**사전 조사로 코드 변경 불필요 확인 (tracker만 정리)**:
- B1 (EquipmentRegistryDataService SELECT *) — 이미 16컬럼 projection 적용됨
- C1 (sw-validation approve 인라인 검사) — 이미 assertIndependentApprover 사용
- D1 (KPI aria-pressed) — button 분기에 aria-pressed={isActive} 이미 적용

**실제 구현 항목**:
- A1: equipment_attachments seed 경로 절대 → 상대 교정 (P0 버그)
- B2: data-migration EXECUTING stale 판정 (P1 아키텍처)
- C2: calibration-plan-renderer alignment 토큰 (P2 SSOT)
- C4: wf-35:103 토스트 .first() → toast-helpers (P2 SSOT)
- C5: CPLAN_008 seed 주석 (P2 문서)
- E2: DocumentTable 213줄 분리 (P2 컴포넌트)
- E1: SoftwareValidationContent 잔여 3개 컴포넌트 추출 (P2 컴포넌트)
- C3: form-templates GET 패턴 문서화 (P2 문서)
- F1: software-validation-workflow.md 생성 (P3 문서)

**원칙**: 수술적 변경, 새 추상화 금지, SSOT 경유 필수.

---

## Phase 0: Tracker 사전 정합성

### 목표
사전 조사로 확인된 이미-완료 항목을 tracker에서 completed 이동.

### Files to modify
- `.claude/exec-plans/tech-debt-tracker.md`
  - B1 (EquipmentRegistryDataService SELECT *) → completed (사유: 이미 16컬럼 projection)
  - C1 (sw-validation approve 인라인 검사) → completed (사유: assertIndependentApprover 이미 적용)
  - D1 (KPI aria-pressed) → completed (사유: button 분기에 aria-pressed 이미 존재, div 분기는 toggle 아님)

---

## Phase 1: A1 — equipment_attachments seed 경로 교정 (P0)

### 목표
절대경로 6건을 uploadDir 상대경로로 교정 → LocalStorageProvider.assertWithinDir 통과 → 다운로드 200 복구.
placeholder 파일 자동 생성 루틴 추가 (equipment_photos 패턴 준용).

### Files to modify
- `apps/backend/src/database/seed-data/admin/equipment-attachments.seed.ts`
  - filePath 6건 절대경로('/uploads/...') → 상대경로('inspection_reports/...' 또는 'history_cards/...' 등)
  - fileName을 경로의 basename으로 일관성 유지
  - 각 항목 상단에 1-line 설명 주석 (equipment_photos 패턴)

- `apps/backend/src/database/seed-test-new.ts`
  - ensureSeedPlaceholderImages() 패턴을 참고하여 ensureSeedPlaceholderAttachments() 함수 추가
    - 각 filePath의 uploadDir 하위 파일이 없으면 생성
    - PDF: 최소 유효 PDF 바이트 (pdf-lib 또는 텍스트 기반 placeholder)
    - JPEG(ATTACH_006 repair-photo): sharp로 400×300 회색 이미지
    - 실패 시 logger.warn only (non-fatal)
  - seedMain() 내 ensureSeedPlaceholderImages() 호출 직후에 ensureSeedPlaceholderAttachments() 호출

### 검증
```bash
pnpm --filter backend exec tsc --noEmit
grep -n "'/uploads/" apps/backend/src/database/seed-data/admin/equipment-attachments.seed.ts
# 결과: 0 matches
```

---

## Phase 2: B2 — data-migration EXECUTING stale 판정 (P1)

### 목표
서버 재시작 후 stale EXECUTING 상태가 새 실행을 영구 차단하는 문제 해소.
Redis 도입 없이 executionStartedAt + 타임아웃 상수로 최소 변경.

### Files to modify
- `packages/shared-constants/src/config/migration.ts` (또는 동등 위치 상수 파일)
  - MIGRATION_EXECUTION_TIMEOUT_MS = 10 * 60 * 1000 (10분) export
  - 기존 MIGRATION_SESSION_TTL_MS 인접 위치

- `apps/backend/src/modules/data-migration/types/data-migration.types.ts`
  - MultiSheetMigrationSession에 executionStartedAt?: Date 필드 추가

- `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
  - executeMultiSheet의 EXECUTING 체크 분기에 stale 판정 추가:
    - session.executionStartedAt이 Date.now() - MIGRATION_EXECUTION_TIMEOUT_MS 이전 → stale
    - stale이면 logger.warn + status=FAILED 전환 후 재진입 허용
    - stale 아니면 기존 ConflictException 유지
  - EXECUTING 전환 시점에 executionStartedAt = new Date() 병행 설정
  - completed/failed 전환 시 executionStartedAt 제거 (undefined)

- `apps/backend/src/modules/data-migration/__tests__/data-migration.service.spec.ts`
  - "stale EXECUTING → FAILED 자동 전환 후 재시도 성공" 스펙 추가
  - "timeout 이내 EXECUTING → ConflictException" 스펙 추가

### 검증
```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend run test -- --testPathPattern=data-migration.service.spec
```

---

## Phase 3: C2 — calibration-plan-renderer alignment 토큰 (P2)

### 목표
renderer.service.ts 인라인 alignment 객체 3곳을 layout.ts 토큰으로 교체.

### Files to modify
- `apps/backend/src/modules/calibration-plans/calibration-plan.layout.ts`
  - ALIGNMENT 객체 export:
    - CENTER_MIDDLE: { horizontal: 'center', vertical: 'middle' }
    - CENTER_MIDDLE_SHRINK: { horizontal: 'center', vertical: 'middle', shrinkToFit: true }
    - TITLE: { horizontal: 'center', vertical: 'middle' }
  - 타입: Partial<ExcelJS.Alignment> (type-only import)

- `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`
  - 인라인 alignment 3곳 → Layout.ALIGNMENT.* 경유로 교체

### 검증
```bash
pnpm --filter backend exec tsc --noEmit
grep -n "alignment = {" apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts
# 결과: 0 matches
```

---

## Phase 4: C5 — CPLAN_008 seed 주석 (P2)

### 목표
CPLAN_008 항목별 상태 분포 주석으로 E2E 작성자 이해도 향상.

### Files to modify
- `apps/backend/src/database/seed-data/calibration/calibration-plans.seed.ts`
  - CPLAN_008 각 항목 블록 상단에 1-line 주석:
    - 확인 완료 (confirmedBy 있음) 항목들
    - bulk-confirm 대상 (actualCalibrationId 있음, confirmedBy null)
    - 계획만 존재 (actual/confirmed 모두 null)

### 검증
```bash
pnpm --filter backend exec tsc --noEmit
grep -n "bulk-confirm" apps/backend/src/database/seed-data/calibration/calibration-plans.seed.ts
# 결과: 1+ matches
```

---

## Phase 5: C4 — wf-35:103 토스트 helper 경유 (P2)

### 목표
.first() 직접 사용 → toast-helpers.ts expectToastVisible 경유.

### Files to modify
- `apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts`
  - toast-helpers import 추가
  - line ~103 .first() 사용 블록을 expectToastVisible로 교체

### 검증
```bash
pnpm --filter frontend exec tsc --noEmit
grep -n '\.first()' apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts
# 결과: 0 matches (또는 toast 관련 아닌 다른 곳만)
```

---

## Phase 6: E2 — DocumentTable 분리 (P2)

### 목표
DocumentTable.tsx 213줄 → 120줄 이하. upload 영역과 row 렌더를 서브컴포넌트 추출.

### Files to create
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/DocumentUploadButton.tsx`
  - upload 버튼 + useMutation + fileInputRef 담당

- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/DocumentTableRow.tsx`
  - TableRow 단위 (Icon/Badge/actions 포함)

### Files to modify
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/DocumentTable.tsx`
  - DocumentUploadButton, DocumentTableRow 사용으로 교체
  - 결과 ≤ 120줄

### 검증
```bash
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend run lint
wc -l "apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/DocumentTable.tsx"
# 120줄 이하
```

---

## Phase 7: E1 — SoftwareValidationContent 컴포넌트 추출 (P2)

### 목표
SoftwareValidationContent.tsx 1033줄 → 500줄 이하. 3개 서브컴포넌트 추출.
주의: ValidationAttachmentPicker와 ValidationListFilters는 list 페이지에 해당 영역 없음 → 제외.

### Files to create
- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationFunctionsTable.tsx`
  - acquisition/processing 두 섹션 모두 처리 가능한 재사용 컴포넌트
  - props: title, description, items: FunctionItem[], onItemsChange

- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationControlTable.tsx`
  - control functions 5필드 리스트
  - props: items: FunctionItem[], onItemsChange

- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationActionsBar.tsx`
  - 상태별 액션 버튼 (상태에 따른 submit/approve/reject 등)
  - props: validation, can, user, 각 액션 핸들러, pending 플래그들

### Files to modify
- `apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx`
  - 3개 서브컴포넌트 사용으로 교체
  - 결과 ≤ 500줄

### 검증
```bash
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend run lint
wc -l "apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx"
# 500줄 이하
```

---

## Phase 8: C3 — form-templates GET 패턴 문서화 (P2)

### 목표
frontend-patterns.md에 API GET 패턴 선택 기준 섹션 추가.

### Files to modify
- `docs/references/frontend-patterns.md`
  - "### API GET 응답 패턴 선택" 섹션 추가:
    - transformSingleResponse/transformArrayResponse vs apiClient.get<T>() 직접
    - 레거시 비-envelope 엔드포인트 예외 규칙

### 검증
```bash
grep -n "API GET 응답 패턴" docs/references/frontend-patterns.md
# 결과: 1 match
```

---

## Phase 9: F1 — software-validation-workflow.md (P3)

### 목표
시험용 SW 유효성 확인 운영 가이드 신규 작성.
절차서 수치 임의 생성 금지 — 미확인 항목은 "TBD (절차서 §14 원문 확인 필요)" 처리.

### Files to create
- `docs/references/software-validation-workflow.md`
  - 상태 전이 다이어그램 (draft→submitted→approved→quality_approved/rejected)
  - ISO/IEC 17025 §6.2.2 (승인자 독립성) / §6.4.13 (기록 보존)
  - validationType 분기 (vendor vs self)
  - assertIndependentApprover 가드 설명
  - 관련 파일 경로 목록
  - SLA/보존연한은 TBD (절차서 원문 확인 전 수치 기재 금지)

### 검증
```bash
test -f docs/references/software-validation-workflow.md && echo "created"
```

---

## Phase 10: Tracker 최종 정리

### Files to modify
- `.claude/exec-plans/tech-debt-tracker.md`
  - A1~F1 완료 항목들 Open → 완료 체크 (날짜 주석 포함)
  - 스킵 항목은 Open 유지

---

## Verification 통합

```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend run lint
```

## Dependencies

Phase 0 → Phase 1-9 (독립, 병렬 가능) → Phase 10 (마무리)
