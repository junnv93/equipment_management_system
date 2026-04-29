---
slug: pr15-motion-design
date: 2026-04-24
mode: 1
---

# PR-15: Motion Design Tokens Contract

## MUST Criteria (루프 차단)
1. `pnpm --filter frontend run tsc --noEmit` passes
2. ANIMATION_PRESETS에 fadeInUp, pulseSoft, pulseHard, lift, accordionDown, confettiMicro 추가
3. `staggerItem` 함수 (index: number) → React.CSSProperties 를 motion.ts에서 export
4. `REDUCED_MOTION.safe(animClass: string) → string` 을 motion.ts에서 export
5. globals.css @theme에 `--animate-pulse-soft`, `--animate-pulse-hard`, `--animate-confetti-micro` 추가
6. globals.css에 @keyframes pulseSoft, pulseHard, confettiMicro 추가
7. CheckoutGroupCard.tsx: equipmentRows.map의 각 row div에 stagger 적용 (ANIMATION_PRESETS.staggerFadeInItem + getStaggerFadeInStyle)
8. NEXT_STEP_PANEL_TOKENS.urgency.critical → animate-pulse-hard + motion-reduce:animate-none (workflow-panel.ts)
9. `transition-all` 사용 없음 (checkout 컴포넌트)
10. 새 animate-* 클래스 모두 motion-reduce:animate-none 짝 포함

## SHOULD Criteria (루프 차단 안 함)
1. staggerItem에 @example JSDoc 추가
