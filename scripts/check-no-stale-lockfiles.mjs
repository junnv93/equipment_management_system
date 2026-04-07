#!/usr/bin/env node
// Enforces pnpm workspace invariant: only the root pnpm-lock.yaml may exist.
// Any other lockfile (package-lock.json, yarn.lock, sub-package pnpm-lock.yaml)
// is stale and produces phantom Dependabot alerts. See feedback_dependabot_lockfile_first.md.
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const ALLOWED = new Set([`pnpm-lock.yaml`]); // root only
const FORBIDDEN_NAMES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage']);

const offenders = [];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (FORBIDDEN_NAMES.has(entry.name)) {
      const rel = relative(ROOT, full).split(sep).join('/');
      // Allow only the root pnpm-lock.yaml
      if (rel !== 'pnpm-lock.yaml') offenders.push(rel);
    }
  }
}

walk(ROOT);

if (offenders.length > 0) {
  console.error('\n✖ Stale lockfile(s) detected. This pnpm workspace permits only the root pnpm-lock.yaml.\n');
  for (const f of offenders) console.error(`  - ${f}`);
  console.error('\nRemove the offending file(s) and re-run install.');
  console.error('Background: stale lockfiles produce phantom Dependabot alerts and');
  console.error('drift from the actual installed dependency graph.\n');
  process.exit(1);
}
