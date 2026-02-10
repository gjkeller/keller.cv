"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { WorkItem, HackathonWin } from "@/lib/content";
import type { Theme } from "@/lib/themes";
import { useTheme } from "@/lib/theme-context";
import { getCalApi } from "@calcom/embed-react";
import { GithubIcon, LinkedinIcon, XIcon, DevpostIcon } from "./icons";
import { Terminal } from "./terminal";
import { renderMarkdown, type MdStyles } from "@/lib/render-md";

/* ── Social icon map ── */
const socialIcons: Record<string, React.ReactNode> = {
  GitHub: <GithubIcon />, LinkedIn: <LinkedinIcon />, X: <XIcon />, Devpost: <DevpostIcon />,
};

/* ── Props ── */
interface Props {
  socialLinks: { label: string; url: string }[];
  calLink15: string;
  calLink30: string;
  name: string;
  tagline: string;
  bio: string;
  currentWork: WorkItem[];
  hackathons: HackathonWin[];
  posts: { slug: string; title: string; date: string; description?: string; content: string }[];
  terminalFiles: Record<string, string>;
  terminalUrls: Record<string, string>;
}

/* ── Small icons ── */
function TerminalIcon() {
  return (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>);
}

/* ── Ghost card styles ── */
function ghostCardStyle(theme: Theme) {
  return {
    ["--hover-bg" as string]: theme.cardHoverBg,
    ["--hover-border" as string]: theme.cardHoverBorder,
    ["--hover-shadow" as string]: theme.cardShadow,
    ["--active-shadow" as string]: theme.cardActiveShadow,
    ["--gloss-color" as string]: theme.isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.45)",
  };
}
const cardClass = "w-[calc(100%+1.5rem)] text-left -mx-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent";
const callCardClass = "w-full text-left px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent";

