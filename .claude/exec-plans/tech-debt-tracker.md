# Tech Debt Tracker

## 형식
- [ ] {이슈} — {파일:라인} — {등록일}

---

## 미완료 항목

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
