# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.

## Open

- [ ] **[2026-04-20 nc-workflow-atomicity] S2 — close() 복원 구조화 로그 없음** — `non-conformances.service.ts:close()`. previousEquipmentStatus / restoreStatus / fallback 여부를 `logger.debug`로 남기는 구조화 로그 추가 권장.

- [x] **[2026-04-20 nc-workflow-atomicity] S1 — NC close() previousEquipmentStatus 복원 단위 테스트 없음** — ✅ 완료 2026-04-20. `describe('previousEquipmentStatus restore logic')` 3개 시나리오 추가: spare 복원, null→available 폴백, disposed(excluded)→available 폴백.

- [x] **[2026-04-19 test-software-detail-refactor] S1 — optimisticUpdate `if (!old) return old!` non-null assertion** — ✅ 완료 2026-04-19. `throw new Error('optimisticUpdate: cache miss on detail page')`로 교체. TypeScript 우회 제거, 캐시 미스 시 onError 경로로 명시적 실패.

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
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Intent URL 파라미터 확산** — ✅ 완료 2026-04-19. `FRONTEND_ROUTES`에 딥링크 빌더 5종 추가(CHECKOUTS.CREATE_FOR_EQUIPMENT / CALIBRATION_PLANS.CREATE_FOR_EQUIPMENT / EQUIPMENT.SELF_INSPECTION_CREATE / INTERMEDIATE_INSPECTION_CREATE / EQUIPMENT_REQUEST_CREATE). EquipmentActionSheet `request_checkout` 하드코딩 → 빌더 교체. CHECKOUT_QUERY_PARAMS 불필요 import 제거.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Handover 토큰 → 범용 OneTimeToken 프리미티브** — ✅ 완료 2026-04-19. `common/one-time-token/` 신설: `OneTimeTokenService<T>` (JWT HS256 + Redis jti nonce, `@Injectable()` 없는 평범한 클래스). `HandoverTokenService`가 얇은 래퍼로 리팩토링 — 공개 API 불변, 6 tests PASS.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM verify-qr-ssot + verify-handover-security 스킬 신설** — ✅ 완료 2026-04-19. verify-qr-ssot 7단계(URL 빌더/경로 상수/설정 매직넘버/액션/appUrl/딥링크 빌더/서버 판정 중복). verify-handover-security 7단계(시크릿 분리/OneTimeToken위임/jti 원자성/TTL SSOT/권한 가드/토큰 영속화/dev 엔드포인트). 드라이런 전 항목 PASS.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM PWA 완결 (아이콘 PNG + 서비스워커 + Install Prompt)** — ✅ 완료 2026-04-19. `@serwist/next@9.5.7` 도입, `app/sw.ts`(precache+defaultCache+/~offline fallback), `app/~offline/page.tsx`(정적 fallback), `hooks/usePWAInstall.ts`(BeforeInstallPromptEvent+standalone 감지), `components/pwa/PWAInstallBanner.tsx`(고정 하단 배너, layout.tsx 등록), `public/icons/manifest-{192,512}.png`(SVG→PNG). tsc 0 errors.
- [ ] **[2026-04-17 qr-phase3] 🟢 LOW Lighthouse/axe/bundle 배포 게이트** — CI workflow 3종 + performance-budgets.md SSOT. PWA 완결 이후 정확 측정.
- [x] **[2026-04-17 qr-phase3] 🟢 LOW pre-commit self-audit 자동화** — ✅ 완료 2026-04-18 (Phase 0). `scripts/self-audit.mjs` 신규 — 7대 체크(하드코딩 URL/eslint-disable/any타입/SSOT우회/role리터럴/setQueryData/a11y). `.husky/pre-commit` + `main.yml` quality-gate 양방향 게이트. `--all` exit 0 (1702파일), `--staged` 위반 차단 확인.
- [ ] **[2026-04-17 qr-phase3] ❓ 사용자 결정 — 커밋 7a6255d1 메시지 귀속 복구** — status quo(A) vs git notes(B) vs interactive rebase(C). 기본값 A, 답변 대기.

### 2026-04-17 harness: history-card-qp1802 후속 정리

