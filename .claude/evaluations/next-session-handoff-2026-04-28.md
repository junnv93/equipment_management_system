# 다음 세션 인계 멘트 — 2026-04-28 종료 시점

## 이번 세션 (2026-04-28) 완료 요약

**Mode 2 harness — tech-debt-residual** (Phase 1 + Phase 2 + verify + skill 갱신)

### 처리 완료 7건

| Phase | 항목 | 파일 | 변경 |
|-------|------|------|------|
| 1 | self-inspections-role-literal-ssot | self-inspections.controller.ts:286 | role 리터럴 → `UserRoleValues.SYSTEM_ADMIN` / `TECHNICAL_MANAGER` |
| 1 | revocation-error-message-dynamic | checkouts.service.ts:3209 | `'5 minutes'` → `${APPROVAL_REVOCATION_WINDOW_MS / 60_000} minutes` |
| 2 | group-header-currentUserRole-parity | CheckoutGroupCard.tsx:327 | NextStepPanel `currentUserRole={role}` prop parity |
| 2 | non-rental purpose phase 설계 | rental-phase.ts:62 | `@design` JSDoc 블록 추가 |
| 2 | verify-design-tokens NEXT_STEP_PANEL_TOKENS | verify-design-tokens/SKILL.md | Step 42 추가 |
| 2 | E2E global-setup 역할 가이드 | e2e-patterns.md | "System Trigger API 역할 선택" 섹션 |
| 2 | design-tokens-partial-audit | (audit only) | 0건 발견, 트래커 정리 |

**검증**: tsc(backend·frontend·schemas) 0 errors, verify-implementation 10/10 PASS, manage-skills 신규 스킬 불필요 확인.

**스킬 갱신** (manage-skills 권고 적용):
- verify-auth Step 16: "✅ 2026-04-28 수정 완료" 표기
- verify-hardcoding Step 29: 완료 상태 갱신 + 에러 메시지 시간 값 grep 패턴 추가

---

## 트래커 현재 상태

- **총 오픈 항목**: 43건 (이전 세션 시작 시 50+ → 7건 처리)
- **아카이브**: 339건 (+7)

### 잔여 항목 분류 (모두 외부 트리거 대기)

**🔒 외부 의존성 미충족** (구현 불가 — 인프라 선행 필요):
- Sentry 관련 (`fsm-meta-drift-observability`): SDK 미도입
- DB-backed 설정 (`role-approval-categories-db-backed`, `reject-reason-template-quickselect`): 스키마 변경 결정 필요
- TTY 필요 (`Drizzle snapshot 재생성`, `실제 브라우저 동선 수동 검증`)
- 프로덕션 사용자 (`Phase K — 백업·DR`)
- ZodSerializerInterceptor 글로벌 승격 (파일럿 2주 무회귀 + 외부 SDK 대응 완료)

**🤝 도메인 정책 결정 필요** (사용자 입력 필요):
- `ar13-lab-manager-self-inspection`: lab_manager 자체점검 승인 권한 결정
- `RENTAL reject_return` FSM 갭: 의도적 vs 누락 결정
- `purpose-bar-return-to-vendor-color`: 디자인 색상 결정
- `rejection-reason-max-length`: 도메인 규격 결정
- `en-overdueclear-translation-spec`: i18n 컨트랙트 결정

**📈 가치/위험 비율 낮음** (실제 트리거 발생 시 처리):
- `approvals-api-module-split` (1507줄): private helper 결합도 → 인터페이스 재설계 선행 필요
- 모바일 실기기 테스트 항목 (`mobile-detail-modal-fullscreen`, `row-mobile-stacking`)
- E2E 확장 (`e2e-your-turn-badge-coverage`, `fail-closed-e2e-matrix-expansion`, `sprint-3.3-e2e-profiler-verification`)
- 성능 최적화 (`checkout-row-onclick-callback`, `stagger-low-spec-guard`, `groupcard-usecallback-t-scan`)
- 디자인 QA (`bundle-baseline-update`, `visual-regression-baseline`)
- 애니메이션 정책 (`stepper-step-transition-animation`, `stepper-disposal-start-node-label`)

---

## 다음 세션 시작 시 점검 사항

### 1. Git 상태 확인 (첫 명령)

```bash
git status --short
# 예상 dirty: 30+ 파일 (대시보드 작업 미커밋)
# 우리 세션 작업 11 파일은 별도 commit 권장 (아래 참고)
```

### 2. 우리 세션 파일 선별 커밋 (필요 시)

