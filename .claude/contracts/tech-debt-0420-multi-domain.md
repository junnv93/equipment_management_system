---
slug: tech-debt-0420-multi-domain
date: 2026-04-20
phase: active
---

# Contract — Tech-Debt 0420 Multi-Domain

## MUST (Global)

| ID  | Criterion | Verification |
|-----|-----------|--------------|
| G1  | Backend tsc exit 0 | `pnpm --filter backend run type-check` |
| G2  | Frontend tsc exit 0 | `pnpm --filter frontend run type-check` |
| G3  | Shared packages 빌드 성공 | `pnpm build --filter "@equipment-management/*"` |
| G4  | Backend 전체 test 통과 | `pnpm --filter backend run test` |
| G5  | Frontend unit test 통과 | `pnpm --filter frontend run test -- --passWithNoTests` |
| G6  | Backend lint 통과 | `pnpm --filter backend run lint:ci` |
| G7  | Frontend lint 통과 | `pnpm --filter frontend run lint` |
| G8  | self-audit 통과 | `node scripts/self-audit.mjs --all` |
| G9  | calibration/calibration-plans 도메인 파일 미수정 | `git diff --name-only \| grep -E "(modules/calibration\b\|modules/calibration-plans\|components/calibration)" \| wc -l` → 0 |

## MUST (Item-Specific)

### Phase 1 — Cleanup

| ID  | Criterion | Verification |
|-----|-----------|--------------|
| M1a-1 | 고아 `0033_software_validation_constraints.sql` 삭제 | 파일 부재 |
| M1a-2 | 고아 `0035_test_software_latest_validation.sql` 삭제 | 파일 부재 |
| M1a-3 | 고아 `0036_software_validations_composite_idx.sql` 삭제 | 파일 부재 |
| M1a-4 | canonical `0034_software_validation_constraints.sql` 존재 유지 | `ls apps/backend/drizzle/0034_software_validation_constraints.sql` |
| M1a-5 | canonical `0036_test_software_latest_validation.sql` 존재 유지 | `ls apps/backend/drizzle/0036_test_software_latest_validation.sql` |
| M1a-6 | canonical `0037_software_validations_composite_idx.sql` 존재 유지 | `ls apps/backend/drizzle/0037_software_validations_composite_idx.sql` |
| M1a-7 | journal 엔트리 수 무변동 | `jq '.entries \| length' apps/backend/drizzle/meta/_journal.json` → 기존 동일 |
| M1b-1 | `docx-template.util.ts`: `replace('</w:body>'` 패턴 소멸 | `grep -n "replace('</w:body>'" apps/backend/src/modules/reports/docx-template.util.ts` → 0 매치 |
| M1b-2 | `lastIndexOf('</w:body>')` 패턴 추가 | `grep -n "lastIndexOf('</w:body>')" apps/backend/src/modules/reports/docx-template.util.ts` → >=1 |
| M1c-1 | `ko/software.json:detail.revalidationRequired` 중립 문구 | `grep "유효성 확인이 필요합니다" apps/frontend/messages/ko/software.json` → 매치 |
| M1c-2 | 이전 문구 "소프트웨어 버전이 변경되어" 잔존 금지 | `grep "소프트웨어 버전이 변경되어" apps/frontend/messages/ko/software.json` → 0 매치 |
| M1c-3 | `en/software.json:detail.revalidationRequired` 중립 문구 | `grep -i "validation is required" apps/frontend/messages/en/software.json` → 매치 |

### Phase 2 — BE spec

| ID  | Criterion | Verification |
|-----|-----------|--------------|
| M2a-1 | renderer spec 파일 신규 존재 | `test -f apps/backend/src/modules/software-validations/services/__tests__/software-validation-renderer.service.spec.ts` |
| M2a-2 | PizZip in-memory 픽스처 사용 | spec 파일에 `import PizZip` |
| M2a-3 | SSOT 상수 참조 (좌표 리터럴 금지) | spec 파일에 `TABLE_INDEX\|FUNCTION_ITEM_ROWS\|CONTROL_MAX_ROWS\|CONTROL_DATA_START_ROW` import, `row: [0-9]+, col: [0-9]+` 직접 리터럴 없음 |
| M2a-4 | CONTROL_MAX_ROWS 슬라이싱 검증 케이스 포함 | spec에 `CONTROL_MAX_ROWS` 참조 assertion |
| M2a-5 | spec 모든 케이스 PASS | `pnpm --filter backend run test -- --testPathPattern="software-validation-renderer.service.spec"` exit 0 |
| M2a-6 | 최소 6개 테스트 케이스 | spec 내 `it(\|test(` count >= 6 |

