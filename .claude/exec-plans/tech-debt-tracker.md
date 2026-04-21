# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

- [ ] **[2026-04-15 docker-infra-standards] Phase K — 백업·DR** (pg_dump cron + 복원 리허설 CI + runbook). 프로덕션 사용자 발생 시점.

### 2026-04-17 harness: QR Phase 1-3 후속 정리

- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.
- [ ] **[2026-04-18 completion] 🟢 LOW CSP report 영속화** — SecurityController logger.warn 외에 DB 또는 Loki 연결 + Grafana 대시보드.
- [ ] **[2026-04-17 qr-phase3] ❓ 사용자 결정 — 커밋 7a6255d1 메시지 귀속 복구** — status quo(A) vs git notes(B) vs interactive rebase(C). 기본값 A, 답변 대기.

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] 기존 class-DTO 점진 마이그레이션 14개** — `verify-zod` Step 9 드라이런 기준 type-only DTO 14개가 여전히 `z.infer` 방식. **해당 모듈 작업 시 기회가 될 때** `createZodDto` 전환 (리팩터를 위한 리팩터 금지). 트리거 3건 (`any`/Swagger-TS drift/Zod+class 중복) 중 하나라도 해당 시 착수.

### 2026-04-19 sw-validation-overhaul 후속

- [ ] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — k6 부하 테스트 미검증** — `scripts/load/software-validation-export.k6.js` / `software-validation-list.k6.js` 미생성. p95 < 500ms 목표 달성 여부 미측정.

### 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)

- [ ] **[2026-04-21 verify-workflows] 🟢 LOW UL-QP-18-11 UI 다운로드 E2E 미커버** — `wf-export-ui-download.spec.ts` 주석에 `implemented: false, backend exporter 미구현`으로 의도된 부채. 백엔드 exporter 구현 시 E2E 케이스 추가 필요.
- [ ] **[2026-04-21 review-architecture] 🟢 LOW CreateFormState 역의존** — `ValidationCreateDialog.tsx:31`에 정의된 `CreateFormState`를 부모(`SoftwareValidationContent`)와 형제(`SelfValidationFields`, `VendorValidationFields`)가 import. 별도 `validation-create-form.types.ts`로 분리하면 계층 역전 해소. 트리거: 다이얼로그 폼 필드 추가/변경 시.

### 2026-04-21 — form-export-services (harness Mode 1)

- [ ] **[2026-04-21 form-export-services] 🟢 LOW renderer 내 단일 열 인덱스 named constant 미적용** — `checkout-form-renderer.service.ts` (L47, L97)와 `equipment-import-form-renderer.service.ts` (L78, L177)에서 `setCellValue(..., 1)` 리터럴 사용. layout 파일에 `SINGLE_CELL_COL = 1` 또는 `TEXT_COL = 1` 상수 추가 후 참조 전환 필요. 트리거: 해당 renderer 수정 시.
