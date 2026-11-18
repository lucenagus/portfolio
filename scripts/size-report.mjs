#!/usr/bin/env node
// Prints the size of what will be published, and warns about GitHub limits.
//   - Hard block: files > 100 MB are rejected by GitHub.
//   - Warning:    files > 50 MB trigger a push warning.
//   - Pages:      published site should stay < 1 GB (soft bandwidth limit 100 GB/month).
// We use a much stricter budget for a fast portfolio.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IGNORE = new Set(['node_modules', 'assets-src', '.git', 'scripts', '.claude']);
const FILE_WARN = 5 * 1024 * 1024; // flag anything over 5 MB
const SITE_BUDGET = 150 * 1024 * 1024;

const files = [];
async function walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else files.push({ p: path.relative(ROOT, p), size: (await fs.stat(p)).size });
  }
}
await walk(ROOT);

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
const byDir = {};
for (const f of files) {
  const d = f.p.split(path.sep).slice(0, 3).join('/');
  byDir[d] = (byDir[d] || 0) + f.size;
}
const total = files.reduce((s, f) => s + f.size, 0);

console.log('\nBy folder:');
for (const [d, s] of Object.entries(byDir).sort((a, b) => b[1] - a[1])) console.log(`  ${mb(s).padStart(10)}  ${d}`);
console.log('\nLargest files:');
for (const f of [...files].sort((a, b) => b.size - a.size).slice(0, 10))
  console.log(`  ${mb(f.size).padStart(10)}  ${f.p}${f.size > FILE_WARN ? '  ⚠︎ large' : ''}`);
console.log(`\nTotal published: ${mb(total)} (${files.length} files) — budget ${mb(SITE_BUDGET)}`);
if (total > SITE_BUDGET) process.exitCode = 1;
