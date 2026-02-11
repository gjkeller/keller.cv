import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getBlogPosts } from "@/lib/mdx";
import { BlogShell } from "./blog-shell";

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

  return (
    <BlogShell>
      {/* Page Header */}
      <div className="mb-12">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: "var(--theme-text)" }}
        >
          Gabe&apos;s Blog
        </h1>
        <p className="text-xl" style={{ color: "var(--theme-text-dim)" }}>
          Thoughts on agentic engineering.
        </p>
      </div>

      {/* Blog Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p
              className="text-lg mb-4"
              style={{ color: "var(--theme-text-dim)" }}
            >
              No blog posts yet.
            </p>
            <p style={{ color: "var(--theme-text-muted)" }}>
              Check back soon for updates!
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const formattedDate = new Date(post.date).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" },
            );

            return (
              <article
                key={post.slug}
                className="py-4 border-b last:border-b-0"
                style={{
                  borderColor: "var(--theme-border)",
                }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block -mx-1 px-1 py-1 rounded-md transition-opacity hover:opacity-85"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <h2
                        className="text-lg sm:text-xl font-semibold transition-colors"
                        style={{ color: "var(--theme-text)" }}
                      >
                        {post.title}
                      </h2>

                      {post.description && (
                        <p
                          className="mt-1.5 text-sm leading-relaxed line-clamp-2"
                          style={{ color: "var(--theme-text-dim)" }}
                        >
                          {post.description}
                        </p>
                      )}

                      <div className="mt-2 text-xs" style={{ color: "var(--theme-text-muted)" }}>
                        <time dateTime={post.date}>{formattedDate}</time>
                      </div>
                    </div>

                    {post.image && (
                      <div className="w-28 sm:w-36 shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          width={360}
                          height={220}
                          className="w-full h-auto group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            );
          })
        )}
      </div>
    </BlogShell>
  );
}
