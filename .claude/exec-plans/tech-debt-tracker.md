# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.

## Open

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

- [ ] **[2026-04-18 completion] 🟡 MEDIUM B2 NCDocumentsSection permission gate 재적용** — `useAuth().can(Permission.UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT)`로 조건부 렌더. 직접 편집 + tsc PASS 했으나 staged diff 반영 안 됨(병렬 세션 revert 추정). 재적용 필요.
- [ ] **[2026-04-18 completion] 🟡 MEDIUM B3 i18n `nonConformanceManagement` 실제 이관** — equipment.json의 90+ 라인 블록을 non-conformances.json `management` 서브키로 이관. 2개 client의 useTranslations 네임스페이스 조정. verify-i18n PASS 확인.
- [ ] **[2026-04-18 completion] 🟡 MEDIUM C1 이미지 썸네일 server-side 리사이징** — `GET /documents/:id/thumbnail?size=sm`(sharp) + Cache-Control immutable. NCDocumentsSection이 원본 대신 thumbnail URL 사용 → N+1 fetch 제거, 10MB 이미지 원본 다운로드 방지.
- [ ] **[2026-04-18 completion] 🟢 LOW D1 document.service.spec.ts 신규** — findByNonConformanceId + createRevision FK carry-over 단위 테스트. 전체 findByXxxId 패턴 수립.
- [ ] **[2026-04-18 completion] 🟢 LOW E1 verify-* 스킬 실행** — /verify-hardcoding, /verify-i18n, /verify-ssot, /verify-security, /verify-cache-events 순차 수동 실행.
- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — TTY 환경에서 `pnpm db:generate` 실행하여 0025~0031 snapshot 복원.
- [ ] **[2026-04-18 completion] 🟢 LOW CSP report 영속화** — SecurityController logger.warn 외에 DB 또는 Loki 연결 + Grafana 대시보드.
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM Per-row 체크박스 + BulkActionBar 추출** — useBulkSelection 훅은 이미 완성, row-level UI 통합 + 범용 프리미티브 (EquipmentTable/CardGrid/VirtualizedList).
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM Intent URL 파라미터 확산** — QUERY_INTENTS SSOT는 수립됨, 교정계획/장비요청/자체점검/중간점검/체크아웃 create 페이지에 딥링크 패턴 적용.
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM Handover 토큰 → 범용 OneTimeToken 프리미티브** — common/one-time-token 모듈 추출, 승인 위임/외부 제출 링크 등 재사용 대비.
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM verify-qr-ssot + verify-handover-security 스킬 신설** — 신규 QR/handover 코드의 하드코딩/보안 안티패턴 자동 감지.
- [ ] **[2026-04-17 qr-phase3] 🟡 MEDIUM PWA 완결 (아이콘 PNG + 서비스워커 + Install Prompt)** — public/icons/*.png 실파일 생성, next-pwa/Serwist 도입, offline fallback page.
- [ ] **[2026-04-17 qr-phase3] 🟢 LOW Lighthouse/axe/bundle 배포 게이트** — CI workflow 3종 + performance-budgets.md SSOT. PWA 완결 이후 정확 측정.
- [ ] **[2026-04-17 qr-phase3] 🟢 LOW pre-commit self-audit 자동화** — scripts/self-audit.mjs + husky 통합. feedback_pre_commit_self_audit.md 7항목 기계화.
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
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] CI SOPS 게이트 secret 미등록 시 무음 skip 방지** — `.github/workflows/main.yml:171,181,191` 3개 SOPS step 이 `if: ${{ secrets.SOPS_AGE_KEY != '' }}` 로 가드. secret 미등록 시 게이트가 silently skip 되어 fork PR/신규 레포 셋업에서 drift 방어 무력화. 수정 방향: 별도 status-check job 으로 분리 + 미설정 시 warning 주석 출력 step 추가. 1인 프로젝트에서는 현재 설계가 의도적이나 문서화 필요.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] pre-push 에서 선택적 SOPS 검증 훅** — pre-push 는 `.env.example` 만, CI 는 `.env.example` + lan/prod SOPS 2종. 로컬 `SOPS_AGE_KEY` env 존재 시 pre-push 에서도 `pnpm verify:env-sync --file <sops-decrypt-output>` 자동 실행하여 CI 왕복 피드백 지연 단축. 현재는 수동 명령 가이드만 infra/secrets/README.md 에 있음.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] `derivePurposeFromStatus` switch 를 CheckoutStatus enum SSOT 로 연동** — `checkouts.controller.ts:97-108` switch 케이스가 문자열 리터럴 하드코딩. `@equipment-management/schemas` 의 `CheckoutStatus` enum 으로 전환 + `Record<CheckoutStatus, HandoverTokenPurpose | null>` lookup object 또는 exhaustive `assertNever` 패턴 적용하여 상태 추가 시 컴파일 에러로 감지. 현재 3 케이스만 있어 긴급도 낮음.

### 2026-04-17 harness: ul-qp-18 양식 3종 교체 + 3-way 분리

- [ ] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-21 e2e (equipment-registry-export)** — UL-QP-18-01 xlsx export API 레벨 e2e spec. Row 3 D열=`외부 교정` (MANAGEMENT_METHOD_LABELS), P열 ∈ {사용/고장/여분} (EQUIPMENT_AVAILABILITY_LABELS), O열 ∈ {O/X} (INTERMEDIATE_CHECK_YESNO_LABELS) 검증. 구현은 `apps/frontend/tests/e2e/workflows/wf-21-equipment-registry-export.spec.ts`.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-19b/wf-20b 확장** — 중간점검/자체점검 e2e에 classification snapshot + SELF_INSPECTION_RESULT_LABELS/INSPECTION_JUDGMENT_LABELS 검증 케이스 추가. 현재 스펙은 양식 구조 변경 감지만 수행.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM self-inspection UI DTO 필드 노출** — `classification`/`calibrationValidityPeriod` 입력 필드를 create 페이지/컴포넌트에 추가. 현재 서비스 레이어는 수용하되 UI에서 값 전달 없음 → fallback(장비 마스터 derive)만 발생. 실제 snapshot 저장되도록 UI까지 연결 필요.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW renderer 유닛 테스트** — `equipment-registry-renderer.service.spec.ts`, `intermediate-inspection-renderer.service.spec.ts`, `self-inspection-renderer.service.spec.ts` — SSOT 라벨 경유, 빈 행 처리, 대체 시트명 fallback 검증.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW 양식 교체 운영 반영** — 운영 DB에는 `POST /api/form-templates/replace` 수동 호출 + `change_summary` 필수. 배포 runbook 작성 필요 (docs/operations/).

### 2026-04-17 verify/review 후속 (ul-qp-18-forms 세션 종료 후)

- [x] **[2026-04-17 ul-qp-18-forms] review-W1 팀 JOIN managementNumber→teamId** — ✅ 완료 2026-04-17 (커밋 5b50f4dc). 자체점검과 동일 패턴으로 통일, 29 tests PASS.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W3 scope 강제 비대칭** — 중간점검은 post-filter(`if inspection.equipmentSite !== filter.site throw 404`), 자체점검은 WHERE(`eq(equipment.site, filter.site)`). 기능 동등이나 drift 위험 + 불필요 쿼리 비용. 중간점검을 WHERE 방식으로 통일 권장 (자체점검과 대칭).
- [ ] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W2 renderer db 주입 경계** — 자체점검/중간점검 renderer가 db+storage 직접 주입 (렌더러가 간접적 DB 접근). 향후 renderer 유닛 테스트 작성 시 mock 복잡도 상승. `renderResultSections` 필요 데이터를 Data Service가 미리 조회해 ExportData에 포함시키면 renderer 순수화 가능. 구조적 변경이므로 Phase 3 패턴 재검토 대상.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW review-W4 EXPORT_QUERY_LIMITS.FULL_EXPORT 스트리밍** — 현재 1,000건 제한 + `ExcelJS.writeBuffer()` 전체 메모리 적재. N이 5,000+ 증가 시 메모리 부담. `worksheet.addRow` + stream to response로 교체 검토 (UL-QP-18-01/08, UL-QP-19-01 모두 해당).
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW verify-seed-integrity SHOULD FAIL** — `seed-test-new.ts` Phase 0 truncate 리스트에 `equipment_self_inspections`/`self_inspection_items`/`intermediate_inspections`/`intermediate_inspection_items` 4개 테이블 미등재. `TRUNCATE equipment CASCADE`가 FK 전파로 실제 idempotency 유지하나, 명시적 문서화 누락. + `verification.ts`에 inspection count 검증 부재(seed drift silent 위험). 해결: truncate 리스트 FK 역순 추가 + checkCount 4건 추가.
- [x] **[2026-04-17 ul-qp-18-forms] verify-ssot Step 3b 탐지 패턴 확장** — ✅ 완료 2026-04-17. `QP18_.*_LABELS`/`EQUIPMENT_AVAILABILITY_LABELS`/`INTERMEDIATE_CHECK_YESNO_LABELS`/`INSPECTION_JUDGMENT_LABELS`/`SELF_INSPECTION_RESULT_LABELS` 로컬 재정의 탐지 grep 추가. 현재 코드베이스 dry-run 0건 PASS.

## Resolved

(이번 세션 완료 항목은 완료된 exec-plan 문서로 이관됨.)
