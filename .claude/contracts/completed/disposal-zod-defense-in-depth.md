# 스프린트 계약: Disposal & Calibration-Plan Zod Defense-in-Depth

## 생성 시점

2026-05-01T(UTC)

## 모드

Mode 1 (Lightweight) — 4~7 files, single domain (backend Zod defense + 1 frontend SSOT 격상)

## 배경 / 동기

이전 세션 `tech-debt-batch-0501`이 NC backend Zod 4 fields에 `.max() + .trim()` defense-in-depth를 적용하면서 disposal/opinion/comment의 동일 gap이 SHOULD 후속 항목으로 남았다. 추가로 system-wide Phase 0 audit 결과 `calibration-plans/dto/approve-calibration-plan.dto.ts`의 `rejectionReason`도 frontend `< 10` 하드코딩 + backend `min(1)` 동일 gap이 발견되어 본 sprint에 흡수.

**Tier 2(equipment-imports / calibration / inspections / software-validations / NC reject-correction)** — frontend가 ≥10 검증을 안 하므로 backend 격상 시 기존 사용자 입력 거부 회귀 가능. 별도 sprint(frontend ≥10 룰 추가 + backend 격상 페어링)로 후속화.

## 다른 세션 회피 영역 (절대 침범 금지)

- `apps/backend/test/*.e2e-spec.ts` — system_admin TestRole 도입 작업 중인 stale-contract-cleanup 세션
- `.claude/contracts/REGISTRY.md` — 다른 세션 in-flight
- `.claude/skills/{manage-skills,verify-e2e}/SKILL.md` — 다른 세션 수정 중
- `.claude/exec-plans/active/2026-05-01-inspection-template-*.md` — inspection workflow 세션
- `apps/frontend/lib/utils/calibration-status.ts` — 다른 세션 수정 중
- `apps/frontend/next-env.d.ts` — Next.js dev 자동 생성

## 변경 범위

### 백엔드 Zod (defense-in-depth)
1. `apps/backend/src/modules/equipment/dto/disposal.dto.ts`
   - `requestDisposalSchema.reasonDetail`: `.trim() + .max(LONG_TEXT_MAX_LENGTH)` 추가
   - `reviewDisposalSchema.opinion`: `.min(1)` → `.trim().min(REJECTION_REASON_MIN_LENGTH).max(LONG_TEXT_MAX_LENGTH)` 격상
   - `approveDisposalSchema.comment`: optional → `.trim().max(LONG_TEXT_MAX_LENGTH).optional()` (반려 케이스 검증은 service layer 또는 superRefine)

2. `apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts`
   - `rejectCalibrationPlanSchema.rejectionReason`: `.min(1)` → `.trim().min(REJECTION_REASON_MIN_LENGTH).max(LONG_TEXT_MAX_LENGTH)` 격상

