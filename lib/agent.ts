import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { tool, zodSchema } from "ai";
import { z } from "zod";
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
    sections.push("\n## Projects");
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
  const ycAddon = readAgentFile("yc-addon.md");
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

  const instructionBlock = ycAddon
    ? `${personality}

<yc_addon>
${ycAddon}
</yc_addon>`
    : personality;

  return `${instructionBlock}

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

/* ── Slack notification tool ── */

const NOTIFY_LIMIT = 10; // max notifications per IP per window
const notifyCounts = new Map<string, { count: number; resetAt: number }>();

function canNotify(ip: string): boolean {
  const now = Date.now();
  const entry = notifyCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    notifyCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= NOTIFY_LIMIT) return false;
  entry.count++;
  return true;
}

export function getAgentTools(ip: string) {
  return {
    notify_gabe: tool({
      description:
        "Send a message to Gabe from a website visitor. Use this whenever someone " +
        "wants to leave a message, share contact info, or say something to Gabe. " +
        "Anonymous messages are fine -- contact info is optional.",
      inputSchema: zodSchema(
        z.object({
          message: z
            .string()
            .describe(
              "The full message to send Gabe. Write naturally -- include the visitor's " +
              "name and contact info if they shared any, plus what they want or said.",
            ),
        }),
      ),
      execute: async ({ message }) => {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) return { success: false, reason: "not configured" };

        if (!canNotify(ip)) {
          return { success: false, reason: "notification limit reached for this session" };
        }

        const text = `*keller.cv* 👋\n${message}`;

        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          return { success: res.ok };
        } catch {
          return { success: false, reason: "request failed" };
        }
      },
    }),
  };
}
