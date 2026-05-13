# Contract: ultrareview-shield-multiuser-race

**Sprint**: review-architecture §3.4 closure
**Date**: 2026-05-13
**Mode**: 1
**Parent review**: `/home/kmjkds/.claude/plans/modular-percolating-hippo.md` §3.4

---

## Background

`scripts/ultrareview-shield.sh:183-196` `stale_gc()` 함수가 `find /tmp -maxdepth 1 ... -name 'ur-shield-*' -mmin +60` 으로 전 uid 소유 디렉토리 GC. flock(`/tmp/ur-shield.lock`) 은 동일 lock-file만 보호 — 같은 호스트의 다른 사용자가 자신의 `SHIELD_LOCK` env 로 shield 를 병행 실행 가능 → 다른 사용자의 active 격리본(SIGSTOP/장기 hang 등) 을 1시간 후 `rm -rf` → `.env*` 영구 손실.

영향 환경:
- `/tmp` 공유 멀티유저 시스템 (CI runner, Linux shared dev box)
- 단일 사용자 워크스테이션: 영향 없음

---

## MUST Criteria

### M-1: stale_gc 에 uid filter 적용
- `find ... -user "$(id -un)"` 또는 등가 필터 추가
- 본인 소유 디렉토리만 GC 대상
- 검증:
  ```bash
  grep -nE "id -un|-user" scripts/ultrareview-shield.sh
  # → 1건 이상
  ```

### M-2: spec 회귀 차단
- `scripts/__tests__/ultrareview-shield.spec.mjs` 기존 SH-3 stale GC spec 통과 (uid filter 추가 후에도)
- 신규 spec: 본인 uid 디렉토리는 GC, 가짜 다른 uid 시뮬레이션은 (test runner 권한 한계로) 스킵 처리 또는 documented
- 검증:
  ```bash
  node --test scripts/__tests__/ultrareview-shield.spec.mjs
  # → 기존 통과 + 신규 통과
  ```

### M-3: 기능 회귀 0
- 본 환경에서 `--self-test` 통과
- `pnpm ur:shield -- echo ok` 정상 작동
- 검증:
  ```bash
  pnpm ur:shield -- /bin/true
  # → EXIT=0
  ```

---

## SHOULD Criteria

### S-1: 격리 경로 마이그레이션 (tech-debt)
- `$HOME/.cache/ur-shield/` 또는 `$XDG_RUNTIME_DIR/` 로 격리 위치 이동 — 향후 follow-up
- 본 sprint 는 uid filter 만 surgical fix

### S-2: PID 임베드 + kill -0 검증
- mktemp 에 `${$}` PID 임베드 + GC 전 `kill -0 $pid` 살아있는지 확인 — 향후 follow-up

---

## Verification Commands

```bash
grep -nE "id -un|-user" scripts/ultrareview-shield.sh
node --test scripts/__tests__/ultrareview-shield.spec.mjs 2>&1 | tail -10
SHIELD_LOCK=/tmp/ur-shield-sprint-c-test.lock pnpm ur:shield -- /bin/true; echo "EXIT=$?"
```
