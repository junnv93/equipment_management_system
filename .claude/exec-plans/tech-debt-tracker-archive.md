# Tech Debt Tracker — 완료 항목 아카이브

harness 세션에서 완료된 SHOULD 실패·후속 작업 기록.
활성 TODO는 [tech-debt-tracker.md](./tech-debt-tracker.md) 참조.

---

## 2026-04-21 — form-export-services + 보안 수정

- [x] **[2026-04-20 skill-gap] 🟢 LOW calibration-plan-exportability.ts 전용 verify 없음** — ✅ 2026-04-21 Won't Do. verify-hardcoding Step 23 + verify-ssot로 이미 커버. 별도 스킬 추가 없음.
- [x] **[2026-04-21 form-export-services] 보안 — checkout 스코프 검증 빈 items 엣지케이스** — ✅ 2026-04-21 완료. deny-by-default 가드 추가 (`6872c419`). `scopeActive && items.length === 0` 조건 즉시 404 반환.

---

## 2026-04-21 — ssot-status-phase2-3 (할당/인자 패턴 + 전체 종결)

- [x] **[2026-04-17 history-card-qp1802] multi-form 3-way 분리 패턴 확산** — ✅ 2026-04-21 완료. QP-18-06/07/08/10 모두 Data/Renderer/Layout 3-way 분리 완료 (tech-debt-batch-0421b).
- [x] **[2026-04-17 history-card-qp1802] 프론트엔드 E2E 검증** — ✅ 2026-04-21 완료. `wf-history-card-export.spec.ts`에 §5 섹션 유형 라벨 검증 test block 추가 (TIMELINE_ENTRY_TYPE_LABELS SSOT).
- [x] **[2026-04-17 history-card-qp1802] 시스템 관리자 승인 경로 접근 제어 확인** — ✅ 2026-04-21 완료. Phase D 분석: lab_manager 직접 승인은 UL-QP-18 §5.2 절차 준수, Permission guard + audit 이중 보호.
- [x] **[2026-04-17 ul-qp-18-forms] 🟢 LOW 양식 교체 운영 반영** — ✅ 2026-04-21 완료. `docs/operations/form-template-replacement.md` runbook 작성 (Phase E).
- [x] **[2026-04-17 ul-qp-18-forms] 🟢 LOW review-W4 EXPORT_QUERY_LIMITS.FULL_EXPORT 스트리밍** — ✅ 2026-04-21 완료. Phase C 분석: No-Go 결정. 현재 규모 안전 범위. `docs/references/export-streaming-decision.md` 참조.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 6 — Permission.EXPORT_REPORTS TE 정책 재확인** — ✅ 2026-04-21 완료. 의도된 정책. UL-QP-18 §5.2 준수, SiteScopeInterceptor 팀 격리 확인.

---

## 2026-04-21 — tech-debt-batch-b (E2E globalPrefix + cplan axe-core + M4.8 + ValidationCreateDialog 분리)

- [x] **[2026-04-16 tech-debt-s2s4] E2E globalPrefix 통합** — createTestApp에 setGlobalPrefix('api') 추가 + 22개 E2E 스펙 경로를 API_ENDPOINTS 기반으로 마이그레이션. 완료 2026-04-21.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW verify-e2e — UL-QP-19-01 UI 다운로드 E2E 없음** — `wf-export-ui-download.spec.ts`에 QP-19-01 케이스 추가 완료. 완료 2026-04-21.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW verify-seed-integrity — shared-test-data.ts ITEM_013~022 없음** — CPLAN_008/009 + ITEM_013~022 sync 완료. 완료 2026-04-21.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 8 — axe-core E2E** — `tests/e2e/a11y/calibration-plans.a11y.spec.ts` 신규 생성. list/detail/create/Reject dialog 6개 테스트. 완료 2026-04-21.
- [x] **[2026-04-20 calibration-phase4-7] M4.8 계약 모순** — CalibrationRecord.certificatePath는 M4.3(API 응답 호환성) 유지를 위해 보존. M4.8 범위를 packages/schemas+DTO로 한정, CalibrationRecord는 virtual computed field(documents 조인)로 명시(주석 추가 + contract 업데이트). 완료 2026-04-21.
- [x] **[2026-04-21 tech-debt-batch-0421] S4 — ValidationCreateDialog.tsx 232줄** (SHOULD ≤150 초과) — VendorValidationFields + SelfValidationFields 분리 완료 (135줄). 완료 2026-04-21.

