# Tech Debt Tracker

## 형식
- [ ] {이슈} — {파일:라인} — {등록일}

---

## 미완료 항목

- [ ] Form export 5 보조 exporter (intermediate/self/checkout/software-validation/equipment-import)의 team-scope 데이터 경계 미강제 — `enforceReportScope`가 진입에서 cross-border는 차단하지만 team-scoped 사용자가 `?id=X`로 단일 item 조회 시 post-query는 `filter.site`만 체크 → 다른 팀 item도 반환 가능. 각 exporter SQL에 `equipment.teamId` 노출 후 `filter.teamId` 체크 추가 필요 — `apps/backend/src/modules/reports/form-template-export.service.ts:370-380, 530-540, 750-770, 1050-1070, 1465-1480` — 2026-04-08
- [ ] 체크아웃/교정 detail mutation 버튼 `hasRole()` → `can(Permission.X)` 마이그레이션 (SSOT 준수) — `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx:88`, `components/equipment/CalibrationHistoryTab.tsx:87` — 2026-04-08
- [ ] `@AuditLog({action:'export'})` interceptor가 ForbiddenException 경로에서도 감사 로그 남기도록 확인 — 성공 경로만 로깅 시 cross-site 공격 probing이 감사에 안 남음 — `apps/backend/src/modules/reports/reports.controller.ts:380-410`, `common/interceptors/audit-log.interceptor.ts` — 2026-04-08
- [ ] `SiteScopeInterceptor`와 `enforceReportScope` 통합 검토 — 두 파일이 유사한 "cross-site 차단" 정책을 각자 구현. 하나의 정책 엔진으로 수렴 가능 — `common/interceptors/site-scope.interceptor.ts`, `modules/reports/utils/report-scope-enforcement.ts` — 2026-04-08
- [ ] WF-25 spec assertion 본 경로 활성화 — TE 사용자 대상 calibration_due 알림(linkUrl=/equipment/...) deterministic 시딩 + D-day 배지 soft assertion 추가 — `apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts` — 2026-04-08
- [ ] WF-35 spec: `page.locator('textarea').first()` → `getByRole('textbox')` 대체 — `apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts:50` — 2026-04-08
- [ ] WF-35 spec: `waitForTimeout(1_500)` → `expect.poll` 기반 refetch 대기로 결정성 향상 — `apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts:105` — 2026-04-08
- [ ] `shared-test-data.ts`에 `FRONTEND_URL` 상수 추가 + WF-35 spec 의 `'http://localhost:3000'` 폴백 치환 — `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts`, `wf-35-cas-ui-recovery.spec.ts:30` — 2026-04-08
- [ ] 백엔드 NC Redis detail 캐시가 `updateWithVersion` 409 실패 경로에서도 무효화되는지 확인 (stale → 재시도 재-409 flakiness 방지) — `apps/backend/src/modules/non-conformances/non-conformances.service.ts` — 2026-04-08
- [x] form-templates-ui.spec.ts beforeAll 시드 race condition — 해결: 2026-04-07 — `fix/form-templates-seed-race` — create 409 시 replace 폴백 재시도
- [x] Mobile Chrome viewport에서 sticky header가 form-templates 테이블 row 액션 가로챔 — 해결: 2026-04-07 — TC-UI-04/05에서 `scrollIntoView({block: 'center'})`로 버튼을 화면 중앙 배치 후 클릭 (Playwright 기본 `scrollIntoViewIfNeeded`는 'nearest'라 sticky header 아래에 걸림)

- [x] team-filtering E2E 테스트 재작성 (URL param 기반) — 해결: 2026-04-05 — 4파일 skip → 1파일 URL param 기반으로 통합
- [x] 대시보드 탭 testIgnore 패턴 정리 — 해결: 2026-04-05 — `**/overdue-auto-nc/**`로 수정

- [x] 날짜 검증 메시지 하드코딩 → VM.date.invalidYMD — 해결: 2026-04-05 — create/update-validation.dto.ts 4곳 교체
- [x] countActiveFilters 함수 누락 — 해결: 2026-04-05 — software-filter-utils.ts에 추가
- [x] ApiTestSoftwareFilters 인터페이스 미정의 — 해결: 2026-04-05 — 불필요 (toApiFilters가 TestSoftwareQuery 반환)
- [x] SoftwareValidationsController @SiteScoped 미적용 — 해결: 2026-04-05 — @SiteScoped + 사이트 스코프 필터링 추가
- [x] QUERY_CONFIG TEST_SOFTWARE_DETAIL 분리 필요 — 해결: 2026-04-05 — TEST_SOFTWARE_DETAIL strategy 추가
- [x] 유효성확인 첨부파일 UI (ValidationAttachments 컴포넌트) — 해결: 2026-04-05 — ValidationDetailContent.tsx에 인라인 구현
- [x] 프론트엔드 권한 게이팅 미적용 (소프트웨어 페이지) — 해결: 2026-04-05 — software/layout.tsx 서버사이드 권한 체크
- [x] 백엔드 문서 업로드/삭제 시 부모 validation status=draft 검증 미적용 — 해결: 2026-04-05 — document.service.ts ensureValidationIsDraft()

---

## 완료 항목

- [x] getPendingChecks 엔드포인트 Zod validation pipe 누락 — 해결: 2026-04-02 — `pending-checks-query.dto.ts` 생성

- [x] EventEmitter2 emit 페이로드 검증 누락 — 해결: 2026-04-02 — `fix/tech-debt-test-assertions`
- [x] ReportExportService CSV 포맷 `buffer.length > 0` 단언 누락 — 해결: 2026-04-02 — `fix/tech-debt-test-assertions`
- [x] EquipmentForm.tsx `isManager: _isManager` 미사용 destructuring 정리 — 해결: 2026-04-02 — PR #66
- [x] E2E 테스트 주석에서 `isManager()` 참조를 permission 기반으로 업데이트 — 해결: 2026-04-02 — PR #66
- [x] `isManager`/`isAdmin` 함수 use-auth.ts에서 제거 — 해결: 2026-04-02 — `refactor/remove-unused-role-checks`
- [x] equipment.json(en/ko) `softwareHistory.*` 레거시 i18n 키 블록 제거 — 해결: 2026-04-05
- [x] E2E 테스트 payload stale softwareVersion — 이전 커밋에서 이미 정리됨 확인: 2026-04-05
