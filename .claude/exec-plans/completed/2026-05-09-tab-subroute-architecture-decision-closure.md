# Exec Plan: tab-subroute-architecture-decision-closure

**날짜**: 2026-05-09  
**Mode**: Mode 2 (Full — Planner → Generator → Evaluator)  
**Slug**: `tab-subroute-architecture-decision-closure`

## 목표

calibration-cert Tab vs Sub-route 중복 architecture 결정(Option A~D)을 Option C로 공식 채택하고 시스템 전반 closure.

- Option A: Sub-route 제거, Tab 강화 → 거절 (Tab에 집중 필터/통계 넣으면 과부하)
- Option B: Tab 제거, Sub-route만 → 거절 (장비 상세 내 빠른 컨텍스트 확인 불가)
- Option C: Tab(요약) + Sub-route(집중 관리) 공존 → **채택** (역할 분리 명확)
- Option D: Tab과 Sub-route를 완전 통합 컴포넌트로 합침 → 거절 (조건부 렌더링 폭발)

## 변경 파일

### Phase 1: ADR-0009 신설

- `docs/adr/0009-tab-subroute-architecture.md` — Option A~D 비교 + Option C 결정 + Trigger Conditions

### Phase 2: CalibrationHistorySection.tsx SSOT 수정

- `apps/frontend/components/equipment/CalibrationHistorySection.tsx`
  - `result?: string` → `result?: CalibrationResult`
  - `result: 'pass' | 'fail' | 'conditional'` → `result: CalibrationResult`
  - `value as 'pass' | 'fail' | 'conditional'` → `CalibrationResultEnum.safeParse`
  - 하드코딩 SelectItem 3개 → `CALIBRATION_RESULT_VALUES.map`
  - import 추가: `CalibrationResult, CalibrationResultEnum, CALIBRATION_RESULT_VALUES`

### Phase 3: Tab JSDoc 보강 (ADR-0009 참조)

- `apps/frontend/components/equipment/CalibrationHistoryTab.tsx` — 기존 JSDoc에 ADR-0009 cross-ref 추가
- `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` — 기존 JSDoc에 ADR-0009 cross-ref 추가
- `apps/frontend/components/equipment/CalibrationFactorsTab.tsx` — Option C JSDoc 신설
- `apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` — Option C JSDoc 신설
- `apps/frontend/components/equipment/IncidentHistoryTab.tsx` — Option C JSDoc 신설

### Phase 4: 문서/트래커 업데이트

- `.claude/exec-plans/tech-debt-tracker.md` — Tab vs Sub-route 항목 closure
- `.claude/contracts/REGISTRY.md` — Active에 slug 추가

## 검증 명령

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run build
```

## 완료 기준

- ADR-0009 존재, Option A~D 비교 + Trigger Conditions 포함
- CalibrationHistorySection.tsx: `result?: string` 0건, inline union 0건
- CalibrationResult/CALIBRATION_RESULT_VALUES 정식 import
- tsc frontend + backend PASS
- tech-debt-tracker Tab vs Sub-route 항목 완료 처리
