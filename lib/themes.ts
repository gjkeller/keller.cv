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

export const THEME_NAMES = THEMES.map((t) => t.name);

/** Resolve "auto" to a concrete theme based on system preference */
export function resolveAutoTheme(prefersDark: boolean): Theme {
  return prefersDark
    ? THEMES.find((t) => t.name === "midnight")!
    : THEMES.find((t) => t.name === "light")!;
}
