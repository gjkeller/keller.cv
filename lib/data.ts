export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteData {
  name: string;
  // Canonical handle used as the visual identity across OG cards and copy.
  // Note: @gabrieljkeller on X, @gjkeller everywhere else.
  handle: string;
  tagline: string;
  bio: string;
  socialLinks: SocialLink[];
  calLink15: string;
  calLink30: string;
}

export const siteData: SiteData = {
  name: "Gabriel Keller",
  handle: "@gjkeller",
  tagline: "CS @ UT Austin · Building agent infrastructure",
  bio: "I'm a CS student at UT Austin. I started coding at 12 with Minecraft plugins and have been hooked ever since.",
  socialLinks: [
    { label: "GitHub", url: "https://github.com/gjkeller" },
    { label: "LinkedIn", url: "https://linkedin.com/in/gjkeller" },
    { label: "X", url: "https://twitter.com/gabrieljkeller" },
    { label: "Devpost", url: "https://devpost.com/gjkeller" },
  ],
  calLink15: "gjkeller/call",
  calLink30: "gjkeller/call",
};
