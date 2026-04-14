---
slug: parallel-query-3modules
date: 2026-04-14
task: users/calibration/non-conformances 직렬 count+data 쿼리 Promise.all 병렬화
mode: 1
---

# Contract: parallel-query-3modules

## MUST Criteria (루프 차단)

- [ ] `pnpm --filter backend exec tsc --noEmit` → exit 0
- [ ] `pnpm --filter backend run test` → pre-existing 실패(software-validations, cables, intermediate-inspections) 외 모두 통과
- [ ] users.service.ts: findAll()에서 count+data가 Promise.all로 병렬 실행
- [ ] calibration.service.ts: 직렬 count 쿼리 2곳 모두 Promise.all 적용
- [ ] non-conformances.service.ts: data+count (+ 조건부 summary) Promise.all 병렬화
- [ ] 각 모듈의 반환 타입 구조 유지 (items/total/page/pageSize/totalPages 또는 동등 구조)
- [ ] whereClause가 count 쿼리와 data 쿼리에 동일하게 적용됨

## SHOULD Criteria (루프 비차단)

- [ ] summary 조건 분기(includeSummary=true) 유지
- [ ] 변경 범위가 해당 메서드 내부로 한정
- [ ] 기존 주석 스타일 유지
