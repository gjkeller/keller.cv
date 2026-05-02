// Generates Next.js App Router icon conventions from public/favicon.png.
// - app/icon.png       : 512x512, transparent (browser tab, Android, PWA)
// - app/apple-icon.png : 180x180, composited on paper #FAFAFA (iOS, iMessage)
//
// Run with:  node scripts/generate-icons.mjs

import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const src = join(root, "public", "favicon.png");

async function main() {
  // app/icon.png — 512x512, transparent. Palette-encoded to keep the file
  // under ~100KB (full RGBA at this size balloons to ~350KB and noticeably
  // affects browser-tab/PWA install paint).
  await sharp(src)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(join(root, "app", "icon.png"));

  // app/apple-icon.png — 180x180, solid paper background (iOS requires opaque).
  // flatten() composites the transparent resize output onto the paper color so
  // the subsequent extend() pads with a matching opaque background.
  await sharp(src)
    .resize(164, 164, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: { r: 250, g: 250, b: 250 } })
    .extend({
      top: 8, bottom: 8, left: 8, right: 8,
      background: { r: 250, g: 250, b: 250, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(join(root, "app", "apple-icon.png"));

  console.log("wrote app/icon.png and app/apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
