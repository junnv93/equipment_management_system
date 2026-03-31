---
name: review-design
description: >
  Frontend design quality review + improvement wireframe HTML generation. Scores existing components/pages against 10 anti-patterns (card soup, spacing rhythm, typography drama, depth/elevation, state indicators, motion, tables, accessibility, empty states, design token usage) and generates reference wireframe HTML for improvement direction. Use when the user asks for design review, UI review, UI quality assessment, design scoring, or mentions: "디자인 리뷰", "UI 리뷰", "촌스러운", "세련되게", "다듬어줘", "깔끔하게", "프리미엄", "카드 수프", "visual hierarchy", "wireframe". This skill evaluates existing UI quality — new page implementation is handled separately.
---

# Review Design — 디자인 품질 리뷰 + 와이어프레임 생성

기존 프론트엔드 컴포넌트/페이지의 시각적 품질을 평가하고, "AI가 만든 것 같지 않은" 프리미엄 디자인 방향의 와이어프레임 HTML을 생성합니다.

## 실행 흐름

```
Step 1: 대상 선정 → Step 2: 안티패턴 분석 → Step 3: 점수화 보고서 → Step 4: 와이어프레임 생성 (요청 시)
```

**Step 4는 사용자가 와이어프레임을 명시적으로 요청한 경우에만 실행합니다.** "점수만 매겨줘", "디자인 리뷰해줘"만 요청한 경우 Step 3까지만 수행합니다.

---

### Step 1: 대상 파일 수집

사용자가 특정 페이지/컴포넌트를 지정하면 해당 파일만, 아니면 최근 변경 파일을 대상으로 합니다.

**Bash 도구로 변경 파일 확인:**
```bash
git diff --name-only HEAD~5 -- 'apps/frontend/components/**' 'apps/frontend/app/**'
```

**핵심 디렉토리:** `components/dashboard/`, `equipment/`, `approvals/`, `checkouts/`, `calibration/`, `layout/`, `ui/`

---

### Step 2: 10가지 안티패턴 분석

**Read 도구**로 대상 파일을 읽고, **Grep 도구**로 정량 패턴을 확인합니다.

각 안티패턴의 상세 검사 방법, 채점 기준, Grep 패턴은 `references/antipatterns.md`를 참조하세요.

| # | 안티패턴 | 핵심 질문 |
|---|---------|----------|
| AP-01 | Card Soup | 카드 크기/비율이 다양한가? 비대칭 그리드인가? |
| AP-02 | 간격 리듬 | 그룹 내(tight) ↔ 섹션 간(spacious) 간격 차등이 있는가? |
| AP-03 | 타이포 드라마 | 제목/KPI와 본문의 크기 비율이 3:1 이상인가? |
| AP-04 | 깊이 단조로움 | flush/raised/floating 3단계 elevation을 사용하는가? |
| AP-05 | 상태 표시 획일화 | badge 외에 좌측보더, 틴트, dot 등 3종 이상 혼용하는가? |
| AP-06 | 모션 단조로움 | `TRANSITION_PRESETS`, 스태거, 의미적 모션을 활용하는가? |
| AP-07 | 테이블 프리미엄 | stripe, hover accent, sticky header, 컬럼 강조가 있는가? |
| AP-08 | 접근성 & 다크모드 | focus-visible, motion-reduce, dark:, sr-only를 사용하는가? |
| AP-09 | 빈 상태 디자인 | 상황별 차별화된 빈 상태를 제공하는가? |
| AP-10 | Design Token 활용도 | `lib/design-tokens` import가 하드코딩 색상보다 많은가? |

---

### Step 3: 점수화 보고서 출력

분석 결과를 아래 형식으로 출력합니다:

