"use client";

import { useState, useCallback, useMemo } from "react";
import type { WorkItem, HackathonWin } from "@/lib/data";
import { GithubIcon, LinkedinIcon, XIcon, DevpostIcon, CalendarIcon } from "./icons";
import { Terminal, THEME_NAMES } from "./terminal";

const socialIcons: Record<string, React.ReactNode> = {
  GitHub: <GithubIcon />, LinkedIn: <LinkedinIcon />, X: <XIcon />, Devpost: <DevpostIcon />,
};

interface Props {
  socialLinks: { label: string; url: string }[];
  calLink: string;
  name: string;
  tagline: string;
  bio: string;
  currentWork: WorkItem[];
  hackathons: HackathonWin[];
  posts: { slug: string; title: string; date: string; description?: string; content: string }[];
}

/* ── Theme presets ── */
export interface Theme {
  name: string;
  bg: string;
  text: string;
  textDim: string;
  textMuted: string;
  border: string;
  cardHoverBg: string;
  cardHoverBorder: string;
  cardShadow: string;
  cardActiveShadow: string;
  termBg: string;
  termBarBg: string;
  termBarBorder: string;
  termText: string;
  termDim: string;
  isDark: boolean;
}

export const THEMES: Theme[] = [
  {
    name: "light",
    bg: "#FAFAFA", text: "#111827", textDim: "#6B7280", textMuted: "#9CA3AF",
    border: "#E5E7EB", cardHoverBg: "#EEEEF0", cardHoverBorder: "rgba(209,213,219,0.6)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.08), inset -1px -1px 3px rgba(255,255,255,0.7)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.6)",
    termBg: "#FAFAFA", termBarBg: "#F0F0F0", termBarBorder: "#E5E7EB",
    termText: "#1F2937", termDim: "#6B7280", isDark: false,
  },
  {
    name: "dark-blue",
    bg: "#0F172A", text: "#E2E8F0", textDim: "#94A3B8", textMuted: "#64748B",
    border: "#1E293B", cardHoverBg: "#1E293B", cardHoverBorder: "rgba(51,65,85,0.6)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.3), inset -1px -1px 3px rgba(255,255,255,0.03)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.02)",
    termBg: "#0F172A", termBarBg: "#1E293B", termBarBorder: "#334155",
    termText: "#E2E8F0", termDim: "#94A3B8", isDark: true,
  },
  {
    name: "dark-gray",
    bg: "#18181B", text: "#F4F4F5", textDim: "#A1A1AA", textMuted: "#71717A",
    border: "#27272A", cardHoverBg: "#27272A", cardHoverBorder: "rgba(63,63,70,0.6)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.3), inset -1px -1px 3px rgba(255,255,255,0.03)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.02)",
    termBg: "#18181B", termBarBg: "#27272A", termBarBorder: "#3F3F46",
    termText: "#F4F4F5", termDim: "#A1A1AA", isDark: true,
  },
  {
    name: "warm",
    bg: "#F5F0EB", text: "#1C1917", textDim: "#78716C", textMuted: "#A8A29E",
    border: "#E7E5E4", cardHoverBg: "#EDE8E3", cardHoverBorder: "rgba(214,211,209,0.6)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.06), inset -1px -1px 3px rgba(255,255,255,0.7)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.08), inset -1px -1px 3px rgba(255,255,255,0.6)",
    termBg: "#FAF8F5", termBarBg: "#F0EDE8", termBarBorder: "#E7E5E4",
    termText: "#1C1917", termDim: "#78716C", isDark: false,
  },
  {
    name: "midnight",
    bg: "#020617", text: "#CBD5E1", textDim: "#64748B", textMuted: "#475569",
    border: "#0F172A", cardHoverBg: "#0F172A", cardHoverBorder: "rgba(30,41,59,0.8)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.02)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.6), inset -1px -1px 3px rgba(255,255,255,0.01)",
    termBg: "#020617", termBarBg: "#0F172A", termBarBorder: "#1E293B",
    termText: "#CBD5E1", termDim: "#64748B", isDark: true,
  },
];

