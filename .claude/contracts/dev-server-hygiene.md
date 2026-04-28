---
slug: dev-server-hygiene
mode: 1
domain: workflow / dev environment
created: 2026-04-28
---

# Contract — Dev Server Hygiene (좀비 프로세스 + 매니페스트 desync 재발 방지)

## 배경

세션 종료/PC 이동/Claude 세션 재시작 누적 결과로 `turbo run dev` + `next dev` + `nest start --watch` 프로세스가 정리되지 않고 누적됨. 두 set 이상 동시 실행 시 같은 `.next/dev` 디렉토리를 동시에 쓰며 매니페스트 desync 발생 → `app-paths-manifest.json`이 일부 라우트만 가지고 있어 `/login`·`/api/auth/*`가 404 반환.

직접 fix(좀비 종료 + cache 클린 + 재기동)는 1회성. 워크플로 가드 없으면 다음 세션에 재발.

## 목표 (Architecture Improvement)

1. **Idempotent dev startup**: `pnpm dev:fresh`로 좀비 정리 + 캐시 클린 + 재기동을 한 명령에 묶기.
2. **Diagnostic SSOT**: `pnpm dev:doctor`로 현재 dev 환경 상태(좀비/캐시/포트) 진단만.
3. **Early warning**: SessionStart hook이 좀비 detect 시 알림 (kill은 사용자 결정).
4. **Hygiene SSOT 문서**: 증상/원인/복구를 한 곳에 정리.
5. **하드코딩 금지**: 포트·프로세스 패턴은 SSOT 상수 또는 package.json 기반 도출.

## MUST 기준 (Loop-Blocking)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `scripts/dev-fresh.mjs` 작성 — 좀비 SIGTERM(grace 5s)→SIGKILL, `.next/dev` 정리, `pnpm dev` 재기동 | `node scripts/dev-fresh.mjs --dry-run` 실행 시 대상 PID 나열 + 캐시 경로 보고 |
| M2 | `scripts/dev-doctor.mjs` 작성 — 진단 전용, kill/clean 액션 없음 | `node scripts/dev-doctor.mjs` 실행 시 ok/warn/fail 리포트 출력, exit 0(ok)/1(warn)/2(fail) — POSIX 진단 도구 표준 3단계 |
| M3 | root `package.json`에 `"dev:fresh"` + `"dev:doctor"` 스크립트 추가 | `jq -r '.scripts | keys[]' package.json \| grep -E '^dev:(fresh\|doctor)$'` 매칭 2건 |
| M4 | `.claude/settings.json` SessionStart hook 확장 — 좀비 turbo/next/nest 카운트 후 경고만 (kill 금지) | `jq '.hooks.SessionStart[0].hooks[].command' .claude/settings.json \| grep -E "dev-doctor\|dev:doctor"` 매칭 (어느 인덱스든 OK; git-sync 등 기존 hook 우선순위 보존) |
| M5 | `docs/references/dev-server-hygiene.md` 작성 — 증상/원인/복구/예방 4섹션 | `wc -l docs/references/dev-server-hygiene.md` ≥ 60 |
| M6 | CLAUDE.md에 dev:fresh + 문서 링크 추가 (Build/Lint/Test 섹션) | `grep -E "dev:fresh\|dev-server-hygiene" CLAUDE.md` 매칭 |
| M7 | 하드코딩 금지: 포트(3000/3001)·프로세스 패턴은 root `package.json` workspace 또는 `infra` SSOT에서 도출 | `grep -nE "3000\|3001" scripts/dev-fresh.mjs scripts/dev-doctor.mjs` — 직접 숫자 0건, `package.json`/env 경유 1건 이상 |
| M8 | `node --check scripts/dev-fresh.mjs scripts/dev-doctor.mjs` 모두 통과 | shell exit 0 |
| M9 | `pnpm dev:doctor` 실행 → 좀비/캐시 진단 정상 수행 (현재 시스템에서 검증) | exit 0(ok)/1(warn)/2(fail) 중 하나, JSON-구조화 출력 (또는 명확한 텍스트 표) |
| M10 | dev-doctor가 SessionStart hook 본체로직과 SSOT 공유 — hook이 dev-doctor 호출 (커맨드 인라인 중복 금지) | `jq -r '.hooks.SessionStart[0].hooks[].command' .claude/settings.json \| grep -c "dev-doctor\\|dev:doctor"` ≥ 1 (인덱스 무관) |

## SHOULD 기준 (Non-Blocking)

| # | Criterion |
|---|-----------|
| S1 | dev-fresh가 confirm 프롬프트 (`--force`로 우회) — 사용자 안전성 우선 |
| S2 | dev-fresh가 backend container(docker compose) 보존 — DB/Redis는 dev 좀비 아님, 건드리지 않음 |
| S3 | dev-doctor 출력이 색상/마커로 ok/warn/fail 구분 (TTY 감지) |
| S4 | dev-fresh에 `--no-restart` 플래그 — 정리만 하고 재기동은 사용자에 위임 |
| S5 | hygiene 문서가 매니페스트 desync 증거 체인 (app-paths-manifest.json 검사 방법) 포함 |

## 검증 명령 (Evaluator 사용)

```bash
# M1, M2: 스크립트 신택스 + dry-run + exit 코드
node --check scripts/dev-fresh.mjs && node --check scripts/dev-doctor.mjs
node scripts/dev-fresh.mjs --dry-run
node scripts/dev-doctor.mjs; ec=$?; echo "exit=$ec"   # 0/1/2 중 하나면 OK

# M3: package.json 스크립트
jq -r '.scripts | keys[]' package.json | grep -E '^dev:(fresh|doctor)$' | wc -l   # ≥ 2

# M4, M10: SessionStart hook (인덱스 무관 — 어느 hook 슬롯에 배치되어도 OK)
jq -r '.hooks.SessionStart[0].hooks[].command' .claude/settings.json | grep -c "dev-doctor\|dev:doctor"   # ≥ 1

# M5: 문서 길이
test -f docs/references/dev-server-hygiene.md && wc -l docs/references/dev-server-hygiene.md   # ≥ 60

# M6: CLAUDE.md 참조
grep -E "dev:fresh|dev-server-hygiene" CLAUDE.md | head   # 매칭 ≥ 2

# M7: 하드코딩 — 코드 직접 숫자 0건
grep -nE "\b3000\b|\b3001\b" scripts/dev-fresh.mjs scripts/dev-doctor.mjs

# M8: syntax
node --check scripts/dev-fresh.mjs && node --check scripts/dev-doctor.mjs && echo OK

# M9: JSON 모드 (hook이 사용)
node scripts/dev-doctor.mjs --json | head -c 200; echo
```

## 비범위 (Out of Scope)

- proxy.ts / NextAuth 코드 변경 (정상 동작 확인됨, 매니페스트 desync는 환경 문제)
- Next.js 버전 업그레이드
- Docker compose / DB 스키마 변경
- 좀비 자동 종료 (사용자 결정 영역, 알림만)
