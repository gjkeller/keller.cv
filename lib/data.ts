export interface WorkItem {
  company: string;
  url: string;
  role: string;
  description: string;
  detail: string;
  image?: string;
  current?: boolean;
}

export interface HackathonWin {
  name: string;
  prize: string;
  project: string;
  url: string;
  detail: string;
  image?: string;
}

export interface Partner {
  name: string;
  logo: string;
  tier: "platinum" | "gold" | "silver";
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteData {
  name: string;
  tagline: string;
  bio: string;
  work: WorkItem[];
  hackathons: HackathonWin[];
  socialLinks: SocialLink[];
  calLink15: string;
  calLink30: string;
  acmSales: {
    detail: string;
    partners: Partner[];
  };
}

export const siteData: SiteData = {
  name: "Gabriel Keller",
  tagline: "CS @ UT Austin · Building agent infrastructure",
  bio: "I'm a CS student at UT Austin, currently reinventing agentic infrastructure at Agent Operations Lab. I started coding at 12 with Minecraft plugins and have been hooked ever since.",
  work: [
    {
      company: "Agent Operations Lab",
      url: "https://agentops.sh",
      role: "Cofounder",
      description: "Reinventing agent infrastructure",
      detail: "Building the observability and developer tools layer for AI agents. AgentOps provides session replays, cost tracking, and failure detection so teams can actually understand what their agents are doing in production. We're rethinking how developers build, test, and monitor agentic systems from the ground up.",
      image: "/images/agentops.png",
      current: true,
    },
    {
      company: "Cursor",
      url: "https://cursor.com",
      role: "Campus Lead",
      description: "Establishing a tech coworking space at UT",
      detail: "Leading Cursor's presence at UT Austin by building a coworking community for student developers. Organizing build sessions, hackathons, and getting students hands-on with AI-native development tooling. The goal is to make UT one of the most productive campuses for builders.",
      image: "/images/cursor.svg",
      current: true,
    },
    {
      company: "GridMatrix",
      url: "https://gridmatrix.com",
      role: "SWE Intern",
      description: "Building AI for infrastructure",
      detail: "Working on AI-powered infrastructure monitoring at GridMatrix. Building systems that use computer vision and sensor data to help cities understand and manage their physical infrastructure in real-time.",
      image: "/images/gridmatrix.png",
      current: true,
    },
    {
      company: "Nominal",
      url: "https://nominal.io",
      role: "Incoming SWE Intern",
      description: "Hardware observability suite",
      detail: "Joining Nominal for Summer 2026 to work on hardware observability tooling. Nominal builds the platform that aerospace and hardware teams use to analyze telemetry data from rockets, satellites, and other complex systems.",
      image: "/images/nominal.png",
    },
    {
      company: "Texas ACM",
      url: "https://texasacm.org",
      role: "Vice President",
      description: "Growth strategy & sales for UT's largest CS org",
      detail: "Running growth and sponsorship strategy for Texas ACM, UT Austin's largest computer science organization. As head of sales, 2.5x'd yearly sponsorship revenue and raised a total of $45,000 from corporate partners. Managing outreach to companies, organizing events that connect students with industry, and scaling the org's reach across campus.",
      image: "/images/texasacm.png",
      current: true,
    },
  ],
  hackathons: [
    {
      name: "HackTX 2025",
      prize: "1st Place — $4,000",
      project: "AstroDoodle.party",
      url: "https://devpost.com/software/rocket-racer-l1hmn6",
      detail: "Built a piano tiles-style rhythm game controlled by physical wands in 24 hours at HackTX 2025. Players wave wands to hit notes in time with music, using real-time motion tracking. Won first place and the $4,000 grand prize. Built entirely with Cursor.",
      image: "/images/astrodoodle.png",
    },
    {
      name: "RecordHacks 2025",
      prize: "Winner",
      project: "The Beat Box",
      url: "https://devpost.com/software/the-beat-box",
      detail: "Built The Beat Box at RecordHacks 2025 — a 3D-printed physical device that turns hand gestures into music. We designed and printed the enclosure, wired up sensors, and wrote the firmware to translate motion into MIDI beats in real time. The twist: it moderately tazes users that don't play the notes right.",
      image: "/images/beatbox.png",
    },
  ],
  socialLinks: [
    { label: "GitHub", url: "https://github.com/gjkeller" },
    { label: "LinkedIn", url: "https://linkedin.com/in/gjkeller" },
    { label: "X", url: "https://twitter.com/gabrieljkeller" },
    { label: "Devpost", url: "https://devpost.com/gjkeller" },
  ],
  calLink15: "https://calendar.notion.so/meet/gjkeller/15m",
  calLink30: "https://calendar.notion.so/meet/gjkeller/30m",
  acmSales: {
    detail: "As head of sales for Texas ACM, I 2.5x'd our yearly sponsorship revenue and raised a total of $45,000 from corporate partners.",
    partners: [
      { name: "Atlassian", logo: "/images/partners/atlassian.png", tier: "platinum" },
      { name: "Accenture", logo: "/images/partners/accenture.png", tier: "gold" },
      { name: "FUTO", logo: "/images/partners/futo.svg", tier: "gold" },
      { name: "Paycom", logo: "/images/partners/paycom.png", tier: "gold" },
      { name: "PwC", logo: "/images/partners/pwc.png", tier: "gold" },
      { name: "Dell", logo: "/images/partners/dell.png", tier: "silver" },
    ],
  },
};
