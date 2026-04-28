# Architecture Review: i18n-parity-hardening

Date: 2026-04-28
Reviewer: review-architecture skill (frontend stream)

## 요약

| 영역 | 상태 | 발견 사항 |
|---|---|---|
| Atom 결합 위치 적절성 | CONCERN | `components/shared/` 유지 + 예외 문서화 형태는 허용 가능하나 정책 텍스트 자체에 내적 모순이 존재 |
| 5중 게이트 책임 분리 | OK | 5층 각각이 다른 회귀 클래스를 잡으며 보완 관계 유지. 제거 불가 |
| 검증 스크립트 책임 | OK | 책임 분리 명확. 통합 불필요 |
| shadowed binding 컨벤션 | CONCERN | `tCommon` 패턴이 6개 파일에 걸쳐 일관되나, `RepairHistoryClient.tsx`가 `equipment.common` ns를 `tCommon`으로 명명 — `common` ns와 혼동 가능 |
| Cache coherence | OK | next-intl 빌드타임 번들링, TanStack Query 미사용, localStorage/sessionStorage 미사용 — i18n 변경은 캐시 레이어에 영향 없음 |
| Dead code 삭제 영향 | OK | `lib/i18n/client.ts` 삭제 후 잔재 import 0건. 스토리북/테스트 픽스처 영향 없음 |
| Atom prop 강제성 일관성 | CONCERN | `loadingLabel: string` (required) vs `InlineActionButton.loadingLabel?: string` 불일치. fallback이 영어 하드코딩 'Loading…' |
| Cross-cutting ns 구조 검증 누락 | WARNING | `navigation.json`(60+ flat root keys), `notifications.json`(3 flat root keys)가 structural check 대상에서 제외됨. 의도적 누락이나 실제 취약점 |
| Caller DRY | OK | 현재 4 caller이므로 helper hook 추출은 이른 최적화. 6+ caller 시 재평가 권고 |
| e2e smoke 견고성 | CONCERN | `/equipment/[id]/non-conformance`(38건 회귀의 핵심 라우트)가 시드 의존성 회피로 커버 제외. 회귀 발생 시 정적 게이트는 잡으나 런타임 검증 공백 |

---

## 발견된 이슈 (심각도순)

### [Warning] navigation.json / notifications.json structural check 미적용

- **파일:** `scripts/check-i18n-call-sites.mjs:330–348` (`checkCommonJsonStructure` 함수)
- **문제:**
  `common.json`에 대해서만 flat root-level key 금지 구조 검증을 수행하며 `navigation.json`과 `notifications.json`은 검증 대상 외다. 그러나 실측 결과:
  - `navigation.json`: root level에 60+ flat string 키 존재 (`dashboard`, `equipment`, `calibration` 등). 현재 `DashboardShell.tsx`, `MobileNav.tsx` 등 layout 컴포넌트가 `t('dashboard')` 형태로 flat key를 직접 호출 중.
  - `notifications.json`: root level에 `title`, `subtitle`, `comingSoon` 3개 flat string 키 존재. `NotificationsListContent.tsx`가 `t('title')` 형태로 호출 중.
  - 이 두 namespace는 common과 동일한 "cross-cutting" 성격이지만 structural check 대상에서 제외됨.
- **현재 위험 수준:** 이 flat key들은 이미 호출지와 JSON이 정렬되어 있어 즉각적인 누락 회귀는 없다. 단, 향후 누군가가 이 ns에서 키를 정리할 때 `check-i18n-call-sites.mjs`가 잡겠지만, 구조적 퇴행(flat key 추가)은 잡지 못한다.
- **근본 원인:** `common.json` structural check의 정책 근거(atom이 flat common key를 호출하면 자기모순 회귀)가 navigation/notifications에는 적용되지 않음. navigation은 주로 layout 컴포넌트가 소비하며 atom이 직접 호출하지 않는 특성이 있어 위험도 차이는 있으나 명시적 범위 결정이 코드에 없음.
- **수정안:**
  ```js
  // check-i18n-call-sites.mjs에 checkCrossNsStructure 함수 추가
  const CROSS_CUTTING_NS_POLICY = {
    'common': 'sub-namespace-only',   // atom 원칙 — flat 금지
    'navigation': 'flat-allowed',     // layout 전용 — flat 허용 (명시 예외)
    'notifications': 'flat-allowed',  // notification 컴포넌트 전용 — flat 허용 (명시 예외)
  };
  ```
  또는 더 간단하게 `checkCommonJsonStructure` 함수 상단 주석에 "navigation/notifications는 layout/feature 전용이므로 flat key 허용 — 의도적 정책 외" 명시.
