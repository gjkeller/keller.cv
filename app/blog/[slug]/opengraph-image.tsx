import { ImageResponse } from "next/og";
import { BlogPostOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/template";
import { getOgFonts } from "@/lib/og/fonts";
import { getBlogPost, getAllSlugs } from "@/lib/mdx";

export const runtime = "nodejs";

export const alt = "Blog post — Gabriel Keller";
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
  params: { slug: string };
}) {
  const post = getBlogPost(params.slug);
  const fonts = await getOgFonts();

  const title = post?.title ?? "Post not found";

  return new ImageResponse(<BlogPostOg title={title} />, {
    ...size,
    fonts,
  });
}
