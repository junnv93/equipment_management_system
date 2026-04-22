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

### 2026-04-21 harness: checkout-fsm-schemas PR-1 후속

- [x] **[2026-04-21 PR-1] 🟢 LOW canPerformAction 권한 매트릭스 5 role 미완성** — ✅ 2026-04-22 완료. quality_manager(조회전용 3케이스) + lab_manager(전체권한 4케이스) describe 블록 추가. 18/18 E2E PASS와 함께 검증.

### 2026-04-22 harness: checkout-fsm-backend PR-2 후속

- [x] **[2026-04-22 PR-2] 🔴 HIGH checkout-fsm E2E 격리 검증 필요** — ✅ 2026-04-22 완료. 18/18 PASS (라이브 DB). approve_return 테스트 기대값 수정 — guard APPROVE_CHECKOUT 강화로 `AUTH_INSUFFICIENT_PERMISSIONS` 반환 (이전: `CHECKOUT_FORBIDDEN`). 격리 완전 검증.
- [x] **[2026-04-22 PR-2] 🟢 LOW checkout service spec mockReq permissions 패턴 문서화** — ✅ 2026-04-22 완료. `docs/references/backend-patterns.md` "FSM assertFsmAction 서비스 테스트 픽스처 패턴" 섹션 추가.
- [x] **[2026-04-22 PR-2] 🟡 MEDIUM approve (최초 승인) 엔드포인트 guard 과소제어** — ✅ 2026-04-22 확인 결과 이미 APPROVE_CHECKOUT으로 설정됨. Evaluator가 잘못 보고. E2E 테스트 기대값(CHECKOUT_FORBIDDEN→AUTH_INSUFFICIENT_PERMISSIONS) 수정 완료.

### 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)

- [ ] **[2026-04-21 verify-workflows] 🟢 LOW UL-QP-18-11 UI 다운로드 E2E 미커버** — `wf-export-ui-download.spec.ts` 주석에 `implemented: false, backend exporter 미구현`으로 의도된 부채. 백엔드 exporter 구현 시 E2E 케이스 추가 필요.

### 2026-04-21 harness: 78-1 typo-primitives-checkout-ssot 후속 (review-architecture 권고)

- [x] **[2026-04-21 78-1] 🟡 MEDIUM `checkout.ts:197` `w-[18px] h-[18px]` 잔존** — ✅ 2026-04-21 checkout-78-round2 완료. `--spacing-step-dot` @theme + `DIMENSION_TOKENS.stepDot` 3-layer 적용.
- [x] **[2026-04-21 78-8] 🟢 LOW top-3 도메인 arbitrary text-[Npx] 53건 제거** — ✅ 2026-04-21 완료. MICRO_TYPO.meta(11px)/detail(13px) 신규 토큰 + globals.css @theme + primitives.ts 3-way SSOT 체인. non-conformance.ts(21건), audit.ts(18건), dashboard.ts(14건) 적용. display 크기(`text-[5rem]`/`text-[56px]`) 예외 유지.
- [x] **[2026-04-21 78-1] 🟢 LOW 잔여 design-tokens 도메인 arbitrary text-[Npx] ~37건** — ✅ 2026-04-22 완료. text-sm-wide(15px) 신규 3-layer 토큰 + MICRO_TYPO.siteTitle 추가. team/settings/approval/equipment/sidebar/calibration-plans/mobile-nav/software.ts 8개 파일 전량 처리. 11.5px→meta(11), 12.5px→text-xs(12) 라운딩. display 예외(5rem/56px) 보존.

- [x] CheckoutGroupCard 행 `div role="button"` → `<button type="button">` 시맨틱 교체 — ✅ 2026-04-21 checkout-78-round2 복원. 내부 `<Button>/<Link>` 중첩으로 `<button>` 사용 불가 (HTML5 spec). `div[role=button]` + WCAG 준수 패턴 유지 + 명시적 주석 추가.
- [x] **[2026-04-21 78-7] 🟡 MEDIUM InboundCheckoutsTab 전역 isLoading vs 섹션별 로딩 dead code** — ✅ 2026-04-21 checkout-78-round2 완료. 전역 가드 제거 + `isAnyLoading` 가드로 전체 빈상태 보호.
- [x] **[2026-04-21 78-7] 🟢 LOW EmptyState `useAuth()` 직접 호출 → props 주입 패턴** — ✅ 2026-04-21 checkout-78-round2 완료. `canAct?: boolean` prop 추가, useAuth 제거, 3 소비처 업데이트.

