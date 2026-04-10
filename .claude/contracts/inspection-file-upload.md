---
slug: inspection-file-upload
mode: 1
created: 2026-04-10
---

# Contract: inspection-file-upload

## MUST Criteria

| ID | Criterion |
|----|-----------|
| M1 | tsc --noEmit PASS |
| M2 | Frontend build PASS |
| M3 | Backend test PASS |
| M4 | photo 섹션: FileUpload 드래그앤드롭으로 이미지 선택, documentApi.uploadDocument 호출 후 UUID 자동 삽입 |
| M5 | rich_table 이미지 셀: 파일 선택 가능 (UUID 직접 입력 대체) |
| M6 | 점검 항목 추가 시 해당 항목 제목으로 결과 섹션 자동 생성 |
| M7 | No any types |
| M8 | SSOT: documentApi, queryKeys 등 기존 인프라 사용 |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S1 | 이미지 미리보기 표시 |
| S2 | 업로드 에러 시 사용자 피드백 |
| S3 | i18n 키 사용 (하드코딩 한국어 없음) |
