# Contract: tab-subroute-architecture-decision-closure

**Slug**: `tab-subroute-architecture-decision-closure`  
**날짜**: 2026-05-09  
**Mode**: Mode 2

---

## MUST (실패 시 루프 재진입)

### M-1: ADR-0009 존재 + 내용 완결성

```bash
test -f docs/adr/0009-tab-subroute-architecture.md && echo PASS || echo FAIL
grep -c "Option A\|Option B\|Option C\|Option D" docs/adr/0009-tab-subroute-architecture.md
grep -c "Trigger Condition\|트리거" docs/adr/0009-tab-subroute-architecture.md
```

기준: 파일 존재 + Option 4가지 언급 ≥ 4 + Trigger 섹션 ≥ 1

### M-2: EquipmentTabFooterLink — 4개 탭 모두 존재

```bash
grep -c "EquipmentTabFooterLink" apps/frontend/components/equipment/CalibrationHistoryTab.tsx
grep -c "EquipmentTabFooterLink" apps/frontend/components/equipment/CalibrationFactorsTab.tsx
grep -c "EquipmentTabFooterLink" apps/frontend/components/equipment/MaintenanceHistoryTab.tsx
grep -c "EquipmentTabFooterLink" apps/frontend/components/equipment/IncidentHistoryTab.tsx
```

기준: 각 파일 ≥ 1

### M-3: CalibrationHistorySection.tsx SSOT 위반 0건

```bash
# result?: string 위반 없음
grep -n "result\?: string" apps/frontend/components/equipment/CalibrationHistorySection.tsx | grep -v "^.*//.*result" | wc -l
# inline union 위반 없음
grep -n "'pass' | 'fail' | 'conditional'\|\"pass\" | \"fail\" | \"conditional\"" apps/frontend/components/equipment/CalibrationHistorySection.tsx | wc -l
# CalibrationResult 타입 import 존재
grep -c "CalibrationResult" apps/frontend/components/equipment/CalibrationHistorySection.tsx
# CALIBRATION_RESULT_VALUES 사용
grep -c "CALIBRATION_RESULT_VALUES" apps/frontend/components/equipment/CalibrationHistorySection.tsx
```

기준: 위반 0건 + CalibrationResult ≥ 3 + CALIBRATION_RESULT_VALUES ≥ 1

### M-4: tsc PASS (frontend + backend)

```bash
pnpm --filter frontend run tsc --noEmit 2>&1 | tail -5
pnpm --filter backend run tsc --noEmit 2>&1 | tail -5
```

기준: error 0건

### M-5: frontend build PASS

```bash
pnpm --filter frontend run build 2>&1 | tail -10
```

기준: build 성공 (exit 0)

### M-6: 문서 업데이트

```bash
grep -c "tab-subroute-architecture-decision-closure\|Tab vs Sub-route" .claude/contracts/REGISTRY.md
grep -c "ADR-0009\|tab-subroute" .claude/exec-plans/tech-debt-tracker.md
```

기준: REGISTRY Active 행 ≥ 1 + tech-debt-tracker 참조 ≥ 1 (또는 해당 항목 제거)

---

## SHOULD (실패해도 루프 차단 없음 — tech-debt 등록)

### S-1: CalibrationHistoryTab.tsx + CalibrationHistoryClient.tsx JSDoc에 ADR-0009 cross-ref

```bash
grep -c "ADR-0009\|0009" apps/frontend/components/equipment/CalibrationHistoryTab.tsx
grep -c "ADR-0009\|0009" apps/frontend/components/equipment/CalibrationHistoryClient.tsx
```

기준: 각 ≥ 1

### S-2: 나머지 3 탭 (CalibrationFactors, Maintenance, Incident) JSDoc 신설

```bash
grep -c "ADR-0009\|Option C\|Sub-route" apps/frontend/components/equipment/CalibrationFactorsTab.tsx
grep -c "ADR-0009\|Option C\|Sub-route" apps/frontend/components/equipment/MaintenanceHistoryTab.tsx
grep -c "ADR-0009\|Option C\|Sub-route" apps/frontend/components/equipment/IncidentHistoryTab.tsx
```

기준: 각 ≥ 1

### S-3: CalibrationResultEnum.safeParse 방어 코드 사용

```bash
grep -c "CalibrationResultEnum.safeParse\|safeParse" apps/frontend/components/equipment/CalibrationHistorySection.tsx
```

기준: ≥ 1

### S-4: exec-plan active → completed 이동 완료

```bash
test -f .claude/exec-plans/completed/2026-05-09-tab-subroute-architecture-decision-closure.md && echo PASS || echo PENDING
```

### S-5: tech-debt-tracker-archive.md에 sprint 행 추가

```bash
grep -c "tab-subroute-architecture-decision-closure" .claude/exec-plans/tech-debt-tracker-archive.md
```

기준: ≥ 1
