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
  // Blog accent — the canonical "favicon blue" tuned per-theme. Used for
  // links on hover, the article endcap, blockquote rules, table headers,
  // syntax highlighting keywords, and the active TOC indicator.
  accent: string;
  accentSoft: string;
  // Code surfaces. `codeBg` is the panel color behind <pre> blocks; the
  // inline tokens style the small `inline code` chips inside paragraphs.
  codeBg: string;
  codeBorder: string;
  inlineCodeBg: string;
  inlineCodeBorder: string;
  inlineCodeText: string;
  // Syntax highlighting palette mapped onto highlight.js classes. Each
  // theme tunes its own values so colors land readably on top of `codeBg`.
  syntaxKeyword: string;
  syntaxString: string;
  syntaxNumber: string;
  syntaxComment: string;
  syntaxFunction: string;
  syntaxClass: string;
  syntaxOperator: string;
  syntaxPunctuation: string;
  syntaxTag: string;
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
    accent: "#2563EB", accentSoft: "rgba(37,99,235,0.08)",
    codeBg: "#F1F5FB", codeBorder: "#DBE5F4",
    inlineCodeBg: "rgba(37,99,235,0.08)", inlineCodeBorder: "rgba(37,99,235,0.18)", inlineCodeText: "#1D4ED8",
    syntaxKeyword: "#1D4ED8", syntaxString: "#B45309", syntaxNumber: "#B45309",
    syntaxComment: "#94A3B8", syntaxFunction: "#1E40AF", syntaxClass: "#0E7490",
    syntaxOperator: "#475569", syntaxPunctuation: "#64748B", syntaxTag: "#1D4ED8",
  },
  {
    name: "dark-blue",
    bg: "#0F172A", text: "#E2E8F0", textDim: "#94A3B8", textMuted: "#64748B",
    border: "#1E293B", cardHoverBg: "#1E293B", cardHoverBorder: "rgba(51,65,85,0.6)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.3), inset -1px -1px 3px rgba(255,255,255,0.03)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.02)",
    termBg: "#0F172A", termBarBg: "#1E293B", termBarBorder: "#334155",
    termText: "#E2E8F0", termDim: "#94A3B8", isDark: true,
    accent: "#60A5FA", accentSoft: "rgba(96,165,250,0.14)",
    codeBg: "#172033", codeBorder: "#243349",
    inlineCodeBg: "rgba(96,165,250,0.14)", inlineCodeBorder: "rgba(96,165,250,0.28)", inlineCodeText: "#93C5FD",
    syntaxKeyword: "#60A5FA", syntaxString: "#FBBF24", syntaxNumber: "#FBBF24",
    syntaxComment: "#64748B", syntaxFunction: "#93C5FD", syntaxClass: "#38BDF8",
    syntaxOperator: "#94A3B8", syntaxPunctuation: "#94A3B8", syntaxTag: "#7DD3FC",
  },
  {
    name: "dark-gray",
    bg: "#18181B", text: "#F4F4F5", textDim: "#A1A1AA", textMuted: "#71717A",
    border: "#27272A", cardHoverBg: "#27272A", cardHoverBorder: "rgba(63,63,70,0.6)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.3), inset -1px -1px 3px rgba(255,255,255,0.03)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.02)",
    termBg: "#18181B", termBarBg: "#27272A", termBarBorder: "#3F3F46",
    termText: "#F4F4F5", termDim: "#A1A1AA", isDark: true,
    accent: "#60A5FA", accentSoft: "rgba(96,165,250,0.12)",
    codeBg: "#1F1F23", codeBorder: "#2E2E33",
    inlineCodeBg: "rgba(96,165,250,0.12)", inlineCodeBorder: "rgba(96,165,250,0.26)", inlineCodeText: "#93C5FD",
    syntaxKeyword: "#60A5FA", syntaxString: "#FBBF24", syntaxNumber: "#FBBF24",
    syntaxComment: "#71717A", syntaxFunction: "#93C5FD", syntaxClass: "#38BDF8",
    syntaxOperator: "#A1A1AA", syntaxPunctuation: "#A1A1AA", syntaxTag: "#7DD3FC",
  },
  {
    name: "warm",
    bg: "#F5F0EB", text: "#1C1917", textDim: "#78716C", textMuted: "#A8A29E",
    border: "#E7E5E4", cardHoverBg: "#EDE8E3", cardHoverBorder: "rgba(214,211,209,0.6)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.06), inset -1px -1px 3px rgba(255,255,255,0.7)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.08), inset -1px -1px 3px rgba(255,255,255,0.6)",
    termBg: "#FAF8F5", termBarBg: "#F0EDE8", termBarBorder: "#E7E5E4",
    termText: "#1C1917", termDim: "#78716C", isDark: false,
    accent: "#2563EB", accentSoft: "rgba(37,99,235,0.07)",
    codeBg: "#EFE9E2", codeBorder: "#DDD5CB",
    inlineCodeBg: "rgba(37,99,235,0.07)", inlineCodeBorder: "rgba(37,99,235,0.18)", inlineCodeText: "#1D4ED8",
    syntaxKeyword: "#1D4ED8", syntaxString: "#B45309", syntaxNumber: "#B45309",
    syntaxComment: "#A8A29E", syntaxFunction: "#1E40AF", syntaxClass: "#0E7490",
    syntaxOperator: "#78716C", syntaxPunctuation: "#A8A29E", syntaxTag: "#1D4ED8",
  },
  {
    name: "midnight",
    bg: "#020617", text: "#CBD5E1", textDim: "#64748B", textMuted: "#475569",
    border: "#0F172A", cardHoverBg: "#0F172A", cardHoverBorder: "rgba(30,41,59,0.8)",
    cardShadow: "inset 2px 2px 6px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.02)",
    cardActiveShadow: "inset 3px 3px 8px rgba(0,0,0,0.6), inset -1px -1px 3px rgba(255,255,255,0.01)",
    termBg: "#020617", termBarBg: "#0F172A", termBarBorder: "#1E293B",
    termText: "#CBD5E1", termDim: "#64748B", isDark: true,
    accent: "#60A5FA", accentSoft: "rgba(96,165,250,0.14)",
    codeBg: "#0A1429", codeBorder: "#142036",
    inlineCodeBg: "rgba(96,165,250,0.14)", inlineCodeBorder: "rgba(96,165,250,0.28)", inlineCodeText: "#93C5FD",
    syntaxKeyword: "#60A5FA", syntaxString: "#FBBF24", syntaxNumber: "#FBBF24",
    syntaxComment: "#475569", syntaxFunction: "#93C5FD", syntaxClass: "#38BDF8",
    syntaxOperator: "#64748B", syntaxPunctuation: "#64748B", syntaxTag: "#7DD3FC",
  },
];

export const THEME_NAMES = THEMES.map((t) => t.name);

/** Resolve "auto" to a concrete theme based on system preference */
export function resolveAutoTheme(prefersDark: boolean): Theme {
  return prefersDark
    ? THEMES.find((t) => t.name === "midnight")!
    : THEMES.find((t) => t.name === "light")!;
}
