# 장비 관리 시스템 디자인 시스템

## 개요

이 문서는 장비 관리 시스템의 디자인 시스템과 스타일링 방식에 대한 가이드를 제공합니다. Next.js 14 App Router 환경에 최적화된 접근법을 사용합니다.

## 기술 스택

- **Next.js 14**: App Router 기반 라우팅 및 서버 컴포넌트
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **CSS 모듈**: 컴포넌트별 스코프 CSS
- **Shadcn UI**: 재사용 가능한 UI 컴포넌트
- **Lucide Icons**: 모던한 아이콘 세트

## 스타일링 접근법

### 1. CSS 모듈 (권장)

컴포넌트별 스타일링에 가장 권장되는 방식입니다. 클래스 이름 충돌을 방지하고 코드 분할과 함께 작동합니다.

#### 사용 방법:
```tsx
// Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
}

.primary {
  background-color: var(--primary);
  color: white;
}

// Button.tsx
import styles from './Button.module.css';

export function Button({ variant = 'primary', children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

### 2. Tailwind CSS

빠른 프로토타이핑과 일관된 디자인을 위해 Tailwind CSS를 사용합니다.

#### 사용 방법:
```tsx
export function Alert({ variant = 'info', children }) {
  const variantClasses = {
    info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    warning: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    error: 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    success: 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  };

  return (
    <div className={`p-4 rounded-md ${variantClasses[variant]}`}>
      {children}
    </div>
  );
}
```

### 3. CSS 모듈 + Tailwind 조합 (추천)

복잡한 컴포넌트를 위해 CSS 모듈과 Tailwind를 함께 사용합니다.

#### 사용 방법:
```tsx
// Card.module.css
.cardAnimation {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Card.tsx
import styles from './Card.module.css';

export function Card({ children }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${styles.cardAnimation}`}>
      {children}
    </div>
  );
}
```

### 4. CSS-in-JS (제한적 사용)

동적 스타일이 많은 컴포넌트에 대해서만 제한적으로 사용합니다. 서버 컴포넌트에서는 사용할 수 없으므로 주의해야 합니다.

## 컬러 시스템

테마 색상은 CSS 변수로 정의되어 있으며, 다크 모드를 지원합니다.

### 기본 색상 팔레트

```scss
:root {
  --background: 0 0% 100%;          // 배경색
  --foreground: 0 0% 3.9%;          // 기본 텍스트 색
  --primary: 0 0% 9%;               // 주요 강조색
  --primary-foreground: 0 0% 98%;   // 주요 강조색 위의 텍스트
  --secondary: 0 0% 96.1%;          // 보조 강조색
  --muted: 0 0% 96.1%;              // 희미한/억제된 요소
  --accent: 0 0% 96.1%;             // 액센트 색상
  --destructive: 0 84.2% 60.2%;     // 위험/삭제 작업
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  // ...기타 다크 모드 색상
}
```

### 색상 사용 예시

```tsx
// Tailwind에서 사용
<button className="bg-primary text-primary-foreground">
  버튼
</button>

// CSS 모듈에서 사용
.button {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

## 타이포그래피

기본 폰트는 Inter이며, 시스템 폰트로 대체됩니다.

```tsx
// 제목
<h1 className="text-2xl font-bold">제목</h1>
<h2 className="text-xl font-semibold">부제목</h2>

// 본문
<p className="text-base">기본 텍스트</p>
<p className="text-sm text-muted-foreground">작은 텍스트</p>
```

## 반응형 디자인

모바일 우선(Mobile First) 접근법을 사용합니다.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 내용 */}
</div>
```

브레이크포인트:
- `sm`: 640px 이상
- `md`: 768px 이상
- `lg`: 1024px 이상
- `xl`: 1280px 이상
- `2xl`: 1536px 이상

## 애니메이션

애니메이션은 CSS 모듈에 정의하거나 tailwind.config.js에 추가하여 사용합니다.

```tsx
// tailwind.config.js의 커스텀 애니메이션
animation: {
  'fade-in': 'fadeIn 0.5s ease-out forwards',
  'slide-up': 'slideUp 0.4s ease-out forwards',
}

// 사용 예
<div className="animate-fade-in">페이드 인</div>
```

## 컴포넌트 가이드라인

### 1. 컴포넌트 구조

복합 컴포넌트는 컴포지션 패턴을 사용합니다:

```tsx
export function Tabs({ children }) {
  // ...
}

Tabs.Item = function TabsItem({ children }) {
  // ...
}

// 사용:
<Tabs>
  <Tabs.Item>탭 1</Tabs.Item>
  <Tabs.Item>탭 2</Tabs.Item>
</Tabs>
```

### 2. 상태 표시

일관된 방식으로 상태를 표시합니다:

```tsx
function StatusBadge({ status }) {
  const statusStyles = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
```

## 다크 모드 지원

모든 컴포넌트는 다크 모드를 지원해야 합니다.

```tsx
// 다크 모드 토글 버튼
import { useTheme } from '@/lib/theme-provider';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md bg-secondary"
    >
      {theme === 'dark' ? '라이트 모드' : '다크 모드'}
    </button>
  );
}
```

## 접근성 가이드라인

1. **적절한 대비**: 텍스트는 배경과 충분한 대비를 가져야 합니다.
2. **키보드 접근성**: 모든 상호작용 요소는 키보드로 접근 가능해야 합니다.
3. **ARIA 라벨**: 아이콘 버튼과 같은 요소에는 항상 ARIA 라벨을 제공합니다.
4. **포커스 관리**: 모달 및 다이얼로그는 포커스를 적절히 관리해야 합니다.

## 문제 해결

### App Router 관련 스타일 이슈

1. **인라인 스타일 문제**: `<style jsx>` 및 `<style jsx global>`은 App Router에서 문제가 발생할 수 있습니다. CSS 모듈로 대체하세요.
2. **서버 컴포넌트**: 서버 컴포넌트에서는 CSS-in-JS를 사용할 수 없습니다. CSS 모듈이나 Tailwind를 사용하세요.
3. **클래스 변환**: Next.js 14에서는 클래스명이 `__className_d65c78`와 같이 변환될 수 있습니다. CSS 모듈은 이 문제를 해결합니다.

### 성능 최적화

1. **중요 CSS 인라인**: 첫 페인트 시 중요한 스타일은 인라인으로 포함하세요.
2. **메모이제이션**: 불필요한 리렌더링을 피하기 위해 `React.memo`, `useMemo`, `useCallback`을 적절히 사용하세요.
3. **코드 분할**: 큰 컴포넌트는 필요할 때만 로드되도록 동적 임포트를 사용하세요.

## 예제 구현

### 1. 버튼 컴포넌트

```tsx
// Button.module.css
.buttonBase {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.buttonPrimary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

// Button.tsx
import styles from './Button.module.css';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  styles.buttonBase,
  {
    variants: {
      variant: {
        primary: styles.buttonPrimary,
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
```

## 결론

이 디자인 시스템은
1. **일관성 있는 사용자 경험**을 제공합니다.
2. **개발 속도**를 높이고 재사용 가능한 패턴을 확립합니다.
3. **접근성 및 반응형 디자인**을 기본으로 합니다.
4. **성능과 유지보수성**을 최적화합니다.

앞으로 새로운 컴포넌트와 기능을 개발할 때 이 가이드라인을 참조하세요. 