---

## 2026-04-21 — batch-a-techdebt-0421 (validation 컴포넌트 분리 + calibration 쿼리키)

- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — Sticky 액션 바** — `CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.stickyContainer` 적용 완료. (코드 확인 2026-04-21)
- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — confirmItem optimistic** — `optimisticConfirmedId` 패턴 구현 완료. (코드 확인 2026-04-21)
- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — Reject textarea minLength=10** — `.length < 10` disabled 조건 + button disabled 완료. (코드 확인 2026-04-21)
- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — year "_all" 필터** — SelectItem `_all` + i18n `allYears` 구현 완료. (코드 확인 2026-04-21)
- [x] **[2026-04-20 calibration-phase4-7] S6 — CALIBRATION_DETAIL 쿼리키 바인딩** — `useCalibrationDetail` 훅 추가, `queryKeys.calibrations.detail` + `QUERY_CONFIG.CALIBRATION_DETAIL` 연결 완료. (2026-04-21)
- [x] **[2026-04-21 cleanup-0421] ValidationDocumentsSection.tsx 255줄 → 93줄** — DocumentTable.tsx 분리 완료. (2026-04-21)
- [x] **[2026-04-21 cleanup-0421] ValidationEditDialog.tsx 190줄 → 149줄** — VendorEditFields.tsx 분리 완료. (2026-04-21)

## 2026-04-21 — e2e-api-endpoints-migration / review-architecture

- [x] **[2026-04-20 e2e-api-endpoints-migration] pre-existing E2E 실패 13건** — ✅ 완료 2026-04-21. auth: canonical emails(lab.manager/tech.manager/test.engineer) + auth.service testPasswords 확장. checkouts: version:1 추가 + TEAM_FCC_EMC_RF_SUWON_ID 동일팀 장비. auth 8/8, checkouts 13/13 통과.
- [x] **[2026-04-20 review-architecture] BE: CalibrationPlanSyncListener 이중 갱신** — ✅ 완료 2026-04-21. `if (payload.linkedPlanItemId)` 진입부 early-return 추가. tx 내 직접 링크된 경우 year-scope recordActualCalibrationDate 스킵.
- [x] **[2026-04-20 review-architecture] BE: CALIBRATION_UPDATED/UPLOADED/REVISED 이벤트 미발행** — ✅ 완료 2026-04-21. update()에 emitAsync(CALIBRATION_UPDATED) 추가 + recordCertificateDocuments() 신규 메서드로 UPLOADED/REVISED emit. teamId는 resolveEquipmentTeamId()로 정확히 조회. controller uploadDocuments에서 호출.
- [x] **[2026-04-20 review-architecture] FE: ValidationDetailContent `useCasGuardedMutation` 교체** — ✅ 완료 2026-04-21. useMutation → useCasGuardedMutation 전환. isConflictError 수동 처리 제거. fetchCasVersion으로 항상 최신 version 조회 후 mutate.
- [x] **[2026-04-20 review-architecture] FE: VersionHistory staleTime 미지정** — ✅ 완료 2026-04-21. REFETCH_STRATEGIES.STATIC 적용 (버전히스토리는 append-only, focus refetch 불필요).
- [x] **[2026-04-20 e2e-api-endpoints-migration] POST /checkouts/:id/return HTTP 메서드 불일치** — ✅ 확인 종결 2026-04-20. 실측 결과 컨트롤러 `@Post(':uuid/return')` + 테스트 `.post()` 모두 POST로 정합. SSOT(`api-endpoints.ts`)는 URL 경로만 관리(HTTP 메서드 무관). 불일치 없음.

## 2026-04-20 — calibration-status-filter-url / calibration-plan-confirm / nc-workflow-atomicity

