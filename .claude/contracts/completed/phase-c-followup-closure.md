# 스프린트 계약: Phase C Followup Closure

## 생성 시점
2026-05-08T00:00:00+09:00

## 슬러그
`phase-c-followup-closure`

## 배경

`calibration-cert-phase-a-architecture-closure` 자기검토 #3 라운드 5건 후속 통합 closure. 4건 valid (Item A/B/C/D) + 1건 STALE (`ul-qp-18-02-export-renderer` — 사전 구현 완료). 자세한 배경/결정 근거는 `.claude/exec-plans/active/2026-05-08-phase-c-followup-closure.md` 참조.

본 contract 는 self-contained 입니다 — Evaluator 는 추가 컨텍스트 없이 본 파일 + 변경 파일만으로 판정 가능해야 합니다.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### M-1 ~ M-4 빌드/타입/테스트 게이트
- [ ] **M-1** `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] **M-2** `pnpm --filter backend run tsc --noEmit` 에러 0 (회귀 차단 — 본 sprint 는 frontend-only 지만 packages/shared-constants 변경 영향)
- [ ] **M-3** `pnpm --filter frontend run test` 전체 PASS (기존 + 신규 RTL/unit)
- [ ] **M-4** `pnpm --filter backend run test` 기존 PASS (회귀 차단)

#### M-5 ~ M-8 SSOT 라우트 (Item A)
- [ ] **M-5** `packages/shared-constants/src/frontend-routes.ts` 에 `REPAIR_HISTORY` 키 추가 — `grep -c "REPAIR_HISTORY:" packages/shared-constants/src/frontend-routes.ts` ≥ 1
- [ ] **M-6** `packages/shared-constants/src/frontend-routes.ts` 에 `CALIBRATION_FACTORS` 키 추가 — `grep -c "CALIBRATION_FACTORS:" packages/shared-constants/src/frontend-routes.ts` ≥ 1
- [ ] **M-7** 신규 키가 `EQUIPMENT` 객체 내부에 위치 — 빌더 시그니처 `(id: string) =>` 패턴 일관 (`grep -c "REPAIR_HISTORY: (id: string)" packages/shared-constants/src/frontend-routes.ts` ≥ 1 AND `grep -c "CALIBRATION_FACTORS: (id: string)" packages/shared-constants/src/frontend-routes.ts` ≥ 1)
- [ ] **M-8** `NON_CONFORMANCES` 신규 키 추가 금지 (기존 `NON_CONFORMANCES: (id: string)` 재사용) — `grep -c "EQUIPMENT.NON_CONFORMANCE:" packages/shared-constants/src/frontend-routes.ts` = 0 (singular 신규 추가 차단)

#### M-9 ~ M-12 3 도메인 Tab footer link (Item A)
- [ ] **M-9** `MaintenanceHistoryTab.tsx` 에 `FRONTEND_ROUTES.EQUIPMENT.REPAIR_HISTORY` 사용 — `grep -c "FRONTEND_ROUTES.EQUIPMENT.REPAIR_HISTORY" apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` ≥ 1
- [ ] **M-10** `CalibrationFactorsTab.tsx` 에 `FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_FACTORS` 사용 — `grep -c "FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_FACTORS" apps/frontend/components/equipment/CalibrationFactorsTab.tsx` ≥ 1
- [ ] **M-11** `IncidentHistoryTab.tsx` 에 `FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES` 사용 — `grep -c "FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES" apps/frontend/components/equipment/IncidentHistoryTab.tsx` ≥ 1
- [ ] **M-12** 3 tab 파일에 raw path 인라인 0건 (footer link 컨텍스트 한정 — IncidentHistoryTab 의 기존 L666 인라인 `<Link href={\`/equipment/${equipmentId}/repair-history\`}>` 는 본 sprint 범위 외 — out-of-scope, 회귀 비검사). 검증: footer link 추가 영역에서만 raw path 0건 — `grep -E "href=\"?\\\\?\`/equipment/.*/repair-history\\\\?\`\"?" apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` = 0 AND 동일 패턴 CalibrationFactorsTab/IncidentHistoryTab 에서 footer 링크 영역만 raw path 0건

