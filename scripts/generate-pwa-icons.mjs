#!/usr/bin/env node
/**
 * PWA 아이콘 생성 스크립트
 *
 * 실행: node scripts/generate-pwa-icons.mjs
 * 출력: apps/frontend/public/icons/manifest-192.png, manifest-512.png
 *
 * SVG → PNG 래스터화에 sharp(백엔드 의존성) 사용 — 별도 devDep 없음.
 * CI/CD 또는 새 환경 셋업 시 아이콘 누락 방지 목적.
 */

import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// sharp는 backend node_modules에서 resolve
let sharp;
try {
  sharp = require(join(ROOT, 'apps/backend/node_modules/sharp'));
} catch {
  sharp = require('sharp');
}

const ICONS_DIR = join(ROOT, 'apps/frontend/public/icons');
mkdirSync(ICONS_DIR, { recursive: true });

/** #122C49 (Midnight Blue) — globals.css --primary SSOT */
const BG = '#122C49';
/** 흰색 텍스트 */
const FG = '#FFFFFF';

/**
 * EMS 로고 SVG — 라운드 모서리 배경 + 흰색 텍스트
 * @param {number} size 출력 픽셀 크기
 */
function makeSvg(size) {
  const radius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.28);
  const letterSpacing = Math.round(size * 0.025);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${BG}"/>
  <text
    x="${size / 2}" y="${size / 2}"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-weight="700"
    font-size="${fontSize}"
    letter-spacing="${letterSpacing}"
    fill="${FG}"
  >EMS</text>
</svg>`;
}

const sizes = [
  { name: 'manifest-192.png', px: 192 },
  { name: 'manifest-512.png', px: 512 },
];

for (const { name, px } of sizes) {
  const svg = Buffer.from(makeSvg(px));
  const outPath = join(ICONS_DIR, name);
  await sharp(svg).png().toFile(outPath);
  console.log(`✅ ${name} (${px}×${px}) → ${outPath}`);
}

console.log('PWA 아이콘 생성 완료');