- [x] **[2026-04-17 history-card-qp1802] A — renderer 매직 상수 SSOT 이관** — ✅ 완료 2026-04-17. `DRAWING_IDS` 상수를 `history-card.layout.ts`에 신규. rId/docPrId/fileBaseName을 renderer에서 layout 참조로 교체.
- [x] **[2026-04-17 history-card-qp1802] C — data service merge 헬퍼 유닛 테스트** — ✅ 완료 2026-04-17. `mergeAccessoriesAndFunctions` / `mergeManualAndSoftware` 13개 테스트 (accessories+desc / S/W 리스트 / firmware / 공백 처리 / 다중 S/W 순서).
- [x] **[2026-04-17 history-card-qp1802] B — 승인 메타 SSOT 헬퍼 markApprovalMeta** — ✅ 완료 2026-04-17. `EquipmentService.markApprovalMeta(id, approverId, tx?)` public 메서드 신설. 3개 승인 경로 통일: ① `approveRequest` (기술책임자 승인, 트랜잭션 내) ② `controller` lab_manager 자체 승인 ③ `controller` admin 직접 update. 이력카드 "확인" 서명란 정확성 보장.
- [x] **[2026-04-17 history-card-qp1802] 타협 2 — 이벤트 기반 캐시 전략 통합** — ✅ 완료 2026-04-19. `CACHE_EVENTS.REPAIR_HISTORY_CREATED/UPDATED/DELETED` 3종 추가 + `RepairHistoryCachePayload` 타입 신설. `cache-event.registry.ts`에 3개 규칙 등록. `repair-history.service.ts` 직접 `CacheInvalidationHelper` → `EventEmitter2.emitAsync` 전환 (`satisfies` 연산자로 컴파일 타임 타입 체크).
- [ ] **[2026-04-17 history-card-qp1802] multi-form 3-way 분리 패턴 확산** — `form-template-export.service.ts` 의 QP-18-03/05/06/07/09/10 양식도 UL-QP-18-02 와 동일한 Data/Renderer/XmlHelper + layout.ts SSOT 패턴으로 마이그레이션. 현재는 단일 클래스에 모든 양식 로직 혼재. 새 양식 추가 시 이 패턴 적용하면 점진적으로 개선 가능.
- [ ] **[2026-04-17 history-card-qp1802] 프론트엔드 E2E 검증** — `apps/frontend/tests/e2e/workflows/wf-history-card-export.spec.ts` 통합 이력 §5 섹션 유형 라벨 검증 추가. Playwright 기반 실 브라우저 다운로드 후 docx 열어 텍스트 확인.
- [x] **[2026-04-17 history-card-qp1802] renderer 유닛 테스트** — ✅ 완료 2026-04-19. `history-card-renderer.service.spec.ts` 신규 — PizZip in-memory DOCX 픽스처(`makeLabeledRow`/`makeSection` 헬퍼). 13개 테스트: smoke/storage미호출/APPROVAL_DATE치환/SPEC_MATCH체크박스2종/CALIBRATION_REQUIRED2종/manualLocation/locationHistory/calibrations/timeline/빈배열/equipmentName. `교  정  주  기` 행 3-cell 픽스처로 CALIBRATION_CYCLE+DEPUTY_MANAGER 공유 행 정확 재현.
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
- [x] **[2026-04-17 ul-qp-18-forms] 🟢 LOW renderer 유닛 테스트** — ✅ 완료 2026-04-19 (api-ssot-e2e-serial-export-batch). 3종 spec 신규 (ExcelJS in-memory / PizZip 최소 DOCX 픽스처). SSOT 라벨·빈배열·대체 시트명 fallback 검증. 29 tests PASS.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW 양식 교체 운영 반영** — 운영 DB에는 `POST /api/form-templates/replace` 수동 호출 + `change_summary` 필수. 배포 runbook 작성 필요 (docs/operations/).

### 2026-04-17 verify/review 후속 (ul-qp-18-forms 세션 종료 후)

