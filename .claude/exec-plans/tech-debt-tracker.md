# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.

## Open

- [ ] **[2026-04-19 docx-append-section-sectpr] S1 — insertBeforeSectPr fallback의 replace('</w:body>', ...) 패턴** — `docx-template.util.ts:542`. sectPr 없는 템플릿에서만 동작하므로 실용적 위험 없으나, 장기적으로 `lastIndexOf('</w:body>')` 방식으로 교체 권장.

- [x] **[2026-04-15 docker-infra-standards] S1 — CI quality-gate에 bats/shellcheck/hadolint/dclint 스텝 추가** — ✅ 완료 2026-04-16. shellcheck + hadolint + dclint + bats + SOPS 복호화 검증 스텝 추가. **후속**: GitHub Settings에서 `SOPS_AGE_KEY` secret 등록 필요 (수동).
- [x] **[2026-04-15 docker-infra-standards] Phase C — sops/age secret 관리 실제 도입** — ✅ 완료 2026-04-15. ADR-0005 Accepted 승격, `.sops.yaml` + `infra/secrets/` + `secrets-*.sh` 3종 + `docs/operations/secret-backup.md` + `secret-rotation.md` + pre-commit gitleaks + compose `--env-file` 경로 정비. 완료 exec-plan: `.claude/plans/linear-discovering-comet.md`. **후속**: GitHub Actions `SOPS_AGE_KEY` CI 통합은 Phase D로 이연.
- [x] **[2026-04-15 docker-infra-standards] Phase G — 컨테이너 보안 하드닝** — ✅ 완료 2026-04-16. `x-security` anchor로 `cap_drop: ALL` + `no-new-privileges` + `read_only: true` + 서비스별 최소 `cap_add` + `tmpfs`. base/prod/lan 전체 적용, dev 환경 Healthy 확인.
- [x] **[2026-04-15 docker-infra-standards] Phase E — rustfs 커스텀 이미지** — ✅ 완료 2026-04-16. `infra/rustfs/Dockerfile` 신규, healthcheck 스크립트 COPY로 bind mount 제거, base image digest ARG 관리, `COPY --chmod=755` 활용. dev 환경 Healthy 확인.
- [x] **[2026-04-15 docker-infra-standards] Phase J — 공급망 보안** — ✅ 완료 2026-04-16. Syft SBOM (SPDX + CycloneDX) + Cosign keyless signing + SBOM attestation. 별도 `supply-chain` CI job으로 분리 (id-token: write job-scoped). digest 기반 이미지 참조. 로컬 검증 스크립트 `verify-supply-chain.sh` 추가.
- [ ] **[2026-04-15 docker-infra-standards] Phase K — 백업·DR** (pg_dump cron + 복원 리허설 CI + runbook). 프로덕션 사용자 발생 시점.
- [x] **[2026-04-15 docker-infra-standards] Phase L — 네트워크 세그멘테이션** — ✅ 완료 2026-04-16. prod/lan 2-tier 구조 (`data-network: internal` + `app-network`) 적용. prod `app-network` internal 해제 (backend SMTP 외부 발신 불가 결함 수정). dev는 호스트 기반 개발로 변경 불필요.
- [x] **[2026-04-15 docker-infra-standards] Phase O — Renovate 도입 검토** — ✅ 완료 2026-04-16. Renovate 불필요 판정 (Dependabot이 npm+Actions+Docker 전 커버). `infra/compose/` + `infra/rustfs/` Docker 이미지 추적 gap 발견 → dependabot.yml에 경로 추가.
- [x] **[2026-04-16 e2e-infra-redesign] S2 — data-migration.service.spec.ts lint 에러** — ✅ 완료 2026-04-16. 미사용 변수 4개 + MulterFile import 제거, lint 통과.
- [x] **[2026-04-16 e2e-infra-redesign] S3 — beforeAll 축소** — ✅ 완료 2026-04-16. `equipment-approval.e2e-spec.ts` 26줄→9줄 (try/catch→.catch() 패턴). `calibration-plans.e2e-spec.ts` 이미 14줄로 충족.
- [x] **[2026-04-16 e2e-infra-redesign] S4 — afterAll 축소** — ✅ 완료 2026-04-16. `equipment-history.e2e-spec.ts` 27줄→3줄. ResourceTracker에 history 타입 3종 추가 + API_ENDPOINTS SSOT 기반으로 전면 리팩토링. `toTestPath` 유틸리티로 globalPrefix 차이 중앙화.
- [ ] **[2026-04-16 tech-debt-s2s4] E2E globalPrefix 통합** — createTestApp에 setGlobalPrefix('api') 추가 + 22개 E2E 스펙 경로를 API_ENDPOINTS 기반으로 마이그레이션. 현재 toTestPath로 중앙화된 상태.