- [x] **[2026-04-20 calibration-status-filter-url] E2E 테스트 deprecated status 파라미터 잔존** — ✅ 완료 2026-04-20. `group-a-calibration-display.spec.ts` + `group-a-filter-status.spec.ts` + `equipment-list.plan.md` 수정. 상태 드롭다운 → 교정기한 필터 드롭다운 인터랙션 교체.
- [x] **[2026-04-20 calibration-plan-confirm] S5 — confirmAllItems 서비스 단위 테스트 미작성** — ✅ 완료 2026-04-20. 4개 케이스 추가: approved 2건 확인, non-approved BadRequestException, CAS 불일치 ConflictException, actualCalibrationId 없는 항목 0건 반환.
- [x] **[2026-04-20 calibration-plan-confirm] S6 — 렌더러 테스트에 확인 셀 assertion 없음** — ✅ 완료 2026-04-20. `calibration-plans-export.service.spec.ts`에 두 확인자 이름 기록 + confirmedBy=null → '-' assertion 추가.
- [x] **[2026-04-20 nc-workflow-atomicity] S2 — close() 복원 구조화 로그 없음** — ✅ 완료 2026-04-20. `close()` 캐시 무효화 직후 `logger.debug({ message: 'NC close: equipment status restore', ncId, equipmentId, previousEquipmentStatus, equipmentStatusRestored })` 구조화 로그 추가.
- [x] **[2026-04-20 nc-workflow-atomicity] S1 — NC close() previousEquipmentStatus 복원 단위 테스트 없음** — ✅ 완료 2026-04-20. `describe('previousEquipmentStatus restore logic')` 3개 시나리오 추가: spare 복원, null→available 폴백, disposed(excluded)→available 폴백.

## 2026-04-20 — cplan-export-audit Warning 즉시 수정

- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM renderer.service templateBuffer 내부 로드** — ✅ 완료 2026-04-20. orchestrator(CalibrationPlansExportService)가 getTemplateBuffer 후 render(plan, buffer) 주입. renderer에서 FormTemplateService DI 완전 제거. 순수 unit 테스트 가능 구조 달성.
- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM CalibrationPlansContent TableRow 이중 네비게이션** — ✅ 완료 2026-04-20 (실측 확인). TableRow onClick 없음, Link absolute inset-0 overlay만 유지. 히스토리 스택 이중 push 해소.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — ApprovalTimeline sr-only 요약** — ✅ 완료 2026-04-20. `<span className="sr-only">N단계 완료, 진행 중 단계, 총 3단계</span>` 추가.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — PlanStatusBadge 추출** — ✅ 완료 2026-04-20. `PlanStatusBadge.tsx` 신규 + CalibrationPlansContent/VersionHistory/CalibrationPlanDetailClient 3곳 교체.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 8 — prefers-reduced-motion 가드** — ✅ 완료 2026-04-20. `CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.stickyContainer`에 `motion-reduce:transition-none` 추가.

## 2026-04-20 — calibration-phase4-7 / nc-detail-design-fix

- [x] **[2026-04-20 calibration-phase4-7] S3 — CACHE_EVENTS.CALIBRATION_CREATED payload linkedPlanItemId** — ✅ 완료 2026-04-20. `CalibrationCachePayload.linkedPlanItemId?: string | null` 필드 추가 + `calibration.service.ts` emit 시 `planItemId ?? null` 주입.
- [x] **[2026-04-20 calibration-phase4-7] MC.4 — Phase 5a/5b/5c 커밋 병합** — ✅ 확인 종결 2026-04-21. 코드는 정상, 커밋 분리 불필요.
- [x] **[2026-04-20 calibration-phase4-7] 고아 SQL 파일 정리** — ✅ 완료 2026-04-20. journal 검증 후 0033/0034/0035/0036 orphan 4개 삭제. canonical(0034/0035/0036/0037) 보존.
- [x] **[2026-04-20 nc-detail-design-fix] W-FE1 NCDetailClient.tsx:329 편집 권한 명시성** — ✅ 완료 2026-04-20. `canEditNC = canCloseNC` alias 추가 + UL-QP-18 §14 근거 주석으로 의도 명확화.
- [x] **[2026-04-20 nc-detail-design-fix] W-BE2 calibration-plan-renderer.service.ts:72 confirmedSignature 로직** — ✅ 완료 2026-04-20. 주석 추가.
- [x] **[2026-04-20 nc-detail-design-fix] W-BE3 calibration-plans-export.service.spec.ts:173 테스트 하드코딩** — ✅ 완료 2026-04-20. `'연간교정계획서'` 리터럴 → `FORM_CATALOG['UL-QP-19-01'].name.replace(/\s+/g, '')` SSOT 경유로 교체.

## 2026-04-20 — skill-gap 업데이트

- [x] **[2026-04-20 skill-gap] verify-auth Step 13 추가** — FE role 리터럴 직접 비교 탐지. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-hardcoding Step 23 추가** — export-data 서비스의 status allowlist 리터럴 탐지. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-frontend-state Related Files + Step 15 추가** — use-cas-guarded-mutation.ts 커버. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-cas Related Files + Step 12 추가** — use-cas-guarded-mutation.ts fetch-before-mutate 훅 참조. ✅ 완료 2026-04-20.

