import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { getBlogPosts } from "@/lib/mdx";
import { BlogShell } from "./blog-shell";

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
          Blog
        </h1>
        <p className="text-xl" style={{ color: "var(--theme-text-dim)" }}>
          Thoughts on software engineering, technology, and life.
        </p>
      </div>

      {/* Blog Posts */}
      <div className="space-y-8">
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
                className="border-b pb-8 last:border-b-0"
                style={{ borderColor: "var(--theme-border)" }}
              >
                <div className="mb-4">
                  <Link href={`/blog/${post.slug}`} className="group">
                    <h2
                      className="text-2xl font-semibold group-hover:text-blue-500 transition-colors mb-2"
                      style={{ color: "var(--theme-text)" }}
                    >
                      {post.title}
                    </h2>
                  </Link>

                  <div
                    className="flex items-center gap-4 text-sm mb-3"
                    style={{ color: "var(--theme-text-muted)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={post.date}>{formattedDate}</time>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.readingTime.text}</span>
                    </div>

                    {post.author && (
                      <div>
                        <span>by {post.author}</span>
                      </div>
                    )}
                  </div>

                  {post.description && (
                    <p
                      className="mb-4 leading-relaxed"
                      style={{ color: "var(--theme-text-dim)" }}
                    >
                      {post.description}
                    </p>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: "var(--theme-card-hover-bg)",
                            color: "var(--theme-text-dim)",
                            border: "1px solid var(--theme-border)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                  >
                    Read more &rarr;
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </BlogShell>
  );
}