- **참고:** `frontend-patterns.md`의 "Atom-level i18n 금지 원칙" 예외 섹션(line 243)이 `components/shared/` vs `components/checkouts/` 위치 트레이드오프를 언급하나, navigation/notifications flat key 허용 정책은 명시되지 않음.

---

### [Warning] `frontend-patterns.md` 예외 섹션 내적 모순

- **파일:** `docs/references/frontend-patterns.md:243`
- **문제:**
  예외 섹션 텍스트: "도메인-결합이 명시적인 전용 컴포넌트(예: `NextStepPanel`이 `checkouts.fsm` namespace를 사용하는 부분)는 `useTranslations('checkouts.fsm')` 직접 호출 가능. **다만 이 경우 컴포넌트 위치는 `components/checkouts/`에 두는 것이 SSOT 위반이 아니나, `components/shared/`에 둘 때는 namespace 결합을 props으로 끌어올리는 것이 일관적이다.**"
  이 문장은 "shared에 있으면 props으로 끌어올려야 일관적"이라고 하면서, 실제로는 `checkouts.fsm`을 `components/shared/NextStepPanel.tsx`에서 직접 호출하는 현 구현을 예외로 허용한다. 정책 텍스트와 실제 허용 구현이 상충하여 다음 기여자가 혼란을 겪을 수 있다.
- **영향:** 낮음(현재 코드 동작에는 영향 없음). 그러나 다음 개발자가 "shared에 있으면 props으로 끌어올려야 한다"는 문장을 읽고 NextStepPanel을 수정하거나, 반대로 같은 패턴을 다른 atom에 적용하는 근거로 오용할 수 있다.
- **수정안:** 예외 섹션 텍스트를 다음으로 정밀화:
  "도메인-결합이 **명시적으로 JSDoc에 기록된** 전용 컴포넌트(예: `NextStepPanel`의 `checkouts.fsm`)는 `components/shared/` 위치에서도 해당 namespace 직접 호출을 허용한다. 단, cross-cutting namespace(`common`, `errors` 등)는 위치에 관계없이 prop 주입 필수."

---

### [Info] `loadingLabel: string` (required) vs `InlineActionButton.loadingLabel?: string` (optional) 비대칭

- **파일:** `apps/frontend/components/shared/NextStepPanel.tsx:63`, `apps/frontend/components/ui/inline-action-button.tsx:55`
- **문제:**
  `NextStepPanel.loadingLabel`은 required(`string`), `InlineActionButton.loadingLabel`은 optional(`string?`, fallback `'Loading…'`).
  `InlineActionButton`의 fallback은 영어 하드코딩 `'Loading…'` (line 65)으로, 한국어 환경에서 prop 미전달 시 영어가 sr-only로 노출된다.
  두 atom의 강제 수준이 다른 이유가 코드/문서 어디에도 설명되지 않음.
- **현재 위험 수준:** `InlineActionButton`을 직접 사용하는 호출지에서 `loadingLabel` 미전달 시 스크린리더에 `'Loading…'` 영어 발화. MEMORY.md의 "빈 문자열 fallback 금지" 원칙과 부분 충돌.
- **트레이드오프:**
  - required로 통일: 기존 호출지 전수 수정 필요 (규모 불명), breaking change
  - optional 유지 + 문서화: 현실적이나 회귀 위험 잔존
  - 권고: `InlineActionButton.loadingLabel`의 기본값을 `undefined`로 변경 + fallback 제거하고, 스크린리더가 버튼 텍스트를 그대로 읽도록 처리하거나 최소한 `'...'` 중립 fallback으로 교체. required 강제는 향후 caller 전수 정비 후.
- **참고:** `NextStepPanel`이 required로 한 것은 "빈 문자열 fallback 금지" 원칙 적용(JSDoc line 60-61) — 이 원칙을 `InlineActionButton`에도 일관 적용할지 여부가 결정되지 않은 상태.

---

### [Info] `RepairHistoryClient.tsx`의 `tCommon` 변수명 혼동 가능성

- **파일:** `apps/frontend/components/equipment/RepairHistoryClient.tsx:122`
- **문제:**
  ```typescript
  const tCommon = useTranslations('equipment.common'); // ← 'equipment.common' ns
  ```
  다른 파일들(`CheckoutGroupCard.tsx:101`, `CheckoutDetailClient.tsx:100`, `ReceiveEquipmentImportForm.tsx:62`)의 `tCommon`은 모두 `useTranslations('common')` 바인딩이다. `RepairHistoryClient.tsx`만 `equipment.common`을 `tCommon`으로 명명하여 코드 리뷰 시 혼동을 유발한다.