```markdown
# Design Quality Report — [대상 페이지/컴포넌트]

## 종합 점수: XX / 100

| # | 안티패턴 | 점수 | 등급 | 핵심 발견 |
|---|---------|------|------|----------|
| AP-01 | Card Soup | 7/10 | B | Hero KPI 카드 존재하나 하단 3열이 균등 |
| AP-02 | 간격 리듬 | 5/10 | C | space-y-6 일변도, 섹션 간 차등 없음 |
| ... | ... | ... | ... | ... |

## 상세 분석

### AP-01: Card Soup (7/10 — B)
**현재 상태:** [구체적 코드 위치 + 현재 패턴 설명]
**개선 제안:** [구체적 코드 변경 방향]
**참조:** [와이어프레임의 해당 섹션]

[... 10개 항목 모두 ...]

## 우선순위 개선 로드맵
1. [가장 영향력 큰 개선] — 예상 점수 향상: +X점
2. [두 번째] — +X점
3. [세 번째] — +X점
```

**등급 기준:** A(9-10) 프리미엄 / B(7-8) 양호 / C(5-6) 보통 / D(3-4) 미흡 / F(1-2) 심각

---

### Step 4: 와이어프레임 HTML 생성

리뷰 보고서의 개선사항을 반영한 **개선 버전** 와이어프레임을 생성합니다.

**기존 와이어프레임 탐색 → 읽기 → 개선:**
1. Glob 도구로 `docs/wireframes/**/*.html` 탐색
2. 해당 페이지의 기존 와이어프레임이 있으면 **Read 도구로 읽어** 현재 디자인 결정을 파악
3. 리뷰(Step 3)에서 발견한 안티패턴을 개선한 **새 버전**을 생성
4. 기존 파일의 강점(레이아웃 구조, 섹션 배치 등)은 유지하면서 약점만 개선

**버전 관리:** 기존 파일을 덮어쓰지 않고, `-v{N}` 접미사로 새 버전 생성
```
docs/wireframes/approval-redesign.html      ← 기존
docs/wireframes/approval-redesign-v2.html   ← 리뷰 기반 개선 버전
```

와이어프레임 생성 규칙, 브랜드 팔레트, CSS 토큰 템플릿, 접근성 요구사항은 `references/wireframe-rules.md`를 참조하세요.

---

## 사용 예시

```
사용자: "대시보드 디자인 리뷰해줘"
→ AP-01~10 분석 → 점수 보고서 → 기존 와이어프레임 참조 안내

사용자: "장비 목록 페이지 디자인 개선하고 와이어프레임도 만들어줘"
→ AP-01~10 분석 → 점수 보고서 → equipment-list-redesign.html 참조/생성

사용자: "전체 디자인 점수 매겨줘"
→ 주요 5개 페이지 전체 스캔 → 종합 보고서

사용자: "이 컴포넌트 AI스러운 느낌 없애줘"
→ 해당 컴포넌트 AP 분석 → 개선 코드 제안 (코드 수정 요청 시)
```

---

## SSOT 참조

| 자산 | SSOT 위치 |
|------|----------|
| 시멘틱 색상 | `lib/design-tokens/brand.ts` → `BRAND_COLORS_HEX`, `BRAND_CLASS_MATRIX` |
| 폰트 용도 | `lib/design-tokens/brand.ts` → `FONT` |
| 간격 체계 | `lib/design-tokens/primitives.ts` → `SPACING_PRIMITIVES` |
| 모션 프리셋 | `lib/design-tokens/motion.ts` → `TRANSITION_PRESETS`, `ANIMATION_PRESETS` |
| 긴급도 피드백 | `lib/design-tokens/visual-feedback.ts` → `URGENCY_FEEDBACK_MAP` |
| 컴포넌트 토큰 | `lib/design-tokens/components/*.ts` (Glob으로 동적 탐색) |
| 페이지 레이아웃 | `lib/design-tokens/components/page-layout.ts` → `getPageContainerClasses()` |
| 전체 export | `lib/design-tokens/index.ts` (600+ exports) |

---

## 주의사항

- 이 스킬은 **리뷰 + 참조 HTML 산출**이 주 목적입니다. 실제 코드 수정은 사용자가 별도 요청할 때만 수행합니다.
- 와이어프레임은 **참조용**이며, 실제 구현과 1:1 대응이 아닙니다. Tailwind 클래스가 아닌 순수 CSS로 작성합니다.
- 점수는 상대적 기준이며, 같은 프로젝트 내에서의 비교용입니다.
- 디자인 토큰 시스템(`lib/design-tokens/`)의 기존 구조를 존중합니다.
