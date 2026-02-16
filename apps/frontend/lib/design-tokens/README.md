# Design Token System v2

프로덕션급 3-Layer Token Architecture로 전체 애플리케이션의 디자인 일관성을 보장합니다.

## 📐 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│ Layer 3: Components (즉시 사용)                     │
│ ├─ header.ts          → getHeaderButtonClasses()   │
│ ├─ notification.ts    → getNotificationBadgeClasses│
│ └─ button.ts (미래)   → getButtonVariantClasses()  │
│                                                      │
│ Layer 2: Semantic (의미론적)                        │
│ ├─ INTERACTIVE_TOKENS  → "standard", "prominent"   │
│ ├─ MOTION_TOKENS       → "fast", "moderate"        │
│ └─ ELEVATION_TOKENS    → "floating", "modal"       │
│                                                      │
│ Layer 1: Primitives (원시값)                        │
│ ├─ SIZE_PRIMITIVES     → { mobile: 44, desktop: 40}│
│ ├─ MOTION_PRIMITIVES   → duration: 200ms           │
│ └─ ELEVATION_PRIMITIVES→ zIndex: 20                │
└─────────────────────────────────────────────────────┘
```

## 🎯 핵심 원칙

### SSOT (Single Source of Truth)

모든 디자인 값은 단 한 곳에서만 정의됩니다.

**❌ 하드코딩 (금지)**

```tsx
<Button className="h-11 w-11 rounded-full hover:bg-muted">
  <Bell className="h-6 w-6" />
</Button>
```

**✅ Design Token 사용**

```tsx
<Button className={getHeaderButtonClasses()}>
  <Bell className={getHeaderSizeClasses('icon')} />
</Button>
```

### Semantic Naming

"어떻게 보이는가"가 아닌 "무엇을 위한 것인가"로 명명합니다.

- ❌ `size44px`, `redColor`, `fastAnimation`
- ✅ `interactive.standard`, `color.error`, `transition.fast`

### Responsive by Default

모든 토큰은 모바일/데스크톱 값을 포함합니다.

```typescript
SIZE_PRIMITIVES.touch.minimal;
// → { mobile: 44, desktop: 40 } (WCAG AAA)
```

## 🚀 사용 가이드

### 1. 컴포넌트 개발 시 (Layer 3 사용)

**헤더 버튼**

```tsx
import { getHeaderButtonClasses, getHeaderSizeClasses } from '@/lib/design-tokens';

<Button className={getHeaderButtonClasses()}>
  <Bell className={getHeaderSizeClasses('icon')} />
</Button>;
```

**알림 배지**

```tsx
import { getNotificationBadgeClasses } from '@/lib/design-tokens';

<Badge className={getNotificationBadgeClasses(unreadCount)}>{unreadCount}</Badge>;
```

### 2. 새로운 컴포넌트 토큰 생성 시 (Layer 2 참조)

```typescript
// lib/design-tokens/components/card.ts
import { INTERACTIVE_TOKENS, ELEVATION_TOKENS } from '../semantic';

export const CARD_TOKENS = {
  padding: INTERACTIVE_TOKENS.spacing.padding,
  shadow: ELEVATION_TOKENS.shadow.medium,
};
```

### 3. 전역 디자인 변경 시 (Layer 1 수정)

```typescript
// primitives.ts
SIZE_PRIMITIVES.touch.minimal = { mobile: 48, desktop: 44 };
// → 전체 시스템의 모든 interactive 요소가 자동 업데이트
```

## 📂 파일 구조

```
lib/design-tokens/
├── index.ts                    # Public API (barrel export)
│
├── primitives.ts               # Layer 1: 원시값
│   ├── SIZE_PRIMITIVES
│   ├── SPACING_PRIMITIVES
│   ├── MOTION_PRIMITIVES
│   ├── ELEVATION_PRIMITIVES
│   └── 변환 유틸리티
│
├── semantic.ts                 # Layer 2: 의미론적 토큰
│   ├── INTERACTIVE_TOKENS
│   ├── CONTENT_TOKENS
│   ├── MOTION_TOKENS
│   ├── ELEVATION_TOKENS
│   └── 타입 exports
│
├── motion.ts                   # Motion 유틸리티
│   ├── getTransitionClasses()
│   ├── getStaggerDelay()
│   └── ANIMATION_PRESETS
│
└── components/                 # Layer 3: 컴포넌트별
    ├── header.ts              # Header 토큰
    ├── notification.ts        # Notification 토큰
    └── [future] button.ts, card.ts, ...
