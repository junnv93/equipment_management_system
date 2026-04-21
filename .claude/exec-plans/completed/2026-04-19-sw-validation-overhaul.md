# UL-QP-18-09 소프트웨어 유효성 확인 전면 재정비

## 메타
- 생성: 2026-04-19T00:00:00+09:00
- 모드: Mode 2
- 예상 변경: 40+ 파일
- 슬러그: `sw-validation-overhaul`
- 원본 플랜: `/home/kmjkds/.claude/plans/tingly-zooming-axolotl.md`

## 설계 철학

UL-QP-18-09 절차서 원문과 ISO/IEC 17025 §6.2.2·§6.4.13·§7.11 기준에서 발견된
6개 표준 매핑 공백을 DB → Service → Frontend → Export 레이어 전 스택에서 수정하여,
시드 데이터로 절차서 기준에 부합하는 완성 문서를 다운로드할 수 있는 상태를 달성한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| JSONB vs child table | JSONB + Zod 강화 | 범위 제한, 성능 저하 관측 시 이전 |
| 제어 기능 스키마 | 동일 JSONB 컬럼 재사용 + discriminated union | 새 컬럼 불필요 |
| result 필드 유지 | 유지 | UX상 합격/불합격 요약, 절차서 외 필드 |
| 재검증 상태 표현 | latestValidationId nullify + 알림 | enum 변경 최소화 |
| 실시간 알림 | refetchInterval 30s (pending 탭) | SSE 인프라 불필요 |

## 구현 Phase

### Phase 0: 실측 검증 + 베이스라인 (read-only)
**목표:** 코드/DB/템플릿 현황 실측, 공백 6개 확인, 베이스라인 수집
**변경 파일:** 없음 (read-only)
**검증:** `.claude/evaluations/2026-04-19-sw-validation-phase0.md` 작성 완료

### Phase 1: Schema Realignment
**목표:** 절차서 필드 매핑 Zod 스키마 + PG CHECK 제약 + audit append-only + seed 이중 인코딩 수정
**변경 파일:**
1. `packages/schemas/src/software-validation/function-item.ts` — 신규: 절차서 4/6 필드 Zod 스키마
2. `packages/schemas/src/software-validation/index.ts` — 신규: barrel export
3. `apps/backend/src/modules/software-validations/dto/create-validation.dto.ts` — 수정: 신규 스키마 적용
4. `apps/backend/src/modules/software-validations/dto/update-validation.dto.ts` — 수정: 신규 스키마 적용
5. `apps/backend/drizzle/NNNN_software_validation_invariants.sql` — 신규: CHECK NOT VALID → VALIDATE
6. `apps/backend/drizzle/NNNN_audit_log_append_only.sql` — 신규: append-only 트리거
7. `apps/frontend/lib/errors/software-validation-errors.ts` — 신규: 에러 코드 SSOT
8. `apps/backend/src/database/seed-data/software/software-validations.seed.ts` — 수정: 이중 인코딩 제거 + 필드 확장
**검증:** `pnpm tsc --noEmit`, `pnpm --filter backend test -- software-validations`, migration apply

### Phase 2: Service & Workflow Hardening
**목표:** self-approval 방지, quality_approved→test_software 연계, 재검증 트리거, list 엔드포인트
**변경 파일:**
1. `apps/backend/src/modules/software-validations/software-validations.service.ts` — 수정: self-approval/dual-same-person 가드, emitAsync catch
2. `apps/backend/src/modules/software-validations/software-validations.controller.ts` — 수정: findAll + timeline 엔드포인트
3. `apps/backend/src/modules/software-validations/dto/list-validation-query.dto.ts` — 신규: 목록 필터 DTO
4. `packages/db/src/schema/test-software.ts` — 수정: latestValidationId, latestValidatedAt 컬럼 추가
5. `apps/backend/drizzle/NNNN_test_software_latest_validation.sql` — 신규: 컬럼 추가 마이그레이션
6. `apps/backend/src/modules/test-software/listeners/software-validation-approved.listener.ts` — 신규: quality_approved 연계
7. `apps/backend/src/modules/test-software/listeners/test-software-version-change.listener.ts` — 신규: 재검증 트리거
8. `apps/backend/src/modules/test-software/test-software.module.ts` — 수정: listener 등록
9. `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` — 수정: 20+ 케이스 추가
**검증:** `pnpm --filter backend test -- software-validations`, API curl 검증

