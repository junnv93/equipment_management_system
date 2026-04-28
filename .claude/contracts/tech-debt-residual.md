# Contract: tech-debt-residual
date: 2026-04-27
linked-plan: .claude/exec-plans/active/2026-04-27-tech-debt-residual.md

---

## MUST (루프 차단 기준)

- [ ] `self-inspections.controller.ts:286` role 리터럴 (`'system_admin'`, `'technical_manager'`) 완전 제거 — `UserRoleValues.SYSTEM_ADMIN` / `UserRoleValues.TECHNICAL_MANAGER`로 교체 완료
- [ ] `UserRoleValues` import가 `@equipment-management/schemas` 경유 (로컬 재정의 0건)
- [ ] `checkouts.service.ts:3209` 하드코딩 문자열 `'within 5 minutes'` 완전 제거 — template literal로 동적 계산
- [ ] `APPROVAL_REVOCATION_WINDOW_MS` 중복 import 0건 (line 54 기존 import 재사용)
- [ ] `npx tsc --noEmit` (apps/backend) 0 errors
- [ ] 변경 파일 외 추가 수정 0건 (수술적 변경 원칙)

## SHOULD (이연 허용)

- [ ] backend test PASS (전체 backend 테스트 영향 없음 확인)
- [ ] tech-debt-tracker.md에서 두 완료 항목 제거 + tech-debt-tracker-archive.md에 기록 추가

## NON-GOAL

- approvals-api 모듈 분리 (1507줄) — 트리거 조건 미충족, private helper 결합도 높음
- 조건부 항목 (28건) 선제 구현 금지 — Sentry SDK 없는 곳에 Sentry 코드 추가, DB 도입 타당성 없는 곳에 DB-backed 설정 등 YAGNI 위반
- 인접 코드 리팩토링 — line 284 외부 영역 수정 금지
