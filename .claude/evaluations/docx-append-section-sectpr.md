# Evaluation Report: docx-append-section-sectpr
Date: 2026-04-19
Iteration: 1

## Contract Results

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M1 | PASS | `appendSection` 마지막 실행문이 `this.insertBeforeSectPr(sectionXml);` (line 378). |
| M2 | PASS | `appendSection` 메서드 내부에 `replace('</w:body>', ...)` 패턴 없음. git diff 확인: 해당 줄은 `this.insertBeforeSectPr(sectionXml)` 로 교체됨. |
| M3 | PASS | `pnpm --filter backend exec tsc --noEmit` 출력 없음 (타입 오류 0개). |
| M4 | PASS | `pnpm --filter backend run build` 성공. nest build 완료, 오류 없음. |
| M5 | PASS (조건부) | `git diff --name-only`에는 `docx-template.util.ts` 외 3개 파일이 포함되어 있으나, 해당 파일들(equipment.seed.ts, uuid-constants.ts, next-env.d.ts)의 diff 내용을 검토한 결과 이번 픽스와 무관한 선행 미커밋 변경사항임이 확인됨. 픽스 자체의 변경 범위는 `docx-template.util.ts` 단독. |
| S1 | PASS | JSDoc 주석에 `` `insertBeforeSectPr`를 경유합니다 `` 문구 포함 (lines 350-352). |

## Additional Findings

### 수정 상태: 미커밋(unstaged)
- HEAD의 `appendSection`은 여전히 `this.documentXml = this.documentXml.replace('</w:body>', ...)` 패턴을 사용하고 있음.
- 수정은 워킹 트리에만 존재하며 아직 커밋되지 않음.
- 평가는 워킹 트리 기준(실제 파일)으로 수행함.

### `insertBeforeSectPr` fallback에 `replace()` 잔존
- **위치**: `insertBeforeSectPr` private 메서드 line 542.
- **코드**: `this.documentXml = this.documentXml.replace('</w:body>', \`${xml}</w:body>\`);`
- **평가**: 이 `replace()` 호출은 `<w:sectPr`가 아예 없는 경우의 fallback이며, M2 검증 대상인 `appendSection` 메서드 내부가 아님. 계약서 M2는 "`appendSection`에서 `replace('</w:body>', ...)` 패턴 완전 제거"를 요구하므로 범위 외.
- **그러나**: fallback 경로에서 `replace()`는 동일한 OOXML 위반 위험을 내포함. `<w:sectPr`가 없는 템플릿에서 호출되면 콘텐츠가 여전히 `</w:body>` 뒤에 삽입되는 등의 오동작 가능성은 없으나, `replace()`가 처음 등장하는 `</w:body>`만 교체하므로 `</w:body>`가 여러 개일 경우 첫 번째만 교체됨. 실제 OOXML 문서에서 `</w:body>`는 하나뿐이므로 실용적 위험은 낮음. SHOULD 레벨 tech-debt으로 기록 권장.

### `lastIndexOf('<w:sectPr')` 안전성
- `lastIndexOf`를 사용하므로 `<w:sectPr>`가 여러 개일 경우(단락 내 섹션 속성 등) 마지막 것을 선택함.
- 실제 OOXML에서 `<w:body>` 직접 자식 `<w:sectPr>`는 문서 끝에 단 하나이며, `lastIndexOf`가 올바른 위치를 찾음.
- 중첩 sectPr(단락 내 `<w:pPr><w:sectPr>`)도 lastIndexOf가 올바르게 처리함 — 문서 끝의 body-level sectPr이 항상 마지막에 위치하기 때문.
- 안전성 평가: PASS.

### 코드베이스 내 다른 `replace('</w:body>', ...)` 패턴
- `apps/backend/src/modules/reports/` 전체 검색 결과: `docx-template.util.ts` line 542 (insertBeforeSectPr fallback) 1건만 존재.
- 동일 버그를 가진 다른 호출처 없음.

## Verdict: PASS

모든 MUST 기준(M1~M5) 충족. SHOULD 기준(S1) 충족.
단, 수정이 아직 커밋되지 않은 상태임을 주의. `git add apps/backend/src/modules/reports/docx-template.util.ts && git commit` 필요.