## 2026-04-19 — 다수 세션 완료

- [x] **[2026-04-19 test-software-detail-refactor] S1 — optimisticUpdate non-null assertion** — ✅ 완료 2026-04-19. `throw new Error('optimisticUpdate: cache miss on detail page')`로 교체.
- [x] **[2026-04-19 docx-append-section-sectpr] S1 — insertBeforeSectPr fallback** — ✅ 완료 2026-04-20. `lastIndexOf('</w:body>')` + slice+concat 방식으로 교체.
- [x] **[2026-04-19 verify-sql-safety] 🟠 HIGH fk-resolution.service.ts ilike() 직접 사용** — ✅ 완료 2026-04-19. `safeIlike(users.name, likeContains(name))`로 교체.
- [x] **[2026-04-19 review-arch] 🟡 MEDIUM purgeDeletedDocuments 전체 배치 실패 무한루프** — ✅ 완료 2026-04-19. `consecutiveFullFailBatches` 카운터 + `MAX_CONSECUTIVE_FULL_FAIL=2` 연속 실패 시 abort.
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM sql 템플릿 → eq() 전환 (enum 필터)** — ✅ 2026-04-19. form-template-export.service.ts 5건 eq() 교체.
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM HandoverQRDisplay appUrl 빈 문자열 가드** — ✅ 이미 적용됨.
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM refetchOnMount QUERY_CONFIG 통합** — ✅ 이미 적용됨.
- [x] **[2026-04-19 qr-review] 🟢 LOW appUrl getAppUrl() 유틸 추출** — ✅ 이미 적용됨.
- [x] **[2026-04-19 verify] 🟢 LOW verify-hardcoding — getTemplateBuffer() 6곳 문자열 리터럴** — ✅ 완료 2026-04-19. `getTemplateBuffer(entry.formNumber)` 교체.
- [x] **[2026-04-19 review-arch] 🟢 LOW exportSoftwareValidation site 스코프 post-filter** — ✅ 완료 2026-04-19. WHERE 절로 이동.
- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW LABEL_CONFIG.cell 관심사 혼합** — ✅ 완료 2026-04-20. `LABEL_CONFIG.scaling` 네임스페이스 신설.
- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW pt→mm 매직 넘버 0.353** — ✅ 완료 2026-04-20. `PT_TO_MM = 25.4 / 72` named 상수.
- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW i18n size.* 치수 하드코딩** — ✅ 완료 2026-04-20. 보간 토큰 교체.

### 2026-04-19 sw-validation-overhaul Phase 3-7

- [x] **[2026-04-19 sw-validation] 🔴 CRITICAL quality_approve 후 FE testSoftware.detail 캐시 미무효화** — ✅ 완료 2026-04-20. `commonInvalidateKeys`에 `queryKeys.testSoftware.detail(softwareId)` 포함.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH SoftwareValidationContent 6개 뮤테이션 useMutation 직접** — ✅ 완료 2026-04-20. 6개 `useOptimisticMutation` 전환 + `setQueryData` 완전 제거.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH EN i18n 13개 키 누락** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM SoftwareValidationsModule export 누락** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM calibration-plans review() assertIndependentApprover 미적용** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM SoftwareValidationListener 과잉 캐시 무효화** — ✅ 완료 2026-04-20. `delete(exact-key)` 교체.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM wf-14b E2E 미업데이트** — ✅ 완료 2026-04-20. Steps 12-17 추가.
- [x] **[2026-04-19 sw-validation] 🟢 LOW 재검증 배너 i18n 메시지 미구분** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🔴 CRITICAL Phase 4 — 다중 항목 DOCX 렌더링 누락** — ✅ 완료 2026-04-20. T6 렌더러 3행 루프 + CONTROL_MAX_ROWS=3.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH Phase 3 — 글로벌 /software-validations 라우트 + Sidebar 없음** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — FE exportability 유틸 없음** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — FRONTEND_ROUTES.SOFTWARE_VALIDATIONS 상수 없음** — ✅ 완료 2026-04-20. 5 빌더 추가.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — error.tsx (Error Boundary) 없음** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟢 LOW Phase 4 — RFC 5987 content-disposition 헬퍼 미추출** — ✅ 완료 2026-04-20. `common/http/content-disposition.util.ts` + 6개 컨트롤러 적용.
- [x] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — renderer spec 없음** — ✅ 완료 2026-04-20. 9 tests PASS.