function getTerminalFile(type: string, id: string, currentWork: WorkItem[], hackathons: HackathonWin[], posts: Props["posts"]): { command: string; content: string } | null {
  if (type === "work") {
    const item = currentWork.find((w) => w.company === id);
    if (!item) return null;
    const slug = item.company.toLowerCase().replace(/\s+/g, "-");
    return { command: `cat ${slug}.md`, content: `# ${item.company}\n\n**${item.role}**\n${item.url}\n\n${item.detail}` };
  }
  if (type === "hackathon") {
    const item = hackathons.find((h) => h.name === id);
    if (!item) return null;
    const slug = item.project.toLowerCase().replace(/\s+/g, "-");
    return { command: `cat projects/${slug}.md`, content: `# ${item.project}\n\n**${item.name}** · ${item.prize}\n${item.url}\n\n${item.detail}` };
  }
  if (type === "post") {
    const post = posts.find((p) => p.slug === id);
    if (!post) return null;
    return { command: `cat blog/${post.slug}.md`, content: `# ${post.title}\n\n*${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*\n\n${post.description || post.content.slice(0, 400)}` };
  }
  return null;
}

function buildInitialFiles(currentWork: WorkItem[], hackathons: HackathonWin[], posts: Props["posts"]) {
  const files: Record<string, string> = {};
  const urls: Record<string, string> = {};
  for (const item of currentWork) {
    const slug = item.company.toLowerCase().replace(/\s+/g, "-");
    files[`${slug}.md`] = `# ${item.company}\n\n**${item.role}**\n${item.url}\n\n${item.detail}`;
    if (item.url) urls[`${slug}.md`] = item.url;
  }
  for (const win of hackathons) {
    const slug = win.project.toLowerCase().replace(/\s+/g, "-");
    files[`projects/${slug}.md`] = `# ${win.project}\n\n**${win.name}** · ${win.prize}\n${win.url}\n\n${win.detail}`;
    if (win.url) urls[`projects/${slug}.md`] = win.url;
  }
  for (const post of posts) {
    files[`blog/${post.slug}.md`] = `# ${post.title}\n\n*${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*\n\n${post.description || post.content.slice(0, 400)}`;
    urls[`blog/${post.slug}.md`] = `/blog/${post.slug}`;
  }
  return { files, urls };
}

function TerminalIcon() {
  return (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>);
}

