---
slug: ultrareview-shield-followups-sh1-sh4-r2
title: ultrareview-shield-followups SH-1~SH-4 Round 2 (SIGINT 수정)
mode: 1
date: 2026-05-13
---

# Contract: ultrareview-shield-followups-sh1-sh4-r2

## 배경

SH-1~SH-4는 이전 세션(commit `cb426431`)에서 구현됨.
현재 미커밋 diff: spec 파일 SH-2 SIGINT 테스트를 `$$` → `$PPID`로 변경.
그러나 `kill -s INT $PPID` 방식은 비-인터랙티브 bash에서 shield가 exit 0으로 종료되어 테스트 실패.

## 수정 범위

- `scripts/__tests__/ultrareview-shield.spec.mjs` — SH-2 SIGINT 테스트 수정
  - SIGTERM: `$PPID` 방식 유지 (shield bash 직접 수신 → exit 143 → trap 발화)
  - SIGINT: `$$` self-signal 방식으로 변경 (자식 exit 130 → set -e → exit 130 → trap 발화)
  - 두 방식의 차이와 실제 사용 시나리오 주석 명시

## MUST 기준

| # | 기준 | 검증 방법 |
|---|------|----------|
| M-1 | `node --test scripts/__tests__/ultrareview-shield.spec.mjs` 12/12 PASS | 실행 확인 |
| M-2 | SIGTERM 테스트: `$PPID` 방식 유지, status != 0 어서션 | grep `$PPID` |
| M-3 | SIGINT 테스트: `$$` self-signal 방식, status != 0 어서션 | grep `kill.*INT.*\$\$` |
| M-4 | SH-1 flock contention: 동일 lock 보유 중 두 번째 shield EXIT 1 | 테스트 PASS |
| M-5 | SH-3 stale GC: `shield GC` 메시지 + stale dir 삭제 | 테스트 PASS |
| M-6 | SH-4 budget: EXIT 0/1 + 메시지 | 테스트 PASS |
| M-7 | SSOT 단방향: spec 내 env 패턴 하드코딩 없음 | 테스트 PASS |
| M-8 | 하드코딩 없음: 신호 이름 외 매직 상수 없음 | 코드 검토 |

## SHOULD 기준

| # | 기준 |
|---|------|
| S-1 | 두 신호 방식의 차이(이유, 실사용 시나리오)를 주석으로 명확히 설명 |
| S-2 | 함수명이 동작을 명확히 반영: `runPpidSignalRestoreTest` (TERM) vs 적절한 함수명 (INT) |
