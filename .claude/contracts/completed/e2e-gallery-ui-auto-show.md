# e2e-gallery-ui-auto-show

## Scope

Inspection template gallery 자동 노출 흐름의 UI 회귀 방지.

## MUST

- `InspectionFormDialog` 부모 컴포넌트가 template 부재(404) + gallery match 존재 시 `TemplateGallery`를 `open=true`로 전달해야 한다.
- 테스트는 `TemplateGallery` 단품 렌더링이 아니라 부모의 자동 노출 조건을 직접 고정해야 한다.
- 기존 backend gallery API / 권한 검증 범위는 변경하지 않는다.

## Verification

- `pnpm --filter frontend test -- InspectionFormDialog.gallery.test.tsx --runInBand`

