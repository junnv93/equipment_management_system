import { cn } from '@/lib/utils';

/**
 * UL Solutions 자체 회사 로고.
 *
 * 원본 SVG 파일(`/public/images/ul-logo.svg`)을 변경 없이 그대로 사용한다.
 * path/viewBox/transform 임의 수정 금지 — 디자이너가 공급한 자산 그대로 보존.
 *
 * 사이즈 조정은 className(`h-6 w-auto` 등)으로만 한다. SVG 내부 비율(가로:세로 ≈ 2.43:1)은 유지된다.
 *
 * 사용처:
 * - 로그인 페이지 좌측 브랜딩 영역 (이미 직접 `<img>` 태그 사용 중 — 본 컴포넌트 미경유)
 * - 사이드바 footer (DashboardShell.tsx)
 *
 * 명세서 §3.1: 외부 회사 브랜딩 → 자체 브랜드 마크 교체 (사용자 결정: 회사 보유 UL 로고 사용).
 */

export interface UlLogoProps {
  className?: string;
  /** Decorative 사용 시 true (기본 false → alt 텍스트 노출). */
  ariaHidden?: boolean;
}

export function UlLogo({ className, ariaHidden = false }: UlLogoProps) {
  return (
    <img
      src="/images/ul-logo.svg"
      alt={ariaHidden ? '' : 'UL Solutions'}
      aria-hidden={ariaHidden || undefined}
      className={cn(className)}
    />
  );
}
