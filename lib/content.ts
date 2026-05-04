import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

const TERMINAL_DIR = join(process.cwd(), "content/terminal");

/* ── Types ── */

export interface WorkItem {
  slug: string;
  company: string;
  url: string;
  role: string;
  description: string;
  detail: string;
  body: string;
  image?: string;
  current?: boolean;
  order: number;
}

export interface HackathonWin {
  slug: string;
  name: string;
  prize: string;
  project: string;
  url: string;
  detail: string;
  body: string;
  image?: string;
  order: number;
}

/* ── Helpers ── */

/**
 * Extract the detail text from a terminal markdown body.
 * Body structure is always: heading block \n\n metadata block \n\n detail...
 * We skip the first two sections (heading + metadata/url) and return the rest.
 */
function extractDetail(body: string): string {
  const sections = body.split("\n\n");
  return sections.slice(2).join("\n\n");
}

function readMarkdownFiles(dir: string): { slug: string; data: Record<string, unknown>; body: string }[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = readFileSync(join(dir, f), "utf-8");
      const { data, content } = matter(raw);
      return { slug: f.replace(/\.md$/, ""), data, body: content.trimEnd() };
    });
}

/* ── Public API ── */

export function getWorkItems(): WorkItem[] {
  const files = readMarkdownFiles(join(TERMINAL_DIR, "work"));
  return files
    .map(({ slug, data, body }) => ({
      slug,
      company: data.company as string,
      url: data.url as string,
      role: data.role as string,
      description: data.description as string,
      detail: extractDetail(body),
      body,
      image: data.image as string | undefined,
      current: data.current as boolean | undefined,
      order: (data.order as number) ?? 99,
    }))
    .sort((a, b) => a.order - b.order);
}

export function getHackathons(): HackathonWin[] {
  const files = readMarkdownFiles(join(TERMINAL_DIR, "projects"));
  return files
    .map(({ slug, data, body }) => ({
      slug,
      name: data.name as string,
      prize: data.prize as string,
      project: data.project as string,
      url: data.url as string,
      detail: extractDetail(body),
      body,
      image: data.image as string | undefined,
      order: (data.order as number) ?? 99,
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Build the full terminal file map: merges static terminal files, work, and project markdown bodies.
 * Keys use the same paths the terminal virtual filesystem expects.
 */
export function getAllTerminalFiles(): { files: Record<string, string>; urls: Record<string, string> } {
  const files: Record<string, string> = {};
  const urls: Record<string, string> = {};

  // Static root-level terminal files (welcome.md, about.md, .secret, etc.)
  if (existsSync(TERMINAL_DIR)) {
    for (const name of readdirSync(TERMINAL_DIR)) {
      const full = join(TERMINAL_DIR, name);
      if (statSync(full).isFile()) {
        files[name] = readFileSync(full, "utf-8").trimEnd();
      }
    }
  }

  // Static file URLs
  urls["welcome.md"] = "https://keller.cv";
  urls["about.md"] = "https://github.com/gjkeller";

  // Work items → root-level slug.md
  const workFiles = readMarkdownFiles(join(TERMINAL_DIR, "work"));
  for (const { slug, data, body } of workFiles) {
    files[`${slug}.md`] = body;
    if (data.url) urls[`${slug}.md`] = data.url as string;
  }

  // Hackathon projects → projects/slug.md
  const projFiles = readMarkdownFiles(join(TERMINAL_DIR, "projects"));
  for (const { slug, data, body } of projFiles) {
    files[`projects/${slug}.md`] = body;
    if (data.url) urls[`projects/${slug}.md`] = data.url as string;
  }

  // Static blog/ files (e.g. README.md). Blog post entries themselves are
  // synthesised from the MDX content in app/interactive-layout.tsx; this
  // path covers the static intro/READMEs that live in content/terminal/blog/.
  const blogDir = join(TERMINAL_DIR, "blog");
  if (existsSync(blogDir)) {
    for (const name of readdirSync(blogDir)) {
      const full = join(blogDir, name);
      if (statSync(full).isFile() && name.endsWith(".md")) {
        const raw = readFileSync(full, "utf-8");
        const { content } = matter(raw);
        files[`blog/${name}`] = content.trimEnd();
      }
    }
  }

  return { files, urls };
}