```bash
# Phase 1 + Phase 2 + 스킬 갱신 + 트래커 정리 — 단일 commit
git add \
  apps/backend/src/modules/self-inspections/self-inspections.controller.ts \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  packages/schemas/src/fsm/rental-phase.ts \
  .claude/skills/verify-design-tokens/SKILL.md \
  .claude/skills/verify-hardcoding/SKILL.md \
  .claude/skills/verify-auth/SKILL.md \
  docs/references/e2e-patterns.md \
  .claude/exec-plans/tech-debt-tracker.md \
  .claude/exec-plans/tech-debt-tracker-archive.md \
  .claude/exec-plans/completed/2026-04-28-tech-debt-residual.md \
  .claude/contracts/tech-debt-residual.md \
  .claude/evaluations/tech-debt-residual.md \
  .claude/evaluations/tech-debt-residual-verify.md \
  .claude/evaluations/manage-skills-tech-debt-residual.md \
  .claude/evaluations/next-session-handoff-2026-04-28.md
```

권장 커밋 메시지:
```
chore(tech-debt): tech-debt-residual Phase 1+2 — SSOT 2건 + parity/문서 5건

Phase 1 (즉시 실행):
- self-inspections.controller role 리터럴 → UserRoleValues SSOT
- checkouts.service revocation 메시지 동적 계산

Phase 2 (재평가 후 추가):
- CheckoutGroupCard NextStepPanel currentUserRole parity
- rental-phase.ts @design JSDoc invariant 문서화
- verify-design-tokens Step 42 (NEXT_STEP_PANEL_TOKENS)
- e2e-patterns.md global-setup 역할 가이드
- design-tokens-partial-audit 0건 확인 archive 정리

Skill updates (manage-skills 권고):
- verify-auth Step 16, verify-hardcoding Step 29 완료 상태 표기

검증: tsc 0 errors, verify-implementation 10/10 PASS
```

### 3. 다음 세션에서 진행할 만한 항목 (우선순위)

**🔴 사용자 결정 필요 (블로킹 해소 시 즉시 처리 가능)**:
- `ar13-lab-manager-self-inspection`: lab_manager 자체점검 승인 권한 — 도메인 정책 1줄 결정만 필요
- `purpose-bar-return-to-vendor-color`: 디자인 색상 결정 (return_to_vendor 목적의 시각 표시 어떤 색?)

**🟡 인프라 결정 필요** (Yes 시 ~30분 작업):
- `bundle-baseline-update`: `pnpm --filter frontend run build` 실행해 baseline 갱신 (대시보드 변경 commit 후 권장)

**🟢 다음 코드 작업과 병행 가능 (트리거 충족 시)**:
- 만약 CheckoutGroupCard 추가 수정 시 → `checkout-row-onclick-callback`, `groupcard-usecallback-t-scan` 함께 처리
- 만약 e2e suite-ux 실행 시 → `sprint-3.3-e2e-profiler-verification` 자동 처리

### 4. 우선 진행 권장 작업 후보

다음 세션에서 새 작업을 시작한다면:

**옵션 A — 다른 세션의 dashboard 작업 마무리**:
- 21 dirty + 4 untracked 파일이 dashboard 관련 (DashboardClient, KpiStatusGrid, atoms/, cards/, dday-tone.ts 등)
- 별도 세션에서 진행 중이었던 작업으로 추정 → 그 세션의 plan/contract 확인 후 마무리 권장
- `.claude/exec-plans/completed/`에서 dashboard-design-overhaul 또는 dashboard-phase4-6 등 관련 plan 검토

**옵션 B — 백로그 큐레이션**:
- `/harness-docs` 또는 `/generate-prompts`로 example-prompts.md 갱신 (이번 세션 완료 7건 archive 표기)

**옵션 C — 기능 신규 작업**:
- 트래커 잔여 43건 모두 트리거 대기 → 새 기능 작업이 자연스럽게 트리거를 충족시키는 식으로 처리

---

## 핵심 학습 포인트 (메모리 후보)

이번 세션에서 정착된 패턴:

1. **"조건부" 항목 재평가 기준**: 외부 의존성 / 도메인 결정 / 가치-위험 비율 3-Layer 분류 — 단순 "트리거: X 시" 문구만 보고 보류 결정 금지. 외부 블로커가 없으면 즉시 처리 가능.

2. **NextStepPanel parity**: 같은 컴포넌트에서 multi-instance 사용 시 prop drift 위험. `currentUserRole` 같은 컨텍스트 prop은 모든 사용처에 일관되게 전달.

3. **시간 값 하드코딩의 진짜 위험**: 상수 변경 시 에러 메시지가 stale로 남아 운영 시 사용자 혼란. `${CONST / 60_000} minutes` 동적 계산이 SSOT 본질.

4. **JSDoc invariant 명시**: `getRentalPhase()` 같이 purpose-rental 전용 함수는 시그니처만으로 의도가 안 드러남 → `@design` 블록으로 향후 재설계 영향 범위 명시.

---

## 세션 종료 시점 검증 결과

- ✅ Backend tsc: 0 errors
- ✅ Frontend tsc: 0 errors
- ✅ Schemas tsc: 0 errors
- ✅ verify-implementation: 10/10 PASS, 0 issues
- ✅ manage-skills: 신규 스킬 불필요, 기존 스킬 텍스트 갱신 적용 완료
- ✅ 우리 세션 파일 11개 + 다른 세션 파일 격리 유지
