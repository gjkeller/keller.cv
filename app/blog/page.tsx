import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/mdx";
import { getAllTerminalFiles } from "@/lib/content";
import { BlogIndexClient } from "./blog-index-client";

export const metadata: Metadata = {
  title: "Gabe's Blog",
  description:
    "Thoughts on software engineering, AI, and building with agents — by Gabriel Keller.",
  openGraph: {
    title: "Gabe's Blog — Gabriel Keller",
    description:
      "Thoughts on software engineering, AI, and building with agents.",
    url: "https://keller.cv/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gabe's Blog — Gabriel Keller",
    description:
      "Thoughts on software engineering, AI, and building with agents.",
  },
  alternates: { canonical: "https://keller.cv/blog" },
};

export default function BlogPage() {
  const posts = getBlogPosts();
  const terminal = getAllTerminalFiles();

  return (
    <BlogIndexClient
      posts={posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        description: post.description,
        content: post.content,
      }))}
      terminalFiles={terminal.files}
      terminalUrls={terminal.urls}
    />
  );
}
