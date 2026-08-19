/**
 * Hero petal crops — three real photos for the overlapping leaf masks.
 * Source files are never modified. Re-run after replacing a source:
 *   npm run assets:hero
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "src/assets/img";
const OUT = "src/assets/img/hero";

const src = (file) => path.join(SRC, file);
const dest = (file) => path.join(OUT, file);

const jobs = [
  { from: "cta-1920.jpg", to: "petal-fields-900.webp", w: 900, h: 620, q: 72 },
  { from: "ecosystem-1400.jpg", to: "petal-campus-900.webp", w: 900, h: 620, q: 72 },
  { from: "logistics-fleet.jpg", to: "petal-port-900.webp", w: 900, h: 620, q: 70 },
];

await mkdir(OUT, { recursive: true });

for (const job of jobs) {
  await sharp(src(job.from))
    .resize(job.w, job.h, { fit: "cover", position: "centre" })
    .webp({ quality: job.q, effort: 5 })
    .toFile(dest(job.to));
  const { size } = await stat(dest(job.to));
  console.log(`${job.to.padEnd(26)} ${job.w}x${job.h}  ${Math.round(size / 1024)}KB  <- ${job.from}`);
}
