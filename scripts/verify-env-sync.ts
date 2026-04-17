#!/usr/bin/env tsx
/**
 * ENV SSOT 동기화 검증
 *
 * env.validation.ts (zod schema, 런타임 검증 SSOT) 와 .env.example (로컬 스캐폴드)
 * 간 drift를 방지한다. zod schema가 required인 키가 .env.example에 누락되면 실패.
 *
 * 사용법:
 *   pnpm verify:env-sync
 *
 * 실행 흐름:
 *   1. apps/backend/src/config/env.validation.ts 의 envSchema 를 dynamic import
 *   2. safeParse({}) 로 required 키 자동 추출 (수동 리스트 유지 불필요)
 *   3. .env.example 을 라인 단위로 파싱하여 존재하는 키 수집
 *   4. required \ example 의 차집합이 비어있지 않으면 exit 1
 *
 * 이 스크립트가 실패하면 추가/변경된 환경 변수에 대해 다음을 전부 업데이트해야 함:
 *   - .env.example (이 스크립트가 체크)
 *   - apps/backend/.env (로컬 개발용 — git ignored)
 *   - infra/secrets/lan.env.sops.yaml  (`pnpm secrets:edit ENV=lan`)
 *   - infra/secrets/prod.env.sops.yaml (`pnpm secrets:edit ENV=prod`)
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

interface EnvSchemaModule {
  envSchema: {
    safeParse: (value: unknown) => { success: boolean; error?: { issues: { path: (string | number)[] }[] } };
  };
}

async function main(): Promise<void> {
  const schemaPath = resolve(repoRoot, 'apps/backend/src/config/env.validation.ts');
  const { envSchema } = (await import(schemaPath)) as EnvSchemaModule;

  const parsed = envSchema.safeParse({});
  const requiredKeys = parsed.success
    ? []
    : [...new Set(parsed.error!.issues.filter((i) => i.path.length === 1).map((i) => String(i.path[0])))];

  const exampleContent = readFileSync(resolve(repoRoot, '.env.example'), 'utf-8');
  const exampleKeys = new Set<string>();
  for (const rawLine of exampleContent.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const key = line.split('=')[0];
    if (key) exampleKeys.add(key);
  }

  const missing = requiredKeys.filter((k) => !exampleKeys.has(k));
  if (missing.length > 0) {
    const lines = [
      '❌ env-sync: .env.example 에 envSchema 의 required 키가 누락되었습니다.',
      '',
      ...missing.map((k) => `  - ${k}`),
      '',
      '수정 방법:',
      '  1. .env.example 에 해당 키와 플레이스홀더 값을 추가 (openssl 생성 가이드 주석 포함)',
      '  2. apps/backend/.env 에도 실제 개발용 값 설정',
      '  3. infra/secrets/{lan,prod}.env.sops.yaml 에 pnpm secrets:edit 로 반영',
      '',
      '이 게이트는 env.validation.ts 가 SSOT 임을 강제합니다.',
    ].join('\n');
    console.error(lines);
    process.exit(1);
  }

  console.log(`✔ env-sync: required 환경변수 ${requiredKeys.length}개 모두 .env.example 에 존재`);
}

main().catch((err) => {
  console.error('env-sync 스크립트 실행 실패:', err);
  process.exit(1);
});
