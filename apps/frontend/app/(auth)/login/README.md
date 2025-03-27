# 로그인 페이지 스타일링 가이드

## 현재 구현 방식

로그인 페이지는 Next.js 14의 App Router 환경에 맞게 CSS 모듈 방식으로 스타일링되었습니다. 이는 다음과 같은 장점을 제공합니다:

1. **스코프 제한**: CSS 클래스 이름이 자동으로 해싱되어 다른 컴포넌트와의 스타일 충돌을 방지합니다.
2. **App Router 호환성**: 서버 컴포넌트와 클라이언트 컴포넌트 모두에서 잘 작동합니다.
3. **성능 최적화**: 스타일이 필요한 컴포넌트에만 로드되고, 코드 스플리팅의 장점을 활용할 수 있습니다.
4. **타입 안전성**: TypeScript와 함께 사용 시 자동 완성 및 타입 검사 혜택을 받을 수 있습니다.

## 파일 구조

- `login.module.css`: 로그인 페이지 전용 스타일
- `globals.css`: 전역적으로 사용되는 애니메이션 및 유틸리티 클래스
- `tailwind.config.js`: Tailwind 테마 및 애니메이션 설정

## 스타일 적용 방법

### 1. CSS 모듈 사용
```tsx
import styles from './login.module.css';

// 컴포넌트 내부에서
<div className={styles.loginContainer}>
  <div className={styles.gridPattern}></div>
</div>
```

### 2. Tailwind CSS와 함께 사용
```tsx
<div className={`${styles.cardWrapper} bg-white dark:bg-gray-900`}>
  {/* 컨텐츠 */}
</div>
```

### 3. 조건부 스타일링
```tsx
<div className={`${styles.loginContainer} ${theme === 'dark' ? styles.darkLoginContainer : ''}`}>
  {/* 컨텐츠 */}
</div>
```

## 애니메이션

모든 애니메이션은 CSS 모듈에 정의되어 있으며, 다음과 같은 효과를 제공합니다:

- `fadeIn`: 요소를 서서히 나타나게 합니다.
- `slideRight`: 왼쪽에서 오른쪽으로 슬라이드되며 나타납니다.
- `slideLeft`: 오른쪽에서 왼쪽으로 슬라이드되며 나타납니다.
- `slideUp`: 아래에서 위로 슬라이드되며 나타납니다.
- `slideDown`: 위에서 아래로 슬라이드되며 나타납니다.
- `scaleIn`: 크기가 커지며 나타납니다.

## 테마 지원

로그인 페이지의 다크 모드는 자체 상태 관리를 통해 구현되었습니다:

```tsx
const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

// 다크 모드 감지
useEffect(() => {
  if (typeof window !== 'undefined') {
    // HTML의 data-theme 또는 localStorage에서 테마 확인
    const isDark = 
      document.documentElement.getAttribute('data-theme') === 'dark' || 
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('equipment-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setIsDarkMode(isDark);
  }
}, []);

// 테마에 따라 스타일 적용
<div className={`${styles.loginContainer} ${isDarkMode ? styles.darkLoginContainer : ''}`}>
  {/* 컨텐츠 */}
</div>
```

이 방식은 외부 라이브러리에 의존하지 않고 컴포넌트의 독립성을 유지하면서도 시스템 테마와 사용자 선호도를 반영합니다.

## 권장 사항

1. **신규 컴포넌트 개발 시**: CSS 모듈 방식을 우선 사용하고, 필요한 경우 Tailwind 클래스와 함께 사용하세요.
2. **애니메이션 사용 시**: 애니메이션 지연을 다양하게 적용하면 더 자연스러운 UX를 제공할 수 있습니다.
3. **컬러 테마**: 다크/라이트 모드를 모두 고려하여 디자인하세요.
4. **접근성**: 애니메이션이 사용자 경험을 방해하지 않도록 주의하세요(`prefers-reduced-motion` 고려).

## 유지보수 시 주의사항

1. 인라인 스타일(`<style jsx>`, `<style jsx global>`)은 피하세요. App Router와 호환성 문제가 있습니다.
2. 복잡한 애니메이션은 CSS 모듈 파일에 정의하고, 컴포넌트에서는 클래스만 참조하세요.
3. 글로벌 스타일은 `globals.css`에, 컴포넌트별 스타일은 `.module.css` 파일에 정의하세요. 