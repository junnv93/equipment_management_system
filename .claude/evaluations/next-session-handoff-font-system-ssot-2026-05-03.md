# Next Session Handoff: Font System SSOT

이번 세션에서 폰트 정책을 `packages/shared-constants/src/font-policy.ts`로 승격하고,
프론트 UI, QR 라벨, 이메일, XLSX/PDF/DOCX 출력물, CSP, prebuild drift 검증까지 같은
SSOT를 보도록 정리했다.

## 완료된 것

- `FONT_FAMILY`, `FONT_STACKS`, `CSS_FONT_STACKS`, `FONT_CSS_VARIABLES`,
  `FONT_USAGE_CLASSES`, `DOCUMENT_FONT_POLICY` 추가
- `RootLayout`에서 `FONT_CSS_VARIABLES`를 `<html style>`로 주입
- `globals.css`의 `--font-*`는 `--ems-font-*` runtime var만 참조
- `brand.ts`의 `FONT` helper는 `FONT_USAGE_CLASSES` 기반
- QR 라벨 `fontStack`은 `CSS_FONT_STACKS.koreanUi` 기반
- 이메일/Excel/PDF/DOCX/seed signature font 사용처는 공유 정책 기반
- backend Helmet에서 unused Google Fonts CSP host 제거
- `scripts/check-font-policy-sync.mjs`를 `prebuild`에 추가
- Harness/Evaluator PASS 및 session-final verify/manage-skills 리포트 작성

## 검증 결과

- `node scripts/check-font-policy-sync.mjs` PASS
- `pnpm tsc --noEmit` PASS
- `pnpm --filter frontend run type-check` PASS
- `pnpm --filter backend run type-check` PASS
- `pnpm --filter frontend run build` PASS
- `pnpm --filter backend run build` PASS
- `pnpm --filter frontend run test -- font-policy` PASS
- `pnpm --filter backend run test -- email-template report-export` PASS

## 다음 세션 시작 멘트

> 이전 세션에서 `font-system-ssot` 작업이 완료되어 커밋/푸시까지 진행됐다. 먼저
> `.claude/evaluations/next-session-handoff-font-system-ssot-2026-05-03.md`,
> `.claude/evaluations/session-final-verify-implementation-font-system-ssot-2026-05-03.md`,
> `.claude/evaluations/session-final-manage-skills-font-system-ssot-2026-05-03.md`를 읽고
> 폰트 정책 SSOT 상태를 확인해라. 작업 트리에는 이 세션과 무관한 calibration scope guard 관련
> 변경이 남아 있을 수 있으니, 후속 작업 전 `git status --short`로 범위를 분리해서 진행해라.
