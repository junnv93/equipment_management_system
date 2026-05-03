# Contract: team-management-design-review

## Scope

팀 관리 도메인 시각 디자인 리뷰 HTML(`/mnt/c/Users/kmjkd/Downloads/팀관리_리뷰_standalone_src.html`)의 우선 개선 사항을 실제 프론트엔드에 반영한다.

## MUST

- 팀관리 목록/폼 개선은 SSOT 디자인 토큰을 경유해야 하며, 컴포넌트 내부에 반복 스타일 블록을 새로 하드코딩하지 않는다.
- `TeamForm`은 단일 카드 세로 스택이 아니라 의미 섹션 기반 2-column 레이아웃을 사용한다.
- 사이트 패널 빈 상태와 필터 결과 없음 상태는 다음 액션을 제공하고 권한별 CTA를 분기한다.
- 팀 목록 행은 네이티브 `button` 또는 `Link` 등 의미 요소를 사용하고 `div role="button"` 패턴을 제거한다.
- 검색 입력과 폼 입력은 Web Interface Guidelines 기준으로 label/aria, placeholder 줄임표, `name`/`autocomplete`를 갖춘다.
- 변경 후 `pnpm --filter frontend run type-check`가 PASS해야 한다.

## SHOULD

- 리스트 통계는 모바일에서도 줄바꿈/오버플로우 없이 scan 가능해야 한다.
- 기존 팀 도메인 i18n 구조를 유지하고 ko/en 메시지를 모두 갱신한다.
- 기존 E2E selector 호환성을 가능한 한 유지한다.

## Verification

- `pnpm --filter frontend run type-check`
- `pnpm --filter frontend run lint` 또는 변경 파일 정적 점검
- 팀관리 파일에 `role="button"` 회귀가 없는지 확인
