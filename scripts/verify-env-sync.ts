#!/usr/bin/env tsx
/**
 * ENV SSOT 동기화 검증 (2-tier scan)
 *
 * env.validation.ts (zod schema, 런타임 검증 SSOT) 와 .env 계열 파일
 * (기본: .env.example) 간 drift 를 방지한다. 두 가지 required 유형을 모두 커버한다:
 *   1. 항상 required  — top-level `z.string().min(N)` (path.length === 1)
 *   2. 조건부 required — `.refine()` 으로 NODE_ENV=production / STORAGE_DRIVER=s3 등
 *      상황에서만 필수가 되는 키 (refine 위반은 path=[], message 로만 전달)
 *
 * ENV_SYNC_SCENARIOS (env.validation.ts 에 export) 의 각 시나리오로 safeParse 를
 * 반복 실행해 두 유형을 모두 수집한다.
 *
 * 파일에서는 "주석 처리된 플레이스홀더" (`# KEY=value`) 도 문서화된 키로 인정한다
 * — 조건부 required 는 보통 프로덕션/S3 시나리오 가이드 주석 형태로 존재하기 때문.
 *
 * 사용법:
 *   pnpm verify:env-sync                          # .env.example 기본 검증 (pre-push)
 *   pnpm verify:env-sync --file /tmp/decrypted.env  # 임의 파일 검증 (CI SOPS 게이트)
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

interface ZodIssue {
  code: string;
  path: (string | number)[];
  message: string;
}

interface EnvSchemaModule {
  envSchema: {
    safeParse: (value: unknown) => { success: boolean; error?: { issues: ZodIssue[] } };
    _def?: unknown;
  };
  ENV_SYNC_SCENARIOS: Record<string, Record<string, string>>;
}

function extractKeysFromIssues(issues: ZodIssue[], knownKeys: Set<string>): Set<string> {
  const keys = new Set<string>();
  for (const issue of issues) {
    // top-level required: path === ['KEY']
    if (issue.path.length === 1) {
      keys.add(String(issue.path[0]));
      continue;
    }
    // refine 위반 (path === []): message 에서 UPPER_SNAKE_CASE 토큰 추출
    if (issue.path.length === 0 && issue.code === 'custom') {
      const tokens = issue.message.match(/[A-Z][A-Z0-9_]{2,}/g) ?? [];
      for (const token of tokens) {
        if (knownKeys.has(token)) keys.add(token);
      }
    }
  }
  return keys;
}

const DEFAULT_EXAMPLE_PATH = '.env.example';

interface CliOptions {
  filePath: string;
  /** `--file` 플래그로 지정된 파일인지 여부. 에러 메시지 분기에 사용. */
  isExternalFile: boolean;
}

function parseCliOptions(): CliOptions {
  const { values } = parseArgs({
    options: {
      file: { type: 'string' },
    },
    strict: true,
  });
  if (typeof values.file === 'string' && values.file.length > 0) {
    return { filePath: resolve(values.file), isExternalFile: true };
  }
  return { filePath: resolve(repoRoot, DEFAULT_EXAMPLE_PATH), isExternalFile: false };
}