### 2026-04-19 api-ssot-e2e-serial-export-batch

- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C2 — data-migration Execute FK 인덱스 드리프트** — ✅ 완료 2026-04-19. `chunkOffset + chunkIdx` O(1) 계산으로 교체.
- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C1 — data-migration 하드코딩 상태 리터럴 4곳** — ✅ 완료 2026-04-19. `CableStatusValues.ACTIVE` 등 values.ts SSOT 경유.
- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C3 — documents.controller IStorageProvider 직접 주입** — ✅ 완료 2026-04-19. `DocumentService.downloadWithPresign()` + `getThumbnailBuffer()` 추가, 컨트롤러 직접 의존 제거.
- [x] **[2026-04-18 arch-review] 🟠 HIGH H1 — data-migration 케이블 INSERT 캐시 무효화 누락** — ✅ 완료 2026-04-19. `CABLES_CACHE_PREFIX` 상수 신설.
- [x] **[2026-04-18 arch-review] 🟠 HIGH H3 — data-migration 이력 시트 중복 검사 fallthrough** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 arch-review] 🟡 MEDIUM M4 — data-migration Preview 파일 cleanup 누락** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 arch-rev2] 🟡 MEDIUM exportSoftwareValidation resolveUser N+1** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 arch-rev2] 🟢 LOW exportSoftwareRegistry teamId 스코프 미처리** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟠 HIGH verify-hardcoding — data-migration API unwrapResponseData 미사용** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-ssot — history-card 'equipment_photo' 문자열 직접** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-e2e — networkidle + waitForTimeout + auth.fixture** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-workflows — serial 모드 미설정 3파일** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟢 LOW verify-i18n — en selfInspection.form 키 3개 누락** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟢 LOW verify-design-tokens — transition 하드코딩 3건** — ✅ 완료 2026-04-19.
- [x] **[2026-04-19 ul-qp-18-forms] verify-seed-integrity SHOULD FAIL** — ✅ 완료 2026-04-19. truncate 리스트 4개 추가 + checkCount 2건 추가.
- [x] **[2026-04-19 ul-qp-18-forms] 🟢 LOW renderer 유닛 테스트** — ✅ 완료 2026-04-19. 3종 spec, 29 tests PASS.

## 2026-04-18 — 완결-완결 패스 / nc-permission-async-cache

- [x] **[2026-04-17 qr-phase3] 🟠 HIGH documents.nonConformanceId FK 도입** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 qr-phase3] 🟠 HIGH CSP + sops HANDOVER_TOKEN_SECRET** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 qr-phase3] 🟠 HIGH Playwright E2E 3종** — ✅ 완료 2026-04-18. 10/10 PASS.
- [x] **[2026-04-18 completion] 🟡 MEDIUM B2 NCDocumentsSection permission gate 재적용** — ✅ 완료 2026-04-18.
- [x] **[2026-04-18 completion] 🟡 MEDIUM B3 i18n `nonConformanceManagement` 이관** — ✅ 완료 2026-04-18.
- [x] **[2026-04-18 completion] 🟡 MEDIUM C1 이미지 썸네일 server-side 리사이징** — ✅ 완료 2026-04-18. `GET /documents/:id/thumbnail?size=sm|md|lg`.
- [x] **[2026-04-18 completion] 🟢 LOW D1 document.service.spec.ts 신규** — ✅ 완료 2026-04-18. 9 tests PASS.
- [x] **[2026-04-18 completion] 🟢 LOW E1 verify-* 스킬 실행** — ✅ 완료 2026-04-18.
- [x] **[2026-04-18 nc-permission-async-cache] 🟡 MEDIUM async onSuccessCallback await + NC 첨부 캐시 이벤트** — ✅ 완료 2026-04-18.
- [x] **[2026-04-18 nc-permission-async-cache] 🟡 MEDIUM CACHE_EVENTS vs NOTIFICATION_EVENTS 분리** — ✅ 완료 2026-04-18 (tech-debt-tracker Rev2 Phase 1).
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Per-row 체크박스 + BulkActionBar 추출** — ✅ 완료 2026-04-18 (Rev2 Phase 4-5).
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Intent URL 파라미터 확산** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Handover 토큰 → 범용 OneTimeToken 프리미티브** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM verify-qr-ssot + verify-handover-security 스킬 신설** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM PWA 완결 (아이콘 PNG + 서비스워커 + Install Prompt)** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 qr-phase3] 🟢 LOW Lighthouse/axe/bundle 배포 게이트** — ✅ 완료 2026-04-20.
- [x] **[2026-04-17 qr-phase3] 🟢 LOW pre-commit self-audit 자동화** — ✅ 완료 2026-04-18 (Phase 0).