#### M-13 ~ M-15 i18n parity (Item A)
- [ ] **M-13** `apps/frontend/messages/ko/equipment.json` 에 3 신규 키 모두 — `grep -c "\"viewAllLink\"" apps/frontend/messages/ko/equipment.json` ≥ 4 (기존 `calibrationHistoryTab.viewAllLink` 1 + 신규 3)
- [ ] **M-14** `apps/frontend/messages/en/equipment.json` 에 3 신규 키 모두 — `grep -c "\"viewAllLink\"" apps/frontend/messages/en/equipment.json` ≥ 4
- [ ] **M-15** ko/en parity — `grep "\"viewAllLink\"" apps/frontend/messages/ko/equipment.json | wc -l` 과 en 같은 명령 결과가 동일

#### M-16 ~ M-18 fetch hook (Item B)
- [ ] **M-16** `apps/frontend/hooks/use-equipment-calibrations.ts` 파일 존재 — `test -f apps/frontend/hooks/use-equipment-calibrations.ts && echo OK`
- [ ] **M-17** `CalibrationHistoryTab.tsx` 가 hook 사용 — `grep -c "useEquipmentCalibrations\b" apps/frontend/components/equipment/CalibrationHistoryTab.tsx` ≥ 1 AND `grep -c "calibrationApi.getEquipmentCalibrations" apps/frontend/components/equipment/CalibrationHistoryTab.tsx` = 0
- [ ] **M-18** `CalibrationHistoryClient.tsx` 가 hook 사용 — `grep -cE "useEquipmentCalibrations\b|useEquipmentCalibrationHistory\b" apps/frontend/components/equipment/CalibrationHistoryClient.tsx` ≥ 1 AND `grep -c "calibrationApi.getCalibrationHistory" apps/frontend/components/equipment/CalibrationHistoryClient.tsx` = 0  (정정 v2: hook 이름은 `Calibration` + `History` 도메인 합성어 — 원 grep 패턴은 `Calibrations`(s) + optional `History` 가정으로 mis-write 됨)

#### M-19 ~ M-21 필터 URL sync (Item C)
- [ ] **M-19** `CalibrationHistoryClient.tsx` 가 `useSearchParams` import + 호출 — `grep -c "useSearchParams" apps/frontend/components/equipment/CalibrationHistoryClient.tsx` ≥ 2 (import + call)
- [ ] **M-20** `CalibrationHistoryClient.tsx` 가 `router.replace` 사용 — `grep -c "router.replace\|\\.replace(" apps/frontend/components/equipment/CalibrationHistoryClient.tsx` ≥ 1
- [ ] **M-21** 4 필터 (`approvalFilter` / `resultFilter` / `dateFrom` / `dateTo`) 가 `useState` 로 정의되지 않음 — `grep -cE "useState[^(]*\\(\\s*''\\s*\\)" apps/frontend/components/equipment/CalibrationHistoryClient.tsx` 는 sprint 시작 대비 4 감소 (또는 절대값 검증: `awk '/const \\[approvalFilter|const \\[resultFilter|const \\[dateFrom|const \\[dateTo/' apps/frontend/components/equipment/CalibrationHistoryClient.tsx | grep -c "useState"` = 0)

#### M-22 ~ M-25 e2e (Item D)
- [ ] **M-22** spec 파일 존재 — `test -f apps/frontend/tests/e2e/workflows/wf-equipment-calibration-history-sub-route.spec.ts && echo OK`
- [ ] **M-23** ≥ 3 `test('...', ...)` 케이스 — `grep -cE "^\\s*test\\(" apps/frontend/tests/e2e/workflows/wf-equipment-calibration-history-sub-route.spec.ts` ≥ 3
- [ ] **M-24** scope 격리 — `loginAs.*systemAdmin` 사용 0건 (도메인 역할 fixture 사용) — `grep -c "loginAs.*systemAdmin\|systemAdminPage" apps/frontend/tests/e2e/workflows/wf-equipment-calibration-history-sub-route.spec.ts` = 0
- [ ] **M-25** auth fixture import — `grep -c "from '../shared/fixtures/auth.fixture'" apps/frontend/tests/e2e/workflows/wf-equipment-calibration-history-sub-route.spec.ts` ≥ 1

