# Handoff: qr-visual-redesign-followups-batch-1 SUSPENDED

## 발생일
2026-05-12 ~21:45 KST

## 상태
⏸ **SUSPENDED** — 다른 세션 `qr-visual-redesign-followups-g4-g12` 동시 진행으로 도메인 충돌 발견. 사용자 결정: 전면 중단 + 대기.

## 보존된 산출물 (재진입 시 재사용)

| 파일 | 상태 | 비고 |
|---|---|---|
| `.claude/contracts/qr-visual-redesign-followups-batch-1.md` | SUSPENDED 헤더 | MUST 16/SHOULD 6, 시니어 자기검토 7항목 통과 |
| `.claude/exec-plans/active/2026-05-12-qr-visual-redesign-followups-batch-1.md` | SUSPENDED 헤더 | 6 Phase 의존 순서 (S-6→S-4→S-3→S-1→S-7→closure) |
| `.claude/contracts/REGISTRY.md` | **미수정** | Active 등록 안 함 (다른 세션과 race 회피) |

## 충돌 분석

### 정면 충돌 (같은 파일 신규/수정)
- **S-3 vs G-5/G-9/M-10**: `apps/frontend/components/ui/__tests__/StatusBadge.test.tsx` — 두 세션이 동시에 같은 spec 신규 작성 시도
- **S-6 vs G-10/M-18**: `apps/backend/src/modules/equipment/services/qr-access.service.spec.ts` — 우리는 backward-compat assertion 제거, 다른 세션은 drizzle-stub SSOT import 추가

### 간접 충돌 (의존성)
- **S-1 시나리오 3 vs G-8/M-15**: `AutoProgressCountdown.tsx` — 다른 세션이 rAF 제거 + CSS transition 마이그레이션. 우리 e2e가 신 구현(role=timer DOM 구조 변경 가능) 검증해야
- **S-3 tone 클래스 vs G-7/M-13**: `apps/frontend/styles/globals.css` `--brand-color-*` 14개 oklch 마이그레이션 — StatusBadge tone class 매핑 변동 가능

### 충돌 없음 (단독 진행 가능)
- **S-4** `apps/backend/src/modules/documents/schedulers/orphan-photo-cleanup.scheduler.ts` (신규 모듈)
- **S-7** `docs/exec-plans/audits/2026-05-12-touch-target-44-to-48-audit.md` (신규 audit 문서)

### 차단 (양 세션 동일 사유)
- S-2 Storybook 미도입
- S-5 visual regression CI 미도입
- S-8 UX 팀 design review 의존

## 재진입 절차 (다른 세션 g4-g12 완료 후)

### Step 1: g4-g12 종료 확인
```bash
# completed/로 이동됐는지
ls -la .claude/contracts/completed/qr-visual-redesign-followups-g4-g12.md
ls -la .claude/exec-plans/completed/*qr-visual-redesign-followups-g4-g12*

# REGISTRY Active 섹션에서 제거됐는지
grep "qr-visual-redesign-followups-g4-g12" .claude/contracts/REGISTRY.md | grep -v "completed\|backlog"
# Expected: 0 lines (Active에서 빠짐)

# tech-debt-tracker [x] 마킹 확인
grep "qr-visual-redesign G-" .claude/exec-plans/tech-debt-tracker.md | grep -c "\[x\]"
# Expected: ≥9 (G-4~G-12 closure)
```

### Step 2: 도메인 충돌 재실측
g4-g12가 실제로 우리 충돌 도메인을 어떻게 처리했는지 확인:

```bash
# StatusBadge.test.tsx 존재 확인 (g4-g12에서 신규 생성됐어야)
test -f apps/frontend/components/ui/__tests__/StatusBadge.test.tsx && echo "StatusBadge spec EXISTS"

# case 수 확인 — g4-g12는 8 status × tone aria-label 위주. 우리 S-3 추가 6 case 가능성:
#   - HandoverPickerSheet.test.tsx 신규 (g4-g12 미포함)
#   - StatusBadge에서 fallback / a11y role 추가 case
grep -c "^\s*it(\|^\s*test(" apps/frontend/components/ui/__tests__/StatusBadge.test.tsx

# qr-access.service.spec.ts 변동
grep -nE "handoverCheckoutId|deprecatedHandoverCheckoutIdLogged" apps/backend/src/modules/equipment/services/qr-access.service.spec.ts
# g4-g12에서 stub만 도입했다면 backward-compat assertion 잔존 → S-6 가 그 제거 책임

# AutoProgressCountdown 신 구현 확인
grep -nE "requestAnimationFrame|setElapsed" apps/frontend/components/mobile/AutoProgressCountdown.tsx
# Expected: 0 (g4-g12 G-8 closure 후 — 그 후 우리 e2e가 신 구현 검증)
```

