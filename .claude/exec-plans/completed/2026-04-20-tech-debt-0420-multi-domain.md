---
slug: tech-debt-0420-multi-domain
date: 2026-04-20
status: active
---

# Tech-Debt 0420 Multi-Domain — Exec Plan

tech-debt-tracker.md Open 항목 중 calibration/calibration-plans 도메인을 제외한 잔존 항목을 처리.

## 사전 확인 (플래닝 중 드러난 사실)

- **Item 2 (approve assertIndependentApprover) 이미 완료 상태**
  `software-validations.service.ts:385` — `assertIndependentApprover(existing.submittedBy ?? '', approverId, 'SELF_APPROVAL_FORBIDDEN')` 헬퍼 이미 사용. Phase 2에서 재확인 후 tracker 항목만 closed 표기.

- **Item 6 (SELECT * projection) 이미 완료 상태**
  파일 경로 `apps/backend/src/modules/equipment/services/equipment-registry-data.service.ts`는 **존재하지 않음**. 실제: `apps/backend/src/modules/reports/services/equipment-registry-data.service.ts`이며 lines 101-119에서 이미 16개 명시적 projection 사용. tracker 항목만 closed 표기.

- **Item 7 (고아 SQL) 사용자 리스트 오류 정정 필요**
  journal idx=34 tag = `0034_software_validation_constraints` → `0034_software_validation_constraints.sql`은 **canonical (삭제 금지)**.
  실제 고아는 3개:
  - `0033_software_validation_constraints.sql` (idx=33 tag: `0033_calibration_certificate_path_backfill`)
  - `0035_test_software_latest_validation.sql` (idx=35 tag: `0035_audit_log_append_only`)
  - `0036_software_validations_composite_idx.sql` (idx=36 tag: `0036_test_software_latest_validation`)

- **Item 3 (wf-14b)**: 파일 존재. Step 12(self-approval), Step 13(dual-approval), Step 14(revise) 이미 커버. 추가 필요: 재검증 배너 표시 + quality_approve 후 소멸.

- **Item 9 (CI 참조 파일)**: `.github/workflows/quality-gate.yml` 없음. 실제: `.github/workflows/main.yml` (quality-gate job). 이 파일을 패턴 참조로 사용.

- **Item 4 (i18n)**: 더 간단한 안 = 중립 단일 문구 교체 (BE API 변경 없음). ko/en JSON 2개 파일만.

## 스코프 경계

**포함**: software-validations, reports(docx util), drizzle(orphan SQL 삭제), frontend i18n(software.json), E2E(wf-14b 보강), CI workflows(신규 3개), docs/operations(성능 예산)

**제외** (다른 세션 작업 중):
- `apps/backend/src/modules/calibration/**`
- `apps/backend/src/modules/calibration-plans/**`
- `apps/frontend/components/calibration-plans/**`
- `apps/frontend/components/calibration/**`

## Phase 구성

### Phase 1 — Cleanup / Trivial (서브태스크 독립)

#### 1a) 고아 SQL 파일 삭제

삭제 전 검증 필수:
```bash
node -e "const j=require('./apps/backend/drizzle/meta/_journal.json'); const orphanPrefixes=['0033_software_validation','0035_test_software_latest','0036_software_validations_composite']; console.log(j.entries.filter(e=>orphanPrefixes.some(p=>e.tag.startsWith(p))).length, '개 매치 → 0이어야 orphan 확정')"
```

삭제 대상:
- `apps/backend/drizzle/0033_software_validation_constraints.sql`
- `apps/backend/drizzle/0035_test_software_latest_validation.sql`
- `apps/backend/drizzle/0036_software_validations_composite_idx.sql`

삭제 금지:
- `apps/backend/drizzle/0034_software_validation_constraints.sql` (journal canonical idx=34)

#### 1b) docx-template.util.ts insertBeforeSectPr fallback 교체

위치: `apps/backend/src/modules/reports/docx-template.util.ts:~542`