#### M-26 ~ M-28 tracker 정합화 (Phase 5)
- [ ] **M-26** tracker 에서 4 sprint 항목 closure 표시 (또는 제거) — `grep -cE "^\\s*-\\s*\\[ \\].*tab-footer-link-other-domains|^\\s*-\\s*\\[ \\].*equipment-calibration-fetch-hook|^\\s*-\\s*\\[ \\].*calibration-history-filter-url-sync|^\\s*-\\s*\\[ \\].*sub-route-navigation-e2e-coverage" .claude/exec-plans/tech-debt-tracker.md` = 0
- [ ] **M-27** tracker 에서 STALE 항목도 처리 — `grep -cE "^\\s*-\\s*\\[ \\].*ul-qp-18-02-export-renderer" .claude/exec-plans/tech-debt-tracker.md` = 0
- [ ] **M-28** archive 에 sprint batch row 추가 — `grep -c "phase-c-followup-closure" .claude/exec-plans/tech-debt-tracker-archive.md` ≥ 1 AND `grep -cE "^\\s*-\\s*\\[x\\].*(tab-footer-link-other-domains|equipment-calibration-fetch-hook|calibration-history-filter-url-sync|sub-route-navigation-e2e-coverage|ul-qp-18-02-export-renderer)" .claude/exec-plans/tech-debt-tracker-archive.md` ≥ 5 (5 항목 archive batch row 명시)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] **S-1** Bundle size delta < 5KB — Item A 3 footer link + Item B hook 추출 + Item C 인라인 헬퍼 합산. 검증: `pnpm --filter frontend run build` 출력의 변경 chunk 크기 비교 (manual review 또는 `du -sb .next/static/chunks/`).
- [ ] **S-2** Item D e2e spec 런타임 < 30s — `pnpm --filter frontend exec playwright test wf-equipment-calibration-history-sub-route` 출력의 `Slow test` warning 0 + 전체 duration < 30000ms.
- [ ] **S-3** No unused imports / dead code — `pnpm --filter frontend run lint` 신규 warning 0.
- [ ] **S-4** Sub-route 로컬 dev 진입 < 2s — `time curl -s http://localhost:3000/equipment/<seed-id>/calibration-history -o /dev/null` < 2000ms (선택적, 로컬 dev 서버 가동 시만 검증).
- [ ] **S-5** review-architecture Critical 이슈 0개 (Phase 1~3 변경 후 자동 호출 시).
- [ ] **S-6** review-design 점수 >= 60 (footer link a11y 패턴 일관성 — `CalibrationHistoryTab` 미러).

### 적용 verify 스킬 (Evaluator 자동 선택)

본 sprint 변경 영역 기반 자동 적용:
- **verify-frontend-state** Step 39/40 — 4 필터 URL SSOT, useState 이중관리 차단
- **verify-i18n** — ko/en parity (M-13~15 보완)
- **verify-ssot** Step 37 — FRONTEND_ROUTES SSOT 회귀 (M-5~8 보완)
- **verify-hardcoding** — raw path 인라인 차단 (M-12 보완)
- **verify-design-tokens** — footer link className 토큰 사용 (`CalibrationHistoryTab` 일관)
- **verify-e2e** Step 23/24/25 — actor token 격리, fixture 권한 격리 (M-24 보완)

---

### contract grep 패턴 작성 규칙 (회귀 차단 + Prettier 포맷 무관)