- **영향:** 기능적 문제는 없으나, 정적 검증 스크립트가 shadowed binding 감지에서 "같은 변수명 다른 ns"로 오탐할 가능성(현재는 파일 단위 shadow 감지이므로 cross-file 비교는 미수행 — 실제 오탐 없음). 코드 가독성 저하.
- **수정안:** `tCommon` → `tEquipmentCommon` 또는 `tEqCommon`으로 명명. 컨벤션: `t` = 주 도메인 ns, `t<Domain>` = 보조 도메인 ns, `tCommon` = 항상 `common` ns 전용.

---

### [Info] e2e smoke 커버리지 — NC detail 라우트 공백

- **파일:** `apps/frontend/tests/e2e/features/i18n/no-missing-message.spec.ts:36`
- **문제:**
  본 회귀의 핵심 발생 라우트인 `/equipment/[id]/non-conformance`가 시드 의존성 회피로 제외되었다. 현재 smoke spec은 `/checkouts`, `/equipment`, `/non-conformances` list 라우트 3개를 커버한다.
  - list 라우트는 `non-conformances.management.*` 키를 실제로 렌더링하지 않을 수 있음(management 키는 detail/edit 페이지에서 사용).
  - 즉, 본 회귀가 재발해도 정적 게이트(`check-i18n-call-sites.mjs`)는 잡지만 e2e는 놓친다.
- **현재 위험:** 정적 게이트가 1차 차단을 담당하므로 즉각적 위험은 낮다. 그러나 e2e의 "런타임 검증" 목적이 부분적으로 달성되지 않음.
- **두 가지 옵션 평가:**
  - (a) 시드 fixture 추가하여 NC detail 라우트 커버: 높은 신뢰성, but seed-coupled 테스트 fragility 증가 + 테스트 유지보수 비용
  - (b) 현재 유지: 낮은 비용, 정적 게이트 의존
  - 권고: e2e fixture에 nc-equipped 장비가 이미 있다면 (a) 채택. 없다면 (b) 유지 + tech-debt 등록으로 충분. 핵심 방어는 이미 정적 게이트가 담당.

---

## Positive Findings (아키텍처 강점)

1. **5중 게이트 설계 우수:** TypeScript required prop → static call-site validator → common.json structural check → pre-push → e2e smoke 각각이 독립적 회귀 클래스를 잡는다:
   - TS required: caller가 prop을 아예 누락하는 케이스
   - call-site validator: 존재하지 않는 키를 호출하는 케이스
   - structural check: atom이 flat common key를 새로 의존하게 되는 케이스(메커니즘 차단)
   - pre-push: 모든 파일 전수 검사(--changed 빠짐 방지)
   - e2e: 런타임 next-intl 파이프라인 전체 통과 검증

2. **`common.json` 구조적 차단 설계:** 평범한 "키 존재 여부 검증"이 아니라 회귀 메커니즘 자체(flat top-level key 추가 패턴)를 빌드 타임에 봉쇄. 방어선의 레이어가 다른 gate들과 직교함.

3. **shadowed binding 처리 정책:** false positive 방지를 위한 SKIP + WARN 정책이 적절하며 Planner 오판(87건→실제 1건) 발생에도 스크립트는 정확하게 1건만 검출.

4. **`lib/i18n/client.ts` 선제 삭제:** 0 callers였던 silent-swallow 래퍼를 tech-debt 등록에 그치지 않고 즉시 삭제. 미래 회귀 벡터를 제거.

5. **caller DRY 현 수준 적절:** 4개 caller가 모두 `tCommon('status.loading')`으로 통일. boilerplate가 일관되며 helper hook 추출 없이도 가독성 유지.

---

## Final Verdict

**PASS with CONCERN** — 기능 회귀 없음, MUST 기준 전부 만족. 아키텍처 결정 품질도 전반적으로 우수하나 다음 두 항목은 후속 작업 권고:

1. **Warning (tech-debt 등록 권고):** `navigation.json` / `notifications.json` flat root key structural check 정책 미정의. 현재 동작 문제는 없으나 정책 명시 또는 스크립트 주석 보강 필요.
2. **Warning (tech-debt 등록 권고):** `frontend-patterns.md:243` 예외 섹션 텍스트 내적 모순 — "shared에 있으면 props으로 끌어올려야 일관적"이나 실제로는 직접 호출 허용. 다음 기여자에게 오해 소지.
3. **Info:** `InlineActionButton.loadingLabel` 영어 fallback + `RepairHistoryClient.tsx` `tCommon` 명명 비일관성은 별도 정비 시 일괄 처리.
