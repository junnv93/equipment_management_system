---
slug: verify-e2e-export-pairing
date: 2026-04-09
mode: 1
scope: verify-e2e Step 5b 룰을 cross-spec form-level pairing으로 승격
---

# Contract: verify-e2e Step 5b — Export Form Pairing

## Background

31차(2026-04-08) 발견: `wf-19b/20b/21` 3개 export spec이 `page.request.get` API 응답만 검증하고 UI 다운로드 동선을 cover 하지 않음. 35차에서 verify-e2e Step 5b에 per-file WARN 룰 추가됨 (`page.request` + no `waitForEvent('download')` → WARN).

그 후 `wf-export-ui-download.spec.ts` 가 추가되어 QP-18-01/07/08/09 를 UI로 커버하게 되었으나, Step 5b 룰은 여전히 **파일 단위**로 검사하여 API-only spec (회귀 가드로 의도적 유지)을 false WARN으로 보고한다. 결과: 쓸모없는 경고 → 무시 → 진짜 gap(QP-18-03/05/06/10)이 묻힘.

## Goal

Step 5b 룰을 **form identifier 단위 cross-spec pairing**으로 재설계:

- `tests/e2e/workflows/*.spec.ts` 전체를 스캔하여 각 spec 이 참조하는 UL-QP-18-XX 식별자 추출
- 각 식별자에 대해: (A) 어느 spec이 `page.request`로 API 검증하는가, (B) 어느 spec이 `waitForEvent('download')`로 UI 검증하는가
- **PASS**: 해당 양식에 A ≥ 1 이고 B ≥ 1
- **WARN**: A ≥ 1 이나 B = 0 (UI 다운스트림 없음)
- **INFO**: A = 0 이나 B ≥ 1 (UI 전용 — 회귀 가드 부재)

룰은 verify-e2e SKILL.md Step 5b 갱신 + references/step-details.md (존재 시)에 실행 가능 스크립트 블록으로 반영. tech-debt-tracker 항목을 룰 출력과 1:1 매핑되도록 정리.

## MUST Criteria

- **M1. SSOT**: 룰 기준이 verify-e2e/SKILL.md 한 곳에 명시되어야 한다. 중복 룰 (예: verify-workflows) 금지.
- **M2. No hardcoding**: spec 파일 경로/양식 식별자 리터럴을 룰 본문에 박지 않는다. `find`/`grep` 동적 탐지 또는 glob 만 사용.
- **M3. Cross-spec pairing 구현**: 검출 스크립트가 양식별로 API/UI 양쪽을 집계하여 WARN/INFO 를 구분해 보고해야 한다. 기존 per-file 검사 불가.
- **M4. No regression**: `pnpm tsc --noEmit` 영향 없음 (스킬/문서 전용). 기존 e2e spec 0 변경. 수정 범위는 스킬 문서 파일 + tech-debt-tracker 만 허용.
- **M5. 현 코드베이스 실측 일치**: 룰 실행 결과가 "QP-18-03/05/06/10 = WARN (backend-only)" 과 "QP-18-01/07/08/09 = PASS" 로 나와야 한다 (tech-debt-tracker 기록과 일치).
- **M6. tech-debt-tracker 항목 업데이트**: 엔트리가 룰 WARN 출력 양식 목록과 정확히 일치하도록 갱신.

## SHOULD Criteria

- **S1.** 스크립트는 bash one-liner 대신 읽기 쉬운 multi-line 블록으로 제공.
- **S2.** 룰 설명에 "false WARN 사례 제거 근거(wf-export-ui-download 가 QP-18-07/08/09 를 이미 커버)" 명시.
- **S3.** 향후 새 양식 추가 시 자동 감지되도록 양식 identifier regex (`UL-QP-18-[0-9]{2}`) 사용.

## Verification Commands

```bash
# M4: tsc 영향 없음 (스킬 문서만 변경)
git diff --name-only | grep -vE '\.claude/' && echo "FAIL: 스킬 외 파일 변경" || echo "PASS"

# M5: 룰 스크립트 직접 실행 → 출력이 기대값과 일치
bash -c "$(sed -n '/```bash/,/```/p' .claude/skills/verify-e2e/SKILL.md | grep -A200 'Step 5b')"
# 기대: WARN = UL-QP-18-03, -05, -06, -10 / PASS = -01, -07, -08, -09

# M1/M2: 중복 룰 탐지
grep -rn "waitForEvent.*download" .claude/skills/verify-*/ && echo "중복 검사"

# M6: tracker 엔트리 확인
grep -A2 "Export UI 다운로드" .claude/exec-plans/tech-debt-tracker.md
```

## Out of Scope

- QP-18-03/05/06/10 실제 UI spec 작성 (backend-only 양식이라 UI 진입점 부재, 별도 결정)
- cable-path-loss 성능 튜닝 (tracker 별건 finding, 아키텍처 범위 밖)
- verify-workflows 스킬 통합 여부 (현행 분리 유지)
