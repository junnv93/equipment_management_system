# Tech Debt Tracker

## 형식
- [ ] {이슈} — {파일:라인} — {등록일}

---

## 미완료 항목

- [ ] 날짜 검증 메시지 하드코딩 → VM.date.invalidYMD — `create-validation.dto.ts:5`, `update-validation.dto.ts:12,20` — 2026-04-05
- [ ] countActiveFilters 함수 누락 — `apps/frontend/lib/utils/software-filter-utils.ts` — 2026-04-05
- [ ] ApiTestSoftwareFilters 인터페이스 미정의 — `apps/frontend/lib/utils/software-filter-utils.ts` — 2026-04-05
- [ ] SoftwareValidationsController @SiteScoped 미적용 — `software-validations.controller.ts` — 2026-04-05
- [ ] QUERY_CONFIG TEST_SOFTWARE_DETAIL 분리 필요 — `query-config.ts` — 2026-04-05
- [x] 유효성확인 첨부파일 UI (ValidationAttachments 컴포넌트) — 해결: 2026-04-05 — ValidationDetailContent.tsx에 인라인 구현
- [ ] 프론트엔드 권한 게이팅 미적용 (소프트웨어 페이지) — `/software` 전체 — 2026-04-05
- [ ] 백엔드 문서 업로드/삭제 시 부모 validation status=draft 검증 미적용 — `DocumentsController`, `DocumentService` — 2026-04-05

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
