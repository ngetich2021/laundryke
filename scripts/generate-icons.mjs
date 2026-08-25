import sharp from "sharp";
import { mkdirSync } from "node:fs";

const CROP = { left: 82, top: 15, width: 360, height: 360 };
const MASK_SIZE = 400;
const circleMaskSvg = Buffer.from(
  `<svg width="${MASK_SIZE}" height="${MASK_SIZE}"><circle cx="${MASK_SIZE / 2}" cy="${MASK_SIZE / 2}" r="${MASK_SIZE / 2}" fill="white"/></svg>`
);
const circleMask = await sharp(circleMaskSvg).resize(MASK_SIZE, MASK_SIZE).png().toBuffer();

const cropped = await sharp("public/logo.png").extract(CROP).resize(MASK_SIZE, MASK_SIZE).toBuffer();

const masked = await sharp(cropped)
  .composite([{ input: circleMask, blend: "dest-in" }])
  .flatten({ background: "#ffffff" })
  .png()
  .toBuffer();

async function makeIcon(outPath, size) {
  await sharp(masked).resize(size, size).png().toFile(outPath);
  console.log("wrote", outPath, size);
}

mkdirSync("public/icons", { recursive: true });

await makeIcon("app/icon.png", 32);
await makeIcon("app/apple-icon.png", 180);
await makeIcon("public/icons/icon-192.png", 192);
await makeIcon("public/icons/icon-512.png", 512);
