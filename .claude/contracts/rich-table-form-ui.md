# 스프린트 계약: rich_table 프론트엔드 폼 UI

## 생성 시점
2026-04-10

## 성공 기준

### 필수 (MUST)
- [ ] `pnpm tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run build` 성공
- [ ] ResultSectionFormDialog에서 rich_table 타입 선택 가능
- [ ] rich_table 폼: 헤더 입력 + 행 추가/삭제 + 셀별 text/image 토글
- [ ] rich_table 섹션 생성 API 호출 시 richTableData 정상 전송
- [ ] ResultSectionPreview에서 rich_table 이미지 셀 표시

### 권장 (SHOULD)
- [ ] i18n: 하드코딩 한국어/영어 없음
- [ ] 접근성: 폼 요소에 적절한 Label

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 3회 반복 초과 → 수동 개입 요청