### 2026-04-17 harness: QR Phase 1-3 후속 정리 (qr-phase1-mobile-landing / qr-phase2-scanner-ncr-labels / qr-phase3-handover)

- [x] **[2026-04-17 qr-phase3] 🟠 HIGH documents.nonConformanceId FK 도입** — ✅ 완료 2026-04-18. schema + migration 0030 + DocumentService.findByNonConformanceId + NC 전용 엔드포인트(ATTACHMENTS) + Permission UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT 신설 + CreateNonConformanceForm photos + NCDocumentsSection 썸네일/삭제 UI + i18n 이관.
- [x] **[2026-04-17 qr-phase3] 🟠 HIGH CSP + sops HANDOVER_TOKEN_SECRET** — ✅ 완료 2026-04-18. CSP nonce 기반 재설계(proxy.ts SSOT, strict-dynamic), report-uri 엔드포인트(SecurityController), nginx pass-through, 기존 `camera=()` 카메라 차단 버그 + `limit_req off` 문법 버그도 병행 수정.
- [x] **[2026-04-17 qr-phase3] 🟠 HIGH Playwright E2E 3종** — ✅ 완료 2026-04-18 (재검증). 완결-완결 패스로 **10/10 PASS**. commit `172c5df2` — verify 500 수정(ZodSerializerInterceptor 제거) + Phase 3 API-level 재설계. Phase 2 벌크 PDF는 EquipmentList UI 사전 selection 필요(별도 UI 작업으로 이연).

### 2026-04-18 완결-완결 패스 — 남은 8개 항목

