import { ImageResponse } from "next/og";
import { BlogPostOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/template";
import { getOgFonts } from "@/lib/og/fonts";
import { getBlogPost, getAllSlugs } from "@/lib/mdx";
import { siteData } from "@/lib/data";

// runtime: "nodejs" so getBlogPost() can readFileSync MDX from disk. The
// route is statically generated at build time (see generateStaticParams),
// so the per-request cost difference vs. the edge runtime is irrelevant.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

// Static fallback alt for the file-convention OG injection. Per-post alt
// (with the actual post title) is set in app/blog/[slug]/page.tsx via
// openGraph.images[].alt, which takes precedence in social embeds.
export const alt = `Writing — ${siteData.name}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Next.js 15 requires dynamic-segment OG files to declare their own slugs
// rather than inheriting from the sibling page.tsx.
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const fonts = await getOgFonts();

  if (!post) {
    // generateStaticParams should have filtered this out; surface in build
    // logs if a slug ever slips through so we don't ship a silent fallback.
    console.warn(
      `[opengraph-image] no post found for slug "${slug}"; rendering fallback`,
    );
  }

  const title = post?.title ?? "Post not found";

  return new ImageResponse(<BlogPostOg title={title} />, {
    ...size,
    fonts,
  });
}
