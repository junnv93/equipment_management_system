# Tech Debt Residual — 2026-04-28
slug: tech-debt-residual
date: 2026-04-28
status: completed (Phase 1 + Phase 2)

---

## 분류 결과

### 즉시 실행 항목 (2개)

| # | 항목ID | 파일:라인 | 작업 |
|---|--------|----------|------|
| 1 | `self-inspections-role-literal-ssot` | `apps/backend/src/modules/self-inspections/self-inspections.controller.ts:284` | role 리터럴 → `UserRoleValues.SYSTEM_ADMIN` / `TECHNICAL_MANAGER` SSOT 경유 |
| 2 | `revocation-error-message-dynamic` | `apps/backend/src/modules/checkouts/checkouts.service.ts:3209` | `'within 5 minutes'` 하드코딩 → `${APPROVAL_REVOCATION_WINDOW_MS / 60_000} minutes` 동적 계산 |

### 조건부 유지 항목 (28개) — 트래커 잔류

트리거 조건 미충족으로 이번 세션 보류:
- 성능/UX 트리거 4건 (CheckoutGroupCard 성능 이슈, 저사양 기기, 모바일 실기기, 큰 batch UX)
- 도메인 정책 결정 필요 2건 (`ar13-lab-manager-self-inspection`, `RENTAL reject_return` FSM 갭)
- 외부 인프라 의존 5건 (Sentry SDK, BFF 안정화, DB-backed 설정, 프로덕션 배포, TTY 세션)
- 미래 Sprint 트리거 17건 (E2E 확장, i18n 정리, 디자인 QA, schemas 패키지 정리 등)

### 아카이브 항목 (0개)

트래커 내 완료 확인된 항목 없음.

### 분리 보류 (1건)

`approvals-api-module-split` (1507줄) — `bulkApprove`/`bulkReject`가 `fetchItemsMapIfNeeded` 등 3개 private helper에 직접 의존하는 단일 class 구조. 단순 파일 분리 시 캡슐화 파괴 → 인터페이스 재설계 선행 필요. 트리거 조건("파일 크기가 개발 마찰 원인이 될 때") 미충족으로 보류.

---

## Phase 계획

### Phase 1: SSOT + 하드코딩 수술적 수정 ✅ 완료

#### 1-A: self-inspections.controller.ts

수정 1 — import 추가 (line 28):
```typescript
import type { UserRole } from '@equipment-management/schemas';
+ import { UserRoleValues } from '@equipment-management/schemas';
```

수정 2 — line 284-286:
```typescript
// 기존
req.user?.roles?.some((r) => r === 'system_admin' || r === 'technical_manager') ?? false;

// 수정
req.user?.roles?.some(
  (r) => r === UserRoleValues.SYSTEM_ADMIN || r === UserRoleValues.TECHNICAL_MANAGER,
) ?? false;
```

#### 1-B: checkouts.service.ts

수정 — line 3209:
```typescript
// 기존
message: 'Approval can only be revoked within 5 minutes of approval',

// 수정
message: `Approval can only be revoked within ${APPROVAL_REVOCATION_WINDOW_MS / 60_000} minutes of approval`,
```

#### 검증 결과
- `npx tsc --noEmit` (apps/backend) → PASS (0 errors)

### Phase 2: 트래커 정리

1. `tech-debt-tracker.md`에서 2개 항목 제거 (자체 섹션 `### 2026-04-27 verify-implementation: tech-debt-0427-open 후속 WARN 항목` 제거)
2. `tech-debt-tracker-archive.md`에 완료 기록 추가

---

## 데이터 플로우

```
Phase 1-A SSOT 체인:
  packages/schemas/src/enums/values.ts:60 (UserRoleValues 정의)
    └── packages/schemas/src/enums/index.ts (re-export)
        └── packages/schemas/src/index.ts:33 (export * from './enums')
            └── self-inspections.controller.ts:28 (import { UserRoleValues })

Phase 1-B 동적 계산:
  packages/shared-constants/src/business-rules.ts (APPROVAL_REVOCATION_WINDOW_MS = 300_000)
    └── checkouts.service.ts:54 (이미 import됨, 추가 작업 불필요)
        └── checkouts.service.ts:3209 (template literal로 5 = 300_000/60_000 자동 계산)
```

---

## Phase 2 (재평가 후 추가 처리 — 5건)

사용자의 "타협 없는 시니어 수준" 피드백 후 27건 조건부 항목 재평가. 외부 의존(SDK/DB/배포) 또는 도메인 결정 없이 즉시 가치 있는 5건을 추가 처리.

### 2-A: group-header-currentUserRole-parity (Sprint 4.1 LOW)

**문제**: `CheckoutGroupCard.tsx`에 `NextStepPanel` 2개 사용처 — row(line 482-485)에는 `currentUserRole={role}` 전달, group header(line 327)에는 누락.

