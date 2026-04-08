# 행 액션 aria-label SSOT 롤아웃 구현 계획

## 메타
- 생성: 2026-04-08
- 모드: Mode 2
- 예상 변경: 9~13개 파일 (컴포넌트 3 + i18n 6 + e2e spec 0~6)

## 설계 철학
SelfInspectionTab이 도입한 컨텍스트 aria-label 패턴(`actions.*AriaLabel` + ICU 변수)을 동일 도메인의 행 액션 컴포넌트(IntermediateInspectionList, SoftwareTab, CalibrationHistorySection)로 확장하여 cross-component divergence를 제거한다. 도메인별 식별자(점검일/SW명/교정일)를 자연스러운 ICU 변수로 주입하고 `{date}` 강제 통일은 하지 않는다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| Calibration 새 키 3종 추가 | **거부** | 교정 기록 행에 edit/confirm 액션이 존재하지 않음. 기존 `deleteAriaLabel`/`detailAriaLabel`에 컨텍스트 주입만 수행 |
| Cable 적용 | **scope 제외** | CableDetailContent measurements 테이블에 행 단위 액션 자체가 없음. 케이블 헤더 edit 버튼은 행 액션이 아님. tech-debt-tracker에 자리 예약 기록 |
| IntermediateInspection 키명 | `submit/review/approve/rejectAriaLabel` | 실제 액션이 edit/confirm/delete가 아닌 워크플로 전환이므로 SelfInspection 키명을 강제 복사하지 않음 |
| Software 키명 | `unlinkAriaLabel` (`software.actions.*` 또는 기존 `softwareTab.*` 정합) | 실제 행 액션이 unlink 1종 |
| ICU 변수 | 컴포넌트별 자연 식별자 | intermediate=`{date}`, software=`{name}`, calibration=`{date}` |

## 구현 Phase

### Phase 1: i18n 키 추가
**목표:** 6개 namespace 파일에 `*AriaLabel` 키를 ICU 변수와 함께 추가하고 ko/en 대칭 유지.
**변경 파일:**
1. `apps/frontend/messages/ko/equipment.json` — `intermediateInspection.actions` 아래 `submit/review/approve/rejectAriaLabel` 4종 추가, ICU `{date}`
2. `apps/frontend/messages/en/equipment.json` — 동일 (영어)
3. `apps/frontend/messages/ko/software.json` — `unlinkAriaLabel` 추가 (기존 구조 정합 우선), ICU `{name}`
4. `apps/frontend/messages/en/software.json` — 동일 (영어)
5. `apps/frontend/messages/ko/calibration.json` — 기존 `delete/detailAriaLabel` 본문을 ICU `{date}` 변수 사용하도록 업데이트 (키 추가 X)
6. `apps/frontend/messages/en/calibration.json` — 동일 (영어)

**검증:** `pnpm --filter frontend exec tsc --noEmit` exit 0 + `/verify-i18n` PASS.

### Phase 2: 컴포넌트에 컨텍스트 aria-label 주입
1. `apps/frontend/components/equipment/IntermediateInspectionList.tsx` — `renderActions` 4개 Button(submit/review/approve/reject)에 `aria-label={t('intermediateInspection.actions.<action>AriaLabel', { date })}` 주입. 점검일은 `format(..., 'yyyy-MM-dd')` 일관 처리
2. `apps/frontend/components/equipment/SoftwareTab.tsx` — linkedSoftware unlink Button에 `aria-label`을 SW name으로 컨텍스트화
3. `apps/frontend/components/equipment/CalibrationHistorySection.tsx` — delete/detail Button의 기존 generic `aria-label`에 `{ date }` ICU 변수 주입

**검증:** `pnpm --filter frontend exec tsc --noEmit` exit 0 + `pnpm --filter frontend run test` exit 0.

### Phase 3: e2e spec 컨텍스트 셀렉터 전환 (조건부)
각 spec을 먼저 읽고 실제 매칭 라인 존재 시에만 수정. SelfInspectionTab spec과 동일 helper(`clickBelowStickyHeader`, `expectToastVisible`) 사용.
- `tests/e2e/workflows/wf-19-intermediate-inspection-3step-approval.spec.ts`
- `tests/e2e/workflows/wf-19b-intermediate-inspection-export.spec.ts`
- `tests/e2e/workflows/wf-14-software-change-approval.spec.ts`
- `tests/e2e/workflows/wf-14b-software-validation.spec.ts` (있으면)
- `tests/e2e/features/software/software-registry.spec.ts`
- `tests/e2e/features/calibration/management/calibration-management.spec.ts`

regex 패턴 예: `getByRole('button', { name: /submit.*\d{4}-\d{2}-\d{2}/i })`.

**검증:**
- `pnpm --filter frontend exec tsc --noEmit` exit 0
- `pnpm --filter frontend run test` exit 0
- `grep -rn "name: '수정'" apps/frontend/tests/e2e` → 자체점검/중간점검/케이블/SW/교정 spec 0건
- WF-20 회귀 통과

## 의사결정 로그
- 2026-04-08: Cable scope 제외 — measurements 테이블에 행 액션 없음
- 2026-04-08: Calibration 새 키 추가 거부 — 기존 키 본문에 ICU만 주입
- 2026-04-08: IntermediateInspection 키명 SelfInspection 1:1 복사 거부 — 실제 액션 종류 다름
