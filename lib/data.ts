export interface WorkItem {
  company: string;
  url: string;
  role: string;
  description: string;
  detail: string;
  current?: boolean;
}

export interface HackathonWin {
  name: string;
  prize: string;
  project: string;
  url: string;
  detail: string;
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
  calLink: string;
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
      current: true,
    },
    {
      company: "Cursor",
      url: "https://cursor.com",
      role: "Campus Lead",
      description: "Establishing a tech coworking space at UT",
      detail: "Leading Cursor's presence at UT Austin by building a coworking community for student developers. Organizing build sessions, hackathons, and getting students hands-on with AI-native development tooling. The goal is to make UT one of the most productive campuses for builders.",
      current: true,
    },
    {
      company: "GridMatrix",
      url: "https://gridmatrix.com",
      role: "SWE Intern",
      description: "Building AI for infrastructure",
      detail: "Working on AI-powered infrastructure monitoring at GridMatrix. Building systems that use computer vision and sensor data to help cities understand and manage their physical infrastructure in real-time.",
      current: true,
    },
    {
      company: "Nominal",
      url: "https://nominal.io",
      role: "Incoming SWE Intern",
      description: "Hardware observability suite",
      detail: "Joining Nominal for Summer 2026 to work on hardware observability tooling. Nominal builds the platform that aerospace and hardware teams use to analyze telemetry data from rockets, satellites, and other complex systems.",
    },
    {
      company: "Texas ACM",
      url: "https://texasacm.org",
      role: "Vice President",
      description: "Growth strategy & sales for UT's largest CS org",
      detail: "Running growth and sponsorship strategy for Texas ACM, UT Austin's largest computer science organization. Managing outreach to companies, organizing events that connect students with industry, and scaling the org's reach across campus.",
      current: true,
    },
  ],
  hackathons: [
    {
      name: "HackTX 2025",
      prize: "1st Place — $4,000",
      project: "Rocket Racer",
      url: "https://devpost.com/software/rocket-racer-l1hmn6",
      detail: "Built a piano tiles-style rhythm game controlled by physical wands in 24 hours at HackTX 2025. Players wave wands to hit notes in time with music, using real-time motion tracking. Won first place and the $4,000 grand prize. Built entirely with Cursor.",
    },
    {
      name: "RecordHacks",
      prize: "Winner",
      project: "The Beat Box",
      url: "https://devpost.com/software/the-beat-box",
      detail: "Created The Beat Box at RecordHacks — a music creation tool that lets you compose beats through an interactive visual interface. Focused on making music production accessible to people with no prior experience.",
    },
  ],
  socialLinks: [
    { label: "GitHub", url: "https://github.com/gjkeller" },
    { label: "LinkedIn", url: "https://linkedin.com/in/gjkeller" },
    { label: "X", url: "https://twitter.com/gabrieljkeller" },
    { label: "Devpost", url: "https://devpost.com/gjkeller" },
  ],
  calLink: "https://cal.com/gjkeller",
};
