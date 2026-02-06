"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WorkItem, HackathonWin } from "@/lib/data";
import { GithubIcon, LinkedinIcon, XIcon, DevpostIcon, CalendarIcon, XCloseIcon } from "./icons";

type SelectedItem =
  | { type: "work"; id: string }
  | { type: "hackathon"; id: string }
  | { type: "post"; id: string }
  | null;

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

function getDetailContent(
  selected: SelectedItem,
  currentWork: WorkItem[],
  hackathons: HackathonWin[],
  posts: Props["posts"],
) {
  if (!selected) return null;

  if (selected.type === "work") {
    const item = currentWork.find((w) => w.company === selected.id);
    if (!item) return null;
    return {
      title: item.company,
      subtitle: item.role,
      url: item.url,
      body: item.detail,
    };
  }
  if (selected.type === "hackathon") {
    const item = hackathons.find((h) => h.name === selected.id);
    if (!item) return null;
    return {
      title: item.project,
      subtitle: `${item.name} · ${item.prize}`,
      url: item.url,
      body: item.detail,
    };
  }
  if (selected.type === "post") {
    const post = posts.find((p) => p.slug === selected.id);
    if (!post) return null;
    return {
      title: post.title,
      subtitle: new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      url: `/blog/${post.slug}`,
      body: post.description || post.content.slice(0, 500),
    };
  }
  return null;
}