### 2026-04-18 arch-ci-gate-zod-pilot

- [x] **[2026-04-17 arch-ci-gate-zod-pilot] CI SOPS 게이트 secret 미등록 시 무음 skip 방지** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 arch-ci-gate-zod-pilot] pre-push 에서 선택적 SOPS 검증 훅** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 arch-ci-gate-zod-pilot] `derivePurposeFromStatus` switch → CheckoutStatus enum SSOT** — ✅ 완료 2026-04-18.

### 2026-04-18 ul-qp-18-forms

- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-21 e2e (equipment-registry-export)** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-19b/wf-20b 확장** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM self-inspection UI DTO 필드 노출** — ✅ 완료 2026-04-18.

## 2026-04-17 — history-card-qp1802 / ul-qp-18-forms / verify 후속

- [x] **[2026-04-17 history-card-qp1802] A — renderer 매직 상수 SSOT 이관** — ✅ 완료 2026-04-17.
- [x] **[2026-04-17 history-card-qp1802] C — data service merge 헬퍼 유닛 테스트** — ✅ 완료 2026-04-17. 13개 테스트.
- [x] **[2026-04-17 history-card-qp1802] B — 승인 메타 SSOT 헬퍼 markApprovalMeta** — ✅ 완료 2026-04-17. 3개 승인 경로 통일.
- [x] **[2026-04-17 history-card-qp1802] 타협 2 — 이벤트 기반 캐시 전략 통합** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 history-card-qp1802] renderer 유닛 테스트** — ✅ 완료 2026-04-19. 13개 테스트.
- [x] **[2026-04-17 ul-qp-18-forms] review-W1 팀 JOIN managementNumber→teamId** — ✅ 완료 2026-04-17.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W3 scope 강제 비대칭** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W2 renderer db 주입 경계** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 ul-qp-18-forms] verify-ssot Step 3b 탐지 패턴 확장** — ✅ 완료 2026-04-17.

## 2026-04-16 — docker-infra-standards / e2e-infra-redesign

- [x] **[2026-04-15 docker-infra-standards] S1 — CI quality-gate bats/shellcheck/hadolint/dclint 스텝 추가** — ✅ 완료 2026-04-16.
- [x] **[2026-04-15 docker-infra-standards] Phase C — sops/age secret 관리 실제 도입** — ✅ 완료 2026-04-15. ADR-0005 Accepted 승격.
- [x] **[2026-04-15 docker-infra-standards] Phase G — 컨테이너 보안 하드닝** — ✅ 완료 2026-04-16.
- [x] **[2026-04-15 docker-infra-standards] Phase E — rustfs 커스텀 이미지** — ✅ 완료 2026-04-16.
- [x] **[2026-04-15 docker-infra-standards] Phase J — 공급망 보안** — ✅ 완료 2026-04-16. Syft SBOM + Cosign keyless.
- [x] **[2026-04-15 docker-infra-standards] Phase L — 네트워크 세그멘테이션** — ✅ 완료 2026-04-16. prod/lan 2-tier 구조.
- [x] **[2026-04-15 docker-infra-standards] Phase O — Renovate 도입 검토** — ✅ 완료 2026-04-16. Renovate 불필요 판정, dependabot.yml 경로 추가.
- [x] **[2026-04-16 e2e-infra-redesign] S2 — data-migration.service.spec.ts lint 에러** — ✅ 완료 2026-04-16.
- [x] **[2026-04-16 e2e-infra-redesign] S3 — beforeAll 축소** — ✅ 완료 2026-04-16.
- [x] **[2026-04-16 e2e-infra-redesign] S4 — afterAll 축소** — ✅ 완료 2026-04-16.

## 2026-04-21 — tech-debt-batch-0421 + ssot-validation-cleanup + isError fix

