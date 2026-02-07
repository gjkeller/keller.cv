import { siteData } from "@/lib/data";
import { getWorkItems, getHackathons } from "@/lib/content";
import { getBlogPosts } from "@/lib/mdx";

/** Strip image markdown and custom template tags (e.g. {{logos:...}}) from body text. */
function cleanBody(body: string): string {
  return body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // ![alt](src)
    .replace(/\{\{[^}]*\}\}/g, "")        // {{logos:...}}
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function GET() {
  const work = getWorkItems();
  const hackathons = getHackathons();
  const posts = getBlogPosts();

  const sections: string[] = [
    `# ${siteData.name}`,
    "",
    `> ${siteData.tagline}`,
    "",
    siteData.bio,
    "",
    "## Links",
    ...siteData.socialLinks.map((l) => `- ${l.label}: ${l.url}`),
  ];

  // Work
  sections.push("", "## Work");
  for (const w of work) {
    sections.push(
      "",
      `### ${w.company}`,
      `**${w.role}**${w.current ? " (current)" : ""}  `,
      w.url,
      "",
      cleanBody(w.detail),
    );
  }

  // Hackathon projects
  sections.push("", "## Hackathon Projects");
  for (const h of hackathons) {
    sections.push(
      "",
      `### ${h.project}`,
      `${h.name} · ${h.prize}  `,
      h.url,
      "",
      cleanBody(h.detail),
    );
  }

  // Blog posts — full content
  sections.push("", "## Blog");
  for (const p of posts) {
    sections.push(
      "",
      `### ${p.title}`,
      `*${new Date(p.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*  `,
      `https://keller.cv/blog/${p.slug}`,
      "",
      p.content,
    );
  }

  return new Response(sections.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
