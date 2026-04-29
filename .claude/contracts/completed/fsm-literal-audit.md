---
slug: fsm-literal-audit
created: 2026-04-22
mode: 1
---

# Contract: PR-24 FSM 리터럴 감사 및 정리

## Context

tech-debt-tracker에 7개 파일의 "FSM 리터럴 위반"으로 등재됨. 
심층 조사 결과 7개 파일 모두 CheckoutStatus FSM 도메인 값이 아님을 확인:
- 5개: Promise.allSettled 결과 status (JS 표준 'fulfilled'/'rejected')
- 2개 (IntermediateCheckAlert): IntermediateCheckStatusKey (별도 도메인, Identifier 비교)

실제 수정 범위: NCDocumentsSection.tsx:78 `; self-audit-exception` 태그 누락 1건

## MUST Criteria

| # | 기준 | 판정 |
|---|------|------|
| M1 | `pnpm --filter frontend run lint` PASS | PASS/FAIL |
| M2 | `pnpm --filter frontend run tsc --noEmit` PASS | PASS/FAIL |
| M3 | NCDocumentsSection.tsx:78 주석에 `; self-audit-exception` 포함 | PASS/FAIL |
| M4 | tech-debt-tracker에 PR-24 2개 항목 분석 결과 기록 및 완료 표시 | PASS/FAIL |

## SHOULD Criteria

| # | 기준 |
|---|------|
| S1 | IntermediateCheckAlert status 비교가 IntermediateCheckStatusKey 타입에 의해 안전함을 확인 |
| S2 | 7개 파일 eslint-disable 예외 일관성 (동일 형식) 확인 |

## Success Conditions

- ESLint lint PASS
- TypeScript tsc PASS
- tech-debt 항목 정확하게 분류/닫힘
- 의미론적으로 잘못된 CSVal 변환 없음 (아키텍처 보전)
