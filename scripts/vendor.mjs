#!/usr/bin/env node
// Copies third-party browser scripts from node_modules into assets/js/vendor,
// so the site never depends on a CDN at runtime. Run after updating a package:
//   npm update lenis && npm run vendor
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [
  // Lenis — smooth scroll (same library the Framer "Smooth Scroll" component uses)
  { from: 'node_modules/lenis/dist/lenis.min.js', to: 'assets/js/vendor/lenis.min.js' },
];

for (const { from, to } of FILES) {
  const dest = path.join(ROOT, to);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  // drop the sourceMappingURL comment: we don't ship .map files
  const src = (await fs.readFile(path.join(ROOT, from), 'utf8')).replace(/\n?\/\/# sourceMappingURL=.*$/m, '');
  await fs.writeFile(dest, src);
  console.log(`${to}  ${(src.length / 1024).toFixed(1)} KB`);
}
