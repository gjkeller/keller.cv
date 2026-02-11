"use client";

import { useTheme } from "@/lib/theme-context";
import { BlogShell } from "../blog-shell";
import { InlineTOC, type TocHeading } from "./table-of-contents";
import type { MouseEvent } from "react";
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
    month: "long",
    day: "numeric",
  });

  const hasToc = headings && headings.length > 0;

  const handleSkeuoMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--sx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  };

  return (
    <BlogShell>
      <style>{`
        .blog-prose :where(a:not(.no-underline)) {
          text-decoration: underline;
          text-decoration-color: transparent;
          text-underline-offset: 3px;
          transition: color 140ms ease, text-decoration-color 140ms ease, opacity 140ms ease;
        }
        .blog-prose :where(a:not(.no-underline):hover) {
          color: ${theme.isDark ? "#93c5fd" : "#1d4ed8"};
          text-decoration-color: currentColor;
          opacity: 0.96;
        }
        .blog-prose > :last-child::after {
          content: "";
          display: inline-block;
          width: 0.72em;
          height: 0.72em;
          margin-left: 0.28em;
          border-radius: 0.1em;
          background-color: ${theme.isDark ? "#60a5fa" : "#2563eb"};
          vertical-align: -0.01em;
        }
        .blog-skeuo-btn {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--base-border, transparent);
          background-color: var(--base-bg, transparent);
          transition: box-shadow 200ms ease, transform 200ms ease, border-color 200ms ease, background-color 200ms ease;
        }
        .blog-skeuo-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          transition: opacity 160ms ease;
          background: radial-gradient(
            220px 150px ellipse at var(--sx, -300px) var(--sy, -300px),
            var(--gloss-color, rgba(255,255,255,0.06)) 0%,
            transparent 100%
          );
        }
        .blog-skeuo-btn:hover {
          background-color: var(--hover-bg);
          border-color: var(--hover-border);
          box-shadow: var(--hover-shadow);
        }
        .blog-skeuo-btn:hover::before { opacity: 1; }
        .blog-skeuo-btn:active {
          background-color: var(--hover-bg);
          border-color: var(--hover-border);
          box-shadow: var(--active-shadow);
          filter: brightness(0.98);
        }
      `}</style>
      <div className="max-w-3xl">
        {/* Hero image */}
        {post.image && (
          <div className="-mt-2 sm:-mt-3 mb-8 mx-auto max-w-[22.5rem] rounded-lg overflow-hidden">
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

        {/* Article Header */}
        <header className="mb-4 mx-auto max-w-[22.5rem] text-center">
          <h1
            className="text-[1.4rem] sm:text-[1.85rem] font-semibold leading-tight tracking-tight mb-2.5"
            style={{ color: theme.text }}
          >
            {post.title}
          </h1>
          <div className="text-sm" style={{ color: theme.textMuted }}>
            <time dateTime={post.date}>{formattedDate}</time>
          </div>
        </header>

        {/* Inline TOC — skeuomorphic, collapsible */}
        {hasToc && <InlineTOC headings={headings} theme={theme} />}

        {/* Article Content */}
        <article
          className="blog-prose prose prose-base max-w-none [&_h2]:text-[1.55rem] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-[1.25rem] [&_h3]:font-semibold [&_h3]:tracking-tight"
          style={{
            ["--tw-prose-body" as string]: theme.isDark ? "#a5b3c7" : "#7a828e",
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
        <div className="mt-12">
          <div className="py-5 text-center">
            <p className="text-base mb-3" style={{ color: theme.textDim }}>
              If you enjoyed this post, you&apos;ll love my X account:
            </p>
            <a
              href="https://x.com/gabrieljkeller"
              target="_blank"
              rel="noopener noreferrer"
              className="blog-skeuo-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
              style={{
                color: theme.text,
                ["--base-bg" as string]: "transparent",
                ["--base-border" as string]: theme.isDark ? "rgba(255,255,255,0.18)" : "rgba(15,20,25,0.2)",
                ["--hover-bg" as string]: theme.cardHoverBg,
                ["--hover-border" as string]: theme.cardHoverBorder,
                ["--hover-shadow" as string]: theme.cardShadow,
                ["--active-shadow" as string]: theme.cardActiveShadow,
                ["--gloss-color" as string]: theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)",
              }}
              onMouseMove={handleSkeuoMove}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @gabrieljkeller
            </a>
          </div>
        </div>
      </div>
    </BlogShell>
  );
}
