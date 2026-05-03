# Session Final Manage Skills: Font System SSOT

## 분석 범위

`font-system-ssot` 세션에서 변경한 파일만 분석했다. 기존 calibration scope guard 변경은 제외했다.

## 변경 패턴

| 패턴 | 관련 파일 | 기존 커버리지 |
|------|-----------|---------------|
| 공유 상수 SSOT 신설 | `packages/shared-constants/src/font-policy.ts`, `src/index.ts`, `qr-config.ts` | `verify-ssot`, `verify-hardcoding` |
| 프론트 디자인 토큰/전역 CSS 연결 | `app/layout.tsx`, `styles/globals.css`, `lib/design-tokens/**` | `verify-design-tokens`, `verify-nextjs`, `verify-ssot` |
| 출력물 폰트 정책 통합 | backend email/report/DOCX/XLSX renderer | `verify-ssot`, `verify-hardcoding`, `verify-security` |
| CSP drift 제거 | `helmet-config.ts` | `verify-security`, `verify-routing-origin` |
| prebuild drift 검증 추가 | `scripts/check-font-policy-sync.mjs`, `package.json` | `verify-ssot`, `verify-hardcoding` |

## 커버리지 갭 분석

| 항목 | 판정 | 근거 |
|------|------|------|
| 새 verify-* 스킬 필요성 | 불필요 | 폰트 정책은 SSOT/hardcoding/design-token/security의 교차 규칙이며, 별도 도메인 스킬을 만들 정도의 독립 워크플로우는 아님. |
| 기존 스킬 업데이트 필요성 | 불필요 | drift 방지는 `scripts/check-font-policy-sync.mjs`를 `prebuild`에 연결해 자동화됨. verify 스킬 본문을 늘리는 것보다 실행 가능한 게이트가 더 강함. |
| CLAUDE.md 스킬 인덱스 변경 | 불필요 | 새 skill 생성 없음. |
| docs/references/skills-index.md 변경 | 불필요 | 새 skill 생성 없음. |
| verify-implementation 테이블 변경 | 불필요 | 기존 verify-* 목록 변경 없음. |

## 자동화 승격 평가

폰트 정책 drift는 grep 문서 규칙보다 `scripts/check-font-policy-sync.mjs`가 더 적합하다.
이 스크립트는 다음을 prebuild에서 강제한다.

- `globals.css`의 `--font-*`가 `--ems-font-*` runtime var만 참조
- `RootLayout`가 `FONT_CSS_VARIABLES`를 주입
- backend Helmet이 unused Google Fonts host를 허용하지 않음

## 결론

신규 스킬 생성/기존 스킬 수정 없이 종료한다. 현재 커버리지는 충분하며, font policy drift는
prebuild 자동화로 방어한다.
