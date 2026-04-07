# Contract: workflow-review-test-steps

## MUST Criteria

1. **TypeScript 컴파일** — `pnpm tsc --noEmit` 에러 0건
2. **WF-09 LM 반려 시나리오** — wf-09 테스트에 LM rejection step이 존재하고, `rejected` 상태를 검증
3. **WF-13 반납 완료 흐름** — wf-13 테스트에 반납 반출 승인 + import returned 검증 존재
4. **WF-16 교정 카운트** — wf-16 테스트에 교정 등록/승인 시 calibration 카운트 변동 검증
5. **문서 WF-09 상태값** — critical-workflows.md의 WF-09에서 QM/LM 반려 시 `rejected` 상태 기술
6. **문서 WF-17** — 반출 기한 초과 자동 overdue 워크플로우 존재
7. **문서 WF-18** — 부적합 조치 반려 워크플로우 존재
8. **serial 모드** — 수정된 테스트 파일에 serial mode 설정 유지

## SHOULD Criteria

1. **WF-02 구현 참고** — WF-02에 현재 구현 상태 반영 (즉시 available, 승인 요청은 별도 경로)
2. **우선순위 테이블** — WF-17, WF-18이 우선순위 테이블에 포함
3. **import 정리** — 수정된 테스트 파일에 미사용 import 없음