- [x] **[2026-04-17 ul-qp-18-forms] review-W1 팀 JOIN managementNumber→teamId** — ✅ 완료 2026-04-17 (커밋 5b50f4dc). 자체점검과 동일 패턴으로 통일, 29 tests PASS.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W3 scope 강제 비대칭** — ✅ 완료 2026-04-18. `intermediate-inspection-export-data.service.ts` post-filter 제거 → `.where(and(eq(id,...), filter.site ? eq(equipment.site,...) : undefined, filter.teamId ? eq(equipment.teamId,...) : undefined))` WHERE 방식으로 통일. 자체점검과 대칭.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W2 renderer db 주입 경계** — ✅ 완료 2026-04-18 (commit af79dad4). `InspectionResultSectionPreFetched` 인터페이스 신설, sectionRows 선조회를 Promise.all에 병렬 통합. 두 Renderer에서 AppDatabase inject 완전 제거. tsc exit 0, 795 tests PASS.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW review-W4 EXPORT_QUERY_LIMITS.FULL_EXPORT 스트리밍** — 현재 1,000건 제한 + `ExcelJS.writeBuffer()` 전체 메모리 적재. N이 5,000+ 증가 시 메모리 부담. `worksheet.addRow` + stream to response로 교체 검토 (UL-QP-18-01/08, UL-QP-19-01 모두 해당).
- [x] **[2026-04-17 ul-qp-18-forms] 🟢 LOW verify-seed-integrity SHOULD FAIL** — ✅ 완료 2026-04-19. `seed-test-new.ts` truncate 리스트에 FK 역순으로 4개 추가(`self_inspection_items` → `equipment_self_inspections` → `intermediate_inspection_items` → `intermediate_inspections`). `verification.ts`에 `SELF_INSPECTIONS_SEED_DATA`/`SELF_INSPECTION_ITEMS_SEED_DATA` checkCount 2건 추가(SSOT 도출).
- [x] **[2026-04-17 ul-qp-18-forms] verify-ssot Step 3b 탐지 패턴 확장** — ✅ 완료 2026-04-17. `QP18_.*_LABELS`/`EQUIPMENT_AVAILABILITY_LABELS`/`INTERMEDIATE_CHECK_YESNO_LABELS`/`INSPECTION_JUDGMENT_LABELS`/`SELF_INSPECTION_RESULT_LABELS` 로컬 재정의 탐지 grep 추가. 현재 코드베이스 dry-run 0건 PASS.

### 2026-04-18 verify-implementation + review-architecture (Phase 1-2 완료 후 전체 스캔)

#### review-architecture Critical

- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C2 — data-migration Execute FK 인덱스 드리프트** — ✅ 완료 2026-04-19. `validRows.indexOf(row)` O(n) 객체 동일성 비교 제거. `chunkOffset + chunkIdx` O(1) 명시적 인덱스 계산으로 교체 (line 472). equipment/testSoftware 시트 패턴 통일.
- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C1 — data-migration 하드코딩 상태 리터럴 4곳** — ✅ 완료 2026-04-19. `CableStatusEnum.enum.active` → `CableStatusValues.ACTIVE`, `SoftwareAvailabilityEnum.enum.available` → `SoftwareAvailabilityValues.AVAILABLE`, `NonConformanceStatusEnum.enum.closed/open` → `NonConformanceStatusValues.CLOSED/OPEN`. `CalibrationFactorApprovalStatusValues.APPROVED`는 이미 SSOT 경유. Zod 검증 레이어 접근자 대신 `values.ts` 전용 상수로 통일.
- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C3 — documents.controller IStorageProvider 직접 주입** — ✅ 완료 2026-04-19 (tech-debt-batch-0419). `DocumentService.downloadWithPresign()` + `getThumbnailBuffer()` 메서드 추가, `DownloadInfo` union 타입 신설. 컨트롤러에서 `IStorageProvider`, `FileUploadService`, `sharp` 직접 의존 완전 제거. `mock-providers.ts` + `documents.controller.spec.ts` + `document.service.spec.ts` 테스트 갱신. 808 tests PASS.

#### review-architecture High

- [x] **[2026-04-18 arch-review] 🟠 HIGH H1 — data-migration 케이블 INSERT 후 캐시 무효화 누락** — ✅ SSOT 완결 2026-04-19 (verify-sql-safety/review-arch warning 해소 커밋). `CABLES_CACHE_PREFIX` 상수를 `cache-key-prefixes.ts`에 신설 (`calibration:cables:`). `cables.service.ts` + `data-migration.service.ts` 양쪽 참조 통일. 인라인 복합 조합 패턴 verify-hardcoding Step 8 탐지 추가.
- [x] **[2026-04-18 arch-review] 🟠 HIGH H3 — data-migration 이력 시트 중복 검사 fallthrough** — ✅ 완료 2026-04-19 (tech-debt-batch-0419). INCIDENT 전용 명시적 `else if` 분기 추가, CABLE/TEST_SOFTWARE/CALIBRATION_FACTOR/NON_CONFORMANCE는 `{ toInsert: rowPreviews, duplicates: [] }` 직접 반환 (장비 FK 없는 독립 엔티티).

#### review-architecture Medium (Phase 3 스코프 포함)

