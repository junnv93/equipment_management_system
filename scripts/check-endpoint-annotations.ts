#!/usr/bin/env ts-node
/**
 * CI 보안 검증 스크립트
 *
 * 모든 컨트롤러의 HTTP 메서드에 보안 데코레이터가 적용되어 있는지 검증합니다.
 * 각 엔드포인트는 다음 중 하나를 반드시 가져야 합니다:
 * - @RequirePermissions(...) — 역할 기반 권한 검사
 * - @SkipPermissions() — 인증만 필요 (권한 검사 생략)
 * - @Public() — 인증/인가 모두 생략
 *
 * 사용법:
 *   npx ts-node scripts/check-endpoint-annotations.ts
 *   pnpm security:check
 */

import * as fs from 'fs';
import * as path from 'path';

const CONTROLLERS_DIR = path.resolve(__dirname, '../apps/backend/src/modules');

/** HTTP 메서드 데코레이터 패턴 */
const HTTP_METHOD_REGEX = /@(Get|Post|Put|Patch|Delete)\s*\(/;

/** 보안 데코레이터 패턴 */
const SECURITY_DECORATOR_REGEX = /@(RequirePermissions|SkipPermissions|Public)\s*\(/;

/** 메서드 선언 패턴 — async foo( 또는 foo( (들여쓰기 있음, 데코레이터 아님) */
const METHOD_DECL_REGEX = /^\s+(?:async\s+)?(\w+)\s*\(/;

interface Violation {
  file: string;
  line: number;
  method: string;
  httpMethod: string;
}

interface PipeViolation {
  file: string;
  line: number;
  method: string;
  httpMethod: string;
}

/** Mutation HTTP methods that should have body validation */
const MUTATION_METHODS = new Set(['Post', 'Put', 'Patch']);

/**
 * Exemption comment pattern — 엔드포인트 블록에 이 주석이 있으면 파이프 경고 스킵
 * 사용 예: // @BodyPipeExempt: no JSON body (file upload / single field extraction)
 */
const PIPE_EXEMPT_REGEX = /@BodyPipeExempt/;

/**
 * @Body without pipe: @Body() or @Body('field') — no validation applied
 * Matches the inner argument of @Body(...):
 *   - empty: @Body()
 *   - string literal: @Body('title')
 */
const RAW_BODY_REGEX = /@Body\s*\(\s*(?:'[^']*'|"[^"]*")?\s*\)/;

/**
 * Validation pipe present:
 *   - @UsePipes(SomePipe) on the method
 *   - @Body(SomePipe) where arg is an identifier (not string/empty)
 */
const VALIDATION_PIPE_REGEX = /@UsePipes\s*\(|@Body\s*\(\s*[A-Za-z_$]/;

function findControllerFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findControllerFiles(fullPath));
    } else if (entry.name.endsWith('.controller.ts') && !entry.name.endsWith('.spec.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * 전체 데코레이터 블록을 문자열로 추출하여 보안 데코레이터 존재 여부 확인
 *
 * 전략:
 * 1. @Get/@Post 등을 찾으면, 그 위 데코레이터 블록 시작점을 결정
 * 2. 아래로 메서드 선언(async method(...))까지 스캔
 * 3. 그 범위 전체에서 보안 데코레이터 정규식 검색
 */
function checkFile(filePath: string): { violations: Violation[]; pipeViolations: PipeViolation[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];
  const pipeViolations: PipeViolation[] = [];
  const relativePath = path.relative(process.cwd(), filePath);

  // 클래스 레벨 보안 데코레이터 확인
  // 클래스 선언 위 20줄에서 보안 데코레이터 검색
  let hasClassLevelSecurity = false;
  const classLineIdx = lines.findIndex(l => /^\s*export\s+class\s+/.test(l));
  if (classLineIdx >= 0) {
    const classBlock = lines.slice(Math.max(0, classLineIdx - 15), classLineIdx).join('\n');
    hasClassLevelSecurity = SECURITY_DECORATOR_REGEX.test(classBlock);
  }

  for (let i = 0; i < lines.length; i++) {
    const httpMatch = lines[i].match(HTTP_METHOD_REGEX);
    if (!httpMatch) continue;

    const httpMethod = httpMatch[1];

    // 위쪽 블록 시작점 결정: 이전 메서드의 닫는 중괄호 또는 constructor, 클래스 선언 등
    let blockStart = i;
    for (let j = i - 1; j >= Math.max(0, i - 30); j--) {
      const trimmed = lines[j].trim();
      // 빈 줄, 단일줄 주석, 구분선 주석은 건너뜀
      if (trimmed === '' || trimmed.startsWith('//')) {
        blockStart = j;
        continue;
      }
      // 이전 메서드의 끝, constructor, 클래스 선언을 만나면 중단
      if (trimmed === '}' || trimmed.startsWith('constructor') || trimmed.startsWith('export class')) {
        break;
      }
      // 데코레이터라면 블록에 포함
      if (trimmed.startsWith('@')) {
        blockStart = j;
        continue;
      }
      // 그 외 (데코레이터 내부 내용 등)는 포함
      blockStart = j;
    }

    // 아래쪽 블록: 메서드 선언까지 (대형 @ApiBody 스키마 포함하여 충분히 검색)
    let blockEnd = i;
    let methodName = '<unknown>';
    for (let j = i + 1; j < Math.min(lines.length, i + 60); j++) {
      blockEnd = j;
      const trimmed = lines[j].trim();
      // 메서드 선언 찾기 (데코레이터가 아닌 코드 줄)
      const declMatch = lines[j].match(METHOD_DECL_REGEX);
      if (declMatch && !trimmed.startsWith('@')) {
        methodName = declMatch[1];
        break;
      }
    }

    // 블록 전체에서 보안 데코레이터 검색
    const block = lines.slice(blockStart, blockEnd + 1).join('\n');
    const hasSecurityDecorator = hasClassLevelSecurity || SECURITY_DECORATOR_REGEX.test(block);

    if (!hasSecurityDecorator) {
      violations.push({
        file: relativePath,
        line: i + 1,
        method: methodName,
        httpMethod,
      });
    }

    // Pipe violation check: mutation methods with @Body but no validation pipe
    if (MUTATION_METHODS.has(httpMethod)) {
      // Scan decorator block + method parameter list (up to 30 lines after declaration)
      const fullContext = lines
        .slice(blockStart, Math.min(lines.length, blockEnd + 30))
        .join('\n');
      const hasRawBody = RAW_BODY_REGEX.test(fullContext);
      const hasValidationPipe = VALIDATION_PIPE_REGEX.test(fullContext);

      const isExempt = PIPE_EXEMPT_REGEX.test(fullContext);
      if (hasRawBody && !hasValidationPipe && !isExempt) {
        pipeViolations.push({
          file: relativePath,
          line: i + 1,
          method: methodName,
          httpMethod,
        });
      }
    }
  }

  return { violations, pipeViolations };
}

function main(): void {
  console.log('🔒 보안 데코레이터 검증 시작...\n');

  const controllerFiles = findControllerFiles(CONTROLLERS_DIR);
  console.log(`📁 검사 대상 컨트롤러: ${controllerFiles.length}개\n`);

  let totalEndpoints = 0;
  const allViolations: Violation[] = [];
  const allPipeViolations: PipeViolation[] = [];

  for (const file of controllerFiles) {
    const { violations, pipeViolations } = checkFile(file);
    const fileContent = fs.readFileSync(file, 'utf-8');
    const httpMethods = fileContent.match(/@(Get|Post|Put|Patch|Delete)\s*\(/g);
    totalEndpoints += httpMethods?.length || 0;
    allViolations.push(...violations);
    allPipeViolations.push(...pipeViolations);
  }

  console.log(`📊 전체 엔드포인트: ${totalEndpoints}개\n`);

  // ── Zod 파이프 누락 경고 (exit code 영향 없음) ──────────────────────────
  if (allPipeViolations.length > 0) {
    console.warn('⚠️  Zod 파이프 누락 경고 (mutation 엔드포인트에 @Body 검증 없음):\n');
    for (const v of allPipeViolations) {
      console.warn(`  ${v.file}:${v.line} — @${v.httpMethod} ${v.method}()`);
    }
    console.warn(`\n총 ${allPipeViolations.length}개 엔드포인트에 ZodValidationPipe 또는 @Body(Pipe) 적용 권장\n`);
  }

  // ── 보안 데코레이터 검증 (exit 1 — 배포 차단) ────────────────────────────
  if (allViolations.length === 0) {
    console.log('✅ 모든 엔드포인트에 보안 데코레이터가 적용되어 있습니다.\n');
    if (allPipeViolations.length === 0) {
      console.log('✅ 모든 mutation 엔드포인트에 Zod 파이프가 적용되어 있습니다.\n');
    }
    process.exit(0);
  } else {
    console.error('❌ 보안 데코레이터가 누락된 엔드포인트:\n');
    for (const v of allViolations) {
      console.error(`  ${v.file}:${v.line} — @${v.httpMethod} ${v.method}()`);
    }
    console.error(`\n총 ${allViolations.length}개의 엔드포인트에 @RequirePermissions, @SkipPermissions, 또는 @Public 데코레이터가 필요합니다.`);
    console.error(`(${totalEndpoints - allViolations.length}/${totalEndpoints} 통과)`);
    process.exit(1);
  }
}

main();
