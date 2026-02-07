"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { WorkItem, HackathonWin } from "@/lib/data";
import { GithubIcon, LinkedinIcon, XIcon, DevpostIcon, CalendarIcon } from "./icons";
import { Terminal } from "./terminal";

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

function getTerminalFile(
  type: string,
  id: string,
  currentWork: WorkItem[],
  hackathons: HackathonWin[],
  posts: Props["posts"],
): { command: string; content: string } | null {
  if (type === "work") {
    const item = currentWork.find((w) => w.company === id);
    if (!item) return null;
    const slug = item.company.toLowerCase().replace(/\s+/g, "-");
    return {
      command: `cat ${slug}.md`,
      content: `# ${item.company}\n\n**${item.role}**\n${item.url}\n\n${item.detail}`,
    };
  }
  if (type === "hackathon") {
    const item = hackathons.find((h) => h.name === id);
    if (!item) return null;
    const slug = item.project.toLowerCase().replace(/\s+/g, "-");
    return {
      command: `cat projects/${slug}.md`,
      content: `# ${item.project}\n\n**${item.name}** · ${item.prize}\n${item.url}\n\n${item.detail}`,
    };
  }
  if (type === "post") {
    const post = posts.find((p) => p.slug === id);
    if (!post) return null;
    return {
      command: `cat blog/${post.slug}.md`,
      content: `# ${post.title}\n\n*${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*\n\n${post.description || post.content.slice(0, 400)}`,
    };
  }
  return null;
}