**수정**: line 327를 multi-line으로 변경하여 `currentUserRole={role}` prop 추가. 컴포넌트 스코프의 기존 `role` 변수(line 106) 재사용.

```tsx
// 수정 전
<NextStepPanel variant="compact" descriptor={rentalDescriptor} />

// 수정 후
<NextStepPanel
  variant="compact"
  descriptor={rentalDescriptor}
  currentUserRole={role}
/>
```

**검증**: 프론트엔드 tsc 0 error.

### 2-B: non-rental purpose phase 설계 문서화 (Sprint 1.2 LOW)

**문제**: `getRentalPhase()`가 rental purpose 전용. non-rental(calibration/repair) phase 확장 시 재설계 영향 범위 미문서화 → 미래 개발자가 모르고 수정 시도할 위험.

**수정**: `packages/schemas/src/fsm/rental-phase.ts:62`에 `@design` JSDoc 블록 추가. 재설계 시 영향받는 호출부 3곳(`CheckoutPhaseIndicator`, `getPhaseIndex`, `RENTAL_STATUS_TO_PHASE` 구조) 명시.

**검증**: schemas 패키지 tsc 0 error.

### 2-C: verify-design-tokens 스킬 NEXT_STEP_PANEL_TOKENS Step 42 추가 (86차 LOW)

**문제**: `verify-design-tokens` 스킬에 `NEXT_STEP_PANEL_TOKENS` 검증 누락 — workflow-panel.ts → index → NextStepPanel.tsx 토큰 체인이 자동 검증되지 않음.

**수정**: `.claude/skills/verify-design-tokens/SKILL.md`에 Step 42 추가:
- 탐지 명령 3종(re-export 확인, 소비처 SSOT 경유, satisfies 가드)
- PASS/FAIL 기준 명시
- Output Format 표 Row 42 추가

### 2-D: e2e-patterns.md global-setup 역할 가이드 (PR-17 LOW)

**문제**: `global-setup.ts:122`에서 `technical_manager` 토큰 사용 이유가 코드 내 주석에만 존재 — 다른 시스템 트리거 추가 시 잘못된 역할(system_admin) 사용 위험.

**수정**: `docs/references/e2e-patterns.md` Anti-Patterns 섹션 다음에 "global-setup System Trigger API — 역할 선택 가이드" 섹션 추가:
- `technical_manager` 사용 4가지 근거 (UPDATE_EQUIPMENT 권한 / audit 잡음 회피 / 운영자 페르소나 / 권한 over-grant 회피)
- ✅/❌ 코드 예시

### 2-E: design-tokens-partial-audit 완료 (Sprint 1.5 LOW)

**조사 결과**: `apps/frontend/lib/design-tokens/components/` 전수 스캔 시 `Partial<Record<...>>` **0건** 발견. 이미 모든 토큰 파일이 `as const satisfies Record<...>` 강제 패턴 준수.

**수정**: 코드 변경 없음. 트래커 항목 정리 목적 archive 이동.

### Phase 2 검증

- 프론트엔드 tsc: 0 errors
- schemas 패키지 tsc: 0 errors
- 변경 파일 4개 + audit-only 1개

---

## 보류 항목 분류 (재평가 후 최종)

### 외부 의존성 미충족 (구현 불가)
- Sentry 관련 (SDK 미도입)
- DB-backed 설정 (스키마 변경 + migration 결정 필요)
- TTY 필요 (Drizzle prompt)
- 프로덕션 사용자 (백업/DR)

### 도메인 정책 결정 필요 (사용자 입력 필요)
- `ar13-lab-manager-self-inspection` (lab_manager 권한 범위 결정)
- `RENTAL reject_return` FSM 갭 (의도적 vs 누락 결정)
- `purpose-bar-return-to-vendor-color` (디자인 색상 결정)
- `rejection-reason-max-length` (도메인 규격 결정)
- `en-overdueclear-translation-spec` (i18n 컨트랙트 결정)

### 가치/위험 비율 낮음 (트리거 발생 시 처리)
- `approvals-api-module-split` (1507줄, private helper 결합도 → 인터페이스 재설계 선행)
- 모바일 실기기 테스트 항목 (실기기 없이 검증 불가)
- E2E 확장 항목 (별도 E2E 안정화 Sprint 권장)
- 성능 최적화 항목 (실측 이슈 없이 사전 최적화 금지)
- 디자인 QA 항목 (visual regression baseline 캡처는 별도 세션)

### 누락 없는 정합성 — 검증 종결

이번 세션 종료 시점 기준 즉시 처리 가능한 모든 항목 완료. 잔여 항목은 모두 실제 외부 트리거가 필요한 상태로, 선제 구현이 오히려 부채를 가중시킴 (YAGNI + dead code 위험).

