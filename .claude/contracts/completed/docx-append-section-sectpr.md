---
slug: docx-append-section-sectpr
mode: 1
date: 2026-04-19
---

# Contract: appendSection OOXML sectPr 위반 수정

## 문제 요약

`DocxTemplate.appendSection`이 `</w:body>` 직접 교체 방식을 사용하여 `<w:sectPr>` 이후에 콘텐츠를 삽입.
OOXML 규격 위반 → Word가 document repair 시 빈 섹션(빈 페이지) 생성.

영향 범위:
- 중간점검 (intermediate-inspection-renderer.service.ts) — appendItemPhotos → appendSection
- 자체점검 (self-inspection-renderer.service.ts) — 동일 패턴

장비이력카드는 appendSection 미사용 → 코드 수정 대상 외.

## MUST 기준 (위반 시 FAIL)

- [ ] M1: `appendSection` 마지막 줄이 `insertBeforeSectPr(sectionXml)` 사용
- [ ] M2: `appendSection`에서 `replace('</w:body>', ...)` 패턴 완전 제거
- [ ] M3: `pnpm --filter backend run tsc --noEmit` PASS
- [ ] M4: `pnpm --filter backend run build` PASS
- [ ] M5: 변경 범위가 `docx-template.util.ts` 1파일에 한정 (수술적 변경)

## SHOULD 기준 (실패 시 tech-debt 기록, 루프 차단 없음)

- [ ] S1: `appendSection`의 JSDoc 주석이 `insertBeforeSectPr` 방식을 기술
