import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Shared font loader for next/og ImageResponse. Runs under the Node.js runtime
// so OG routes can also read blog MDX from disk via getBlogPost. Fonts are
// colocated beside this file under ./fonts/.

type OgFont = {
  name: string;
  data: Buffer;
  weight: 500 | 700;
  style: "normal";
};

const FONT_DIR = join(process.cwd(), "lib", "og", "fonts");

async function load(filename: string): Promise<Buffer> {
  return readFile(join(FONT_DIR, filename));
}

let cache: OgFont[] | null = null;

export async function getOgFonts(): Promise<OgFont[]> {
  if (cache) return cache;

  const [geistMedium, geistBold] = await Promise.all([
    load("Geist-Medium.ttf"),
    load("Geist-Bold.ttf"),
  ]);

  cache = [
    { name: "Geist", data: geistMedium, weight: 500, style: "normal" },
    { name: "Geist", data: geistBold, weight: 700, style: "normal" },
  ];

  return cache;
}