변경: `replace('</w:body>', ...)` → `lastIndexOf('</w:body>')` 기반 slice+concat 방식.
안전성: 문자열에 `</w:body>`가 여러 번 등장해도 마지막 위치에만 삽입.

#### 1c) i18n 재검증 배너 문구 교체

위치:
- `apps/frontend/messages/ko/software.json` → `detail.revalidationRequired`
- `apps/frontend/messages/en/software.json` → `detail.revalidationRequired`

교체 방향:
- ko: "유효성 확인이 필요합니다. (ISO/IEC 17025 §6.4.13)"
- en: "Software validation is required. (ISO/IEC 17025 §6.4.13)"

이유: "소프트웨어 버전이 변경되어..." 문구는 최초 등록 시나리오(latestValidationId=null)에서 false statement. 중립 문구가 두 시나리오 모두에 정확.

#### Phase 1 검증
```bash
# 고아 삭제 확인
ls apps/backend/drizzle/0033_software_validation_constraints.sql 2>/dev/null && echo FAIL || echo OK
ls apps/backend/drizzle/0035_test_software_latest_validation.sql 2>/dev/null && echo FAIL || echo OK
ls apps/backend/drizzle/0036_software_validations_composite_idx.sql 2>/dev/null && echo FAIL || echo OK
# canonical 존재 확인
ls apps/backend/drizzle/0034_software_validation_constraints.sql
ls apps/backend/drizzle/0036_test_software_latest_validation.sql
# docx 패턴 검증
grep -n "replace('</w:body>'" apps/backend/src/modules/reports/docx-template.util.ts && echo FAIL || echo OK
# i18n 검증
grep -q "유효성 확인이 필요합니다" apps/frontend/messages/ko/software.json || echo FAIL
grep -q "소프트웨어 버전이 변경되어" apps/frontend/messages/ko/software.json && echo FAIL || echo OK
```

---

### Phase 2 — BE 수정

#### 2a) software-validation-renderer.service.spec.ts 신규

위치: `apps/backend/src/modules/software-validations/services/__tests__/software-validation-renderer.service.spec.ts`

참조 패턴: `apps/backend/src/modules/equipment/services/history-card-renderer.service.spec.ts` (PizZip in-memory)

검증 항목 (WHAT):
- vendor 렌더 smoke: 최소 픽스처 + T0/T1/T2 테이블 존재 확인
- T4 셀 좌표 매핑: `FUNCTION_ITEM_ROWS.name/independentMethod/acceptanceCriteria` SSOT 좌표에 삽입 확인
- T5 셀 좌표 매핑: 동일 패턴
- T6 `CONTROL_MAX_ROWS=3` 상수 검증 + 3개 초과 슬라이싱
- 빈 배열 가드: no-op (에러 없음)
- storage.getSignature: signaturePath=null 시 미호출

제약:
- 테이블 인덱스·셀 좌표는 `software-validation.layout.ts` SSOT import (리터럴 금지)
- `CONTROL_MAX_ROWS`, `TABLE_INDEX`, `FUNCTION_ITEM_ROWS`, `CONTROL_DATA_START_ROW`, `CONTROL_COLS` 상수만 사용

#### Phase 2 검증
```bash
pnpm --filter backend run test -- --testPathPattern="software-validation-renderer.service.spec"
pnpm --filter backend run type-check
```

---

### Phase 3 — FE 수정

#### 3a) ValidationDetailContent useCasGuardedMutation 교체

위치: `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/ValidationDetailContent.tsx`

변경 (WHAT):
- `useMutation` → `useCasGuardedMutation` (update 뮤테이션만. upload 등 다른 mutation은 유지)
- `fetchCasVersion`: `softwareValidationApi.getById(validationId).then(v => v.version)` 패턴
- `mutationFn`: `(data, version) => softwareValidationApi.update(validationId, { ...data, version })`
- `onError`에서 `isConflictError` 수동 분기 제거 (훅이 VERSION_CONFLICT 토스트 자동 처리)
- `onSuccess`에서 `queryKeys.softwareValidations.detail(validationId)` 무효화 유지
- `import { isConflictError } from '@/lib/api/error'` 제거

