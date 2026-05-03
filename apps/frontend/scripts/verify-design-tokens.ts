const { existsSync, readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const rootDir = join(__dirname, '..');
const brandPath = join(rootDir, 'lib/design-tokens/brand.ts');
const globalsPath = join(rootDir, 'styles/globals.css');

const sourceDirs = ['app', 'components', 'hooks', 'lib', 'styles']
  .map((dir) => join(rootDir, dir))
  .filter((dir) => existsSync(dir));

const sourceExtensions = new Set(['.ts', '.tsx', '.css']);
const ignoredPathParts = new Set([
  'node_modules',
  '.next',
  'coverage',
  'playwright-report',
  'test-results',
]);

interface Finding {
  rule: string;
  file: string;
  line: number;
  message: string;
}

function toRepoPath(path: string): string {
  return relative(process.cwd(), path);
}

function fail(message: string): never {
  console.error(`\n[verify-design-tokens] ${message}`);
  process.exit(1);
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => '\n'.repeat(match.split('\n').length - 1))
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function lineNumber(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function listFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    if (ignoredPathParts.has(entry)) continue;

    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...listFiles(path));
      continue;
    }

    const dotIndex = entry.lastIndexOf('.');
    const extension = dotIndex >= 0 ? entry.slice(dotIndex) : '';
    if (sourceExtensions.has(extension)) files.push(path);
  }

  return files;
}

function extractObjectKeys(source: string, objectName: string, terminator: RegExp): Set<string> {
  const start = source.indexOf(objectName);
  if (start < 0) fail(`${objectName} not found`);

  const bodyStart = source.indexOf('{', start);
  if (bodyStart < 0) fail(`${objectName} body start not found`);

  const tail = source.slice(bodyStart);
  const endMatch = terminator.exec(tail);
  if (!endMatch || endMatch.index <= 0) fail(`${objectName} body terminator not found`);

  const body = tail.slice(1, endMatch.index);
  return new Set([...body.matchAll(/^  ([a-z][a-zA-Z0-9_]*):/gm)].map((match) => match[1]));
}

function difference(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((item) => !right.has(item)).sort();
}

function verifyBrandSync(findings: Finding[]): void {
  const brandSource = read(brandPath);
  const globalsSource = read(globalsPath);

  const colorKeys = extractObjectKeys(
    brandSource,
    'export const BRAND_COLORS_HEX',
    /\n} as const;/
  );
  const matrixKeys = extractObjectKeys(
    brandSource,
    'const BRAND_CLASS_MATRIX',
    /\n} as const satisfies/
  );

  for (const key of difference(colorKeys, matrixKeys)) {
    findings.push({
      rule: 'brand-matrix-sync',
      file: toRepoPath(brandPath),
      line: 1,
      message: `BRAND_COLORS_HEX key "${key}" is missing from BRAND_CLASS_MATRIX.`,
    });
  }

  for (const key of difference(matrixKeys, colorKeys)) {
    findings.push({
      rule: 'brand-matrix-sync',
      file: toRepoPath(brandPath),
      line: 1,
      message: `BRAND_CLASS_MATRIX key "${key}" is missing from BRAND_COLORS_HEX.`,
    });
  }

  for (const key of colorKeys) {
    const themeBridge = new RegExp(
      `--color-brand-${key}:\\s*hsl\\(var\\(--brand-color-${key}\\)\\);`
    );
    const runtimeVar = new RegExp(`--brand-color-${key}:`, 'g');

    if (!themeBridge.test(globalsSource)) {
      findings.push({
        rule: 'brand-css-sync',
        file: toRepoPath(globalsPath),
        line: 1,
        message: `Missing @theme bridge --color-brand-${key}.`,
      });
    }

    const runtimeCount = [...globalsSource.matchAll(runtimeVar)].length;
    if (runtimeCount < 2) {
      findings.push({
        rule: 'brand-css-sync',
        file: toRepoPath(globalsPath),
        line: 1,
        message: `Expected light and dark --brand-color-${key} runtime vars; found ${runtimeCount}.`,
      });
    }
  }
}

function verifyClassUsage(findings: Finding[]): void {
  const globalsSource = read(globalsPath);
  const themeKeys = new Set(
    [...globalsSource.matchAll(/--color-brand-([a-z][a-z0-9-]*):/g)].map((match) => match[1])
  );
  const files = sourceDirs.flatMap(listFiles);
  const dynamicBrandClassPattern =
    /(?:bg|text|border|border-[lrtbxy]|ring|fill|stroke)-brand-\$\{[^}]+}/g;
  const brandClassPattern =
    /(?:^|[\s"'`:(])(?:[a-z-]+:)*(?:bg|text|border|border-[lrtbxy]|ring|fill|stroke)-brand-([a-z][a-z0-9-]*)/g;

  for (const file of files) {
    const source = read(file);
    const code = stripComments(source);

    for (const match of code.matchAll(dynamicBrandClassPattern)) {
      findings.push({
        rule: 'brand-dynamic-class',
        file: toRepoPath(file),
        line: lineNumber(code, match.index ?? 0),
        message: `Dynamic brand Tailwind class "${match[0]}" is not discoverable by Tailwind.`,
      });
    }

    for (const match of code.matchAll(brandClassPattern)) {
      const key = match[1];
      if (themeKeys.has(key)) continue;

      findings.push({
        rule: 'brand-theme-key',
        file: toRepoPath(file),
        line: lineNumber(code, match.index ?? 0),
        message: `brand class key "${key}" has no --color-brand-${key} theme token.`,
      });
    }
  }
}

function verifyMotion(findings: Finding[]): void {
  const files = sourceDirs.flatMap(listFiles);

  for (const file of files) {
    const source = read(file);
    const code = stripComments(source);

    for (const match of code.matchAll(/\btransition-all\b/g)) {
      findings.push({
        rule: 'no-transition-all',
        file: toRepoPath(file),
        line: lineNumber(code, match.index ?? 0),
        message: 'Use specific transition utilities or motion tokens instead of transition-all.',
      });
    }
  }
}

const findings: Finding[] = [];
verifyBrandSync(findings);
verifyClassUsage(findings);
verifyMotion(findings);

if (findings.length > 0) {
  console.error('[verify-design-tokens] FAIL');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`);
  }
  process.exit(1);
}

console.log('[verify-design-tokens] PASS');
