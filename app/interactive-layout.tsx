"use client";

import { useState, useCallback } from "react";
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

/* Skeuomorphic ghost card */
function cardClasses(isActive: boolean) {
  if (isActive) {
    return "w-full text-left -mx-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 bg-white border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] scale-[1.01]";
  }
  return "w-full text-left -mx-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:bg-white hover:border-gray-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:scale-[1.008] active:scale-[0.997] active:shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(0,0,0,0.04)]";
}

export function InteractiveLayout({
  socialLinks, calLink, name, tagline, bio, currentWork, hackathons, posts,
}: Props) {
  const [activeFile, setActiveFile] = useState<{ command: string; content: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const handleClick = useCallback((type: string, id: string) => {
    const key = `${type}-${id}`;
    if (activeId === key) {
      setActiveId(null);
      return;
    }
    setActiveId(key);
    const file = getTerminalFile(type, id, currentWork, hackathons, posts);
    if (file) setActiveFile(file);
  }, [activeId, currentWork, hackathons, posts]);

  const toggleMobile = useCallback((key: string) => {
    setMobileExpanded((prev) => (prev === key ? null : key));
  }, []);

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1200px] mx-auto px-8 py-16 sm:py-24 lg:flex lg:gap-12 lg:items-start lg:justify-center">
        {/* Left column — always here */}
        <div className="lg:w-[480px] lg:shrink-0">
          {/* Header */}
          <header>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
                <p className="text-sm text-gray-500 mt-1.5">{tagline}</p>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {socialLinks.filter((l) => socialIcons[l.label]).map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-700 transition-colors" aria-label={link.label}>
                    {socialIcons[link.label]}
                  </a>
                ))}
              </div>
            </div>
            <p className="text-[15px] text-gray-600 mt-6 leading-relaxed">{bio}</p>
          </header>

          <hr className="border-gray-200 my-8" />

          {/* Currently */}
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Currently</h2>
            <div>
              {currentWork.map((item) => {
                const key = `work-${item.company}`;
                const isActive = activeId === key;
                const isMobileOpen = mobileExpanded === key;
                return (
                  <div key={item.company}>
                    <button onClick={() => handleClick("work", item.company)} className={`hidden lg:flex ${cardClasses(isActive)} items-start justify-between gap-4`}>
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 text-[15px]">{item.company}</span>
                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 mt-1">{item.role}</span>
                    </button>
                    <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClasses(isMobileOpen)} items-start justify-between gap-4`}>
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 text-[15px]">{item.company}</span>
                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 mt-1">{item.role}</span>
                    </button>
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="px-3 pb-3 pt-1">
                        <p className="text-sm text-gray-600 leading-relaxed">{item.detail}</p>
                        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">Visit &rarr;</a>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="border-gray-200 my-8" />

          {/* Hackathons */}
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Hackathons</h2>
            <div>
              {hackathons.map((win) => {
                const key = `hackathon-${win.name}`;
                const isActive = activeId === key;
                const isMobileOpen = mobileExpanded === key;
                return (
                  <div key={win.name}>
                    <button onClick={() => handleClick("hackathon", win.name)} className={`hidden lg:flex ${cardClasses(isActive)} items-start justify-between gap-4`}>
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 text-[15px]">{win.project}</span>
                        <p className="text-sm text-gray-500 mt-0.5">{win.name}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 mt-1">{win.prize}</span>
                    </button>
                    <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClasses(isMobileOpen)} items-start justify-between gap-4`}>
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 text-[15px]">{win.project}</span>
                        <p className="text-sm text-gray-500 mt-0.5">{win.name}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 mt-1">{win.prize}</span>
                    </button>
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="px-3 pb-3 pt-1">
                        <p className="text-sm text-gray-600 leading-relaxed">{win.detail}</p>
                        <a href={win.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">View on Devpost &rarr;</a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="border-gray-200 my-8" />

          {/* Writing */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400">Writing</h2>
              <a href="/blog" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">View all &rarr;</a>
            </div>
            {posts.length > 0 ? (
              <div>
                {posts.map((post) => {
                  const key = `post-${post.slug}`;
                  const isActive = activeId === key;
                  const isMobileOpen = mobileExpanded === key;
                  return (
                    <div key={post.slug}>
                      <button onClick={() => handleClick("post", post.slug)} className={`hidden lg:flex ${cardClasses(isActive)} items-baseline justify-between gap-4`}>
                        <span className="text-gray-900 text-[15px] font-medium">{post.title}</span>
                        <span className="text-gray-400 text-xs shrink-0 tabular-nums">{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClasses(isMobileOpen)} items-baseline justify-between gap-4`}>
                        <span className="text-gray-900 text-[15px] font-medium">{post.title}</span>
                        <span className="text-gray-400 text-xs shrink-0 tabular-nums">{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="px-3 pb-3 pt-1">
                          <p className="text-sm text-gray-600 leading-relaxed">{post.description || post.content.slice(0, 200)}</p>
                          <a href={`/blog/${post.slug}`} className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">Read more &rarr;</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (<p className="text-gray-400 text-sm">Coming soon.</p>)}
          </section>

          <hr className="border-gray-200 my-8" />

          {/* Connect */}
          <section>
            <p className="text-[15px] text-gray-600 mb-4">Always happy to grab a coffee or jump on a quick call.</p>
            <a href={calLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
              <CalendarIcon />Grab a coffee &rarr;
            </a>
          </section>

          <footer className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-gray-400 text-xs">&copy; 2026 Gabriel Keller</p>
          </footer>
        </div>

        {/* Right column — terminal, always visible on desktop */}
        <div className="hidden lg:block flex-1 min-w-0 sticky top-8 h-[calc(100vh-4rem)] self-start">
          <Terminal activeFile={activeFile} />
        </div>
      </div>
    </main>
  );
}
