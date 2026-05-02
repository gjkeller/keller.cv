import type { ReactElement } from "react";
import { siteData } from "@/lib/data";

// All OG images share a 1200x630 canvas. Layout is built with flexbox plus
// absolute positioning, which next/og (Satori) supports.
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const INK = "#111827";
const KICKER = "#9ca3af";
const CANVAS = "#ffffff";

const FONT_GEIST = "Geist";

// Inter-word gap as a fraction of the font size. Tuned to match Geist's
// natural advance width for sentence-case text.
const WORD_GAP_RATIO = 0.22;

// Compensation applied to words that end with sentence punctuation. Satori
// renders trailing whitespace inside the punctuated word's box and then
// inserts another full-width space after it (vercel/satori#643), producing
// a visible double gap. Shrinking the right margin on the punctuated word
// cancels the overhang. Hyphens are intentionally NOT compensated because
// they sit mid-word with no trailing whitespace.
const PUNCT_OVERHANG_RATIO = 0.13;
const TRAILING_PUNCT_RE = /[.,:;!?]$/;

// Default kicker on blog cards mirrors the canonical handle.
const BLOG_KICKER = `${siteData.handle}/blog`;

type CanvasProps = {
  children: ReactElement | ReactElement[];
};

function OgCanvas({ children }: CanvasProps): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: CANVAS,
        color: INK,
        fontFamily: FONT_GEIST,
      }}
    >
      {children}
    </div>
  );
}

export type HandleOgProps = {
  // The handle string, e.g. "@gjkeller" or "@gjkeller/call".
  handle: string;
  // Visual variant. "home" is the larger top-level handle, "path" is the
  // slightly smaller path-style handle used on subpages like /call.
  variant?: "home" | "path";
};

// Centered handle card used for the homepage and the call page.
export function HandleOg({ handle, variant = "home" }: HandleOgProps): ReactElement {
  const fontSize = variant === "home" ? 124 : 94;

  return (
    <OgCanvas>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            color: INK,
          }}
        >
          {handle}
        </div>
      </div>
    </OgCanvas>
  );
}

export type BlogPostOgProps = {
  title: string;
  // Optional kicker; defaults to the blog handle path (siteData.handle/blog).
  kicker?: string;
};

type TitleStyle = { fontSize: number; lineHeight: number; maxWidth: number };

// Adaptive title sizing so short titles read large while longer titles still
// fit comfortably in the card without crowding. Thresholds assume mixed-case
// sentence text in Geist; pathological all-caps or all-wide-glyph titles may
// overflow at the largest size.
export function blogTitleStyle(title: string): TitleStyle {
  if (title.length <= 18) return { fontSize: 108, lineHeight: 1, maxWidth: 984 };
  if (title.length <= 42) return { fontSize: 92, lineHeight: 1, maxWidth: 1008 };
  return { fontSize: 72, lineHeight: 1.04, maxWidth: 1056 };
}

// Blog post / blog index card: small kicker top-left, title vertically
// centered, no subtitle in the image (subtitle is moved to embed metadata).
export function BlogPostOg({
  title,
  kicker = BLOG_KICKER,
}: BlogPostOgProps): ReactElement {
  const titleStyle = blogTitleStyle(title);

  return (
    <OgCanvas>
      <div
        style={{
          position: "absolute",
          top: 138,
          left: 102,
          display: "flex",
          fontSize: 46,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: KICKER,
        }}
      >
        {kicker}
      </div>

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingLeft: 102,
          paddingRight: 102,
        }}
      >
        {/* Render each word as its own flex item so Satori never has to
            measure across a punctuated word (vercel/satori#643). See
            PUNCT_OVERHANG_RATIO above for why trailing punctuation gets
            a tighter right margin. */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            maxWidth: titleStyle.maxWidth,
            fontSize: titleStyle.fontSize,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: titleStyle.lineHeight,
            color: INK,
          }}
        >
          {title.split(/\s+/).map((word, i, arr) => {
            const isLast = i === arr.length - 1;
            const hasTrailingPunct = TRAILING_PUNCT_RE.test(word);
            const baseGap = titleStyle.fontSize * WORD_GAP_RATIO;
            const compensation = hasTrailingPunct
              ? titleStyle.fontSize * PUNCT_OVERHANG_RATIO
              : 0;
            return (
              <span
                key={i}
                style={{
                  marginRight: isLast ? 0 : baseGap - compensation,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </OgCanvas>
  );
}