- [x] **[2026-04-18 completion] 🟡 MEDIUM B2 NCDocumentsSection permission gate 재적용** — ✅ 완료 2026-04-18 (commit 50eae20e). `useAuth().can(Permission.UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT)`로 조건부 렌더 이미 적용됨. 병렬 세션 revert 추정은 오판.
- [x] **[2026-04-18 completion] 🟡 MEDIUM B3 i18n `nonConformanceManagement` 실제 이관** — ✅ 완료 2026-04-18. equipment.json → non-conformances.json `management` 서브키로 이관. CreateNonConformanceForm + NonConformanceManagementClient 2곳 useTranslations('non-conformances') 전환, `nonConformanceManagement.*` → `management.*` 전치환. tsc exit 0.
- [x] **[2026-04-18 completion] 🟡 MEDIUM C1 이미지 썸네일 server-side 리사이징** — ✅ 완료 2026-04-18 (commit 82510ba5). `GET /documents/:id/thumbnail?size=sm|md|lg` (sharp WebP 200/400/800px), Cache-Control immutable. `API_ENDPOINTS.DOCUMENTS.THUMBNAIL` SSOT 추가, `fetchDocumentThumbnailBlobUrl` 신설, NCDocumentsSection `fetchDocumentObjectUrl` → `fetchDocumentThumbnailBlobUrl` 교체.
- [x] **[2026-04-18 completion] 🟢 LOW D1 document.service.spec.ts 신규** — ✅ 완료 2026-04-18. findByNonConformanceId(목록/빈결과/type필터) + createRevision(NotFoundException/트랜잭션/nonConformanceId FK 승계) + createDocument(orphan guard/NC 소유자/softwareValidation 분기) — 9 tests PASS.
- [x] **[2026-04-18 completion] 🟢 LOW E1 verify-* 스킬 실행** — ✅ 완료 2026-04-18. 발견 이슈: (1) en i18n `management`/`snapshot*` 키 누락 → 즉시 수정 완료. (2) FORM_CATALOG 하드코딩(form-template-export.service.ts 등) → LOW 기술부채로 이연. (3) EquipmentQRCode.tsx:56 queryKey 하드코딩 → 후속 이연. Scope enforcement, Permission SSOT 모두 PASS.
- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.
- [x] **[2026-04-18 nc-permission-async-cache] 🟡 MEDIUM async onSuccessCallback await + NC 첨부 캐시 이벤트** — ✅ 완료 2026-04-18. (1) `useOptimisticMutation.onSuccessCallback` 반환 타입 `void | Promise<void>` 확장 + `await` 적용. (2) `CreateNonConformanceForm` documents invalidate `await` 추가. (3) `NC_ATTACHMENT_UPLOADED/DELETED` 이벤트 → schemas SSOT + registry 등록 + controller emitAsync. 테스트 2건 추가.
- [x] **[2026-04-18 nc-permission-async-cache] 🟡 MEDIUM CACHE_EVENTS vs NOTIFICATION_EVENTS 분리** — ✅ 완료 2026-04-18 (tech-debt-tracker Rev2 Phase 1). `common/cache/cache-events.ts` 신설 — `CACHE_EVENTS` 상수 + `NCAttachmentCachePayload` 타입. `NOTIFICATION_EVENTS`/`NOTIFICATION_TYPE_VALUES`에서 attachment 2건 제거 + `schemas` enum에서 제거. `invalidateNcDerivedCaches` 헬퍼 신설. Non-conformances controller→service 이관 (AD-3). ESLint `no-restricted-syntax` 룰로 컨트롤러 emitAsync 빌드 타임 차단 (AD-8).
- [ ] **[2026-04-18 completion] 🟢 LOW CSP report 영속화** — SecurityController logger.warn 외에 DB 또는 Loki 연결 + Grafana 대시보드.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Per-row 체크박스 + BulkActionBar 추출** — ✅ 완료 2026-04-18 (tech-debt-tracker Rev2 Phase 4-5). `useRowSelection` SSOT 훅 (snapshot LRU, isSelectable, resetOn, isAllPageSelected, isIndeterminate). Generic `BulkActionBar` + `RowSelectCell` 컴포넌트 신설. `EquipmentTable`/`EquipmentCardGrid` 양쪽 연결, `EquipmentListContent`에서 단일 인스턴스 공유.
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM Intent URL 파라미터 확산** — QUERY_INTENTS SSOT는 수립됨, 교정계획/장비요청/자체점검/중간점검/체크아웃 create 페이지에 딥링크 패턴 적용.
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM Handover 토큰 → 범용 OneTimeToken 프리미티브** — common/one-time-token 모듈 추출, 승인 위임/외부 제출 링크 등 재사용 대비.
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM verify-qr-ssot + verify-handover-security 스킬 신설** — 신규 QR/handover 코드의 하드코딩/보안 안티패턴 자동 감지.
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM PWA 완결 (아이콘 PNG + 서비스워커 + Install Prompt)** — public/icons/*.png 실파일 생성, next-pwa/Serwist 도입, offline fallback page.
- [ ] **[2026-04-17 qr-phase3] 🟢 LOW Lighthouse/axe/bundle 배포 게이트** — CI workflow 3종 + performance-budgets.md SSOT. PWA 완결 이후 정확 측정.
- [x] **[2026-04-17 qr-phase3] 🟢 LOW pre-commit self-audit 자동화** — ✅ 완료 2026-04-18 (Phase 0). `scripts/self-audit.mjs` 신규 — 7대 체크(하드코딩 URL/eslint-disable/any타입/SSOT우회/role리터럴/setQueryData/a11y). `.husky/pre-commit` + `main.yml` quality-gate 양방향 게이트. `--all` exit 0 (1702파일), `--staged` 위반 차단 확인.
- [ ] **[2026-04-17 qr-phase3] ❓ 사용자 결정 — 커밋 7a6255d1 메시지 귀속 복구** — status quo(A) vs git notes(B) vs interactive rebase(C). 기본값 A, 답변 대기.

### 2026-04-17 harness: history-card-qp1802 후속 정리

- [x] **[2026-04-17 history-card-qp1802] A — renderer 매직 상수 SSOT 이관** — ✅ 완료 2026-04-17. `DRAWING_IDS` 상수를 `history-card.layout.ts`에 신규. rId/docPrId/fileBaseName을 renderer에서 layout 참조로 교체.
- [x] **[2026-04-17 history-card-qp1802] C — data service merge 헬퍼 유닛 테스트** — ✅ 완료 2026-04-17. `mergeAccessoriesAndFunctions` / `mergeManualAndSoftware` 13개 테스트 (accessories+desc / S/W 리스트 / firmware / 공백 처리 / 다중 S/W 순서).
- [x] **[2026-04-17 history-card-qp1802] B — 승인 메타 SSOT 헬퍼 markApprovalMeta** — ✅ 완료 2026-04-17. `EquipmentService.markApprovalMeta(id, approverId, tx?)` public 메서드 신설. 3개 승인 경로 통일: ① `approveRequest` (기술책임자 승인, 트랜잭션 내) ② `controller` lab_manager 자체 승인 ③ `controller` admin 직접 update. 이력카드 "확인" 서명란 정확성 보장.
- [ ] **[2026-04-17 history-card-qp1802] 타협 2 — 이벤트 기반 캐시 전략 통합** — `repair-history.service` 가 `invalidateAfterEquipmentUpdate` 를 직접 호출 (Phase 6). 73차 결정(`emitAsync` + `CacheEventListener` 경로)과 일관성 맞추려면 `NOTIFICATION_EVENTS.REPAIR_*` 이벤트 신설 필요. 현재는 기능상 동일 동작이지만 장기적으로 일관된 cache-event.registry 경로로 마이그레이션 권장.
- [ ] **[2026-04-17 history-card-qp1802] multi-form 3-way 분리 패턴 확산** — `form-template-export.service.ts` 의 QP-18-03/05/06/07/09/10 양식도 UL-QP-18-02 와 동일한 Data/Renderer/XmlHelper + layout.ts SSOT 패턴으로 마이그레이션. 현재는 단일 클래스에 모든 양식 로직 혼재. 새 양식 추가 시 이 패턴 적용하면 점진적으로 개선 가능.
- [ ] **[2026-04-17 history-card-qp1802] 프론트엔드 E2E 검증** — `apps/frontend/tests/e2e/workflows/wf-history-card-export.spec.ts` 통합 이력 §5 섹션 유형 라벨 검증 추가. Playwright 기반 실 브라우저 다운로드 후 docx 열어 텍스트 확인.
- [ ] **[2026-04-17 history-card-qp1802] renderer 유닛 테스트** — `history-card-renderer.service.ts` 의 각 주입 메서드(injectBasicInfo / applyCheckboxes / fillHistorySections 등) 에 대한 in-memory docx 픽스처 기반 유닛 테스트. 현재는 e2e 로만 간접 검증.
- [ ] **[2026-04-17 history-card-qp1802] 시스템 관리자 승인 경로 접근 제어 확인** — `equipment.controller.ts:472` `isAdmin + approvalStatus=approved` 분기가 실제로 운영 절차에서 허용된 경로인지 절차서 교차 확인 필요 (권한 매트릭스와 UL-QP-18 §5.2 비교).
- [ ] **[2026-04-17 history-card-qp1802] equipment_attachments seed 경로 형식 교정** — 현재 `filePath: '/uploads/2025/01/...'` (절대경로) 6건이 `LocalStorageProvider.assertWithinDir` 차단 대상. sync → `documents` 후에도 동일 경로 승계되어 사용자가 AttachmentsTab에서 다운로드 시 400 발생. **수정 방향**: seed 경로를 uploadDir 상대경로(`inspection_reports/xxx.pdf` 형식)로 교정 + 필요 시 placeholder PDF 자동 생성 (equipment_photos 패턴 적용).

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] 기존 class-DTO 점진 마이그레이션 14개** — `verify-zod` Step 9 드라이런 기준 type-only DTO 14개가 여전히 `z.infer` 방식. **해당 모듈 작업 시 기회가 될 때** `createZodDto` 전환 (리팩터를 위한 리팩터 금지). 트리거 3건 (`any`/Swagger-TS drift/Zod+class 중복) 중 하나라도 해당 시 착수. backend-patterns.md "기존 class-DTO 전환 조건" 참조.
- [x] **[2026-04-17 arch-ci-gate-zod-pilot] CI SOPS 게이트 secret 미등록 시 무음 skip 방지** — ✅ 완료 2026-04-18. `::warning::` GitHub Actions 어노테이션 step 추가 (`if: SOPS_AGE_KEY == ''`). 등록 안내 메시지 포함. CI 통과는 유지하며 UI warning 뱃지로 가시화.
- [x] **[2026-04-17 arch-ci-gate-zod-pilot] pre-push 에서 선택적 SOPS 검증 훅** — ✅ 완료 2026-04-18. `$SOPS_AGE_KEY` 존재 + `sops` 바이너리 있을 때 lan/prod 복호화 + `verify:env-sync --file` 자동 실행. mktemp + rm -f로 tmpfile 정리. 미설정 시 조용히 스킵.
- [x] **[2026-04-17 arch-ci-gate-zod-pilot] `derivePurposeFromStatus` switch 를 CheckoutStatus enum SSOT 로 연동** — ✅ 완료 2026-04-18. `Record<CheckoutStatus, HandoverTokenPurpose | null>` static 맵으로 교체. 14개 enum 키 전체 명시. tsc exit 0.

### 2026-04-17 harness: ul-qp-18 양식 3종 교체 + 3-way 분리

- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-21 e2e (equipment-registry-export)** — ✅ 완료 2026-04-18. 신규 spec 4 Step: 200+xlsx, SSOT 라벨 Set 검증(D/O/P열), showRetired 상대비교, 401 인증. ExcelJS wb.xlsx.load + eachRow 패턴. disposed/pending_disposal isActive 차이로 절대→상대 비교 수정.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-19b/wf-20b 확장** — ✅ 완료 2026-04-18. wf-19b Step 4: PizZip DOCX XML '합격'/'1년'/'교정기기' 검증. wf-20b: snapshot 필드(classification/calibrationValidityPeriod) create에 추가 + Step 3b: DOCX XML '교정기기'/'1년'/'이상 없음' 검증.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM self-inspection UI DTO 필드 노출** — ✅ 완료 2026-04-18. `SelfInspectionFormDialog`에 classification(교정기기/비교정기기 Select) + calibrationValidityPeriod(text Input) 추가. create 모드: `equipment.calibrationRequired`→EquipmentClassification derive. edit 모드: `initialData.classification/calibrationValidityPeriod` 복원. SSOT import, 7개 i18n 키, tsc exit 0.
  - 🟢 후속: `useEffect([open, initialData])` deps에 `equipment` 미포함 — 현재 패턴상 무해하나 장비 실시간 편집 흐름 추가 시 stale derive 가능. 해당 시점에 `equipment?.calibrationRequired`를 deps에 추가.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW renderer 유닛 테스트** — `equipment-registry-renderer.service.spec.ts`, `intermediate-inspection-renderer.service.spec.ts`, `self-inspection-renderer.service.spec.ts` — SSOT 라벨 경유, 빈 행 처리, 대체 시트명 fallback 검증.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW 양식 교체 운영 반영** — 운영 DB에는 `POST /api/form-templates/replace` 수동 호출 + `change_summary` 필수. 배포 runbook 작성 필요 (docs/operations/).

### 2026-04-17 verify/review 후속 (ul-qp-18-forms 세션 종료 후)

- [x] **[2026-04-17 ul-qp-18-forms] review-W1 팀 JOIN managementNumber→teamId** — ✅ 완료 2026-04-17 (커밋 5b50f4dc). 자체점검과 동일 패턴으로 통일, 29 tests PASS.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W3 scope 강제 비대칭** — ✅ 완료 2026-04-18. `intermediate-inspection-export-data.service.ts` post-filter 제거 → `.where(and(eq(id,...), filter.site ? eq(equipment.site,...) : undefined, filter.teamId ? eq(equipment.teamId,...) : undefined))` WHERE 방식으로 통일. 자체점검과 대칭.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W2 renderer db 주입 경계** — ✅ 완료 2026-04-18 (commit af79dad4). `InspectionResultSectionPreFetched` 인터페이스 신설, sectionRows 선조회를 Promise.all에 병렬 통합. 두 Renderer에서 AppDatabase inject 완전 제거. tsc exit 0, 795 tests PASS.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW review-W4 EXPORT_QUERY_LIMITS.FULL_EXPORT 스트리밍** — 현재 1,000건 제한 + `ExcelJS.writeBuffer()` 전체 메모리 적재. N이 5,000+ 증가 시 메모리 부담. `worksheet.addRow` + stream to response로 교체 검토 (UL-QP-18-01/08, UL-QP-19-01 모두 해당).
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW verify-seed-integrity SHOULD FAIL** — `seed-test-new.ts` Phase 0 truncate 리스트에 `equipment_self_inspections`/`self_inspection_items`/`intermediate_inspections`/`intermediate_inspection_items` 4개 테이블 미등재. `TRUNCATE equipment CASCADE`가 FK 전파로 실제 idempotency 유지하나, 명시적 문서화 누락. + `verification.ts`에 inspection count 검증 부재(seed drift silent 위험). 해결: truncate 리스트 FK 역순 추가 + checkCount 4건 추가.
- [x] **[2026-04-17 ul-qp-18-forms] verify-ssot Step 3b 탐지 패턴 확장** — ✅ 완료 2026-04-17. `QP18_.*_LABELS`/`EQUIPMENT_AVAILABILITY_LABELS`/`INTERMEDIATE_CHECK_YESNO_LABELS`/`INSPECTION_JUDGMENT_LABELS`/`SELF_INSPECTION_RESULT_LABELS` 로컬 재정의 탐지 grep 추가. 현재 코드베이스 dry-run 0건 PASS.

### 2026-04-18 verify-implementation + review-architecture (Phase 1-2 완료 후 전체 스캔)

#### review-architecture Critical

- [ ] **[2026-04-18 arch-review] 🔴 CRITICAL C2 — data-migration Execute FK 인덱스 드리프트** — `data-migration.service.ts:436-439` `validRows.indexOf(row)` 객체 동일성 비교로 fkResolutions Map 조회. testSoftware는 `idx` 직접 사용(올바름)이나 equipment 시트만 `indexOf` 방식 불일치 → managerId/deputyManagerId 누락 위험. **수정**: `validRows.map((row, idx) => fkResolutions?.get(idx))` 패턴으로 통일.
- [ ] **[2026-04-18 arch-review] 🔴 CRITICAL C1 — data-migration 하드코딩 상태 리터럴 4곳** — `data-migration.service.ts:1079,1101,1127,1155` `buildCableValues`(`status:'active'`), `buildTestSoftwareValues`(`availability:'available'`), `buildCalibrationFactorValues`(`approvalStatus:'approved'`), `buildNonConformanceValues`(`status:correctionDate?'closed':'open'`). `CableStatusValues.ACTIVE` / `SoftwareAvailabilityEnum` / `CalibrationFactorApprovalStatusValues.APPROVED` / `NonConformanceStatusValues.OPEN/CLOSED`로 교체.
- [ ] **[2026-04-18 arch-review] 🔴 CRITICAL C3 — documents.controller IStorageProvider 직접 주입** — `documents.controller.ts:50,269-277,337-341` 컨트롤러가 `IStorageProvider`를 직접 inject해 thumbnail/presignedUrl 호출. Controller → Service → Storage 레이어 위반. `DocumentService.downloadWithPresign()` / `getThumbnailBuffer()` 메서드 추가 후 컨트롤러에서 스토리지 직접 접근 제거.

#### review-architecture High

- [ ] **[2026-04-18 arch-review] 🟠 HIGH H1 — data-migration 케이블 INSERT 후 캐시 무효화 누락** — Execute 성공 후 케이블 시트 INSERT 시 캐시 `deleteByPrefix` 없음. 타 시트(교정/수리/사고/시험SW/교정인자/NC)는 모두 있음. `CACHE_KEY_PREFIXES.CABLES` 확인 후 추가.
- [ ] **[2026-04-18 arch-review] 🟠 HIGH H3 — data-migration 이력 시트 중복 검사 fallthrough** — `markPreviewHistoryDuplicates` `else` 브랜치에서 CABLE/TEST_SOFTWARE/CALIBRATION_FACTOR/NON_CONFORMANCE가 `filterIncidentDuplicates`로 fallthrough → 잘못된 중복 검사 적용. 타입별 분기 추가 또는 미지원 시트 `{ toInsert: rows, duplicates: [] }` 반환.

#### review-architecture Medium (Phase 3 스코프 포함)

- [ ] **[2026-04-18 arch-review] 🟡 MEDIUM M4 — data-migration Preview 파일 cleanup 누락** — `previewMultiSheet` `saveFile` 후 파싱 실패 시 임시 파일 잔존. Execute 완료 시에만 `deleteFile`. `try/finally`로 Preview 실패 시 정리 추가.
- [ ] **[2026-04-18 arch-review] 🟡 MEDIUM M2 — data-migration 세션 상태 메모리 의존** — `EXECUTING` 상태가 메모리 캐시에만 저장, 서버 재시작 시 이중 실행 가능. 마이그레이션은 수동 일회성이라 즉각 위험은 낮으나 Redis TTL 또는 DB migration_log 기록 권장.

#### 2026-04-18 review-architecture (Rev2 이후 스캔) 신규 이슈

- [ ] **[2026-04-18 arch-rev2] 🟡 MEDIUM exportSoftwareValidation resolveUser N+1** — `form-template-export.service.ts:629-644` `Promise.all([resolveUser(receiver), resolveUser(performer), resolveUser(techApprover)])` 병렬화는 됐으나 동일 userId 중복 쿼리 가능. 동일 파일 내 `exportRentalImportAsCheckoutForm`은 순차 직렬 조회. **수정**: 사용자 ID 배열 `inArray()` 배치 조회 + Map 분배 패턴으로 통일.
- [ ] **[2026-04-18 arch-rev2] 🟢 LOW exportSoftwareRegistry teamId 스코프 미처리** — `form-template-export.service.ts:452-509` `testSoftware`는 teamId 없는 site 단위 리소스이나, `filter.teamId` 존재 시 `ForbiddenException` 미발생(exportSoftwareValidation과 비대칭). site 단위 리소스임을 주석으로 명시하거나 Forbidden 처리 통일.
- [ ] **[2026-04-18 arch-rev2] 🟢 LOW EquipmentRegistryDataService SELECT \*** — `equipment-registry-data.service.ts:79-84` `db.select().from(equipment)` 전체 컬럼 조회. 렌더러가 실제 사용하는 컬럼은 15개 이하. 장비 5,000건+ 시 불필요한 데이터 전송. projection 축소 권장.

#### verify-implementation 신규 이슈

- [ ] **[2026-04-18 verify] 🟠 HIGH verify-hardcoding — data-migration API unwrapResponseData 미사용** — `form-templates-api.ts:64~100`, `self-inspection-api.ts:108`, `data-migration-api.ts:73,91` `response.data?.data ?? response.data` 인라인 래핑 해제. `unwrapResponseData` 유틸 미사용.
- [ ] **[2026-04-18 verify] 🟡 MEDIUM verify-ssot — history-card 'equipment_photo' 문자열 직접** — `history-card-data.service.ts:202` `eq(documents.documentType, 'equipment_photo')`. `DocumentTypeValues.EQUIPMENT_PHOTO` 상수 경유로 교체.
- [ ] **[2026-04-18 verify] 🟡 MEDIUM verify-e2e — networkidle + waitForTimeout + Tailwind selector** — `phase2-scanner-ncr.spec.ts:79` networkidle. `seed-view-form.spec.ts:18` waitForTimeout(3000). `validation-logic.spec.ts:212` `.bg-yellow-50`, `data-migration/full-flow.spec.ts:216` `.bg-green-50` Tailwind utility selector.
- [ ] **[2026-04-18 verify] 🟡 MEDIUM verify-workflows — serial 모드 미설정 3파일** — `wf-25-alert-to-checkout.spec.ts`, `wf-35-cas-ui-recovery.spec.ts`, `wf-export-ui-download.spec.ts` workflows/ 디렉토리 규칙 위반.
- [ ] **[2026-04-18 verify] 🟢 LOW verify-i18n — en selfInspection.form 키 3개 누락** — `equipment.json` en 파일에 `selfInspection.form.calibrationValidityPeriodPlaceholder` / `selectClassification` / `snapshotSectionLabel` 누락. ko에만 존재.
- [ ] **[2026-04-18 verify] 🟢 LOW verify-design-tokens — transition 하드코딩 3건** — `SoftwareTab.tsx:324,337` `transition-colors`, `NCDocumentsSection.tsx:172` `transition-opacity`. `TRANSITION_PRESETS.*` 상수로 교체.

### 2026-04-19 qr-tsc-gc-cleanup review-architecture 신규 이슈

- [x] **[2026-04-19 qr-review] 🟡 MEDIUM sql 템플릿 → eq() 전환 (enum 필터)** — ✅ 2026-04-19 수정 완료. form-template-export.service.ts 5건 eq() 교체 (fix(reports) 커밋).
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM HandoverQRDisplay appUrl 빈 문자열 가드** — ✅ 이미 적용됨 (HandoverQRDisplay.tsx:55 `if (!appUrl)` + getAppUrl() 사용).
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM refetchOnMount QUERY_CONFIG 통합** — ✅ 이미 적용됨 (QUERY_CONFIG.EQUIPMENT_LIST_FRESH 프리셋으로 통합).
- [x] **[2026-04-19 qr-review] 🟢 LOW appUrl getAppUrl() 유틸 추출** — ✅ 이미 적용됨 (lib/qr/app-url.ts 유틸, 3곳 모두 import 사용).

## Resolved

(이번 세션 완료 항목은 완료된 exec-plan 문서로 이관됨.)