async function main(): Promise<void> {
  const { filePath, isExternalFile } = parseCliOptions();
  const schemaPath = resolve(repoRoot, 'apps/backend/src/config/env.validation.ts');
  const { envSchema, ENV_SYNC_SCENARIOS } = (await import(schemaPath)) as EnvSchemaModule;

  // envSchema shape 에 선언된 모든 키 (refine 메시지 파싱용 화이트리스트).
  // ZodObject.shape 는 public API. ZodEffects(.refine) 로 감싸인 경우 innerType 을 따라간다.
  const knownKeys = collectShapeKeys(envSchema);

  // Step 1: `{}` 로 top-level required (invalid_type) 수집.
  const baseParsed = envSchema.safeParse({});
  const alwaysRequired = baseParsed.success
    ? new Set<string>()
    : extractKeysFromIssues(baseParsed.error!.issues, knownKeys);

  // Step 2: 시나리오별 refine 위반 수집.
  // zod v4 는 top-level invalid_type 이 있으면 refine 을 skip 하므로,
  // alwaysRequired 키를 stub 값으로 채워 refine 까지 도달시킨다.
  const stub: Record<string, string> = {};
  for (const key of alwaysRequired) stub[key] = 'x'.repeat(64);

  const requiredKeys = new Set<string>(alwaysRequired);
  const scenarioResults: Array<{ name: string; keys: string[] }> = [
    { name: 'base (always-required)', keys: [...alwaysRequired].sort() },
  ];
  for (const [name, input] of Object.entries(ENV_SYNC_SCENARIOS)) {
    if (name === 'base') continue;
    const parsed = envSchema.safeParse({ ...stub, ...input });
    if (parsed.success) {
      scenarioResults.push({ name, keys: [] });
      continue;
    }
    const scenarioKeys = extractKeysFromIssues(parsed.error!.issues, knownKeys);
    // alwaysRequired 는 이미 stub 으로 채워서 안 나오지만 방어적으로 diff.
    const refineOnly = [...scenarioKeys].filter((k) => !alwaysRequired.has(k));
    for (const k of refineOnly) requiredKeys.add(k);
    scenarioResults.push({ name, keys: refineOnly.sort() });
  }

  // 3) 검증 대상 파일의 키 집합 수집 (주석 플레이스홀더 포함)
  const exampleContent = readFileSync(filePath, 'utf-8');
  const exampleKeys = new Set<string>();
  for (const rawLine of exampleContent.split('\n')) {
    const stripped = rawLine.replace(/^#\s*/, '').trim();
    if (!stripped) continue;
    const eq = stripped.indexOf('=');
    if (eq < 0) continue;
    const key = stripped.slice(0, eq).trim();
    if (/^[A-Z_][A-Z0-9_]*$/.test(key)) exampleKeys.add(key);
  }

  // 4) diff
  const missing = [...requiredKeys].filter((k) => !exampleKeys.has(k)).sort();
  const displayPath = isExternalFile ? filePath : DEFAULT_EXAMPLE_PATH;
  if (missing.length > 0) {
    const scenarioLines = scenarioResults
      .filter((s) => s.keys.length > 0)
      .map((s) => `    - [${s.name}] ${s.keys.join(', ')}`);
    // 파일 소스별로 수정 가이드 분기:
    //   - .env.example (pre-push 경로)    → 개발자 편집 3-step 가이드
    //   - SOPS decrypt 결과 (CI 경로)      → secrets 재암호화 1-step 가이드
    const fixGuide = isExternalFile
      ? [
          '수정 방법:',
          `  1. 원본 SOPS 파일에 누락 키를 추가 후 pnpm secrets:edit 로 재암호화`,
          `     (이 검증은 "${displayPath}" 를 스캔했습니다)`,
        ]
      : [
          '수정 방법:',
          '  1. .env.example 에 해당 키와 플레이스홀더 값 추가 (조건부 required 는 주석 형태 OK)',
          '  2. apps/backend/.env 에 실제 개발용 값 설정',
          '  3. infra/secrets/{lan,prod}.env.sops.yaml 에 pnpm secrets:edit 로 반영',
        ];
    const lines = [
      `❌ env-sync: ${displayPath} 에 envSchema 의 required 키가 누락되었습니다.`,
      '',
      '누락:',
      ...missing.map((k) => `  - ${k}`),
      '',
      '시나리오별 required (참고):',
      ...scenarioLines,
      '',
      ...fixGuide,
      '',
      '이 게이트는 env.validation.ts 가 SSOT 임을 강제합니다.',
    ].join('\n');
    console.error(lines);
    process.exit(1);
  }

  console.log(
    `✔ env-sync: required 환경변수 ${requiredKeys.size}개 (${scenarioResults.length}개 시나리오 union) 모두 ${displayPath} 에 존재`
  );
}

/**
 * envSchema shape 에 선언된 top-level 키를 수집.
 * `.refine()` 은 ZodEffects 로 감싸서 shape 에 직접 접근이 안 되므로 innerType 을 따라간다.
 */
function collectShapeKeys(schema: unknown): Set<string> {
  type ShapeLike = { shape?: Record<string, unknown>; _def?: { schema?: unknown; innerType?: unknown } };
  let current: ShapeLike | undefined = schema as ShapeLike;
  // ZodEffects 는 ._def.schema (v3) 또는 ._def.innerType 로 내부 object 를 보유
  for (let i = 0; i < 8 && current && !current.shape; i += 1) {
    const next = current._def?.schema ?? current._def?.innerType;
    if (!next) break;
    current = next as ShapeLike;
  }
  if (!current?.shape) return new Set();
  return new Set(Object.keys(current.shape));
}

main().catch((err) => {
  console.error('env-sync 스크립트 실행 실패:', err);
  process.exit(1);
});
