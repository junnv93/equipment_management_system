# 스프린트 계약: Graceful No-Op Context Consumer 패턴 ADR 정식화

## 생성 시점
2026-05-13T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] M-1: `docs/adr/0013-graceful-no-op-context-consumer.md` 파일 존재
  - 검증: `test -f docs/adr/0013-graceful-no-op-context-consumer.md && echo PASS`
- [ ] M-2: ADR에 "Accepted" 상태 명시
  - 검증: `grep -c "Accepted" docs/adr/0013-graceful-no-op-context-consumer.md` ≥ 1
- [ ] M-3: ADR에 "적용 조건" 섹션 — graceful no-op을 언제 써야 하는지
  - 검증: `grep -c "적용 조건\|When to Use\|언제 사용" docs/adr/0013-graceful-no-op-context-consumer.md` ≥ 1
- [ ] M-4: ADR에 "금지 조건" 섹션 — fail-fast 패턴을 써야 하는 상황
  - 검증: `grep -c "금지\|사용 금지\|fail-fast\|When NOT\|언제 사용하지" docs/adr/0013-graceful-no-op-context-consumer.md` ≥ 1
- [ ] M-5: ADR에 구현 코드 예시 포함 (NO_OP_VALUE 패턴)
  - 검증: `grep -c "NO_OP_VALUE" docs/adr/0013-graceful-no-op-context-consumer.md` ≥ 1
- [ ] M-6: ADR에 InspectionFormContext를 정규(canonical) 사례로 참조
  - 검증: `grep -c "InspectionFormContext\|form-context" docs/adr/0013-graceful-no-op-context-consumer.md` ≥ 1
- [ ] M-7: ADR에 기존 패턴(fail-fast)과의 대비 비교 포함
  - 검증: `grep -c "AuthenticatedClientContext\|fail-fast\|throw" docs/adr/0013-graceful-no-op-context-consumer.md` ≥ 1
- [ ] M-8: form-context.tsx 파일 파일 헤더 JSDoc에 ADR-0013 참조 추가
  - 검증: `grep -c "ADR-0013" apps/frontend/lib/inspection/form-context.tsx` ≥ 1
- [ ] M-9: `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] M-10: tech-debt-tracker.md의 F-3 항목 `[x]` 완료 처리
  - 검증: `grep -c "^\- \[x\].*F-3\|^\- \[x\].*graceful-no-op-adr\|^\- \[x\].*visual-table-editor-graceful" .claude/exec-plans/tech-debt-tracker.md` ≥ 1
- [ ] M-11: `docs/adr/README.md` 에 ADR-0013 목록 추가
  - 검증: `grep -c "0013" docs/adr/README.md` ≥ 1
- [ ] M-12: ADR에 Trigger Conditions 섹션 존재 (재검토 트리거 명시)
  - 검증: `grep -c "Trigger\|트리거\|재검토" docs/adr/0013-graceful-no-op-context-consumer.md` ≥ 1

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] S-1: CLAUDE.md 또는 `docs/references/frontend-patterns.md`에 ADR-0013 참조 링크 추가
- [ ] S-2: ADR에 테스트 용이성(testability) 이점 명시 — Provider 없이 단위 테스트 가능

### 적용 verify 스킬

변경 파일: `docs/adr/0013-*.md`, `apps/frontend/lib/inspection/form-context.tsx`
- verify-ssot: form-context.tsx JSDoc SSOT 참조 정합성
- verify-implementation: ADR 존재 + 구조 검증