### 프론트엔드 SSOT 격상 (하드코딩 제거)
3. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx`
   - `< 10` 하드코딩 2곳 → `< VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` SSOT 격상
   - `i18n` 메시지 `{min}` 파라미터화 (`reasonHint` 메시지)

### 검증 인프라 (회귀 차단)
4. `.claude/skills/verify-zod/SKILL.md` — Step 신설:
   - frontend `≥ VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` ↔ backend `.min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)` 동기화 강제 grep
   - rejection/reason/opinion/comment 패턴 `.trim()` 권고 grep

### i18n 메시지 (필요 시)
5. `apps/frontend/messages/ko/calibration.json`, `apps/frontend/messages/en/calibration.json`
   - `planDetail.dialogs.reject.reasonHint` `{min}` 파라미터화

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### M1 — 컴파일 / 빌드
- [ ] M1.1 `pnpm --filter backend tsc --noEmit` 에러 0
- [ ] M1.2 `pnpm --filter frontend tsc --noEmit` 에러 0
- [ ] M1.3 `pnpm --filter backend run build` 성공
- [ ] M1.4 (frontend full build는 시간 비용 큼 → tsc로 대체)

#### M2 — Backend Zod Defense-in-Depth
- [ ] M2.1 `disposal.dto.ts requestDisposalSchema.reasonDetail`: `.trim()` + `.min(REJECTION_REASON_MIN_LENGTH)` + `.max(LONG_TEXT_MAX_LENGTH)` 모두 존재
  - 검증: `grep -A 5 "reasonDetail:" apps/backend/src/modules/equipment/dto/disposal.dto.ts | grep -c "trim\|REJECTION_REASON_MIN_LENGTH\|LONG_TEXT_MAX_LENGTH"` ≥ 3
- [ ] M2.2 `disposal.dto.ts reviewDisposalSchema.opinion`: `.trim() + .min(REJECTION_REASON_MIN_LENGTH) + .max(LONG_TEXT_MAX_LENGTH)`
  - 검증: `grep -A 3 "opinion:" apps/backend/src/modules/equipment/dto/disposal.dto.ts | grep -c "REJECTION_REASON_MIN_LENGTH"` ≥ 1
- [ ] M2.3 `disposal.dto.ts approveDisposalSchema.comment`: `.trim() + .max(LONG_TEXT_MAX_LENGTH) + .optional()`
  - 검증: `grep -A 3 "comment:" apps/backend/src/modules/equipment/dto/disposal.dto.ts | grep -c "trim\|LONG_TEXT_MAX_LENGTH"` ≥ 2
- [ ] M2.4 `approve-calibration-plan.dto.ts rejectCalibrationPlanSchema.rejectionReason`: `.trim() + .min(REJECTION_REASON_MIN_LENGTH) + .max(LONG_TEXT_MAX_LENGTH)`
  - 검증: `grep -A 3 "rejectionReason:" apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts | grep -c "REJECTION_REASON_MIN_LENGTH"` ≥ 1

#### M3 — Frontend SSOT 격상 (하드코딩 제거)
- [ ] M3.1 `CalibrationPlanDetailClient.tsx`: `< 10` 하드코딩 0건
  - 검증: `grep -cE "rejectionReason\.trim\(\)\.length\s*<\s*10" apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` = 0
- [ ] M3.2 `CalibrationPlanDetailClient.tsx`: `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 사용 ≥ 2회
  - 검증: `grep -c "VALIDATION_RULES\.REJECTION_REASON_MIN_LENGTH" apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` ≥ 2
- [ ] M3.3 i18n `reasonHint` 메시지: `{min}` 파라미터 사용 (ko/en 양쪽)
  - 검증: `grep -c '"reasonHint"' apps/frontend/messages/ko/calibration.json apps/frontend/messages/en/calibration.json` (둘 다 키 존재 확인)

#### M4 — Backend 단위 테스트
- [ ] M4.1 disposal/calibration-plan 관련 backend test 통과
  - 검증: `pnpm --filter backend run test --testPathPattern='(disposal|calibration-plan)'` exit 0
- [ ] M4.2 새 .min()/.max() 회귀 없음 — 기존 테스트가 유효한 길이 입력 사용 중인지 확인

#### M5 — verify-zod SKILL Step 신설
- [ ] M5.1 verify-zod SKILL에 새 Step 추가 (Step 번호 미정 — 마지막 Step+1)
  - 검증: `grep -c "REJECTION_REASON_MIN_LENGTH 동기화\|VALIDATION_RULES 동기화" .claude/skills/verify-zod/SKILL.md` ≥ 1
- [ ] M5.2 grep 패턴이 contract grep 패턴 작성 규칙 준수 (`A.*B` 단일라인 안티패턴 금지)

