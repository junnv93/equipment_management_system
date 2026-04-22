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

### 2026-04-22 verify+review-architecture: approveReturn 패리티 후속

- [ ] **[2026-04-22 review-arch] 🟢 LOW approveReturn checkTeamPermission 미적용** — approveReturn에 EMC/RF 교차 금지(`checkTeamPermission`) 호출 없음. approve/rejectReturn과 달리 반납 최종 승인자에게 팀 분류 제약이 없음. 의도적 생략인지 확인 후, 의도 아니면 패턴 통일. 트리거: approveReturn 관련 작업 시.
- [ ] **[2026-04-22 verify-fsm] 🟢 LOW reject-return 컨트롤러 guard ↔ FSM permission 동기화 주석 누락** — `checkouts.controller.ts` reject-return 엔드포인트의 `@RequirePermissions(Permission.REJECT_CHECKOUT)`이 FSM `reject_return` 액션 권한과 대응됨을 명시하는 주석 없음. 트리거: controller permission 관련 작업 시.

### 2026-04-22 harness: checkout-arch-pr3-11 SHOULD 후속

- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW blocked 버튼 focus-visible 누락** — `workflow-panel.ts:49-52` `WORKFLOW_PANEL_TOKENS.action.blocked`에 `FOCUS_TOKENS.classes.default` 없음. primary 버튼에는 존재. 접근성 키보드 네비게이션 시 blocked 버튼 포커스 표시 미흡. 트리거: workflow-panel 접근성 작업 시.
- [x] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW self-audit ⑧ 기존 파일 7건 FSM 리터럴 위반** — ✅ 2026-04-22 fsm-literal-audit harness 분석 완료: 7개 파일 모두 CheckoutStatus FSM 값 아님. 5개(CreateEquipmentContent/ResultSection/CreateNC/NCDocuments/document-upload): Promise.allSettled JS 표준 'rejected'/'fulfilled'로 CSVal 변환 불가 (의미론적 오류). 2개(IntermediateCheckAlert:153,219): IntermediateCheckStatusKey 로컬 변수 비교, ESLint MemberExpression 규칙 비발동. NCDocumentsSection.tsx:78 `; self-audit-exception` 태그 추가 완료. pnpm lint PASS.
- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW .env.example 플래그 문서화 누락** — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false` 항목이 `.env.example`, `apps/frontend/.env.local.example`에 없음. 트리거: env 문서 업데이트 시.
- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟡 MEDIUM NextStepPanel 플래그 상시화** — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 2026-Q2 안정화 후 제거 예정. `isNextStepPanelEnabled()` 호출부 3곳 및 `checkout-flags.ts` 제거. 트리거: Q2 스프린트 시작 시.

### 2026-04-22 harness: checkout-lender-guard-p1p3 후속 (verify + review 결과)

- [ ] **[2026-04-22 p1p3] 🟡 MEDIUM rejectReturn 스코프 체크 순서 역전 (보안)** — `rejectReturn`(L1995~2023): `assertFsmAction` 호출이 `enforceScopeFromData`보다 앞에 위치. 스코프 외 사용자가 scope 차단 대신 FSM 오류 메시지를 먼저 받는 정보 노출. `approve`/`approveReturn`은 `enforceScopeFromCheckout`을 FSM 전에 호출. 수정: `assertFsmAction`을 `enforceScopeFromData` 이후로 이동. 트리거: rejectReturn 보안 리뷰 시.
- [ ] **[2026-04-22 p1p3] 🟡 MEDIUM submitConditionCheck step 리터럴 SSOT 위반** — `checkouts.service.ts` L2131-2207: `'lender_checkout'`/`'lender_return'` 문자열 리터럴 3개소 직접 비교. `ConditionCheckStepValues.LENDER_CHECKOUT`/`LENDER_RETURN` 상수로 교체 필요. `stepTransitions` 객체 키도 동일하게 교체. 트리거: submitConditionCheck 관련 작업 시.
- [ ] **[2026-04-22 p1p3] 🟢 LOW approve 테스트 mockDrizzle.where.then 오버라이드 패턴 비작동** — `describe('approve')` success/LENDER_TEAM_ONLY 테스트(spec lines 312-336, 390-405)가 `chain.where.then` 오버라이드를 사용하나 실제로 비작동 (`chain.where()` 반환값은 `chain` 객체 → `await chain`은 `chain.then` 사용). 현재 `findByIds` mock이 입력 무관하게 equipment 반환하여 우연히 통과. `mockChain.then` 패턴으로 통일 권장. 트리거: approve 테스트 수정 시.
- [ ] **[2026-04-22 p1p3] 🟢 LOW RENTAL reject_return 설계 갭 — FSM 명시적 결정 필요** — FSM `reject_return` 전이가 `purposes: CAL_REPAIR`만 허용, RENTAL 제외. RENTAL 반납 검사 실패 시 반려 불가한 도메인 갭. 의도적 설계라면 FSM 주석 추가 권장; RENTAL 반납 반려가 필요하다면 FSM에 rental 추가 + rejectReturn LENDER_TEAM_ONLY 복구 필요. 트리거: 렌탈 워크플로우 설계 검토 시.
- [ ] **[2026-04-22 p1p3] 🟢 LOW approveReturn scope 체크 비대칭 + checkTeamPermission 미적용** — `approveReturn`은 `enforceScopeFromCheckout`(추가 DB 쿼리) 사용, `approve`/`rejectReturn`은 `enforceScopeFromData`(쿼리 0). 또한 approveReturn에 EMC/RF 교차 금지 `checkTeamPermission` 미적용 (approve/rejectReturn과 달리). 의도적 생략인지 확인 후 패턴 통일 검토. 트리거: approveReturn 리팩토링 시.

### 2026-04-22 harness: NC-P4 GuidanceCallout 후속

- [ ] **[2026-04-22 nc-p4-guidance] 🟢 LOW help.status.completed / help.status.return_rejected — CheckoutStatus enum 미포함 상태** — UI 표시 전용(GuidanceCallout 등)으로 허용했으나, 장기적으로 `help.status.ui.*` 별도 네임스페이스로 분리 권고. 파일: `apps/frontend/messages/ko/checkouts.json`, `apps/frontend/messages/en/checkouts.json`. 트리거: i18n 네임스페이스 정리 작업 시.
- [x] **[2026-04-22 nc-p4-guidance] 🟢 LOW pre-existing ⑧ FSM 리터럴 7건 (NC/IntermediateCheck/document 영역)** — ✅ checkout-arch-pr3-11 항목과 동일. fsm-literal-audit 분석으로 닫힘. 모두 비-CSVal 도메인 (Promise.allSettled / UploadedFile UI / IntermediateCheckStatusKey). 전환 불필요, 기존 eslint-disable 예외 올바름.

### 2026-04-22 harness: fsm-literal-audit 후속

- [ ] **[2026-04-22 fsm-literal-audit] 🟢 LOW self-audit.md 문서 미반영** — `docs/references/self-audit.md`에 "7대 원칙"이라 명시되어 있으나 실제 스크립트는 ⑧(FSM 리터럴) + ⑨(hex 색상) 규칙을 추가로 보유. self-audit-exception 예외 메커니즘이 ⑧에 추가됐으나 문서에 없음. 트리거: self-audit.md 갱신 작업 시.

### 2026-04-22 harness: checkout-subtab-ia + checkout-subtab-ssot-fix 후속 (verify + review 결과)

- [ ] **[2026-04-22 subtab-ia] 🟢 LOW verify-zod: verifyHandoverToken @UseInterceptors 누락 (기존 파일)** — `checkouts.controller.ts:194`: `@ZodResponse` 있으나 메서드 단위 `@UseInterceptors(ZodSerializerInterceptor)` 없음 → Swagger만 바뀌고 실제 직렬화 안 됨. 트리거: ZodSerializerInterceptor 글로벌 승격 시 자동 해소.
- [ ] **[2026-04-22 subtab-ia] 🟢 LOW verify-i18n: guidance.urgency.normal 빈 문자열 (기존 파일)** — `checkouts.json` en/ko 양쪽 `guidance.urgency.normal` 빈 문자열. 런타임 호출 코드 없으나 키 채우거나 제거 필요. 트리거: GuidanceCallout urgency 기능 구현 시.
- [ ] **[2026-04-22 subtab-ia] 🟡 MEDIUM useQuery isError 분기 누락 (pre-existing) — OutboundCheckoutsTab + InboundCheckoutsTab** — `OutboundCheckoutsTab.tsx`: `checkoutsData.isLoading` 사용하나 `isError` 미처리. `InboundCheckoutsTab.tsx`: `inboundCheckoutsData`, `rentalImportsData`, `internalSharedImportsData` 세 쿼리 모두 `isError` 미처리. 네트워크 오류 시 빈 상태 UI와 구분 불가. `isError` 구조분해 + ErrorUI 분기 추가 필요. 트리거: checkout 탭 컴포넌트 수정 시.