export function InteractiveLayout({
  socialLinks, calLink, name, tagline, bio, currentWork, hackathons, posts,
}: Props) {
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = selected !== null;

  const close = useCallback(() => setSelected(null), []);

  const toggleItem = useCallback((item: SelectedItem) => {
    setSelected((prev) => {
      if (prev && item && prev.type === item.type && prev.id === item.id) return null;
      return item;
    });
  }, []);

  const toggleMobile = useCallback((key: string) => {
    setMobileExpanded((prev) => (prev === key ? null : key));
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  // Click outside panel
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const clickedButton = (e.target as HTMLElement).closest("[data-item-button]");
        if (!clickedButton) close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, close]);

  const detail = getDetailContent(selected, currentWork, hackathons, posts);

  return (
    <main className="min-h-screen bg-white relative overflow-x-hidden">
      {/* Content column */}
      <div
        className="px-6 py-20 sm:py-28 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxWidth: isOpen ? "32rem" : "36rem",
          marginLeft: isOpen ? "clamp(2rem, 5vw, 4rem)" : "auto",
          marginRight: isOpen ? "auto" : "auto",
        }}
      >
        {/* Header */}
        <header>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
              <p className="text-sm text-gray-500 mt-1.5">{tagline}</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {socialLinks.filter((l) => socialIcons[l.label]).map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 transition-colors" aria-label={link.label}>
                  {socialIcons[link.label]}
                </a>
              ))}
            </div>
          </div>
          <p className="text-[15px] text-gray-600 mt-6 leading-relaxed">{bio}</p>
        </header>

        <hr className="border-gray-200 my-10" />

        {/* Currently */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Currently</h2>
          <div className="space-y-0">
            {currentWork.map((item) => {
              const itemKey = `work-${item.company}`;
              const isActive = selected?.type === "work" && selected.id === item.company;
              const isMobileOpen = mobileExpanded === itemKey;
              return (
                <div key={item.company}>
                  {/* Desktop: ghost card button */}
                  <button
                    data-item-button
                    onClick={() => toggleItem({ type: "work", id: item.company })}
                    className={`hidden lg:flex w-full text-left -mx-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer items-start justify-between gap-6 ${
                      isActive ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 text-[15px]">{item.company}</span>
                      <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mt-1">{item.role}</span>
                  </button>
                  {/* Mobile: accordion button */}
                  <button
                    onClick={() => toggleMobile(itemKey)}
                    className={`lg:hidden flex w-full text-left -mx-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer items-start justify-between gap-6 ${
                      isMobileOpen ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 text-[15px]">{item.company}</span>
                      <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mt-1">{item.role}</span>
                  </button>
                  {/* Mobile accordion content */}
                  <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-3 pb-3 pt-1">
                      <p className="text-sm text-gray-600 leading-relaxed">{item.detail}</p>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                          Visit {item.company} &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <hr className="border-gray-200 my-10" />

        {/* Hackathons */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Hackathons</h2>
          <div className="space-y-0">
            {hackathons.map((win) => {
              const itemKey = `hack-${win.name}`;
              const isActive = selected?.type === "hackathon" && selected.id === win.name;
              const isMobileOpen = mobileExpanded === itemKey;
              return (
                <div key={win.name}>
                  <button
                    data-item-button
                    onClick={() => toggleItem({ type: "hackathon", id: win.name })}
                    className={`hidden lg:flex w-full text-left -mx-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer items-start justify-between gap-6 ${
                      isActive ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 text-[15px]">{win.project}</span>
                      <p className="text-sm text-gray-500 mt-0.5">{win.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mt-1">{win.prize}</span>
                  </button>
                  <button
                    onClick={() => toggleMobile(itemKey)}
                    className={`lg:hidden flex w-full text-left -mx-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer items-start justify-between gap-6 ${
                      isMobileOpen ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 text-[15px]">{win.project}</span>
                      <p className="text-sm text-gray-500 mt-0.5">{win.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mt-1">{win.prize}</span>
                  </button>
                  <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-3 pb-3 pt-1">
                      <p className="text-sm text-gray-600 leading-relaxed">{win.detail}</p>
                      <a href={win.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                        View on Devpost &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <hr className="border-gray-200 my-10" />

        {/* Writing */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400">Writing</h2>
            <a href="/blog" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">View all &rarr;</a>
          </div>
          {posts.length > 0 ? (
            <div className="space-y-0">
              {posts.map((post) => {
                const itemKey = `post-${post.slug}`;
                const isActive = selected?.type === "post" && selected.id === post.slug;
                const isMobileOpen = mobileExpanded === itemKey;
                return (
                  <div key={post.slug}>
                    <button
                      data-item-button
                      onClick={() => toggleItem({ type: "post", id: post.slug })}
                      className={`hidden lg:flex w-full text-left -mx-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer items-baseline justify-between gap-4 ${
                        isActive ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-gray-900 text-[15px] font-medium">{post.title}</span>
                      <span className="text-gray-400 text-xs shrink-0 tabular-nums">
                        {new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </button>
                    <button
                      onClick={() => toggleMobile(itemKey)}
                      className={`lg:hidden flex w-full text-left -mx-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer items-baseline justify-between gap-4 ${
                        isMobileOpen ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-gray-900 text-[15px] font-medium">{post.title}</span>
                      <span className="text-gray-400 text-xs shrink-0 tabular-nums">
                        {new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </button>
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="px-3 pb-3 pt-1">
                        <p className="text-sm text-gray-600 leading-relaxed">{post.description || post.content.slice(0, 200)}</p>
                        <a href={`/blog/${post.slug}`} className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                          Read more &rarr;
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Coming soon.</p>
          )}
        </section>

        <hr className="border-gray-200 my-10" />

        {/* Connect */}
        <section>
          <p className="text-[15px] text-gray-600 mb-4">Always happy to grab a coffee or jump on a quick call.</p>
          <a href={calLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
            <CalendarIcon />Grab a coffee &rarr;
          </a>
        </section>

        <footer className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-gray-300 text-xs">&copy; 2026 Gabriel Keller</p>
        </footer>
      </div>

      {/* Detail panel — desktop only */}
      <div
        ref={panelRef}
        className={`hidden lg:block fixed top-0 right-0 h-screen w-1/2 bg-white border-l border-gray-200 shadow-[-4px_0_24px_rgba(0,0,0,0.04)] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {detail && (
          <div className="p-10 max-w-lg">
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <XCloseIcon />
            </button>

            <h2 className="text-xl font-semibold text-gray-900">{detail.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{detail.subtitle}</p>

            <p className="text-[15px] text-gray-600 leading-relaxed mt-6">{detail.body}</p>

            {detail.url && (
              <a
                href={detail.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-6"
              >
                Visit &rarr;
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
