import { ImageResponse } from "next/og";
import { BlogPostOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/template";
import { getOgFonts } from "@/lib/og/fonts";

export const runtime = "nodejs";

export const alt = "Gabe's Blog — Writing by Gabriel Keller";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const fonts = await getOgFonts();

  return new ImageResponse(<BlogPostOg title="Writing" />, {
    ...size,
    fonts,
  });
}