function toCalPath(calLink: string): string {
  const trimmed = calLink.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("://")) {
    return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname.endsWith("cal.com")) {
      const path = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
      return `${path}${url.search}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function withCalDuration(calPath: string, minutes: number): string {
  const [path, query = ""] = calPath.split("?");
  const params = new URLSearchParams(query);
  params.set("duration", String(minutes));
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

/* ── Main layout ── */
export function InteractiveLayout({
  socialLinks, calLink15, calLink30, name, tagline, bio,
  currentWork, hackathons, posts, terminalFiles, terminalUrls,
}: Props) {
  const [activeFile, setActiveFile] = useState<{ command: string; content: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  // Viewport detection — single terminal instance adapts to desktop/mobile
  // Always init as true to match SSR; useEffect corrects after hydration
  const [isDesktop, setIsDesktop] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalFullscreen, setTerminalFullscreen] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const desktop = mql.matches;
    setIsDesktop(desktop);
    // On mobile, close the terminal so users land on main content
    if (!desktop) setTerminalOpen(false);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Lock body scroll + track visual viewport for mobile terminal (iOS-safe)
  const [mobileVh, setMobileVh] = useState<number | null>(null);
  const [mobileVOffset, setMobileVOffset] = useState(0);
  useEffect(() => {
    if (!isDesktop && terminalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
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
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.touchAction = '';
          vv.removeEventListener("resize", update);
          vv.removeEventListener("scroll", update);
        };
      }
      return () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.touchAction = '';
      };
    }
  }, [isDesktop, terminalOpen]);

  // Shared theme from context (persisted + system-aware)
  const { theme, setThemeMode } = useTheme();
  const calTheme = theme.isDark ? "dark" : "light";
  const calBrandColor = theme.isDark ? "#CBD5E1" : "#111827";

  // Keep Cal embed UI in sync with the site's auto-resolved theme.
  useEffect(() => {
    let cancelled = false;

    async function configureNamespace(namespace: string) {
      const cal = await getCalApi({ namespace });
      if (cancelled) return;
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "week_view",
        theme: calTheme,
        styles: { branding: { brandColor: calBrandColor } },
      });
    }

    void Promise.all([configureNamespace("15m"), configureNamespace("30m")]);
    return () => {
      cancelled = true;
    };
  }, [calBrandColor, calTheme]);

  // Build blog terminal entries from posts
  const allFiles = useMemo(() => {
    const files = { ...terminalFiles };
    for (const post of posts) {
      files[`blog/${post.slug}.md`] = `# ${post.title}\n\n*${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*\n\n${post.description || post.content.slice(0, 400)}\n\nRead full post: /blog/${post.slug}`;
    }
    return files;
  }, [terminalFiles, posts]);

  const allUrls = useMemo(() => {
    const urls = { ...terminalUrls };
    for (const post of posts) {
      urls[`blog/${post.slug}.md`] = `/blog/${post.slug}`;
    }
    return urls;
  }, [terminalUrls, posts]);

  const handleThemeChange = useCallback((themeName: string) => {
    setThemeMode(themeName);
  }, [setThemeMode]);

  const handleClick = useCallback((e: React.MouseEvent, type: string, id: string, url?: string) => {
    // Cmd-click (or Ctrl-click on non-Mac) opens the URL in a new tab
    if ((e.metaKey || e.ctrlKey) && url) {
      window.open(url, "_blank");
      return;
    }

    const key = `${type}-${id}`;
    if (activeId === key) { setActiveId(null); return; }
    setActiveId(key);

    let command: string | null = null;
    let content: string | null = null;

    if (type === "work") {
      const item = currentWork.find((w) => w.company === id);
      if (item) {
        command = `cat ${item.slug}.md`;
        content = allFiles[`${item.slug}.md`] ?? null;
      }
    } else if (type === "hackathon") {
      const item = hackathons.find((h) => h.name === id);
      if (item) {
        command = `cat projects/${item.slug}.md`;
        content = allFiles[`projects/${item.slug}.md`] ?? null;
      }
    } else if (type === "post") {
      const post = posts.find((p) => p.slug === id);
      if (post) {
        command = `cat blog/${post.slug}.md`;
        content = allFiles[`blog/${post.slug}.md`] ?? null;
      }
    }

    if (command && content) {
      setActiveFile({ command, content });
      if (!terminalOpen) setTerminalOpen(true);
    }
  }, [activeId, currentWork, hackathons, posts, allFiles, terminalOpen]);

  const toggleMobile = useCallback((key: string) => {
    setMobileExpanded((prev) => (prev === key ? null : key));
  }, []);

  const mobileMdStyles: MdStyles = useMemo(() => ({
    headingColor: theme.text,
    textColor: theme.text,
    dimColor: theme.textDim,
    isDark: theme.isDark,
  }), [theme]);

  const cardStyle = ghostCardStyle(theme);
  const calPath15 = useMemo(() => withCalDuration(toCalPath(calLink15), 15), [calLink15]);
  const calPath30 = useMemo(() => withCalDuration(toCalPath(calLink30), 30), [calLink30]);

  /* ── Fluent-style glossy hover (event delegation) ── */
  const mainRef = useRef<HTMLElement>(null);

  const handleGlossMove = useCallback((e: React.MouseEvent) => {
    const card = (e.target as HTMLElement).closest(".ghost-card") as HTMLElement | null;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--gx", `${e.clientX - rect.left}px`);
    card.style.setProperty("--gy", `${e.clientY - rect.top}px`);
    card.style.setProperty("--gloss-opacity", "1");
  }, []);

  const handleGlossLeave = useCallback((e: React.MouseEvent) => {
    const card = (e.target as HTMLElement).closest(".ghost-card") as HTMLElement | null;
    if (!card) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (related && card.contains(related)) return;
    card.style.setProperty("--gloss-opacity", "0");
  }, []);

  return (
    <main
      ref={mainRef}
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
      onMouseMove={handleGlossMove}
      onMouseOut={handleGlossLeave}
    >
      <style>{`
        .ghost-card:hover { background-color: var(--hover-bg); border-color: var(--hover-border); box-shadow: var(--hover-shadow); }
        .ghost-card:active { box-shadow: var(--active-shadow); }
        .ghost-card { position: relative; overflow: hidden; }
        .ghost-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            220px 150px ellipse at var(--gx, -300px) var(--gy, -300px),
            var(--gloss-color, rgba(255,255,255,0.06)) 0%,
            transparent 100%
          );
          opacity: var(--gloss-opacity, 0);
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* Content column — centered on small screens, left-aligned when terminal visible on lg */}
      <div
        className={`px-8 py-16 sm:py-24 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          terminalOpen && !terminalFullscreen ? "lg:max-w-[50vw]" : ""
        }`}
        style={{
          opacity: terminalFullscreen ? 0 : 1,
          pointerEvents: terminalFullscreen ? "none" : "auto",
        }}
      >
        <div className="max-w-[480px] mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
          {/* Header */}
          <header>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>{name}</h1>
                <p className="text-sm mt-1.5" style={{ color: theme.textDim }}>{tagline}</p>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {socialLinks.filter((l) => socialIcons[l.label]).map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-5 h-5 transition-colors hover:opacity-80" style={{ color: theme.textMuted }} aria-label={link.label} title={link.label}>
                    {socialIcons[link.label]}
                  </a>
                ))}
              </div>
            </div>
            <p className="text-[15px] mt-6 leading-relaxed" style={{ color: theme.textDim }}>{bio}</p>

            {/* Call buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                data-cal-namespace="15m"
                data-cal-link={calPath15}
                data-cal-config={JSON.stringify({ layout: "week_view", useSlotsViewOnSmallScreen: true, duration: 15 })}
                className={`${callCardClass} ghost-card flex items-center gap-3 py-3`}
                style={cardStyle}
              >
                <svg className="w-4 h-4 shrink-0" style={{ color: theme.textMuted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                <div>
                  <span className="font-medium text-[14px]" style={{ color: theme.text }}>Quick call</span>
                  <span className="text-xs block" style={{ color: theme.textMuted }}>15 min</span>
                </div>
              </button>
              <button
                type="button"
                data-cal-namespace="30m"
                data-cal-link={calPath30}
                data-cal-config={JSON.stringify({ layout: "week_view", useSlotsViewOnSmallScreen: true, duration: 30 })}
                className={`${callCardClass} ghost-card flex items-center gap-3 py-3`}
                style={cardStyle}
              >
                <svg className="w-4 h-4 shrink-0" style={{ color: theme.textMuted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <div>
                  <span className="font-medium text-[14px]" style={{ color: theme.text }}>Deep dive</span>
                  <span className="text-xs block" style={{ color: theme.textMuted }}>30 min</span>
                </div>
              </button>
            </div>

            {/* Terminal link — desktop: collapses when terminal open */}
            <div className={`hidden lg:grid transition-all duration-300 ${terminalOpen ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
              <div className="overflow-hidden">
                <button
                  onClick={() => setTerminalOpen(true)}
                  className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 border border-transparent ghost-card"
                  style={{ ...cardStyle, color: theme.text }}
                >
                  <TerminalIcon />
                  Access bash terminal
                </button>
              </div>
            </div>

            {/* Terminal link — mobile: show/hide immediately, no animation */}
            {!terminalOpen && (
              <button
                onClick={() => setTerminalOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer border border-transparent ghost-card"
                style={{ ...cardStyle, color: theme.text }}
              >
                <TerminalIcon />
                Access bash terminal
              </button>
            )}
          </header>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          {/* Currently */}
          <Section title="Currently" theme={theme}>
            {currentWork.map((item) => {
              const key = `work-${item.company}`;
              const isMobileOpen = mobileExpanded === key;
              return (
                <div key={item.company}>
                  <button onClick={(e) => handleClick(e, "work", item.company, item.url)} className={`hidden lg:flex ${cardClass} ghost-card items-start justify-between gap-4`} style={cardStyle}>
                    <div className="min-w-0">
                      <span className="font-medium text-[15px]" style={{ color: theme.text }}>{item.company}</span>
                      <p className="text-sm mt-0.5" style={{ color: theme.textDim }}>{item.description}</p>
                    </div>
                    <span className="text-xs shrink-0 mt-1" style={{ color: theme.textMuted }}>{item.role}</span>
                  </button>
                  <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClass} ghost-card items-start justify-between gap-4`} style={cardStyle}>
                    <div className="min-w-0">
                      <span className="font-medium text-[15px]" style={{ color: theme.text }}>{item.company}</span>
                      <p className="text-sm mt-0.5" style={{ color: theme.textDim }}>{item.description}</p>
                    </div>
                    <span className="text-xs shrink-0 mt-1" style={{ color: theme.textMuted }}>{item.role}</span>
                  </button>
                  <MobileDetail open={isMobileOpen} theme={theme}>
                    <div className="text-sm leading-relaxed">{renderMarkdown(item.detail, mobileMdStyles)}</div>
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Visit &rarr;</a>}
                  </MobileDetail>
                </div>
              );
            })}
          </Section>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          {/* Hackathons */}
          <Section title="Hackathons" theme={theme}>
            {hackathons.map((win) => {
              const key = `hackathon-${win.name}`;
              const isMobileOpen = mobileExpanded === key;
              return (
                <div key={win.name}>
                  <button onClick={(e) => handleClick(e, "hackathon", win.name, win.url)} className={`hidden lg:flex ${cardClass} ghost-card items-start justify-between gap-4`} style={cardStyle}>
                    <div className="min-w-0">
                      <span className="font-medium text-[15px]" style={{ color: theme.text }}>{win.project}</span>
                      <p className="text-sm mt-0.5" style={{ color: theme.textDim }}>{win.name}</p>
                    </div>
                    <span className="text-xs shrink-0 mt-1" style={{ color: theme.textMuted }}>{win.prize}</span>
                  </button>
                  <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClass} ghost-card items-start justify-between gap-4`} style={cardStyle}>
                    <div className="min-w-0">
                      <span className="font-medium text-[15px]" style={{ color: theme.text }}>{win.project}</span>
                      <p className="text-sm mt-0.5" style={{ color: theme.textDim }}>{win.name}</p>
                    </div>
                    <span className="text-xs shrink-0 mt-1" style={{ color: theme.textMuted }}>{win.prize}</span>
                  </button>
                  <MobileDetail open={isMobileOpen} theme={theme}>
                    <div className="text-sm leading-relaxed">{renderMarkdown(win.detail, mobileMdStyles)}</div>
                    <a href={win.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">View on Devpost &rarr;</a>
                  </MobileDetail>
                </div>
              );
            })}
          </Section>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          {/* Writing */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Writing</h2>
              <a href="/blog" className="text-xs transition-colors hover:opacity-70" style={{ color: theme.textMuted }}>View all &rarr;</a>
            </div>
            {posts.length > 0 ? (
              <div>
                {posts.map((post) => {
                  const key = `post-${post.slug}`;
                  const isMobileOpen = mobileExpanded === key;
                  return (
                    <div key={post.slug}>
                      <button onClick={(e) => handleClick(e, "post", post.slug, `/blog/${post.slug}`)} className={`hidden lg:flex ${cardClass} ghost-card items-baseline justify-between gap-4`} style={cardStyle}>
                        <span className="text-[15px] font-medium" style={{ color: theme.text }}>{post.title}</span>
                        <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.textMuted }}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClass} ghost-card items-baseline justify-between gap-4`} style={cardStyle}>
                        <span className="text-[15px] font-medium" style={{ color: theme.text }}>{post.title}</span>
                        <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.textMuted }}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <MobileDetail open={isMobileOpen} theme={theme}>
                        <p className="text-sm leading-relaxed" style={{ color: theme.textDim }}>{post.description || post.content.slice(0, 200)}</p>
                        <a href={`/blog/${post.slug}`} className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Read more &rarr;</a>
                      </MobileDetail>
                    </div>
                  );
                })}
              </div>
            ) : (<p className="text-sm" style={{ color: theme.textMuted }}>Coming soon.</p>)}
          </section>

          <footer className="mt-12 pt-6 border-t" style={{ borderColor: theme.border }}>
            <p className="text-xs" style={{ color: theme.textMuted }}>&copy; 2026 Gabriel Keller</p>
          </footer>
        </div>
      </div>

      {/* Single terminal instance — wrapper switches between desktop/mobile layout */}
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
            onClose={() => { setTerminalFullscreen(false); setTerminalOpen(false); }}
            onMinimize={() => { setTerminalFullscreen(false); setTerminalOpen(false); }}
            onExpand={() => setTerminalFullscreen(!terminalFullscreen)}
            onThemeChange={handleThemeChange}
          />
        </div>
      ) : terminalOpen ? (
        <div className="fixed left-0 w-full z-50 overflow-hidden" style={{ backgroundColor: theme.termBg, top: 0, height: mobileVh ? `${mobileVh}px` : '100dvh', transform: mobileVOffset ? `translateY(${mobileVOffset}px)` : undefined }}>
          <Terminal
            activeFile={activeFile}
            staticFiles={allFiles}
            initialFiles={{}}
            initialUrls={allUrls}
            theme={theme}
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

/* ── Reusable sub-components ── */
function Section({ title, theme, children }: { title: string; theme: Theme; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function MobileDetail({ open, theme, children }: { open: boolean; theme: Theme; children: React.ReactNode }) {
  return (
    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
      <div className="pb-3 pt-1">{children}</div>
    </div>
  );
}
