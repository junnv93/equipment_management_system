/**
 * Drizzle 스키마에서 Zod 스키마 자동 생성 스크립트
 *
 * 사용법:
 *   pnpm --filter @equipment-management/schemas generate:from-drizzle
 *
 * 이 스크립트는 apps/backend의 Drizzle 스키마를 읽어서
 * packages/schemas/src에 Zod 스키마를 자동 생성합니다.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 프로젝트 루트 경로
const projectRoot = join(__dirname, '../../..');
const drizzleSchemaPath = join(
  projectRoot,
  'apps/backend/src/database/drizzle/schema/equipment.ts'
);
const outputPath = join(projectRoot, 'packages/schemas/src/equipment.generated.ts');

/**
 * Drizzle 스키마 파일을 읽어서 Zod 스키마로 변환
 *
 * 주의: 이 스크립트는 간단한 변환만 수행합니다.
 * 복잡한 스키마는 수동으로 조정이 필요할 수 있습니다.
 */
function generateZodSchema(drizzleSchemaContent: string): string {
  // 이 부분은 drizzle-zod를 사용하거나, 더 정교한 파싱이 필요합니다.
  // 현재는 템플릿만 제공합니다.

  return `/**
 * 자동 생성된 파일 - 수정하지 마세요!
 * 이 파일은 packages/schemas/scripts/generate-from-drizzle.ts에 의해 생성됩니다.
 * 
 * Drizzle 스키마를 수정한 후 다음 명령어를 실행하세요:
 *   pnpm --filter @equipment-management/schemas generate:from-drizzle
 */

import { z } from 'zod';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';

// 주의: 이 파일은 자동 생성되므로 직접 수정하지 마세요.
// 수정이 필요한 경우 generate-from-drizzle.ts 스크립트를 업데이트하세요.

// TODO: Drizzle 스키마를 import하여 자동 생성
// import { equipment } from '../../../apps/backend/src/database/drizzle/schema/equipment';
// 
// export const equipmentSchema = createSelectSchema(equipment);
// export const createEquipmentSchema = createInsertSchema(equipment);
// export const updateEquipmentSchema = createInsertSchema(equipment).partial();

// 현재는 수동 동기화 방식 사용 중
// 향후 개선: drizzle-zod의 타입 인스턴스화 문제 해결 후 자동 생성 활성화
`;
}

function main() {
  console.log('🔧 Drizzle 스키마에서 Zod 스키마 생성 중...');

  // Drizzle 스키마 파일 확인
  if (!existsSync(drizzleSchemaPath)) {
    console.error(`❌ Drizzle 스키마 파일을 찾을 수 없습니다: ${drizzleSchemaPath}`);
    process.exit(1);
  }

  // Drizzle 스키마 읽기
  const drizzleSchemaContent = readFileSync(drizzleSchemaPath, 'utf-8');

  // Zod 스키마 생성
  const zodSchemaContent = generateZodSchema(drizzleSchemaContent);

  // 출력 디렉토리 생성
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Zod 스키마 파일 작성
  writeFileSync(outputPath, zodSchemaContent, 'utf-8');

  console.log(`✅ Zod 스키마 생성 완료: ${outputPath}`);
  console.log(
    '⚠️  주의: 현재는 템플릿만 생성됩니다. 실제 사용을 위해서는 스크립트 개선이 필요합니다.'
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
