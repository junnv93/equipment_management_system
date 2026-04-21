---
slug: sw-status-ssot-eslint
type: contract
created: 2026-04-21
---

# Contract: sw-status-ssot-eslint

## Scope

프론트엔드 전체 도메인 status 리터럴 SSOT 통합 + ESLint 회귀 방지 룰.

## MUST Criteria

- M1: `pnpm tsc --noEmit` errors = 0
- M2: `pnpm --filter frontend run lint` errors = 0 (신규 no-restricted-syntax 룰 포함)
- M3: 잔존 도메인 리터럴 0건:
  `grep -rn "\.status\s*===\s*'" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "\.next\|tests/e2e\|eslint-disable\|'all'\|'uploading'\|'valid'\|'warning'\|'error'\|'duplicate'\|'fulfilled'\|'number'" | grep -v "Promise\|promis"` → 0건
- M4: ESLint 룰 실효성 — `no-restricted-syntax` rule이 `eslint.config.mjs`에 등록됨
- M5: Promise.allSettled 4건 + UploadedFile 1건 = 5곳 모두 eslint-disable 주석 존재
- M6: `DocumentStatusValues`가 `packages/schemas/src/document.ts`에 export됨

## SHOULD Criteria

- S1: 모든 신규 import는 `@equipment-management/schemas` 배럴 경유
- S2: 기존 import 구문에 합쳐 단일 import 유지 (중복 import 줄 없음)
