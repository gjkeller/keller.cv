import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { siteData } from "@/lib/data";
import { getWorkItems, getHackathons } from "@/lib/content";
import { getBlogPosts } from "@/lib/mdx";

const AGENT_DIR = join(process.cwd(), "content/agent");

function readAgentFile(name: string): string {
  const path = join(AGENT_DIR, name);
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8").trim();
}

/* ── Build full context for system prompt ── */

function buildContext(): string {
  const identity = readAgentFile("identity.md");
  const linkedin = readAgentFile("linkedin.md");
  const resume = readAgentFile("resume.md");

  const work = getWorkItems();
  const hackathons = getHackathons();
  const posts = getBlogPosts();

  const sections: string[] = [];

  // Identity & personal info
  sections.push(identity);

  // Work from the website
  if (work.length) {
    sections.push("\n## Website Work Items");
    for (const w of work) {
      sections.push(`### ${w.company} — ${w.role}${w.current ? " (current)" : ""}`);
      if (w.url) sections.push(w.url);
      if (w.detail) sections.push(w.detail);
    }
  }

  // Hackathons from the website
  if (hackathons.length) {
    sections.push("\n## Hackathon Projects");
    for (const h of hackathons) {
      sections.push(`### ${h.project} — ${h.name}, ${h.prize}`);
      if (h.url) sections.push(h.url);
      if (h.detail) sections.push(h.detail);
    }
  }

  // Blog posts (titles + excerpts)
  if (posts.length) {
    sections.push("\n## Blog Posts");
    for (const p of posts) {
      sections.push(`- **${p.title}** (${p.date}) — https://keller.cv/blog/${p.slug}`);
      sections.push(`  ${p.description || p.content.slice(0, 200)}`);
    }
  }

  // LinkedIn details (for deeper context)
  sections.push("\n## LinkedIn Profile Details");
  sections.push(linkedin);

  // Resume details
  sections.push("\n## Resume Details");
  sections.push(resume);

  // Social links
  sections.push("\n## Links");
  for (const l of siteData.socialLinks) {
    sections.push(`- ${l.label}: ${l.url}`);
  }
  sections.push(`- Book a call (15 min): ${siteData.calLink15}`);
  sections.push(`- Book a call (30 min): ${siteData.calLink30}`);

  return sections.join("\n");
}

let cachedContext: string | null = null;

function getContext(): string {
  if (!cachedContext) cachedContext = buildContext();
  return cachedContext;
}

/* ── System prompt ── */

export function getSystemPrompt(timezone?: string): string {
  const personality = readAgentFile("system-prompt.md");
  const tz = timezone || "America/Chicago";
  const now = new Date().toLocaleString("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `${personality}

Current date/time: ${now} (${tz})

<context>
${getContext()}
</context>`;
}

/* ── Rate limiter ── */

const RATE_LIMIT = 100; // messages per window
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

const ipCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}
