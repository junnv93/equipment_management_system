# 스프린트 계약: 교정/교정계획 디자인 리뷰 1차 구현

## 생성 시점
2026-05-03T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter frontend run type-check` 에러 0
- [ ] `pnpm --filter frontend run build` 성공 또는 실행 불가 사유 기록
- [ ] 교정관리 페이지에 6개월 월별 캘린더가 있고 클릭 시 기존 URL 날짜 필터(`startDate`, `endDate`)를 갱신한다.
- [ ] 교정관리 이력 API 호출이 `approvalStatus`, `result`, `startDate`, `endDate`, `calibrationDueStatus`, `teamId`, `site` 필터를 반영한다.
- [ ] 교정관리 테이블의 등록 액션은 모든 행에 항상 같은 primary 액션으로 노출되지 않고 상태별/hover 기반으로 분기된다.
- [ ] 교정계획 목록에 “내 차례” 큐가 상태와 권한 기반으로 파생되어 표시된다.
- [ ] 교정계획 상태 배지는 단일 pill 텍스트만이 아니라 진행 단계 micro-stepper를 포함한다.
- [ ] 교정계획 상세에 현재 사용자 액션을 강조하는 Approval Bar와 4개 메타 카드가 표시된다.
- [ ] 교정성적서 등록 폼에 등록 후 결재 흐름 안내, 자동 계산 차기일 신호, 결과별 후속 조치 안내가 표시된다.
- [ ] 새 UI 텍스트는 `apps/frontend/messages/ko/calibration.json` 및 `apps/frontend/messages/en/calibration.json`에 추가한다.
- [ ] `any` 타입을 새로 도입하지 않는다.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] 변경 라우트(`/calibration`, `/calibration-plans`, `/calibration-plans/[uuid]`, `/calibration/register`) 브라우저 렌더링 확인
- [ ] OCR 추출, 측정값 템플릿, 항목별 의견 저장은 후속 개발 항목으로 명시된다.
- [ ] 디자인 리뷰 문서의 P1/P2가 어떤 구현/후속 작업으로 매핑됐는지 최종 보고에 포함된다.

### 적용 verify 스킬
- 프론트엔드 TypeScript/type-check
- UI 변경 자체 점검

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제
- 3회 반복 초과 → 수동 개입 요청
