import { ImageResponse } from "next/og";
import { HandleOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/template";
import { getOgFonts } from "@/lib/og/fonts";
import { siteData } from "@/lib/data";

// Node runtime is used everywhere for parity with the dynamic blog OG route
// (which needs disk access for MDX). Keeping all five OG routes on the same
// runtime avoids per-route cold-start surprises.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

export const alt = `${siteData.name} — ${siteData.handle}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const fonts = await getOgFonts();

  return new ImageResponse(<HandleOg handle={siteData.handle} variant="home" />, {
    ...size,
    fonts,
  });
}
