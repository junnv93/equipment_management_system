# Contract: SKILL.md 14개 300줄 이하 경량화

## 생성 시점
2026-04-02

## Context
SKILL.md 14개가 300줄을 초과하여 컨텍스트 비대화 문제 발생.
상세 내용을 references/ 디렉토리로 분리하여 경량화.
기존 패턴(review-design 147줄, equipment-management references/ 구조) 참조.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | 14개 SKILL.md 모두 300줄 이하 | `wc -l .claude/skills/*/SKILL.md \| awk '$1>300'` 결과 0건 |
| M2 | 추출된 내용이 references/ 파일에 보존 | 각 skill의 references/ 디렉토리에 새 파일 존재 확인 |
| M3 | SKILL.md에서 references/ 파일로의 링크 유효 | 모든 markdown 링크 대상 파일 존재 |
| M4 | 기존 references/ 파일 미변경 | 이미 존재하는 references/ 파일 내용 보존 |
| M5 | Step 제목, Exceptions, Output Format 인라인 유지 | SKILL.md에 워크플로우 구조 보존 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | references/ 파일 네이밍 kebab-case 일관성 |
| S2 | 각 SKILL.md 200줄 이하 달성 |
| S3 | references/ 파일 자기완결적 (상호 의존 없음) |

## 종료 조건
- M1-M5 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 수동 개입
- 3회 반복 초과 → 수동 개입
