import { ImageResponse } from "next/og";
import { HandleOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/template";
import { getOgFonts } from "@/lib/og/fonts";
import { siteData } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

export const alt = `Book a call — ${siteData.name}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const fonts = await getOgFonts();

  return new ImageResponse(
    <HandleOg handle={`${siteData.handle}/call`} variant="path" />,
    { ...size, fonts },
  );
}
