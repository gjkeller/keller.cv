import { ImageResponse } from "next/og";
import { BlogPostOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/template";
import { getOgFonts } from "@/lib/og/fonts";
import { siteData } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

// The blog index page metadata title is "Gabe's Blog — Gabriel Keller", but
// the OG card intentionally renders the single word "Writing" — it's the
// section header on the site itself, and reads cleaner large-format than the
// possessive title. The embed title (set in app/blog/page.tsx) carries the
// fuller branded copy.
export const alt = `Writing — ${siteData.name}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const fonts = await getOgFonts();

  return new ImageResponse(<BlogPostOg title="Writing" />, {
    ...size,
    fonts,
  });
}