- [x] **[2026-04-18 arch-review] 🟡 MEDIUM M4 — data-migration Preview 파일 cleanup 누락** — ✅ 완료 2026-04-19 (tech-debt-batch-0419). `previewMultiSheet` try/catch로 실패 시 `deleteFile`. try/finally 아님 — savedFile이 세션 캐시에 저장돼 executeMultiSheet가 재사용하므로 성공 경로 삭제 불가.
- [ ] **[2026-04-18 arch-review] 🟡 MEDIUM M2 — data-migration 세션 상태 메모리 의존** — `EXECUTING` 상태가 메모리 캐시에만 저장, 서버 재시작 시 이중 실행 가능. 마이그레이션은 수동 일회성이라 즉각 위험은 낮으나 Redis TTL 또는 DB migration_log 기록 권장.

#### 2026-04-18 review-architecture (Rev2 이후 스캔) 신규 이슈

- [x] **[2026-04-18 arch-rev2] 🟡 MEDIUM exportSoftwareValidation resolveUser N+1** — ✅ 완료 2026-04-19 (api-ssot-e2e-serial-export-batch → review-arch 재수정). `submittedBy` 오추가 수정 — T8 렌더링 코드에 실제로 사용되지 않으므로 `userIdSet`에서 제거. `receivedBy/performedBy/technicalApproverId/qualityApproverId` 4개 배치 조회 확정.
- [x] **[2026-04-18 arch-rev2] 🟢 LOW exportSoftwareRegistry teamId 스코프 미처리** — ✅ 완료 2026-04-19 (api-ssot-e2e-serial-export-batch). `exportSoftwareValidation`과 동일하게 `filter.teamId` → `SCOPE_RESOURCE_MISMATCH ForbiddenException` DB 쿼리 이전 early-return 패턴 적용.
- [ ] **[2026-04-18 arch-rev2] 🟢 LOW EquipmentRegistryDataService SELECT \*** — `equipment-registry-data.service.ts:79-84` `db.select().from(equipment)` 전체 컬럼 조회. 렌더러가 실제 사용하는 컬럼은 15개 이하. 장비 5,000건+ 시 불필요한 데이터 전송. projection 축소 권장.

#### verify-implementation 신규 이슈

- [x] **[2026-04-18 verify] 🟠 HIGH verify-hardcoding — data-migration API unwrapResponseData 미사용** — ✅ 완료 2026-04-19 (api-ssot-e2e-serial-export-batch). `form-templates-api.ts` 5함수 `response.data?.data ?? response.data` → `return response.data` (명시적 제네릭 추가). `self-inspection-api.ts` / `data-migration-api.ts` 스코프 외 — 별도 이슈로 분리.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-ssot — history-card 'equipment_photo' 문자열 직접** — ✅ 완료 2026-04-19 (tech-debt-batch-0419). `history-card-data.service.ts:203` `DocumentTypeValues.EQUIPMENT_PHOTO` 상수 경유로 교체.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-e2e — networkidle + waitForTimeout + auth.fixture** — ✅ 완료 2026-04-19. `phase2-scanner-ncr.spec.ts` networkidle→load 교체. `seed-view-form.spec.ts` `@playwright/test` 직접 import → `auth.fixture` 경유, `localhost:3000` → baseURL 위임, UUID → `TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E`, `test.skip` 수동 디버그 전용 표시. Tailwind utility selector 2건은 별도 이연.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-workflows — serial 모드 미설정 3파일** — ✅ 완료 2026-04-19 (api-ssot-e2e-serial-export-batch). wf-25/wf-35에 `test.describe.configure({ mode: 'serial' })` 추가. wf-export-ui-download `mode: 'parallel'` → `mode: 'serial'` 변경.
- [x] **[2026-04-18 verify] 🟢 LOW verify-i18n — en selfInspection.form 키 3개 누락** — ✅ 완료 2026-04-19 (tech-debt-batch-0419). `apps/frontend/messages/en/equipment.json` selfInspection.form에 `calibrationValidityPeriodPlaceholder` / `selectClassification` / `snapshotSectionLabel` 3키 추가.
- [x] **[2026-04-18 verify] 🟢 LOW verify-design-tokens — transition 하드코딩 3건** — ✅ 완료 2026-04-19 (tech-debt-batch-0419). `SoftwareTab.tsx:324,337` → `TRANSITION_PRESETS.fastColor`, `NCDocumentsSection.tsx:173` → `TRANSITION_PRESETS.fastOpacity`.

