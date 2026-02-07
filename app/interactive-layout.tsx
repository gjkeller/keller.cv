"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { WorkItem, HackathonWin, Partner, SiteData } from "@/lib/data";
import type { Theme } from "@/lib/themes";
import { THEMES, THEME_NAMES, resolveAutoTheme } from "@/lib/themes";
import { GithubIcon, LinkedinIcon, XIcon, DevpostIcon } from "./icons";
import { Terminal } from "./terminal";

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
  acmSales: { detail: string; partners: Partner[] };
}

/* ── Build terminal file content from data ── */
function buildWorkContent(item: WorkItem, acmSales?: Props["acmSales"]): string {
  const heading = item.image ? `# ${item.company} ![${item.company}](${item.image})` : `# ${item.company}`;
  let content = `${heading}\n\n**${item.role}**\n${item.url}\n\n${item.detail}`;
  if (item.company === "Texas ACM" && acmSales) {
    const logos = acmSales.partners.map((p) => p.logo).join(",");
    content += `\n\nCompanies I've sold to\n\n${acmSales.detail}\n\n{{logos:${logos}}}`;
  }
  return content;
}

function buildHackathonContent(item: HackathonWin): string {
  const heading = item.image ? `# ${item.project} ![${item.project}](${item.image})` : `# ${item.project}`;
  return `${heading}\n\n**${item.name}** · ${item.prize}\n${item.url}\n\n${item.detail}`;
}

function getTerminalFile(
  type: string,
  id: string,
  currentWork: WorkItem[],
  hackathons: HackathonWin[],
  posts: Props["posts"],
  acmSales?: Props["acmSales"],
): { command: string; content: string } | null {
  if (type === "work") {
    const item = currentWork.find((w) => w.company === id);
    if (!item) return null;
    const slug = item.company.toLowerCase().replace(/\s+/g, "-");
    return { command: `cat ${slug}.md`, content: buildWorkContent(item, acmSales) };
  }
  if (type === "hackathon") {
    const item = hackathons.find((h) => h.name === id);
    if (!item) return null;
    const slug = item.project.toLowerCase().replace(/\s+/g, "-");
    return { command: `cat projects/${slug}.md`, content: buildHackathonContent(item) };
  }
  if (type === "post") {
    const post = posts.find((p) => p.slug === id);
    if (!post) return null;
    return { command: `cat blog/${post.slug}.md`, content: `# ${post.title}\n\n*${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*\n\n${post.description || post.content.slice(0, 400)}` };
  }
  return null;
}

function buildInitialFiles(currentWork: WorkItem[], hackathons: HackathonWin[], posts: Props["posts"], acmSales?: Props["acmSales"]) {
  const files: Record<string, string> = {};
  const urls: Record<string, string> = {};
  for (const item of currentWork) {
    const slug = item.company.toLowerCase().replace(/\s+/g, "-");
    files[`${slug}.md`] = buildWorkContent(item, acmSales);
    if (item.url) urls[`${slug}.md`] = item.url;
  }
  for (const win of hackathons) {
    const slug = win.project.toLowerCase().replace(/\s+/g, "-");
    files[`projects/${slug}.md`] = buildHackathonContent(win);
    if (win.url) urls[`projects/${slug}.md`] = win.url;
  }
  for (const post of posts) {
    files[`blog/${post.slug}.md`] = `# ${post.title}\n\n*${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*\n\n${post.description || post.content.slice(0, 400)}`;
    urls[`blog/${post.slug}.md`] = `/blog/${post.slug}`;
  }
  return { files, urls };
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
  };
}
const cardClass = "w-[calc(100%+1.5rem)] text-left -mx-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent";

