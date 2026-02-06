export interface WorkItem {
  company: string;
  url: string;
  role: string;
  description: string;
  current?: boolean;
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
  pastWork: WorkItem[];
  socialLinks: SocialLink[];
  calLink: string;
  email: string;
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
      current: true,
    },
    {
      company: "Cursor",
      url: "https://cursor.com",
      role: "Campus Lead",
      description: "Establishing a tech coworking space at UT",
      current: true,
    },
    {
      company: "GridMatrix",
      url: "https://gridmatrix.com",
      role: "SWE Intern",
      description: "Building AI for infrastructure",
      current: true,
    },
    {
      company: "Nominal",
      url: "https://nominal.io",
      role: "Incoming SWE Intern",
      description: "Hardware observability suite",
    },
    {
      company: "Texas ACM",
      url: "https://texasacm.org",
      role: "Vice President",
      description: "Growth strategy & sales for UT's largest CS org",
      current: true,
    },
  ],
  pastWork: [
    {
      company: "HackTX 2025",
      url: "https://devpost.com/software/rocket-racer-l1hmn6",
      role: "Winner",
      description: "First place ($4k) — piano tiles game controlled by physical wands",
    },
    {
      company: "RecordHacks",
      url: "https://devpost.com/software/the-beat-box",
      role: "Winner",
      description: "Hackathon winner",
    },
    {
      company: "Paycom",
      url: "https://paycom.com",
      role: "SWE Intern",
      description: "Lead discovery platform for CRM team",
    },
    {
      company: "Cycorp",
      url: "https://cyc.com",
      role: "Intern",
      description: "AI reasoning systems",
    },
    {
      company: "Prelude",
      url: "http://preludeedc.com",
      role: "Intern",
      description: "Clinical data capture",
    },
    {
      company: "Japanese Government Grant",
      url: "",
      role: "Research Author",
      description: "$15k grant for pharmacovigilance study, presented in DC",
    },
    {
      company: "Programming in Practice",
      url: "https://lasapip.com",
      role: "Founder",
      description: "Club for students getting started in SWE",
    },
  ],
  socialLinks: [
    { label: "GitHub", url: "https://github.com/gjkeller" },
    { label: "LinkedIn", url: "https://linkedin.com/in/gjkeller" },
    { label: "X", url: "https://twitter.com/gabrieljkeller" },
    { label: "Devpost", url: "https://devpost.com/gjkeller" },
  ],
  calLink: "mailto:gabrieljameskeller@gmail.com",
  email: "gabrieljameskeller@gmail.com",
};
