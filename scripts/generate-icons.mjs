// Generates Next.js App Router icon conventions:
//   - app/icon.png       : 512x512, transparent (browser tab, Android, PWA)
//   - app/apple-icon.png : 180x180, on paper #FAFAFA (iOS requires opaque)
//
// The mark is the same blue square that closes every blog post (see the
// `.blog-prose > :last-child::after` rule in app/blog/[slug]/blog-post-client.tsx).
// Color #2563eb (Tailwind blue-600) matches the light-theme variant used inline.
//
// Run with:  node scripts/generate-icons.mjs

import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";

const BLUE = "#2563eb";
const PAPER = { r: 250, g: 250, b: 250 };

// Square fills 80% of canvas with corner radius = 10% of square side, mirroring
// the blog endcap's 0.72em width and 0.1em radius (≈ same proportional rounding).
function squareSvg(canvas) {
  const side = Math.round(canvas * 0.8);
  const offset = Math.round((canvas - side) / 2);
  const radius = Math.round(side * 0.1);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">` +
      `<rect x="${offset}" y="${offset}" width="${side}" height="${side}" rx="${radius}" ry="${radius}" fill="${BLUE}"/>` +
      `</svg>`
  );
}

async function main() {
  // app/icon.png — 512x512, transparent. Palette-encoded keeps it well under
  // the ~100KB budget that affects browser-tab/PWA install paint.
  await sharp(squareSvg(512))
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(join(root, "app", "icon.png"));

  // app/apple-icon.png — 180x180, opaque paper background per Apple's spec.
  await sharp(squareSvg(180))
    .flatten({ background: PAPER })
    .png({ compressionLevel: 9 })
    .toFile(join(root, "app", "apple-icon.png"));

  console.log("wrote app/icon.png and app/apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
