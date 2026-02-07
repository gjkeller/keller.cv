import { notFound } from "next/navigation";
import { getBlogPost, getAllSlugs } from "@/lib/mdx";
import { MDXContent } from "@/components/mdx-content";
import { BlogPostClient } from "./blog-post-client";

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

  return {
    title: `${post.title} | Gabriel Keller`,
    description: post.description || `Read ${post.title} by Gabriel Keller`,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author || "Gabriel Keller"],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <BlogPostClient post={post}>
      <MDXContent content={post.content} />
    </BlogPostClient>
  );
}