### 2026-04-19 verify-sql-safety/review-arch warning 해소

- [x] **[2026-04-19 verify-sql] 🟠 HIGH fk-resolution.service.ts ilike() 직접 사용** — ✅ 완료 2026-04-19. `ilike(users.name, name)` → `safeIlike(users.name, likeContains(name))`. `drizzle-orm`에서 `ilike` import 제거, `like-escape.ts` SSOT 임포트 추가.
- [x] **[2026-04-19 review-arch] 🟡 MEDIUM purgeDeletedDocuments 전체 배치 실패 무한루프** — ✅ 완료 2026-04-19. `consecutiveFullFailBatches` 카운터 추가, `MAX_CONSECUTIVE_FULL_FAIL=2` 연속 실패 시 abort + logger.error.

### 2026-04-19 qr-tsc-gc-cleanup review-architecture 신규 이슈

- [x] **[2026-04-19 qr-review] 🟡 MEDIUM sql 템플릿 → eq() 전환 (enum 필터)** — ✅ 2026-04-19 수정 완료. form-template-export.service.ts 5건 eq() 교체 (fix(reports) 커밋).
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM HandoverQRDisplay appUrl 빈 문자열 가드** — ✅ 이미 적용됨 (HandoverQRDisplay.tsx:55 `if (!appUrl)` + getAppUrl() 사용).
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM refetchOnMount QUERY_CONFIG 통합** — ✅ 이미 적용됨 (QUERY_CONFIG.EQUIPMENT_LIST_FRESH 프리셋으로 통합).
- [x] **[2026-04-19 qr-review] 🟢 LOW appUrl getAppUrl() 유틸 추출** — ✅ 이미 적용됨 (lib/qr/app-url.ts 유틸, 3곳 모두 import 사용).

### 2026-04-19 sw-validation-overhaul Phase 3-7 verify + review-architecture 후속

- [x] **[2026-04-19 sw-validation] 🔴 CRITICAL quality_approve 성공 후 FE testSoftware.detail 캐시 미무효화** — ✅ 완료 2026-04-20. `useOptimisticMutation` 전환 시 `commonInvalidateKeys`에 `queryKeys.testSoftware.detail(softwareId)` 포함.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH SoftwareValidationContent 6개 뮤테이션 useMutation 직접 사용** — ✅ 완료 2026-04-20. 6개 모두 `useOptimisticMutation` 전환. `setQueryData` 완전 제거.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH EN i18n 13개 키 누락** — ✅ 완료 2026-04-20. `en/software.json` + `en/errors.json` softwareValidation 섹션 추가. `ko/errors.json` 중복 키 병합.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM SoftwareValidationsModule에서 ExportData/Renderer Service export 누락** — ✅ 완료 2026-04-20. `SoftwareValidationExportDataService` → SoftwareValidationsModule. `SoftwareValidationRendererService`는 FormTemplateService 의존으로 ReportsModule 유지, forwardRef 순환 방지.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM calibration-plans review() assertIndependentApprover 미적용** — ✅ 완료 2026-04-20. `calibration-plans.service.ts:review()` 에 `assertIndependentApprover` 적용.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM SoftwareValidationListener 과잉 캐시 무효화** — ✅ 완료 2026-04-20. `deleteByPrefix` → `delete(exact-key)` 교체.
- [ ] **[2026-04-19 sw-validation] 🟡 MEDIUM wf-14b E2E 미업데이트** — self-approval disabled / dual-approval / revalidation 배너 / quality_approve 후 배너 소멸 등 이번 세션 신규 기능에 대한 E2E 케이스 없음.
- [ ] **[2026-04-19 sw-validation] 🟢 LOW 재검증 배너 i18n 메시지 미구분** — `ko/software.json:revalidationRequired` = "소프트웨어 버전이 변경되어...". 신규 등록(latestValidationId=null) 시에도 동일 문구 표시 → 부정확. 중립 문구("유효성 확인이 필요합니다")로 수정 또는 BE에서 neverValidated/revalidationNeeded 구분 필드 추가.
- [ ] **[2026-04-19 sw-validation] 🟢 LOW software-validations.service.ts approve() 인라인 검사** — `assertIndependentApprover` 헬퍼 대신 인라인 if 사용. 헬퍼로 통일하면 에러 코드 변경 시 일관성 보장.

