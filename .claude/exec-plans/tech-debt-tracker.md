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

### 2026-04-21 — tech-debt-batch-0421d 후속 (verify-implementation + review-architecture 발견 항목)

- [ ] **[2026-04-21 review-architecture] 🟡 MEDIUM `security.controller.ts` lineNumber PG integer 범위 미검증** — CSP number 타입 lineNumber를 `Math.trunc()`만 적용하고 PG integer 최대값(2,147,483,647) 초과 미검증. 미니파이 번들 고라인 넘버 수신 시 DB INSERT 실패 → `saveReport()` 무음 흡수 → CSP report 유실. 수정: `Math.min(Math.trunc(rawLine), 2_147_483_647)` 클램프 추가. 파일: `apps/backend/src/modules/security/security.controller.ts`
- [ ] **[2026-04-21 verify-implementation] 🟡 MEDIUM `LoginPageContent.tsx` 하드코딩 한국어 문자열** — L269-271 "로그인"·"계정으로 로그인하여 계속하세요" + L53 "or" 미번역. `tLogin('title')` / `tLogin('subtitle')` / `tLogin('or')` 키 추가 필요. 파일: `apps/frontend/components/auth/LoginPageContent.tsx`, `apps/frontend/messages/{ko,en}/auth.json`
- [ ] **[2026-04-21 verify-implementation] 🟢 LOW `security.service.spec.ts` `as never` 타입 단언** — L21 `mockDb as never`를 `as unknown as AppDatabase`로 교체하여 타입 안전성 향상. 파일: `apps/backend/src/modules/security/__tests__/security.service.spec.ts`


