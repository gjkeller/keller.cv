"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Theme } from "@/lib/themes";
import type { TocHeading } from "@/lib/extract-headings";

export type { TocHeading };

/* ── Inline TOC (collapsible, two-column, dividing lines) ── */
export function InlineTOC({ headings, theme }: { headings: TocHeading[]; theme: Theme }) {
  const [open, setOpen] = useState(false);

  if (headings.length === 0) return null;

  const mid = Math.ceil(headings.length / 2);
  const left = headings.slice(0, mid);
  const right = headings.slice(mid);

  return (
    <div className="mt-6 mb-12">
      <hr style={{ borderColor: theme.border }} />
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
      >
        <span className="text-sm font-medium" style={{ color: theme.textDim }}>
          Table of Contents
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: theme.textMuted }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 pb-3 text-[13px] leading-relaxed">
          <div>
            {left.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(h.id);
                  if (!element) return;
                  element.scrollIntoView({ behavior: "smooth" });
                  window.history.replaceState(null, "", `#${h.id}`);
                }}
                className={`block py-0.5 transition-colors hover:opacity-70 ${h.level === 3 ? "pl-4" : ""}`}
                style={{ color: theme.textDim }}
              >
                {h.text}
              </a>
            ))}
          </div>
          <div>
            {right.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(h.id);
                  if (!element) return;
                  element.scrollIntoView({ behavior: "smooth" });
                  window.history.replaceState(null, "", `#${h.id}`);
                }}
                className={`block py-0.5 transition-colors hover:opacity-70 ${h.level === 3 ? "pl-4" : ""}`}
                style={{ color: theme.textDim }}
              >
                {h.text}
              </a>
            ))}
          </div>
        </div>
      </div>
      <hr style={{ borderColor: theme.border }} />
    </div>
  );
}

/* ── Sidebar TOC (sticky, scrollable, tracks active section) ── */
interface Props {
  headings: TocHeading[];
  theme: Theme;
}

export function TableOfContents({ headings, theme }: Props) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  const updateFromScroll = useCallback(() => {
    const scrollY = window.scrollY;
    let closest: string | null = null;
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el && el.offsetTop <= scrollY + 120) {
        closest = h.id;
      }
    }
    if (closest) setActiveId(closest);
  }, [headings]);

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const visibleSet = new Set<string>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSet.add(entry.target.id);
          } else {
            visibleSet.delete(entry.target.id);
          }
        }
        for (const h of headings) {
          if (visibleSet.has(h.id)) {
            setActiveId(h.id);
            return;
          }
        }
        updateFromScroll();
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    // Also listen for scroll to catch sections between headings
    window.addEventListener("scroll", updateFromScroll, { passive: true });

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", updateFromScroll);
    };
  }, [headings, updateFromScroll]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block" aria-label="Table of contents">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin">
        <p
          className="text-[10px] font-medium uppercase tracking-wider mb-2"
          style={{ color: theme.textMuted }}
        >
          On this page
        </p>
        <ul className="space-y-0.5 text-[12px] leading-snug">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(h.id);
                  if (!element) return;
                  element.scrollIntoView({ behavior: "smooth" });
                  window.history.replaceState(null, "", `#${h.id}`);
                  setActiveId(h.id);
                }}
                className="block py-0.5 transition-colors duration-150 hover:opacity-80"
                style={{
                  color: activeId === h.id ? theme.text : theme.textMuted,
                  fontWeight: activeId === h.id ? 500 : 400,
                  borderLeft: `2px solid ${activeId === h.id ? (theme.isDark ? "#60a5fa" : "#2563eb") : "transparent"}`,
                  paddingLeft: h.level === 3 ? "1rem" : "0.5rem",
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
