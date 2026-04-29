# Contract: bundle-gate (PR-11 번들 크기 측정 게이트)

**작업**: `scripts/measure-bundle.mjs` 신규 생성 + package.json 스크립트 추가
**날짜**: 2026-04-24
**Mode**: 1 (Lightweight)

---

## Context

- 체크 ⑧(FSM 리터럴), ⑨(hex 색상)는 이미 `self-audit.mjs`에 구현 완료
- `@next/bundle-analyzer@16.2.3` 이미 설치됨, `"analyze": "ANALYZE=true next build"` 스크립트 존재
- 남은 작업: checkouts 관련 bundle size baseline 측정 + 증가분 경고 게이트
- PR-10(NC elevation): `NC_ELEVATION = ELEVATION_TOKENS.surface` alias 이미 완료됨

---

## MUST Criteria (루프 차단)

| # | 기준 | 검증 방법 |
|---|------|-----------|
| M1 | `scripts/measure-bundle.mjs` 파일이 존재하고 Node.js로 실행 가능 | `node scripts/measure-bundle.mjs --help` → exit 0 |
| M2 | `--no-build` 옵션: 빌드 없이 `.next/` 기존 결과 파싱 시도, 결과 없으면 안내 메시지 후 exit 1 | `node scripts/measure-bundle.mjs --no-build` 실행 검증 |
| M3 | `tsc --noEmit` PASS (스크립트 자체는 `.mjs`이므로 frontend tsc만) | `pnpm --filter frontend exec tsc --noEmit` |
| M4 | `bundle-baseline.json` 포맷: `{ generatedAt, tolerancePct, routes: { [route]: firstLoadKb } }` (check-bundle-size.mjs 호환) | JSON.parse 가능 + routes 키 존재 |
| M5 | 기존 `package.json` scripts에 `"measure:bundle"` 추가 (root 또는 frontend) | `grep "measure:bundle"` |
| M6 | `self-audit.mjs --all` exit 0 유지 (스크립트 파일은 `.mjs`라 TS 체크 대상 아님) | `node scripts/self-audit.mjs --all` |

---

## SHOULD Criteria (후속 PR로 처리 가능)

| # | 기준 |
|---|------|
| S1 | checkouts 관련 라우트를 Next.js 빌드 stdout에서 자동 식별 |
| S2 | 8KB (gzipped 기준) 초과 시 `⚠️ 경고` 출력 |
| S3 | `--compare` 옵션으로 baseline 대비 증가분 출력 |
| S4 | `scripts/bundle-baseline.json`이 `.gitignore`에 추가되지 않음 (버전 관리 대상) |

---

## 제외 범위

- PR-10 NC elevation 리팩토링: 이미 완료됨 (`NC_ELEVATION = ELEVATION_TOKENS.surface`)
- `scripts/self-audit.mjs` 체크 ⑧⑨: 이미 구현됨
- `@next/bundle-analyzer` 설치: 이미 완료됨

---

## 성공 기준 (commit 가능 조건)

M1~M6 전체 PASS.