/* ── Main layout ── */
export function InteractiveLayout({
  socialLinks, calLink15, calLink30, name, tagline, bio,
  currentWork, hackathons, posts, terminalFiles, acmSales,
}: Props) {
  const [activeFile, setActiveFile] = useState<{ command: string; content: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalFullscreen, setTerminalFullscreen] = useState(false);
  const [themeMode, setThemeMode] = useState<string>("auto");
  const [systemDark, setSystemDark] = useState(false);

  // Detect system color scheme
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Resolve actual theme from mode
  const theme: Theme = useMemo(() => {
    if (themeMode === "auto") return resolveAutoTheme(systemDark);
    return THEMES.find((t) => t.name === themeMode) || THEMES[0];
  }, [themeMode, systemDark]);

  const initialFiles = useMemo(() => buildInitialFiles(currentWork, hackathons, posts, acmSales), [currentWork, hackathons, posts, acmSales]);

  const handleThemeChange = useCallback((themeName: string) => {
    if (themeName === "auto" || THEME_NAMES.includes(themeName)) {
      setThemeMode(themeName);
    }
  }, []);

  const handleClick = useCallback((type: string, id: string) => {
    const key = `${type}-${id}`;
    if (activeId === key) { setActiveId(null); return; }
    setActiveId(key);
    const file = getTerminalFile(type, id, currentWork, hackathons, posts, acmSales);
    if (file) { setActiveFile(file); if (!terminalOpen) setTerminalOpen(true); }
  }, [activeId, currentWork, hackathons, posts, terminalOpen]);

  const toggleMobile = useCallback((key: string) => {
    setMobileExpanded((prev) => (prev === key ? null : key));
  }, []);

  const cardStyle = ghostCardStyle(theme);

  return (
    <main className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.bg }}>
      <style>{`
        .ghost-card:hover { background-color: var(--hover-bg); border-color: var(--hover-border); box-shadow: var(--hover-shadow); }
        .ghost-card:active { box-shadow: var(--active-shadow); }
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
                {!terminalOpen && (
                  <button onClick={() => setTerminalOpen(true)} className="flex items-center justify-center w-5 h-5 transition-colors hover:opacity-80" style={{ color: theme.textMuted }} title="Open terminal">
                    <TerminalIcon />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[15px] mt-6 leading-relaxed" style={{ color: theme.textDim }}>{bio}</p>

            {/* Call buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <a href={calLink15} target="_blank" rel="noopener noreferrer" className={`${cardClass} ghost-card flex items-center gap-3 py-3`} style={cardStyle}>
                <svg className="w-4 h-4 shrink-0" style={{ color: theme.textMuted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                <div>
                  <span className="font-medium text-[14px]" style={{ color: theme.text }}>Quick call</span>
                  <span className="text-xs block" style={{ color: theme.textMuted }}>15 min</span>
                </div>
              </a>
              <a href={calLink30} target="_blank" rel="noopener noreferrer" className={`${cardClass} ghost-card flex items-center gap-3 py-3`} style={cardStyle}>
                <svg className="w-4 h-4 shrink-0" style={{ color: theme.textMuted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <div>
                  <span className="font-medium text-[14px]" style={{ color: theme.text }}>Deep dive</span>
                  <span className="text-xs block" style={{ color: theme.textMuted }}>30 min</span>
                </div>
              </a>
            </div>
          </header>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          {/* Currently */}
          <Section title="Currently" theme={theme}>
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
                  <MobileDetail open={isMobileOpen} theme={theme}>
                    <p className="text-sm leading-relaxed" style={{ color: theme.textDim }}>{item.detail}</p>
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
                  <MobileDetail open={isMobileOpen} theme={theme}>
                    <p className="text-sm leading-relaxed" style={{ color: theme.textDim }}>{win.detail}</p>
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
                      <button onClick={() => handleClick("post", post.slug)} className={`hidden lg:flex ${cardClass} ghost-card items-baseline justify-between gap-4`} style={cardStyle}>
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

      {/* Terminal */}
      <div className={`hidden lg:block fixed transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        !terminalOpen
          ? "opacity-0 scale-95 pointer-events-none left-1/2 top-1/2 -translate-y-1/2 ml-4 w-[calc(50vw-5rem)] h-[80vh]"
          : terminalFullscreen
            ? "opacity-100 scale-100 z-50 top-10 left-10 right-10 bottom-10 w-auto h-auto ml-0 translate-y-0"
            : "opacity-100 scale-100 left-1/2 top-1/2 -translate-y-1/2 ml-4 w-[calc(50vw-5rem)] h-[80vh]"
      }`}>
        <Terminal
          activeFile={activeFile}
          staticFiles={terminalFiles}
          initialFiles={initialFiles.files}
          initialUrls={initialFiles.urls}
          theme={theme}
          onClose={() => { setTerminalFullscreen(false); setTerminalOpen(false); }}
          onMinimize={() => { setTerminalFullscreen(false); setTerminalOpen(false); }}
          onExpand={() => setTerminalFullscreen(!terminalFullscreen)}
          onThemeChange={handleThemeChange}
        />
      </div>
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
      <div className="px-3 pb-3 pt-1">{children}</div>
    </div>
  );
}
