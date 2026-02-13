"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { Terminal } from "@/app/terminal";

type BlogPostEntry = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  content: string;
};

function TerminalIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function buildSummary(post: BlogPostEntry): string {
  if (post.description?.trim()) return post.description.trim();

  const chunks = post.content
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter(
      (part) =>
        !part.startsWith("#") &&
        !part.startsWith("![") &&
        !part.startsWith("```") &&
        !part.startsWith("<") &&
        !part.startsWith(">") &&
        !part.startsWith("- ") &&
        !part.startsWith("* ") &&
        !/^\d+\.\s/.test(part),
    );

  return chunks.slice(0, 2).join("\n\n") || post.content.slice(0, 360).trim();
}

export function BlogIndexClient({
  posts,
  terminalFiles,
  terminalUrls,
}: {
  posts: BlogPostEntry[];
  terminalFiles: Record<string, string>;
  terminalUrls: Record<string, string>;
}) {
  const router = useRouter();
  const { theme, setThemeMode } = useTheme();
  const [activeFile, setActiveFile] = useState<{ command: string; content: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalFullscreen, setTerminalFullscreen] = useState(false);
  const [mobileVh, setMobileVh] = useState<number | null>(null);
  const [mobileVOffset, setMobileVOffset] = useState(0);
  const clickTimeoutRef = useRef<number | null>(null);
  const clickKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const desktop = mql.matches;
    setIsDesktop(desktop);
    if (!desktop) setTerminalOpen(false);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isDesktop && terminalOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.touchAction = "none";
      const vv = window.visualViewport;
      if (vv) {
        const update = () => {
          setMobileVh(vv.height);
          setMobileVOffset(vv.offsetTop);
        };
        update();
        vv.addEventListener("resize", update);
        vv.addEventListener("scroll", update);
        return () => {
          document.documentElement.style.overflow = "";
          document.body.style.overflow = "";
          document.body.style.position = "";
          document.body.style.width = "";
          document.body.style.touchAction = "";
          vv.removeEventListener("resize", update);
          vv.removeEventListener("scroll", update);
        };
      }
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.touchAction = "";
    };
  }, [isDesktop, terminalOpen]);

  useEffect(
    () => () => {
      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
    },
    [],
  );

  const allFiles = useMemo(() => {
    const files = { ...terminalFiles };
    for (const post of posts) {
      const fileName = `blog/${post.slug}.md`;
      files[fileName] = `# ${post.title}\n\n*${new Date(post.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}*\n\n${buildSummary(post)}\n\nRead full post: /blog/${post.slug}`;
    }
    return files;
  }, [posts, terminalFiles]);

  const allUrls = useMemo(() => {
    const urls = { ...terminalUrls };
    for (const post of posts) {
      urls[`blog/${post.slug}.md`] = `/blog/${post.slug}`;
    }
    return urls;
  }, [posts, terminalUrls]);

  const groupedPosts = useMemo(() => {
    const groups: { heading: string; posts: BlogPostEntry[] }[] = [];
    const map = new Map<string, BlogPostEntry[]>();
    for (const post of posts) {
      const heading = new Date(post.date).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const bucket = map.get(heading);
      if (bucket) bucket.push(post);
      else map.set(heading, [post]);
    }
    for (const [heading, grouped] of map.entries()) {
      groups.push({ heading, posts: grouped });
    }
    return groups;
  }, [posts]);

  const handleThemeChange = useCallback(
    (themeName: string) => {
      setThemeMode(themeName as "auto" | "light" | "warm" | "dark-blue" | "dark-gray" | "midnight");
    },
    [setThemeMode],
  );

  const openUrl = useCallback((url?: string, inNewTab = false) => {
    if (!url) return;
    if (inNewTab) {
      window.open(url, "_blank");
      return;
    }
    if (url.startsWith("/")) {
      router.push(url);
      return;
    }
    window.location.assign(url);
  }, [router]);

  const handlePostClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, post: BlogPostEntry) => {
      const key = `post-${post.slug}`;
      const url = `/blog/${post.slug}`;

      if (e.metaKey || e.ctrlKey || e.shiftKey || e.detail === 2) {
        if (clickTimeoutRef.current && clickKeyRef.current === key) {
          window.clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        openUrl(url, e.metaKey || e.ctrlKey);
        return;
      }

      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
      clickKeyRef.current = key;
      clickTimeoutRef.current = window.setTimeout(() => {
        if (activeId === key) {
          setActiveId(null);
          setActiveFile(null);
          return;
        }
        const fileName = `blog/${post.slug}.md`;
        const content = allFiles[fileName];
        if (!content) return;
        setActiveId(key);
        setActiveFile({ command: `cat ${fileName}`, content });
        if (!terminalOpen) setTerminalOpen(true);
      }, 220);
    },
    [activeId, allFiles, openUrl, terminalOpen],
  );

  return (
    <main
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      <div
        className={`px-8 py-16 sm:py-24 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          terminalOpen && !terminalFullscreen ? "lg:max-w-[50vw]" : ""
        }`}
        style={{
          opacity: terminalFullscreen ? 0 : 1,
          pointerEvents: terminalFullscreen ? "none" : "auto",
        }}
      >
        <div className="max-w-[560px] mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
          <header>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
                Gabe&apos;s Blog
              </h1>
              <Link
                href="/"
                className="text-sm transition-opacity hover:opacity-75"
                style={{ color: theme.textMuted }}
              >
                Home
              </Link>
            </div>
            <p className="text-[15px] mt-6 leading-relaxed" style={{ color: theme.textDim }}>
              Click a post to preview its summary in terminal. Shift/Cmd-click or double-click to open the full post.
            </p>
            <div className={`hidden lg:grid transition-all duration-300 ${terminalOpen ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
              <div className="overflow-hidden">
                <button
                  onClick={() => setTerminalOpen(true)}
                  className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 border"
                  style={{ color: theme.text, borderColor: theme.border }}
                >
                  <TerminalIcon />
                  Access bash terminal
                </button>
              </div>
            </div>
            {!terminalOpen && (
              <button
                onClick={() => setTerminalOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer border"
                style={{ color: theme.text, borderColor: theme.border }}
              >
                <TerminalIcon />
                Access bash terminal
              </button>
            )}
          </header>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          {groupedPosts.length === 0 ? (
            <p style={{ color: theme.textMuted }}>No blog posts yet.</p>
          ) : (
            <div className="space-y-8">
              {groupedPosts.map((group) => (
                <section key={group.heading}>
                  <h2
                    className="text-xs font-medium uppercase tracking-wider mb-3"
                    style={{ color: theme.textMuted }}
                  >
                    {group.heading}
                  </h2>
                  <ul className="space-y-2">
                    {group.posts.map((post) => (
                      <li key={post.slug}>
                        <button
                          type="button"
                          onClick={(e) => handlePostClick(e, post)}
                          className="w-full text-left flex items-baseline gap-2 rounded-md px-1 py-1.5 transition-opacity hover:opacity-80"
                          style={{ color: activeId === `post-${post.slug}` ? theme.text : theme.textDim }}
                        >
                          <span style={{ color: theme.textMuted }}>-</span>
                          <span className="font-medium">{post.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {isDesktop ? (
        <div className={`fixed ease-[cubic-bezier(0.22,1,0.36,1)] ${
          !terminalOpen
            ? "transition-all duration-150 opacity-0 scale-95 pointer-events-none left-1/2 top-1/2 -translate-y-1/2 ml-4 w-[calc(50vw-5rem)] h-[80vh]"
            : terminalFullscreen
              ? "transition-all duration-500 opacity-100 scale-100 z-50 top-10 left-10 right-10 bottom-10 w-auto h-auto ml-0 translate-y-0"
              : "transition-all duration-500 opacity-100 scale-100 left-1/2 top-1/2 -translate-y-1/2 ml-4 w-[calc(50vw-5rem)] h-[80vh]"
        }`}>
          <Terminal
            activeFile={activeFile}
            staticFiles={allFiles}
            initialFiles={{}}
            initialUrls={allUrls}
            theme={theme}
            sessionKey="site"
            onClose={() => {
              setTerminalFullscreen(false);
              setTerminalOpen(false);
            }}
            onMinimize={() => {
              setTerminalFullscreen(false);
              setTerminalOpen(false);
            }}
            onExpand={() => setTerminalFullscreen(!terminalFullscreen)}
            onThemeChange={handleThemeChange}
          />
        </div>
      ) : terminalOpen ? (
        <div
          className="fixed left-0 w-full z-50 overflow-hidden"
          style={{
            backgroundColor: theme.termBg,
            top: 0,
            height: mobileVh ? `${mobileVh}px` : "100dvh",
            transform: mobileVOffset ? `translateY(${mobileVOffset}px)` : undefined,
          }}
        >
          <Terminal
            activeFile={activeFile}
            staticFiles={allFiles}
            initialFiles={{}}
            initialUrls={allUrls}
            theme={theme}
            sessionKey="site"
            onClose={() => setTerminalOpen(false)}
            onMinimize={() => setTerminalOpen(false)}
            onExpand={() => {}}
            onThemeChange={handleThemeChange}
            borderless
          />
        </div>
      ) : null}
    </main>
  );
}