```

## 🎨 주요 토큰

### Interactive Elements

| Token                                 | Mobile | Desktop | 용도                 |
| ------------------------------------- | ------ | ------- | -------------------- |
| `INTERACTIVE_TOKENS.size.standard`    | 44px   | 40px    | 기본 버튼 (WCAG AAA) |
| `INTERACTIVE_TOKENS.size.comfortable` | 48px   | 44px    | 주요 액션            |
| `INTERACTIVE_TOKENS.icon.standard`    | 24px   | 20px    | Interactive 아이콘   |

### Motion

| Token                               | Duration | Easing   | 용도         |
| ----------------------------------- | -------- | -------- | ------------ |
| `MOTION_TOKENS.transition.instant`  | 100ms    | sharp    | Hover, Focus |
| `MOTION_TOKENS.transition.fast`     | 200ms    | standard | 드롭다운     |
| `MOTION_TOKENS.transition.moderate` | 300ms    | standard | 모달         |

### Elevation

| Token                                 | Z-Index | Shadow | 용도     |
| ------------------------------------- | ------- | ------ | -------- |
| `ELEVATION_TOKENS.layer.floating`     | 20      | md     | Dropdown |
| `ELEVATION_TOKENS.layer.modal`        | 50      | xl     | Modal    |
| `ELEVATION_TOKENS.layer.notification` | 70      | 2xl    | Toast    |

## 🔧 유틸리티 함수

### Size 변환

```typescript
toTailwindSize({ mobile: 44, desktop: 40 }, 'h');
// → 'h-11 md:h-10'
```

### Transition 생성

```typescript
getTransitionClasses('fast', ['background-color', 'transform']);
// → 'motion-safe:transition-[...] motion-safe:duration-200 ...'
```

### Stagger Animation

```typescript
style={getNotificationItemAnimation(index)}
// → { animationDelay: '80ms' }
```

## ✅ Best Practices

### DO

✅ Layer 3 (Components) 우선 사용
✅ Semantic naming 준수
✅ Responsive 값 항상 포함
✅ Web Interface Guidelines 준수 (transition: specific properties)
✅ WCAG AAA 준수 (최소 44px 터치 타겟)

### DON'T

❌ 하드코딩 (className="h-11 w-11")
❌ `transition: all` 사용
❌ Primitive 직접 사용 (컴포넌트에서)
❌ 일관성 없는 naming
❌ 반응형 고려 누락

## 📊 마이그레이션 체크리스트

기존 컴포넌트를 Design Token v2로 마이그레이션할 때:

- [ ] 하드코딩된 크기/간격 제거
- [ ] `getHeader*Classes()` 함수 사용
- [ ] `transition: all` → `getTransitionClasses()` 변경
- [ ] Motion 값 토큰화
- [ ] 반응형 크기 적용 확인
- [ ] TypeScript 에러 없음
- [ ] Visual regression test 통과

## 🎯 확장 가이드

### 새로운 컴포넌트 토큰 추가

1. **Semantic 레이어 확인** - 기존 토큰으로 해결 가능한지 검토
2. **Component 파일 생성** - `components/[name].ts`
3. **Index에 Export** - `index.ts`에 public API 추가
4. **Documentation** - 이 README 업데이트

```typescript
// lib/design-tokens/components/card.ts
import { INTERACTIVE_TOKENS, ELEVATION_TOKENS } from '../semantic';
import { toTailwindSize } from '../primitives';

export const CARD_TOKENS = {
  size: {
    sm: toTailwindSize({ mobile: 200, desktop: 180 }, 'min-h'),
    md: toTailwindSize({ mobile: 300, desktop: 280 }, 'min-h'),
  },
  elevation: ELEVATION_TOKENS.shadow.medium,
};

export function getCardClasses(size: 'sm' | 'md' = 'md'): string {
  return [CARD_TOKENS.size[size], 'rounded-lg', `shadow-${CARD_TOKENS.elevation}`].join(' ');
}
```

## 🐛 트러블슈팅

### TypeScript 에러: "Cannot find module"

```bash
# index.ts에 export 추가했는지 확인
grep "getHeaderButtonClasses" lib/design-tokens/index.ts
```

### Tailwind 클래스가 적용 안 됨

```typescript
// 동적 클래스는 작동하지 않음
const size = 11;
className={`h-${size}`} // ❌

// 토큰 사용
className={getHeaderSizeClasses('container')} // ✅
```

### 반응형이 작동하지 않음

```typescript
// Tailwind breakpoint 확인
// 기본: sm(640px), md(768px), lg(1024px)
// 우리 시스템: md(768px) = 데스크톱 breakpoint
```

## 📝 변경 이력

### v2.0.0 (2026-02-16)

- ✨ 3-Layer Token Architecture 도입
- ✨ Motion System 구축
- ✨ Notification Badge Variants (기본/주의/긴급)
- 🔧 `transition: all` → specific properties (Web Interface Guidelines)
- 🔧 WCAG AAA 준수 (44px minimum touch target)
- 📚 완전한 TypeScript 타입 지원

### v1.0.0 (이전)

- Header-specific tokens (`header.ts`)
- 기본 크기/간격 정의

## 🔗 관련 문서

- [CLAUDE.md](../../../CLAUDE.md#design-tokens) - 프로젝트 전반 가이드
- [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- [WCAG 2.1 AAA](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Motion](https://m3.material.io/styles/motion/overview)

---

**Design Token System v2** - Built with ❤️ for Equipment Management System
