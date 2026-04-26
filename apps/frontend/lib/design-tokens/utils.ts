/**
 * Design Token Utilities (Layer 1.5 — Primitive Conversion Helpers)
 *
 * Layer 3 Component 파일에서 Layer 1 primitives.ts를 직접 import하지 않고
 * 여기서 re-export하여 레이어 경계를 명확히 합니다.
 *
 * Layer 3 파일은 primitives 대신 이 파일에서 import하세요.
 */
export { toTailwindSize, toTailwindGap } from './primitives';
