import { readFileSync } from 'node:fs';

const files = {
  globals: 'apps/frontend/styles/globals.css',
  layout: 'apps/frontend/app/layout.tsx',
  helmet: 'apps/backend/src/common/middleware/helmet-config.ts',
};

const read = (path) => readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`[font-policy] ${message}`);
  process.exitCode = 1;
};

const globals = read(files.globals);
const layout = read(files.layout);
const helmet = read(files.helmet);

const expectedMappings = {
  '--font-sans': 'var(--ems-font-sans)',
  '--font-display': 'var(--ems-font-display)',
  '--font-body': 'var(--ems-font-body)',
  '--font-mono': 'var(--ems-font-mono)',
};

for (const [tailwindVar, runtimeVar] of Object.entries(expectedMappings)) {
  if (!globals.includes(`${tailwindVar}: ${runtimeVar};`)) {
    fail(`${files.globals} must map ${tailwindVar} to ${runtimeVar}`);
  }
}

const inlineFontToken = globals
  .split('\n')
  .find(
    (line) =>
      /--font-(sans|display|body|mono):/.test(line) &&
      !/--font-(sans|display|body|mono):\s*var\(--ems-font-/.test(line)
  );

if (inlineFontToken) {
  fail(`${files.globals} must not inline font stacks in Tailwind font tokens`);
}

if (!layout.includes('FONT_CSS_VARIABLES')) {
  fail(`${files.layout} must inject FONT_CSS_VARIABLES from shared-constants`);
}

const googleFontHosts = ['fonts.' + 'googleapis.com', 'fonts.' + 'gstatic.com'];

for (const token of googleFontHosts) {
  if (helmet.includes(token)) {
    fail(`${files.helmet} must not allow unused external font provider ${token}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