export function InteractiveLayout({
  socialLinks, calLink, name, tagline, bio, currentWork, hackathons, posts,
}: Props) {
  const [activeFile, setActiveFile] = useState<{ command: string; content: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [themeIdx, setThemeIdx] = useState(0);

  const theme = THEMES[themeIdx];
  const initialFiles = useMemo(() => buildInitialFiles(currentWork, hackathons, posts), [currentWork, hackathons, posts]);

  const handleThemeChange = useCallback((themeName: string) => {
    const idx = THEMES.findIndex((t) => t.name === themeName);
    if (idx !== -1) setThemeIdx(idx);
  }, []);

  const handleClick = useCallback((type: string, id: string) => {
    const key = `${type}-${id}`;
    if (activeId === key) { setActiveId(null); return; }
    setActiveId(key);
    const file = getTerminalFile(type, id, currentWork, hackathons, posts);
    if (file) { setActiveFile(file); if (!terminalOpen) setTerminalOpen(true); }
  }, [activeId, currentWork, hackathons, posts, terminalOpen]);

  const toggleMobile = useCallback((key: string) => {
    setMobileExpanded((prev) => (prev === key ? null : key));
  }, []);

  const cardClass = `w-full text-left -mx-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent`;
  const cardStyle = {
    ["--hover-bg" as string]: theme.cardHoverBg,
    ["--hover-border" as string]: theme.cardHoverBorder,
    ["--hover-shadow" as string]: theme.cardShadow,
    ["--active-shadow" as string]: theme.cardActiveShadow,
  };

  return (
    <main className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.bg }}>
      <style>{`
        .ghost-card:hover { background-color: var(--hover-bg); border-color: var(--hover-border); box-shadow: var(--hover-shadow); }
        .ghost-card:active { box-shadow: var(--active-shadow); }
      `}</style>

      {/* Content column — animates between centered and left-aligned */}
      <div
        className="px-8 py-16 sm:py-24 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ maxWidth: terminalOpen ? "50vw" : "100vw" }}
      >
        <div className="max-w-[480px] mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
          <header>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>{name}</h1>
                <p className="text-sm mt-1.5" style={{ color: theme.textDim }}>{tagline}</p>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {socialLinks.filter((l) => socialIcons[l.label]).map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-5 h-5 transition-colors hover:opacity-80" style={{ color: theme.textMuted }} aria-label={link.label}>
                    {socialIcons[link.label]}
                  </a>
                ))}
              </div>
            </div>
            <p className="text-[15px] mt-6 leading-relaxed" style={{ color: theme.textDim }}>{bio}</p>
          </header>

          {/* Open terminal button — shows above first hr when terminal is closed */}
          {!terminalOpen && (
            <button onClick={() => setTerminalOpen(true)} className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-500 mt-6" style={{ color: theme.text }}>
              <TerminalIcon />Open terminal &rarr;
            </button>
          )}

          <hr className="my-8" style={{ borderColor: theme.border }} />

          {/* Currently */}
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Currently</h2>
            <div>
              {currentWork.map((item) => {
                const key = `work-${item.company}`;
                const isMobileOpen = mobileExpanded === key;
                return (
                  <div key={item.company}>
                    <button onClick={() => handleClick("work", item.company)} className={`hidden lg:flex ${cardClass} ghost-card items-start justify-between gap-4`} style={cardStyle}>
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
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="px-3 pb-3 pt-1">
                        <p className="text-sm leading-relaxed" style={{ color: theme.textDim }}>{item.detail}</p>
                        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Visit &rarr;</a>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Hackathons</h2>
            <div>
              {hackathons.map((win) => {
                const key = `hackathon-${win.name}`;
                const isMobileOpen = mobileExpanded === key;
                return (
                  <div key={win.name}>
                    <button onClick={() => handleClick("hackathon", win.name)} className={`hidden lg:flex ${cardClass} ghost-card items-start justify-between gap-4`} style={cardStyle}>
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
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="px-3 pb-3 pt-1">
                        <p className="text-sm leading-relaxed" style={{ color: theme.textDim }}>{win.detail}</p>
                        <a href={win.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">View on Devpost &rarr;</a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="my-8" style={{ borderColor: theme.border }} />

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
                      <button onClick={() => handleClick("post", post.slug)} className={`hidden lg:flex ${cardClass} ghost-card items-baseline justify-between gap-4`} style={cardStyle}>
                        <span className="text-[15px] font-medium" style={{ color: theme.text }}>{post.title}</span>
                        <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.textMuted }}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClass} ghost-card items-baseline justify-between gap-4`} style={cardStyle}>
                        <span className="text-[15px] font-medium" style={{ color: theme.text }}>{post.title}</span>
                        <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.textMuted }}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="px-3 pb-3 pt-1">
                          <p className="text-sm leading-relaxed" style={{ color: theme.textDim }}>{post.description || post.content.slice(0, 200)}</p>
                          <a href={`/blog/${post.slug}`} className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Read more &rarr;</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (<p className="text-sm" style={{ color: theme.textMuted }}>Coming soon.</p>)}
          </section>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          <section>
            <p className="text-[15px]" style={{ color: theme.textDim }}>Always happy to grab a coffee or jump on a quick call.</p>
            <a href={calLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-500 mt-4" style={{ color: theme.text }}>
              <CalendarIcon />Grab a coffee &rarr;
            </a>
          </section>

          <footer className="mt-12 pt-6 border-t" style={{ borderColor: theme.border }}>
            <p className="text-xs" style={{ color: theme.textMuted }}>&copy; 2026 Gabriel Keller</p>
          </footer>
        </div>
      </div>

      {/* Terminal */}
      <div className={`hidden lg:block fixed left-1/2 top-1/2 -translate-y-1/2 ml-4 w-[calc(50vw-5rem)] h-[80vh] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        terminalOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`}>
        <Terminal
          activeFile={activeFile}
          initialFiles={initialFiles.files}
          initialUrls={initialFiles.urls}
          theme={theme}
          onClose={() => setTerminalOpen(false)}
          onMinimize={() => setTerminalOpen(false)}
          onThemeChange={handleThemeChange}
        />
      </div>
    </main>
  );
}
