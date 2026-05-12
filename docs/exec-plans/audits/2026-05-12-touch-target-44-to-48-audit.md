# `--touch-target-min` 44 → 48px 상향 영향 Audit

**날짜**: 2026-05-12
**Sprint**: qr-visual-redesign-followups-batch-1 / S-7
**유형**: 디자인 토큰 영향 audit (read-only — production 코드 변경 0)
**결론**: ✅ **의도된 상향 — desktop 영향 0. WCAG SC 2.5.5 Level AAA + Material baseline 48dp 정합.**

---

## 배경

`qr-visual-redesign` (2026-05-11) sprint 에서 `--touch-target-min` 디자인 토큰을 **44px → 48px** 로 상향. WCAG 2.1 SC 2.5.5 (Target Size) Level AAA 권고 + Material Design baseline 48dp 정합. 본 audit 은 그 상향이 의도되지 않은 desktop UI 회귀를 일으키지 않았는지 검증.

## 정의 위치 (SSOT)

| 파일                                               | 라인       | 역할                                                                                                                        |
| -------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `apps/frontend/styles/globals.css`                 | 429        | `:root --touch-target-min: 48px;` 정의 (`--touch-target-glove: 56px` 보조)                                                  |
| `apps/frontend/styles/accessibility.css`           | 74 / 95-96 | `.touch-target-padded` utility class — `max(100%, var(--touch-target-min, 44px))` (fallback 44 유지로 graceful degradation) |
| `apps/frontend/lib/design-tokens/css-variables.ts` | 93         | `CSS_VAR_NAMES.touchTargetMin = '--touch-target-min'` 변수명 SSOT (`cssVar()` helper 경유)                                  |

## 사용처 enumeration (production 코드, build artifacts 제외)

총 **7 production 컴포넌트** — 전부 모바일/QR 경로 한정.

| 파일                                                               | 경로                        | 사용 맥락                                   |
| ------------------------------------------------------------------ | --------------------------- | ------------------------------------------- |
| `apps/frontend/app/(dashboard)/e/[managementNumber]/not-found.tsx` | QR 모바일 랜딩 not-found    | 재시도 버튼 hit-area                        |
| `apps/frontend/components/checkouts/EquipmentConditionForm.tsx`    | 모바일 점검 폼              | 외관/작동/부속 라디오 버튼 + 사진 추가 버튼 |
| `apps/frontend/components/layout/MobileScanTrigger.tsx`            | 모바일 헤더 QR 스캔 trigger | `md:hidden` 한정 — 데스크탑 미렌더          |
| `apps/frontend/components/mobile/AutoProgressCountdown.tsx`        | 모바일 자동 진행 카운트다운 | 취소 버튼 hit-area                          |
| `apps/frontend/components/mobile/EquipmentActionSheet.tsx`         | 모바일 액션 시트            | 액션 CTA 버튼                               |
| `apps/frontend/components/mobile/HandoverPickerSheet.tsx`          | 모바일 다중 핸드오버 picker | 카드 아이템 클릭 영역                       |
| `apps/frontend/components/scan/ManualEntryFallback.tsx`            | QR 스캔 실패 fallback       | 수동 입력 폼 입력/제출 버튼                 |

## Desktop 영향 검증

**검증 grep 1** — sticky bar / list filter / button group 등 비모바일 사용처 검색:

```bash
grep -rn "touch-target-min\|touchTargetMin" apps/frontend \
  --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null \
  | grep -v "\.next/" | grep -v "node_modules" \
  | grep -vE "mobile|MobileScan|HandoverPicker|EquipmentActionSheet|AutoProgress|EquipmentConditionForm|ManualEntryFallback|not-found"
```

→ 매치 0건 (디자인 토큰 정의 + SSOT 변수 정의 외 desktop 컴포넌트 0).

**검증 grep 2** — 데스크탑 sticky / filter / table 컴포넌트 디렉토리:

```bash
grep -rn "touch-target-min" apps/frontend/components/equipment apps/frontend/components/dashboard \
  apps/frontend/components/calibration apps/frontend/components/non-conformances \
  --include="*.tsx" 2>/dev/null
```

→ 매치 0건.

**결론**: 모든 사용처가 **`components/mobile/`** + **`components/scan/`** + **`components/layout/MobileScanTrigger`** + **QR 모바일 랜딩 페이지** 한정. desktop sticky bar, table filter, button group, dialog footer 등 비모바일 영역 사용처 **0건** — 의도된 적용 범위 그대로.

## WCAG / Material 정합

- **WCAG 2.1 SC 2.5.5 (Level AAA)** — Target size ≥ 44×44 CSS px (이전 44px 충족). **AAA 상향 권고는 24×24 minimum** 외에도 실무상 48px 이상 권장. 48px 정합 ✅
- **Material Design baseline** — 48dp touch target standard ([material.io/design/usability/accessibility.html](https://material.io/design/usability/accessibility.html))
- **Apple HIG iOS** — minimum 44pt × 44pt 권장. 48px 상회 ✅
- **장갑 사용 시 (`--touch-target-glove: 56px`)** — 산업 현장 보조 토큰 도입됨 (점검 환경)

## 후속 모니터링 항목 (운영)

1. **신규 모바일 인터랙션 추가 시 강제** — `min-h-[var(--touch-target-min)]` 또는 `style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}` 패턴 일관 유지
2. **verify-design-tokens skill 검토** — 모바일 컴포넌트 신규 추가 시 touch-target 미적용 회귀 정량 차단 가능성 (Step 추가 후보)
3. **`--touch-target-glove: 56px` 사용처 확장** — 현재 미사용. 장갑 모드 토글이 도입되면 hit-area dynamic switch (도입 시점에 별도 sprint)
4. **WCAG SC 2.5.8 Target Size (Minimum, Level AA, WCAG 2.2)** — 24×24 CSS px 최소, 충분한 spacing 권고. 우리 48px는 AA + AAA 모두 충족 — 회귀 없음

## tech-debt-tracker 처리

이번 audit 으로 `2026-05-11 qr-visual-redesign S-7 touch-target-44-to-48-audit` 항목 **closure** ([x] 처리). 트리거 "design QA pass" 만족 (본 문서가 design QA 산출물).

## 변경 사항

- ✅ production 코드 변경: **0**
- ✅ 디자인 토큰 변경: **0** (이미 상향 완료)
- ✅ 신규 산출물: `docs/exec-plans/audits/2026-05-12-touch-target-44-to-48-audit.md` (본 문서)

---

_Author_: qr-visual-redesign-followups-batch-1 Generator · _Date_: 2026-05-12