### 2026-04-19 sw-validation-overhaul Phase 3-4-7 플랜 이연 항목

- [x] **[2026-04-19 sw-validation] 🔴 CRITICAL Phase 4 — 다중 항목 DOCX 렌더링 누락 (데이터 손실)** — ✅ 완료 2026-04-20. T6 렌더러 3행 루프 + CONTROL_MAX_ROWS=3 SSOT + DTO max(1)/max(1)/max(3) 제한으로 데이터 손실 방지.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH Phase 3 — 글로벌 /software-validations 라우트 + Sidebar 메뉴 없음** — ✅ 완료 2026-04-20. `app/(dashboard)/software-validations/` 4파일 신규 + nav-config.ts ShieldCheck 서브메뉴 추가.
- [ ] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — FE exportability 유틸 없음** — `apps/frontend/lib/utils/software-validation-exportability.ts` 미생성. 현재 FE에서 draft/rejected 상태인 유효성 확인의 export 버튼이 disabled 처리 안 됨. 클릭하면 400을 받고 나서야 알 수 있는 UX. BE `assertExportable()`과 대칭되는 프론트 헬퍼 필요.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — FRONTEND_ROUTES.SOFTWARE_VALIDATIONS 상수 없음** — ✅ 완료 2026-04-20. `FRONTEND_ROUTES.SOFTWARE_VALIDATIONS` 5 빌더 (LIST/DETAIL/NEW/BY_SOFTWARE/BY_SOFTWARE_NEW) 추가.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — error.tsx (Error Boundary) 없음** — ✅ 완료 2026-04-20. `/software-validations/error.tsx` 신규 추가 (RouteError 패턴).
- [ ] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — 10개 컴포넌트 미추출** — `SoftwareValidationContent.tsx` 가 모든 UI 로직을 단일 파일에 담고 있음. 계획된 10개 컴포넌트 (`ValidationStatusBadge`, `ValidationWorkflowTimeline`, `ValidationListFilters`, `ValidationCreateDialog`, `ValidationEditDialog`, `ValidationRejectDialog`, `ValidationAcquisitionProcessingTable`, `ValidationControlTable`, `ValidationAttachmentPicker`, `ValidationActionsBar`) 미추출. 유지보수성 저하. 해당 UI 수정 시 기회가 될 때 단계적 추출.
- [x] **[2026-04-19 sw-validation] 🟢 LOW Phase 4 — RFC 5987 content-disposition 헬퍼 미추출** — ✅ 완료 2026-04-20. `common/http/content-disposition.util.ts` 신설 + 6개 컨트롤러 일괄 적용.
- [ ] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — renderer spec 없음** — `software-validation-renderer.service.spec.ts` 미생성. T4/T5 셀 좌표 매핑(independentMethod=R1, acceptanceCriteria=R2)이 올바른지 단위 테스트로 보장되지 않음. in-memory PizZip 픽스처 방식 (`history-card-renderer.service.spec.ts` 패턴 참고) 권장.
- [ ] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — k6 부하 테스트 미검증** — `scripts/load/software-validation-export.k6.js` / `software-validation-list.k6.js` 미생성. p95 < 500ms 목표 달성 여부 미측정.
- [ ] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — 운영 가이드 문서 없음** — `docs/references/software-validation-workflow.md` 미생성. 절차서 §14 매핑, 승인 SLA, 상태 전이 다이어그램, ISO 17025 §6.2.2/§6.4.13 근거 문서 없음.

## Resolved

(이번 세션 완료 항목은 완료된 exec-plan 문서로 이관됨.)

### 2026-04-19 verify-implementation + review-architecture (api-ssot-e2e-serial-export-batch 세션)

