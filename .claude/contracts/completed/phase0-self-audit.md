---
slug: phase0-self-audit
date: 2026-04-18
mode: 1
---

# Contract: Phase 0 — pre-commit self-audit 자동화

## MUST Criteria (전부 통과 필수)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `scripts/self-audit.mjs` 존재 + Node.js 20에서 실행 가능 | `node scripts/self-audit.mjs --help \|\| node scripts/self-audit.mjs --all` 실행 시 오류 없음 |
| M2 | `--all` 모드로 현재 코드베이스 스캔 시 exit 0 | `node scripts/self-audit.mjs --all; echo $?` → 0 |
| M3 | 의도적 위반 코드 추가 시 `--staged` 모드 exit 1 + 체크리스트 출력 | `git add` 후 `node scripts/self-audit.mjs --staged` → exit 1 |
| M4 | `.husky/pre-commit`에 `node scripts/self-audit.mjs --staged` 추가됨 | `grep -n "self-audit" .husky/pre-commit` → 1 hit |
| M5 | `main.yml` quality-gate job에 self-audit 스텝 추가됨 | `grep -n "self-audit" .github/workflows/main.yml` → 1 hit |
| M6 | tech-debt-tracker.md C1 이미지 썸네일 항목 `[x]` 처리됨 | grep 확인 |
| M7 | tech-debt-tracker.md pre-commit self-audit 항목 `[x]` 처리됨 | grep 확인 |
| M8 | `docs/references/self-audit.md` 존재 + 7개 규칙 문서화 | `wc -l docs/references/self-audit.md` > 50 |

## SHOULD Criteria (실패 시 tech-debt에 기록, 루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | self-audit.mjs가 staged 파일 목록 없을 때 gracefully exit 0 |
| S2 | 각 체크에 파일명:라인번호 포함 |
| S3 | `--staged` 와 `--all` 플래그 없을 때 usage 출력 |

## 7대 체크 항목 커버리지

| # | 체크 | --staged | --all |
|---|------|----------|-------|
| ① | 하드코딩 URL (`?action=`, `/e/[A-Z]`, `/handover?`, `/checkouts/.+?scope=`) | 적용 | 적용 |
| ② | eslint-disable 신규 추가 | 적용 | 스킵 (기존 tracked) |
| ③ | any 타입 신규 추가 | 적용 | 스킵 (기존 tracked) |
| ④ | SSOT 우회 (QR_CONFIG/LABEL_CONFIG 재정의) | 적용 | 적용 |
| ⑤ | role 리터럴 비교 | 적용 | 적용 |
| ⑥ | onSuccess 내 setQueryData | 적용 | 적용 |
| ⑦ | icon 버튼 aria-label 누락 | 적용 | 스킵 (기존 tracked) |

## 변경 파일

- `scripts/self-audit.mjs` (신규)
- `.husky/pre-commit` (수정)
- `.github/workflows/main.yml` (수정 — quality-gate job에 스텝 추가)
- `.claude/exec-plans/tech-debt-tracker.md` (동기화)
- `docs/references/self-audit.md` (신규)
