#!/usr/bin/env node
// Optimizes everything listed in scripts/assets.config.mjs.
// Usage: npm run optimize            (only rebuilds what changed)
//        npm run optimize -- --force (rebuilds everything)
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';
import config from './assets.config.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src');
const OUT = path.join(ROOT, 'assets');
const FORCE = process.argv.includes('--force');

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function mtime(p) {
  try {
    return (await fs.stat(p)).mtimeMs;
  } catch {
    return 0;
  }
}

async function upToDate(src, outs) {
  if (FORCE) return false;
  const s = await mtime(src);
  for (const o of outs) if ((await mtime(o)) < s) return false;
  return true;
}

async function optimizeImage({ src, out, widths, mode = 'auto', quality = config.quality }) {
  const srcPath = path.join(SRC, src);
  const meta = await sharp(srcPath).metadata();
  const targets = [...new Set(widths.map((w) => Math.min(w, meta.width)))].sort((a, b) => a - b);
  const outPaths = targets.map((w) => path.join(OUT, 'img', `${out}-${w}.webp`));
  if (await upToDate(srcPath, outPaths)) return { src, skipped: true };
  await fs.mkdir(path.dirname(outPaths[0]), { recursive: true });

  const lossy = { quality, effort: 6, smartSubsample: true };
  const lossless = { lossless: true, effort: 6 };

  // Decide encoding once, at the largest width.
  let useLossless = mode === 'lossless';
  if (mode === 'auto') {
    const top = targets.at(-1);
    const base = () => sharp(srcPath).resize({ width: top, withoutEnlargement: true });
    const [a, b] = await Promise.all([
      base().webp(lossy).toBuffer(),
      base().webp(lossless).toBuffer(),
    ]);
    useLossless = b.length <= a.length * 1.1;
  }

  let total = 0;
  for (let i = 0; i < targets.length; i++) {
    const info = await sharp(srcPath)
      .resize({ width: targets[i], withoutEnlargement: true })
      .webp(useLossless ? lossless : lossy)
      .toFile(outPaths[i]);
    total += info.size;
  }
  return { src, kind: useLossless ? 'lossless' : `q${quality}`, widths: targets, size: total };
}

async function optimizeVideo({ src, out, maxWidth, crf = config.videoCrf }) {
  const srcPath = path.join(SRC, src);
  const mp4 = path.join(OUT, 'video', `${out}.mp4`);
  const poster = path.join(OUT, 'video', `${out}-poster.webp`);
  if (await upToDate(srcPath, [mp4, poster])) return { src, skipped: true };
  await fs.mkdir(path.dirname(mp4), { recursive: true });

  const scale = `scale='min(iw,${maxWidth})':-2:flags=lanczos`;
  await run(ffmpegPath, [
    '-y', '-v', 'error', '-i', srcPath,
    '-an', // portfolio loops are muted; dropping audio saves space
    '-vf', scale,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
    '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    mp4,
  ]);

  const frame = path.join(OUT, 'video', `${out}-poster.tmp.png`);
  await run(ffmpegPath, ['-y', '-v', 'error', '-i', mp4, '-frames:v', '1', frame]);
  await sharp(frame).webp({ quality: 75, effort: 6 }).toFile(poster);
  await fs.rm(frame);

  const size = (await fs.stat(mp4)).size;
  const before = (await fs.stat(srcPath)).size;
  return { src, kind: `crf${crf}`, size, before };
}

async function copyFile({ src, out }) {
  const from = path.join(SRC, src);
  const to = path.join(OUT, out);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
  return { src, size: (await fs.stat(to)).size };
}

const results = [];
for (const img of config.images) results.push(await optimizeImage(img));
for (const vid of config.videos) results.push(await optimizeVideo(vid));
for (const c of config.copy) results.push(await copyFile(c));

for (const r of results) {
  if (r.skipped) console.log(`  =  ${r.src} (up to date)`);
  else if (r.before)
    console.log(`  ✓  ${r.src}  ${kb(r.before)} → ${kb(r.size)}  (${r.kind})`);
  else console.log(`  ✓  ${r.src}  ${kb(r.size)}${r.kind ? `  (${r.kind}, ${r.widths})` : ''}`);
}
