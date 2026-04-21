# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

- [ ] **[2026-04-15 docker-infra-standards] Phase K — 백업·DR** (pg_dump cron + 복원 리허설 CI + runbook). 프로덕션 사용자 발생 시점.

### 2026-04-17 harness: QR Phase 1-3 후속 정리

- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.
- [x] **[2026-04-18 completion] 🟢 LOW CSP report 영속화** — ✅ 2026-04-21 완료. `csp_reports` 테이블 + SecurityService(saveReport) + SecurityModule DrizzleModule 등록. logger.warn + DB 이중 저장.
- [x] **[2026-04-17 qr-phase3] ❓ 사용자 결정 — 커밋 7a6255d1 메시지 귀속 복구** — ✅ 2026-04-21 결정: status quo(A). 히스토리 재작성 없이 현 커밋을 공식 기록으로 인정.

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] 기존 class-DTO 점진 마이그레이션 잔여** — 2026-04-21 기준 대규모 전환 완료 (calibration/data-migration/settings/equipment/notifications/teams). 잔여 미전환 DTO는 해당 모듈 작업 시 기회가 될 때 전환. 트리거: `any`/Swagger-TS drift/Zod+class 중복.

### 2026-04-19 sw-validation-overhaul 후속


### 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)

- [ ] **[2026-04-21 verify-workflows] 🟢 LOW UL-QP-18-11 UI 다운로드 E2E 미커버** — `wf-export-ui-download.spec.ts` 주석에 `implemented: false, backend exporter 미구현`으로 의도된 부채. 백엔드 exporter 구현 시 E2E 케이스 추가 필요.

### 2026-04-21 — review-architecture 발견 이슈

- [x] **[2026-04-21 review-architecture] 🟢 LOW `LoginProviders` error 필드 미소비** — ✅ 2026-04-21 완료 (tech-debt-batch-0421d). `error` 구조 분해 추가, `tLogin('serverUnavailable')` vs `tLogin('configRequired')` 분기 UI.
- [x] **[2026-04-21 review-architecture] 🟢 LOW inspection renderer stale import 경로** — ✅ 2026-04-21 완료 (tech-debt-batch-0421d). 양 파일 `../../../common/docx/docx-template.util` canonical 경로로 교체.

### 2026-04-21 — verify-implementation 스캔 발견 이슈

- [x] **[2026-04-21 verify-cache-events] 🟢 LOW `managementNumber: ''` 이벤트 페이로드 빈 문자열** — ✅ 2026-04-21 완료 (tech-debt-batch-0421d). L159, L354, L408 키-값 쌍 제거 (필드 생략 = undefined, 타입 `managementNumber?: string`에 부합).

### 2026-04-21 — tech-debt-batch-0421c SHOULD 이연

- [x] **[2026-04-21 tech-debt-batch-0421c] 🟢 LOW SecurityService 단위 스펙 미작성** — ✅ 2026-04-21 완료 (tech-debt-batch-0421d). `security.service.spec.ts` 신규 작성. DB INSERT 정상 경로 + 오류 무전파(Logger.error) 2케이스.
- [x] **[2026-04-21 tech-debt-batch-0421c] 🟢 LOW renderer MERGED_TEXT_COL 상수 스펙 미작성** — ✅ 2026-04-21 완료 (tech-debt-batch-0421d). checkout-form-renderer.service.spec.ts + equipment-import-form-renderer.service.spec.ts 신규 작성. ROWS 상수 + 확인 문장 XML 포함 검증.

### 2026-04-21 — tech-debt-batch-0421d (code-reviewer 지적 7건)

- [x] **[2026-04-21 tech-debt-batch-0421d] k6 setup() silent failure** — ✅ 완료. K6_USER_EMAIL/K6_USER_PASSWORD/K6_VALIDATION_ID 미설정 + login 非200 → throw.
- [x] **[2026-04-21 tech-debt-batch-0421d] lineNumber varchar → integer** — ✅ 완료. `csp-reports.ts` integer 컬럼, `0042_csp_reports_line_number_int.sql` USING CASE 마이그레이션.
- [x] **[2026-04-21 tech-debt-batch-0421d] NormalizedCspReport 타입 분리** — ✅ 완료. `security.types.ts` 신규, service·controller 양쪽 import 교체.
- [x] **[2026-04-21 tech-debt-batch-0421d] Dead code 제거** — ✅ 완료. ApproveEquipmentRequestDto + CreateSharedEquipmentSwaggerDto + swagger import 제거.
- [x] **[2026-04-21 tech-debt-batch-0421d] ValidationCreateDialog re-export 제거** — ✅ 완료. `export type { CreateFormState }` 제거, 소비처 직접 import 확인.
- [x] **[2026-04-21 tech-debt-batch-0421d] docx 셀 인덱스 SSOT화** — ✅ 완료. `docx-cell-indices.ts` 신규 + layout 파일들 import/re-export.

