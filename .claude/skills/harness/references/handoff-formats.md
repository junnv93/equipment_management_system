# Handoff Formats — 에이전트 간 파일 기반 통신 스키마

## exec-plan (Planner → Generator)

경로: `.claude/exec-plans/active/YYYY-MM-DD-{slug}.md`

완료 후: `active/` → `completed/` 이동

```markdown
# {기능명} 구현 계획

## 메타
- 생성: {ISO 8601 timestamp}
- 모드: Mode {N}
- 예상 변경: {N}개 파일

## 설계 철학
{1~2문장 — "무엇을"과 "왜"만. 구현 방법은 Generator가 결정}

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|

## 구현 Phase
### Phase N: {제목}
**목표:** {한 문장}
**변경 파일:**
1. `path/to/file.ts` — {변경 유형: 신규/수정} {변경 의도 — 구현 세부사항 아님}
**검증:** {Phase 완료 후 실행할 검증 명령}

## 전체 변경 파일 요약
### 신규 생성
| 파일 | 목적 |
### 수정
| 파일 | 변경 의도 |

## 의사결정 로그
{진행하며 내린 주요 결정을 시간순으로 기록 — 나중에 이 계획을 읽는 에이전트/사람을 위해}
```

---

## contract.md (Planner/Harness → Evaluator)

경로: `.claude/contract.md`

```markdown
# 스프린트 계약: {작업 제목}

## 생성 시점
{ISO 8601 timestamp}

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm tsc --noEmit` (backend) 에러 0
- [ ] `pnpm tsc --noEmit` (frontend) 에러 0 (프론트엔드 변경 시)
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공 (프론트엔드 변경 시)
- [ ] verify-implementation 전체 PASS (변경 영역 기반 스킬 자동 선택)
- [ ] `pnpm --filter backend run test` 기존 테스트 통과 (백엔드 변경 시)
- [ ] {도메인 특화 기준}

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] review-design 점수 >= 60 (프론트엔드 변경 시)
- [ ] playwright-e2e 변경 라우트 렌더링 확인 (프론트엔드 변경 시)
- [ ] {도메인 특화 권장}

### 적용 verify 스킬
{변경 파일 경로 기반 자동 선택}

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
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
| playwright-e2e (해당 시) | PASS/FAIL/SKIP | {상세} |
| {도메인 기준} | PASS/FAIL | {상세} |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-architecture | PASS/WARN | {등록 시 tracker 링크} |

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

## tech-debt-tracker.md (누적 관리)

경로: `.claude/exec-plans/tech-debt-tracker.md`

SHOULD 기준 실패 항목, entropy 점검 결과, 미완료 개선 사항을 누적 관리.

```markdown
# Tech Debt Tracker

## 미완료 항목
- [ ] {이슈 설명} — `{파일:라인}` — {발견 날짜} — 출처: {harness 실행 슬러그}

## 완료 항목
- [x] {이슈 설명} — 해결: {날짜} — {PR 링크 또는 커밋}
```
