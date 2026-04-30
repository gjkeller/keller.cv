"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { BlogShell } from "../blog-shell";
import { InlineTOC, type TocHeading } from "./table-of-contents";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface BlogPost {
  title: string;
  date: string;
  description?: string;
  author?: string;
  image?: string;
  readingTime: { text: string };
}

type ThemeOption = {
  id: "auto" | "light" | "warm" | "dark-gray" | "dark-blue" | "midnight";
  label: "Auto" | "Light" | "Warm" | "Dark Gray" | "Dark Blue" | "Midnight";
};

const THEME_OPTIONS: ThemeOption[] = [
  { id: "auto", label: "Auto" },
  { id: "light", label: "Light" },
  { id: "warm", label: "Warm" },
  { id: "dark-gray", label: "Dark Gray" },
  { id: "dark-blue", label: "Dark Blue" },
  { id: "midnight", label: "Midnight" },
];

function getHeaderTint(themeMode: string, isDark: boolean): string {
  switch (themeMode) {
    case "light":
      return "rgba(250,250,250,0.62)";
    case "warm":
      return "rgba(245,240,235,0.62)";
    case "dark-gray":
      return "rgba(24,24,27,0.58)";
    case "dark-blue":
      return "rgba(15,23,42,0.56)";
    case "midnight":
      return "rgba(2,6,23,0.52)";
    case "auto":
    default:
      return isDark ? "rgba(2,6,23,0.52)" : "rgba(250,250,250,0.62)";
  }
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
  const { theme, themeMode, setThemeMode } = useTheme();
  const [headerStuck, setHeaderStuck] = useState(false);
  const [showJumpTop, setShowJumpTop] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasToc = headings && headings.length > 0;
  const isAiAssistedHero = post.image?.includes("/images/blog/ai-assisted-swe-2026/og-cover.png");

  const headerText = theme.text;
  const headerMuted = theme.textMuted;

  const handleSkeuoMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--sx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  };

  useEffect(() => {
    const updateScrollState = () => {
      const y = window.scrollY;
      setHeaderStuck(y > 2);
      setShowJumpTop(y > 200);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  const handleJumpToTop = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
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
      <div className="max-w-3xl relative">
        <div
          className="sticky top-0 z-40 -mt-14 mb-14 -mx-10 sm:-mx-16 lg:-mx-24 px-10 sm:px-16 lg:px-24 transition-colors duration-300"
          style={{
            backgroundColor: getHeaderTint(themeMode, theme.isDark),
            backdropFilter: "blur(18px) saturate(1.6)",
            WebkitBackdropFilter: "blur(18px) saturate(1.6)",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="relative min-h-6 py-3">
              <Link
                href="/blog"
                className="inline-flex items-center justify-center text-lg font-medium transition-colors duration-300 hover:opacity-80 whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none"
                style={{ color: headerText }}
              >
                All blogs
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-lg font-medium whitespace-nowrap">
                <Link
                  href="/"
                  className="transition-colors duration-300 hover:opacity-80 outline-none focus:outline-none focus-visible:outline-none"
                  style={{ color: headerText }}
                >
                  Gabriel Keller
                </Link>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <DropdownMenu open={themeMenuOpen} onOpenChange={setThemeMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 rounded-md hover:bg-transparent hover:opacity-80 focus-visible:ring-0 focus-visible:ring-offset-0 duration-300"
                      style={{ color: headerText }}
                      aria-label="Open theme selector"
                    >
                      <ThemeIcon dark={theme.isDark} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-36 p-1 shadow-none transition-colors duration-300"
                    style={{ backgroundColor: "var(--theme-bg)", borderColor: "var(--theme-border)" }}
                  >
                    {THEME_OPTIONS.map((option) => {
                      const active = option.id === themeMode;
                      return (
                        <DropdownMenuItem
                          key={option.id}
                          onSelect={(event) => {
                            event.preventDefault();
                            setThemeMode(option.id);
                          }}
                          className="cursor-pointer px-3 py-1.5 text-sm focus:bg-transparent transition-colors duration-300"
                          style={{
                            color: active ? headerText : headerMuted,
                            fontWeight: active ? 500 : 400,
                          }}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div
              className={`h-px transition-opacity duration-150 ${headerStuck ? "opacity-100" : "opacity-0"}`}
              style={{ backgroundColor: "var(--theme-border)" }}
            />
          </div>
        </div>
        {/* Hero image */}
        {post.image && (
          <div
            className={`mt-2 mb-8 mx-auto rounded-lg overflow-hidden ${
              isAiAssistedHero ? "max-w-[45rem]" : "max-w-[22.5rem]"
            }`}
          >
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
          <div className="text-base" style={{ color: theme.textMuted }}>
            <time dateTime={post.date}>{formattedDate}</time>
          </div>
        </header>

        {/* Inline TOC — skeuomorphic, collapsible */}
        {hasToc && <InlineTOC headings={headings} theme={theme} />}

        {/* Article Content */}
        <article
          className="blog-prose prose prose-lg max-w-none [&_h2]:text-[1.55rem] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-[1.25rem] [&_h3]:font-semibold [&_h3]:tracking-tight"
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
            <p className="text-lg mb-3" style={{ color: theme.textDim }}>
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

      <button
        type="button"
        onClick={handleJumpToTop}
        aria-label="Jump to top"
        aria-hidden={!showJumpTop}
        tabIndex={showJumpTop ? 0 : -1}
        className="blog-skeuo-btn bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 h-10 w-10 rounded-full inline-flex items-center justify-center"
        style={{
          position: "fixed",
          color: theme.text,
          opacity: showJumpTop ? 1 : 0,
          transform: showJumpTop ? "translateY(0)" : "translateY(8px)",
          pointerEvents: showJumpTop ? "auto" : "none",
          transition:
            "opacity 200ms ease, transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease, border-color 200ms ease",
          ["--base-bg" as string]: theme.bg,
          ["--base-border" as string]: theme.isDark
            ? "rgba(255,255,255,0.18)"
            : "rgba(15,20,25,0.2)",
          ["--hover-bg" as string]: theme.cardHoverBg,
          ["--hover-border" as string]: theme.cardHoverBorder,
          ["--hover-shadow" as string]: theme.cardShadow,
          ["--active-shadow" as string]: theme.cardActiveShadow,
          ["--gloss-color" as string]: theme.isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.3)",
        }}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--sx", `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty("--sy", `${event.clientY - rect.top}px`);
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </BlogShell>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path
          d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 1 0 10.5 10.5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.25M12 19.25v2.25M21.5 12h-2.25M4.75 12H2.5M18.718 5.282l-1.591 1.591M6.873 17.127l-1.591 1.591M18.718 18.718l-1.591-1.591M6.873 6.873 5.282 5.282" />
    </svg>
  );
}
