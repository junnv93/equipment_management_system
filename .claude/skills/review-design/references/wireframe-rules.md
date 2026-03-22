# 와이어프레임 HTML 생성 규칙

리뷰 보고서의 개선사항을 반영한 **참조용 와이어프레임 HTML**을 생성하는 규칙입니다.

## 기존 와이어프레임 확인 (SSOT)

생성 전 반드시 Glob 도구로 기존 파일을 확인하여 중복을 방지합니다:

```
Glob: pattern="docs/wireframes/**/*.html"
```

이미 존재하는 파일은 skip하고, 사용자가 갱신을 요청하면 덮어씁니다.

---

## 파일 생성 규칙

**경로:** `docs/wireframes/<page-name>-redesign.html`

**self-contained HTML로 작성** — 외부 의존성 없이 단일 파일로 동작:
1. Google Fonts CDN (DM Sans, IBM Plex Sans, JetBrains Mono, Noto Sans KR)
2. CSS Custom Properties — 프로젝트의 3-Layer 토큰 구조 반영
3. 다크 모드 토글 (localStorage 저장)
4. 반응형 (모바일 480px → 태블릿 768px → 데스크톱 1280px)
5. 한국어 텍스트
6. 인라인 CSS + 최소 JS

---

## 브랜드 컬러 팔레트

프로젝트의 시멘틱 색상 체계를 반영합니다. **SSOT: `brand.ts`의 `BRAND_COLORS_HEX`**. 와이어프레임은 순수 CSS이므로 아래 CSS 변수로 미러링합니다:

```css
/* SSOT: brand.ts BRAND_COLORS_HEX */
--brand-ok: #10B981;        /* 성공, 정상, 사용 가능 */
--brand-warning: #F59E0B;   /* 경고, 주의 */
--brand-critical: #EF4444;  /* 위험, 부적합, 긴급 */
--brand-info: #3B82F6;      /* 정보, 교정, 링크 */
--brand-neutral: #6B7280;   /* 비활성, 중립 */
--brand-purple: #8B5CF6;    /* 보조 강조 */
--brand-repair: #F97316;    /* 수리, 반출 */

/* 구조 컬러 (globals.css 기반) */
--midnight: #122C49;        /* Primary — 헤더, 사이드바 배경 */
```

> `--green`, `--blue`, `--orange` 등 별도 별칭은 사용하지 않습니다. 상태 색상은 반드시 `--brand-*` 변수를 사용하여 SSOT를 유지합니다.

---

## 디자인 원칙 (Anti-AI 패턴)

| 원칙 | 나쁜 예 | 좋은 예 |
|------|---------|---------|
| 비대칭 그리드 | `grid-template-columns: 1fr 1fr 1fr 1fr` | `grid-template-columns: 1.6fr 1fr 1fr 1fr` |
| 타이포 드라마 | 제목 16px, 본문 14px | Hero KPI 48-64px, 라벨 11px |
| 3단계 깊이 | `box-shadow` 1종 | flush(border) / raised(sm) / floating(lg) |
| 상태 다양성 | badge만 사용 | 좌측보더 + 배경틴트 + dot + 아이콘컬러 혼용 |
| 간격 차등화 | `gap: 16px` 일변도 | 그룹 내 8px, 그룹 간 28px |
| 의미적 모션 | `fade-in` 반복 | 스태거, 스케일+페이드, 호버 리프트 |
| 프리미엄 테이블 | 기본 테이블 | alternate row + hover accent bar |
| 장식 절제 | 과한 그라데이션 | 서브틀 패턴, 얇은 구분선 |

---

## 페이지별 섹션 가이드

### 대시보드
- Welcome + Quick Actions
- Alert Strip (긴급 알림)
- KPI Area (Hero 1 + Compact 4 — 비대칭)
- 3-Column Middle (승인/반출/교정)
- Bottom (활동 피드 + 캘린더)

### 장비 목록
- Command Bar (검색 + 필터 + 뷰 토글)
- Status Summary Strip
- Table View (프리미엄 테이블)
- Card View (비대칭 카드 그리드)

### 장비 상세
- Sticky Header (이름 + 상태 + 액션)
- Alert Banners (상태별)
- KPI Strip (4 미니 KPI)
- Tab Navigation + Content

### 승인 관리
- KPI 카드 (카테고리별)
- 2-Column (사이드바 + 리스트)
- Approval Card (스와이프/애니메이션)

### 로그인
- Split Screen (브랜드 + 폼)

---

## CSS 토큰 구조 템플릿

와이어프레임 HTML의 `<style>` 블록에 포함할 토큰 구조:

```css
:root {
  /* Layer 1: Primitives */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Layer 2: Semantic */
  --shadow-flush: none;
  --shadow-raised: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-floating: 0 8px 24px rgba(0,0,0,0.12);

  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-moderate: 350ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Typography */
  --font-display: 'DM Sans', 'Noto Sans KR', sans-serif;
  --font-body: 'IBM Plex Sans', 'Noto Sans KR', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

.dark {
  /* 다크모드 오버라이드 */
  --bg-primary: #0f172a;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-muted: #94a3b8;
  --shadow-raised: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-floating: 0 8px 24px rgba(0,0,0,0.4);
}
```

---

## 접근성 필수 포함 사항

와이어프레임에도 접근성 기본 구조를 반영합니다:

- `prefers-reduced-motion` 미디어 쿼리
- `prefers-color-scheme` 미디어 쿼리 (다크모드 기본값)
- 포커스 표시 (`focus-visible` outline)
- 시멘틱 HTML 태그 (`<nav>`, `<main>`, `<section>`, `<article>`)
- ARIA landmark roles
- 최소 44px 터치 타겟

---

## 주의사항

- 와이어프레임은 **참조용**이며, 실제 구현과 1:1 대응이 아닙니다
- Tailwind 클래스가 아닌 순수 CSS로 작성합니다
- CSS 변수 네이밍은 프로젝트 토큰(`primitives.ts`, `semantic.ts`)과 의미적으로 호환되도록 합니다
- 기존 `docs/wireframes/` 디렉토리의 와이어프레임과 시각적 언어를 일관되게 유지합니다
