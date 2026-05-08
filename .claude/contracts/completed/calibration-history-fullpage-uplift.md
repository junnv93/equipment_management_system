# Contract: calibration-history-fullpage-uplift

## 메타
- Slug: `calibration-history-fullpage-uplift`
- 생성일: 2026-05-08
- 모드: Mode 2 (Planner direct)
- Source: `calibration-cert-phase-a-architecture-closure` 자기검토 #3 (commit `2d88c860`)
- 결정: **Option C Full** — Tab=요약 / Sub=상세 분리

---

## MUST (모두 PASS 필요)

### M-1: schemas + shared-constants build PASS
```bash
pnpm --filter @equipment-management/schemas build && pnpm --filter @equipment-management/shared-constants build
```

### M-2: Backend tsc + lint PASS (변경 0)
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run lint
```

### M-3: Frontend tsc + lint PASS
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
```

### M-4: Backend calibration test 회귀 0
```bash
pnpm --filter backend exec jest --testPathPattern="modules/calibration/" --silent
```

### M-5: 신규 RTL spec 4+ tests PASS
```bash
pnpm --filter frontend exec jest --testPathPattern="CalibrationHistoryClient.test" --silent
grep -cE "^\s*(it|test)\(" apps/frontend/components/equipment/__tests__/CalibrationHistoryClient.test.tsx  # ≥ 4
```

### M-6: Tab vs Sub 책임 분리 invariant — Sub-route Client는 Tab 직접 재사용 거부
```bash
# import 0건 (코드 재사용 거부)
grep -cE "^import.*CalibrationHistoryTab|from.*CalibrationHistoryTab" apps/frontend/components/equipment/CalibrationHistoryClient.tsx
# expected: 0

# JSX 호출 0건 (실제 컴포넌트 wrapping 거부)
grep -cE "<CalibrationHistoryTab[\s/>]" apps/frontend/components/equipment/CalibrationHistoryClient.tsx
# expected: 0

# JSDoc 주석 안의 텍스트는 책임 분리 설명에 필수 — invariant 미적용
```

### M-7: Sub-route Client는 자체 데이터 fetch
```bash
grep -cE "useQuery.*calibrations\.byEquipment|getEquipmentCalibrations" apps/frontend/components/equipment/CalibrationHistoryClient.tsx
# expected: ≥ 1
```

### M-8: 재사용 SSOT — CalibrationListTable + 통계 + design token
```bash
grep -c "CalibrationListTable" apps/frontend/components/equipment/CalibrationHistoryClient.tsx
# expected: ≥ 1 (테이블 컴포넌트 SSOT 재사용)
grep -cE "CALIBRATION_TABLE|CALIBRATION_FILTER_BAR|getPageContainerClasses" apps/frontend/components/equipment/CalibrationHistoryClient.tsx
# expected: ≥ 1
```

### M-9: Tab footer "전체 보기" 링크 — route SSOT 호출자 확보
```bash
grep -c "FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_HISTORY" apps/frontend/components/equipment/CalibrationHistoryTab.tsx
# expected: ≥ 1 (route SSOT 호출자 등장 — Phase A에서 dead code였던 helper 회수)
```

### M-10: i18n parity (ko/en)
```bash
grep -c "calibrationHistoryClient" apps/frontend/messages/ko/equipment.json
grep -c "calibrationHistoryClient" apps/frontend/messages/en/equipment.json
# expected: 둘 다 ≥ 1 (이미 존재)

# 신규 키 (stats / filters / overdueAlert) 존재
grep -c "stats\":" apps/frontend/messages/ko/equipment.json
grep -c "filters\":" apps/frontend/messages/ko/equipment.json
# expected: ≥ 1 each (within calibrationHistoryClient namespace — context check)

# Tab viewAllLink
grep -c "viewAllLink" apps/frontend/messages/ko/equipment.json apps/frontend/messages/en/equipment.json
# expected: 2 (1+1)
```

### M-11: 단일 책임 — Client 길이 한계
```bash
wc -l apps/frontend/components/equipment/CalibrationHistoryClient.tsx | awk '{print $1}'
# expected: < 320 (full page 격상 + inline StatCard 외부 재사용 0이라 분리 over-engineering — 단일 파일 적정)
```

### M-12: Cross-domain diff = 0 (allowed paths only)
```bash
git diff --cached --name-only | grep -vE "^(apps/frontend/components/equipment/(CalibrationHistoryClient\.tsx|CalibrationHistoryTab\.tsx|__tests__/CalibrationHistoryClient\.test\.tsx)|apps/frontend/messages/(ko|en)/equipment\.json|\.claude/(exec-plans|contracts|evaluations)/.*)$"
# expected: empty output (다른 도메인 0)
```

### M-13: 다른 세션 보호 — tech-debt-tracker 등 미스 add 0
```bash
git diff --cached -- .claude/exec-plans/tech-debt-tracker.md | wc -l
git diff --cached -- .claude/exec-plans/tech-debt-tracker-archive.md | wc -l
# expected: 다른 세션이 같은 파일을 unstaged로 변경한 경우, 본 sprint 추가분만 staged. 0 또는 본 sprint closure mark만
```

---

## SHOULD (권장)

### S-1: Tab 진입점 의미 분리 명확
- Tab footer link 텍스트가 *전환 의도* 명확히 (예: "이 장비의 전체 교정 이력 보기")

### S-2: design token 시스템 활용
- `CALIBRATION_TABLE`, `CALIBRATION_FILTER_BAR`, `getSemanticContainerClasses('warning')` (overdue alert) 재사용
- inline className 0건

### S-3: 후속 sprint trigger 등록
- UL-QP-18-02 export
- Filter URL 동기화
- Hook 추출 (useEquipmentCalibrations SSOT)

### S-4: tech-debt-tracker 자기검토 #3 항목 closure mark
- `tab-subroute-architectural-decision` → [x] + commit hash

---

## 도메인 성공 기준

1. **Tab vs Sub 책임 분리 확립**: M-6 (Tab 재사용 거부) + M-7 (자체 fetch) + M-9 (route SSOT 호출자) — 3중 invariant
2. **Sub-route deep-link 가치 확보**: 사용자가 sub-route 직접 진입 시 Tab보다 더 풍부한 UX (통계 + 필터 + alert)
3. **Tab UX 보존**: Tab 컨텍스트는 그대로 + 전환 가능한 진입점 (footer link)
4. **시스템 일관성 회복**: repair-history 패턴(Client ≠ Tab)과 통일

---

## REJECTION (즉시 FAIL)

| 조건 | 이유 |
|---|---|
| `CalibrationHistoryTab` import in Client > 0 (M-6 fail) | Option C 위반 — 직접 재사용 = 단순 wrapper |
| 자체 데이터 fetch 0건 (M-7 fail) | Tab과 다른 책임 미확보 |
| Tab footer "전체 보기" 링크 미추가 (M-9 fail) | 진입점 분리 명시 미완료 |
| RTL spec < 4 tests / fail (M-5 fail) | 회귀 가드 부족 |
| Cross-domain diff > 0 (M-12 fail) | 다른 세션 침범 |
| `tech-debt-tracker.md` 다른 세션 라인 흡수 (M-13 fail) | 다른 세션 작업 흡수 |
| backend tsc / frontend tsc / lint / jest 회귀 (M-2/M-3/M-4 fail) | 회귀 0 약속 위반 |
| `--no-verify` 우회 흔적 | git workflow 위반 |