### Phase 3 — FE

| ID  | Criterion | Verification |
|-----|-----------|--------------|
| M3a-1 | `ValidationDetailContent.tsx`에 `useCasGuardedMutation` import | `grep "useCasGuardedMutation" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/\[validationId\]/ValidationDetailContent.tsx` |
| M3a-2 | `isConflictError` import 제거 | `grep "isConflictError" ...ValidationDetailContent.tsx` → 0 매치 |
| M3a-3 | VERSION_CONFLICT 수동 분기 소멸 | `onError` 내부 `isConflictError` 호출 없음 |
| M3a-4 | `queryKeys.softwareValidations.detail(validationId)` 무효화 유지 | 해당 문자열 매치 |

### Phase 4 — E2E

| ID  | Criterion | Verification |
|-----|-----------|--------------|
| M4a-1 | wf-14b 기존 Steps 12-15 유지 | `grep -c "Step 12\|Step 13\|Step 14" wf-14b.spec.ts` → 기존 이상 |
| M4a-2 | 재검증 배너 표시 시나리오 추가 | wf-14b에 배너 표시 assertion 블록 매치 |
| M4a-3 | quality_approve 후 배너 소멸 시나리오 추가 | wf-14b에 `.not.toBeVisible()` 또는 `.toBeHidden()` + revalidationRequired 매치 |
| M4a-4 | `networkidle` 미사용 | `grep "networkidle" wf-14b.spec.ts` → 0 매치 |
| M4a-5 | `auth.fixture` 경유 | wf-14b에 auth.fixture import |

### Phase 5 — CI

| ID  | Criterion | Verification |
|-----|-----------|--------------|
| M5a-1 | `performance-audit.yml` 신규 존재 | `test -f .github/workflows/performance-audit.yml` |
| M5a-2 | Lighthouse CI 도구 사용 | performance-audit.yml에 lighthouse 또는 `@lhci` 매치 |
| M5a-3 | /dashboard, /equipment, /e/:mgmt 라우트 명시 | 3개 라우트 모두 매치 (yml 또는 LHCI config) |
| M5b-1 | `accessibility-audit.yml` 신규 존재 | `test -f .github/workflows/accessibility-audit.yml` |
| M5b-2 | axe-core 도구 사용 | accessibility-audit.yml에 `axe` 매치 |
| M5c-1 | `bundle-size.yml` 신규 존재 | `test -f .github/workflows/bundle-size.yml` |
| M5c-2 | size-limit 또는 동등 도구 | bundle-size.yml에 `size-limit` 매치 |
| M5d-1 | `docs/operations/performance-budgets.md` 신규 존재 | `test -f docs/operations/performance-budgets.md` |
| M5d-2 | Lighthouse/axe/Bundle 섹션 모두 포함 | performance-budgets.md에 3개 섹션 매치 |
| M5d-3 | 워크플로우 3개 → performance-budgets.md 참조 | 각 YAML에 `performance-budgets` 매치 |
| M5e-1 | YAML 문법 유효 | `actionlint` 3개 파일 exit 0 |
| M5e-2 | 기존 워크플로우 미수정 | `git diff --name-only .github/workflows/ \| grep -vE "(performance-audit\|accessibility-audit\|bundle-size)" \| wc -l` → 0 |

## SHOULD

| ID  | Criterion |
|-----|-----------|
| S1  | tech-debt-tracker.md 처리 항목 ✅ 완료 2026-04-20 마킹 |
| S2  | Item 2/6 이미완료 사실 및 Item 7 리스트 오류 정정을 PR 설명에 명시 |
| S3  | Phase 5 워크플로우 `pull_request` 트리거 포함 |
| S4  | Phase 5 도구 버전 pin (SHA 또는 major 고정) |
| S5  | Phase 2 spec ≥ 8개 케이스 (smoke + 좌표 매핑 + 경계값) |

## Out-of-Scope (Non-Goals)

- calibration / calibration-plans 도메인 파일 수정
- `TestSoftwareDetailContent.tsx` 코드 수정
- `apps/backend/drizzle/0034_software_validation_constraints.sql` 삭제
- BE neverValidated 구분 필드 신설
- ZodSerializerInterceptor 글로벌 승격
- equipment-registry-data.service.ts 추가 수정