본 contract 는 다음 규칙 준수:
1. **분리 카운트** — `"key1"` 와 `"key2"` 를 동시 검사 시 `A.*B` 단일라인 패턴 금지, 각 키를 `grep -c '"key"'` 로 독립 카운트.
2. **multiline 회피** — 메서드 본체 검증 시 `awk '/async funcName/,/^  }$/'` 추출 후 grep, 파일 전체 grep 금지.
3. **production-only** — `--exclude='*.spec.ts'` 추가 가능 (회귀 spec 제외 시).
4. **주석 라인 제외** — `grep -vE "^\\s*\\*|^\\s*//"`.
5. **Reality-tested** — 모든 grep 패턴은 본 contract 작성 시점에 실제 reference 파일 (`CalibrationHistoryTab.tsx`, `frontend-routes.ts` 등) 에서 동작 검증됨.

---

## Out-of-scope (Evaluator 가 FAIL 처리하지 말 것)

다음 항목은 본 sprint 의 명시적 비목표 — 발견되어도 FAIL 사유 아니며 SHOULD 도 아님:

1. **Tab vs Sub-route 아키텍처 결정** — tracker 자기검토 #3 에 별도 항목으로 잔존. architectural decision 후 별도 sprint trigger.
2. **`RepairHistoryClient` / `CalibrationFactorsClient` / `NonConformanceManagementClient` 의 필터 URL 동기화** — 본 sprint 는 `CalibrationHistoryClient` 한정.
3. **다른 도메인(test-software / software-validation 등) Tab footer link** — 본 sprint 는 명시 3 도메인(Maintenance/CalibrationFactors/Incident) 한정.
4. **Backend endpoint 통합** — `getEquipmentCalibrations` 와 `getCalibrationHistory` 의 backend 통합. 응답 shape 차이는 영구 trade-off로 수용.
5. **`EquipmentForm.tsx` 의 `getEquipmentCalibrations` imperative 호출 hook 변환** — useQuery 패턴과 무관 (form submit 콜백 내부).
6. **`IncidentHistoryTab.tsx` L666 의 기존 인라인 `<Link href={\`/equipment/${equipmentId}/repair-history\`}>`** — 본 sprint footer link 추가와 별개 surgical 항목, 후속 sprint trigger.
7. **footer link className design token 추출** — `CalibrationHistoryTab` 도 인라인 className 사용 중 (token 추출은 별도 design system sprint).
8. **`BasicInfoTab.tsx` 의 hook 적용 강제** — Phase 2 에서 호환 안 될 시 보류 + tech-debt 등록만 (강제 변환 시 회귀 위험).
9. **`useEquipmentCalibrations` 의 hook signature 형태** — 단일 hook + variant 분기 vs 두 hook 별도 export — Generator 결정 위임. 둘 중 하나 선택 시 정합 검증 (M-17/M-18 grep 패턴이 양쪽 호환).
10. **`shared-test-data.ts` 신규 상수 추가** — 기존 `TEST_EQUIPMENT_IDS` 재사용.

---

## 종료 조건

- **PASS**: M-1 ~ M-28 전체 PASS → 성공
- **FAIL → 재진입**: 1개 이상 MUST 실패 → 수정 지시 후 다음 iteration
- **2회 연속 동일 FAIL**: 설계 문제 가능성 — 사용자 개입 요청
- **3 iteration 초과**: 사용자 개입 요청
- **SHOULD 실패**: 종료 조건 영향 없음, tech-debt-tracker.md 신규 항목으로 등록

---

## 이전 sprint 와의 차이 (Evaluator 컨텍스트 정합)

- 본 sprint 는 `calibration-cert-phase-a-architecture-closure` (commit `80e77488` ~ `phase-a-arch-followup`) 의 직접 후속이며 동일 도메인.
- `CALIBRATION_HISTORY` route helper + `CalibrationHistoryTab.viewAllLink` i18n 키 + sub-route page 는 이미 존재 (선행 sprint 산출물). 본 sprint 는 *3 도메인 격상* + *fetch hook 추출* + *4 필터 URL sync* + *e2e 보호*.
- STALE 항목 `ul-qp-18-02-export-renderer` 의 사전 구현 완료 사실은 backend/frontend/e2e 3 영역 모두 검증됨 (`equipment-history.controller.ts:57` `@Get(':uuid/history-card')` + `EquipmentStickyHeader.tsx:253` `historyCardExportAriaLabel` + `wf-history-card-export.spec.ts` 4 cases).
