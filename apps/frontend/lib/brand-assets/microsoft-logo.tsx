/* eslint-disable no-restricted-syntax -- self-audit-exception: 외부 Microsoft 공식 브랜드 자산, 4-square 로고 hex는 Microsoft 정의 */
/**
 * Microsoft 4-square logo (Official brand asset)
 *
 * Microsoft's official logo specification (4 squares: red/green/blue/yellow).
 * 외부 회사 브랜드 자산이므로 디자인 토큰화 부적절 — 색상은 Microsoft가 정의한 hex 그대로 사용.
 *
 * 참조: https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general
 */

interface MicrosoftLogoProps {
  className?: string;
}

export function MicrosoftLogo({ className }: MicrosoftLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="10" height="10" fill="#F25022" />
      <rect x="11" width="10" height="10" fill="#7FBA00" />
      <rect y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
