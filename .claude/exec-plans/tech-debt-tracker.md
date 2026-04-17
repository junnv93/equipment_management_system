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

- [ ] **[2026-04-17 qr-phase3] 🟠 HIGH documents.nonConformanceId FK 도입** — NC 첨부 모듈 완결 (backend migration + NonConformancesModule 확장 + CreateNonConformanceForm photos 필드). QR Phase 2-D rollback이 드러낸 근본 문제. `.claude/skills/harness/references/example-prompts.md` 2026-04-17 섹션 참조.
- [ ] **[2026-04-17 qr-phase3] 🟠 HIGH infra/nginx CSP media-src + sops HANDOVER_TOKEN_SECRET** — 프로덕션 배포 precondition. CSP 미설정 시 카메라/Blob 차단 위험 + secret 누락 시 앱 기동 실패.
- [ ] **[2026-04-17 qr-phase3] 🟠 HIGH Playwright E2E 3종** — phase1-mobile-landing + phase2-scanner-ncr + phase3-handover (2-session replay 방어 검증).
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

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `CheckoutsController` 단위 `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 컨트롤러 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] 기존 class-DTO 점진 마이그레이션 14개** — `verify-zod` Step 9 드라이런 기준 type-only DTO 14개가 여전히 `z.infer` 방식. **해당 모듈 작업 시 기회가 될 때** `createZodDto` 전환 (리팩터를 위한 리팩터 금지). 트리거 3건 (`any`/Swagger-TS drift/Zod+class 중복) 중 하나라도 해당 시 착수. backend-patterns.md "기존 class-DTO 전환 조건" 참조.

### 2026-04-17 harness: ul-qp-18 양식 3종 교체 + 3-way 분리

- [ ] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-21 e2e (equipment-registry-export)** — UL-QP-18-01 xlsx export API 레벨 e2e spec. Row 3 D열=`외부 교정` (MANAGEMENT_METHOD_LABELS), P열 ∈ {사용/고장/여분} (EQUIPMENT_AVAILABILITY_LABELS), O열 ∈ {O/X} (INTERMEDIATE_CHECK_YESNO_LABELS) 검증. 구현은 `apps/frontend/tests/e2e/workflows/wf-21-equipment-registry-export.spec.ts`.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-19b/wf-20b 확장** — 중간점검/자체점검 e2e에 classification snapshot + SELF_INSPECTION_RESULT_LABELS/INSPECTION_JUDGMENT_LABELS 검증 케이스 추가. 현재 스펙은 양식 구조 변경 감지만 수행.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM self-inspection UI DTO 필드 노출** — `classification`/`calibrationValidityPeriod` 입력 필드를 create 페이지/컴포넌트에 추가. 현재 서비스 레이어는 수용하되 UI에서 값 전달 없음 → fallback(장비 마스터 derive)만 발생. 실제 snapshot 저장되도록 UI까지 연결 필요.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW renderer 유닛 테스트** — `equipment-registry-renderer.service.spec.ts`, `intermediate-inspection-renderer.service.spec.ts`, `self-inspection-renderer.service.spec.ts` — SSOT 라벨 경유, 빈 행 처리, 대체 시트명 fallback 검증.
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW 양식 교체 운영 반영** — 운영 DB에는 `POST /api/form-templates/replace` 수동 호출 + `change_summary` 필수. 배포 runbook 작성 필요 (docs/operations/).

## Resolved

(이번 세션 완료 항목은 완료된 exec-plan 문서로 이관됨.)
