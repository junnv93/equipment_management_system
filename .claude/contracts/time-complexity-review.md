---
slug: time-complexity-review
title: Time Complexity Review — 전체 코드베이스 시간복잡도 분석
mode: 2
created: 2026-04-13
---

## Scope

1. 백엔드 서비스 레이어의 N+1 쿼리, 중첩 루프, limit 누락 패턴 분석
2. Drizzle ORM 쿼리 패턴 (SELECT *, findMany without limit) 분석
3. 프론트엔드 hooks/components의 useMemo 누락, 반복 .find() 패턴 분석
4. Big-O 표기법으로 현재/개선 후 복잡도 명시 및 우선순위화

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | 주요 백엔드 서비스 파일 분석됨 (최소 10개 모듈) | 이슈 목록 검토 |
| M2 | 발견된 각 이슈에 파일경로:라인번호 포함 | 이슈 목록 검토 |
| M3 | N+1 쿼리 이슈에 구체적인 루프 패턴 설명 포함 | 이슈 설명 검토 |
| M4 | 각 이슈에 현재 Big-O / 개선 후 Big-O 명시 | 이슈 목록 검토 |
| M5 | Critical/High 이슈에 수정 방향 포함 | 이슈 설명 검토 |
| M6 | 프론트엔드 분석 포함됨 | 체크리스트 완료 확인 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | 수정 예시 코드(before/after) 포함 |
| S2 | 이슈별 우선순위(Critical/High/Medium/Low) 분류 |
| S3 | 실제 라인번호 확인 (grep 기반 검증) |
