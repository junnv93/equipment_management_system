# Evaluation Report: Disposal & Calibration-Plan Zod Defense-in-Depth

## 반복 #1 (2026-05-01T)

---

## 계약 기준 대조

### M1 — 컴파일

| 기준 | 판정 | 상세 |
|------|------|------|
| M1.1 backend tsc --noEmit 에러 0 | PASS | `pnpm --filter backend exec tsc --noEmit` exit 0, 에러 없음 |
| M1.2 frontend tsc --noEmit 에러 0 | PASS | `pnpm --filter frontend exec tsc --noEmit` exit 0, 에러 없음 |
| M1.3 backend build (tsc 통과로 대체) | SKIP | 시간 비용으로 tsc 통과 대체 (계약 M1.4 정책) |

### M2 — Backend Zod Defense-in-Depth

| 기준 | 판정 | 상세 |
|------|------|------|
| M2.1 `requestDisposalSchema.reasonDetail`: `.trim()` + `REJECTION_REASON_MIN_LENGTH` + `LONG_TEXT_MAX_LENGTH` | PASS | grep 결과 5건(≥3). 실제 코드 disposal.dto.ts L23~34 확인: `.trim()`, `.min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH, ...)`, `.max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH, ...)` 모두 존재 |
| M2.2 `reviewDisposalSchema.opinion`: `.trim()` + `REJECTION_REASON_MIN_LENGTH` + `LONG_TEXT_MAX_LENGTH` | PASS | grep 결과 2건(≥1). 실제 코드 L49~58 확인: 3가지 모두 존재 |
| M2.3 `approveDisposalSchema.comment`: `.trim()` + `LONG_TEXT_MAX_LENGTH` + `.optional()` | PASS | grep 결과 3건(≥2). 실제 코드 L73~81: `.trim()`, `.max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH, ...)`, `.optional()` 확인. min 의도적 제외 — 계약 D1 결정 준수 |
| M2.4 `rejectCalibrationPlanSchema.rejectionReason`: `.trim()` + `REJECTION_REASON_MIN_LENGTH` + `LONG_TEXT_MAX_LENGTH` | PASS | grep 결과 2건(≥1). 실제 코드 approve-calibration-plan.dto.ts L63~74 확인: 3가지 모두 존재 |

### M3 — Frontend SSOT 격상

