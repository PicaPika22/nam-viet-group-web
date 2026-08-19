/**
 * Import designer layer plates (black-key or light wash) into WebP.
 *   node scripts/import-hero-layers.mjs
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC =
  "C:/Users/HOANG NHU HIEN/.cursor/projects/c-Users-HOANG-NHU-HIEN-Desktop-DEV-nam-viet-group-web-main/assets";
const OUT = "src/assets/img/hero";

const jobs = [
  {
    from: "c__Users_HOANG_NHU_HIEN_AppData_Roaming_Cursor_User_workspaceStorage_34e534c9e6235ee4cc5d940e52e09ad5_images_1-1c18f70d-615a-4c45-a571-dbf7b4032d67.png",
    to: "layer-wash.webp",
    knock: false,
    w: 1600,
    q: 72,
  },
  {
    from: "c__Users_HOANG_NHU_HIEN_AppData_Roaming_Cursor_User_workspaceStorage_34e534c9e6235ee4cc5d940e52e09ad5_images_6-1a6556f0-4d9e-4475-9ffa-f7ecd257df62.png",
    to: "layer-spark.webp",
    knock: true,
    w: 900,
    q: 80,
  },
  {
    from: "c__Users_HOANG_NHU_HIEN_AppData_Roaming_Cursor_User_workspaceStorage_34e534c9e6235ee4cc5d940e52e09ad5_images_4-71e20f6c-db87-4c00-9f28-f2a12ea475c6.png",
    to: "layer-orb.webp",
    knock: true,
    w: 700,
    q: 78,
  },
  {
    from: "c__Users_HOANG_NHU_HIEN_AppData_Roaming_Cursor_User_workspaceStorage_34e534c9e6235ee4cc5d940e52e09ad5_images_5-0bbd096a-3786-4231-8fa6-a6e75af9fd24.png",
    to: "layer-ring.webp",
    knock: true,
    w: 700,
    q: 78,
  },
  {
    from: "c__Users_HOANG_NHU_HIEN_AppData_Roaming_Cursor_User_workspaceStorage_34e534c9e6235ee4cc5d940e52e09ad5_images_7-39d35f71-b8d4-4da9-ba2e-38d889a9ce6b.png",
    to: "layer-hud.webp",
    knock: true,
    w: 700,
    q: 80,
  },
  {
    from: "c__Users_HOANG_NHU_HIEN_AppData_Roaming_Cursor_User_workspaceStorage_34e534c9e6235ee4cc5d940e52e09ad5_images_8-71d98abf-dffc-48bd-8bab-1973ca25719f.png",
    to: "layer-arcs.webp",
    knock: true,
    w: 700,
    q: 80,
  },
  {
    from: "c__Users_HOANG_NHU_HIEN_AppData_Roaming_Cursor_User_workspaceStorage_34e534c9e6235ee4cc5d940e52e09ad5_images_10-33b3c0c1-89f1-48fa-a971-e92944538957.png",
    to: "layer-mesh.webp",
    knock: true,
    w: 1100,
    q: 76,
  },
];

const knockBlack = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] + data[i + 1] + data[i + 2];
    if (lum < 28) data[i + 3] = 0;
    else if (lum < 70) data[i + 3] = Math.round(((lum - 28) / 42) * data[i + 3]);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
};

await mkdir(OUT, { recursive: true });

for (const job of jobs) {
  const from = path.join(SRC, job.from);
  const to = path.join(OUT, job.to);
  const img = job.knock ? await knockBlack(from) : sharp(from);
  await img.resize({ width: job.w, withoutEnlargement: true }).webp({ quality: job.q, effort: 5 }).toFile(to);
  const { size } = await stat(to);
  console.log(`${job.to.padEnd(20)} ${Math.round(size / 1024)}KB`);
}
