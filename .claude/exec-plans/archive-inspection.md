# Tech Debt Tracker — 아카이브: 점검 도메인

자체점검 / 중간점검 / 점검 양식 완료 항목 기록.
활성 TODO는 [tech-debt-tracker.md](./tech-debt-tracker.md) 참조.

---

## 2026-05-02 — inspection-pr2-pr3-closure 후속 완료 2건

### inspection-pr2-pr3 Evaluator CONDITIONAL PASS 후속

- [x] **[2026-05-02 inspection-pr2] 🟢 LOW inspection-checkitem-row-base-token-split** — ✅ 완료 (commit a951015d). `rowBaseDecoration` 토큰 신설 + `SelfInspectionFormDialog.tsx:638` 인라인 → 토큰 경유. `lib/design-tokens/components/inspection.ts` SSOT 드리프트 제거. ToggleGroup primitive와 일관된 토큰 체인.
- [x] **[2026-05-02 inspection-pr2] 🟢 LOW toggle-group-dark-mode-primitive-color** — ✅ 완료 (commit a951015d). `judgmentToggle.itemPass/Fail/Na` + `INSPECTION_OVERALL_RESULT_TOGGLE.itemPass/Fail`에 `dark:data-[state=on]:bg-emerald-950/30 + text-emerald-400 + ring-emerald-800` 추가. outOfSpec 기존 패턴과 다크모드 일관성 확보.
