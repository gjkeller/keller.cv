// OG route smoke test. Boots `next start`, fetches every OG/Twitter image
// route, asserts 200 + image/png + 1200x630, then exits.
//
// Run with:  node scripts/smoke-og.mjs
//
// Used in CI to catch font-load failures, satori panics, missing slugs, and
// runtime regressions on the OG pipeline.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { readFileSync, readdirSync } from "node:fs";
import matter from "gray-matter";
import { join } from "node:path";

const PORT = process.env.PORT ?? "3456";
const BASE = `http://127.0.0.1:${PORT}`;
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function discoverBlogSlugs() {
  const dir = join(process.cwd(), "content", "blog");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .filter((slug) => {
      const { data } = matter(readFileSync(join(dir, `${slug}.mdx`), "utf-8"));
      return !data.draft;
    });
}

function pngDimensions(buf) {
  // PNG IHDR width is at byte offset 16, height at 20 (big-endian uint32).
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function check(path) {
  const res = await fetch(`${BASE}${path}`);
  if (res.status !== 200) {
    throw new Error(`${path} → HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.startsWith("image/png")) {
    throw new Error(`${path} → content-type "${ct}", expected image/png`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.subarray(0, 4).equals(PNG_SIG)) {
    throw new Error(`${path} → invalid PNG signature`);
  }
  const { width, height } = pngDimensions(buf);
  if (width !== 1200 || height !== 630) {
    throw new Error(`${path} → ${width}x${height}, expected 1200x630`);
  }
  console.log(`  ok   ${path}  (${buf.length} bytes)`);
}

async function waitForReady(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE);
      if (res.status < 500) return;
    } catch {
      // server not up yet
    }
    await sleep(250);
  }
  throw new Error(`server did not become ready on ${BASE}`);
}

async function main() {
  const slugs = discoverBlogSlugs();
  const routes = [
    "/opengraph-image",
    "/twitter-image",
    "/call/opengraph-image",
    "/call/twitter-image",
    "/blog/opengraph-image",
    "/blog/twitter-image",
    ...slugs.flatMap((slug) => [
      `/blog/${slug}/opengraph-image`,
      `/blog/${slug}/twitter-image`,
    ]),
  ];

  console.log(`booting next start on :${PORT} ...`);
  const server = spawn("pnpm", ["exec", "next", "start", "-p", PORT], {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PORT },
  });

  let failed = false;
  try {
    await waitForReady();
    console.log(`smoking ${routes.length} routes:`);
    for (const route of routes) {
      try {
        await check(route);
      } catch (err) {
        failed = true;
        console.error(`  FAIL ${route}: ${err.message}`);
      }
    }
  } finally {
    server.kill("SIGTERM");
  }

  if (failed) process.exit(1);
  console.log("all OG routes ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