/* Build all files upfront so ls works immediately */
function buildInitialFiles(
  currentWork: WorkItem[],
  hackathons: HackathonWin[],
  posts: Props["posts"],
): { files: Record<string, string>; urls: Record<string, string> } {
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

/* G2: Pressed Inset */
function cardClasses(dark: boolean) {
  if (dark) {
    return "w-full text-left -mx-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent hover:bg-gray-800 hover:border-gray-700/60 hover:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.03)]";
  }
  return "w-full text-left -mx-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent hover:bg-[#EEEEF0] hover:border-gray-200/60 hover:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.08),inset_-1px_-1px_3px_rgba(255,255,255,0.7)] active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]";
}

function TerminalIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function InteractiveLayout({
  socialLinks, calLink, name, tagline, bio, currentWork, hackathons, posts,
}: Props) {
  const [activeFile, setActiveFile] = useState<{ command: string; content: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [terminalState, setTerminalState] = useState<"open" | "minimized" | "closed">("open");
  const [dark, setDark] = useState(false);

  const initialFiles = useMemo(() => buildInitialFiles(currentWork, hackathons, posts), [currentWork, hackathons, posts]);

  // Apply dark mode to html
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleClick = useCallback((type: string, id: string) => {
    const key = `${type}-${id}`;
    if (activeId === key) {
      setActiveId(null);
      return;
    }
    setActiveId(key);
    const file = getTerminalFile(type, id, currentWork, hackathons, posts);
    if (file) {
      setActiveFile(file);
      if (terminalState !== "open") setTerminalState("open");
    }
  }, [activeId, currentWork, hackathons, posts, terminalState]);

  const toggleMobile = useCallback((key: string) => {
    setMobileExpanded((prev) => (prev === key ? null : key));
  }, []);

  const card = cardClasses(dark);

  return (
    <main className={`min-h-screen transition-colors duration-300 ${dark ? "bg-gray-900" : "bg-[#FAFAFA]"}`}>
      <div className="px-8 py-16 sm:py-24 lg:max-w-[50vw]">
        <div className="max-w-[480px] mx-auto lg:mx-auto">
          {/* Header */}
          <header>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className={`text-2xl font-semibold ${dark ? "text-gray-100" : "text-gray-900"}`}>{name}</h1>
                <p className={`text-sm mt-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>{tagline}</p>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {socialLinks.filter((l) => socialIcons[l.label]).map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center w-5 h-5 transition-colors ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`} aria-label={link.label}>
                    {socialIcons[link.label]}
                  </a>
                ))}
                <button onClick={() => setDark(!dark)} className={`flex items-center justify-center w-5 h-5 transition-colors ml-1 ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`} aria-label="Toggle theme">
                  {dark ? <SunIcon /> : <MoonIcon />}
                </button>
              </div>
            </div>
            <p className={`text-[15px] mt-6 leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>{bio}</p>
          </header>

          <hr className={`my-8 ${dark ? "border-gray-800" : "border-gray-200"}`} />

          {/* Currently */}
          <section>
            <h2 className={`text-xs font-medium uppercase tracking-wider mb-2 ${dark ? "text-gray-500" : "text-gray-400"}`}>Currently</h2>
            <div>
              {currentWork.map((item) => {
                const key = `work-${item.company}`;
                const isMobileOpen = mobileExpanded === key;
                return (
                  <div key={item.company}>
                    <button onClick={() => handleClick("work", item.company)} className={`hidden lg:flex ${card} items-start justify-between gap-4`}>
                      <div className="min-w-0">
                        <span className={`font-medium text-[15px] ${dark ? "text-gray-100" : "text-gray-900"}`}>{item.company}</span>
                        <p className={`text-sm mt-0.5 ${dark ? "text-gray-500" : "text-gray-500"}`}>{item.description}</p>
                      </div>
                      <span className={`text-xs shrink-0 mt-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>{item.role}</span>
                    </button>
                    <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${card} items-start justify-between gap-4`}>
                      <div className="min-w-0">
                        <span className={`font-medium text-[15px] ${dark ? "text-gray-100" : "text-gray-900"}`}>{item.company}</span>
                        <p className={`text-sm mt-0.5 ${dark ? "text-gray-500" : "text-gray-500"}`}>{item.description}</p>
                      </div>
                      <span className={`text-xs shrink-0 mt-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>{item.role}</span>
                    </button>
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="px-3 pb-3 pt-1">
                        <p className={`text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>{item.detail}</p>
                        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Visit &rarr;</a>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className={`my-8 ${dark ? "border-gray-800" : "border-gray-200"}`} />

          {/* Hackathons */}
          <section>
            <h2 className={`text-xs font-medium uppercase tracking-wider mb-2 ${dark ? "text-gray-500" : "text-gray-400"}`}>Hackathons</h2>
            <div>
              {hackathons.map((win) => {
                const key = `hackathon-${win.name}`;
                const isMobileOpen = mobileExpanded === key;
                return (
                  <div key={win.name}>
                    <button onClick={() => handleClick("hackathon", win.name)} className={`hidden lg:flex ${card} items-start justify-between gap-4`}>
                      <div className="min-w-0">
                        <span className={`font-medium text-[15px] ${dark ? "text-gray-100" : "text-gray-900"}`}>{win.project}</span>
                        <p className={`text-sm mt-0.5 ${dark ? "text-gray-500" : "text-gray-500"}`}>{win.name}</p>
                      </div>
                      <span className={`text-xs shrink-0 mt-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>{win.prize}</span>
                    </button>
                    <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${card} items-start justify-between gap-4`}>
                      <div className="min-w-0">
                        <span className={`font-medium text-[15px] ${dark ? "text-gray-100" : "text-gray-900"}`}>{win.project}</span>
                        <p className={`text-sm mt-0.5 ${dark ? "text-gray-500" : "text-gray-500"}`}>{win.name}</p>
                      </div>
                      <span className={`text-xs shrink-0 mt-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>{win.prize}</span>
                    </button>
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="px-3 pb-3 pt-1">
                        <p className={`text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>{win.detail}</p>
                        <a href={win.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">View on Devpost &rarr;</a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className={`my-8 ${dark ? "border-gray-800" : "border-gray-200"}`} />

          {/* Writing */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className={`text-xs font-medium uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"}`}>Writing</h2>
              <a href="/blog" className={`text-xs transition-colors ${dark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"}`}>View all &rarr;</a>
            </div>
            {posts.length > 0 ? (
              <div>
                {posts.map((post) => {
                  const key = `post-${post.slug}`;
                  const isMobileOpen = mobileExpanded === key;
                  return (
                    <div key={post.slug}>
                      <button onClick={() => handleClick("post", post.slug)} className={`hidden lg:flex ${card} items-baseline justify-between gap-4`}>
                        <span className={`text-[15px] font-medium ${dark ? "text-gray-100" : "text-gray-900"}`}>{post.title}</span>
                        <span className={`text-xs shrink-0 tabular-nums ${dark ? "text-gray-600" : "text-gray-400"}`}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${card} items-baseline justify-between gap-4`}>
                        <span className={`text-[15px] font-medium ${dark ? "text-gray-100" : "text-gray-900"}`}>{post.title}</span>
                        <span className={`text-xs shrink-0 tabular-nums ${dark ? "text-gray-600" : "text-gray-400"}`}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="px-3 pb-3 pt-1">
                          <p className={`text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>{post.description || post.content.slice(0, 200)}</p>
                          <a href={`/blog/${post.slug}`} className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Read more &rarr;</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (<p className={`text-sm ${dark ? "text-gray-600" : "text-gray-400"}`}>Coming soon.</p>)}
          </section>

          <hr className={`my-8 ${dark ? "border-gray-800" : "border-gray-200"}`} />

          {/* Connect */}
          <section>
            <p className={`text-[15px] mb-4 ${dark ? "text-gray-400" : "text-gray-600"}`}>Always happy to grab a coffee or jump on a quick call.</p>
            <a href={calLink} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${dark ? "text-gray-200 hover:text-blue-400" : "text-gray-900 hover:text-blue-600"}`}>
              <CalendarIcon />Grab a coffee &rarr;
            </a>
          </section>

          <footer className={`mt-12 pt-6 border-t ${dark ? "border-gray-800" : "border-gray-200"}`}>
            <p className={`text-xs ${dark ? "text-gray-700" : "text-gray-400"}`}>&copy; 2026 Gabriel Keller</p>
          </footer>
        </div>
      </div>

      {/* Terminal — fixed and centered on right half of screen */}
      <div className={`hidden lg:block fixed left-1/2 top-1/2 -translate-y-1/2 ml-4 w-[calc(50vw-5rem)] h-[80vh] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        terminalState === "open" ? "opacity-100 scale-100" :
        terminalState === "minimized" ? "opacity-0 scale-95 pointer-events-none" :
        "opacity-0 scale-90 pointer-events-none"
      }`}>
        <Terminal
          activeFile={activeFile}
          initialFiles={initialFiles.files}
          initialUrls={initialFiles.urls}
          dark={dark}
          onClose={() => setTerminalState("closed")}
          onMinimize={() => setTerminalState("minimized")}
        />
      </div>

      {/* Reopen terminal button (when minimized or closed) */}
      {terminalState !== "open" && (
        <button
          onClick={() => setTerminalState("open")}
          className={`hidden lg:flex fixed bottom-6 right-6 items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            dark
              ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 shadow-lg shadow-black/20"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-lg shadow-gray-200/50"
          }`}
        >
          <TerminalIcon />
          Open Terminal
        </button>
      )}
    </main>
  );
}