### Step 3: batch-2 재계획
batch-1 contract/exec-plan을 그대로 재활용하되, 다음 조정:

#### S-3 RTL spec — HandoverPickerSheet 단독으로 축소
g4-g12 G-9/M-10이 StatusBadge.test.tsx를 신규 생성한 상태라면:
- S-3 새 범위: `HandoverPickerSheet.test.tsx` 신규 단독 (6+ case)
- StatusBadge.test.tsx 보강 필요 시: 우리 추가 case (fallback / a11y role / focus-visible) append

#### S-6 deprecation 제거 — 그대로 진행
g4-g12 G-10이 drizzle-stub SSOT만 추가하고 `handoverCheckoutId` 자체는 손대지 않았다면:
- S-6 그대로 진행
- 우리는 backward-compat assertion + 9 호출자 잔존 제거

#### S-1 e2e — AutoProgressCountdown 신 구현 검증
g4-g12 G-8 CSS transition 마이그레이션 후:
- 시나리오 3에서 `role='timer'` 단언은 유지 (a11y 유지 검증)
- DOM 구조 변경 시 selector 조정

#### S-4 + S-7 — 즉시 단독 진행 가능
충돌 없음. batch-1을 (S-4 + S-7)만으로 즉시 재진입할 수도 있음.

### Step 4: contract/exec-plan SUSPENDED 헤더 제거
재진입 시 두 파일 상단 `> ⏸ SUSPENDED` 블록 제거 + 상태 필드 갱신:
- `상태: SUSPENDED → 진행 중`

### Step 5: REGISTRY Active 등록
```bash
# .claude/contracts/REGISTRY.md Active 테이블에 row 추가
| `qr-visual-redesign-followups-batch-1` | qr-visual-redesign SHOULD 후속 5건 (S-1/S-3/S-4/S-6/S-7) + 차단 3건 closure | YYYY-MM-DD |
```

## 학습 사항

### 사전 점검 SOP 강화
**문제**: 우리 첫 사전 점검은 `.claude/contracts/*.md` 파일 직접 grep만 했고 REGISTRY.md Active 섹션 표 확인은 불완전. 그래서 다른 세션이 **방금 등록한** 새 contract를 첫 점검에서 못 잡음 (`sw-validation-event-channel-separation`, `ultrareview-shield-followups`는 잡았지만 `qr-visual-redesign-followups-g4-g12`는 우리 점검 후에 추가됨).

**개선**:
1. harness 시작 시 REGISTRY.md Active 섹션 명시적 `head -30` 확인
2. **Same-sprint follow-up 충돌 사전 grep**: 모 sprint slug (`qr-visual-redesign`) 로 REGISTRY/contracts/ 전수 검색 — 후속 sprint 동시 진행 위험 인지
3. Planner 실행 직전 한 번 더 REGISTRY 재확인 (race 시점 차이)
4. Generator Phase 1 시작 직전 또 한 번 재확인 (가장 보수적)

### memory 업데이트 후보
- `feedback_multi_session_race_atomic_commit.md` 확장 — "Same-sprint follow-up 2 세션이 같은 모 sprint 후속을 동시 진행하면 도메인 자동 충돌. 사전 점검 SOP에 모 sprint slug grep 포함 필수"
- `feedback_handoff_stale_fact_verification.md` 확장 — "REGISTRY 첫 read 시점과 Planner 실행 시점 사이에 새 contract 등록 race 가능. Planner 직전 재확인"

## 관련 파일

- 모 sprint: `.claude/contracts/qr-visual-redesign.md`
- 우리 contract: `.claude/contracts/qr-visual-redesign-followups-batch-1.md` (SUSPENDED)
- 우리 exec-plan: `.claude/exec-plans/active/2026-05-12-qr-visual-redesign-followups-batch-1.md` (SUSPENDED)
- 충돌 다른 세션 contract: `.claude/contracts/qr-visual-redesign-followups-g4-g12.md` (active)

## tech-debt-tracker 처리

배치-1 S-1~S-8 항목은 tracker에서 그대로 유지 (수정 안 함). 다른 세션 g4-g12가 G-4~G-12를 [x] 마킹할 가능성 있음. 재진입 시 S-1~S-8 closure는 우리 책임.

## 다음 액션

1. 사용자: 다른 세션 g4-g12 종료 대기
2. 재진입 시: 위 Step 1-5 절차 따라 batch-2 (또는 batch-1 그대로) 재시작
3. 옵션: S-4 + S-7 만 단독 즉시 진행 가능 (충돌 0건) — 사용자 결정 사항