- [x] **[2026-04-19 verify] 🟢 LOW verify-hardcoding — getTemplateBuffer() 6곳 문자열 리터럴** — ✅ 완료 2026-04-19. `form-template-export.service.ts` 6곳 `getTemplateBuffer('UL-QP-18-NN')` → `getTemplateBuffer(entry.formNumber)` 교체. 양식번호 개정 시 FORM_CATALOG 1곳만 수정하면 drift-safe.
- [x] **[2026-04-19 review-arch] 🟢 LOW exportSoftwareValidation site 스코프 post-filter** — ✅ 완료 2026-04-19. `filter.site` 체크를 쿼리 이후 제거 → `.where(and(eq(softwareValidations.id, validationId), filter.site ? eq(testSoftware.site, filter.site as Site) : undefined))` WHERE 절로 이동. early-reject 패턴 통일 + 불필요 쿼리 비용 제거.
- [ ] **[2026-04-19 review-arch] 🟢 LOW form-templates-api GET 패턴 불일치** — `form-templates-api.ts`: `apiClient.get<T>() + return response.data` 패턴. `equipment-api.ts` 등 기존 파일: `transformArrayResponse<T>()` 경유. 두 패턴이 기능적으로 동등하나 코드베이스 혼용. 신규 API 파일 작성 기준을 CLAUDE.md 또는 backend-patterns.md에 명시 권장.
- [ ] **[2026-04-19 verify-e2e] 🟢 LOW wf-35:103 토스트 .first() 직접 사용** — `toast-helpers.ts` 경유 권장. CAS 충돌 UI 복구 흐름의 토스트 중복 발화 가능성 대응.

### 2026-04-19 qr-sampler + 7종 프리셋 review-architecture

- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW W-3: LABEL_CONFIG.cell 관심사 혼합** — ✅ 완료 2026-04-20. `LABEL_CONFIG.scaling = { referenceLabelHeightMm }` 네임스페이스 신설. `cell.referenceLabelHeightMm` 제거, worker `LABEL_CONFIG.scaling.referenceLabelHeightMm` 경유로 업데이트.
- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW pt→mm 매직 넘버 0.353** — ✅ 완료 2026-04-20. `PT_TO_MM = 25.4 / 72` named 상수로 `qr-config.ts` + `index.ts` export. worker `0.353` 리터럴 → `PT_TO_MM` 교체.
- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW i18n size.* 치수 하드코딩** — ✅ 완료 2026-04-20. `ko/qr.json`, `en/qr.json` `size.*` → `{widthMm}/{heightMm}` 보간 토큰 교체. `EquipmentQRButton.tsx` size 렌더 루프에 `LABEL_SIZE_PRESETS[preset]` 구조분해 + 파라미터 주입.

## 2026-04-20 — calibration-phase4-7 verify-* 스킬 갭 업데이트

- [x] **[2026-04-20 skill-gap] verify-auth Step 13 추가** — FE role 리터럴 직접 비교 탐지 (URVal.* 경유 액션 게이트 → Permission SSOT 우회). ApprovalTimeline.tsx:63 `canReview` 패턴. WARN 수준. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-hardcoding Step 23 추가** — export-data 서비스의 status allowlist 리터럴 탐지. `['approved'] as const` 패턴. sync 주석 존재 시 WARN. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-frontend-state Related Files + Step 15 추가** — use-cas-guarded-mutation.ts 커버. VERSION_CONFLICT 중복 처리 및 수동 casVersion 조합 탐지. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-cas Related Files + Step 12 추가** — use-cas-guarded-mutation.ts fetch-before-mutate 훅 참조. 3단계 승인 워크플로우 casVersion 수동 조합 탐지. ✅ 완료 2026-04-20.
- [ ] **[2026-04-20 skill-gap] 🟢 LOW calibration-plan-renderer.service.ts iCell.alignment 직접 조작** — `writeDataRow` 이후 `worksheet.getCell(...)` + `.alignment` 직접 설정. layout.ts의 DATA_END_ROW 경유가 아닌 ExcelJS 직접 조작. 새 스킬 없이 tech-debt로 관리. 위험도 낮음 (기능 정상), renderer 리팩토링 시 layout 토큰 경유로 교체 권장.
- [ ] **[2026-04-20 skill-gap] 🟢 LOW calibration-plan-exportability.ts 전용 verify 없음** — `apps/frontend/lib/utils/calibration-plan-exportability.ts`는 verify-hardcoding Step 23 + verify-ssot로 커버. 별도 스킬 불필요.

## 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)

### review-architecture Warning 2건 (즉시 수정 권장)

- [ ] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM renderer.service templateBuffer 내부 로드** — `calibration-plan-renderer.service.ts`가 `FormTemplateService`를 직접 DI 받아 내부에서 templateBuffer 로드. `equipment-registry` 패턴은 orchestrator(export.service)가 templateBuffer 주입. 패턴 통일 시 renderer 테스트가 mock 없이 순수 unit 가능. 파일: `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`
- [ ] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM CalibrationPlansContent TableRow 이중 네비게이션** — `TableRow onClick={router.push()}` + `Link absolute inset-0` 동시 존재. 히스토리 스택에 2회 push. `TableRow onClick` 제거하고 Link overlay만 유지. 파일: `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx`

