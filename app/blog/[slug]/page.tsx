import { notFound } from "next/navigation";
import { getBlogPost, getAllSlugs } from "@/lib/mdx";
import { MDXContent } from "@/components/mdx-content";
import { BlogPostClient } from "./blog-post-client";
import { extractHeadings } from "@/lib/extract-headings";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  // The OG image always comes from the colocated app/blog/[slug]/opengraph-image.tsx
  // route (kicker + title). `post.image` frontmatter is reserved for the
  // in-article hero image and is intentionally not surfaced as the OG image.
  // We restate the auto-discovered image URL here so we can attach a per-post
  // alt; without this override Next.js uses the static `alt` exported from
  // opengraph-image.tsx, which can't see the post title.
  const ogImageUrl = `https://keller.cv/blog/${slug}/opengraph-image`;
  const ogImageAlt = `${post.title} — Gabriel Keller`;

  return {
    title: post.title,
    description: post.description || `Read ${post.title} by Gabriel Keller`,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://keller.cv/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author || "Gabriel Keller"],
      tags: post.tags,
      images: [{ url: ogImageUrl, alt: ogImageAlt, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [{ url: ogImageUrl, alt: ogImageAlt }],
    },
    alternates: { canonical: `https://keller.cv/blog/${slug}` },
  };
}

function buildArticleJsonLd(post: {
  title: string;
  description?: string;
  date: string;
  author?: string;
  image?: string;
  tags?: string[];
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author || "Gabriel Keller",
      url: "https://keller.cv",
    },
    publisher: {
      "@type": "Person",
      name: "Gabriel Keller",
      url: "https://keller.cv",
    },
    url: `https://keller.cv/blog/${post.slug}`,
    ...(post.image && { image: `https://keller.cv${post.image}` }),
    ...(post.tags && { keywords: post.tags.join(", ") }),
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = buildArticleJsonLd({ ...post, slug });
  const headings = extractHeadings(post.content);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post} headings={headings}>
        <MDXContent content={post.content} />
      </BlogPostClient>
    </>
  );
}
