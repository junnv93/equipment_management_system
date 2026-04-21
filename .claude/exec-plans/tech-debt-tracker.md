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

### 2026-04-21 harness: 78-1 typo-primitives-checkout-ssot 후속 (review-architecture 권고)

- [ ] **[2026-04-21 78-1] 🟡 MEDIUM `checkout.ts:197` `w-[18px] h-[18px]` 잔존** — `CHECKOUT_MINI_PROGRESS.dot.base`의 스텝 원 크기. 78-3에서 MiniProgress 재설계 시 `--spacing-step-dot: 18px` @theme 등록 + named utility 교체. 선행 작업: 78-3 RentalFlowInline 재설계 완료 후.
- [ ] **[2026-04-21 78-1] 🟢 LOW 전체 design-tokens 도메인 arbitrary text-[Npx] 90건 제거** — non-conformance.ts(19), audit.ts(18), dashboard.ts(16), team.ts(14), settings.ts(8), approval.ts(5), equipment.ts(4), sidebar.ts(2), 기타(4). 도메인별 78차 스타일 패치 방식으로 순차 제거. 78-7 이후 별도 tech-debt 세션 권고.



- [ ] CheckoutGroupCard 행 `div role="button"` → `<button type="button">` 시맨틱 교체 — apps/frontend/components/checkouts/CheckoutGroupCard.tsx — 2026-04-21
- [ ] **[2026-04-21 78-7] 🟡 MEDIUM InboundCheckoutsTab 전역 isLoading vs 섹션별 로딩 dead code** — L211 전역 가드 통과 후 L248/290/392 섹션별 `isLoading` 체크가 항상 false. 전역 가드 제거 + 섹션별 스켈레톤 전환으로 섹션 독립성 살리기. 파일: `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
- [ ] **[2026-04-21 78-7] 🟢 LOW EmptyState `useAuth()` 직접 호출 → props 주입 패턴** — `apps/frontend/components/shared/EmptyState.tsx`가 내부에서 `useAuth()` 직접 호출하여 테스트 가용성 이슈. 부모 컴포넌트에서 `permission` prop 또는 `canAct` bool prop으로 전달하는 패턴으로 전환 권고.