#### M6 — verify-implementation 자동 선택 검증
- [ ] M6.1 verify-zod, verify-hardcoding, verify-ssot, verify-i18n 모두 PASS
- [ ] M6.2 변경 파일 경로 기반 자동 선택 (Mode 1 default)

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] S1 review-architecture: defense-in-depth 적용 일관성 검토 (Mode 2 아님이므로 optional)
- [ ] S2 disposal e2e 회귀 — comment/opinion 입력 ≥10자 케이스 통과
  - 본 sprint는 backend Zod만 — e2e 강제 아님. 다른 세션이 e2e-spec 수정 중이라 회피
- [ ] S3 Tier 2 항목 (equipment-imports, calibration, inspections, software-validations, NC reject-correction) tech-debt-tracker 등록 + 후속 sprint 제안
- [ ] S4 disposal frontend 메시지(`charCountMin`)와 backend Zod min 메시지의 i18n 톤 일치성
- [ ] S5 calibration-plan reject reason backend service layer (`calibration-plans.service.ts:688`) 추가 검증 — 이미 `rejectDto.rejectionReason.trim() === ''` 체크. 이중 검증 OK이므로 보존

---

## 적용 verify 스킬

- `verify-zod` — Zod schema 검증 (필수)
- `verify-hardcoding` — frontend `< 10` 하드코딩 제거 (필수)
- `verify-ssot` — VALIDATION_RULES 사용 일관성 (필수)
- `verify-i18n` — `{min}` 파라미터화 (필수)
- `verify-design-tokens` — 본 sprint scope 외 (skip)

---

## 종료 조건

- 필수 기준 전체 PASS → 성공 (Step 7로 진행)
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 tech-debt-tracker.md 기록만 후 PASS

---

## 의사결정 로그

### D1 — disposal `comment` optional 처리 방식
**결정**: `.trim().max().optional()` 만 적용. 반려 시 `.min()` 강제는 service layer에 맡김.
**근거**: 현재 frontend는 `showRejectInput && comment.length < 10` 으로 반려 분기에서만 강제. backend Zod에 conditional `superRefine`을 넣으면 `decision: 'reject'` 시점만 검증해야 하는데 dto 단계에서는 가능하나 코드 복잡도 증가. service layer가 이미 `decision === 'reject'` 분기를 가지고 있다면 거기서 fail-close 검증 추가가 더 직관적. 본 sprint는 max/trim/optional만 적용 (defense-in-depth 1차).

### D2 — Tier 2 도메인 후속화
**결정**: equipment-imports / calibration / intermediate-inspections / self-inspections / software-validations / calibration-factors / NC reject-correction 7개 도메인은 후속 sprint로.
**근거**: frontend가 `≥10` 강제 안 함. backend `.min(REJECTION_REASON_MIN_LENGTH)` 격상 시 기존 사용자 입력(1~9자) 거부 회귀. frontend 룰 추가 + backend 격상 페어링이 필수. tech-debt-tracker에 후속 등록.

### D3 — Tier 1 흡수
**결정**: calibration-plan은 frontend `< 10` 하드코딩이 이미 존재 → backend 격상 안전. SSOT 격상 동시 진행.

### D4 — `.max(LONG_TEXT_MAX_LENGTH)` 통일
**근거**: NC 패턴(`tech-debt-batch-0501`)과 일관성. DB schema는 별도(text 무제한), Zod는 unbounded input DoS 방지용 500자 cap.

### D5 — VM 메시지 helper 사용
**결정**: 새 `VM.disposal.opinion.min(N)`, `VM.disposal.comment.min(N)` 추가 대신 일반화 `VM.string.min('field', N)` 사용.
**근거**: VM dictionary 비대화 회피. NC 패턴(`VM.string.min('조치 내용', N)`)과 일관성.

---

## Out of Scope (명시적 제외)

- Tier 2 도메인 (별도 sprint)
- disposal frontend 검증 변경 (이미 SSOT)
- disposal e2e 신규 spec (다른 세션 도메인)
- backend service layer 검증 변경 (defense-in-depth는 Zod 단계가 충분)
