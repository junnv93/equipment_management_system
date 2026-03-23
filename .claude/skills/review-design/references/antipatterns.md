# 10가지 디자인 안티패턴 (AP-01 ~ AP-10)

각 항목은 1~10점으로 채점합니다. 검사 시 **Read 도구**로 대상 파일을 읽고, **Grep 도구**로 정량 패턴을 확인합니다.

> 디자인 토큰 SSOT: `apps/frontend/lib/design-tokens/index.ts`
> 브랜드 토큰: `apps/frontend/lib/design-tokens/brand.ts`
> 모션 시스템: `apps/frontend/lib/design-tokens/motion.ts`

## 목차

| # | 안티패턴 | 줄 |
|---|---------|-----|
| [AP-01](#ap-01-card-soup-카드-수프) | Card Soup (카드 수프) | 레이아웃 계층 |
| [AP-02](#ap-02-간격-리듬-spacing-rhythm) | 간격 리듬 | 마이크로~매크로 간격 |
| [AP-03](#ap-03-타이포그래피-드라마-부족) | 타이포 드라마 | 폰트 크기/종류 |
| [AP-04](#ap-04-그림자깊이-단조로움) | 깊이 단조로움 | Elevation 3단계 |
| [AP-05](#ap-05-상태-표시-획일화) | 상태 표시 획일화 | badge/border/dot 다양성 |
| [AP-06](#ap-06-모션-단조로움) | 모션 단조로움 | 트랜지션/애니메이션 |
| [AP-07](#ap-07-데이터-테이블-프리미엄) | 테이블 프리미엄 | stripe/hover/sticky |
| [AP-08](#ap-08-접근성--다크모드) | 접근성 & 다크모드 | a11y/dark/sr-only |
| [AP-09](#ap-09-빈-상태-디자인) | 빈 상태 디자인 | 상황별 빈 상태 |
| [AP-10](#ap-10-design-token-활용도) | Design Token 활용도 | 토큰 import vs 하드코딩 |

---

## AP-01: Card Soup (카드 수프)

모든 콘텐츠가 동일 크기 `Card`에 담겨 시각적 계층이 없는 상태.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 카드 크기 다양성 | 모두 동일 크기 | 2가지 크기 | Hero + Compact + 비대칭 |
| 그리드 비율 | `grid-cols-N` 균등 | 일부 `col-span` 사용 | `grid-cols-[1.6fr_1fr_1fr]` 비대칭 |
| 시각적 무게 | 모든 카드 동일 elevation | 일부 그림자 차등 | Hero=floating, 보조=flush |

### Grep 검사

Grep 도구를 사용하여 정량 확인:

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| Card 사용 빈도 (5개+ 의심) | `<Card` | `count` |
| 균등 그리드 탐지 | `grid-cols-[234]\b` | `content` |
| 비대칭 그리드 존재 | `grid-cols-\[` | `content` |

### 좋은 예

```tsx
// 비대칭 그리드 — 중요도에 따른 크기 차등
<div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-4">
  <HeroKpiCard />    {/* 큰 카드 — 핵심 지표 */}
  <CompactKpi />     {/* 작은 카드 */}
</div>
```

---

## AP-02: 간격 리듬 (Spacing Rhythm)

간격이 기계적으로 균일하여 시각적 리듬이 없는 상태. 페이지 전체에서 그룹 내부(tight) ↔ 그룹 간(spacious) 간격 차등화가 핵심.

> 기존 AP-02(Mechanical Spacing)와 AP-08(Spacing Rhythm)을 통합. 둘 다 간격 관련이며, 마이크로(요소 간)와 매크로(섹션 간) 리듬은 하나의 연속체이기 때문.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 간격 종류 수 | `space-y-6` 일변도 | 2-3종 혼용 | tight/comfortable/spacious 체계적 사용 |
| 그룹 내/간 차등 | 차이 없음 | 일부 차등 | 내부 `gap-2` + 섹션 간 `mt-8` 명확 |
| 헤더↔콘텐츠 | 동일 간격 | 약간 차등 | 헤더 영역 별도 패딩 체계 |
| 토큰 활용 | 하드코딩만 | 일부 `SPACING_PRIMITIVES` | `getPageContainerClasses()` 등 활용 |

### Grep 검사

> **주의:** Grep 도구는 ripgrep 기반이므로 OR 연산자는 `|` (backslash 없이)를 사용합니다.

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| 간격 다양성 카운트 | `space-y-\d|gap-\d|mt-\d|mb-\d` | `count` |
| 토큰 사용 | `SPACING_PRIMITIVES|getPageContainerClasses` | `count` |

### 좋은 예

```tsx
<div className="space-y-2">  {/* 카드 내부: 촘촘 */}
  <h3>...</h3>
  <p>...</p>
</div>
<div className="mt-8">       {/* 섹션 간: 넓게 */}
  <SectionTitle />
  <div className="space-y-3"> {/* 아이템 간: 중간 */}
```

---

## AP-03: 타이포그래피 드라마 부족

제목과 본문의 크기 차이가 미미하여 시각적 임팩트가 없는 상태.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 크기 비율 (최대/본문) | < 2:1 | 2~3:1 | 3:1 이상 |
| 폰트 구분 | 전부 `font-sans` | heading/body 일부 구분 | `FONT.heading` + `FONT.body` + `FONT.mono` 체계적 |
| KPI 숫자 | `text-lg` 수준 | `text-2xl` | `text-5xl` + `FONT.kpi` |
| 반응형 폰트 | 고정 사이즈 | 일부 반응형 | `clamp()` 또는 브레이크포인트별 사이즈 |

**타이포 스케일 권장:**
- Hero 숫자: `text-5xl` ~ `text-6xl` (48-64px)
- 섹션 제목: `text-xl` ~ `text-2xl` (20-24px)
- 본문: `text-sm` ~ `text-base` (14-15px)
- 라벨: `text-xs` (11-12px)

### Grep 검사

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| FONT 토큰 사용 | `FONT\.(heading|body|mono|kpi)` | `count` |
| 큰 텍스트 사이즈 | `text-(3xl|4xl|5xl|6xl)` | `content` |

---

## AP-04: 그림자/깊이 단조로움

`shadow-sm` 하나만 사용하여 모든 요소가 같은 깊이에 존재하는 상태.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| shadow 종류 | 1종 | 2종 | 3종+ (flush/raised/floating) |
| hover 그림자 변화 | 없음 | 일부 | 대부분의 인터랙티브 요소 |
| Elevation 체계 | 하드코딩 | 일부 토큰 | `ELEVATION_TOKENS` 활용 |

**3단계 Elevation:**
- **flush**: 테두리만 (`border` / `ring-1`)
- **raised**: 작은 그림자 (`shadow-sm`)
- **floating**: 큰 그림자 (`shadow-lg` / 드롭다운, 모달)

### Grep 검사

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| 그림자 다양성 | `shadow-(sm|md|lg|xl|2xl|none)` | `count` |
| hover 그림자 변화 | `hover:shadow` | `content` |
| Elevation 토큰 사용 | `ELEVATION_TOKENS|ELEVATION_PRIMITIVES|getBrandElevatedClasses` | `count` |

---

## AP-05: 상태 표시 획일화

모든 상태를 pill badge 하나로만 표현하는 상태.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 표현 방법 수 | badge만 | badge + 1종 | 3종 이상 혼용 |
| 시멘틱 헬퍼 활용 | 하드코딩 클래스 | `getSemanticBadgeClasses` | 다종 헬퍼 활용 |

**BRAND_CLASS_MATRIX 기반 상태 표현 (brand.ts SSOT):**

| 표현 방식 | 헬퍼 함수 | 용도 |
|-----------|----------|------|
| Pill badge | `getSemanticBadgeClasses(key)` | 컴팩트 상태 |
| 상태 배경+텍스트 | `getSemanticStatusClasses(key)` | 카드 배경, 테이블 셀 |
| 좌측 보더 | `getSemanticLeftBorderClasses(key)` | 카드/행 강조 |
| 배경 틴트 | `getSemanticBgLightClasses(key)` | 영역 구분, 아이콘 배경 |
| 솔리드 배경 | `getSemanticSolidBgClasses(key)` | CTA, 스테퍼 |
| Dot indicator | `getSemanticDotClasses(key)` | 인라인 상태 |
| 컨테이너 (프리셋) | `getSemanticContainerClasses(key)` | 알림/배너 (rounded-md border p-4 포함) |
| 컨테이너 (색상만) | `getSemanticContainerColorClasses(key)` | 커스텀 레이아웃 컨테이너 |
| 컨테이너 텍스트 | `getSemanticContainerTextClasses(key)` | 컨테이너 내 아이콘/제목 강조 |

### Grep 검사

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| 시멘틱 헬퍼 다양성 (패턴 기반) | `getSemantic\w+Classes` | `count` |
| 하드코딩 상태 색상 (안티패턴) | `bg-green-|bg-red-|bg-yellow-|text-green-|text-red-` | `content` |

---

## AP-06: 모션 단조로움

`animate-fade-in`만 반복 사용하는 상태.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 애니메이션 종류 | 1종 | 2-3종 | 4종+ (fade, slide, scale, draw) |
| 스태거 딜레이 | 없음 | 일부 | `getStaggerDelay()` 체계적 사용 |
| 트랜지션 프리셋 | `transition-all` | 일부 `TRANSITION_PRESETS` | 속성별 세분화 사용 |
| active 피드백 | 없음 | hover만 | `active:scale-[0.98]` 포함 |
| 의미적 모션 | 없음 | 일부 | 승인=check, 거절=slide 등 |
| 접근성 | `motion-safe` 없음 | 일부 | 전체 `motion-safe:` / `motion-reduce:` |

**프로젝트 모션 토큰 (motion.ts SSOT):**
- `TRANSITION_PRESETS.fast*` / `.instant*` / `.moderate*` — 사전 계산된 트랜지션
- `ANIMATION_PRESETS` — 사전 정의된 애니메이션
- `getStaggerDelay(index, type)` — 스태거 딜레이
- `getTransitionClasses(speed, properties)` — 동적 트랜지션 (새 조합 필요 시)

### Grep 검사

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| 모션 토큰 사용 | `TRANSITION_PRESETS|ANIMATION_PRESETS|getStaggerDelay` | `count` |
| transition-all (안티패턴) | `transition-all` | `content` |
| motion-safe 접근성 | `motion-safe:|motion-reduce:` | `count` |

---

## AP-07: 데이터 테이블 프리미엄

기본 shadcn 테이블을 커스터마이징 없이 그대로 사용하는 상태.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 행 구분 | 없음 | `even:bg` stripe | stripe + hover 하이라이트 |
| hover 효과 | 없음 | 배경색만 | 좌측 accent bar (`box-shadow inset`) |
| 중요 열 강조 | 없음 | 볼드 처리 | `FONT.mono` + 상태 컬러 |
| sticky 헤더 | 없음 | — | `sticky top-0` |
| 정렬 인디케이터 | 없음 | 기본 아이콘 | 커스텀 디자인 |
| 컴포넌트 토큰 | 없음 | 일부 | `*_TABLE_TOKENS` 활용 |

**프로젝트 테이블 토큰 (동적 탐색):**

모듈별 테이블 토큰은 `_TABLE_TOKENS|_TABLE\b` 패턴으로 동적 탐색합니다. 새 모듈이 추가되어도 자동 탐지됩니다.

### Grep 검사

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| 테이블 토큰 활용 (패턴 기반) | `_TABLE_TOKENS|_TABLE\b` | `count` |
| hover 행 스타일 | `hover:bg-|hover:shadow` | `content` |
| sticky 헤더 | `sticky` | `content` |

---

## AP-08: 접근성 & 다크모드

접근성(a11y)과 다크모드가 고려되지 않은 상태. "보이는 디자인"이 좋아도 접근성이 없으면 프리미엄이 아님.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 포커스 표시 | 없음 / `outline-none` | `focus:ring` | `focus-visible:ring` (키보드만) |
| 색상 대비 | 하드코딩 저대비 색상 | — | `text-foreground` / `text-muted-foreground` 시멘틱 |
| 터치 타겟 | 작은 클릭 영역 | — | `SIZE_PRIMITIVES.touch.minimal` (44px) |
| motion-reduce | 미고려 | 일부 | 전체 `motion-safe:` / `motion-reduce:` |
| 다크모드 | 미지원 | 부분적 | `dark:` 변형 또는 CSS 변수 기반 자동 전환 |
| aria 속성 | 없음 | 일부 | role, aria-label, aria-live 적절히 사용 |
| 스크린리더 | 아이콘만 | `sr-only` 일부 | 모든 아이콘 버튼에 `sr-only` 라벨 |

**프로젝트 접근성 토큰:**
- `FOCUS_TOKENS` (semantic.ts) — 포커스 링 스타일
- `INTERACTIVE_TOKENS.size` — WCAG AAA 터치 타겟
- `motion-safe:` / `motion-reduce:` — 모션 시스템 내장

### Grep 검사

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| focus-visible (올바른 패턴) | `focus-visible:` | `count` |
| outline-none 남용 (안티패턴) | `outline-none` | `content` |
| 다크모드 지원 | `dark:` | `count` |
| sr-only (스크린리더) | `sr-only` | `count` |
| FOCUS_TOKENS 활용 | `FOCUS_TOKENS` | `count` |

> AP-06(모션)에서 이미 `motion-safe:` / `motion-reduce:`를 검사합니다. 여기서는 중복 검사하지 않고 AP-06 결과를 참조합니다.

---

## AP-09: 빈 상태 디자인

아이콘 + 텍스트 + 버튼이 센터 정렬된 "AI 전형 패턴"만 사용하는 상태.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 시각적 차별화 | 모든 빈 상태 동일 | 아이콘만 다름 | 상황별 완전히 다른 레이아웃 |
| 맞춤 메시지 | "데이터 없음" 일변도 | 맥락별 메시지 | 검색 없음 / 데이터 없음 / 권한 없음 구분 |
| 텍스트 계층 | 단일 텍스트 | 제목 + 설명 | 제목 + 설명 + CTA + 보조 안내 |
| 컴포넌트 토큰 | 하드코딩 | — | `*_EMPTY_STATE_TOKENS` 활용 |

**프로젝트 빈 상태 토큰 (동적 탐색):**

구체적 토큰명을 하드코딩하지 않고, Grep 패턴으로 동적 탐색합니다. 새 토큰이 추가되어도 자동으로 탐지됩니다.

### Grep 검사

| 검사 항목 | pattern | output_mode | 옵션 |
|-----------|---------|-------------|------|
| 빈 상태 토큰 활용 (패턴 기반) | `_EMPTY_STATE_TOKENS|_EMPTY_STATE\b` | `count` | |
| 상황별 분기 확인 | `empty|no.*result|no.*data|권한` | `content` | `-i: true` |

---

## AP-10: Design Token 활용도

디자인 토큰 시스템이 존재하지만 하드코딩된 Tailwind 클래스로 우회하는 상태.

### 검사 기준

| 기준 | 나쁨 (1-3) | 보통 (4-6) | 좋음 (7-10) |
|------|-----------|-----------|------------|
| 토큰 import 빈도 | 0회 | 1-3회 | 5회+ |
| 하드코딩 hex 색상 | 많음 | 일부 | 0 (`BRAND_COLORS_HEX`만) |
| Layer 3 토큰 존재 | 없음 | — | 해당 기능의 `components/*.ts` 존재 |
| 시멘틱 토큰 활용 | 없음 | 일부 | `TRANSITION_PRESETS`, `ANIMATION_PRESETS` 등 |

### Grep 검사

| 검사 항목 | pattern | output_mode |
|-----------|---------|-------------|
| 디자인 토큰 import | `from '@/lib/design-tokens` | `count` |
| 하드코딩 hex 색상 (안티패턴) | `text-\[#|bg-\[#|border-\[#` | `content` |
| 하드코딩 Tailwind 색상 (토큰 우회) | `bg-(red|green|blue|yellow|orange|gray)-[0-9]` | `content` |

### 컴포넌트별 토큰 매핑 (동적 탐색)

대상 파일이 어떤 기능에 속하는지에 따라 Layer 3 토큰 파일 존재 여부를 **Glob 도구로 동적 탐색**합니다.

**토큰 매핑을 하드코딩하지 않는 이유:** 새 모듈이 추가될 때마다 이 테이블을 수동 업데이트해야 하면 SSOT 위반. Glob으로 실제 파일을 탐색하면 항상 최신 상태를 반영합니다.

```
Glob: pattern="lib/design-tokens/components/*.ts"
      path="apps/frontend"
```

탐색된 토큰 파일명과 대상 컴포넌트 디렉토리명을 매칭합니다:
- `design-tokens/components/dashboard.ts` → `components/dashboard/`
- `design-tokens/components/equipment.ts` → `components/equipment/`
- 파일명과 디렉토리명이 정확히 일치하지 않을 수 있음 (예: `approval.ts` → `components/approvals/`)
- 매칭 실패 시 해당 기능에 Layer 3 토큰이 없는 것이 아니라, 네이밍 차이일 수 있으므로 내용을 확인

---

## 점수 산정 가이드

| 등급 | 점수 | 설명 |
|------|------|------|
| **A** | 9-10 | 프리미엄 — 디자인 에이전시 수준 |
| **B** | 7-8 | 양호 — 약간의 개선 여지 |
| **C** | 5-6 | 보통 — AI 생성 느낌이 남아있음 |
| **D** | 3-4 | 미흡 — 명확한 개선 필요 |
| **F** | 1-2 | 심각 — 전면 재설계 권장 |

**종합 점수** = 10개 항목 합산 (만점 100)
