"use client";

import { Calendar, Clock } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { BlogShell } from "../blog-shell";

interface BlogPost {
  title: string;
  date: string;
  description?: string;
  author?: string;
  tags?: string[];
  readingTime: { text: string };
}

export function BlogPostClient({
  post,
  children,
}: {
  post: BlogPost;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <BlogShell>
      {/* Article Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: theme.text }}
        >
          {post.title}
        </h1>

        {post.description && (
          <p className="text-xl mb-6" style={{ color: theme.textDim }}>
            {post.description}
          </p>
        )}

        <div
          className="flex items-center gap-6 text-sm"
          style={{ color: theme.textMuted }}
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

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm rounded-full"
                style={{
                  backgroundColor: theme.cardHoverBg,
                  color: theme.textDim,
                  border: `1px solid ${theme.border}`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Article Content */}
      <article
        className="prose prose-lg max-w-none"
        style={{
          ["--tw-prose-body" as string]: theme.textDim,
          ["--tw-prose-headings" as string]: theme.text,
          ["--tw-prose-links" as string]: theme.isDark ? "#60a5fa" : "#2563eb",
          ["--tw-prose-bold" as string]: theme.text,
          ["--tw-prose-counters" as string]: theme.textMuted,
          ["--tw-prose-bullets" as string]: theme.textMuted,
          ["--tw-prose-hr" as string]: theme.border,
          ["--tw-prose-quotes" as string]: theme.text,
          ["--tw-prose-quote-borders" as string]: theme.border,
          ["--tw-prose-code" as string]: theme.text,
          ["--tw-prose-pre-bg" as string]: theme.isDark ? "#1e293b" : "#f1f5f9",
          ["--tw-prose-pre-code" as string]: theme.isDark ? "#e2e8f0" : "#1e293b",
          ["--tw-prose-th-borders" as string]: theme.border,
          ["--tw-prose-td-borders" as string]: theme.border,
        }}
      >
        {children}
      </article>
    </BlogShell>
  );
}