### verify-implementation WARN 2건 (후속 작업)

- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW verify-e2e — UL-QP-19-01 UI 다운로드 E2E 없음** — `wf-export-ui-download.spec.ts`에 `expectFileDownload(page, 'UL-QP-19-01')` 케이스 추가 권장. 현재는 API-level만 검증됨.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW verify-seed-integrity — shared-test-data.ts ITEM_013~022 없음** — 백엔드 seed에 item 추가했다면 E2E fixtures 동기화 필요.

### Phase 2/3/6~8 미구현 항목 (다음 세션 대상)

- [ ] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — Sticky 액션 바** — `CalibrationPlanDetailClient.tsx` sticky + backdrop-blur. `CALIBRATION_PLAN_DETAIL_HEADER_TOKENS` stickyContainer variant 추가.
- [ ] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — confirmItem optimistic** — `PlanItemsTable.tsx` `confirmItemMutation` → `useOptimisticMutation` 결합. progress 즉시 반영.
- [ ] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — Reject textarea minLength=10** — `CalibrationPlanDetailClient.tsx:519`. 글자 수 live region + i18n.
- [ ] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — year "_all" 필터 + ErrorState** — `CalibrationPlansContent.tsx` "모든 연도" 옵션 + `ErrorState` 컴포넌트 + onRetry.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — KPI aria-pressed** — `CalibrationPlansContent.tsx:250-265` KPI `aria-pressed` 분기.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — ApprovalTimeline sr-only 요약** — visually-hidden span "1단계 완료, 2단계 대기, 3단계 미진행".
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — PlanStatusBadge 추출** — `<Badge variant="calibration-plan-status">` 또는 `<PlanStatusBadge>` 전용 컴포넌트.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 8 — prefers-reduced-motion 가드** — sticky + PageHeader 애니메이션 `motion-reduce:transform-none`.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 8 — axe-core E2E** — list/detail/create/Reject dialog 각 상태 violation 0 assertion.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 6 — Permission.EXPORT_REPORTS TE 정책 재확인** — test_engineer EXPORT_REPORTS 보유가 UL-QP-19-01에서 의도된 정책인지 절차서 확인 후 role-permissions 정책 결정.

## 2026-04-20 — calibration-phase4-7

- [ ] S3: CACHE_EVENTS.CALIBRATION_CREATED payload에 linkedPlanItemId 포함 미구현 — calibration.service.ts:createWithDocuments 이벤트 emit 부분
- [ ] S6: CALIBRATION_DETAIL 쿼리키가 실제 교정 detail 훅(useCalibration 등)에 바인딩되지 않음 — lib/api/calibration-api.ts useQuery 부분
- [ ] M4.8 계약 모순: CalibrationRecord.certificatePath는 M4.3(API 응답 호환성) 유지를 위해 보존 — contract에서 M4.3 vs M4.8 재검토 필요
- [ ] MC.4: Phase 5a/5b/5c가 1개 커밋으로 병합됨 (계약은 독립 커밋 요구). 코드는 정상, 커밋 분리는 불필요
- [ ] 고아 SQL 파일 정리: 0033_software_validation_constraints.sql, 0034_audit_log_append_only.sql, 0035_test_software_latest_validation.sql, 0036_software_validations_composite_idx.sql (원본) — drizzle/ 폴더에 중복 존재. 기능 영향 없으나 저장소 정리 필요

### 2026-04-20 nc-detail-design-fix review-architecture 이연

- [ ] **[W-FE1] NCDetailClient.tsx:329 편집 권한 명시성** — 헤더 편집 `canCloseNC`(기술책임자), 인라인 조치 편집 권한 없음. 동일 화면 불일치. `EDIT_NON_CONFORMANCE` 권한 분리 또는 `canCloseNC` 재사용 의도 주석 명시 필요.
- [ ] **[W-BE2] calibration-plan-renderer.service.ts:72 confirmedSignature 로직** — `item.confirmedBy ? plan.authorName : '-'` 패턴이 항상 plan 작성자=확인자를 가정. 비즈니스 규칙 주석 또는 `confirmedByName` 필드 추가로 명확화 필요.
- [ ] **[W-BE3] calibration-plans-export.service.spec.ts:173 테스트 하드코딩** — 테스트 의도("하드코딩 없음")와 본문 `'연간교정계획서'` 리터럴 불일치. `FORM_CATALOG` 동적 import로 교체 권장.
