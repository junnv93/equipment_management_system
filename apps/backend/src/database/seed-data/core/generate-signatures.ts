/**
 * 시드 데이터용 전자서명 PNG 생성기
 *
 * 각 사용자별 고유 서명 스타일의 PNG 이미지를 생성하여
 * uploads/signatures/ 디렉토리에 저장합니다.
 *
 * sharp의 SVG → PNG 변환을 사용합니다.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

/** 서명 생성에 필요한 사용자 정보 */
interface SignatureUser {
  id: string;
  name: string;
}

/** SVG 서명 경로를 만들기 위한 간단한 해시 기반 변형 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

/**
 * 이름 기반으로 손글씨 느낌의 SVG path를 생성
 * 각 사용자마다 고유한 곡선이 나오도록 해시 기반 변형 적용
 */
function generateSignatureSvg(name: string, userId: string): string {
  const h = simpleHash(userId);
  const width = 300;
  const height = 100;

  // 해시 기반으로 곡선 파라미터 변형
  const yBase = 55 + (h % 15) - 7;
  const amp1 = 12 + (h % 10);
  const amp2 = 8 + ((h >> 4) % 8);
  const freq = 0.8 + ((h >> 8) % 5) * 0.1;
  const slant = ((h >> 12) % 7) - 3;

  // 손글씨 느낌의 베지어 곡선 경로 생성
  const points: string[] = [`M 30 ${yBase}`];
  const segments = 5 + (h % 3);
  const segWidth = (width - 60) / segments;

  for (let i = 0; i < segments; i++) {
    const x1 = 30 + i * segWidth + segWidth * 0.3;
    const y1 = yBase + (i % 2 === 0 ? -amp1 : amp2) * freq + slant * i * 0.5;
    const x2 = 30 + i * segWidth + segWidth * 0.7;
    const y2 = yBase + (i % 2 === 0 ? amp2 : -amp1) * freq - slant * (i + 1) * 0.3;
    const x3 = 30 + (i + 1) * segWidth;
    const y3 = yBase + slant * (i + 1) * 0.4;
    points.push(`C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3}`);
  }

  // 마무리 꼬리 (각 사용자마다 다른 방향)
  const tailDir = h % 2 === 0 ? -1 : 1;
  const lastX = 30 + segments * segWidth;
  points.push(
    `Q ${lastX + 15} ${yBase + tailDir * (10 + (h % 8))}, ${lastX + 25} ${yBase + tailDir * (15 + (h % 12))}`
  );

  const pathData = points.join(' ');

  // 색상 변형 (짙은 파란~검정 계열)
  const blue = 20 + (h % 30);
  const strokeColor = `rgb(${10 + (h % 15)}, ${10 + (h % 10)}, ${blue + 40})`;
  const strokeWidth = 1.8 + ((h >> 3) % 3) * 0.3;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="transparent"/>
  <path d="${pathData}"
        fill="none"
        stroke="${strokeColor}"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-linejoin="round"/>
  <text x="${width / 2}" y="${height - 10}"
        text-anchor="middle"
        font-family="serif"
        font-size="11"
        fill="#333"
        opacity="0.6">${name}</text>
</svg>`;
}

/**
 * 모든 사용자의 서명 PNG를 생성하고 uploads/signatures/에 저장
 * @returns 사용자 ID → 서명 경로(DB 저장용 키) 매핑
 */
export async function generateSignatureImages(
  users: SignatureUser[],
  uploadsDir: string
): Promise<Map<string, string>> {
  const sigDir = path.join(uploadsDir, 'signatures');
  await fs.mkdir(sigDir, { recursive: true });

  const pathMap = new Map<string, string>();

  for (const user of users) {
    const svg = generateSignatureSvg(user.name, user.id);
    const filename = `seed-${user.id}.png`;
    const filePath = path.join(sigDir, filename);

    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(filePath);

    // DB에 저장되는 키 형식: 'signatures/seed-{uuid}.png'
    const dbKey = `signatures/${filename}`;
    pathMap.set(user.id, dbKey);
  }

  return pathMap;
}