### Phase 3: Frontend Architecture
**목표:** 12개 훅, 10개 컴포넌트, Permission 가드, 글로벌 라우트, a11y, i18n
**변경 파일:**
1. `apps/frontend/hooks/use-software-validation.ts` — 신규
2. `apps/frontend/lib/utils/software-validation-exportability.ts` — 신규
3. `apps/frontend/lib/api/query-config.ts` — 수정: softwareValidations queryKeys 추가
4. `packages/shared-constants/src/frontend-routes.ts` — 수정: SOFTWARE_VALIDATIONS 라우트
5. `apps/frontend/components/software-validations/ValidationStatusBadge.tsx` — 신규
6. `apps/frontend/components/software-validations/ValidationWorkflowTimeline.tsx` — 신규
7. `apps/frontend/components/software-validations/ValidationListFilters.tsx` — 신규
8. `apps/frontend/components/software-validations/ValidationCreateDialog.tsx` — 신규
9. `apps/frontend/components/software-validations/ValidationEditDialog.tsx` — 신규
10. `apps/frontend/components/software-validations/ValidationRejectDialog.tsx` — 신규
11. `apps/frontend/components/software-validations/ValidationAcquisitionProcessingTable.tsx` — 신규
12. `apps/frontend/components/software-validations/ValidationControlTable.tsx` — 신규
13. `apps/frontend/components/software-validations/ValidationAttachmentPicker.tsx` — 신규
14. `apps/frontend/components/software-validations/ValidationActionsBar.tsx` — 신규
15. `apps/frontend/app/(dashboard)/software-validations/page.tsx` — 신규
16. `apps/frontend/app/(dashboard)/software-validations/SoftwareValidationsListContent.tsx` — 신규
17. `apps/frontend/app/(dashboard)/software-validations/[validationId]/page.tsx` — 신규
18. `apps/frontend/app/(dashboard)/software-validations/error.tsx` — 신규
19. `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/ValidationDetailContent.tsx` — 수정: formNumber SSOT
20. `apps/frontend/components/layout/Sidebar.tsx` — 수정: 메뉴 항목 추가
21. `apps/frontend/messages/ko/software.json` — 수정: 신규 키 추가
22. `apps/frontend/messages/en/software.json` — 수정: 신규 키 추가
**검증:** `pnpm tsc --noEmit`, `pnpm --filter frontend run build`, axe 0 violations

### Phase 4: Export Renderer Rework
**목표:** 3-way 분리, T4/T5 셀 매핑 교정, StreamableFile, RFC 5987 헬퍼
**변경 파일:**
1. `apps/backend/src/modules/software-validations/services/software-validation.layout.ts` — 신규
2. `apps/backend/src/modules/software-validations/services/software-validation-export-data.service.ts` — 신규
3. `apps/backend/src/modules/software-validations/services/software-validation-renderer.service.ts` — 신규
4. `apps/backend/src/modules/software-validations/services/software-validation-renderer.service.spec.ts` — 신규
5. `apps/backend/src/modules/software-validations/software-validations.module.ts` — 수정: provider 등록
6. `apps/backend/src/modules/reports/form-template-export.service.ts` — 수정: exportSoftwareValidation 제거, 2라인 위임
7. `apps/backend/src/modules/reports/reports.module.ts` — 수정: SoftwareValidationsModule import
8. `apps/backend/src/common/http/content-disposition.util.ts` — 신규: RFC 5987 헬퍼
9. `apps/backend/src/modules/reports/reports.controller.ts` — 수정: makeAttachmentHeader 재사용
**검증:** renderer spec 12+ PASS, `wc -l form-template-export.service.ts` < 1280

### Phase 5: Seed Golden Path + P0045
**목표:** P0045 IECSoft v2_6-U 공식 시드, UAT 체크리스트
**변경 파일:**
1. `apps/backend/src/database/seed-data/software/software-validations.seed.ts` — 수정: P0045 골든 시드
2. `docs/operations/uat-UL-QP-18-09.md` — 신규: UAT 체크리스트
**검증:** seed 실행 후 DOCX 다운로드, P0045 원문과 시각 비교