- [x] **[2026-04-20 calibration-plan-confirm] S7 — CPLAN_008 항목 주석 미비** — 2026-04-21 완료: ITEM_019~022 각 항목 위에 확인완료/bulk-confirm대상/actualCalibrationId 상태 주석 추가.
- [x] **[2026-04-17 history-card-qp1802] equipment_attachments seed 경로 형식 교정** — 2026-04-21 완료: 6건 절대경로 → 상대경로(`inspection_reports/`, `history_cards/`, `other/`) 교정. `SEED_PLACEHOLDER_ATTACHMENT_PATHS` export + `seed-test-new.ts` placeholder 자동 생성 (PDF/JPEG).
- [x] **[2026-04-18 arch-review] 🟡 MEDIUM M2 — data-migration 세션 상태 메모리 의존** — 2026-04-21 완료: `executionStartedAt` 타임스탬프 + `MIGRATION_EXECUTION_TIMEOUT_MS` (10분) stale 판정으로 서버 재시작 후 재시도 가능.
- [x] **[2026-04-18 arch-rev2] 🟢 LOW EquipmentRegistryDataService SELECT \*** — 2026-04-21 재검증: equipment-registry-data.service.ts:102-119에 이미 16컬럼 projection 적용됨. 코드 변경 불필요.
- [x] **[2026-04-19 sw-validation] 🟢 LOW software-validations.service.ts approve() 인라인 검사** — 2026-04-21 재검증: line 385에 이미 assertIndependentApprover 사용 중. 코드 변경 불필요.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — 10개 컴포넌트 미추출** — 2026-04-21 완료: `ValidationCreateDialog`, `ValidationActionsBar`, `ValidationFunctionsTable`, `ValidationControlTable` 추출. `SoftwareValidationContent.tsx` 1033→404줄.
- [x] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — 운영 가이드 문서 없음** — 2026-04-21 완료: `docs/references/software-validation-workflow.md` 생성.
- [x] **[2026-04-19 review-arch] 🟢 LOW form-templates-api GET 패턴 불일치** — 2026-04-21 완료: `docs/references/frontend-patterns.md`에 "API GET 응답 패턴 선택" 섹션 추가.
- [x] **[2026-04-19 verify-e2e] 🟢 LOW wf-35:103 토스트 .first() 직접 사용** — 2026-04-21 완료: `expectToastVisible(pageB, /데이터 충돌|.../)` 교체.
- [x] **[2026-04-20 skill-gap] 🟢 LOW calibration-plan-renderer.service.ts iCell.alignment 직접 조작** — 2026-04-21 완료: `calibration-plan.layout.ts`에 `ALIGNMENT.CENTER_MIDDLE` / `CENTER_MIDDLE_SHRINK` 토큰 추출.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — KPI aria-pressed** — 2026-04-21 재검증: button 분기(line 253)에 aria-pressed={isActive} 이미 적용. div 분기는 toggle 버튼이 아님 — 미적용 의도된 설계.
- [x] **[2026-04-21 cleanup-0421] DocumentTable.tsx 213줄** — 2026-04-21 완료: DocumentUploadButton + DocumentTableRow 분리 → DocumentTable.tsx 85줄.
- [x] **[2026-04-21 ssot-step19] ValidationActionsBar.tsx** — 2026-04-21 완료: `ValidationStatusValues.DRAFT/SUBMITTED/APPROVED/REJECTED` 교체 (PostToolUse hook 자동 수정).
- [x] **[2026-04-21 ssot-step19] ValidationDetailContent.tsx** — 2026-04-21 완료: `ValidationStatusValues.DRAFT` + `ValidationTypeValues.VENDOR/SELF` 교체.
- [x] **[2026-04-21 ssot-step19] ValidationEditDialog.tsx** — 2026-04-21 완료: `ValidationTypeValues.VENDOR` 교체.
- [x] **[2026-04-21 ssot-step19] ValidationCreateDialog.tsx** — 2026-04-21 완료: `ValidationTypeValues.VENDOR/SELF` + DocumentUploadButton.tsx 포함 동시 수정.
- [x] **[2026-04-21 verify-e2e] wf-35-cas-ui-recovery.spec.ts** — 2026-04-21 완료: `auth.fixture` import + type-only `BrowserContext, Page` 분리 (PostToolUse hook 자동 수정).
- [x] **[2026-04-21 frontend-state] SoftwareValidationContent.tsx isError 미처리** — 2026-04-21 완료: `isError` 추가, 에러 UI 분기(`loadError` i18n 키, `XCircle` 아이콘) 추가.
