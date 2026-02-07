import React from "react";

/* ── Style config ── */

export interface MdStyles {
  /** Color for headings (#, ##) */
  headingColor: string;
  /** Color for bold/emphasized text */
  textColor: string;
  /** Color for body text, list items */
  dimColor: string;
  /** Whether dark mode is active (affects logo filter) */
  isDark: boolean;
}

/* ── Linkify ── */

export function linkify(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s)]+|\/[a-zA-Z][^\s)*]*)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, j) => {
    if (!urlRegex.test(part)) return <span key={j}>{part}</span>;
    urlRegex.lastIndex = 0;
    const isExternal = part.startsWith("http");
    return (
      <a
        key={j}
        href={part}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        onClick={(e) => e.stopPropagation()}
        className="text-blue-500 hover:text-blue-400 hover:underline transition-colors"
      >{part}</a>
    );
  });
}

/* ── Parse image attributes: {width=80} or {size=md} ── */

const SIZE_PRESETS: Record<string, number> = { sm: 14, md: 32, lg: 64, xl: 128 };

function parseImageAttrs(raw: string): { width?: number; height?: number } {
  const wMatch = raw.match(/width=(\d+)/);
  const hMatch = raw.match(/height=(\d+)/);
  const sMatch = raw.match(/size=(sm|md|lg|xl)/);
  const w = wMatch ? Number(wMatch[1]) : sMatch ? SIZE_PRESETS[sMatch[1]] : undefined;
  const h = hMatch ? Number(hMatch[1]) : undefined;
  return { width: w, height: h };
}

/* ── Render markdown text to React nodes ── */

export function renderMarkdown(text: string, styles: MdStyles): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    // Inline image with optional attrs: ![alt](src){attrs}
    const imgAttr = line.match(/^!\[([^\]]*)\]\(([^)]+)\)(\{[^}]+\})?$/);
    if (imgAttr) {
      const attrs = imgAttr[3] ? parseImageAttrs(imgAttr[3]) : {};
      const w = attrs.width ?? 14;
      const h = attrs.height;
      return (
        <span key={i} className="inline-flex items-center">
          <img
            src={imgAttr[2]}
            alt={imgAttr[1]}
            className="rounded-sm object-contain inline-block"
            style={{ width: `${w}px`, height: h ? `${h}px` : `${w}px` }}
          />
        </span>
      );
    }

    // Heading with inline image: # Text ![alt](src)
    const h1Img = line.match(/^# (.+?) !\[([^\]]*)\]\(([^)]+)\)$/);
    if (h1Img) {
      return (
        <div key={i} className="font-semibold text-sm flex items-center gap-1.5" style={{ color: styles.headingColor }}>
          <img src={h1Img[3]} alt={h1Img[2]} className="w-[14px] h-[14px] rounded-sm object-contain" />
          {linkify(h1Img[1])}
        </div>
      );
    }

    // Partner logos: {{logos:/path1.svg,/path2.svg,...}}
    const logosMatch = line.match(/^\{\{logos:(.+)\}\}$/);
    if (logosMatch) {
      const paths = logosMatch[1].split(",");
      return (
        <div key={i} className="flex flex-wrap items-center gap-3 my-1">
          {paths.map((p, j) => (
            <img
              key={j}
              src={p.trim()}
              alt=""
              className="h-3.5 w-auto object-contain opacity-60"
              style={{ filter: styles.isDark ? "brightness(0) invert(0.7)" : undefined }}
            />
          ))}
        </div>
      );
    }

    // Headers
    if (line.startsWith("# ")) return <div key={i} className="font-semibold text-sm" style={{ color: styles.headingColor }}>{linkify(line.slice(2))}</div>;
    if (line.startsWith("## ")) return <div key={i} className="font-medium text-sm mt-3" style={{ color: styles.headingColor }}>{linkify(line.slice(3))}</div>;

    // Bold line
    if (line.startsWith("**") && line.endsWith("**")) return <div key={i} className="font-medium text-[13px]" style={{ color: styles.textColor }}>{linkify(line.slice(2, -2))}</div>;

    // Arrows and list items
    if (line.trimStart().startsWith("→")) return <div key={i} className="text-[13px]" style={{ color: styles.dimColor }}>{linkify(line)}</div>;
    if (line.trimStart().startsWith("-") || line.trimStart().startsWith("•")) return <div key={i} className="text-[13px]" style={{ color: styles.dimColor }}>{linkify(line)}</div>;

    // Empty line
    if (line.trim() === "") return <div key={i} className="h-2" />;

    // Default text
    return <div key={i} className="text-[13px] leading-relaxed" style={{ color: styles.dimColor }}>{linkify(line)}</div>;
  });
}