### 2026-04-21 harness: checkout-78-round2 후속 (S4/S2/S3 SHOULD 미완료)

- [x] **[2026-04-21 78-r2] 🟢 LOW renderLoadingState 중복 제거** — ✅ 2026-04-21 완료. `CheckoutListSkeleton`에 `label`/`srOnly` props + `aria-busy` 추가, 양 탭 파일의 로컬 함수 제거.
- [x] **[2026-04-21 78-r2] 🟢 LOW Overdue 배너 aria-label i18n + 앵커 포커스 이동** — ✅ 2026-04-21 완료. `overdueScrollAriaLabel`/`bannerClose` i18n 추출, `tabIndex={-1}` + `focus()` 추가.
- [x] **[2026-04-21 78-r2] 🟢 LOW skeleton label/srOnly 하드코딩 → i18n** — ✅ 2026-04-21 완료. `checkouts.loading.*` 8개 키 추가, `t()` 교체.
- [x] **[2026-04-21 78-r2] 🟢 LOW 배너 닫기 후 포커스 소실** — ✅ 2026-04-21 완료. WCAG 2.1 SC 2.4.3: rAF + pendingCheckRef 포커스 이전.

### 2026-04-22 harness: checkout-fsm-backend (PR-2) review-architecture 후속

- [x] **[2026-04-22 PR-2] 🟡 MEDIUM CHECKOUT_FORBIDDEN을 400→403으로 수정** — 완료 (db7f5be3)
- [x] **[2026-04-22 PR-2] 🟡 MEDIUM approve-return/reject-return 컨트롤러 가드 FSM과 정렬** — 완료 (db7f5be3)
- [x] **[2026-04-22 PR-2] 🟡 MEDIUM writeTransitionAudit 실패 명시적 로깅** — 완료 (refactor로 캡슐화 4c9db711)
- [x] **[2026-04-22] 🟡 MEDIUM approve guard VIEW_CHECKOUTS → APPROVE_CHECKOUT** — 완료 (4c9db711)
- [x] **[2026-04-22] 🟡 MEDIUM rejectReturn lenderTeam BadRequestException → ForbiddenException** — 완료 (d27fd09b)
- [x] **[2026-04-22] 🟡 MEDIUM ConflictException 4개 메서드 catch 블록 누락** — 완료 (d27fd09b)
- [x] **[2026-04-22 PR-2] 🟢 LOW CheckoutErrorCode enum 도입** — ✅ 2026-04-22 완료. `checkout-error-codes.ts` 신규 생성 (23개 코드, JSDoc), service.ts 인라인 30건 전환.
- [x] **[2026-04-22 PR-2] 🟢 LOW rejectReturn 스코프 검증 무조건 실행** — ✅ 2026-04-22 완료. `enforceScopeFromData` 호출을 approverTeamId 조건 밖으로 이동. 방어선 일관성 확보.
- [x] **[2026-04-22 PR-2] 🟢 LOW reject 엔드포인트 반려 사유 검증 이중 위치** — ✅ 2026-04-22 완료. controller.ts L465-470 중복 검증 블록 제거, 서비스 단일 경로로 통일.

### 2026-04-22 verify/review: checkouts-low-cleanup 후속

- [ ] **[2026-04-22 verify] 🟡 MEDIUM rejectReturn + approve lenderTeam 검증 approverTeamId 부재 시 바이패스** — `rejectReturn`의 `if (checkout.purpose === CPVal.RENTAL && checkout.lenderTeamId && rejectReturnDto.approverTeamId)` 조건에서 `approverTeamId`가 null/undefined이면 lenderTeam identity-rule 전체 스킵. `approve`도 동일한 구조(`approverTeamId = req.user?.teamId`, `if (... && approverTeamId)` 조건). 팀 미소속 사용자가 RENTAL 반출 승인/반려 가능한 경로. 수정: `approverTeamId` 유무와 무관하게 RENTAL + lenderTeamId 존재 시 검증 강제 — `if (!approverTeamId || approverTeamId !== checkout.lenderTeamId)` 패턴. 트리거: checkout 승인/반려 관련 작업 시.
- [ ] **[2026-04-22 verify] 🟢 LOW rejectReturn items 빈 경우 스코프 검증 묵시적 통과** — `firstEquip`가 없으면 `enforceScopeFromData` 전체 스킵. `approve`도 동일 패턴 공유. 데이터 무결성 결함 상황에서 unauthorized 상태 전이 가능. NO_EQUIPMENT 가드 추가 고려. 트리거: rejectReturn/approve 관련 작업 시.
