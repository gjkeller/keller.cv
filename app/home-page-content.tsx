import { siteData } from "@/lib/data";
import { getWorkItems, getHackathons, getAllTerminalFiles } from "@/lib/content";
import { getBlogPosts } from "@/lib/mdx";
import { InteractiveLayout } from "./interactive-layout";

type InitialSectionIntent = "home" | "blog";
type InitialCallIntent = "none" | "15m" | "30m";

function buildJsonLd() {
  const workItems = getWorkItems().filter((w) => w.current);

  const person = {
    "@type": "Person",
    name: siteData.name,
    url: "https://keller.cv",
    description: siteData.bio,
    jobTitle: workItems[0]?.role,
    worksFor: workItems.map((w) => ({
      "@type": "Organization",
      name: w.company,
      url: w.url,
    })),
    sameAs: siteData.socialLinks.map((l) => l.url),
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "The University of Texas at Austin",
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "WebSite",
        url: "https://keller.cv",
        name: siteData.name,
        description: siteData.tagline,
        author: { "@type": "Person", name: siteData.name },
      },
    ],
  };
}

export function HomePageContent({
  initialSectionIntent = "home",
  initialCallIntent = "none",
}: {
  initialSectionIntent?: InitialSectionIntent;
  initialCallIntent?: InitialCallIntent;
}) {
  const workItems = getWorkItems();
  const hackathons = getHackathons();
  const posts = getBlogPosts();
  const terminal = getAllTerminalFiles();
  const jsonLd = buildJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InteractiveLayout
        name={siteData.name}
        tagline={siteData.tagline}
        bio={siteData.bio}
        socialLinks={siteData.socialLinks}
        calLink15={siteData.calLink15}
        calLink30={siteData.calLink30}
        workItems={workItems}
        hackathons={hackathons}
        posts={posts.map((p) => ({
          slug: p.slug,
          title: p.title,
          date: p.date,
          description: p.description,
          content: p.content,
        }))}
        terminalFiles={terminal.files}
        terminalUrls={terminal.urls}
        initialSectionIntent={initialSectionIntent}
        initialCallIntent={initialCallIntent}
      />
    </>
  );
}