불변:
- `updateMutation.isPending` 기반 로더 UI (훅이 동일 API 반환)
- `toast({ title: t('toast.updateSuccess') })` 성공 메시지
- `setIsEditOpen(false)` 동작

#### Phase 3 검증
```bash
pnpm --filter frontend run type-check
grep -n "useCasGuardedMutation" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/\[validationId\]/ValidationDetailContent.tsx
grep -n "isConflictError" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/\[validationId\]/ValidationDetailContent.tsx && echo FAIL || echo OK
```

---

### Phase 4 — E2E wf-14b 보강

위치: `apps/frontend/tests/e2e/workflows/wf-14b-software-validation.spec.ts`

기존 커버 (수정 금지): Step 12(self-approval), Step 13(dual-approval), Step 14(revise)

추가 (WHAT):

**Step 16: 재검증 배너 표시 시나리오 (신규 describe)**
- testSoftware requiresValidation=true 등록 직후 `/software/[id]` 네비게이션
- `latestValidationId === null` → 배너 visible 확인
- 배너 텍스트: Phase 1c 교체 결과 "유효성 확인이 필요합니다" (i18n 키 `detail.revalidationRequired`)
- CTA 버튼 표시 확인

**Step 17: quality_approve 후 배너 소멸**
- vendor validation 생성 → submit → TM approve → QM quality_approve
- `/software/[id]` 재진입 → 배너 `.not.toBeVisible()` 확인

제약:
- `networkidle` 금지 (`load` 사용)
- `auth.fixture` 경유
- `waitForTimeout` 금지
- 기존 Steps 12-15 블록 위에 mode: 'serial' 유지
- 새 describe는 파일 말미에 추가

#### Phase 4 검증
```bash
pnpm --filter frontend run playwright:e2e -- --grep "WF-14b"
```

---

### Phase 5 — CI 배포 게이트

#### 5a) `.github/workflows/performance-audit.yml`

트리거: `pull_request` (main), `workflow_dispatch`
도구: `treosh/lighthouse-ci-action`
라우트: /dashboard, /equipment, /e/:mgmt
임계값 참조: `docs/operations/performance-budgets.md`

#### 5b) `.github/workflows/accessibility-audit.yml`

트리거: `pull_request` (main), `workflow_dispatch`
도구: `@axe-core/cli`
라우트: 5a와 동일

#### 5c) `.github/workflows/bundle-size.yml`

트리거: `pull_request` (main), `workflow_dispatch`
도구: `size-limit`

#### 5d) `docs/operations/performance-budgets.md`

섹션:
- Lighthouse CI 임계값 (Performance >= 90, Accessibility >= 95, Best Practices >= 90, SEO >= 90)
- Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)
- axe-core 임계값 (0 critical/serious)
- 번들 크기 (First Load JS < 250KB, per-route < 150KB, total static < 2MB)
- /e/:mgmt (QR landing, 모바일) LCP < 1.8s

#### Phase 5 검증
```bash
npx --yes actionlint .github/workflows/performance-audit.yml .github/workflows/accessibility-audit.yml .github/workflows/bundle-size.yml
test -f docs/operations/performance-budgets.md
```

---

## 최종 검증 (전체)

```bash
pnpm --filter backend run type-check
pnpm --filter frontend run type-check
pnpm build --filter "@equipment-management/*"
pnpm --filter backend run test
pnpm --filter frontend run test -- --passWithNoTests
pnpm --filter backend run lint:ci
pnpm --filter frontend run lint
node scripts/self-audit.mjs --all
```

## 명시적 Out-of-Scope

- calibration / calibration-plans 도메인 파일
- `TestSoftwareDetailContent.tsx` 코드 수정 (JSON만 교체)
- `apps/backend/drizzle/0034_software_validation_constraints.sql` 삭제 금지
- BE에 neverValidated 구분 필드 신설
- ZodSerializerInterceptor 글로벌 승격 (트리거 조건 미달)
- equipment-registry-data.service.ts 추가 수정 (이미 완료)
