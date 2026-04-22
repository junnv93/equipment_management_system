# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

- [ ] **[2026-04-15 docker-infra-standards] Phase K — 백업·DR** (pg_dump cron + 복원 리허설 CI + runbook). 프로덕션 사용자 발생 시점.

### 2026-04-17 harness: QR Phase 1-3 후속 정리

- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] 기존 class-DTO 점진 마이그레이션 잔여** — 2026-04-21 기준 대규모 전환 완료 (calibration/data-migration/settings/equipment/notifications/teams). 잔여 미전환 DTO는 해당 모듈 작업 시 기회가 될 때 전환. 트리거: `any`/Swagger-TS drift/Zod+class 중복.

### 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)

- [ ] **[2026-04-21 verify-workflows] 🟢 LOW UL-QP-18-11 UI 다운로드 E2E 미커버** — `wf-export-ui-download.spec.ts` 주석에 `implemented: false, backend exporter 미구현`으로 의도된 부채. 백엔드 exporter 구현 시 E2E 케이스 추가 필요.

### 2026-04-22 verify/review: checkouts-low-cleanup 후속

- [x] **[2026-04-22 verify] 🟡 MEDIUM rejectReturn + approve lenderTeam 검증 approverTeamId 부재 시 바이패스** — 완료: `checkout-lender-guard` harness. `approve` L1449, `rejectReturn` L2032에서 RENTAL+lenderTeamId 조건 시 `!approverTeamId` 분기 추가하여 팀 미소속 사용자도 LENDER_TEAM_ONLY로 거부.
- [x] **[2026-04-22 verify] 🟢 LOW rejectReturn items 빈 경우 스코프 검증 묵시적 통과** — 완료: `checkout-lender-guard` harness. `approve` L1423, `rejectReturn` L2009에 NO_EQUIPMENT 가드 추가.

### 2026-04-22 harness: checkout-lender-guard SHOULD 후속

- [ ] **[2026-04-22 checkout-lender-guard] 🟢 LOW rejectReturn LENDER_TEAM_ONLY 회귀 테스트 누락** — `describe('rejectReturn')` 블록에 RENTAL+lenderTeamId+팀미소속 사용자 → ForbiddenException 케이스 없음. M2 구현은 정상. 참고: `reject_return` FSM은 CAL_REPAIR 전용이므로 현재 RENTAL 경로는 assertFsmAction에서 선차단되나, 향후 FSM 변경 시 silent regression 가능. 트리거: rejectReturn 관련 작업 시.

### 2026-04-22 verify+review-architecture: approveReturn 패리티 후속

- [ ] **[2026-04-22 review-arch] 🟡 MEDIUM approveReturn NO_EQUIPMENT 가드 누락** — `approveReturn`에서 `getCheckoutItemsWithFirstEquipment` 결과 items가 빈 경우 가드 없음. `updateStatusBatch([])` 호출 → checkout은 `return_approved` 전이되지만 equipment는 `checked_out` 유지 (데이터 정합성 오류). approve/rejectReturn에 추가한 NO_EQUIPMENT 패턴과 동일하게 `items.length === 0` 시 BadRequestException 추가 필요. 트리거: approveReturn 관련 작업 시.
- [ ] **[2026-04-22 review-arch] 🟢 LOW rejectReturn checkTeamPermission guard 구조 불일치** — `rejectReturn` L2018: `if (approverTeamId) { checkTeamPermission loop }` — approve는 approverTeamId 없어도 루프 실행(내부 noop). 현재는 동일 결과이나, checkTeamPermission이 "팀 미소속 = DENY"로 강화되면 rejectReturn은 상속 누락. approve 패턴처럼 루프를 approverTeamId 조건 밖으로 이동하고 classification 조회만 조건부 유지 권장. 트리거: rejectReturn 관련 작업 시.
- [ ] **[2026-04-22 review-arch] 🟢 LOW approveReturn checkTeamPermission 미적용** — approveReturn에 EMC/RF 교차 금지(`checkTeamPermission`) 호출 없음. approve/rejectReturn과 달리 반납 최종 승인자에게 팀 분류 제약이 없음. 의도적 생략인지 확인 후, 의도 아니면 패턴 통일. 트리거: approveReturn 관련 작업 시.
- [ ] **[2026-04-22 verify-fsm] 🟢 LOW reject-return 컨트롤러 guard ↔ FSM permission 동기화 주석 누락** — `checkouts.controller.ts` reject-return 엔드포인트의 `@RequirePermissions(Permission.REJECT_CHECKOUT)`이 FSM `reject_return` 액션 권한과 대응됨을 명시하는 주석 없음. 트리거: controller permission 관련 작업 시.

### 2026-04-22 harness: checkout-arch-pr3-11 SHOULD 후속

- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW blocked 버튼 focus-visible 누락** — `workflow-panel.ts:49-52` `WORKFLOW_PANEL_TOKENS.action.blocked`에 `FOCUS_TOKENS.classes.default` 없음. primary 버튼에는 존재. 접근성 키보드 네비게이션 시 blocked 버튼 포커스 표시 미흡. 트리거: workflow-panel 접근성 작업 시.
- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW self-audit ⑧ 기존 파일 7건 FSM 리터럴 위반** — `CreateEquipmentContent.tsx:115`, `ResultSectionFormDialog.tsx:154`, `CreateNonConformanceForm.tsx:145`, `NCDocumentsSection.tsx:78`, `IntermediateCheckAlert.tsx:153,219`, `document-upload-utils.ts:59`. 각 파일에서 `status === '<literal>'` 비교를 `CSVal.*` 상수로 전환 필요. 트리거: 해당 파일 수정 시.
- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW .env.example 플래그 문서화 누락** — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false` 항목이 `.env.example`, `apps/frontend/.env.local.example`에 없음. 트리거: env 문서 업데이트 시.
- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟡 MEDIUM NextStepPanel 플래그 상시화** — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 2026-Q2 안정화 후 제거 예정. `isNextStepPanelEnabled()` 호출부 3곳 및 `checkout-flags.ts` 제거. 트리거: Q2 스프린트 시작 시.
