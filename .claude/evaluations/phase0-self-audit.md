# Evaluation: phase0-self-audit
date: 2026-04-18
iteration: 1

## MUST Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | `scripts/self-audit.mjs` 존재 + Node.js 20에서 실행 가능 | PASS | 파일 존재 확인, `--all` 실행 시 오류 없음 |
| M2 | `--all` 모드로 현재 코드베이스 스캔 시 exit 0 | PASS | `node scripts/self-audit.mjs --all` → exit 0, 1702개 파일 검사 완료 |
| M3 | 의도적 위반 코드 추가 시 `--staged` 모드 exit 1 + 체크리스트 출력 | PASS | `role === 'admin'` 포함 파일 staged 후 → exit 1, `⑤ role 리터럴 (1건): 📍 파일:라인` 출력 확인 |
| M4 | `.husky/pre-commit`에 `node scripts/self-audit.mjs --staged` 추가됨 | PASS | 2 hits (주석 1 + 실행 명령 1). 계약 검증 방법 "1 hit"는 최솟값 기준으로 해석, 실제 실행 명령 존재 확인 |
| M5 | `main.yml` quality-gate job에 self-audit 스텝 추가됨 | PASS | 2 hits (주석 1 + 실행 명령 1). `Self-Audit — 아키텍처 원칙 위반 감지` step 이름으로 `node scripts/self-audit.mjs --all` 포함 |
| M6 | tech-debt-tracker.md C1 이미지 썸네일 항목 `[x]` 처리됨 | PASS | `[x] **[2026-04-18 completion] 🟡 MEDIUM C1 이미지 썸네일 server-side 리사이징**` — `[x]` 확인 |
| M7 | tech-debt-tracker.md pre-commit self-audit 항목 `[x]` 처리됨 | PASS | `[x] **[2026-04-17 qr-phase3] 🟢 LOW pre-commit self-audit 자동화**` — `[x]` 확인 |
| M8 | `docs/references/self-audit.md` 존재 + 7개 규칙 문서화 | PASS | 176줄, 7대 규칙(①~⑦) 모두 개별 섹션으로 문서화 확인 |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | self-audit.mjs가 staged 파일 목록 없을 때 gracefully exit 0 | PASS | staged 파일 없을 때 `✅ self-audit (staged): 검사할 TypeScript 파일 없음` 출력 후 exit 0 |
| S2 | 각 체크에 파일명:라인번호 포함 | PASS | 위반 출력 형식: `📍 apps/frontend/components/test-s2-TEMP.tsx:2` — 파일명:라인 확인 |
| S3 | `--staged` 와 `--all` 플래그 없을 때 usage 출력 | PASS | `node scripts/self-audit.mjs` → Usage 메시지 출력 후 exit 0 |

## Issues Found

### MUST Failures

없음.

### SHOULD Failures

없음.

## 7대 체크 항목 커버리지 검증

| # | 체크 | --staged | --all | 구현 확인 |
|---|------|----------|-------|----------|
| ① | 하드코딩 URL | 적용 | 적용 | `checkHardcodedUrls` — 4개 패턴, `isStaged` 조건 없음 |
| ② | eslint-disable 신규 추가 | 적용 | 스킵 | `if (!isStaged) return` 가드 확인 |
| ③ | any 타입 신규 추가 | 적용 | 스킵 | `if (!isStaged) return` 가드 확인 |
| ④ | SSOT 우회 | 적용 | 적용 | `checkSsotBypass` — `isStaged` 조건 없음 |
| ⑤ | role 리터럴 비교 | 적용 | 적용 | `checkRoleLiterals` — `isStaged` 조건 없음 |
| ⑥ | onSuccess 내 setQueryData | 적용 | 적용 | `checkSetQueryDataInOnSuccess` — `isStaged` 조건 없음 |
| ⑦ | icon 버튼 aria-label 누락 | 적용 | 스킵 | `if (!isStaged) return` 가드 확인 |

계약 스펙의 --staged/--all 구분과 구현이 정확히 일치함.

## 추가 관찰 사항 (보고 목적)

1. **M4/M5 hits 수**: 계약 검증 방법은 "1 hit"이나 실제로는 2 hits. 주석 라인이 포함된 결과이므로 실질적 위반이 아닌 계약 문구 모호성에 기인. 실행 명령은 각각 정확히 1개 존재.
2. **출력 포맷 아쉬움**: `--staged` 결과 출력 후 `─` 문자 68개 반복 줄이 과다하게 출력됨 (violations.length === 0인 케이스에서도 separator가 불필요하게 출력됨). 기능적 결함 아님 — SHOULD에 미포함.
3. **체크 ⑥ 휴리스틱 경계**: onSuccess 등장 후 12줄 내 setQueryData 탐지 방식은 false negative 가능성 존재 (블록이 12줄 초과 시). 현재 기능 요건 외 범위.

## Overall Verdict

**PASS**

8개 MUST 기준 전부 통과, 3개 SHOULD 기준 전부 통과.

## Repair Instructions

해당 없음 (PASS).
