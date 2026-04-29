# Contract: scope-mismatch-export-gate

## Summary
팀 스코프 사용자가 site 단위 리소스(UL-QP-18-07, UL-QP-18-09)의 export 버튼을 클릭하면 백엔드가 403을 반환하는 버그 수정.
FORM_CATALOG에 `siteOnly` 메타데이터를 추가하고, ExportFormButton이 이를 읽어 팀 스코프 사용자에게 버튼을 숨기는 방식으로 해결.

## Scope
- `packages/shared-constants/src/form-catalog.ts`
- `apps/frontend/components/shared/ExportFormButton.tsx`

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `FormCatalogEntry`에 `siteOnly?: boolean` 필드 추가 | TypeScript interface 확인 |
| M2 | UL-QP-18-07, UL-QP-18-09에 `siteOnly: true` 설정 | FORM_CATALOG 항목 확인 |
| M3 | ExportFormButton: `siteOnly=true` + `user.teamId` 존재 시 `null` 반환 | 코드 확인 |
| M4 | ExportFormButton: `siteOnly=false` 또는 undefined 시 기존 동작 유지 | 코드 확인 |
| M5 | `pnpm --filter frontend run tsc --noEmit` PASS | tsc 실행 결과 |
| M6 | `pnpm --filter shared-constants run tsc --noEmit` PASS (있는 경우) | tsc 실행 결과 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | 8개 ExportFormButton 호출 지점 변경 불필요 (FORM_CATALOG SSOT가 처리) |
| S2 | FORM_CATALOG 주석에 siteOnly 필드 설명 추가 |

## Success Definition
- 팀 스코프 사용자(user.teamId !== undefined)가 /software 페이지를 방문할 때 UL-QP-18-07 export 버튼이 보이지 않음
- 사이트 스코프 사용자에게는 버튼이 정상 노출됨
- 403 에러가 백엔드 로그에 더 이상 발생하지 않음