### Phase 6: Cross-Module Standardization (옵션)
**목표:** assertIndependentApprover 헬퍼, 5개 승인 모듈 적용
**변경 파일:**
1. `apps/backend/src/common/guards/assert-independent-approver.ts` — 신규
2. 5개 모듈 서비스 — 수정: self-approval 가드 적용
**검증:** 각 모듈 spec 1~2 케이스 추가 PASS

### Phase 7: Verification
**목표:** e2e 10+스텝, k6 로드, self-audit, 문서화
**변경 파일:**
1. `apps/frontend/tests/e2e/workflows/wf-14b-software-validation.spec.ts` — 수정
2. `scripts/load/software-validation-export.k6.js` — 신규
3. `scripts/load/software-validation-list.k6.js` — 신규
4. `docs/references/software-validation-workflow.md` — 신규
5. `docs/operations/software-validation-sla.md` — 신규
**검증:** e2e PASS, self-audit exit 0, k6 p95 < 500ms

## 전체 변경 파일 요약

### 신규 생성 (27개)
| 파일 | 목적 |
|------|------|
| `packages/schemas/src/software-validation/function-item.ts` | 절차서 4/6 필드 Zod 스키마 SSOT |
| `apps/backend/drizzle/NNNN_software_validation_invariants.sql` | PG CHECK + 인덱스 |
| `apps/backend/drizzle/NNNN_audit_log_append_only.sql` | ISO 17025 §7.11.3 append-only |
| `apps/backend/drizzle/NNNN_test_software_latest_validation.sql` | test_software 컬럼 추가 |
| `apps/frontend/lib/errors/software-validation-errors.ts` | 에러 코드 SSOT |
| `apps/backend/src/modules/software-validations/services/software-validation.layout.ts` | 렌더러 상수 SSOT |
| `apps/backend/src/modules/software-validations/services/software-validation-export-data.service.ts` | 렌더러 데이터 레이어 |
| `apps/backend/src/modules/software-validations/services/software-validation-renderer.service.ts` | 렌더러 출력 레이어 |
| `apps/backend/src/common/http/content-disposition.util.ts` | RFC 5987 헬퍼 |
| `apps/backend/src/modules/test-software/listeners/software-validation-approved.listener.ts` | quality_approved 연계 |
| `apps/backend/src/modules/test-software/listeners/test-software-version-change.listener.ts` | 재검증 트리거 |
| 10개 frontend components | software-validations/ 컴포넌트 |
| 4개 frontend routes | software-validations/ 라우트 |
| `docs/operations/uat-UL-QP-18-09.md` | UAT 체크리스트 |
| `docs/references/software-validation-workflow.md` | 운영 가이드 |

### 수정 (13개)
| 파일 | 변경 의도 |
|------|----------|
| `packages/db/src/schema/test-software.ts` | latestValidationId/latestValidatedAt 추가 |
| `apps/backend/src/.../software-validations.service.ts` | self-approval 가드, emitAsync catch |
| `apps/backend/src/.../software-validations.controller.ts` | findAll + timeline 엔드포인트 |
| `apps/backend/src/.../form-template-export.service.ts` | exportSoftwareValidation 이관 |
| `apps/backend/src/.../software-validations.seed.ts` | 이중 인코딩 제거 + P0045 시드 |
| `apps/frontend/hooks/use-software-validation.ts` | (신규) 12개 훅 |
| `apps/frontend/lib/api/query-config.ts` | softwareValidations queryKeys |
| `packages/shared-constants/src/frontend-routes.ts` | SOFTWARE_VALIDATIONS 라우트 |
| `apps/frontend/.../ValidationDetailContent.tsx` | formNumber SSOT |
| `apps/frontend/components/layout/Sidebar.tsx` | 메뉴 항목 추가 |
| `apps/frontend/messages/{ko,en}/software.json` | i18n 키 추가 |

## 의사결정 로그
- 2026-04-19: 플랜 v3 승인. JSONB + Zod(A), discriminated union(A), result 유지(A), latestValidationId nullify(B), refetchInterval(B)
- 2026-04-19: Phase 6 포함 — "시스템 전반 개선" 요구에 따라 범위 내 수행
- 2026-04-19: audit_log append-only는 Phase 1에서 전역 적용 (소프트웨어 검증 범위 초과 — 의도적)
