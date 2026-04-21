# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

- [ ] **[2026-04-15 docker-infra-standards] Phase K — 백업·DR** (pg_dump cron + 복원 리허설 CI + runbook). 프로덕션 사용자 발생 시점.

- [ ] **[2026-04-16 tech-debt-s2s4] E2E globalPrefix 통합** — createTestApp에 setGlobalPrefix('api') 추가 + 22개 E2E 스펙 경로를 API_ENDPOINTS 기반으로 마이그레이션. 현재 toTestPath로 중앙화된 상태.

### 2026-04-17 harness: QR Phase 1-3 후속 정리

- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.
- [ ] **[2026-04-18 completion] 🟢 LOW CSP report 영속화** — SecurityController logger.warn 외에 DB 또는 Loki 연결 + Grafana 대시보드.
- [ ] **[2026-04-17 qr-phase3] ❓ 사용자 결정 — 커밋 7a6255d1 메시지 귀속 복구** — status quo(A) vs git notes(B) vs interactive rebase(C). 기본값 A, 답변 대기.

### 2026-04-17 harness: history-card-qp1802 후속 정리

- [ ] **[2026-04-17 history-card-qp1802] multi-form 3-way 분리 패턴 확산** — `form-template-export.service.ts` 의 QP-18-03/05/06/07/09/10 양식도 UL-QP-18-02 와 동일한 Data/Renderer/XmlHelper + layout.ts SSOT 패턴으로 마이그레이션. 새 양식 추가 시 이 패턴 적용하면 점진적으로 개선 가능.
- [ ] **[2026-04-17 history-card-qp1802] 프론트엔드 E2E 검증** — `apps/frontend/tests/e2e/workflows/wf-history-card-export.spec.ts` 통합 이력 §5 섹션 유형 라벨 검증 추가. Playwright 기반 실 브라우저 다운로드 후 docx 열어 텍스트 확인.
- [ ] **[2026-04-17 history-card-qp1802] 시스템 관리자 승인 경로 접근 제어 확인** — `equipment.controller.ts:472` `isAdmin + approvalStatus=approved` 분기가 실제로 운영 절차에서 허용된 경로인지 절차서 교차 확인 필요 (권한 매트릭스와 UL-QP-18 §5.2 비교).

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] 기존 class-DTO 점진 마이그레이션 14개** — `verify-zod` Step 9 드라이런 기준 type-only DTO 14개가 여전히 `z.infer` 방식. **해당 모듈 작업 시 기회가 될 때** `createZodDto` 전환 (리팩터를 위한 리팩터 금지). 트리거 3건 (`any`/Swagger-TS drift/Zod+class 중복) 중 하나라도 해당 시 착수.

### 2026-04-17 harness: ul-qp-18 양식 3종 교체 + 3-way 분리

- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW 양식 교체 운영 반영** — 운영 DB에는 `POST /api/form-templates/replace` 수동 호출 + `change_summary` 필수. 배포 runbook 작성 필요 (docs/operations/).
- [ ] **[2026-04-17 ul-qp-18-forms] 🟢 LOW review-W4 EXPORT_QUERY_LIMITS.FULL_EXPORT 스트리밍** — 현재 1,000건 제한 + `ExcelJS.writeBuffer()` 전체 메모리 적재. N이 5,000+ 증가 시 메모리 부담. `worksheet.addRow` + stream to response로 교체 검토 (UL-QP-18-01/08, UL-QP-19-01 모두 해당).

### 2026-04-19 sw-validation-overhaul 후속

- [ ] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — k6 부하 테스트 미검증** — `scripts/load/software-validation-export.k6.js` / `software-validation-list.k6.js` 미생성. p95 < 500ms 목표 달성 여부 미측정.

### 2026-04-20 — calibration-phase4-7 verify-* 스킬 갭 업데이트

- [ ] **[2026-04-20 skill-gap] 🟢 LOW calibration-plan-exportability.ts 전용 verify 없음** — `apps/frontend/lib/utils/calibration-plan-exportability.ts`는 verify-hardcoding Step 23 + verify-ssot로 커버. 별도 스킬 불필요.

### 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)

- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW verify-e2e — UL-QP-19-01 UI 다운로드 E2E 없음** — `wf-export-ui-download.spec.ts`에 `expectFileDownload(page, 'UL-QP-19-01')` 케이스 추가 권장. 현재는 API-level만 검증됨.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW verify-seed-integrity — shared-test-data.ts ITEM_013~022 없음** — 백엔드 seed에 item 추가했다면 E2E fixtures 동기화 필요.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 8 — axe-core E2E** — list/detail/create/Reject dialog 각 상태 violation 0 assertion.
- [ ] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 6 — Permission.EXPORT_REPORTS TE 정책 재확인** — test_engineer EXPORT_REPORTS 보유가 UL-QP-19-01에서 의도된 정책인지 절차서 확인 후 role-permissions 정책 결정.

### 2026-04-20 — calibration-phase4-7

- [ ] M4.8 계약 모순: CalibrationRecord.certificatePath는 M4.3(API 응답 호환성) 유지를 위해 보존 — contract에서 M4.3 vs M4.8 재검토 필요

### 2026-04-21 cleanup-0421 SHOULD 미충족 항목

- [ ] **[2026-04-21 tech-debt-batch-0421] S4 — ValidationCreateDialog.tsx 232줄** (SHOULD ≤150 초과) — FunctionItem 상태/핸들러 분리 시 점진적 축소 권장. 트리거: 해당 다이얼로그 수정 시.
