# Tech Debt Tracker

## 형식
- [ ] {이슈} — {파일:라인} — {등록일}

---

## 미완료 항목

- [ ] EventEmitter2 emit 페이로드 검증 누락 — `notifications/__tests__/notification-dispatcher.spec.ts` — 2026-04-01
- [ ] ReportExportService CSV 포맷 `buffer.length > 0` 단언 누락 — `reports/__tests__/report-export.service.spec.ts` — 2026-04-01
- [ ] EquipmentForm.tsx `isManager: _isManager` 미사용 destructuring 정리 — `components/equipment/EquipmentForm.tsx:231` — 2026-04-02
- [ ] E2E 테스트 주석에서 `isManager()` 참조를 permission 기반으로 업데이트 — `tests/e2e/features/non-conformances/repair-workflow/` — 2026-04-02

---

## 완료 항목

(없음)
