# Handoff Formats — 에이전트 간 파일 기반 통신 스키마

## contract.md (Planner/Harness → Evaluator)

경로: `.claude/contract.md`

```markdown
# 스프린트 계약: {작업 제목}

## 생성 시점
{ISO 8601 timestamp}

## 성공 기준

### 필수 (MUST)
- [ ] `pnpm tsc --noEmit` (backend) 에러 0
- [ ] `pnpm tsc --noEmit` (frontend) 에러 0 (프론트엔드 변경 시)
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공 (프론트엔드 변경 시)
- [ ] verify-implementation 전체 PASS (변경 영역 기반 스킬 자동 선택)
- [ ] `pnpm --filter backend run test` 기존 테스트 통과 (백엔드 변경 시)
- [ ] {도메인 특화 기준}

### 권장 (SHOULD)
- [ ] review-architecture Critical 이슈 0개
- [ ] review-design 점수 >= 60 (프론트엔드 변경 시)
- [ ] {도메인 특화 권장}

### 적용 verify 스킬
{변경 파일 경로 기반 자동 선택}

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
```

---

## evaluation-report.md (Evaluator → Generator/사용자)

경로: `.claude/evaluation-report.md`

```markdown
# Evaluation Report: {작업 제목}

## 반복 #{N} ({timestamp})

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| tsc 에러 0 | PASS/FAIL | {상세} |
| verify-implementation | PASS/FAIL | {상세} |
| {도메인 기준} | PASS/FAIL | {상세} |

## 전체 판정: PASS 또는 FAIL (필수 N개 미달)

## 이전 반복 대비 변화 (반복 #2 이상)
| 이슈 | 이전 판정 | 현재 판정 | 동일 이슈 연속? |
|------|----------|----------|---------------|
| {이슈명} | FAIL | PASS | - |
| {이슈명} | FAIL | FAIL | ⚠️ 2회 연속 |

## 수정 지시 (FAIL 시)
### 이슈 N: {제목}
- **파일**: {path:line}
- **문제**: {구체적 설명 — 코드 수준으로 정확하게}
- **수정**: {구체적 코드 변경 지시}
- **검증**: {수정 후 확인 방법}
```

---

## plan.md (Planner → Generator)

경로: `.claude/plan.md` (기존 경로 재사용)

```markdown
# {기능명} 구현 계획

## 설계 철학
{1~2문장 — "무엇을"과 "왜"만. 구현 방법은 Generator가 결정}

## 아키���처 결정
| 결정 | 선택 | 근거 |
|------|------|------|

## 구현 Phase
### Phase N: {제목}
**목표:** {한 문���}
**변경 파일:**
1. `path/to/file.ts` — {변경 유형: 신규/수정} {변경 의도 — 구현 세부사항 아님}
**검증:** {Phase 완료 후 실행할 검증 명령}

## 전체 변경 파일 요약
### 신규 생성
| 파일 | 목적 |
### 수정
| 파일 | 변경 의도 |
```
