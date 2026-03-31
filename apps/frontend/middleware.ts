/**
 * Next.js Edge Runtime 진입점 — 반드시 이 파일명이어야 합니다.
 *
 * 구현은 proxy.ts에서 관리합니다. Next.js가 `middleware.ts`(또는 `middleware.js`)만
 * 미들웨어로 인식하므로, 이 파일은 진입점 역할만 수행합니다.
 */
export { proxy as middleware, config } from './proxy';
