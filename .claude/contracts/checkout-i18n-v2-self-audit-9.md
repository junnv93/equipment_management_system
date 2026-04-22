---
slug: checkout-i18n-v2-self-audit-9
mode: 1
created: 2026-04-22
---

# Contract: PR-8 v2 i18n 확장 + PR-11 v2 self-audit ⑨

## MUST 기준 (모두 PASS 필수)

### M1: ko/checkouts.json — 7개 신규 네임스페이스 존재
- `guidance.*` 8개 키 (nextStep, currentStep, actor, panelTitle, terminal, blockedHint, stepOf, urgency.{normal,warning,critical})
- `list.subtab.{inProgress,completed}` 2개 키
- `list.count.{checkouts,equipment,separator}` 3개 키
- `timeline.status.{past,current,next,future,skipped}` 5개 키
- `timeline.tooltip.{completedAt,pendingActor}` 2개 키
- `emptyState.{inProgress,completed,filtered}` 각 title/description (+ cta for inProgress/filtered)
- `yourTurn.{label,tooltip}` 2개 키
- `toast.transition.{approve,start,submitReturn,approveReturn,overdue}` 각 success/warning
- `help.status.{13 statuses}` 각 title/description

### M2: en/checkouts.json — ko와 동일 구조 (영문 값)
- 위 M1과 동일한 경로 구조, 영문 값으로

### M3: 기존 키 미삭제
- ko/en 양쪽 기존 `fsm.*`, `list.empty`, `list.emptyDescription` 등 유지

### M4: JSON 유효성
- 두 파일 모두 유효한 JSON (`node -e "JSON.parse(require('fs').readFileSync(...))"` exit 0)

### M5: check-i18n-keys.mjs --all 성공
- `node scripts/check-i18n-keys.mjs --all` → exit 0
- 신규 7개 네임스페이스 키 포함해서 검증
- `--all` / `--changed` 모드 플래그 지원

### M6: check-i18n-keys.mjs 음성 테스트
- 의도적 키 삭제 시 exit 1 + stderr에 누락 키 출력

### M7: self-audit.mjs 체크 ⑨ 추가
- `apps/frontend/components/checkouts/**/*.{ts,tsx}` 대상 hex 색상 탐지
- `checkHexColors()` 함수 존재 + 경로 필터 `startsWith('apps/frontend/components/checkouts/')`
- `node scripts/self-audit.mjs` (인수 없음) → exit 0 (usage 출력)
- `node scripts/self-audit.mjs --all` → 체크 ⑨ 위반 0건 (pre-existing ⑧ 위반은 별개 tech-debt)
- 체크 ⑧ (FSM 리터럴) 유지됨

### M8: pnpm --filter frontend run tsc --noEmit 성공

## SHOULD 기준 (루프 차단 없음)

- S1: check-i18n-keys.mjs `--changed` 모드가 staged 파일 기반으로 동작
- S2: self-audit.mjs 체크 ⑨ 음성 테스트 (hex 삽입 시 오류 출력)

## 변경 대상 파일 (4개)
1. `apps/frontend/messages/ko/checkouts.json`
2. `apps/frontend/messages/en/checkouts.json`
3. `scripts/check-i18n-keys.mjs`
4. `scripts/self-audit.mjs`
