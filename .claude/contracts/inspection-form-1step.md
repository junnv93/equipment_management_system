---
slug: inspection-form-1step
mode: 1
created: 2026-04-10
scope: 중간점검 기록폼 1-step UX 재설계 검증
---

# Contract: inspection-form-1step

## Scope

`apps/frontend/components/inspections/` 디렉토리의 중간점검 기록폼 관련 컴포넌트 6개:

- `InspectionFormDialog.tsx` — 메인 폼 다이얼로그
- `InlineResultSectionsEditor.tsx` — 결과 섹션 인라인 편집기
- `ResultSectionFormDialog.tsx` — 결과 섹션 추가/수정 서브 다이얼로그
- `ResultSectionPreview.tsx` — 결과 섹션 미리보기
- `ResultSectionsPanel.tsx` — 결과 섹션 패널 (상세 뷰용)
- `CheckItemPresetSelect.tsx` — 점검항목 프리셋 셀렉트
- `SelfInspectionFormDialog.tsx` — 자체점검 폼 (참조용)

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M1 | `tsc --noEmit` PASS | `pnpm --filter frontend run tsc --noEmit` |
| M2 | Frontend build PASS | `pnpm --filter frontend run build` |
| M3 | Backend test PASS | `pnpm --filter backend run test` |
| M4 | verify-implementation PASS | 13 verify-* skills 실행 |
| M5 | SSOT 준수 — schemas/shared-constants에서 import | verify-ssot |
| M6 | TypeScript strict — `any` 타입 없음 | verify-implementation |
| M7 | 서버사이드 userId 추출 패턴 준수 | verify-security |

## SHOULD Criteria

| ID | Criterion | Notes |
|----|-----------|-------|
| S1 | Design token 활용 | `lib/design-tokens` import — 프로젝트 149개 파일이 사용 중 |
| S2 | 빈 상태에 아이콘/CTA 제공 | AP-09 개선 |
| S3 | judgment 상태 시각적 피드백 | AP-05 개선 |
| S4 | 간격 리듬 계층화 | AP-02 개선 |
| S5 | 접근성 — focus-visible, sr-only | AP-08 개선 |
