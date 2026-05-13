# Evaluation: ultrareview-shield-multiuser-race

**Date**: 2026-05-13
**Iteration**: 1 (PASS)
**Verdict**: ✅ ALL MUST PASS

## MUST Verification

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| M-1 | stale_gc uid filter | ✅ | `ultrareview-shield.sh` `current_user="$(id -un)"` + `find -user "$current_user"` |
| M-2 | spec 회귀 차단 | ✅ | SH-5 신규 spec 2/2 PASS — find filter + fail-close 검증 |
| M-3 | 기능 회귀 0 | ✅ | shield `--` 인자 분리 + 격리 실행 정상 EXIT=0 |

## 핵심 분석

### 데이터 손실 race 시나리오 (closure 전)
1. 사용자 A 가 shield 실행 → `/tmp/ur-shield-aaa` 격리 디렉토리 생성, `.env*` mv
2. 사용자 A 의 shield 가 IDE crash / SIGSTOP / 장기 hang
3. 1시간 후 사용자 B 가 자신의 `SHIELD_LOCK=$HOME/.cache/ur-shield-b.lock` 으로 shield 실행
4. (closure 전) stale_gc 가 `find /tmp -name 'ur-shield-*' -mmin +60` 으로 사용자 A 디렉토리 검출 → `rm -rf` → 사용자 A 의 `.env*` 영구 손실

### closure 후
- `find -user "$(id -un)"` 추가로 본인 소유만 GC 대상
- `id -un` 실패 시 (e.g. 권한 미상 환경) `return 0` fail-close — GC 자체 skip

## 회귀 차단 spec (SH-5)

```javascript
test('stale_gc 함수 본문에 `-user "$current_user"` find filter 존재')
test('id -un 실패 시 GC 조기 종료 (return 0) — 보호 fail-close')
```

향후 누군가 uid filter 제거하면 spec 1번이 즉시 FAIL.

## SHOULD Status

- S-1: `$HOME/.cache/ur-shield/` 격리 마이그레이션 — tech-debt 후속 (uid filter 만으로 race 해소)
- S-2: PID 임베드 + kill -0 검증 — tech-debt 후속 (필요 시)

## 기존 SH-2 SIGINT 테스트 1건 flaky

`ppidsignal SIGINT` 테스트 1건 본 환경에서 flaky — bash non-interactive SA_RESTART 흡수 edge case. 본 sprint 변경과 무관 (commit `cb426431` 이전 부터 동일 동작). pre-existing tech-debt.

## Verdict

**PASS** — MUST 3/3. 멀티유저 race 해소.