| 기준 | 판정 | 상세 |
|------|------|------|
| M3.1 `CalibrationPlanDetailClient.tsx`: `rejectionReason.trim().length < 10` 하드코딩 0건 | PASS | grep 결과 0 |
| M3.2 `CalibrationPlanDetailClient.tsx`: `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 사용 ≥ 2회 | PASS | grep 결과 4건(≥2). 구체적 위치: placeholder {min} 전달(L540), 클래스 조건(L550), hint {min} 전달(L557), disabled 조건(L570) |
| M3.3 ko/en `reasonHint` `{min}` 파라미터화 | PASS | ko: `"{count}/{min}자 이상 입력"`, en: `"{count}/{min} characters minimum"` — 양쪽 모두 {min} 파라미터 포함. `reasonPlaceholder` 역시 양쪽 {min} 파라미터화 완료 |

### M4 — Backend 단위 테스트

| 기준 | 판정 | 상세 |
|------|------|------|
| M4.1 disposal/calibration-plan 관련 테스트 통과 | PASS | `pnpm --filter backend run test --testPathPattern='(disposal\|calibration-plan)'` 실행 결과: 3 suites, 40 tests, 모두 PASS. (disposal 단독 pattern은 매칭 0건 — 별도 disposal spec 파일 없음, calibration-plan 3개 spec에서 40건 모두 통과) |
| M4.2 회귀 없음 | PASS | 기존 40건 fixture 모두 통과, 새 .min()/.max() 검증 통과 |

### M5 — verify-zod SKILL Step 신설

| 기준 | 판정 | 상세 |
|------|------|------|
| M5.1 verify-zod SKILL에 Step 15 추가, `REJECTION_REASON_MIN_LENGTH 동기화\|VALIDATION_RULES 동기화` 텍스트 존재 ≥ 1 | **FAIL** | Step 15가 추가되었으나(SKILL.md:510) 계약서 검증 명령인 `grep -c "REJECTION_REASON_MIN_LENGTH 동기화\|VALIDATION_RULES 동기화"` 결과 **0**. Step 15 제목은 `"Frontend \`< N\` 하드코딩 ↔ Backend Zod \`.min(N)\` SSOT 동기화 강제"` — 해당 정확한 문자열이 없음 |
| M5.2 Step 15 grep 패턴이 `A.*B` 단일라인 안티패턴 미사용 | PASS | Step 15의 3개 검증 명령 모두 JSON 객체 키 조합 탐지가 아닌 코드 패턴 탐지. pipe 체인 분리 방식 사용 — 안티패턴 해당 없음 |

### M6 — verify-implementation 자동 선택 검증

| 기준 | 판정 | 상세 |
|------|------|------|
| M6.1 verify-zod Step 15 명령 1 (frontend 하드코딩 0건) | PASS | grep 결과 0건 |
| M6.1 verify-hardcoding (CalibrationPlanDetailClient.tsx `< 10` 0건) | PASS | grep 결과 0건 |
| M6.1 verify-ssot (VALIDATION_RULES import 경로) | PASS | `from '@equipment-management/shared-constants'` L44~47에서 `VALIDATION_RULES` 임포트 확인 |
| M6.1 verify-i18n (ko/en reasonHint `{min}` parity) | PASS | ko: `{count}/{min}자 이상 입력`, en: `{count}/{min} characters minimum` — 양쪽 동일 파라미터 구조 |
| M6.2 변경 파일 경로 기반 자동 선택 | PASS | disposal.dto.ts, approve-calibration-plan.dto.ts, CalibrationPlanDetailClient.tsx, calibration.json 경로가 verify-zod / verify-hardcoding / verify-ssot / verify-i18n 자동 선택에 부합 |

---

## SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| S1 review-architecture (optional) | SKIP | Mode 1 scope 외 |
| S2 disposal e2e 회귀 | SKIP | 계약 정책: 다른 세션(e2e-spec) 회피 영역, SKIP 허용 |
| S3 Tier 2 항목 tech-debt-tracker 등록 | 미확인 | 계약 D2에서 후속화 결정, tracker 등록 여부 별도 확인 필요. 루프 차단 없음 |
| S4 disposal frontend 메시지 톤 일치성 | SKIP | 범위 외 |
| S5 calibration-plan service layer 이중 검증 보존 | PASS | 코드 확인 불필요 — 계약 S5 기준 "이미 OK, 보존"으로 정의됨 |

---

## 다른 세션 도메인 침범 여부

| 파일 | 상태 | 판정 |
|------|------|------|
| `apps/backend/test/*.e2e-spec.ts` | M(수정됨) | **세션 시작 전부터 수정된 상태** (시스템 컨텍스트 gitStatus 확인: 세션 시작 시점에 이미 M 표시). 본 sprint에 의한 침범 아님 |
| `.claude/contracts/REGISTRY.md` | M(수정됨) | 세션 시작 전부터 수정 상태. stale-contract-cleanup 세션의 변경 |
| `.claude/skills/manage-skills/SKILL.md` | M(수정됨) | 세션 시작 전부터 수정 상태. diff 내용: verify-e2e 설명 업데이트 — stale-contract-cleanup/inspection 세션의 변경 |
| `.claude/skills/verify-e2e/SKILL.md` | M(수정됨) | 세션 시작 전부터 수정 상태. Step 23~25 추가 — stale-contract-cleanup 세션의 변경 |
| `.claude/exec-plans/active/2026-05-01-inspection-template-*.md` | 변경 없음 | 침범 없음 |
| `apps/frontend/lib/utils/calibration-status.ts` | M(수정됨) | 세션 시작 전부터 수정 상태. `EquipmentStatus` 타입 cast 수정 — 다른 세션의 변경 |
| `apps/frontend/next-env.d.ts` | M(수정됨) | Next.js 자동 생성 파일 — 계약 명시적 예외 |

**판정: 본 sprint에 의한 다른 세션 도메인 침범 없음.** 수정된 회피 영역 파일들은 모두 세션 시작 이전부터 이미 변경된 상태 (시스템 컨텍스트 gitStatus 스냅샷 기준).

---

## 전체 판정: FAIL (M5.1 1건 미달)

**실패 기준**: M5.1 FAIL — `grep -c "REJECTION_REASON_MIN_LENGTH 동기화\|VALIDATION_RULES 동기화"` 결과 0

---

## 수정 지시 (FAIL 이슈)

### 이슈 1: M5.1 — verify-zod SKILL.md Step 15 제목에 계약 검증 텍스트 누락

- **파일**: `.claude/skills/verify-zod/SKILL.md:510`
- **문제**: 계약서 M5.1 검증 명령이 `grep -c "REJECTION_REASON_MIN_LENGTH 동기화\|VALIDATION_RULES 동기화"` ≥ 1을 요구하나, 현재 Step 15 헤더는 `"Frontend \`< N\` 하드코딩 ↔ Backend Zod \`.min(N)\` SSOT 동기화 강제"` 로 해당 문자열이 없음. grep 0건.
- **수정**: Step 15 헤더 또는 본문에 `REJECTION_REASON_MIN_LENGTH 동기화` 또는 `VALIDATION_RULES 동기화` 텍스트를 추가. 예시:

  현재:
  ```
  ### Step 15: Frontend `< N` 하드코딩 ↔ Backend Zod `.min(N)` SSOT 동기화 강제 (2026-05-01 추가)
  ```
  수정:
  ```
  ### Step 15: Frontend `< N` 하드코딩 ↔ Backend Zod `.min(N)` — REJECTION_REASON_MIN_LENGTH 동기화 / VALIDATION_RULES 동기화 강제 (2026-05-01 추가)
  ```

  또는 본문 내 설명에 아래 문장 삽입:
  ```
  본 Step은 frontend VALIDATION_RULES 동기화와 backend REJECTION_REASON_MIN_LENGTH 동기화를 동시 검증한다.
  ```

- **검증**: 수정 후 `grep -c "REJECTION_REASON_MIN_LENGTH 동기화\|VALIDATION_RULES 동기화" .claude/skills/verify-zod/SKILL.md` ≥ 1 확인

---

## 반복 #2 (2026-05-01)

### 이전 반복 대비 변화

| 기준 | 반복 #1 | 반복 #2 | 비고 |
|------|---------|---------|------|
| M5.1 `REJECTION_REASON_MIN_LENGTH 동기화\|VALIDATION_RULES 동기화` ≥ 1 | FAIL (grep 결과 0) | **PASS** (grep 결과 1) | Step 15 헤더에 두 키워드 괄호 명시로 해소 |
| M1.1~M1.2 (tsc) | PASS | PASS | 회귀 없음 |
| M2.1~M2.4 (Backend Zod) | PASS | PASS | 회귀 없음 |
| M3.1~M3.3 (Frontend SSOT) | PASS | PASS | 회귀 없음 |
| M4.1~M4.2 (단위 테스트) | PASS | PASS | 회귀 없음 |
| M5.2 (A.*B 안티패턴 미사용) | PASS | PASS | 회귀 없음 |
| M6.1~M6.2 (verify-implementation) | PASS | PASS | 회귀 없음 |

### 도메인 침범 확인

보호 대상 파일들(`apps/backend/test/*.e2e-spec.ts`, `.claude/contracts/REGISTRY.md`, `.claude/skills/{manage-skills,verify-e2e}/SKILL.md`, `apps/frontend/lib/utils/calibration-status.ts`)은 세션 시작 gitStatus 스냅샷에서 이미 M 상태 — 이번 fix(verify-zod/SKILL.md)와 무관한 기존 변경. 새로 변경된 파일은 `.claude/skills/verify-zod/SKILL.md` 단독.

### 전체 판정: **PASS**

모든 MUST 기준 (M1~M6) PASS. M5.1 FAIL → PASS 전환 확인. 기존 PASS 항목 회귀 없음.
