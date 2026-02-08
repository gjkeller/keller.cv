"use client";

import { useTheme } from "@/lib/theme-context";
import { BlogShell } from "../blog-shell";
import { InlineTOC, type TocHeading } from "./table-of-contents";
import Image from "next/image";

interface BlogPost {
  title: string;
  date: string;
  description?: string;
  author?: string;
  image?: string;
  readingTime: { text: string };
}

export function BlogPostClient({
  post,
  headings,
  children,
}: {
  post: BlogPost;
  headings?: TocHeading[];
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const hasToc = headings && headings.length > 0;

  return (
    <BlogShell>
      <div className="max-w-3xl">
        {/* Article Header */}
        <header className="mb-8">
          <div
            className="flex items-center gap-3 text-sm mb-4"
            style={{ color: theme.textMuted }}
          >
            <time dateTime={post.date}>{formattedDate}</time>
            <span style={{ color: theme.border }}>·</span>
            <span>{post.readingTime.text}</span>
            {post.author && (
              <>
                <span style={{ color: theme.border }}>·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>

          <h1
            className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight mb-4"
            style={{ color: theme.text }}
          >
            {post.title}
          </h1>

          {post.description && (
            <p
              className="text-lg leading-relaxed"
              style={{ color: theme.textDim }}
            >
              {post.description}
            </p>
          )}
        </header>

        {/* Hero image */}
        {post.image && (
          <div className="mb-8 -mx-4 sm:mx-0 rounded-none sm:rounded-lg overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full h-auto"
              priority
            />
          </div>
        )}

        {/* Inline TOC — skeuomorphic, collapsible */}
        {hasToc && <InlineTOC headings={headings} theme={theme} />}

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

        {/* Follow CTA */}
        <div
          className="mt-12 py-6 px-6 rounded-lg border text-center"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          }}
        >
          <p className="text-base mb-3" style={{ color: theme.textDim }}>
            If you enjoyed this post, follow me on X for more.
          </p>
          <a
            href="https://x.com/gabrieljkeller"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: theme.isDark ? "#fff" : "#0f1419",
              color: theme.isDark ? "#0f1419" : "#fff",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @gabrieljkeller
          </a>
        </div>
      </div>
    </BlogShell>
  );
}
